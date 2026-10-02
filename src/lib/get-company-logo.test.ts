import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockTenantSettingsFindUnique } = vi.hoisted(() => ({
  mockTenantSettingsFindUnique: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  prisma: {
    tenantSettings: { findUnique: mockTenantSettingsFindUnique },
  },
}));

import { getCompanyLogoUrl } from "./get-company-logo";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("getCompanyLogoUrl", () => {
  it("devolve a URL configurada", async () => {
    mockTenantSettingsFindUnique.mockResolvedValue({
      companyLogoUrl: "https://x.supabase.co/storage/v1/object/public/tenant-3/logo/a.png",
    });

    expect(await getCompanyLogoUrl(3)).toContain("tenant-3/logo/a.png");
  });

  it("filtra pelo tenant, para a logo de uma loja não entrar na outra", async () => {
    // É o teste que importa aqui: PDF de relatório carrega a logo pelo tenantId,
    // e uma query sem filtro mostraria o logo da loja errada no documento.
    mockTenantSettingsFindUnique.mockResolvedValue({ companyLogoUrl: null });

    await getCompanyLogoUrl(3);

    expect(mockTenantSettingsFindUnique).toHaveBeenCalledWith({
      where: { tenantId: 3 },
      select: { companyLogoUrl: true },
    });
  });

  it("devolve null quando não há logo", async () => {
    mockTenantSettingsFindUnique.mockResolvedValue({ companyLogoUrl: null });
    expect(await getCompanyLogoUrl(3)).toBeNull();
  });

  it("devolve null quando a loja nunca abriu Configurações", async () => {
    // Sem linha de settings: é o caso de toda loja nova, e o PDF precisa sair
    // assim mesmo, sem logo.
    mockTenantSettingsFindUnique.mockResolvedValue(null);
    expect(await getCompanyLogoUrl(3)).toBeNull();
  });
});
