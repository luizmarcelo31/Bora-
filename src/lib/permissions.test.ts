import { describe, expect, it } from "vitest";
import { can, requirePermission } from "./permissions";

describe("permissions", () => {
  it("owner tem tudo; caixa é restrito", () => {
    expect(can("PROPRIETARIO", "products.update")).toBe(true);
    expect(can("PROPRIETARIO", "financial.create")).toBe(true);
    expect(can("GERENTE", "sales.cancel")).toBe(true);
    expect(can("GERENTE", "financial.create")).toBe(false);
    expect(can("CAIXA", "sales.create")).toBe(true);
    expect(can("CAIXA", "products.update")).toBe(false);
    expect(can("CAIXA", "tenants.manage")).toBe(false);
  });

  it("requirePermission lança sem permissão e passa com permissão", () => {
    expect(() => requirePermission("CAIXA", "products.update")).toThrow();
    expect(() => requirePermission("PROPRIETARIO", "products.update")).not.toThrow();
  });
});
