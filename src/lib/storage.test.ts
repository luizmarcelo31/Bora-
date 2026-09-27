import { describe, expect, it, vi } from "vitest";
import {
  ErroImagem,
  bucketDoTenant,
  caminhoDaImagem,
  enviarImagemProduto,
  removerImagemProduto,
  validarArquivoImagem,
  type Armazenamento,
} from "./storage";

function mockStorage(overrides?: Partial<ReturnType<Armazenamento["from"]>>): Armazenamento {
  const base = {
    upload: vi.fn().mockResolvedValue({ error: null }),
    getPublicUrl: vi.fn().mockReturnValue({
      data: { publicUrl: "https://x/storage/v1/object/public/tenant-3/produtos/1/abc.jpg" },
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

describe("storage", () => {
  it("bucket por tenant", () => {
    expect(bucketDoTenant(3)).toBe("tenant-3");
  });

  it("caminho sem colisão", () => {
    expect(caminhoDaImagem(1, "jpg", "abc")).toBe("produtos/1/abc.jpg");
  });

  it("valida tipo e tamanho", () => {
    expect(validarArquivoImagem(arquivo(100, "image/png"))).toBe("png");
    expect(() => validarArquivoImagem(arquivo(0, "image/png"))).toThrowError(ErroImagem);
    expect(() => validarArquivoImagem(arquivo(100, "image/gif"))).toThrowError(ErroImagem);
    expect(() => validarArquivoImagem(arquivo(3 * 1024 * 1024, "image/jpeg"))).toThrowError(ErroImagem);
  });

  it("código do erro indica a causa", () => {
    try {
      validarArquivoImagem(arquivo(100, "application/pdf"));
      expect.unreachable();
    } catch (e) {
      expect((e as ErroImagem).codigo).toBe("TIPO");
    }
  });

  it("envia e retorna URL pública", async () => {
    const storage = mockStorage();
    const url = await enviarImagemProduto({
      storage,
      tenantId: 3,
      productId: 1,
      file: arquivo(100, "image/jpeg"),
      gerarId: () => "abc",
    });
    expect(url).toContain("produtos/1/abc.jpg");
    expect(storage.from).toHaveBeenCalledWith("tenant-3");
  });

  it("falha de upload vira ENVIO", async () => {
    const storage = mockStorage({ upload: vi.fn().mockResolvedValue({ error: { message: "bucket não existe" } }) });
    await expect(
      enviarImagemProduto({ storage, tenantId: 3, productId: 1, file: arquivo(100, "image/png"), gerarId: () => "x" })
    ).rejects.toMatchObject({ codigo: "ENVIO" });
  });

  it("remove extrai caminho da URL", async () => {
    const storage = mockStorage();
    await removerImagemProduto({
      storage,
      tenantId: 3,
      imageUrl: "https://x/storage/v1/object/public/tenant-3/produtos/1/abc.jpg",
    });
    expect(storage.from).toHaveBeenCalledWith("tenant-3");
  });

  it("remove ignora URL estranha ou nula", async () => {
    const storage = mockStorage();
    await removerImagemProduto({ storage, tenantId: 3, imageUrl: null });
    await removerImagemProduto({ storage, tenantId: 3, imageUrl: "https://outro.com/foto.jpg" });
    expect(storage.from).not.toHaveBeenCalled();
  });
});
