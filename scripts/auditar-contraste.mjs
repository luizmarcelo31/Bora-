/*
 * Auditoria de contraste WCAG AA sobre src/styles/tokens.css.
 * Regra do roadmap Fase 1.1: "Validar contraste WCAG AA em ambos os modos".
 * Le os tokens e mede os pares realmente usados na interface.
 */
import { readFileSync } from "node:fs";

const css = readFileSync("src/styles/tokens.css", "utf8");

function block(selector) {
  const i = css.indexOf(selector);
  if (i === -1) return "";
  const start = css.indexOf("{", i);
  let depth = 0;
  for (let j = start; j < css.length; j++) {
    if (css[j] === "{") depth++;
    if (css[j] === "}") {
      depth--;
      if (depth === 0) return css.slice(start + 1, j);
    }
  }
  return "";
}

function tokens(src) {
  const out = {};
  for (const line of src.split("\n")) {
    const m = line.match(/^\s*(--[a-z0-9-]+):\s*(#[0-9A-Fa-f]{6})\s*;/i);
    if (m) out[m[1]] = m[2];
  }
  return out;
}

const light = tokens(block(":root"));
const dark = tokens(block(".dark"));

function lum(hex) {
  const c = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  const [r, g, b] = c.map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function ratio(a, b) {
  const [l1, l2] = [lum(a), lum(b)].sort((x, y) => y - x);
  return (l1 + 0.05) / (l2 + 0.05);
}

// [foreground, background, exige, uso]
const PAIRS = [
  ["--foreground", "--background", 4.5, "texto primário"],
  ["--foreground", "--card", 4.5, "texto em card"],
  ["--primary-foreground", "--primary", 4.5, "botão primário"],
  ["--accent-foreground", "--accent", 4.5, "acento"],
  ["--muted-foreground", "--background", 4.5, "texto secundário"],
  ["--muted-foreground", "--muted", 4.5, "texto em superfície muted"],
  ["--secondary-foreground", "--secondary", 4.5, "botão secundário"],
  ["--status-success-fg", "--status-success-bg", 4.5, "badge success"],
  ["--status-warning-fg", "--status-warning-bg", 4.5, "badge warning"],
  ["--status-danger-fg", "--status-danger-bg", 4.5, "badge danger"],
  ["--status-neutral-fg", "--status-neutral-bg", 4.5, "badge neutral"],
  ["--status-brand", "--background", 3, "marca/ícone (não-texto)"],
  ["--destructive-foreground", "--destructive", 4.5, "botão destrutivo"],
  ["--ring", "--background", 3, "focus ring"],
  ["--sidebar-foreground", "--sidebar", 4.5, "sidebar"],
  ["--sidebar-primary", "--sidebar", 3, "sidebar ativo"],
  ["--sidebar-primary-foreground", "--sidebar-primary", 4.5, "sidebar item ativo (texto)"],
  ["--sidebar-accent-foreground", "--sidebar-accent", 4.5, "sidebar hover (texto)"],
  ["--brand", "--background", 3, "marca pura (não-texto)"],
  ["--page-header-fg", "--page-header-bg", 4.5, "faixa do header de página"],
  ["--card-foreground", "--popover", 4.5, "popover"],
];

let failed = 0;
for (const [mode, set] of [["LIGHT", light], ["DARK", dark]]) {
  console.log(`\n=== ${mode} ===`);
  for (const [fg, bg, min, uso] of PAIRS) {
    if (!set[fg] || !set[bg]) {
      console.log(`  ???? ${uso}: token ausente (${fg} em ${bg})`);
      continue;
    }
    const r = ratio(set[fg], set[bg]);
    const ok = r >= min;
    if (!ok) failed++;
    console.log(
      `  ${ok ? "OK  " : "FALHA"} ${r.toFixed(2).padStart(5)} (min ${min})  ${uso}  ${set[fg]} sobre ${set[bg]}`
    );
  }
}
console.log(`\nTotal de falhas: ${failed}`);
