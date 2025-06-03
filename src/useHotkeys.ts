import { useEffect } from "react";

export type HotkeyHandler = (e: KeyboardEvent) => void;

export function useHotkeys(keys: string | string[], callback: HotkeyHandler) {
  useEffect(() => {
    const keysArray = Array.isArray(keys) ? keys : [keys];

    const handler = (e: KeyboardEvent) => {
      const pressed = `${e.ctrlKey ? "ctrl+" : ""}${
        e.shiftKey ? "shift+" : ""
      }${e.altKey ? "alt+" : ""}${e.metaKey ? "meta+" : ""}${e.key.toLowerCase()}`;
      
      if (keysArray.some(combo => combo.toLowerCase() === pressed)) {
        callback(e);
      }
    };

    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [keys, callback]);
}
