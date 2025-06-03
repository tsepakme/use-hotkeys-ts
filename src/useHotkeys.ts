import { useEffect } from "react";

export type HotkeyHandler = (e: KeyboardEvent) => void;

export function useHotkeys(keys: string | string[], callback: HotkeyHandler) {
  useEffect(() => {
    const keysArray = Array.isArray(keys) ? keys : [keys];

    const handler = (e: KeyboardEvent) => {
      const pressed = `${e.ctrlKey ? "ctrl+" : ""}${
        e.shiftKey ? "shift+" : ""
      }${e.altKey ? "alt+" : ""}${e.key.toLowerCase()}`;
      if (keysArray.includes(pressed)) {
        callback(e);
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [keys, callback]);
}
