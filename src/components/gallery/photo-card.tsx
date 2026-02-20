import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { GalleryImage } from "@/components/gallery/gallery-image";
import { formatCurrency } from "@/lib/format";

export function PhotoCard({
  photo,
}: {
  photo: {
    slug: string;
    title: string;
    previewUrl: string;
    priceCents: number;
    tags: string[];
  };
}) {
  return (
    <Card className="group overflow-hidden border-border/60 bg-card/35 transition-transform duration-300 hover:-translate-y-1">
      <Link href={`/photo/${photo.slug}`} className="relative block">
        <div className="overflow-hidden">
          <GalleryImage
            src={photo.previewUrl}
            alt={photo.title}
            width={1200}
            height={1500}
            className="aspect-[4/5] w-full object-cover transition duration-500 group-hover:scale-105"
          />
        </div>
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
        <div className="absolute bottom-3 right-3 rounded-full border border-white/25 bg-black/35 p-2 text-white backdrop-blur">
          <ArrowUpRight className="h-4 w-4" />
        </div>
      </Link>
      <CardContent className="space-y-3 p-4">
        <div className="flex items-start justify-between gap-3">
          <h3 className="line-clamp-1 text-base font-medium">{photo.title}</h3>
          <span className="text-sm font-semibold text-primary">{formatCurrency(photo.priceCents)}</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {photo.tags.slice(0, 3).map((tag) => (
            <Badge key={tag} variant="secondary" className="capitalize">
              {tag}
            </Badge>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
