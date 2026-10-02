/*
 * Verificação DEFINITIVA da cascata de font-weight, em navegador real.
 *
 * 1. Lê o CSS realmente emitido por `next build`.
 * 2. Confirma se `.font-bold` / `.font-medium` saem dentro de @layer utilities.
 * 3. Carrega a folha num Chromium via Playwright e mede o peso computado de
 *    utilitárias do Tailwind, com e sem a regra de piso do tokens.css.
 *
 * Motivo: o JSDOM NÃO implementa cascade layers (@layer) e devolve
 * resultados falsos. Só o navegador dá a resposta que importa.
 */
import { readFileSync, readdirSync } from "node:fs";
import { chromium } from "playwright";

// Next 16 emite o CSS em `.next/static/chunks/*.css`, não em
// `.next/static/css/` como nas versões anteriores. Os dois caminhos são
// procurados para o gate não depender da versão do Next: um gate que quebra
// por mudança de layout de saída deixa de ser gate.
const dirs = [".next/static/css", ".next/static/chunks"];
const dir = dirs.find((d) => {
  try {
    return readdirSync(d).some((f) => f.endsWith(".css"));
  } catch {
    return false;
  }
});

if (!dir) {
  console.error(
    "Nenhum CSS emitido encontrado em .next/static/css nem .next/static/chunks.\n" +
      "Rode `npm run build` antes deste gate."
  );
  process.exit(1);
}

const file = readdirSync(dir)
  .filter((f) => f.endsWith(".css"))
  .map((f) => ({ f, size: readFileSync(`${dir}/${f}`).length }))
  .sort((a, b) => b.size - a.size)[0];
const css = readFileSync(`${dir}/${file.f}`, "utf8");

console.log(`CSS emitido: ${file.f} (${file.size} bytes)\n`);

/* ---------- 1. As utilitárias estão em @layer utilities? ---------- */
function findSelector(cssText, selector) {
  const i = cssText.indexOf(selector);
  if (i === -1) return null;
  // varre de trás pra frente contando blocos
  let depth = 0;
  const stack = [];
  for (let j = i - 1; j >= 0; j--) {
    if (cssText[j] === "}") depth++;
    else if (cssText[j] === "{") {
      if (depth === 0) {
        const open = cssText.lastIndexOf("@layer", j);
        const between = open !== -1 && cssText.slice(open + 6, j).trim().length < 40 ? cssText.slice(open, j) : null;
        stack.push(between ? between.replace(/\s+/g, " ").trim() : cssText.slice(Math.max(0, j - 40), j).replace(/\s+/g, " ").trim());
      } else depth--;
    }
  }
  return stack;
}

for (const sel of [".font-bold", ".font-medium", ".font-semibold"]) {
  const ctx = findSelector(css, sel);
  console.log(`${sel} -> ${ctx ? ctx.join(" | ") : "NAO ENCONTRADO"}`);
}

/* ---------- 2. Medição no Chromium ---------- */
const page = `<!doctype html><html><head><style>${css}</style></head><body>
  <p id="a" class="font-medium">medio</p>
  <p id="b" class="font-bold">negrito / KPI</p>
  <p id="c" class="font-semibold">semibold</p>
  <p id="d">comum</p>
  <h1 id="e">heading</h1>
  <span id="f" class="label-group">GRUPO</span>
</body></html>`;

const browser = await chromium.launch();
const p = await browser.newPage();
await p.setContent(page, { waitUntil: "load" });

const got = await p.evaluate(() => {
  const w = (id) => getComputedStyle(document.getElementById(id)).fontWeight;
  const lg = getComputedStyle(document.getElementById("f"));
  return {
    medium: w("a"),
    bold: w("b"),
    semibold: w("c"),
    normal: w("d"),
    h1: w("e"),
    labelGroup: { weight: lg.fontWeight, transform: lg.textTransform, size: lg.fontSize, spacing: lg.letterSpacing },
  };
});
await browser.close();

console.log("\n=== Pesos computados no Chromium (tokens.css ATUAL) ===");
console.log(`  .font-medium   = ${got.medium}   (esperado 500)`);
console.log(`  .font-bold     = ${got.bold}   (esperado 700 — KPI roadmap 1.3)`);
console.log(`  .font-semibold = ${got.semibold}   (esperado 600)`);
console.log(`  sem classe     = ${got.normal}   (esperado 400)`);
console.log(`  h1             = ${got.h1}   (esperado 600)`);
console.log(
  `  .label-group   = weight ${got.labelGroup.weight}, transform ${got.labelGroup.transform}, size ${got.labelGroup.size}, spacing ${got.labelGroup.spacing}`
);

const checks = [
  ["font-medium = 500", got.medium === "500"],
  ["font-bold = 700", got.bold === "700"],
  ["font-semibold = 600", got.semibold === "600"],
  ["padrão = 400", got.normal === "400"],
  ["h1 = 600", got.h1 === "600"],
  ["label-group uppercase 10px", got.labelGroup.transform === "uppercase" && got.labelGroup.size === "10px"],
];
let falhas = 0;
console.log("");
for (const [nome, ok] of checks) {
  if (!ok) falhas++;
  console.log(`  ${ok ? "OK   " : "FALHA"} ${nome}`);
}

/* ---------- 3. CONTRAFACTUAL: como estava antes do fix ---------- */
// Precisa DESFAZER o wrapper de layer, não renomeá-lo: um @layer novo (ex.
// base_DISABLED) ainda é uma layer e, por não estar na declaração inicial,
// entra DEPOIS de utilities — utilities continuaria vencendo e o teste mentiria.
const antes = css
  .replace(/@layer base \{/, "@layer base_DISABLED {")
  .replace(/@layer components \{/, "@layer components_DISABLED {");

const b2 = await chromium.launch();
const p2 = await b2.newPage();
await p2.setContent(
  `<!doctype html><html><head><style>${antes}</style></head><body>
     <p id="b" class="font-bold">KPI</p>
     <p id="c" class="font-semibold">semibold</p>
     <p id="m" class="font-medium">medio</p>
   </body></html>`,
  { waitUntil: "load" }
);
const antesGot = await p2.evaluate(() => ({
  bold: getComputedStyle(document.getElementById("b")).fontWeight,
  semibold: getComputedStyle(document.getElementById("c")).fontWeight,
  medium: getComputedStyle(document.getElementById("m")).fontWeight,
}));
await b2.close();

console.log("\n=== CONTRAFACTUAL (layer renomeada = ainda em layer, NÃO isola o bug) ===");
console.log(`  .font-bold     = ${antesGot.bold}`);
console.log(`  .font-semibold = ${antesGot.semibold}`);
console.log(`  .font-medium   = ${antesGot.medium}`);
console.log(
  "  NOTA: este contrafactual NÃO isola o bug — o script medir-pesos-camada.mjs"
);
console.log("  faz a prova correta comparando o bloco original de HEAD.");

console.log(`\nTotal de falhas: ${falhas}`);
