import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

/**
 * Regressão: o Tailwind v4 emite as utilitárias de peso (.font-semibold,
 * .font-bold) dentro de `@layer utilities`, e na cascata CSS o que está FORA
 * de layer vence o que está em layer. A regra `* { font-weight: 400 }` do
 * tokens.css já ficou solta e anulou todas elas — a UI inteira renderizava em
 * 400 e o peso 700 dos KPIs (roadmap 1.3) nunca aparecia.
 *
 * Estes testes existem para impedir que a regra volte a ficar sem layer.
 */

const tokens = readFileSync(resolve(__dirname, "tokens.css"), "utf8");

/** Bloco de topo `{...}` que começa em `start` (sem contar chaves dentro de comentário). */
function blockAt(source: string, start: number): string {
  const open = source.indexOf("{", start);
  if (open === -1) return "";
  let depth = 0;
  for (let i = open; i < source.length; i++) {
    if (source[i] === "{") depth++;
    else if (source[i] === "}") {
      depth--;
      if (depth === 0) return source.slice(open, i + 1);
    }
  }
  return "";
}

/** true se a posição `pos` está dentro de algum bloco @layer. */
function isInsideLayer(source: string, pos: number): boolean {
  // Pilha de blocos: true quando o bloco aberto é um @layer.
  const stack: boolean[] = [];
  for (let i = 0; i < pos; i++) {
    if (source[i] === "{") {
      const isLayer = /@layer\s+[^{;]*$/.test(source.slice(0, i));
      stack.push(isLayer);
    } else if (source[i] === "}") {
      stack.pop();
    }
  }
  return stack.some(Boolean);
}

describe("tokens.css — tipografia em layer", () => {
  const weightRule = tokens.indexOf("font-weight: 400");
  const semiboldRule = tokens.indexOf("h1, h2, h3");

  it("declara a regra de peso 400 dentro de @layer", () => {
    expect(weightRule).toBeGreaterThan(-1);
    expect(isInsideLayer(tokens, weightRule)).toBe(true);
  });

  it("declara o peso 600 de headings dentro de @layer", () => {
    expect(semiboldRule).toBeGreaterThan(-1);
    expect(isInsideLayer(tokens, semiboldRule)).toBe(true);
  });

  it("mantém .label-group sobrescrevível por utilitárias", () => {
    const i = tokens.indexOf(".label-group");
    expect(i).toBeGreaterThan(-1);
    expect(isInsideLayer(tokens, i)).toBe(true);
  });

  it("não deixa seletor de font-weight solto no arquivo", () => {
    // Toda ocorrência de font-weight precisa estar em blockAt() iniciado dentro de layer.
    const offenders: string[] = [];
    let idx = 0;
    while ((idx = tokens.indexOf("font-weight", idx)) !== -1) {
      if (!isInsideLayer(tokens, idx)) {
        offenders.push(tokens.slice(Math.max(0, idx - 60), idx + 20).replace(/\s+/g, " "));
      }
      idx += 1;
    }
    expect(offenders).toEqual([]);
  });

  it("o bloco @layer base está com chaves balanceadas", () => {
    const block = blockAt(tokens, tokens.indexOf("@layer base"));
    const open = (block.match(/\{/g) ?? []).length;
    const close = (block.match(/\}/g) ?? []).length;
    expect(open).toBe(close);
  });
});
