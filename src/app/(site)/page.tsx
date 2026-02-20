import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, ShieldCheck, Sparkles, Wallet } from "lucide-react";

import { GalleryImage } from "@/components/gallery/gallery-image";
import { PhotoCard } from "@/components/gallery/photo-card";
import { Button } from "@/components/ui/button";
import { siteConfig } from "@/config/site";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Home",
  description: siteConfig.brand.description,
};

export const dynamic = "force-dynamic";

export default async function HomePage() {
  let featured: Array<{
    slug: string;
    title: string;
    previewUrl: string;
    priceCents: number;
    tags: string[];
  }> = [];
  let totalPhotos = 0;
  let totalAlbums = 0;
  let dbUnavailable = false;

  try {
    const [photos, photosCount, albumsCount] = await Promise.all([
      prisma.photo.findMany({
        where: { status: "PUBLISHED" },
        orderBy: { createdAt: "desc" },
        take: 6,
        select: {
          slug: true,
          title: true,
          previewUrl: true,
          priceCents: true,
          tags: true,
        },
      }),
      prisma.photo.count({ where: { status: "PUBLISHED" } }),
      prisma.album.count({ where: { isPublished: true } }),
    ]);

    featured = photos;
    totalPhotos = photosCount;
    totalAlbums = albumsCount;
  } catch {
    dbUnavailable = true;
  }

  const heroA = featured[0];
  const heroB = featured[1];

  return (
    <div className="space-y-16 md:space-y-20">
      <section className="brand-frame relative overflow-hidden rounded-3xl border border-border/60 bg-card/35 px-6 py-8 md:px-10 md:py-12">
        <div className="grid gap-10 lg:grid-cols-[1.2fr_1fr] lg:items-end">
          <div className="space-y-6 reveal-up">
            <p className="text-xs uppercase tracking-[0.35em] text-muted-foreground">Fotografia autoral</p>
            <h1 className="max-w-3xl text-4xl leading-tight md:text-6xl">{siteConfig.brand.tagline}</h1>
            <p className="max-w-xl text-base text-muted-foreground md:text-lg">
              Galeria premium com previa protegida por watermark, checkout Pix e liberacao automatica do
              original em alta resolucao.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link href="/portfolio">
                  Ver portfolio
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href="/contact">Falar comigo</Link>
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-3 pt-2 md:max-w-md">
              <div className="rounded-xl border border-border/70 bg-background/60 p-3">
                <p className="text-xs text-muted-foreground">Fotos publicadas</p>
                <p className="mt-1 text-2xl font-semibold">{totalPhotos}</p>
              </div>
              <div className="rounded-xl border border-border/70 bg-background/60 p-3">
                <p className="text-xs text-muted-foreground">Albuns ativos</p>
                <p className="mt-1 text-2xl font-semibold">{totalAlbums}</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 reveal-up-delay">
            <div className="col-span-2 overflow-hidden rounded-2xl border border-border/70 bg-background/40">
              {heroA ? (
                <GalleryImage
                  src={heroA.previewUrl}
                  alt={heroA.title}
                  width={1400}
                  height={900}
                  className="aspect-[16/9] w-full object-cover"
                  priority
                />
              ) : (
                <div className="aspect-[16/9] w-full bg-muted/50" />
              )}
            </div>
            <div className="overflow-hidden rounded-2xl border border-border/70 bg-background/40">
              {heroB ? (
                <GalleryImage
                  src={heroB.previewUrl}
                  alt={heroB.title}
                  width={1000}
                  height={1200}
                  className="aspect-[4/5] w-full object-cover"
                />
              ) : (
                <div className="aspect-[4/5] w-full bg-muted/50" />
              )}
            </div>
            <div className="rounded-2xl border border-border/70 bg-background/60 p-4 text-sm text-muted-foreground">
              <p className="mb-3 text-xs uppercase tracking-[0.25em]">Fluxo</p>
              <p>1. Visualiza a previa</p>
              <p>2. Paga via Pix</p>
              <p>3. Baixa o original</p>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-border/70 bg-card/35 p-5">
          <Sparkles className="mb-3 h-5 w-5 text-primary" />
          <h3 className="text-lg">Previa com protecao</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Imagens publicas com watermark para exibicao segura no portfolio.
          </p>
        </div>
        <div className="rounded-2xl border border-border/70 bg-card/35 p-5">
          <Wallet className="mb-3 h-5 w-5 text-primary" />
          <h3 className="text-lg">Checkout Pix</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Cobranca instantanea com status atualizado automaticamente por webhook.
          </p>
        </div>
        <div className="rounded-2xl border border-border/70 bg-card/35 p-5">
          <ShieldCheck className="mb-3 h-5 w-5 text-primary" />
          <h3 className="text-lg">Download seguro</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Link assinado, expiracao e limite de downloads para proteger o original.
          </p>
        </div>
      </section>

      <section className="space-y-6">
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">Destaques</p>
            <h2 className="text-3xl md:text-4xl">Colecoes recentes</h2>
          </div>
          <Button asChild variant="link" className="px-0">
            <Link href="/portfolio">Ver tudo</Link>
          </Button>
        </div>
        {dbUnavailable && (
          <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-4 text-sm text-amber-700 dark:text-amber-200">
            Banco de dados indisponivel no momento. Conecte o PostgreSQL para carregar as fotos.
          </div>
        )}
        {featured.length ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((photo) => (
              <PhotoCard key={photo.slug} photo={photo} />
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
            Nenhuma foto publicada ainda. Use o painel admin para enviar.
          </div>
        )}
      </section>
    </div>
  );
}
