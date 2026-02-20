import type { Metadata } from "next";

import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: "Sobre",
  description: "Conheça a história e o estilo do fotógrafo.",
};

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <header className="space-y-3">
        <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">Sobre</p>
        <h1 className="text-4xl">Por trás das imagens</h1>
      </header>

      <section className="rounded-2xl border border-border/70 bg-card/40 p-6 text-base leading-8 text-muted-foreground md:p-8">
        <p>{siteConfig.about}</p>
      </section>
    </div>
  );
}
