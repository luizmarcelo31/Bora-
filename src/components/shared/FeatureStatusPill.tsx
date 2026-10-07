import { type Tom } from "@/lib/labels";

interface FeatureStatusPillProps {
  ativo: boolean;
}

export function FeatureStatusPill({ ativo }: FeatureStatusPillProps) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${
        ativo
          ? "bg-[var(--status-success-bg)] text-[var(--status-success-fg)]"
          : "bg-[var(--status-critical-bg)] text-[var(--status-critical-fg)]"
      }`}
    >
      {ativo ? "Ativa" : "Inativa"}
    </span>
  );
}
