/**
 * Imagens de produto no Supabase Storage (ADR-002).
 *
 * - Bucket por tenant: `tenant-{id}` (público, só leitura).
 * - Upload SEMPRE no servidor com service role — credencial nunca no frontend.
 * - `Product.imageUrl` guarda a URL pública; nada de binário no banco.
 * - Funções puras (validação, nomes) + `enviarImagemProduto` com cliente
 *   injetável, para teste unitário sem rede.
 */

export const IMAGEM_TIPOS: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export const IMAGEM_MAX_BYTES = 2 * 1024 * 1024;

export type CodigoErroImagem = "TIPO" | "TAMANHO" | "VAZIA" | "ENVIO" | "CONFIG";

export class ErroImagem extends Error {
  readonly codigo: CodigoErroImagem;
  constructor(codigo: CodigoErroImagem, detalhe?: string) {
    super(detalhe ?? codigo);
    this.name = "ErroImagem";
    this.codigo = codigo;
  }
}

/** Nome do bucket de um tenant. */
export function bucketDoTenant(tenantId: number): string {
  return `tenant-${tenantId}`;
}

/** Caminho do objeto dentro do bucket. UUID evita colisão e cache velho. */
export function caminhoDaImagem(
  productId: number,
  extensao: string,
  uuid: string
): string {
  return `produtos/${productId}/${uuid}.${extensao}`;
}

/** Valida tipo e tamanho. Retorna a extensão quando válido. */
export function validarArquivoImagem(file: {
  size: number;
  type: string;
}): string {
  if (!file.size) throw new ErroImagem("VAZIA", "Arquivo vazio.");
  const ext = IMAGEM_TIPOS[file.type];
  if (!ext) {
    throw new ErroImagem("TIPO", "Use JPG, PNG ou WebP.");
  }
  if (file.size > IMAGEM_MAX_BYTES) {
    throw new ErroImagem("TAMANHO", "Máximo 2MB.");
  }
  return ext;
}

/** Formato mínimo do storage usado aqui (supabase-js satisfaz). */
export interface Armazenamento {
  from(bucket: string): {
    upload(
      path: string,
      body: ArrayBuffer | Uint8Array,
      opts: { contentType: string; upsert: boolean }
    ): Promise<{ error: { message: string } | null }>;
    getPublicUrl(path: string): { data: { publicUrl: string } };
    remove(paths: string[]): Promise<{ error: { message: string } | null }>;
  };
}

export async function enviarImagemProduto(deps: {
  storage: Armazenamento;
  tenantId: number;
  productId: number;
  file: { size: number; type: string; arrayBuffer(): Promise<ArrayBuffer> };
  gerarId?: () => string;
}): Promise<string> {
  const ext = validarArquivoImagem(deps.file);
  const bucket = bucketDoTenant(deps.tenantId);
  const caminho = caminhoDaImagem(
    deps.productId,
    ext,
    (deps.gerarId ?? (() => crypto.randomUUID()))()
  );
  const bytes = await deps.file.arrayBuffer();
  const { error } = await deps.storage
    .from(bucket)
    .upload(caminho, bytes, { contentType: deps.file.type, upsert: false });
  if (error) {
    throw new ErroImagem("ENVIO", error.message.slice(0, 200));
  }
  return deps.storage.from(bucket).getPublicUrl(caminho).data.publicUrl;
}

/** Extrai o caminho do objeto a partir da URL pública. Null quando não reconhece. */
export function caminhoDaUrl(url: string, bucket: string): string | null {
  const marcador = `/storage/v1/object/public/${bucket}/`;
  const i = url.indexOf(marcador);
  if (i < 0) return null;
  const caminho = url.slice(i + marcador.length);
  return caminho || null;
}

/** Remove o objeto; falha de storage não deve bloquear a remoção da URL. */
export async function removerImagemProduto(deps: {
  storage: Armazenamento;
  tenantId: number;
  imageUrl: string | null;
}): Promise<void> {
  if (!deps.imageUrl) return;
  const caminho = caminhoDaUrl(deps.imageUrl, bucketDoTenant(deps.tenantId));
  if (!caminho) return;
  await deps.storage.from(bucketDoTenant(deps.tenantId)).remove([caminho]);
}
