"use client";

import * as React from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Option = { value: string; label: string };

/**
 * Radix Select controlado (value + onValueChange) para uso em
 * client components com estado próprio (PDV, dialogs com preview).
 * Quando `name` é informado, renderiza um hidden input para que o
 * valor acompanhe o FormData do Server Action.
 *
 * ## Por que `label` é obrigatório
 *
 * O `SelectTrigger` do Radix é um `<button role="combobox">`, e button não é
 * form-control nativo: um `<label>` envolvente NÃO o nomeia (o label rotula o
 * hidden input, que vem depois). Já o `placeholder` do `SelectValue` é valor
 * de estado, não rótulo — some quando há seleção, então nunca serve de nome.
 *
 * Sem `label`, leitor de tela anuncia só "caixa de combinação", que é o
 * suficiente para não saber o que está escolhendo. `tests/e2e/
 * accessible-names.spec.ts` mede isso em 28 rotas e falha sem o rótulo.
 */
export function ControlledSelect({
  value,
  onValueChange,
  options,
  placeholder = "Selecione",
  label,
  name,
  required,
  disabled,
  className,
}: {
  value: string;
  onValueChange: (value: string) => void;
  options: Option[];
  placeholder?: string;
  /** Nome acessível do campo. Obrigatório: sem ele o combobox não tem nome. */
  label: string;
  name?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <>
      <Select
        value={value}
        onValueChange={onValueChange}
        required={required}
        disabled={disabled}
      >
        <SelectTrigger className={className ?? "w-full"} aria-label={label}>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {name ? <input type="hidden" name={name} value={value} /> : null}
    </>
  );
}
