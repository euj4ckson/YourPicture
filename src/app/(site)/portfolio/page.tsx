import type { Metadata } from "next";
import Link from "next/link";
import { Search } from "lucide-react";

import { PhotoCard } from "@/components/gallery/photo-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Portfolio",
  description: "Galeria de fotos com filtros por colecao.",
};

export const dynamic = "force-dynamic";

export default async function PortfolioPage({
  searchParams,
}: {
  searchParams: Promise<{ album?: string; q?: string }>;
}) {
  const params = await searchParams;
  const selectedAlbumSlug = params.album || "";
  const queryText = (params.q || "").trim();

  let albums: Array<{
    id: string;
    title: string;
    slug: string;
  }> = [];
  let photos: Array<{
    id: string;
    slug: string;
    title: string;
    previewUrl: string;
    priceCents: number;
    tags: string[];
  }> = [];
  let dbUnavailable = false;

  try {
    const [albumsResult, photosResult] = await Promise.all([
      prisma.album.findMany({
        where: { isPublished: true },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          title: true,
          slug: true,
        },
      }),
      prisma.photo.findMany({
        where: {
          status: "PUBLISHED",
          ...(selectedAlbumSlug
            ? {
                album: {
                  slug: selectedAlbumSlug,
                },
              }
            : {}),
          ...(queryText
            ? {
                OR: [
                  { title: { contains: queryText, mode: "insensitive" } },
                  { description: { contains: queryText, mode: "insensitive" } },
                  { tags: { has: queryText.toLowerCase() } },
                ],
              }
            : {}),
        },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          slug: true,
          title: true,
          previewUrl: true,
          priceCents: true,
          tags: true,
        },
      }),
    ]);

    albums = albumsResult;
    photos = photosResult;
  } catch {
    dbUnavailable = true;
  }

  return (
    <div className="space-y-8">
      <section className="space-y-4">
        <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">Galeria</p>
        <h1 className="text-4xl md:text-5xl">Portfolio</h1>
        <p className="max-w-2xl text-muted-foreground">
          Explore por colecao, busque por tags e abra cada foto para comprar o arquivo original sem
          watermark.
        </p>
      </section>

      <section className="rounded-3xl border border-border/70 bg-card/35 p-4 md:p-6">
        <form className="grid gap-3 md:grid-cols-[1fr_auto]" action="/portfolio" method="get">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              name="q"
              placeholder="Buscar por titulo, descricao ou tag..."
              defaultValue={queryText}
              className="pl-9"
            />
          </div>
          <Button type="submit">Buscar</Button>
          {selectedAlbumSlug && <input type="hidden" name="album" value={selectedAlbumSlug} />}
        </form>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <Button asChild variant={!selectedAlbumSlug ? "default" : "outline"} size="sm">
            <Link href={queryText ? `/portfolio?q=${encodeURIComponent(queryText)}` : "/portfolio"}>
              Todas
            </Link>
          </Button>
          {albums.map((album) => {
            const href = queryText
              ? `/portfolio?album=${album.slug}&q=${encodeURIComponent(queryText)}`
              : `/portfolio?album=${album.slug}`;
            return (
              <Button
                key={album.id}
                asChild
                variant={selectedAlbumSlug === album.slug ? "default" : "outline"}
                size="sm"
              >
                <Link href={href}>{album.title}</Link>
              </Button>
            );
          })}
          <span className="ml-auto text-xs text-muted-foreground">{photos.length} resultado(s)</span>
        </div>
      </section>

      {dbUnavailable && (
        <section className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-4 text-sm text-amber-700 dark:text-amber-200">
          Banco de dados indisponivel no momento. Conecte o PostgreSQL para carregar albuns e fotos.
        </section>
      )}

      {photos.length ? (
        <section className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {photos.map((photo) => (
            <PhotoCard
              key={photo.id}
              photo={{
                slug: photo.slug,
                title: photo.title,
                previewUrl: photo.previewUrl,
                priceCents: photo.priceCents,
                tags: photo.tags,
              }}
            />
          ))}
        </section>
      ) : (
        <section className="rounded-xl border border-dashed p-12 text-center text-muted-foreground">
          Nenhuma foto encontrada com os filtros informados.
        </section>
      )}
    </div>
  );
}
