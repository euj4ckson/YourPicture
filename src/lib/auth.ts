import bcrypt from "bcryptjs";

import { env } from "@/lib/env";

function normalizeSecretValue(value?: string | null) {
  return (value || "").trim().replace(/^['"]|['"]$/g, "");
}

export function isAdminEmail(email?: string | null) {
  const normalizedInput = normalizeSecretValue(email).toLowerCase();
  const normalizedAdmin = normalizeSecretValue(env.ADMIN_EMAIL).toLowerCase();

  return !!normalizedInput && normalizedInput === normalizedAdmin;
}

export async function verifyAdminPassword(password: string) {
  const normalizedPlainPassword = normalizeSecretValue(env.ADMIN_PASSWORD);
  if (normalizedPlainPassword) {
    return password === normalizedPlainPassword;
  }

  const normalizedHash = normalizeSecretValue(env.ADMIN_PASSWORD_HASH);
  if (!normalizedHash) {
    return false;
  }

  return bcrypt.compare(password, normalizedHash);
}
