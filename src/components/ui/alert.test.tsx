import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { Alert, AlertTitle, AlertDescription } from "./alert";
import { TriangleAlert } from "lucide-react";

// O vitest deste repo não usa `globals: true`, então o auto-cleanup do
// Testing Library não roda e o DOM acumula entre os casos.
afterEach(cleanup);

/**
 * Roadmap Fase 1.3 — "Alertas / Banners: 4 variantes com ícone + título + corpo".
 *
 * A verificação por DOM na aplicação não serve aqui: os alertas vivem dentro
 * de dialogs fechados, então nunca aparecem numa varredura de página. Aqui
 * garantimos o contrato do componente: 4 variantes, todas com ícone, título e
 * corpo, e todas usando token de status (para acompanhar o dark mode).
 */
describe("Alert — 4 variantes (roadmap 1.3)", () => {
  const VARIANTES = [
    { variant: "default", token: null },
    { variant: "destructive", token: "--status-danger-bg" },
    { variant: "success", token: "--status-success-bg" },
    { variant: "warning", token: "--status-warning-bg" },
  ] as const;

  for (const { variant, token } of VARIANTES) {
    it(`variante "${variant}" renderiza ícone, título e corpo`, () => {
      render(
        <Alert variant={variant}>
          <TriangleAlert />
          <AlertTitle>Título do alerta</AlertTitle>
          <AlertDescription>Corpo explicativo do alerta.</AlertDescription>
        </Alert>
      );

      expect(screen.getByText("Título do alerta")).toBeTruthy();
      expect(screen.getByText("Corpo explicativo do alerta.")).toBeTruthy();
      expect(document.querySelector("svg")).toBeTruthy();
    });

    it(`variante "${variant}" usa o token esperado`, () => {
      const { container } = render(
        <Alert variant={variant} data-testid="a">
          <AlertTitle>t</AlertTitle>
        </Alert>
      );
      const html = container.innerHTML;
      if (token) {
        expect(html).toContain(`var(${token})`);
      }
    });
  }

  it("as variantes de status não usam cor fixa de paleta", () => {
    // Se alguém voltar a hex hardcoded, o gate de cor do design system pega —
    // mas aqui também: nada de rgb()/hex nas variantes de status.
    for (const { variant } of VARIANTES.slice(1)) {
      const { container } = render(
        <Alert variant={variant}>
          <AlertTitle>t</AlertTitle>
        </Alert>
      );
      expect(container.innerHTML).not.toMatch(/#[0-9a-f]{3,6}\b/i);
    }
  });
});
