"use client";

import { useEffect } from "react";

import { Button } from "@/components/ui/button";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[admin error boundary]", error);
  }, [error]);

  return (
    <div className="mx-auto max-w-xl space-y-4 rounded-xl border border-destructive/40 bg-destructive/10 p-6">
      <h2 className="text-xl font-semibold">Erro no painel admin</h2>
      <p className="text-sm text-muted-foreground">
        Ocorreu um erro na operacao. Tente novamente.
      </p>
      <Button onClick={reset}>Tentar de novo</Button>
    </div>
  );
}
