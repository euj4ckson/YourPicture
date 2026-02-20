# PhotoStore BR

Portfólio de fotografia com venda de fotos digitais, checkout Pix e liberação automática de download original sem marca d'água.

## Stack

- Next.js 16 (App Router) + TypeScript
- TailwindCSS + shadcn/ui
- Prisma + PostgreSQL (Neon/Supabase)
- Cloudinary (preview com watermark + original privado)
- NextAuth (login admin por credenciais)
- OpenPix (Pix + webhook)
- Resend (envio de e-mail com link de download)
- Deploy recomendado: Vercel

## Funcionalidades implementadas

- Site público:
  - Home
  - Portfólio com busca e filtro por álbum
  - Página de foto com preview watermarked + botão de compra
  - Sobre
  - Contato (formulário + envio por API)
  - Termos e Privacidade
  - Página pública de status do pedido: `/order/[id]`
- Checkout Pix:
  - Criação de pedido (`PENDING`)
  - Geração de cobrança Pix via OpenPix (QR Code + copia e cola)
  - Webhook idempotente para confirmar pagamento
  - Atualização automática para `PAID`
  - E-mail automático com link de download
- Download seguro:
  - Original privado no Cloudinary
  - Link assinado temporário (`/api/download/[token]`)
  - Expiração e limite de downloads por token
- Área admin:
  - Login protegido com NextAuth
  - CRUD básico de álbuns
  - Upload múltiplo de fotos
  - Edição/exclusão de fotos
  - Visualização de pedidos
  - Ação manual de “Marcar como pago”
- Qualidade:
  - Validação com Zod
  - Rate limit básico (criação de pedido e contato)
  - Metadata/OG + `sitemap.xml` + `robots.txt`
  - UI responsiva com dark/light mode

## Estrutura de pastas

```txt
src/
  app/
    (site)/...                 # páginas públicas
    admin/...                  # painel admin
    api/...                    # route handlers (orders, webhook, download, contact, auth)
    sitemap.ts
    robots.ts
  actions/
    admin.ts                   # server actions do painel
  components/
    ui/...                     # shadcn/ui
    checkout/...               # modal e status de pedido
    gallery/...                # cards de galeria
    site/...                   # header/footer/contato/theme
    admin/...                  # login/header/admin submit
  config/
    site.ts                    # identidade da marca
  lib/
    payments/                  # PaymentProvider + OpenPix
    cloudinary.ts
    order-service.ts
    auth-options.ts
    prisma.ts
    env.ts
prisma/
  schema.prisma
  migrations/
  seed.ts
```

## Configuração da identidade (branding)

Edite `src/config/site.ts` para alterar:

- nome da marca/fotógrafo
- logo placeholder (`logoText`)
- cores de referência
- links (Instagram, WhatsApp, e-mail)
- texto “Sobre”
- configuração da marca d'água padrão

## Requisitos

- Node.js 20+
- npm 10+
- PostgreSQL (Neon, Supabase ou local)
- Conta Cloudinary
- Conta OpenPix
- Conta Resend

## Variáveis de ambiente

Copie `.env.example` para `.env` e preencha:

```bash
cp .env.example .env
```

Principais variáveis:

- `DATABASE_URL`
- `NEXTAUTH_SECRET`
- `NEXTAUTH_URL`
- `APP_URL`
- `ADMIN_EMAIL`
- `ADMIN_PASSWORD` (opcional, fallback simples)
- `ADMIN_PASSWORD_HASH`
- `RESEND_API_KEY`
- `RESEND_FROM_EMAIL`
- `CLOUDINARY_URL`
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`
- `WATERMARK_TEXT` / `WATERMARK_LOGO_PUBLIC_ID`
- `PAYMENT_PROVIDER=openpix`
- `OPENPIX_APP_ID`
- `OPENPIX_BASE_URL`
- `WEBHOOK_SECRET`
- `DOWNLOAD_LINK_MAX_HOURS`
- `DOWNLOAD_MAX_USES`

### Gerar hash da senha admin

```bash
node -e "console.log(require('bcryptjs').hashSync('SuaSenhaForteAqui', 10))"
```

Cole o resultado em `ADMIN_PASSWORD_HASH`.
Se preferir simplicidade (menos seguro), pode usar `ADMIN_PASSWORD` em texto puro.

## Banco de dados (Prisma)

```bash
npm install
npm run prisma:generate
npx prisma migrate deploy
```

Para desenvolvimento:

```bash
npm run prisma:migrate
```

Seed opcional:

```bash
npm run db:seed
```

## Rodando localmente

```bash
npm install
npm run prisma:generate
npx prisma migrate deploy
npm run dev
```

Abra `http://localhost:3000`.

Admin em `http://localhost:3000/admin/login`.

## OpenPix (passo a passo)

1. Criar conta/app no OpenPix.
2. Copiar `APP_ID` e preencher `OPENPIX_APP_ID`.
3. Definir `PAYMENT_PROVIDER=openpix`.
4. Configurar webhook no painel OpenPix com URL:
   - Local (via túnel): `https://SEU_TUNNEL/api/pix/webhook/openpix`
   - Produção: `https://SEU_DOMINIO/api/pix/webhook/openpix`
5. Definir no OpenPix o header de autorização do webhook com o mesmo valor de `WEBHOOK_SECRET`.
6. Fazer um pagamento de teste.
7. Conferir atualização automática do pedido em `/order/[id]`.

## Cloudinary (passo a passo)

1. Criar conta Cloudinary.
2. Pegar `cloud_name`, `api_key`, `api_secret`.
3. Preencher `CLOUDINARY_URL` no `.env` (ou usar `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY` e `CLOUDINARY_API_SECRET` separadamente).
4. No admin, enviar imagem original.
5. O sistema salva:
   - preview público com watermark
   - original privado (`type: private`)

## Resend (passo a passo)

1. Criar domínio/remetente no Resend.
2. Definir:
   - `RESEND_API_KEY`
   - `RESEND_FROM_EMAIL`
3. Após pedido pago, o e-mail com link de download é enviado automaticamente.

## Webhook na Vercel

1. Deploy no projeto Vercel.
2. Configurar todas as env vars no painel da Vercel.
3. Validar que a rota está pública:
   - `https://SEU_DOMINIO/api/pix/webhook/openpix`
4. Configurar essa URL no OpenPix.
5. Usar o mesmo segredo em `WEBHOOK_SECRET` e na configuração do webhook.

## Deploy na Vercel

1. Suba o repositório para GitHub/GitLab/Bitbucket.
2. Importar projeto na Vercel.
3. Configurar env vars.
4. Configurar banco Postgres (Neon/Supabase) e `DATABASE_URL`.
5. Deploy.
6. Rodar migrations em produção:
   - `npx prisma migrate deploy`

## Segurança implementada

- URL do original nunca exposta diretamente
- Download via token + URL assinada temporária Cloudinary
- Limite de downloads por token
- Expiração de token de download
- Webhook validando segredo/assinatura
- Idempotência no webhook (`PaymentWebhookEvent.providerEventId` único)
- Rate limit básico em endpoints de criação de pedido/contato
- Área admin protegida por autenticação

## Troca de provedor Pix no futuro

Interface de pagamento está isolada em:

- `src/lib/payments/types.ts`
- `src/lib/payments/index.ts`
- `src/lib/payments/openpix.ts`

Para trocar para Mercado Pago ou Efí:

1. Implementar novo provider seguindo `PaymentProvider`.
2. Atualizar factory em `getPaymentProvider()`.
3. Ajustar env vars e webhook route.

## Scripts úteis

- `npm run dev`
- `npm run build`
- `npm run start`
- `npm run lint`
- `npm run prisma:generate`
- `npm run prisma:migrate`
- `npm run prisma:deploy`
- `npm run db:seed`

---

Projeto pronto para produção, com foco em Vercel + Pix no Brasil.
