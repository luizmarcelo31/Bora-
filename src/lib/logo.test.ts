import { describe, expect, it, vi } from "vitest";

import {
  ErroImagem,
  LOGO_MAX_BYTES,
  bucketDoTenant,
  caminhoDaLogo,
  caminhoDaUrl,
  enviarImagemLogo,
  removerImagemLogo,
  validarArquivoLogo,
  type Armazenamento,
} from "./storage";

function mockStorage(overrides?: Partial<ReturnType<Armazenamento["from"]>>): Armazenamento {
  const base = {
    upload: vi.fn().mockResolvedValue({ error: null }),
    getPublicUrl: vi.fn().mockReturnValue({
      data: { publicUrl: "https://x/storage/v1/object/public/tenant-3/logo/abc.png" },
    }),
    remove: vi.fn().mockResolvedValue({ error: null }),
  };
  return { from: vi.fn().mockReturnValue({ ...base, ...overrides }) };
}

const arquivo = (size: number, type: string) => ({
  size,
  type,
  arrayBuffer: async () => new ArrayBuffer(8),
});

describe("logo da empresa — caminho e bucket", () => {
  it("usa o bucket do mesmo tenant da foto de produto", () => {
    // Bucket separado por loja: a logo da loja A não pode vazar para a B.
    expect(bucketDoTenant(3)).toBe("tenant-3");
  });

  it("guarda em logo/, sem id de produto", () => {
    // A logo pertence à loja, não a um item. Caminho com id faria cada
    // atualização de preço virar uma pasta nova.
    expect(caminhoDaLogo("png", "abc")).toBe("logo/abc.png");
    expect(caminhoDaLogo("jpg", "def")).toBe("logo/def.jpg");
  });

  it("extrai o caminho de volta a partir da URL pública", () => {
    const url = "https://x.supabase.co/storage/v1/object/public/tenant-3/logo/abc.png";
    expect(caminhoDaUrl(url, "tenant-3")).toBe("logo/abc.png");
  });

  it("devolve null para URL de outro bucket", () => {
    // Logo antiga apontando para fora do bucket do tenant não pode gerar
    // remove() com caminho Inventado.
    const url = "https://x.supabase.co/storage/v1/object/public/tenant-9/logo/abc.png";
    expect(caminhoDaUrl(url, "tenant-3")).toBeNull();
  });
});

describe("validarArquivoLogo", () => {
  it("aceita JPG e PNG", () => {
    expect(validarArquivoLogo({ size: 1000, type: "image/jpeg" })).toBe("jpg");
    expect(validarArquivoLogo({ size: 1000, type: "image/png" })).toBe("png");
  });

  it("recusa WebP, que o jsPDF nem sempre aceita", () => {
    // Descobrir isso no momento do export, com o relatório pronto, é pior do
    // que recusar no upload com mensagem clara.
    expect(() => validarArquivoLogo({ size: 1000, type: "image/webp" })).toThrow(ErroImagem);
  });

  it("recusa PDF e SVG", () => {
    expect(() => validarArquivoLogo({ size: 1000, type: "application/pdf" })).toThrow(ErroImagem);
    expect(() => validarArquivoLogo({ size: 1000, type: "image/svg+xml" })).toThrow(ErroImagem);
  });

  it("recusa arquivo vazio", () => {
    expect(() => validarArquivoLogo({ size: 0, type: "image/png" })).toThrow(/vazio/i);
  });

  it("limita a 512KB, não os 2MB da foto de produto", () => {
    expect(validarArquivoLogo({ size: LOGO_MAX_BYTES, type: "image/png" })).toBe("png");
    expect(() => validarArquivoLogo({ size: LOGO_MAX_BYTES + 1, type: "image/png" })).toThrow(
      ErroImagem
    );
  });

  it("classifica o erro com código, para a action escolher a mensagem", () => {
    try {
      validarArquivoLogo({ size: 10, type: "image/webp" });
      throw new Error("deveria ter lançado");
    } catch (e) {
      expect(e).toBeInstanceOf(ErroImagem);
      expect((e as ErroImagem).codigo).toBe("TIPO");
    }
  });
});

describe("enviarImagemLogo", () => {
  it("sobe para logo/ e devolve a URL pública", async () => {
    const storage = mockStorage();

    const url = await enviarImagemLogo({
      storage,
      tenantId: 3,
      file: arquivo(1000, "image/png"),
      gerarId: () => "abc",
    });

    expect(url).toBe("https://x/storage/v1/object/public/tenant-3/logo/abc.png");
    expect(storage.from).toHaveBeenCalledWith("tenant-3");
  });

  it("usa upsert, porque trocar a logo não pode falhar por objeto existente", async () => {
    // O UUID impede colisão de nome; upsert protege o caso de reenvio do mesmo
    // arquivo dentro do mesmo segundo.
    const storage = mockStorage();

    await enviarImagemLogo({
      storage,
      tenantId: 3,
      file: arquivo(1000, "image/png"),
      gerarId: () => "abc",
    });

    const bucket = storage.from("tenant-3") as unknown as { upload: ReturnType<typeof vi.fn> };
    expect(bucket.upload).toHaveBeenCalledWith(
      "logo/abc.png",
      expect.anything(),
      expect.objectContaining({ contentType: "image/png", upsert: true })
    );
  });

  it("propaga erro de storage como ErroImagem ENVIO", async () => {
    const storage = mockStorage({ upload: vi.fn().mockResolvedValue({ error: { message: "cheio" } }) });

    await expect(
      enviarImagemLogo({ storage, tenantId: 3, file: arquivo(1000, "image/png") })
    ).rejects.toMatchObject({ codigo: "ENVIO" });
  });

  it("não envia arquivo inválido ao storage", async () => {
    const storage = mockStorage();

    await expect(
      enviarImagemLogo({ storage, tenantId: 3, file: arquivo(1000, "image/webp") })
    ).rejects.toBeInstanceOf(ErroImagem);

    const bucket = storage.from("tenant-3") as unknown as { upload: ReturnType<typeof vi.fn> };
    expect(bucket.upload).not.toHaveBeenCalled();
  });
});

describe("removerImagemLogo", () => {
  it("remove o objeto pela URL pública", async () => {
    const storage = mockStorage();

    await removerImagemLogo({
      storage,
      tenantId: 3,
      url: "https://x.supabase.co/storage/v1/object/public/tenant-3/logo/velha.png",
    });

    const bucket = storage.from("tenant-3") as unknown as { remove: ReturnType<typeof vi.fn> };
    expect(bucket.remove).toHaveBeenCalledWith(["logo/velha.png"]);
  });

  it("não faz nada sem URL", async () => {
    const storage = mockStorage();

    await removerImagemLogo({ storage, tenantId: 3, url: null });

    expect(storage.from).not.toHaveBeenCalled();
  });

  it("ignora URL de fora do bucket do tenant", async () => {
    // Logo colada de fora (campo URL antigo) não gera remoção em outro bucket.
    const storage = mockStorage();

    await removerImagemLogo({
      storage,
      tenantId: 3,
      url: "https://exemplo.com/logo.png",
    });

    expect(storage.from).not.toHaveBeenCalled();
  });
});
