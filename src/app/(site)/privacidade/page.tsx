import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Política de Privacidade",
};

export default function PrivacyPage() {
  return (
    <article className="mx-auto max-w-3xl space-y-6">
      <header className="space-y-2">
        <h1 className="text-4xl">Política de Privacidade</h1>
        <p className="text-sm text-muted-foreground">Última atualização: 20 de fevereiro de 2026.</p>
      </header>

      <section className="space-y-4 text-sm leading-7 text-muted-foreground">
        <p>
          Coletamos os dados necessários para processar pedidos e entregar arquivos digitais: nome, e-mail,
          telefone (opcional), dados do pedido e eventos de pagamento.
        </p>
        <p>
          Os dados são usados para operação do serviço, envio de comprovantes e suporte. Não vendemos dados
          pessoais.
        </p>
        <p>
          Você pode solicitar correção ou exclusão dos dados pelo e-mail de contato informado no site, salvo
          retenções obrigatórias por lei.
        </p>
      </section>
    </article>
  );
}
