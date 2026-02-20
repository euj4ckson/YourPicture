import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Termos de Uso",
};

export default function TermsPage() {
  return (
    <article className="mx-auto max-w-3xl space-y-6">
      <header className="space-y-2">
        <h1 className="text-4xl">Termos de Uso</h1>
        <p className="text-sm text-muted-foreground">Última atualização: 20 de fevereiro de 2026.</p>
      </header>

      <section className="space-y-4 text-sm leading-7 text-muted-foreground">
        <p>
          Ao comprar uma foto digital neste site, você recebe licença pessoal e intransferível de uso,
          conforme combinado no ato da compra.
        </p>
        <p>
          É proibida a revenda, redistribuição, remoção de autoria e qualquer uso que infrinja direitos
          autorais sem autorização expressa.
        </p>
        <p>
          O download é liberado por link temporário e pode expirar por tempo ou limite de acessos. Em
          caso de problema, use o canal de contato.
        </p>
      </section>
    </article>
  );
}
