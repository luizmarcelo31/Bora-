import { cn } from "@/lib/utils";

/**
 * Linha de lista compacta — substitui a tabela no mobile.
 *
 * ## O problema que resolve
 *
 * Oito rotas repetiam a mesma `<ul>` com `<li className="flex items-center gap-3
 * rounded-lg border p-3">` e dentro dela um bloco de título, uma linha de
 * apoio, um valor à direita e as ações. Cada cópia driftou um pouco — umas com
 * `gap-2`, umas com `p-2`, umas com `text-xs`, umas sem alvo de 44px. Esta
 * linha é a forma única.
 *
 * ## Anatomia
 *
 * ┌──────────────────────────────────────────┐
 * │ [avatar] Título principal        R$ 0,00 │
 * │          apoio 1 · apoio 2 · [badge]     │
 * ├──────────────────────────────────────────┤
 * │                     [ações]              │  ← só quando `acoes`
 * └──────────────────────────────────────────┘
 *
 * O `avatar` é opcional (foto do produto, inicial). O `valor` fica à direita e
 * é o primeiro ponto focal depois do título — é o número que o operador procura.
 *
 * ## Por que as ações vão para baixo
 *
 * Medido no Financeiro a 390px: com "Dar baixa · Editar · Excluir" na mesma
 * linha do título, o título do lançamento colapsava para "V.." e a data com a
 * categoria sumiam inteiro. Três botões com texto ocupam ~170px de 390px, e o
 * que sobra para o título é menos que o nome do botão mais curto.
 *
 * O dado é o que o usuário veio ler; a ação é o que ele faz depois. Separar em
 * duas linhas devolve o título e a data, e as ações ganham largura para caber
 * sem truncar. Com uma ação só (ícone) as duas linhas são desnecessárias — use
 * `acoesNaLinha` para manter compacto.
 *
 * ## Quando NÃO usar
 *
 * - Em desktop: a tabela continua sendo a melhor leitura (colunas alinhadas)
 * - Quando o item tem mais de 4 colunas de dados independentes: vira sheet
 */
export function LinhaLista({
  avatar,
  titulo,
  apoio,
  badge,
  badges,
  valor,
  acoes,
  acoesNaLinha = false,
  onClick,
  className,
}: {
  /** Miniatura, inicial ou ícone. 40px, à esquerda. */
  avatar?: React.ReactNode;
  /** Linha principal. Trunca, não quebre. */
  titulo: React.ReactNode;
  /** Linha de apoio: dados secundários, separados por `·`. */
  apoio?: React.ReactNode;
  /** Selo de status à direita da linha de apoio. */
  badge?: React.ReactNode;
  /**
   * Selos em linha própria, abaixo da de apoio. Use quando houver dois ou
   * mais: na mesma linha do `apoio` os selos comecam a truncar a data e a
   * categoria — medido no Financeiro, "28/09/2026 · Venda" virava "Ve...".
   */
  badges?: React.ReactNode;
  /** Valor monetário ou numérico. */
  valor?: React.ReactNode;
  /** Ações. Alvos de toque vêm do próprio componente de ação. */
  acoes?: React.ReactNode;
  /**
   * Mantém as ações na linha do valor. Só use quando `acoes` for um único
   * ícone — com dois ou mais botões de texto o título morre.
   */
  acoesNaLinha?: boolean;
  onClick?: () => void;
  className?: string;
}) {
  const Wrapper = onClick ? "button" : "div";
  const acoesEmLinha = acoesNaLinha || !acoes;

  return (
    <Wrapper
      {...(onClick ? { type: "button" as const, onClick } : {})}
      className={cn(
        // Duas linhas: coluna (conteúdo + ações). Uma linha: linha só.
        acoesEmLinha
          ? "min-h-14 flex-row items-center gap-3 p-2.5"
          : "flex-col p-2.5",
        "w-full rounded-lg border border-border bg-card text-left",
        onClick && "hit-area-44 transition-colors active:bg-muted/50",
        className
      )}
    >
      {/* Linha principal: avatar + texto + valor */}
      <span className="flex min-w-0 flex-1 items-center gap-3">
        {avatar ? <span className="shrink-0">{avatar}</span> : null}

        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="truncate text-sm font-semibold text-foreground">{titulo}</span>
          {apoio ? (
            <span className="truncate text-xs text-muted-foreground">{apoio}</span>
          ) : null}
          {badge ? <span className="shrink-0">{badge}</span> : null}
          {badges ? <span className="flex flex-wrap items-center gap-1.5">{badges}</span> : null}
        </span>

        {valor ? <span className="shrink-0 text-sm font-semibold">{valor}</span> : null}
        {acoesEmLinha && acoes ? (
          <span className="flex shrink-0 items-center gap-1">{acoes}</span>
        ) : null}
      </span>

      {/* Ações em segunda linha, com espaço próprio */}
      {!acoesEmLinha && acoes ? (
        <span className="flex w-full items-center justify-end gap-1.5 border-t border-border/60 pt-2">
          {acoes}
        </span>
      ) : null}
    </Wrapper>
  );
}

/** Avatar de produto: foto, ou inicial quando não há foto. */
export function AvatarProduto({
  nome,
  src,
  tamanho = 40,
}: {
  nome: string;
  src?: string | null;
  tamanho?: number;
}) {
  const estilo = { width: tamanho, height: tamanho };

  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- miniatura remota do Storage
      <img
        src={src}
        alt=""
        loading="lazy"
        className="shrink-0 rounded-lg border border-border object-cover"
        style={estilo}
      />
    );
  }

  return (
    <span
      aria-hidden="true"
      className="flex shrink-0 items-center justify-center rounded-lg border border-border bg-muted font-semibold text-muted-foreground"
      style={{ ...estilo, fontSize: tamanho / 2.6 }}
    >
      {nome.charAt(0).toUpperCase()}
    </span>
  );
}
