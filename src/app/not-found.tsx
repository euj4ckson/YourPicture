import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
      <h1 className="text-4xl">Página não encontrada</h1>
      <p className="text-muted-foreground">O conteúdo solicitado não existe ou foi removido.</p>
      <Button asChild>
        <Link href="/">Voltar para a home</Link>
      </Button>
    </div>
  );
}
