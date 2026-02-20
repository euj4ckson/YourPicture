import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  DATABASE_URL: z.string().default(""),
  NEXTAUTH_SECRET: z.string().default(""),
  NEXTAUTH_URL: z.string().default("http://localhost:3000"),
  APP_URL: z.string().optional(),
  ADMIN_EMAIL: z.string().email().default("jacksonduardo6@gmail.com"),
  ADMIN_PASSWORD_HASH: z.string().default(""),
  RESEND_API_KEY: z.string().default(""),
  RESEND_FROM_EMAIL: z.string().default("jacksonduardo6@gmail.com"),
  CLOUDINARY_CLOUD_NAME: z.string().default(""),
  CLOUDINARY_API_KEY: z.string().default(""),
  CLOUDINARY_API_SECRET: z.string().default(""),
  WATERMARK_TEXT: z.string().optional(),
  WATERMARK_LOGO_PUBLIC_ID: z.string().optional(),
  PAYMENT_PROVIDER: z.enum(["openpix", "mercadopago", "efi"]).default("openpix"),
  OPENPIX_APP_ID: z.string().default(""),
  OPENPIX_BASE_URL: z.string().default("https://api.openpix.com.br"),
  WEBHOOK_SECRET: z.string().default(""),
  DOWNLOAD_LINK_MAX_HOURS: z
    .string()
    .optional()
    .transform((value) => Number(value ?? "48")),
  DOWNLOAD_MAX_USES: z
    .string()
    .optional()
    .transform((value) => Number(value ?? "5")),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("Falha ao validar variáveis de ambiente.", parsed.error.flatten());
}

export const env = parsed.success
  ? parsed.data
  : envSchema.parse({
      NODE_ENV: process.env.NODE_ENV,
      DATABASE_URL: process.env.DATABASE_URL,
      NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
      NEXTAUTH_URL: process.env.NEXTAUTH_URL,
      APP_URL: process.env.APP_URL,
      ADMIN_EMAIL: process.env.ADMIN_EMAIL,
      ADMIN_PASSWORD_HASH: process.env.ADMIN_PASSWORD_HASH,
      RESEND_API_KEY: process.env.RESEND_API_KEY,
      RESEND_FROM_EMAIL: process.env.RESEND_FROM_EMAIL,
      CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,
      CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY,
      CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET,
      WATERMARK_TEXT: process.env.WATERMARK_TEXT,
      WATERMARK_LOGO_PUBLIC_ID: process.env.WATERMARK_LOGO_PUBLIC_ID,
      PAYMENT_PROVIDER: process.env.PAYMENT_PROVIDER,
      OPENPIX_APP_ID: process.env.OPENPIX_APP_ID,
      OPENPIX_BASE_URL: process.env.OPENPIX_BASE_URL,
      WEBHOOK_SECRET: process.env.WEBHOOK_SECRET,
      DOWNLOAD_LINK_MAX_HOURS: process.env.DOWNLOAD_LINK_MAX_HOURS,
      DOWNLOAD_MAX_USES: process.env.DOWNLOAD_MAX_USES,
    });

export function getAppUrl() {
  return env.APP_URL || env.NEXTAUTH_URL || "http://localhost:3000";
}
