/*
 * Prova do bug de cascata de font-weight (roadmap Fase 1.2), em Chromium real.
 *
 * O Tailwind v4 emite as utilitárias (.font-bold, .font-medium) dentro de
 * @layer utilities. Na cascata CSS, declarações FORA de qualquer layer vencem
 * as que estão em layer. O `* { font-weight: 400 }` do src/styles/tokens.css
 * estava solto no arquivo e por isso anulava as utilitárias: o KPI em 700
 * previsto no roadmap 1.3 e os labels em 500 caíam para 400 na tela.
 *
 * Este script compara os dois estados com o MESMO contexto de layer do build:
 *   ANTES  — bloco de tipografia original (tokens.css @ HEAD), sem @layer
 *   DEPOIS — o mesmo bloco dentro de @layer base
 *
 * Rodar: node scripts/medir-pesos-camada.mjs
 */
import { chromium } from "playwright";

// Contexto de layer equivalente ao emitido pelo Tailwind v4.
const CONTEXTO = `
@layer theme, base, components, utilities;
@layer utilities {
  .font-medium { font-weight: 500; }
  .font-bold { font-weight: 700; }
  .font-semibold { font-weight: 600; }
}
`;

// Bloco EXATO que estava em src/styles/tokens.css antes da correção.
const BLOCO_ORIGINAL = `
*,
*::before,
*::after {
  font-weight: 400;
}

h1, h2, h3, h4, h5, h6,
[class*="heading"],
.text-lg, .text-xl, .text-2xl, .text-3xl, .text-title,
.font-semibold {
  font-weight: 600;
}
`;

// Mesmo bloco, dentro de layers.
const BLOCO_CORRIGIDO = `
@layer base {
  *, *::before, *::after { font-weight: 400; }
  h1, h2, h3, h4, h5, h6 { font-weight: 600; }
}
`;

async function medir(rotulo, cssExtra) {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.setContent(
    `<!doctype html><html><head><style>${CONTEXTO}\n${cssExtra}</style></head><body>
       <p id="b" class="font-bold">KPI</p>
       <p id="c" class="font-semibold">semibold</p>
       <p id="m" class="font-medium">medio</p>
       <p id="d">comum</p>
       <h1 id="e">heading</h1>
     </body></html>`,
    { waitUntil: "load" }
  );
  const r = await page.evaluate(() => {
    const w = (id) => getComputedStyle(document.getElementById(id)).fontWeight;
    return { bold: w("b"), semibold: w("c"), medium: w("m"), normal: w("d"), h1: w("e") };
  });
  await browser.close();
  console.log(`\n--- ${rotulo} ---`);
  console.log(`  .font-bold     (KPI 700) = ${r.bold}`);
  console.log(`  .font-semibold (600)     = ${r.semibold}`);
  console.log(`  .font-medium   (500)     = ${r.medium}`);
  console.log(`  sem classe     (400)     = ${r.normal}`);
  console.log(`  h1             (600)     = ${r.h1}`);
  return r;
}

const antes = await medir("ANTES — regra solta, sem @layer", BLOCO_ORIGINAL);
const depois = await medir("DEPOIS — regra dentro de @layer base", BLOCO_CORRIGIDO);

const kpiQuebrado = antes.bold === "400";
const kpiCorrigido = depois.bold === "700";

console.log("\n=== CONCLUSÃO ===");
if (kpiQuebrado && kpiCorrigido) {
  console.log("  BUG CONFIRMADO: sem @layer o KPI caía para 400; com @layer volta a 700.");
  console.log("  A correção é mover a regra para @layer base.");
} else {
  console.log("  RESULTADO INESPERADO — revisar.Antes=" + antes.bold + " Depois=" + depois.bold);
  process.exitCode = 1;
}
