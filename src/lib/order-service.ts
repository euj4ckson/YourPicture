import { OrderStatus, Prisma } from "@prisma/client";

import { siteConfig } from "@/config/site";
import { env } from "@/lib/env";
import { prisma } from "@/lib/prisma";
import { makeToken } from "@/lib/security";

function getDownloadRules() {
  const hours = Number.isFinite(env.DOWNLOAD_LINK_MAX_HOURS)
    ? env.DOWNLOAD_LINK_MAX_HOURS
    : siteConfig.commerce.downloadExpiresHours;
  const maxUses = Number.isFinite(env.DOWNLOAD_MAX_USES)
    ? env.DOWNLOAD_MAX_USES
    : siteConfig.commerce.downloadLimit;

  return {
    expiresAt: new Date(Date.now() + Math.max(1, hours) * 60 * 60 * 1000),
    maxUses: Math.max(1, maxUses),
  };
}

export async function ensureDownloadToken(
  orderId: string,
  tx: Prisma.TransactionClient = prisma,
) {
  const now = new Date();
  const existing = await tx.downloadToken.findFirst({
    where: {
      orderId,
      expiresAt: { gt: now },
      remainingDownloads: { gt: 0 },
    },
    orderBy: { createdAt: "desc" },
  });

  if (existing) {
    return existing;
  }

  const rules = getDownloadRules();
  return tx.downloadToken.create({
    data: {
      orderId,
      token: makeToken(24),
      expiresAt: rules.expiresAt,
      remainingDownloads: rules.maxUses,
    },
  });
}

export async function markOrderPaid(orderId: string, providerRaw?: unknown) {
  return prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({
      where: { id: orderId },
      include: { customer: true, photo: true },
    });

    if (!order) {
      throw new Error("Pedido nao encontrado.");
    }

    if (order.status !== OrderStatus.PAID) {
      const data: Prisma.OrderUpdateInput = {
        status: OrderStatus.PAID,
        paidAt: new Date(),
      };

      if (providerRaw) {
        data.providerRaw = providerRaw as Prisma.InputJsonValue;
      }

      await tx.order.update({
        where: { id: orderId },
        data,
      });
    }

    const downloadToken = await ensureDownloadToken(orderId, tx);

    return {
      order,
      downloadToken,
    };
  });
}
