"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2, Copy, Loader2, QrCode } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { formatCurrency } from "@/lib/format";

const formSchema = z.object({
  customerName: z.string().min(2, "Informe seu nome."),
  customerEmail: z.string().email("E-mail inválido."),
  customerWhatsapp: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

type OrderResponse = {
  orderId: string;
  status: "PENDING" | "PAID" | "CANCELED";
  brCode: string;
  qrCodeImage: string;
  paymentLinkUrl?: string;
  expiresAt?: string;
};

export function BuyPhotoDialog({
  photo,
}: {
  photo: {
    id: string;
    title: string;
    priceCents: number;
  };
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [orderData, setOrderData] = useState<OrderResponse | null>(null);
  const [paidDownloadToken, setPaidDownloadToken] = useState<string | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      customerName: "",
      customerEmail: "",
      customerWhatsapp: "",
    },
  });

  const hasPaid = useMemo(() => orderData?.status === "PAID", [orderData?.status]);

  async function onSubmit(values: FormValues) {
    setLoading(true);
    setPaidDownloadToken(null);
    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          photoId: photo.id,
          ...values,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Erro ao criar pedido.");
      }

      setOrderData(data);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Falha ao iniciar checkout.");
    } finally {
      setLoading(false);
    }
  }

  async function copyBrCode() {
    if (!orderData?.brCode) {
      return;
    }

    await navigator.clipboard.writeText(orderData.brCode);
    toast.success("Código Pix copiado.");
  }

  useEffect(() => {
    if (!orderData?.orderId || orderData.status === "PAID") {
      return;
    }

    const interval = setInterval(async () => {
      const response = await fetch(`/api/orders/${orderData.orderId}`, { cache: "no-store" });
      if (!response.ok) {
        return;
      }

      const data = await response.json();
      if (data.status === "PAID") {
        setOrderData((current) =>
          current
            ? {
                ...current,
                status: "PAID",
              }
            : current,
        );
        if (data.download?.token) {
          setPaidDownloadToken(data.download.token);
        }
        toast.success("Pagamento confirmado. Download liberado.");
        clearInterval(interval);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [orderData?.orderId, orderData?.status]);

  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        setOpen(value);
        if (!value) {
          setOrderData(null);
          setPaidDownloadToken(null);
          form.reset();
        }
      }}
    >
      <DialogTrigger asChild>
        <Button className="w-full sm:w-auto">Comprar e baixar</Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Comprar: {photo.title}</DialogTitle>
          <DialogDescription>Pagamento via Pix para liberar o download original.</DialogDescription>
        </DialogHeader>

        {!orderData ? (
          <Form {...form}>
            <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
              <FormField
                control={form.control}
                name="customerName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome</FormLabel>
                    <FormControl>
                      <Input placeholder="Seu nome completo" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="customerEmail"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>E-mail</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="voce@email.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="customerWhatsapp"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>WhatsApp (opcional)</FormLabel>
                    <FormControl>
                      <Input placeholder="(11) 99999-9999" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="rounded-lg border bg-muted/40 p-3 text-sm">
                Valor: <strong>{formatCurrency(photo.priceCents)}</strong>
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Gerar Pix
              </Button>
            </form>
          </Form>
        ) : (
          <div className="space-y-4">
            {!hasPaid ? (
              <>
                <div className="rounded-xl border bg-muted/30 p-4">
                  <div className="mb-2 flex items-center gap-2 text-sm font-medium">
                    <QrCode className="h-4 w-4" />
                    Escaneie o QR Code no app do banco
                  </div>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={orderData.qrCodeImage}
                    alt="QR Code Pix"
                    className="mx-auto max-h-60 rounded-lg border bg-white p-2"
                  />
                </div>

                <div className="space-y-2 rounded-xl border p-4">
                  <p className="text-sm font-medium">Pix copia e cola</p>
                  <p className="break-all rounded-md bg-muted px-3 py-2 text-xs">{orderData.brCode}</p>
                  <Button variant="outline" className="w-full" onClick={copyBrCode}>
                    <Copy className="mr-2 h-4 w-4" />
                    Copiar código
                  </Button>
                </div>

                <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-sm">
                  Aguardando pagamento. A confirmação é automática.
                </div>
              </>
            ) : (
              <div className="space-y-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4">
                <p className="flex items-center gap-2 font-medium">
                  <CheckCircle2 className="h-5 w-5" />
                  Pagamento confirmado
                </p>
                {paidDownloadToken && (
                  <Button asChild className="w-full">
                    <Link href={`/api/download/${paidDownloadToken}`}>Baixar original agora</Link>
                  </Button>
                )}
              </div>
            )}

            <Button asChild variant="secondary" className="w-full">
              <Link href={`/order/${orderData.orderId}`}>Abrir página do pedido</Link>
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
