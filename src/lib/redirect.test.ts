import { describe, expect, it } from "vitest";
import {
  getHomePathForRole,
  isSafeRedirect,
  resolvePostLoginRedirect,
} from "./redirect";

describe("redirect por role", () => {
  it("home: super admin → /admin, demais → /dashboard", () => {
    expect(getHomePathForRole("SUPER_ADMIN")).toBe("/admin");
    expect(getHomePathForRole("PROPRIETARIO")).toBe("/dashboard");
    expect(getHomePathForRole("CAIXA")).toBe("/dashboard");
    expect(getHomePathForRole(null)).toBe("/dashboard");
    expect(getHomePathForRole(undefined)).toBe("/dashboard");
  });

  it("isSafeRedirect bloqueia open-redirect", () => {
    expect(isSafeRedirect("/admin/empresas")).toBe(true);
    expect(isSafeRedirect("/dashboard")).toBe(true);
    expect(isSafeRedirect("//evil.com")).toBe(false);
    expect(isSafeRedirect("https://evil.com")).toBe(false);
    expect(isSafeRedirect("/\\evil")).toBe(false);
    expect(isSafeRedirect("")).toBe(false);
  });

  it("super admin nunca cai em rota comum", () => {
    expect(resolvePostLoginRedirect("SUPER_ADMIN", "/dashboard")).toBe("/admin");
    expect(resolvePostLoginRedirect("SUPER_ADMIN", "/dashboard/pdv")).toBe("/admin");
    expect(resolvePostLoginRedirect("SUPER_ADMIN", "/admin/empresas")).toBe("/admin/empresas");
    expect(resolvePostLoginRedirect("SUPER_ADMIN", "/admin")).toBe("/admin");
    expect(resolvePostLoginRedirect("SUPER_ADMIN", null)).toBe("/admin");
    expect(resolvePostLoginRedirect("SUPER_ADMIN", "//evil.com")).toBe("/admin");
  });

  it("role comum nunca entra em /admin", () => {
    expect(resolvePostLoginRedirect("PROPRIETARIO", "/admin")).toBe("/dashboard");
    expect(resolvePostLoginRedirect("PROPRIETARIO", "/admin/empresas")).toBe("/dashboard");
    expect(resolvePostLoginRedirect("CAIXA", "/dashboard/pdv")).toBe("/dashboard/pdv");
    expect(resolvePostLoginRedirect("CAIXA", "/dashboard")).toBe("/dashboard");
    expect(resolvePostLoginRedirect("FUNCIONARIO", null)).toBe("/dashboard");
  });
});
