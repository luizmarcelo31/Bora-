import { describe, expect, it } from "vitest";
import { can, requirePermission } from "./permissions";

describe("permissions", () => {
  it("owner tem tudo; caixa é restrito", () => {
    expect(can("OWNER", "products.update")).toBe(true);
    expect(can("OWNER", "financial.create")).toBe(true);
    expect(can("MANAGER", "sales.cancel")).toBe(true);
    expect(can("MANAGER", "financial.create")).toBe(false);
    expect(can("CASHIER", "sales.create")).toBe(true);
    expect(can("CASHIER", "products.update")).toBe(false);
    expect(can("CASHIER", "tenants.manage")).toBe(false);
  });

  it("requirePermission lança sem permissão e passa com permissão", () => {
    expect(() => requirePermission("CASHIER", "products.update")).toThrow();
    expect(() => requirePermission("OWNER", "products.update")).not.toThrow();
  });
});
