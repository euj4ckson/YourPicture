import { OrderStatus, Prisma } from "@prisma/client";
import { NextResponse } from "next/server";

import { buildDownloadApiUrl, sendDownloadReadyEmail } from "@/lib/email";
import { getPaymentProvider } from "@/lib/payments";
import { ensureDownloadToken } from "@/lib/order-service";
import { prisma } from "@/lib/prisma";
import { validateWebhook } from "@/lib/security/webhook";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const rawBody = await request.text();
  if (!validateWebhook(request.headers, rawBody)) {
    return NextResponse.json({ error: "Webhook não autorizado." }, { status: 401 });
  }

  let payload: unknown;
  try {
    payload = rawBody ? JSON.parse(rawBody) : {};
  } catch {
    return NextResponse.json({ error: "JSON inválido." }, { status: 400 });
  }

  const provider = getPaymentProvider();
  const events = provider.parseWebhook(payload);

  if (events.length === 0) {
    return NextResponse.json({ ok: true, processed: 0 });
  }

  let processed = 0;

  for (const event of events) {
    try {
      const transition = await prisma.$transaction(async (tx) => {
        const existingEvent = await tx.paymentWebhookEvent.findUnique({
          where: { providerEventId: event.providerEventId },
        });

        if (existingEvent) {
          return null;
        }

        const order = await tx.order.findFirst({
          where: {
            OR: [
              event.providerCorrelationId
                ? { providerCorrelationId: event.providerCorrelationId }
                : undefined,
              event.providerChargeId ? { providerChargeId: event.providerChargeId } : undefined,
            ].filter(Boolean) as Prisma.OrderWhereInput[],
          },
          include: { customer: true, photo: true },
        });

        await tx.paymentWebhookEvent.create({
          data: {
            orderId: order?.id || null,
            provider: "openpix",
            eventType: event.type,
            providerEventId: event.providerEventId,
            payload: event.raw as Prisma.InputJsonValue,
          },
        });

        if (!order) {
          return null;
        }

        if (event.paid && order.status !== OrderStatus.PAID) {
          await tx.order.update({
            where: { id: order.id },
            data: {
              status: OrderStatus.PAID,
              paidAt: new Date(),
              providerRaw: event.raw as Prisma.InputJsonValue,
            },
          });

          const token = await ensureDownloadToken(order.id, tx);
          return {
            sendEmail: true,
            customerName: order.customer.name,
            customerEmail: order.customer.email,
            photoTitle: order.photo.title,
            token: token.token,
            expiresAt: token.expiresAt,
          };
        }

        if (event.canceled && order.status === OrderStatus.PENDING) {
          await tx.order.update({
            where: { id: order.id },
            data: {
              status: OrderStatus.CANCELED,
              canceledAt: new Date(),
              providerRaw: event.raw as Prisma.InputJsonValue,
            },
          });
        }

        return null;
      });

      if (transition?.sendEmail) {
        await sendDownloadReadyEmail({
          customerName: transition.customerName,
          customerEmail: transition.customerEmail,
          photoTitle: transition.photoTitle,
          downloadUrl: buildDownloadApiUrl(transition.token),
          expiresAt: transition.expiresAt,
        });
      }

      processed += 1;
    } catch (error) {
      console.error("[OPENPIX WEBHOOK] Falha ao processar evento", event.providerEventId, error);
    }
  }

  return NextResponse.json({ ok: true, processed });
}
