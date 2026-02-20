"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle2, Clock3, Download, Loader2, XCircle } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatDate } from "@/lib/format";

type OrderApiData = {
  id: string;
  status: "PENDING" | "PAID" | "CANCELED" | "EXPIRED";
  amountCents: number;
  createdAt: string;
  paidAt?: string | null;
  customerName: string;
  customerEmail: string;
  photo: {
    title: string;
    slug: string;
    previewUrl: string;
  };
  download: {
    token: string;
    expiresAt: string;
    remainingDownloads: number;
  } | null;
};

function statusBadge(status: OrderApiData["status"]) {
  if (status === "PAID") return <Badge className="bg-emerald-600">{status}</Badge>;
  if (status === "PENDING") return <Badge variant="secondary">{status}</Badge>;
  return <Badge variant="destructive">{status}</Badge>;
}

export function OrderStatusPanel({ initialOrder }: { initialOrder: OrderApiData }) {
  const [order, setOrder] = useState(initialOrder);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (order.status !== "PENDING") {
      return;
    }

    const interval = setInterval(async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/orders/${order.id}`, { cache: "no-store" });
        if (response.ok) {
          const data = (await response.json()) as OrderApiData;
          setOrder(data);
        }
      } finally {
        setLoading(false);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [order.id, order.status]);

  return (
    <div className="space-y-6 rounded-2xl border border-border/70 bg-card/40 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground">Pedido</p>
          <h1 className="font-mono text-sm">{order.id}</h1>
        </div>
        {statusBadge(order.status)}
      </div>

      <div className="grid gap-4 text-sm sm:grid-cols-2">
        <div>
          <p className="text-muted-foreground">Cliente</p>
          <p>{order.customerName}</p>
          <p>{order.customerEmail}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Valor</p>
          <p className="text-lg font-semibold">{formatCurrency(order.amountCents)}</p>
          <p className="text-xs text-muted-foreground">Criado em {formatDate(order.createdAt)}</p>
        </div>
      </div>

      <div className="rounded-xl border p-4">
        <p className="text-sm text-muted-foreground">Foto</p>
        <p className="font-medium">{order.photo.title}</p>
        <Button asChild variant="link" className="h-auto px-0">
          <Link href={`/photo/${order.photo.slug}`}>Voltar para a foto</Link>
        </Button>
      </div>

      {order.status === "PENDING" && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-sm">
          <p className="flex items-center gap-2 font-medium">
            <Clock3 className="h-4 w-4" />
            Aguardando confirmação Pix
          </p>
          <p className="mt-1 text-muted-foreground">
            Esta página atualiza automaticamente a cada 5 segundos.
          </p>
          {loading && (
            <p className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
              <Loader2 className="h-3 w-3 animate-spin" />
              Atualizando status...
            </p>
          )}
        </div>
      )}

      {order.status === "PAID" && order.download && (
        <div className="space-y-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4">
          <p className="flex items-center gap-2 font-medium">
            <CheckCircle2 className="h-5 w-5" />
            Pagamento confirmado
          </p>
          <p className="text-sm text-muted-foreground">
            Link expira em {formatDate(order.download.expiresAt)}. Downloads restantes:{" "}
            {order.download.remainingDownloads}.
          </p>
          <Button asChild className="w-full sm:w-auto">
            <Link href={`/api/download/${order.download.token}`}>
              <Download className="mr-2 h-4 w-4" />
              Baixar original
            </Link>
          </Button>
        </div>
      )}

      {order.status !== "PENDING" && order.status !== "PAID" && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm">
          <p className="flex items-center gap-2 font-medium">
            <XCircle className="h-4 w-4" />
            Pedido não está elegível para download.
          </p>
        </div>
      )}
    </div>
  );
}
