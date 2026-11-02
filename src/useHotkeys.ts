import { useEffect, useRef } from "react";

declare const process: { env: { NODE_ENV?: string } };

export type HotkeyHandler = (e: KeyboardEvent) => void | boolean;

const MODIFIER_ORDER = ["ctrl", "shift", "alt", "meta"];
const MODIFIERS = new Set([
  "ctrl",
  "control",
  "shift",
  "alt",
  "meta",
  "cmd",
  "command",
]);

/** Normalize a chord, returning null when its syntax is invalid. */
function normalizeKey(key: string): string | null {
  const rawParts = key.toLowerCase().split("+");
  if (rawParts.some((part) => part.trim() === "")) return null;

  const parts = rawParts.map((part) => {
    part = part.trim();
    if (part === "cmd" || part === "command") return "meta";
    if (part === "control") return "ctrl";
    return part;
  });
  const keyName = parts.pop() ?? "";
  if (!keyName || MODIFIERS.has(keyName)) return null;
  if (keyName === "*" && parts.length > 0) return null;
  if (parts.some((part) => !MODIFIERS.has(part))) return null;

  const modifiers = [...new Set(parts)].sort(
    (a, b) => MODIFIER_ORDER.indexOf(a) - MODIFIER_ORDER.indexOf(b)
  );
  return [...modifiers, keyName === " " ? "space" : keyName].join("+");
}

function matchesChord(shortcutChord: string, pressedChord: string): boolean {
  return shortcutChord === "*" || shortcutChord === pressedChord;
}

function getLongestPrefixSuffixLength(
  history: string[],
  shortcuts: string[][]
): number {
  let longestMatch = 0;

  for (const shortcut of shortcuts) {
    const maxLength = Math.min(history.length, shortcut.length - 1);
    for (let length = maxLength; length > longestMatch; length--) {
      const matchesPrefix = shortcut
        .slice(0, length)
        .every((chord, index) =>
          matchesChord(chord, history[history.length - length + index])
        );

      if (matchesPrefix) {
        longestMatch = length;
        break;
      }
    }
  }

  return longestMatch;
}

export function useHotkeys(
  keys: string | string[],
  callback: HotkeyHandler,
  delay: number = 1000
) {
  const sequenceRef = useRef<string[]>([]);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  useEffect(() => {
    const keysArray = Array.isArray(keys) ? keys : [keys];
    const validKeysArray: string[][] = [];
    for (const shortcut of keysArray) {
      const trimmedShortcut = shortcut.trim();
      if (!trimmedShortcut) continue;

      const combo = trimmedShortcut.split(/\s+/).map(normalizeKey);
      if (combo.some((key) => key === null)) {
        if (process.env.NODE_ENV !== "production") {
          console.warn(
            `useHotkeys: Ignoring invalid shortcut "${shortcut}".`
          );
        }
        continue;
      }

      validKeysArray.push(combo as string[]);
    }
    if (validKeysArray.length === 0) return;

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

      const history = [...sequenceRef.current, pressed];
      const matched = validKeysArray.some(
        (combo) =>
          combo.length <= history.length &&
          combo.every((key, index) =>
            matchesChord(key, history[history.length - combo.length + index])
          )
      );
      const prefixLength = getLongestPrefixSuffixLength(
        history,
        validKeysArray
      );
      sequenceRef.current = prefixLength
        ? history.slice(-prefixLength)
        : [];

      if (matched) {
        const result = callbackRef.current(e);
        if (result === false) {
          e.preventDefault();
        }
      }

      if (sequenceRef.current.length > 0) {
        timeoutRef.current = setTimeout(() => {
          sequenceRef.current = [];
          timeoutRef.current = null;
        }, delay);
      }
    };

    document.addEventListener("keydown", handler);
    return () => {
      document.removeEventListener("keydown", handler);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      sequenceRef.current = [];
    };
  }, [keys, delay]);
}
