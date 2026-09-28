import type { MetadataRoute } from "next";

/**
 * PWA manifest (skill mobile-saas §17).
 * Ícones gerados de public/LOGO.svg via sharp.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "BoraMais — Gestão para Conveniências",
    short_name: "BoraMais",
    description: "Gestão de produtos, estoque, PDV, caixa e financeiro para conveniências.",
    start_url: "/dashboard",
    display: "standalone",
    background_color: "#FFFFFF",
    theme_color: "#C45C2E",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
