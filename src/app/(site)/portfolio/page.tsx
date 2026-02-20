import type { Metadata } from "next";
import Link from "next/link";

import { PhotoCard } from "@/components/gallery/photo-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Portfólio",
  description: "Galeria de fotos com filtros por coleção.",
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
    albums = await prisma.album.findMany({
      where: { isPublished: true },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        title: true,
        slug: true,
      },
    });

    photos = await prisma.photo.findMany({
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
    });
  } catch {
    dbUnavailable = true;
  }

  return (
    <div className="space-y-8">
      <section className="space-y-4">
        <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">Galeria</p>
        <h1 className="text-4xl">Portfólio</h1>
        <p className="max-w-2xl text-muted-foreground">
          Explore por coleção, busque por tags e abra cada foto para comprar o arquivo original sem
          marca d&apos;água.
        </p>
      </section>

      <section className="rounded-2xl border bg-card/40 p-4 md:p-6">
        <form className="grid gap-3 md:grid-cols-[1fr_auto]" action="/portfolio" method="get">
          <Input name="q" placeholder="Buscar por título, descrição ou tag..." defaultValue={queryText} />
          <Button type="submit">Buscar</Button>
          {selectedAlbumSlug && <input type="hidden" name="album" value={selectedAlbumSlug} />}
        </form>
        <div className="mt-4 flex flex-wrap gap-2">
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
        </div>
      </section>
      {dbUnavailable && (
        <section className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-4 text-sm text-amber-700 dark:text-amber-200">
          Banco de dados indisponível no momento. Conecte o PostgreSQL para carregar álbuns e fotos.
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
