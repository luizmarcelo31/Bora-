/*
 * Gate de design system + suíte, para rodar no pre-commit.
 *
 * Por que um script e não o hook chamando cada gate direto: o gate precisa
 * saber distinguir "FALHOU" de "não pôde rodar" (falta `next build`, `.env`
 * ausente, Playwright sem browser). Um gate que falha por infraestrutura e
 * aparece como código quebrado treina a pessoa a usar `--no-verify`, que é o
 * que torna o gate decorativo.
 *
 * Uso:
 *   node scripts/gate-design-system.mjs           # tudo
 *   node scripts/gate-design-system.mjs --rapido  # pula a suíte de testes
 */
import { spawnSync } from "node:child_process";

const rapido = process.argv.includes("--rapido");

/**
 * Cada gate: como rodar, e o que a falha significa.
 *
 * `skip` é para gate que não dá para rodar no contexto (ex.: verificar-pesos
 * precisa do CSS emitido por `next build`, que não existe em todo commit).
 */
const GATES = [
  {
    nome: "tsc",
    cmd: ["npx", "tsc", "--noEmit"],
    explicacao: "Erro de tipo. `npm run build` também passaria por aqui.",
  },
  ...(rapido
    ? []
    : [
        {
          nome: "testes unitários",
          cmd: ["npm", "test", "--silent"],
          explicacao: "Suíte unitária (vitest).",
        },
      ]),
  {
    nome: "contraste WCAG",
    cmd: ["node", "scripts/auditar-contraste.mjs"],
    explicacao: "Par de cor abaixo do mínimo. Gate de acessibilidade, não sugestão.",
  },
  {
    nome: "cor fora do token",
    cmd: ["node", "scripts/auditar-cores-hardcoded.mjs"],
    explicacao: "Utilitária de paleta fora de `tokens.css`.",
  },
  {
    nome: "pesos tipográficos",
    cmd: ["node", "scripts/verificar-pesos.mjs"],
    // Sem build, o CSS emitido não existe e o gate não tem o que medir.
    skip: "precisa de `npm run build` (lê o CSS emitido em .next/)",
    explicacao: "Cascata de font-weight quebrada no Chromium.",
  },
];

const VERMELHO = "\x1b[31m";
const VERDE = "\x1b[32m";
const AMARELO = "\x1b[33m";
const CINZA = "\x1b[90m";
const RESET = "\x1b[0m";

const rodados = [];
const pulados = [];
const falhos = [];

for (const gate of GATES) {
  process.stdout.write(`${CINZA}… ${gate.nome}${RESET}\n`);

  const r = spawnSync(gate.cmd[0], gate.cmd.slice(1), {
    stdio: ["ignore", "pipe", "pipe"],
    encoding: "utf8",
    shell: process.platform === "win32",
  });

  // `error` = o processo nem começou (binário ausente, EACCES). Não é o mesmo
  // que o gate reprovar.
  if (r.error) {
    pulados.push({ ...gate, motivo: `não rodou: ${r.error.message}` });
    process.stdout.write(`${AMARELO}  pulado${RESET} — ${gate.motivo ?? r.error.message}\n`);
    continue;
  }

  if (r.status !== 0) {
    falhos.push({ ...gate, saida: `${r.stdout ?? ""}${r.stderr ?? ""}` });
    process.stdout.write(`${VERMELHO}✗ FALHOU${RESET} — ${gate.explicacao}\n`);
    continue;
  }

  rodados.push(gate);
  process.stdout.write(`${VERDE}✓ ok${RESET}\n`);
}

console.log("");
if (falhos.length) {
  for (const g of falhos) {
    console.log(`${VERMELHO}─── ${g.nome} ───${RESET}`);
    console.log(g.saida.split("\n").slice(-25).join("\n"));
    console.log("");
  }
}

const rotuloPulado = pulados.length ? ` · ${pulados.length} pulado(s)` : "";
console.log(
  `${falhos.length ? VERMELHO : VERDE}${rodados.length} ok${RESET}` +
    `${falhos.length ? ` · ${falhos.length} falhou` : ""}${rotuloPulado}`
);

if (pulados.length) {
  console.log(`${CINZA}pulados (não contam como falha):${RESET}`);
  for (const g of pulados) console.log(`  - ${g.nome}: ${g.motivo}`);
}

process.exit(falhos.length ? 1 : 0);