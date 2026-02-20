import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { OrderStatusPanel } from "@/components/checkout/order-status-panel";
import { ensureDownloadToken } from "@/lib/order-service";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Status do Pedido",
  description: "Acompanhe o status do pagamento e faça o download da foto.",
};

export const dynamic = "force-dynamic";

export default async function OrderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
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
        orderBy: {
          createdAt: "desc",
        },
        take: 1,
      },
    },
  });

  if (!order) {
    notFound();
  }

  let token = order.downloadTokens[0] || null;
  if (order.status === "PAID" && !token) {
    token = await ensureDownloadToken(order.id);
  }

  return (
    <div className="mx-auto max-w-2xl">
      <OrderStatusPanel
        initialOrder={{
          id: order.id,
          status: order.status,
          amountCents: order.amountCents,
          createdAt: order.createdAt.toISOString(),
          paidAt: order.paidAt?.toISOString() ?? null,
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
                expiresAt: token.expiresAt.toISOString(),
                remainingDownloads: token.remainingDownloads,
              }
            : null,
        }}
      />
    </div>
  );
}
