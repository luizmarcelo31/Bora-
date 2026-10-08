/*
 * Instala o pre-commit que roda os gates.
 *
 * `.git/hooks/` NÃO é versionado — o hook não viaja com o repositório. Sem
 * isto, quem clona o projeto não tem trava nenhuma, e é exatamente por isso
 * que os gates ficaram vermelhos no main sem ninguém ver.
 *
 * O hook é uma casca de 4 linhas que chama `npm run gate`; a lógica está em
 * `scripts/gate-design-system.mjs`, que é versionado. Assim o hook local pode
 * ser regenerado em qualquer máquina.
 *
 * Rodar: node scripts/instalar-hook.mjs
 * Depois de um `git clone`: mesma coisa.
 */
import { existsSync, readFileSync, writeFileSync, chmodSync } from "node:fs";
import { resolve } from "node:path";

const HOOK = resolve(process.cwd(), ".git/hooks/pre-commit");

const CONTEUDO = `#!/bin/sh
# Pre-commit: roda os gates de design system + suíte unitária.
#
# Instalado por \`node scripts/instalar-hook.mjs\`. \`--no-verify\` pula, como
# sempre — a diferença é que agora existe um caminho rápido para quem está
# no meio de uma tarefa e volta a rodar antes de pushar.
#
# Motivo de o hook existir: os gates estavam no repo desde a Fase 1 e não
# rodavam em lugar nenhum. Dois deles (contraste e cor fora do token) ficaram
# vermelhos no main por commits a-sem-rumo, e ninguém viu.

if [ "$SKIP_GATE" = "1" ]; then
  echo "gate pulado por SKIP_GATE=1"
  exit 0
fi

exec npm run gate --silent
`;

if (!existsSync(resolve(process.cwd(), ".git"))) {
  console.error("não estamos num repositório git (falta .git)");
  process.exit(1);
}

writeFileSync(HOOK, CONTEUDO, "utf8");
chmodSync(HOOK, 0o755);

console.log(`pre-commit instalado em ${HOOK}`);
console.log("\nEle roda:");
console.log("  npm test                                  (suíte unitária)");
console.log("  node scripts/auditar-contraste.mjs        (WCAG AA)");
console.log("  node scripts/auditar-cores-hardcoded.mjs (cor fora do token)");
console.log("  node scripts/verificar-pesos.mjs          (cascata de font-weight)");
console.log("  npx tsc --noEmit                          (tipos)");
console.log("\nPara pular de propósito: SKIP_GATE=1 git commit …");