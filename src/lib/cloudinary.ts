import { v2 as cloudinary, type UploadApiOptions, type UploadApiResponse } from "cloudinary";

import { siteConfig } from "@/config/site";
import { env } from "@/lib/env";

const cloudName = env.CLOUDINARY_CLOUD_NAME;
const apiKey = env.CLOUDINARY_API_KEY;
const apiSecret = env.CLOUDINARY_API_SECRET;

cloudinary.config({
  cloud_name: cloudName,
  api_key: apiKey,
  api_secret: apiSecret,
  secure: true,
});

function requireCloudinaryConfig() {
  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error("Cloudinary nao configurado. Verifique as variaveis de ambiente.");
  }
}

function buildPreviewWatermarkTransformation() {
  const watermarkText = env.WATERMARK_TEXT || siteConfig.watermark.text;
  const watermarkLogoId = env.WATERMARK_LOGO_PUBLIC_ID || siteConfig.watermark.logoPublicId;

  if ((siteConfig.watermark.mode === "logo" || watermarkLogoId) && watermarkLogoId) {
    return [
      { width: 1600, crop: "limit", quality: "auto:good", fetch_format: "auto" },
      { overlay: watermarkLogoId, opacity: 38 },
      { flags: "layer_apply", gravity: "center" },
      { effect: "brightness:-5" },
    ];
  }

  return [
    { width: 1600, crop: "limit", quality: "auto:good", fetch_format: "auto" },
    {
      overlay: {
        font_family: "Arial",
        font_size: 72,
        font_weight: "bold",
        text: watermarkText,
      },
      color: "#ffffff",
      opacity: 36,
    },
    { flags: "layer_apply", gravity: "center", angle: -22 },
    {
      overlay: {
        font_family: "Arial",
        font_size: 42,
        font_weight: "bold",
        text: watermarkText,
      },
      color: "#ffffff",
      opacity: 28,
    },
    { flags: "layer_apply", gravity: "north_west", x: 40, y: 40 },
    {
      overlay: {
        font_family: "Arial",
        font_size: 42,
        font_weight: "bold",
        text: watermarkText,
      },
      color: "#ffffff",
      opacity: 28,
    },
    { flags: "layer_apply", gravity: "south_east", x: 40, y: 40 },
  ];
}

function uploadBuffer(
  buffer: Buffer,
  options: UploadApiOptions,
) {
  return new Promise<UploadApiResponse>((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(options, (error, result) => {
      if (error || !result) {
        reject(error || new Error("Falha no upload para Cloudinary."));
        return;
      }

      resolve(result);
    });

    stream.end(buffer);
  });
}

export async function uploadPhotoVariants({
  file,
  filenameBase,
}: {
  file: File;
  filenameBase: string;
}) {
  requireCloudinaryConfig();

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const original = await uploadBuffer(buffer, {
    folder: "photostore/originals",
    public_id: `${filenameBase}-${Date.now()}`,
    resource_type: "image",
    type: "private",
    overwrite: false,
    unique_filename: true,
  });

  const preview = await uploadBuffer(buffer, {
    folder: "photostore/previews",
    public_id: `${filenameBase}-${Date.now()}-preview`,
    resource_type: "image",
    type: "upload",
    overwrite: false,
    transformation: buildPreviewWatermarkTransformation(),
  });

  return {
    previewUrl: preview.secure_url,
    previewWidth: preview.width,
    previewHeight: preview.height,
    originalPublicId: original.public_id,
    originalFormat: original.format || "jpg",
    originalBytes: original.bytes,
  };
}

export function makePrivateDownloadUrl({
  publicId,
  format,
  expiresAt,
}: {
  publicId: string;
  format: string;
  expiresAt: Date;
}) {
  requireCloudinaryConfig();

  return cloudinary.utils.private_download_url(publicId, format, {
    type: "private",
    attachment: true,
    expires_at: Math.floor(expiresAt.getTime() / 1000),
  });
}
