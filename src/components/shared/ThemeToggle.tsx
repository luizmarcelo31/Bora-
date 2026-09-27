"use client";

import { useSyncExternalStore } from "react";
import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";

function useMontado() {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );
}

/** Alternador claro/escuro (next-themes, classe `.dark`). */
export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const montado = useMontado();

  const dark = montado && resolvedTheme === "dark";
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className="size-8"
      onClick={() => setTheme(dark ? "light" : "dark")}
      aria-label={dark ? "Mudar para tema claro" : "Mudar para tema escuro"}
      title={dark ? "Tema claro" : "Tema escuro"}
    >
      {dark ? <Sun className="size-4" /> : <Moon className="size-4" />}
    </Button>
  );
}
