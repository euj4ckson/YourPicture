import { OrderStatus } from "@prisma/client";
import { NextResponse } from "next/server";

import { makePrivateDownloadUrl } from "@/lib/cloudinary";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  const now = new Date();

  const tokenRecord = await prisma.downloadToken.findUnique({
    where: { token },
    include: { order: { include: { photo: true } } },
  });

  if (!tokenRecord) {
    return NextResponse.json({ error: "Link inválido." }, { status: 404 });
  }

  if (
    tokenRecord.order.status !== OrderStatus.PAID ||
    tokenRecord.expiresAt <= now ||
    tokenRecord.remainingDownloads <= 0
  ) {
    return NextResponse.json(
      { error: "Link expirado ou limite de downloads atingido." },
      { status: 410 },
    );
  }

  const updated = await prisma.downloadToken.updateMany({
    where: {
      id: tokenRecord.id,
      expiresAt: { gt: now },
      remainingDownloads: { gt: 0 },
    },
    data: {
      remainingDownloads: {
        decrement: 1,
      },
      lastUsedAt: now,
    },
  });

  if (updated.count === 0) {
    return NextResponse.json(
      { error: "Link expirado ou limite de downloads atingido." },
      { status: 410 },
    );
  }

  const signedUrl = makePrivateDownloadUrl({
    publicId: tokenRecord.order.photo.originalPublicId,
    format: tokenRecord.order.photo.originalFormat,
    expiresAt: new Date(now.getTime() + 5 * 60 * 1000),
  });

  return NextResponse.redirect(signedUrl, { status: 302 });
}
