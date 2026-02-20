import crypto from "node:crypto";

import { env } from "@/lib/env";
import { safeEqual } from "@/lib/security";

function stripBearer(value: string) {
  return value.replace(/^Bearer\s+/i, "").trim();
}

export function validateWebhook(headers: Headers, rawBody: string) {
  const configuredSecret = env.WEBHOOK_SECRET;
  if (!configuredSecret) {
    return false;
  }

  const authorizationHeader =
    headers.get("authorization") || headers.get("x-webhook-secret") || headers.get("x-openpix-authorization");
  const authorizationValid =
    !!authorizationHeader && safeEqual(stripBearer(authorizationHeader), configuredSecret);

  const signatureHeader =
    headers.get("x-openpix-signature") || headers.get("x-signature") || headers.get("x-hub-signature-256");
  const signatureCandidate = signatureHeader?.replace(/^sha256=/i, "").trim();
  const hmac = crypto.createHmac("sha256", configuredSecret).update(rawBody).digest("hex");
  const signatureValid = !!signatureCandidate && safeEqual(signatureCandidate, hmac);

  return authorizationValid || signatureValid;
}
