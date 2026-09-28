import type { MetadataRoute } from "next";

/**
 * PWA manifest (skill mobile-saas §17).
 * Ícones PNG 192/512 pendentes — sem eles o prompt de instalação
 * do Chrome não dispara. Gerar a partir da marca e declarar aqui.
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
    icons: [],
  };
}
