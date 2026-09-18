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

export function SelectField({
  name,
  defaultValue = "",
  placeholder = "Selecione",
  options,
  required,
}: {
  name: string;
  defaultValue?: string;
  placeholder?: string;
  options: Option[];
  required?: boolean;
}) {
  const [value, setValue] = React.useState(defaultValue);

  return (
    <>
      <Select value={value} onValueChange={setValue} required={required}>
        <SelectTrigger className="w-full">
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
      <input type="hidden" name={name} value={value} />
    </>
  );
}
