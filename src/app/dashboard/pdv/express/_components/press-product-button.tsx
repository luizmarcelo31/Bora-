"use client";

import { useLongPressRepeat, buzz } from "@/hooks/use-long-press";

/**
 * Botão de produto do Express: toque adiciona 1, segurar repete.
 * Teclado usa o onClick nativo (sem duplicar).
 */
export function PressProductButton({
  id,
  disabled,
  label,
  className,
  children,
  onAdd,
}: {
  id: number;
  disabled?: boolean;
  label: string;
  className?: string;
  children: React.ReactNode;
  onAdd: (id: number) => void;
}) {
  const press = useLongPressRepeat(() => {
    buzz(10);
    onAdd(id);
  });
  const { guardedClick, ...handlers } = press;
  return (
    <button
      type="button"
      disabled={disabled}
      aria-label={label}
      className={`touch-manipulation ${className ?? ""}`}
      onClick={guardedClick(() => onAdd(id))}
      {...handlers}
    >
      {children}
    </button>
  );
}
