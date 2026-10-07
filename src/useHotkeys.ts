import { useEffect, useRef } from "react";

export type HotkeyHandler = (e: KeyboardEvent) => void | boolean;

const MODIFIER_ORDER = ["ctrl", "shift", "alt", "meta"];

/** Normalize aliases and modifier order so equivalent shortcuts compare equally. */
function normalizeKey(key: string): string {
  const parts = key.toLowerCase().split("+").filter(Boolean).map((part) => {
    if (part === "cmd" || part === "command") return "meta";
    if (part === "control") return "ctrl";
    return part;
  });
  const keyName = parts.pop() ?? "";
  const modifiers = [...new Set(parts)].sort(
    (a, b) => MODIFIER_ORDER.indexOf(a) - MODIFIER_ORDER.indexOf(b)
  );
  return [...modifiers, keyName === " " ? "space" : keyName].join("+");
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
      k.trim().split(/\s+/).filter(Boolean).map(normalizeKey)
    );

    const longestKeyLength = Math.max(
      ...normalizedKeysArray.map((combo) => combo.length),
      0
    );

    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const contentEditableRoot = target?.closest?.("[contenteditable]");
      const isEditable = Boolean(
        target?.isContentEditable ||
          (contentEditableRoot?.getAttribute("contenteditable")?.toLowerCase() !==
            "false" &&
            contentEditableRoot)
      );
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
          isEditable)
      ) {
        sequenceRef.current = [];
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }
        return;
      }

      const modifiers = [
        e.ctrlKey && "ctrl",
        e.shiftKey && "shift",
        e.altKey && "alt",
        e.metaKey && "meta",
      ].filter((modifier): modifier is string => Boolean(modifier));
      const pressed = [
        ...modifiers,
        e.key === " " ? "space" : e.key.toLowerCase(),
      ].join("+");

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
