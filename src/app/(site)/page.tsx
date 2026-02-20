import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

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
  let dbUnavailable = false;

  try {
    featured = await prisma.photo.findMany({
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
    });
  } catch {
    dbUnavailable = true;
  }

  return (
    <div className="space-y-16">
      <section className="brand-frame relative overflow-hidden rounded-3xl border bg-card/40 px-6 py-12 md:px-10 md:py-20">
        <div className="grid gap-10 md:grid-cols-[1.4fr_1fr] md:items-end">
          <div className="space-y-6">
            <p className="text-xs uppercase tracking-[0.35em] text-muted-foreground">Fotografia autoral</p>
            <h1 className="max-w-3xl text-4xl leading-tight md:text-6xl">
              {siteConfig.brand.tagline}
            </h1>
            <p className="max-w-xl text-base text-muted-foreground md:text-lg">
              Prévias com marca d&apos;água, checkout Pix e liberação automática para download em alta
              resolução.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link href="/portfolio">
                  Ver portfólio
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href="/contact">Falar comigo</Link>
              </Button>
            </div>
          </div>
          <div className="grid gap-2 rounded-2xl border border-border/70 bg-background/60 p-4 text-sm text-muted-foreground">
            <p>Galeria responsiva por coleções</p>
            <p>Checkout Pix com webhook</p>
            <p>Download original por link assinado</p>
            <p>Área admin protegida por login</p>
          </div>
        </div>
      </section>

      <section className="space-y-6">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">Destaques</p>
            <h2 className="text-3xl">Coleções recentes</h2>
          </div>
          <Button asChild variant="link" className="px-0">
            <Link href="/portfolio">Ver tudo</Link>
          </Button>
        </div>
        {dbUnavailable && (
          <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-4 text-sm text-amber-700 dark:text-amber-200">
            Banco de dados indisponível no momento. O layout está visível, mas conecte o PostgreSQL para
            carregar as fotos reais.
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
