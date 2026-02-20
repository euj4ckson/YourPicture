import type { Metadata } from "next";
import Link from "next/link";

import { ContactForm } from "@/components/site/contact-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: "Contato",
  description: "Entre em contato para projetos, dúvidas e licenciamento.",
};

export default function ContactPage() {
  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_1.1fr]">
      <section className="space-y-4">
        <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">Contato</p>
        <h1 className="text-4xl">Vamos conversar</h1>
        <p className="max-w-md text-muted-foreground">
          Use o formulário para orçamento, licenciamento ou dúvidas sobre compras no site.
        </p>
        <div className="space-y-2 text-sm">
          <p>
            Instagram:{" "}
            <Link href={siteConfig.links.instagram} target="_blank" className="underline">
              {siteConfig.links.instagram}
            </Link>
          </p>
          <p>
            WhatsApp:{" "}
            <Link href={siteConfig.links.whatsapp} target="_blank" className="underline">
              {siteConfig.links.whatsappNumber}
            </Link>
          </p>
          <p>
            E-mail:{" "}
            <Link href={`mailto:${siteConfig.links.email}`} className="underline">
              {siteConfig.links.email}
            </Link>
          </p>
        </div>
      </section>

      <Card className="border-border/70 bg-card/40">
        <CardHeader>
          <CardTitle>Formulário</CardTitle>
        </CardHeader>
        <CardContent>
          <ContactForm />
        </CardContent>
      </Card>
    </div>
  );
}
