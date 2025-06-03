type HotkeyHandler = (e: KeyboardEvent) => void;
declare function useHotkeys(keys: string | string[], callback: HotkeyHandler): void;

export { type HotkeyHandler, useHotkeys };
