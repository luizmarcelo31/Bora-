/*
 * Critério de conclusão da Fase 1 do roadmap BoraMais:
 *   "Nenhuma cor hardcoded fora do `tokens.css`."
 *
 * Além de hex solto (que já auditamos), o risco real em Tailwind são as
 * utilitárias de paleta — bg-orange-500, text-gray-600, bg-white... — que
 * escrevem cor sem passar por token nenhum. Este script conta e lista.
 *
 * Whites/greys neutros são tolerados em superfície (fundo de página, borda),
 * mas qualquer cor de marca (orange/red/amber/blue/violet/emerald...) fora do
 * lugar é violação: a marca tem um só token, --brand.
 *
 * Rodar: node scripts/auditar-cores-hardcoded.mjs
 */
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const RAIZ = "src";
const ARQUIVOS = [];
(function walk(dir) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) walk(p);
    else if (/\.(tsx|ts|css)$/.test(e.name)) ARQUIVOS.push(p);
  }
})(RAIZ);

// Paletas que nao pertencem a marca BoraMais.
const FORA_DA_MARCA =
  "orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose|red|stone|neutral|zinc|gray|slate";

// Prefixos de utilitaria de cor do Tailwind.
const RE = new RegExp(
  `\\b(?:bg|text|border|ring|from|via|to|fill|stroke|outline|decoration|shadow|accent|caret|divide|placeholder)-(?:${FORA_DA_MARCA})-(?:\\d{2,3})(?:/\\d{1,3})?\\b`,
  "g"
);

const achados = new Map(); // chave -> [arquivos]

for (const arq of ARQUIVOS) {
  const linhas = readFileSync(arq, "utf8").split("\n");
  linhas.forEach((linha, i) => {
    for (const m of linha.matchAll(RE)) {
      const chave = m[0];
      if (!achados.has(chave)) achados.set(chave, []);
      achados.get(chave).push(`${arq}:${i + 1}`);
    }
  });
}

console.log(`Arquivos varridos: ${ARQUIVOS.length}`);
console.log(`Utilitárias de paleta fora da marca: ${achados.size}\n`);

if (achados.size === 0) {
  console.log("OK — nenhuma cor de paleta fora do token de marca.");
} else {
  const ordenados = [...achados.entries()].sort((a, b) => b[1].length - a[1].length);
  for (const [classe, locais] of ordenados) {
    console.log(`  ${String(locais.length).padStart(3)}x  ${classe}`);
    for (const l of locais.slice(0, 4)) console.log(`          ${l}`);
    if (locais.length > 4) console.log(`          ... +${locais.length - 4} mais`);
  }
  const total = ordenados.reduce((s, [, l]) => s + l.length, 0);
  console.log(`\nTotal de ocorrencias: ${total}`);
}
