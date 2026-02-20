import Image from "next/image";
import Link from "next/link";
import { Eye } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
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
    <Card className="group overflow-hidden border-border/60 bg-card/40 transition-all hover:-translate-y-1 hover:shadow-xl">
      <Link href={`/photo/${photo.slug}`} className="block overflow-hidden">
        <Image
          src={photo.previewUrl}
          alt={photo.title}
          width={1200}
          height={800}
          className="h-72 w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
      </Link>
      <CardContent className="space-y-2 p-4">
        <div className="flex items-center justify-between gap-4">
          <h3 className="line-clamp-1 font-medium">{photo.title}</h3>
          <span className="text-sm font-semibold">{formatCurrency(photo.priceCents)}</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {photo.tags.slice(0, 3).map((tag) => (
            <Badge key={tag} variant="secondary">
              {tag}
            </Badge>
          ))}
        </div>
      </CardContent>
      <CardFooter className="px-4 pb-4 pt-0">
        <Link
          href={`/photo/${photo.slug}`}
          className="inline-flex items-center text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <Eye className="mr-2 h-4 w-4" />
          Ver prévia
        </Link>
      </CardFooter>
    </Card>
  );
}
