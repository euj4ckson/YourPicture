import { OrderStatus, PhotoStatus, Prisma } from "@prisma/client";
import { NextResponse } from "next/server";

import { buildDownloadApiUrl, sendDownloadReadyEmail } from "@/lib/email";
import { siteConfig } from "@/config/site";
import { env } from "@/lib/env";
import { getPaymentProvider } from "@/lib/payments";
import { markOrderPaid } from "@/lib/order-service";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";
import { createOrderSchema } from "@/lib/validation";

export const runtime = "nodejs";

function getClientIp(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for");
  return forwarded?.split(",")[0]?.trim() || "unknown";
}

export async function POST(request: Request) {
  try {
    const ip = getClientIp(request);
    const limitResult = rateLimit({
      key: `order:${ip}`,
      limit: 6,
      windowMs: 60 * 1000,
    });

    if (!limitResult.allowed) {
      return NextResponse.json(
        { error: "Muitas tentativas. Aguarde e tente novamente." },
        { status: 429 },
      );
    }

    const payload = await request.json();
    const parsed = createOrderSchema.safeParse(payload);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Dados inválidos.", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const photo = await prisma.photo.findUnique({
      where: { id: parsed.data.photoId, status: PhotoStatus.PUBLISHED },
    });

    if (!photo) {
      return NextResponse.json({ error: "Foto não encontrada." }, { status: 404 });
    }

    const customer = await prisma.customer.upsert({
      where: { email: parsed.data.customerEmail.toLowerCase() },
      update: {
        name: parsed.data.customerName,
        whatsapp: parsed.data.customerWhatsapp || null,
      },
      create: {
        name: parsed.data.customerName,
        email: parsed.data.customerEmail.toLowerCase(),
        whatsapp: parsed.data.customerWhatsapp || null,
      },
    });

    const order = await prisma.order.create({
      data: {
        photoId: photo.id,
        customerId: customer.id,
        status: OrderStatus.PENDING,
        amountCents: photo.priceCents,
        provider: env.PAYMENT_PROVIDER,
      },
    });

    const provider = getPaymentProvider();
    const charge = await provider.createCharge({
      orderId: order.id,
      amountCents: photo.priceCents,
      customerName: customer.name,
      customerEmail: customer.email,
      customerWhatsapp: customer.whatsapp || undefined,
      description: `Compra da foto "${photo.title}"`,
      expiresInSeconds: siteConfig.commerce.pixExpiresMinutes * 60,
    });

    const updatedOrder = await prisma.order.update({
      where: { id: order.id },
      data: {
        provider: charge.provider,
        providerChargeId: charge.providerChargeId,
        providerCorrelationId: charge.providerCorrelationId,
        providerRaw: charge.raw as Prisma.InputJsonValue,
        status: charge.status,
      },
    });

    if (charge.status === "PAID") {
      const { downloadToken } = await markOrderPaid(updatedOrder.id, charge.raw);
      await sendDownloadReadyEmail({
        customerName: customer.name,
        customerEmail: customer.email,
        photoTitle: photo.title,
        downloadUrl: buildDownloadApiUrl(downloadToken.token),
        expiresAt: downloadToken.expiresAt,
      });
    }

    return NextResponse.json({
      orderId: updatedOrder.id,
      status: updatedOrder.status,
      brCode: charge.brCode,
      qrCodeImage: charge.qrCodeImage,
      paymentLinkUrl: charge.paymentLinkUrl,
      expiresAt: charge.expiresAt,
    });
  } catch (error) {
    console.error("[POST /api/orders]", error);
    return NextResponse.json(
      { error: "Não foi possível criar o pedido no momento." },
      { status: 500 },
    );
  }
}
