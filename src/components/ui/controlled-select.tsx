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
 */
export function ControlledSelect({
  value,
  onValueChange,
  options,
  placeholder = "Selecione",
  name,
  required,
  disabled,
  className,
}: {
  value: string;
  onValueChange: (value: string) => void;
  options: Option[];
  placeholder?: string;
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
        <SelectTrigger className={className ?? "w-full"}>
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
