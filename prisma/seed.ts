import { PrismaClient, PhotoStatus } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const existing = await prisma.album.count();
  if (existing > 0) {
    return;
  }

  const album = await prisma.album.create({
    data: {
      title: "Colecao Editorial",
      slug: "colecao-editorial",
      description: "Fotos de demonstração para ambiente local.",
      isPublished: true,
    },
  });

  await prisma.photo.createMany({
    data: [
      {
        title: "Luz de Estudio",
        slug: "luz-de-estudio",
        description: "Exemplo de foto para desenvolvimento.",
        tags: ["editorial", "moda"],
        priceCents: 4990,
        status: PhotoStatus.PUBLISHED,
        albumId: album.id,
        previewUrl:
          "https://placehold.co/1600x1000/171717/e5e5e5?text=Preview+com+Watermark",
        previewWidth: 1600,
        previewHeight: 1000,
        originalPublicId: "demo/original/luz-de-estudio",
        originalFormat: "jpg",
        originalBytes: 1024,
      },
      {
        title: "Retrato Urbano",
        slug: "retrato-urbano",
        description: "Exemplo de foto para desenvolvimento.",
        tags: ["retrato", "rua"],
        priceCents: 6990,
        status: PhotoStatus.PUBLISHED,
        albumId: album.id,
        previewUrl:
          "https://placehold.co/1600x1100/101010/f5f5f5?text=Preview+com+Watermark",
        previewWidth: 1600,
        previewHeight: 1100,
        originalPublicId: "demo/original/retrato-urbano",
        originalFormat: "jpg",
        originalBytes: 2048,
      },
    ],
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
