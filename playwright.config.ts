import { defineConfig, devices } from "@playwright/test";

/**
 * E2E no repo (ROADMAP item 9).
 * Credenciais via env (nunca hardcoded): E2E_EMAIL, E2E_PASSWORD.
 * - smoke: login via UI + 9 rotas 200 + busca global visível, sem pageerrors
 * - mobile-tables: 390px, tabelas com scroll interno, sem overflow da página
 * - sale-flow: VENDA + CANCELAMENTO reais (requer E2E_WRITE=1; faz cleanup sozinho)
 */
export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  retries: 0,
  reporter: "list",
  // Dev local compila por rota (5–15s); timeout folgado para CI/dev.
  timeout: 240000,
  use: {
    baseURL: process.env.E2E_BASE_URL ?? "http://localhost:3000",
    trace: "retain-on-failure",
  },
  projects: [
    { name: "auth", testMatch: /auth\.setup\.ts/ },
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"], storageState: "tests/e2e/.auth.json" },
      dependencies: ["auth"],
    },
    {
      name: "mobile",
      testMatch: /mobile-tables\.spec\.ts/,
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 390, height: 844 },
        isMobile: true,
        hasTouch: true,
        storageState: "tests/e2e/.auth.json",
      },
      dependencies: ["auth"],
    },
  ],
  webServer: {
    command: "npm run dev",
    port: 3000,
    reuseExistingServer: !process.env.CI,
    timeout: 180000,
  },
});
