import { useEffect, useRef } from "react";

export type HotkeyHandler = (e: KeyboardEvent) => void;

export function useHotkeys(
  keys: string | string[],
  callback: HotkeyHandler,
  delay: number = 1000
) {
  const sequenceRef = useRef<string[]>([]);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const keysArray = Array.isArray(keys) ? keys : [keys];

    const normalizedKeysArray = keysArray.map((k) =>
      k.includes(" ") ? k.split(" ") : [k]
    );

    const longestKeyLength = Math.max(
      ...normalizedKeysArray.map((combo) => combo.length)
    );

    const handler = (e: KeyboardEvent) => {
      const pressed = `${e.ctrlKey ? "ctrl+" : ""}${
        e.shiftKey ? "shift+" : ""
      }${e.altKey ? "alt+" : ""}${
        e.metaKey ? "meta+" : ""
      }${e.key.toLowerCase()}`;

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      sequenceRef.current = sequenceRef.current || [];

      sequenceRef.current.push(pressed);

      if (sequenceRef.current.length > longestKeyLength) {
        sequenceRef.current.shift();
      }

      const matched = normalizedKeysArray.some(
        (combo) =>
          combo.length === sequenceRef.current.length &&
          combo.every((key, i) => key.toLowerCase() === sequenceRef.current[i])
      );

      if (matched) {
        callback(e);
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
