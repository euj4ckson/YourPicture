import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { BuyPhotoDialog } from "@/components/checkout/buy-photo-dialog";
import { GalleryImage } from "@/components/gallery/gallery-image";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { formatCurrency } from "@/lib/format";
import { prisma } from "@/lib/prisma";

type PageParams = { slug: string };

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<PageParams>;
}): Promise<Metadata> {
  const { slug } = await params;
  const photo = await prisma.photo.findUnique({
    where: { slug, status: "PUBLISHED" },
  });

  if (!photo) {
    return {
      title: "Foto nao encontrada",
    };
  }

  return {
    title: photo.title,
    description: photo.description || `Previa com marca d'agua de ${photo.title}.`,
    openGraph: {
      images: [photo.previewUrl],
    },
  };
}

export default async function PhotoPage({
  params,
}: {
  params: Promise<PageParams>;
}) {
  const { slug } = await params;

  const photo = await prisma.photo.findUnique({
    where: { slug, status: "PUBLISHED" },
    include: { album: true },
  });

  if (!photo) {
    notFound();
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1.4fr_1fr]">
      <section className="space-y-4">
        <div className="brand-frame overflow-hidden rounded-3xl border border-border/70 bg-card/30">
          <GalleryImage
            src={photo.previewUrl}
            alt={`Previa com marca d'agua: ${photo.title}`}
            width={photo.previewWidth || 1600}
            height={photo.previewHeight || 1000}
            className="h-auto w-full object-cover"
            priority
          />
        </div>
        <p className="rounded-xl border border-border/70 bg-card/40 p-3 text-sm text-muted-foreground">
          Esta e uma previa com marca d&apos;agua. O arquivo original so e liberado apos confirmacao do
          pagamento.
        </p>
      </section>

      <aside className="space-y-5 lg:sticky lg:top-24 lg:self-start">
        <Card className="border-border/70 bg-card/40">
          <CardContent className="space-y-4 p-6">
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">Foto</p>
              <h1 className="text-3xl">{photo.title}</h1>
              {photo.description && <p className="text-sm text-muted-foreground">{photo.description}</p>}
            </div>
            <Separator />
            <div className="space-y-2 text-sm">
              <p>
                <span className="text-muted-foreground">Preco:</span>{" "}
                <strong>{formatCurrency(photo.priceCents)}</strong>
              </p>
              <p>
                <span className="text-muted-foreground">Album:</span> {photo.album?.title || "Sem album"}
              </p>
              <div className="flex flex-wrap gap-2 pt-1">
                {photo.tags.map((tag) => (
                  <Badge key={tag} variant="secondary">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
            <BuyPhotoDialog
              photo={{
                id: photo.id,
                title: photo.title,
                priceCents: photo.priceCents,
              }}
            />
          </CardContent>
        </Card>
      </aside>
    </div>
  );
}
