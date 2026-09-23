import type { Page } from "@playwright/test";

/**
 * Page Object da tela de login (padrão da skill e2e-testing).
 * Seletores por label/role (acessíveis), sem sleeps arbitrários.
 */
export class LoginPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async goto(redirect?: string) {
    await this.page.goto(redirect ? `/login?redirect=${redirect}` : "/login");
  }

  async loginAs(email: string, password: string) {
    await this.page.getByLabel("Email").fill(email);
    await this.page.getByLabel("Senha").fill(password);
    await this.page.getByRole("button", { name: "Entrar" }).click();
  }

  /** Login via UI e aguarda a home esperada do role. */
  async loginAndWaitHome(email: string, password: string, home: string) {
    await this.loginAs(email, password);
    await this.page.waitForURL(`**${home}**`, { timeout: 30000 });
  }
}
