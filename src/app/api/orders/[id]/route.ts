import { OrderStatus } from "@prisma/client";
import { NextResponse } from "next/server";

import { ensureDownloadToken } from "@/lib/order-service";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      customer: true,
      photo: true,
      downloadTokens: {
        where: {
          expiresAt: { gt: new Date() },
          remainingDownloads: { gt: 0 },
        },
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
  });

  if (!order) {
    return NextResponse.json({ error: "Pedido não encontrado." }, { status: 404 });
  }

  let token = order.downloadTokens[0];
  if (order.status === OrderStatus.PAID && !token) {
    token = await ensureDownloadToken(order.id);
  }

  return NextResponse.json({
    id: order.id,
    status: order.status,
    amountCents: order.amountCents,
    createdAt: order.createdAt,
    paidAt: order.paidAt,
    customerName: order.customer.name,
    customerEmail: order.customer.email,
    photo: {
      title: order.photo.title,
      slug: order.photo.slug,
      previewUrl: order.photo.previewUrl,
    },
    download: token
      ? {
          token: token.token,
          expiresAt: token.expiresAt,
          remainingDownloads: token.remainingDownloads,
        }
      : null,
  });
}
