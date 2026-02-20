export const siteConfig = {
  brand: {
    name: "Fotografia Premium",
    logoText: "FT",
    tagline: "Imagem autoral para marcas e pessoas.",
    description:
      "Portfólio premium com venda de fotos digitais em alta resolução.",
  },
  links: {
    instagram: "https://instagram.com/euj4ckson",
    whatsapp: "https://wa.me/5532988518799",
    email: "jacksonduardo6@gmail.com",
  },
  about:
    "Fotógrafo(a) especializado(a) em retratos, campanhas e editoriais. Este texto pode ser alterado livremente para contar sua história.",
  colors: {
    lightBackground: "#f7f6f2",
    darkBackground: "#0d0d0e",
    accent: "#9f8457",
  },
  watermark: {
    mode: "text" as "text" | "logo",
    text: "PREVIEW • NAO AUTORIZADA",
    logoPublicId: "",
  },
  commerce: {
    currency: "BRL",
    downloadLimit: 5,
    downloadExpiresHours: 48,
    pixExpiresMinutes: 30,
  },
};

export const navLinks = [
  { href: "/", label: "Home" },
  { href: "/portfolio", label: "Portfólio" },
  { href: "/about", label: "Sobre" },
  { href: "/contact", label: "Contato" },
];
