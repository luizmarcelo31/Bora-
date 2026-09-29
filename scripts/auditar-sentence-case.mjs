/*
 * Auditoria de sentence case (roadmap Fase 1.2):
 * "Garantir sentence case em 100% da interface (sem Title Case em labels)".
 *
 * Sentence case = apenas a primeira palavra capitalized. Title Case = todas.
 * Varre strings de interface (title/label/description/placeholder) e aponta as
 * que estão em Title Case.
 *
 * Rodar: node scripts/auditar-sentence-case.mjs
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const RAIZ = "src";
const ARQUIVOS = [];
(function walk(dir) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) walk(p);
    else if (/\.(tsx|ts)$/.test(e.name)) ARQUIVOS.push(p);
  }
})(RAIZ);

// Palavras que legitimamente comecam em maiuscula mesmo em sentence case.
const EXCECOES = new Set([
  "PDV", "DRE", "PIN", "PDF", "CNPJ", "CPF", "E-mail", "Email",
  "Meta", "Vale", "Zero", "Novo", "Nova", "Caixa", "Vendas", "Estoque",
  "Inventário", "Auditoria", "Configurações", "Relatórios", "Financeiro",
  "Compras", "Promoções", "Categorias", "Produtos", "Admin",
]);

// Props cujo valor aparece para o usuario.
const PROPS = ["title", "label", "description", "placeholder", "heading", "text", "caption"];

const tituloCase = (s) => {
  const palavras = s.trim().split(/\s+/).filter(Boolean);
  if (palavras.length < 2) return false;
  const relevantes = palavras.filter((p) => !EXCECOES.has(p));
  if (relevantes.length < 2) return false;
  return relevantes.every((p) => /^[A-ZÀ-Ý]/.test(p));
};

const achados = [];
for (const arq of ARQUIVOS) {
  const src = readFileSync(arq, "utf8");
  const linhas = src.split("\n");
  linhas.forEach((linha, i) => {
    for (const prop of PROPS) {
      const re = new RegExp(`${prop}[:=]\\s*["'\`]([^"'\`]{3,})["'\`]`);
      const m = linha.match(re);
      if (!m) continue;
      const valor = m[1];
      // ignora classes Tailwind e urls
      if (/^[a-z:\-/\[\]]+$/.test(valor) || valor.startsWith("http")) continue;
      if (tituloCase(valor)) {
        achados.push({ arq, linha: i + 1, prop, valor });
      }
    }
  });
}

console.log(`Arquivos varridos: ${ARQUIVOS.length}`);
console.log(`Strings em Title Case: ${achados.length}\n`);
for (const a of achados) {
  console.log(`  ${a.arq}:${a.linha}  [${a.prop}] "${a.valor}"`);
}
