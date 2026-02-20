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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { authOptions } from "@/lib/auth-options";
import { isCloudinaryConfigured } from "@/lib/cloudinary";
import { formatCurrency, formatDate } from "@/lib/format";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const errorMessages: Record<string, string> = {
  cloudinary_missing:
    "Cloudinary nao configurado. Defina CLOUDINARY_URL ou CLOUDINARY_CLOUD_NAME/CLOUDINARY_API_KEY/CLOUDINARY_API_SECRET nas env vars.",
  upload_failed:
    "Falha ao enviar imagem. Verifique as credenciais da Cloudinary e tente novamente.",
};

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; success?: string }>;
}) {
  const params = await searchParams;

  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "admin") {
    redirect("/admin/login");
  }

  const uploadReady = isCloudinaryConfigured();
  const errorMessage = params.error ? errorMessages[params.error] : null;
  const successMessage = params.success === "upload" ? "Upload concluido com sucesso." : null;

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

      {errorMessage && (
        <Alert variant="destructive">
          <AlertTitle>Erro</AlertTitle>
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      )}

      {successMessage && (
        <Alert>
          <AlertTitle>Sucesso</AlertTitle>
          <AlertDescription>{successMessage}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Albuns</CardDescription>
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
          <TabsTrigger value="albums">Albuns</TabsTrigger>
          <TabsTrigger value="upload">Upload</TabsTrigger>
          <TabsTrigger value="photos">Fotos</TabsTrigger>
          <TabsTrigger value="orders">Pedidos</TabsTrigger>
        </TabsList>

        <TabsContent value="albums" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Criar / Editar album</CardTitle>
            </CardHeader>
            <CardContent>
              <form action={upsertAlbumAction} className="grid gap-4 md:grid-cols-2">
                <Input name="title" placeholder="Titulo do album" required />
                <Input name="slug" placeholder="slug-do-album" required />
                <Textarea name="description" placeholder="Descricao (opcional)" className="md:col-span-2" />
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" name="isPublished" defaultChecked value="true" />
                  Publicar album
                </label>
                <div className="md:col-span-2">
                  <SubmitButton>Salvar album</SubmitButton>
                </div>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Albuns cadastrados</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {albums.map((album) => (
                <form key={album.id} action={upsertAlbumAction} className="space-y-2 rounded-lg border p-4">
                  <input type="hidden" name="id" value={album.id} />
                  <div className="grid gap-2 md:grid-cols-3">
                    <Input name="title" defaultValue={album.title} required />
                    <Input name="slug" defaultValue={album.slug} required />
                    <Input name="description" defaultValue={album.description || ""} placeholder="Descricao" />
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <label className="flex items-center gap-2 text-sm">
                      <input type="checkbox" name="isPublished" defaultChecked={album.isPublished} value="true" />
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
                Envie originais e o sistema cria preview com marca d&apos;agua automaticamente.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!uploadReady && (
                <div className="mb-4 rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-sm text-amber-700 dark:text-amber-200">
                  Upload desabilitado ate configurar Cloudinary nas variaveis de ambiente.
                </div>
              )}
              <form action={uploadPhotosAction} className="grid gap-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="files">Imagens (1 ou varias)</Label>
                    <Input
                      id="files"
                      name="files"
                      type="file"
                      multiple
                      accept="image/*"
                      required
                      disabled={!uploadReady}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="albumId">Album</Label>
                    <select
                      id="albumId"
                      name="albumId"
                      className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                      defaultValue=""
                      disabled={!uploadReady}
                    >
                      <option value="">Sem album</option>
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
                    <Label htmlFor="priceCents">Preco (centavos)</Label>
                    <Input
                      id="priceCents"
                      name="priceCents"
                      type="number"
                      min={100}
                      required
                      disabled={!uploadReady}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tags">Tags</Label>
                    <Input id="tags" name="tags" placeholder="moda, retrato, editorial" disabled={!uploadReady} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <select
                      id="status"
                      name="status"
                      className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                      defaultValue="PUBLISHED"
                      disabled={!uploadReady}
                    >
                      <option value="PUBLISHED">Publicada</option>
                      <option value="HIDDEN">Oculta</option>
                    </select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Descricao padrao (opcional)</Label>
                  <Textarea id="description" name="description" disabled={!uploadReady} />
                </div>
                <SubmitButton>{uploadReady ? "Enviar fotos" : "Cloudinary nao configurado"}</SubmitButton>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="photos" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Fotos cadastradas (ultimas 30)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {photos.map((photo) => (
                <form key={photo.id} action={updatePhotoAction} className="space-y-3 rounded-lg border p-4">
                  <input type="hidden" name="id" value={photo.id} />
                  <div className="grid gap-3 md:grid-cols-2">
                    <Input name="title" defaultValue={photo.title} required />
                    <Input name="slug" defaultValue={photo.slug} required />
                    <Input name="tags" defaultValue={photo.tags.join(", ")} placeholder="tags separadas por virgula" />
                    <Input name="priceCents" type="number" min={100} defaultValue={photo.priceCents} required />
                    <Input
                      name="albumId"
                      defaultValue={photo.albumId || ""}
                      placeholder="ID do album (vazio = sem album)"
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
                  <Textarea name="description" defaultValue={photo.description || ""} placeholder="Descricao" />
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
