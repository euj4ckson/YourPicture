import type { MetadataRoute } from "next";

import { getAppUrl } from "@/lib/env";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = getAppUrl();
  const staticRoutes = ["", "/portfolio", "/about", "/contact", "/termos", "/privacidade"].map(
    (path) => ({
      url: `${base}${path}`,
      changeFrequency: "weekly" as const,
      priority: path === "" ? 1 : 0.8,
    }),
  );

  const photos = await prisma.photo.findMany({
    where: { status: "PUBLISHED" },
    select: { slug: true, updatedAt: true },
  });

  const photoRoutes = photos.map((photo) => ({
    url: `${base}/photo/${photo.slug}`,
    lastModified: photo.updatedAt,
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));

  return [...staticRoutes, ...photoRoutes];
}
