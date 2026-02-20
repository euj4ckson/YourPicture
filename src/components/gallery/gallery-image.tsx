"use client";

import { useMemo, useState } from "react";
import Image from "next/image";

import { cn } from "@/lib/utils";

const FALLBACK_SRC = "/images/photo-fallback.svg";

export function GalleryImage({
  src,
  alt,
  width,
  height,
  className,
  priority = false,
}: {
  src: string;
  alt: string;
  width: number;
  height: number;
  className?: string;
  priority?: boolean;
}) {
  const [hasError, setHasError] = useState(false);
  const finalSrc = useMemo(() => (hasError ? FALLBACK_SRC : src), [hasError, src]);

  return (
    <Image
      src={finalSrc}
      alt={alt}
      width={width}
      height={height}
      className={cn(className)}
      priority={priority}
      onError={() => setHasError(true)}
    />
  );
}
