import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth-options";
import { buildDownloadApiUrl, sendDownloadReadyEmail } from "@/lib/email";
import { markOrderPaid } from "@/lib/order-service";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "admin") {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const { id } = await params;
  const result = await markOrderPaid(id, { source: "manual_admin" });

  await sendDownloadReadyEmail({
    customerName: result.order.customer.name,
    customerEmail: result.order.customer.email,
    photoTitle: result.order.photo.title,
    downloadUrl: buildDownloadApiUrl(result.downloadToken.token),
    expiresAt: result.downloadToken.expiresAt,
  });

  await prisma.order.update({
    where: { id },
    data: {
      providerRaw: {
        source: "manual_admin",
        at: new Date().toISOString(),
      },
    },
  });

  return NextResponse.json({ ok: true });
}
