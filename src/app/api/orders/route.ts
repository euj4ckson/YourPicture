import { OrderStatus, PhotoStatus, Prisma } from "@prisma/client";
import { NextResponse } from "next/server";

import { siteConfig } from "@/config/site";
import { buildDownloadApiUrl, sendDownloadReadyEmail } from "@/lib/email";
import { env } from "@/lib/env";
import { markOrderPaid } from "@/lib/order-service";
import { getPaymentProvider } from "@/lib/payments";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";
import { createOrderSchema } from "@/lib/validation";

export const runtime = "nodejs";

function getClientIp(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for");
  return forwarded?.split(",")[0]?.trim() || "unknown";
}

function mapOrderCreationError(error: unknown) {
  if (!(error instanceof Error)) {
    return {
      status: 500,
      message: "Nao foi possivel criar o pedido no momento.",
    };
  }

  const message = error.message;

  if (message.includes("OPENPIX_APP_ID nao configurado")) {
    return {
      status: 503,
      message: "Pix indisponivel: configure OPENPIX_APP_ID no servidor.",
    };
  }

  if (message.includes("ainda nao foi implementado")) {
    return {
      status: 503,
      message: "Provedor de pagamento ainda nao implementado.",
    };
  }

  if (message.includes("OPENPIX_HTTP_401") || message.includes("OPENPIX_HTTP_403")) {
    return {
      status: 502,
      message: "Falha de autenticacao com OpenPix. Verifique OPENPIX_APP_ID.",
    };
  }

  if (message.includes("OPENPIX_HTTP_400") || message.includes("OPENPIX_HTTP_422")) {
    return {
      status: 400,
      message: "Dados invalidos para gerar Pix. Confira nome, e-mail e WhatsApp.",
    };
  }

  if (message.includes("OPENPIX_HTTP_")) {
    return {
      status: 502,
      message: "Servico Pix indisponivel no momento. Tente novamente em instantes.",
    };
  }

  if (message.toLowerCase().includes("fetch failed")) {
    return {
      status: 502,
      message: "Falha de comunicacao com o provedor Pix. Tente novamente.",
    };
  }

  return {
    status: 500,
    message: "Nao foi possivel criar o pedido no momento.",
  };
}

export async function POST(request: Request) {
  let createdOrderId: string | null = null;

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
        { error: "Dados invalidos.", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const photo = await prisma.photo.findUnique({
      where: { id: parsed.data.photoId, status: PhotoStatus.PUBLISHED },
    });

    if (!photo) {
      return NextResponse.json({ error: "Foto nao encontrada." }, { status: 404 });
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
    createdOrderId = order.id;

    const provider = getPaymentProvider();
    let charge: Awaited<ReturnType<typeof provider.createCharge>>;

    try {
      charge = await provider.createCharge({
        orderId: order.id,
        amountCents: photo.priceCents,
        customerName: customer.name,
        customerEmail: customer.email,
        customerWhatsapp: customer.whatsapp || undefined,
        description: `Compra da foto "${photo.title}"`,
        expiresInSeconds: siteConfig.commerce.pixExpiresMinutes * 60,
      });
    } catch (providerError) {
      await prisma.order.update({
        where: { id: order.id },
        data: {
          status: OrderStatus.CANCELED,
          providerRaw: {
            providerError: providerError instanceof Error ? providerError.message : "unknown",
          } as Prisma.InputJsonValue,
        },
      });

      throw providerError;
    }

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
    const mapped = mapOrderCreationError(error);

    if (createdOrderId) {
      console.error("[POST /api/orders]", {
        orderId: createdOrderId,
        message: error instanceof Error ? error.message : String(error),
      });
    } else {
      console.error("[POST /api/orders]", error);
    }

    const debug =
      env.NODE_ENV === "production" || !(error instanceof Error) ? undefined : error.message;

    return NextResponse.json(
      {
        error: mapped.message,
        ...(debug ? { debug } : {}),
      },
      { status: mapped.status },
    );
  }
}
