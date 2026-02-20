import { NextResponse } from "next/server";

import { sendContactNotification } from "@/lib/email";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";
import { contactSchema } from "@/lib/validation";

function getClientIp(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for");
  return forwarded?.split(",")[0]?.trim() || "unknown";
}

export async function POST(request: Request) {
  try {
    const ip = getClientIp(request);
    const limitResult = rateLimit({
      key: `contact:${ip}`,
      limit: 5,
      windowMs: 60 * 60 * 1000,
    });

    if (!limitResult.allowed) {
      return NextResponse.json(
        { error: "Muitas mensagens em pouco tempo. Tente novamente mais tarde." },
        { status: 429 },
      );
    }

    const payload = await request.json();
    const parsed = contactSchema.safeParse(payload);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Dados inválidos.", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    await prisma.contactMessage.create({
      data: {
        name: parsed.data.name,
        email: parsed.data.email.toLowerCase(),
        subject: parsed.data.subject || null,
        message: parsed.data.message,
      },
    });

    try {
      await sendContactNotification({
        name: parsed.data.name,
        email: parsed.data.email,
        subject: parsed.data.subject || undefined,
        message: parsed.data.message,
      });
    } catch (mailError) {
      console.error("[POST /api/contact] Resend indisponivel.", mailError);
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[POST /api/contact]", error);
    return NextResponse.json(
      { error: "Não foi possível enviar sua mensagem agora." },
      { status: 500 },
    );
  }
}
