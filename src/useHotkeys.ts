import { useEffect, useRef } from "react";

export type HotkeyHandler = (e: KeyboardEvent) => void | boolean;

/** Normalize key string for comparison: cmd/command → meta (macOS compatibility). */
function normalizeKey(key: string): string {
  return key
    .toLowerCase()
    .replace(/\bcmd\b/g, "meta")
    .replace(/\bcommand\b/g, "meta");
}

export function useHotkeys(
  keys: string | string[],
  callback: HotkeyHandler,
  delay: number = 1000
) {
  const sequenceRef = useRef<string[]>([]);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const keysArray = Array.isArray(keys) ? keys : [keys];
    if (keysArray.length === 0) return; // Handle empty keys array

    const normalizedKeysArray = keysArray.map((k) =>
      k.includes(" ") ? k.split(" ") : [k]
    );

    const longestKeyLength = Math.max(
      ...normalizedKeysArray.map((combo) => combo.length),
      0
    );

    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        target &&
        ((target.tagName === "INPUT" &&
          ![
            "button",
            "submit",
            "reset",
            "checkbox",
            "radio",
            "file",
            "image",
          ].includes((target as HTMLInputElement).type)) ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT" ||
          target.getAttribute("contenteditable") === "true")
      ) {
        return;
      }

      const pressed = `${e.ctrlKey ? "ctrl+" : ""}${
        e.shiftKey ? "shift+" : ""
      }${e.altKey ? "alt+" : ""}${
        e.metaKey ? "meta+" : ""
      }${e.key === " " ? "space" : e.key.toLowerCase()}`;

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      sequenceRef.current.push(pressed);

      if (sequenceRef.current.length > longestKeyLength) {
        sequenceRef.current.shift();
      }

      const matched = normalizedKeysArray.some(
        (combo) =>
          combo.length === sequenceRef.current.length &&
          combo.every(
            (key, i) =>
              normalizeKey(key) === sequenceRef.current[i].toLowerCase()
          )
      );

      if (matched) {
        const result = callback(e);
        if (result === false) {
          e.preventDefault();
        }
        sequenceRef.current = [];
        return;
      }

      timeoutRef.current = setTimeout(() => {
        sequenceRef.current = [];
      }, delay);
    };

    document.addEventListener("keydown", handler);
    return () => {
      document.removeEventListener("keydown", handler);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [keys, callback, delay]);
}