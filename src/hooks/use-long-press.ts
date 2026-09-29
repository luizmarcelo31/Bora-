"use client";

import { useEffect, useRef } from "react";

/**
 * Segurar repete a ação (balcão, 300/dia). Toque simples continua
 * pelo onClick nativo do botão (teclado incluso); o click disparado
 * após repetição é consumido sem efeito.
 */
export function useLongPressRepeat(onRepeat: () => void, delayMs = 500, intervalMs = 300) {
  const timers = useRef<{ start?: number; repeat?: number }>({});
  const repeated = useRef(false);
  useEffect(
    () => () => {
      window.clearTimeout(timers.current.start);
      window.clearInterval(timers.current.repeat);
    },
    []
  );

  function clear() {
    window.clearTimeout(timers.current.start);
    window.clearInterval(timers.current.repeat);
    timers.current.repeat = undefined;
  }

  return {
    onPointerDown: () => {
      repeated.current = false;
      timers.current.start = window.setTimeout(() => {
        repeated.current = true;
        onRepeat();
        timers.current.repeat = window.setInterval(onRepeat, intervalMs);
      }, delayMs);
    },
    onPointerUp: clear,
    onPointerLeave: clear,
    onPointerCancel: clear,
    onContextMenu: (e: React.MouseEvent) => e.preventDefault(),
    /** Espalhe no onClick existente: ignora o click pós-repetição. */
    guardedClick: (fn: () => void) => () => {
      if (repeated.current) {
        repeated.current = false;
        return;
      }
      fn();
    },
  };
}

export function buzz(ms = 15) {
  try {
    navigator.vibrate?.(ms);
  } catch {
    /* sem vibração neste aparelho */
  }
}
