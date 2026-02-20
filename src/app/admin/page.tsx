import { OrderStatus } from "@prisma/client";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";

import {
  deleteAlbumAction,
  deletePhotoAction,
  manualMarkPaidAction,
  updatePhotoAction,
  uploadPhotosAction,
  upsertAlbumAction,
} from "@/actions/admin";
import { AdminHeader } from "@/components/admin/admin-header";
import { SubmitButton } from "@/components/admin/submit-button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { authOptions } from "@/lib/auth-options";
import { formatCurrency, formatDate } from "@/lib/format";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "admin") {
    redirect("/admin/login");
  }

  const [albums, photos, orders, pendingCount, paidCount] = await Promise.all([
    prisma.album.findMany({
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { photos: true } } },
    }),
    prisma.photo.findMany({
      orderBy: { createdAt: "desc" },
      include: { album: true },
      take: 30,
    }),
    prisma.order.findMany({
      orderBy: { createdAt: "desc" },
      include: { customer: true, photo: true },
      take: 50,
    }),
    prisma.order.count({ where: { status: OrderStatus.PENDING } }),
    prisma.order.count({ where: { status: OrderStatus.PAID } }),
  ]);

  return (
    <div className="space-y-8">
      <AdminHeader email={session.user?.email} />

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Álbuns</CardDescription>
            <CardTitle>{albums.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Pedidos pendentes</CardDescription>
            <CardTitle>{pendingCount}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Pedidos pagos</CardDescription>
            <CardTitle>{paidCount}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Tabs defaultValue="albums" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="albums">Álbuns</TabsTrigger>
          <TabsTrigger value="upload">Upload</TabsTrigger>
          <TabsTrigger value="photos">Fotos</TabsTrigger>
          <TabsTrigger value="orders">Pedidos</TabsTrigger>
        </TabsList>

        <TabsContent value="albums" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Criar / Editar álbum</CardTitle>
            </CardHeader>
            <CardContent>
              <form action={upsertAlbumAction} className="grid gap-4 md:grid-cols-2">
                <Input name="title" placeholder="Título do álbum" required />
                <Input name="slug" placeholder="slug-do-album" required />
                <Textarea name="description" placeholder="Descrição (opcional)" className="md:col-span-2" />
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" name="isPublished" defaultChecked value="true" />
                  Publicar álbum
                </label>
                <div className="md:col-span-2">
                  <SubmitButton>Salvar álbum</SubmitButton>
                </div>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Álbuns cadastrados</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {albums.map((album) => (
                <form key={album.id} action={upsertAlbumAction} className="space-y-2 rounded-lg border p-4">
                  <input type="hidden" name="id" value={album.id} />
                  <div className="grid gap-2 md:grid-cols-3">
                    <Input name="title" defaultValue={album.title} required />
                    <Input name="slug" defaultValue={album.slug} required />
                    <Input name="description" defaultValue={album.description || ""} placeholder="Descrição" />
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        name="isPublished"
                        defaultChecked={album.isPublished}
                        value="true"
                      />
                      Publicado
                    </label>
                    <div className="text-xs text-muted-foreground">{album._count.photos} fotos</div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <SubmitButton variant="secondary">Atualizar</SubmitButton>
                    <button
                      type="submit"
                      formAction={deleteAlbumAction}
                      className="inline-flex h-10 items-center rounded-md border border-destructive/50 px-4 text-sm text-destructive"
                    >
                      Excluir
                    </button>
                  </div>
                </form>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="upload" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Upload de fotos</CardTitle>
              <CardDescription>
                Envie originais e o sistema cria preview com marca d&apos;água automaticamente.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form action={uploadPhotosAction} className="grid gap-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="files">Imagens (1 ou várias)</Label>
                    <Input id="files" name="files" type="file" multiple accept="image/*" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="albumId">Álbum</Label>
                    <select
                      id="albumId"
                      name="albumId"
                      className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                      defaultValue=""
                    >
                      <option value="">Sem álbum</option>
                      {albums.map((album) => (
                        <option key={album.id} value={album.id}>
                          {album.title}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="priceCents">Preço (centavos)</Label>
                    <Input id="priceCents" name="priceCents" type="number" min={100} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tags">Tags</Label>
                    <Input id="tags" name="tags" placeholder="moda, retrato, editorial" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <select
                      id="status"
                      name="status"
                      className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                      defaultValue="PUBLISHED"
                    >
                      <option value="PUBLISHED">Publicada</option>
                      <option value="HIDDEN">Oculta</option>
                    </select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Descrição padrão (opcional)</Label>
                  <Textarea id="description" name="description" />
                </div>
                <SubmitButton>Enviar fotos</SubmitButton>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="photos" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Fotos cadastradas (últimas 30)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {photos.map((photo) => (
                <form key={photo.id} action={updatePhotoAction} className="space-y-3 rounded-lg border p-4">
                  <input type="hidden" name="id" value={photo.id} />
                  <div className="grid gap-3 md:grid-cols-2">
                    <Input name="title" defaultValue={photo.title} required />
                    <Input name="slug" defaultValue={photo.slug} required />
                    <Input name="tags" defaultValue={photo.tags.join(", ")} placeholder="tags separadas por vírgula" />
                    <Input name="priceCents" type="number" min={100} defaultValue={photo.priceCents} required />
                    <Input
                      name="albumId"
                      defaultValue={photo.albumId || ""}
                      placeholder="ID do álbum (vazio = sem álbum)"
                    />
                    <select
                      name="status"
                      className="h-10 rounded-md border bg-background px-3 text-sm"
                      defaultValue={photo.status}
                    >
                      <option value="PUBLISHED">Publicada</option>
                      <option value="HIDDEN">Oculta</option>
                    </select>
                  </div>
                  <Textarea name="description" defaultValue={photo.description || ""} placeholder="Descrição" />
                  <div className="flex flex-wrap gap-2">
                    <SubmitButton variant="secondary">Salvar</SubmitButton>
                    <button
                      type="submit"
                      formAction={deletePhotoAction}
                      className="inline-flex h-10 items-center rounded-md border border-destructive/50 px-4 text-sm text-destructive"
                    >
                      Excluir
                    </button>
                  </div>
                </form>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="orders" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Pedidos recentes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {orders.map((order) => (
                <div key={order.id} className="space-y-3 rounded-lg border p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="space-y-1">
                      <p className="font-mono text-xs text-muted-foreground">{order.id}</p>
                      <p className="font-medium">{order.photo.title}</p>
                    </div>
                    <Badge
                      variant={
                        order.status === "PAID"
                          ? "default"
                          : order.status === "PENDING"
                            ? "secondary"
                            : "destructive"
                      }
                    >
                      {order.status}
                    </Badge>
                  </div>
                  <Separator />
                  <div className="grid gap-2 text-sm md:grid-cols-4">
                    <p>
                      <span className="text-muted-foreground">Cliente:</span> {order.customer.name}
                    </p>
                    <p>
                      <span className="text-muted-foreground">E-mail:</span> {order.customer.email}
                    </p>
                    <p>
                      <span className="text-muted-foreground">Valor:</span> {formatCurrency(order.amountCents)}
                    </p>
                    <p>
                      <span className="text-muted-foreground">Criado:</span> {formatDate(order.createdAt)}
                    </p>
                  </div>
                  {order.status !== "PAID" && (
                    <form action={manualMarkPaidAction}>
                      <input type="hidden" name="orderId" value={order.id} />
                      <SubmitButton variant="outline">Marcar como pago manualmente</SubmitButton>
                    </form>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
