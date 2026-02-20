import Link from "next/link";

import { siteConfig } from "@/config/site";

export function SiteFooter() {
  return (
    <footer className="border-t border-border/50">
      <div className="mx-auto grid w-full max-w-7xl gap-8 px-4 py-10 md:grid-cols-3 md:px-6">
        <div>
          <h3 className="font-serif text-lg">{siteConfig.brand.name}</h3>
          <p className="mt-2 max-w-xs text-sm text-muted-foreground">{siteConfig.brand.description}</p>
        </div>

        <div>
          <h4 className="text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">Links</h4>
          <div className="mt-3 flex flex-col gap-2 text-sm">
            <Link href="/portfolio">Portfólio</Link>
            <Link href="/about">Sobre</Link>
            <Link href="/contact">Contato</Link>
          </div>
        </div>

        <div>
          <h4 className="text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">Legal</h4>
          <div className="mt-3 flex flex-col gap-2 text-sm">
            <Link href="/termos">Termos de uso</Link>
            <Link href="/privacidade">Política de privacidade</Link>
            <a href={siteConfig.links.instagram} target="_blank" rel="noreferrer">
              Instagram
            </a>
            <a href={siteConfig.links.whatsapp} target="_blank" rel="noreferrer">
              WhatsApp
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
