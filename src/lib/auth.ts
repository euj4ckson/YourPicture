import bcrypt from "bcryptjs";

import { env } from "@/lib/env";

export function isAdminEmail(email?: string | null) {
  return !!email && email.toLowerCase() === env.ADMIN_EMAIL.toLowerCase();
}

export async function verifyAdminPassword(password: string) {
  if (!env.ADMIN_PASSWORD_HASH) {
    return false;
  }

  return bcrypt.compare(password, env.ADMIN_PASSWORD_HASH);
}
