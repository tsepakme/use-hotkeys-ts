import { useEffect, useRef } from "react";

declare const process: { env: { NODE_ENV?: string } };

export type HotkeyHandler = (e: KeyboardEvent) => void | boolean;

export interface UseHotkeysOptions {
  /** Maximum time between keys in a sequence. Defaults to 1000ms. */
  delay?: number;
  /** Prevent the browser default as soon as an ambiguous shortcut is pending. */
  preventDefaultOnAmbiguous?: boolean;
}

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

interface PressedKey {
  chord: string;
  time: number;
  event: KeyboardEvent;
}

interface HotkeyRegistration {
  id: symbol;
  shortcuts: string[][];
  callback: HotkeyHandler;
  delay: number;
  preventDefaultOnAmbiguous: boolean;
  history: PressedKey[];
  sequenceTimer: ReturnType<typeof setTimeout> | null;
}

interface PendingContinuation {
  registrationId: symbol;
  shortcut: string[];
  nextIndex: number;
  lastStepTime: number;
  prefixStart: KeyboardEvent;
}

interface PendingMatch {
  id: number;
  registrationId: symbol;
  callback: HotkeyHandler;
  event: KeyboardEvent;
  delay: number;
  continuations: PendingContinuation[];
  timer: ReturnType<typeof setTimeout>;
}

const registrations = new Map<symbol, HotkeyRegistration>();
const pendingMatches = new Map<number, PendingMatch>();
let pendingMatchId = 0;
let documentKeydownHandler: ((event: KeyboardEvent) => void) | null = null;

function matchesShortcutSuffix(
  shortcut: string[],
  history: PressedKey[],
  delay: number
): boolean {
  if (shortcut.length > history.length) return false;
  const offset = history.length - shortcut.length;

  for (let index = 0; index < shortcut.length; index++) {
    const pressed = history[offset + index];
    if (!matchesChord(shortcut[index], pressed.chord)) return false;
    if (
      index > 0 &&
      pressed.time - history[offset + index - 1].time > delay
    ) {
      return false;
    }
  }

  return true;
}

function hasActiveSequencePrefix(registration: HotkeyRegistration): boolean {
  return registration.shortcuts.some((shortcut) => {
    for (
      let length = Math.min(registration.history.length, shortcut.length - 1);
      length > 0;
      length--
    ) {
      if (
        matchesShortcutSuffix(
          shortcut.slice(0, length),
          registration.history,
          registration.delay
        )
      ) {
        return true;
      }
    }
    return false;
  });
}

function updateRegistrationTimer(registration: HotkeyRegistration): void {
  if (registration.sequenceTimer) {
    clearTimeout(registration.sequenceTimer);
    registration.sequenceTimer = null;
  }

  if (!hasActiveSequencePrefix(registration)) return;
  registration.sequenceTimer = setTimeout(() => {
    registration.history = [];
    registration.sequenceTimer = null;
  }, registration.delay);
}

function clearContinuationProgress(pending: PendingMatch): void {
  for (const continuation of pending.continuations) {
    const registration = registrations.get(continuation.registrationId);
    if (!registration) continue;
    const startIndex = registration.history.findIndex(
      (key) => key.event === continuation.prefixStart
    );
    if (startIndex >= 0) {
      registration.history.splice(startIndex, 1);
      updateRegistrationTimer(registration);
    }
  }
}

function getContinuations(
  completedShortcut: string[],
  history: PressedKey[],
  delay: number
): PendingContinuation[] {
  const continuations: PendingContinuation[] = [];
  const offset = history.length - completedShortcut.length;

  for (const registration of registrations.values()) {
    for (const shortcut of registration.shortcuts) {
      const continuationDelay = Math.min(delay, registration.delay);
      if (
        shortcut.length <= completedShortcut.length ||
        !matchesShortcutSuffix(
          shortcut.slice(0, completedShortcut.length),
          history,
          continuationDelay
        ) ||
        !matchesShortcutSuffix(
          shortcut.slice(0, completedShortcut.length),
          registration.history,
          continuationDelay
        )
      ) {
        continue;
      }

      continuations.push({
        registrationId: registration.id,
        shortcut,
        nextIndex: completedShortcut.length,
        lastStepTime: history[offset + completedShortcut.length - 1].time,
        prefixStart: history[offset].event,
      });
    }
  }

  return continuations;
}

function clearPendingMatch(pending: PendingMatch): void {
  clearTimeout(pending.timer);
  pendingMatches.delete(pending.id);
}

function invokePendingMatch(pending: PendingMatch): void {
  clearPendingMatch(pending);
  pending.callback(pending.event);
}

function startPendingMatch(
  registration: HotkeyRegistration,
  continuations: PendingContinuation[],
  event: KeyboardEvent
): void {
  if (registration.preventDefaultOnAmbiguous) {
    event.preventDefault();
  }

  const id = ++pendingMatchId;
  const pending: PendingMatch = {
    id,
    registrationId: registration.id,
    callback: registration.callback,
    event,
    delay: registration.delay,
    continuations,
    timer: setTimeout(() => {
      if (!pendingMatches.has(id)) return;
      clearContinuationProgress(pending);
      invokePendingMatch(pending);
    }, registration.delay),
  };
  pendingMatches.set(id, pending);
}

function resetAllSequenceHistory(): void {
  for (const registration of registrations.values()) {
    registration.history = [];
    if (registration.sequenceTimer) {
      clearTimeout(registration.sequenceTimer);
      registration.sequenceTimer = null;
    }
  }
}

function isEditableTarget(event: KeyboardEvent): boolean {
  const target = event.target as HTMLElement | null;
  const contentEditableRoot = target?.closest?.("[contenteditable]");
  const isEditable = Boolean(
    target?.isContentEditable ||
      (contentEditableRoot?.getAttribute("contenteditable")?.toLowerCase() !==
        "false" &&
        contentEditableRoot)
  );

  return Boolean(
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
  );
}

function processPendingMatches(
  event: KeyboardEvent,
  pressedChord: string,
  eventTime: number
): void {
  for (const pending of [...pendingMatches.values()]) {
    if (!pendingMatches.has(pending.id)) continue;
    const survivingContinuations: PendingContinuation[] = [];
    let longerShortcutCompleted = false;

    for (const continuation of pending.continuations) {
      const registration = registrations.get(continuation.registrationId);
      if (!registration) continue;

      if (
        eventTime - continuation.lastStepTime >
          Math.min(pending.delay, registration.delay) ||
        !matchesChord(
          continuation.shortcut[continuation.nextIndex],
          pressedChord
        )
      ) {
        continue;
      }

      const nextIndex = continuation.nextIndex + 1;
      if (nextIndex === continuation.shortcut.length) {
        longerShortcutCompleted = true;
        break;
      }

      survivingContinuations.push({
        ...continuation,
        nextIndex,
        lastStepTime: eventTime,
      });
    }

    if (longerShortcutCompleted) {
      clearPendingMatch(pending);
      continue;
    }

    if (survivingContinuations.length === 0) {
      clearContinuationProgress(pending);
      invokePendingMatch(pending);
      continue;
    }

    clearTimeout(pending.timer);
    pending.continuations = survivingContinuations;
    pending.timer = setTimeout(() => {
      if (!pendingMatches.has(pending.id)) return;
      clearContinuationProgress(pending);
      invokePendingMatch(pending);
    }, pending.delay);
  }
}

function handleDocumentKeydown(event: KeyboardEvent): void {
  if (isEditableTarget(event)) {
    for (const pending of [...pendingMatches.values()]) {
      if (pendingMatches.has(pending.id)) invokePendingMatch(pending);
    }
    resetAllSequenceHistory();
    return;
  }

  const pressedChord = [
    event.ctrlKey && "ctrl",
    event.shiftKey && "shift",
    event.altKey && "alt",
    event.metaKey && "meta",
    event.key === " " ? "space" : event.key.toLowerCase(),
  ]
    .filter(Boolean)
    .join("+");
  const eventTime = Date.now();

  processPendingMatches(event, pressedChord, eventTime);

  const histories = new Map<symbol, PressedKey[]>();
  for (const registration of registrations.values()) {
    const maxLength = Math.max(
      ...registration.shortcuts.map((shortcut) => shortcut.length)
    );
    const history = [
      ...registration.history,
      { chord: pressedChord, time: eventTime, event },
    ].slice(-maxLength);
    registration.history = history;
    histories.set(registration.id, history);
    updateRegistrationTimer(registration);
  }

  for (const registration of registrations.values()) {
    const history = histories.get(registration.id);
    if (!history) continue;
    const matchedShortcuts = registration.shortcuts.filter((shortcut) =>
      matchesShortcutSuffix(shortcut, history, registration.delay)
    );
    if (matchedShortcuts.length === 0) continue;

    const immediateMatch = matchedShortcuts.some(
      (shortcut) =>
        getContinuations(shortcut, history, registration.delay).length === 0
    );

    if (immediateMatch) {
      const result = registration.callback(event);
      if (result === false) event.preventDefault();
      continue;
    }

    const ambiguousMatches = matchedShortcuts.flatMap((shortcut) =>
      getContinuations(shortcut, history, registration.delay).map(
        (continuation) => ({ shortcut, continuation })
      )
    );
    if (ambiguousMatches.length === 0) continue;

    startPendingMatch(
      registration,
      ambiguousMatches.map(({ continuation }) => continuation),
      event
    );
  }
}

function attachDocumentListener(): void {
  if (documentKeydownHandler) return;
  documentKeydownHandler = handleDocumentKeydown;
  document.addEventListener("keydown", documentKeydownHandler);
}

function detachDocumentListener(): void {
  if (!documentKeydownHandler) return;
  document.removeEventListener("keydown", documentKeydownHandler);
  documentKeydownHandler = null;
  resetAllSequenceHistory();
}

function registerHotkeys(
  registration: Omit<HotkeyRegistration, "id" | "history" | "sequenceTimer">
): () => void {
  const id = Symbol("useHotkeys registration");
  registrations.set(id, {
    ...registration,
    id,
    history: [],
    sequenceTimer: null,
  });
  attachDocumentListener();

  return () => {
    const removedRegistration = registrations.get(id);
    if (removedRegistration) {
      removedRegistration.history = [];
      if (removedRegistration.sequenceTimer) {
        clearTimeout(removedRegistration.sequenceTimer);
      }
    }
    registrations.delete(id);
    for (const pending of [...pendingMatches.values()]) {
      if (pending.registrationId === id) {
        clearPendingMatch(pending);
        continue;
      }

      pending.continuations = pending.continuations.filter(
        (continuation) => continuation.registrationId !== id
      );
      if (pending.continuations.length === 0) invokePendingMatch(pending);
    }

    if (registrations.size === 0) {
      for (const pending of [...pendingMatches.values()]) {
        clearPendingMatch(pending);
      }
      detachDocumentListener();
    }
  };
}

export function useHotkeys(
  keys: string | string[],
  callback: HotkeyHandler,
  delayOrOptions: number | UseHotkeysOptions = 1000,
  additionalOptions: Pick<UseHotkeysOptions, "preventDefaultOnAmbiguous"> = {}
) {
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  const delay =
    typeof delayOrOptions === "number"
      ? delayOrOptions
      : delayOrOptions.delay ?? 1000;
  const preventDefaultOnAmbiguous =
    typeof delayOrOptions === "number"
      ? additionalOptions.preventDefaultOnAmbiguous ?? false
      : delayOrOptions.preventDefaultOnAmbiguous ?? false;

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

    return registerHotkeys({
      shortcuts: validKeysArray,
      callback: (event) => callbackRef.current(event),
      delay,
      preventDefaultOnAmbiguous,
    });
  }, [keys, delay, preventDefaultOnAmbiguous]);
}
