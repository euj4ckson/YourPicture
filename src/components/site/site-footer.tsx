import Link from "next/link";

import { siteConfig } from "@/config/site";

export function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-border/60 bg-card/20">
      <div className="mx-auto grid w-full max-w-7xl gap-8 px-4 py-10 md:grid-cols-3 md:px-6">
        <div>
          <h3 className="font-serif text-lg">{siteConfig.brand.name}</h3>
          <p className="mt-2 max-w-xs text-sm text-muted-foreground">{siteConfig.brand.description}</p>
        </div>

        <div>
          <h4 className="text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">Menu</h4>
          <div className="mt-3 flex flex-col gap-2 text-sm">
            <Link href="/portfolio" className="hover:text-primary">
              Portfolio
            </Link>
            <Link href="/about" className="hover:text-primary">
              Sobre
            </Link>
            <Link href="/contact" className="hover:text-primary">
              Contato
            </Link>
          </div>
        </div>

        <div>
          <h4 className="text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">Legal</h4>
          <div className="mt-3 flex flex-col gap-2 text-sm">
            <Link href="/termos" className="hover:text-primary">
              Termos de uso
            </Link>
            <Link href="/privacidade" className="hover:text-primary">
              Politica de privacidade
            </Link>
            <a href={siteConfig.links.instagram} target="_blank" rel="noreferrer" className="hover:text-primary">
              Instagram
            </a>
            <a href={siteConfig.links.whatsapp} target="_blank" rel="noreferrer" className="hover:text-primary">
              WhatsApp
            </a>
          </div>
        </div>
      </div>
      <div className="border-t border-border/60 py-4 text-center text-xs text-muted-foreground">
        {new Date().getFullYear()} {siteConfig.brand.name}. Todos os direitos reservados.
      </div>
    </footer>
  );
}
