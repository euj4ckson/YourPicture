import { Resend } from "resend";

import { siteConfig } from "@/config/site";
import { env, getAppUrl } from "@/lib/env";

const resend = env.RESEND_API_KEY ? new Resend(env.RESEND_API_KEY) : null;

function ensureMailer() {
  if (!resend) {
    throw new Error("Resend nao configurado. Defina RESEND_API_KEY.");
  }
}

export async function sendDownloadReadyEmail({
  customerName,
  customerEmail,
  photoTitle,
  downloadUrl,
  expiresAt,
}: {
  customerName: string;
  customerEmail: string;
  photoTitle: string;
  downloadUrl: string;
  expiresAt: Date;
}) {
  ensureMailer();

  const expires = new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(expiresAt);

  await resend!.emails.send({
    from: env.RESEND_FROM_EMAIL,
    to: customerEmail,
    subject: `Seu download esta liberado: ${photoTitle}`,
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.4;">
        <h2>${siteConfig.brand.name}</h2>
        <p>Oi ${customerName}, seu pagamento foi confirmado.</p>
        <p>Foto: <strong>${photoTitle}</strong></p>
        <p>Link de download (expira em ${expires}):</p>
        <p><a href="${downloadUrl}">${downloadUrl}</a></p>
        <p>Se voce nao conseguir baixar, responda este e-mail.</p>
      </div>
    `,
  });
}

export async function sendContactNotification({
  name,
  email,
  subject,
  message,
}: {
  name: string;
  email: string;
  subject?: string;
  message: string;
}) {
  ensureMailer();

  await resend!.emails.send({
    from: env.RESEND_FROM_EMAIL,
    to: siteConfig.links.email,
    replyTo: email,
    subject: subject ? `[Contato] ${subject}` : "[Contato] Nova mensagem",
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.4;">
        <h3>Nova mensagem de contato</h3>
        <p><strong>Nome:</strong> ${name}</p>
        <p><strong>E-mail:</strong> ${email}</p>
        <p><strong>Mensagem:</strong></p>
        <p>${message.replace(/\n/g, "<br />")}</p>
      </div>
    `,
  });
}

export function buildOrderPageUrl(orderId: string) {
  return `${getAppUrl()}/order/${orderId}`;
}

export function buildDownloadApiUrl(token: string) {
  return `${getAppUrl()}/api/download/${token}`;
}
