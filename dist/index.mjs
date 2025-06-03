// src/useHotkeys.ts
import { useEffect } from "react";
function useHotkeys(keys, callback) {
  useEffect(() => {
    const keysArray = Array.isArray(keys) ? keys : [keys];
    const handler = (e) => {
      const pressed = `${e.ctrlKey ? "ctrl+" : ""}${e.shiftKey ? "shift+" : ""}${e.altKey ? "alt+" : ""}${e.key.toLowerCase()}`;
      if (keysArray.includes(pressed)) {
        callback(e);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [keys, callback]);
}
export {
  useHotkeys
};
