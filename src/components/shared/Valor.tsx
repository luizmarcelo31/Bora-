import { cn } from "@/lib/utils";

/**
 * Tom semântico de um valor. Reusa os tokens de status que já são a fonte
 * única de cor do projeto (`src/styles/tokens.css`) — nada de hex aqui.
 */
export type TomValor = "neutro" | "positivo" | "negativo" | "atencao";

const TONS: Record<TomValor, string> = {
  neutro: "text-foreground",
  positivo: "text-[var(--status-success-fg)]",
  negativo: "text-destructive",
  atencao: "text-[var(--status-warning-fg)]",
};

/**
 * Valor monetário ou numérico com tom semântico opcional.
 *
 * ## Por que existe
 *
 * O dono da conveniência lê o sinal antes do número: um saldo negativo em
 * cinza passa batido, e é justamente o saldo negativo que ele precisa ver
 * primeiro. A cor aqui é a mesma dos badges de status, para a interface não
 * ter dois dialetos de "positivo/negativo".
 *
 * ## Quando usar
 *
 * - `tom="positivo"` — receita, saldo acima de zero, troco a devolver
 * - `tom="negativo"` — despesa, saldo abaixo de zero, falta a receber
 * - `tom="atencao"` — pendente, em aberto, precisa de ação
 * - sem `tom` — preço de venda, custo, valores neutros de catálogo
 *
 * ## Quando NÃO usar
 *
 * - Para decorar: se o valor não tem leitura positivo/negativo, deixar neutro
 * - Em valor que o usuário ainda não entendeu (total antes dos itens)
 */
export function Valor({
  children,
  tom,
  className,
  sinal = false,
}: {
  children: React.ReactNode;
  tom?: TomValor;
  className?: string;
  /** Prefixa "+" em valores positivos — para entradas/saídas de estoque. */
  sinal?: boolean;
}) {
  const texto = String(children);
  const comSinal =
    sinal && tom === "positivo" && !texto.trim().startsWith("+") ? `+${texto}` : texto;

  return (
    <span className={cn("tabular-nums", tom && TONS[tom], className)}>{comSinal}</span>
  );
}

/**
 * Igual a {@link Valor}, mas decide o tom pelo próprio número.
 *
 * `positivo` acima de zero, `negativo` abaixo, neutro em zero — é o caso de
 * saldo, troco e diferença de caixa, onde o sinal já está no número e o
 * componente não deve repetir visualmente o que o número diz.
 */
export function ValorNum({
  valor,
  formatar,
  zero = "neutro",
  className,
}: {
  valor: number;
  formatar: (v: number) => string;
  /** Tom para o zero. Padrão neutro — "R$ 0,00" não é bom nem ruim. */
  zero?: TomValor;
  className?: string;
}) {
  const tom: TomValor = valor > 0 ? "positivo" : valor < 0 ? "negativo" : zero;
  return (
    <Valor tom={tom} className={className}>
      {formatar(valor)}
    </Valor>
  );
}
