/*
 * Calcula a menor alteração de cor que faz cada par falho atingir WCAG AA,
 * sem inventar a marca: partimos do laranja #C45C2E e do vermelho de destructive.
 */
function lum(hex) {
  const c = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  const [r, g, b] = c.map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
function ratio(a, b) {
  const [l1, l2] = [lum(a), lum(b)].sort((x, y) => y - x);
  return (l1 + 0.05) / (l2 + 0.05);
}
const toHex = (r, g, b) =>
  "#" + [r, g, b].map((v) => Math.round(v).toString(16).padStart(2, "0")).join("").toUpperCase();

function escurecer(hex, fator) {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
  return toHex(r * fator, g * fator, b * fator);
}

console.log("=== Laranja da marca #C45C2E ===");
for (const f of [1, 0.97, 0.95, 0.93, 0.92, 0.9, 0.88, 0.85]) {
  const hex = escurecer("#C45C2E", f);
  console.log(
    `  fator ${f}  ${hex}  branco:${ratio("#FFFFFF", hex).toFixed(2)}  preto:${ratio("#111111", hex).toFixed(2)}`
  );
}

console.log("\n=== Destructive dark #EF4444 ===");
for (const f of [1, 0.95, 0.9, 0.85, 0.8, 0.75, 0.7]) {
  const hex = escurecer("#EF4444", f);
  console.log(
    `  fator ${f}  ${hex}  branco:${ratio("#FFFFFF", hex).toFixed(2)}  preto:${ratio("#111111", hex).toFixed(2)}`
  );
}

console.log("\n=== Destructive light #DC2626 (atual, passa) ===");
console.log(`  #DC2626  branco:${ratio("#FFFFFF", "#DC2626").toFixed(2)}`);
