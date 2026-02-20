"use server";

import { OrderStatus, PhotoStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth-options";
import { uploadPhotoVariants } from "@/lib/cloudinary";
import { buildDownloadApiUrl, sendDownloadReadyEmail } from "@/lib/email";
import { ensureDownloadToken } from "@/lib/order-service";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/slug";

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "admin") {
    throw new Error("Nao autorizado.");
  }
}

function parseBoolean(value: FormDataEntryValue | null) {
  return value === "true" || value === "on" || value === "1";
}

export async function upsertAlbumAction(formData: FormData) {
  await requireAdmin();

  const id = String(formData.get("id") || "");
  const title = String(formData.get("title") || "").trim();
  const slugValue = slugify(String(formData.get("slug") || title));
  const description = String(formData.get("description") || "").trim();
  const isPublished = parseBoolean(formData.get("isPublished"));

  if (!title || !slugValue) {
    throw new Error("Titulo e slug sao obrigatorios.");
  }

  if (id) {
    await prisma.album.update({
      where: { id },
      data: {
        title,
        slug: slugValue,
        description: description || null,
        isPublished,
      },
    });
  } else {
    await prisma.album.create({
      data: {
        title,
        slug: slugValue,
        description: description || null,
        isPublished,
      },
    });
  }

  revalidatePath("/admin");
  revalidatePath("/portfolio");
}

export async function deleteAlbumAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") || "");
  if (!id) {
    throw new Error("Album invalido.");
  }

  await prisma.album.delete({ where: { id } });
  revalidatePath("/admin");
  revalidatePath("/portfolio");
}

export async function uploadPhotosAction(formData: FormData) {
  await requireAdmin();

  const files = formData.getAll("files").filter((entry): entry is File => entry instanceof File);
  const albumId = String(formData.get("albumId") || "").trim();
  const description = String(formData.get("description") || "").trim();
  const tagsRaw = String(formData.get("tags") || "").trim();
  const priceCents = Number(formData.get("priceCents") || 0);
  const status = String(formData.get("status") || "PUBLISHED") as PhotoStatus;

  if (!files.length) {
    throw new Error("Selecione ao menos uma imagem.");
  }

  if (!Number.isFinite(priceCents) || priceCents <= 0) {
    throw new Error("Preco invalido.");
  }

  const tags = tagsRaw
    .split(",")
    .map((tag) => tag.trim().toLowerCase())
    .filter(Boolean);

  for (const file of files) {
    if (!file.type.startsWith("image/")) {
      continue;
    }

    const baseName = file.name.replace(/\.[^.]+$/, "");
    const title = baseName.replace(/[-_]/g, " ").trim();
    const slugBase = slugify(title || "foto");
    const slug = `${slugBase}-${Date.now().toString(36).slice(-6)}`;

    const uploaded = await uploadPhotoVariants({
      file,
      filenameBase: slug,
    });

    await prisma.photo.create({
      data: {
        title,
        slug,
        description: description || null,
        tags,
        priceCents,
        status,
        albumId: albumId || null,
        previewUrl: uploaded.previewUrl,
        previewWidth: uploaded.previewWidth,
        previewHeight: uploaded.previewHeight,
        originalPublicId: uploaded.originalPublicId,
        originalFormat: uploaded.originalFormat,
        originalBytes: uploaded.originalBytes,
      },
    });
  }

  revalidatePath("/admin");
  revalidatePath("/portfolio");
}

export async function updatePhotoAction(formData: FormData) {
  await requireAdmin();

  const id = String(formData.get("id") || "");
  const title = String(formData.get("title") || "").trim();
  const slug = slugify(String(formData.get("slug") || title));
  const description = String(formData.get("description") || "").trim();
  const tags = String(formData.get("tags") || "")
    .split(",")
    .map((tag) => tag.trim().toLowerCase())
    .filter(Boolean);
  const priceCents = Number(formData.get("priceCents") || 0);
  const albumId = String(formData.get("albumId") || "");
  const status = String(formData.get("status") || "PUBLISHED") as PhotoStatus;

  if (!id || !title || !slug || !Number.isFinite(priceCents) || priceCents <= 0) {
    throw new Error("Dados da foto invalidos.");
  }

  await prisma.photo.update({
    where: { id },
    data: {
      title,
      slug,
      description: description || null,
      tags,
      priceCents,
      albumId: albumId || null,
      status,
    },
  });

  revalidatePath("/admin");
  revalidatePath("/portfolio");
}

export async function deletePhotoAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") || "");
  if (!id) {
    throw new Error("Foto invalida.");
  }

  await prisma.photo.delete({ where: { id } });
  revalidatePath("/admin");
  revalidatePath("/portfolio");
}

export async function manualMarkPaidAction(formData: FormData) {
  await requireAdmin();

  const orderId = String(formData.get("orderId") || "");
  if (!orderId) {
    throw new Error("Pedido invalido.");
  }

  const order = await prisma.order.update({
    where: { id: orderId },
    data: {
      status: OrderStatus.PAID,
      paidAt: new Date(),
      providerRaw: {
        source: "manual_admin",
        at: new Date().toISOString(),
      },
    },
    include: {
      customer: true,
      photo: true,
    },
  });

  const token = await ensureDownloadToken(order.id);

  await sendDownloadReadyEmail({
    customerName: order.customer.name,
    customerEmail: order.customer.email,
    photoTitle: order.photo.title,
    downloadUrl: buildDownloadApiUrl(token.token),
    expiresAt: token.expiresAt,
  });

  revalidatePath("/admin");
  revalidatePath(`/order/${order.id}`);
}
