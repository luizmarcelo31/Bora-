"use client";

import * as React from "react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

export function SwitchField({
  name,
  defaultChecked = false,
  label,
}: {
  name: string;
  defaultChecked?: boolean;
  label: string;
}) {
  const [checked, setChecked] = React.useState(defaultChecked);

  return (
    <div className="flex items-center gap-2">
      <Switch checked={checked} onCheckedChange={setChecked} id={name} />
      <Label htmlFor={name} className="text-sm font-normal cursor-pointer">
        {label}
      </Label>
      <input type="hidden" name={name} value={checked ? "on" : ""} />
    </div>
  );
}
