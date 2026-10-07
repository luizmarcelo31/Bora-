interface FeatureCardProps {
  chave: string;
  descricao: string;
  ativo: boolean;
}

export function FeatureCard({ chave, descricao, ativo }: FeatureCardProps) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-border bg-background p-3 shadow-sm transition-colors hover:bg-muted/10">
      <div>
        <p className="text-sm font-semibold">{chave.replace(/-/g, " ")}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">{descricao}</p>
      </div>
      <div className="flex items-center gap-2">
        <span
          className={`relative inline-flex h-6 w-11 items-center rounded-full p-0.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 ${
            ativo ? "bg-[var(--status-success-dot)]" : "bg-muted"
          }`}
          role="switch"
          aria-checked={ativo}
          aria-label={`Ativar ${chave.replace(/-/g, " ")}`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${
              ativo ? "translate-x-5" : "translate-x-0"
            }`}
          />
        </span>
        <span
          className={`text-xs font-medium tabular-nums ${
            ativo ? "text-[var(--status-success-fg)]" : "text-muted-foreground"
          }`}
        >
          {ativo ? "Ativa" : "Inativa"}
        </span>
      </div>
    </div>
  );
}
