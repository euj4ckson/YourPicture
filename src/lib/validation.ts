import { z } from "zod";

export const createOrderSchema = z.object({
  photoId: z.string().min(1),
  customerName: z.string().min(2).max(120),
  customerEmail: z.string().email(),
  customerWhatsapp: z.string().max(30).optional().or(z.literal("")),
});

export const contactSchema = z.object({
  name: z.string().min(2).max(120),
  email: z.string().email(),
  subject: z.string().max(160).optional().or(z.literal("")),
  message: z.string().min(10).max(3000),
});

export const adminAlbumSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(2),
  slug: z.string().min(2),
  description: z.string().optional(),
  isPublished: z.boolean().default(true),
});

export const adminPhotoUpdateSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(2),
  slug: z.string().min(2),
  description: z.string().optional(),
  tags: z.string().optional(),
  priceCents: z.coerce.number().int().positive(),
  albumId: z.string().optional().or(z.literal("")),
  status: z.enum(["PUBLISHED", "HIDDEN"]),
});
