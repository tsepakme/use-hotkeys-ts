import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useHotkeys } from './useHotkeys';

describe('useHotkeys', () => {
  interface MockKeyboardEvent {
    key: string;
    preventDefault: () => void;
    stopPropagation: () => void;
    ctrlKey: boolean;
    shiftKey: boolean;
    altKey: boolean;
    metaKey: boolean;
    [key: string]: any;
  }

  type KeyboardEventHandler = (event: MockKeyboardEvent) => void;

  let handlers: KeyboardEventHandler[] = [];
  
  beforeEach(() => {
    vi.clearAllMocks();
    handlers = [];
    document.addEventListener = vi.fn((eventType, eventHandler) => {
      if (eventType === 'keydown') {
        handlers.push(eventHandler);
      }
    });
    document.removeEventListener = vi.fn();
  });
  
  afterEach(() => {
    vi.restoreAllMocks();
  });
  
  const simulateKeyPress = (key: string, options: Partial<MockKeyboardEvent> = {}): MockKeyboardEvent => {
    const event: MockKeyboardEvent = {
      key,
      preventDefault: vi.fn(),
      stopPropagation: vi.fn(),
      ctrlKey: false,
      shiftKey: false,
      altKey: false,
      metaKey: false,
      ...options
    };
    
    if (handlers.length === 0) {
      console.warn('Warning: No handlers registered when simulating key press');
      return event;
    }
    
    handlers.forEach(handler => handler(event));
    
    return event;
  };
  
  it('calls the callback when the specified key is pressed', () => {
    const callback = vi.fn();
    renderHook(() => useHotkeys('a', callback));
    simulateKeyPress('a');
    expect(callback).toHaveBeenCalledTimes(1);
  });

  it("calls the callback when function keys are pressed", () => {
    const callback1 = vi.fn();
    renderHook(() => useHotkeys("f1", callback1));
    simulateKeyPress("F1");
    expect(callback1).toHaveBeenCalledTimes(1);

    const callback5 = vi.fn();
    renderHook(() => useHotkeys("f5", callback5));
    simulateKeyPress("F5");
    expect(callback5).toHaveBeenCalledTimes(1);

    const callback12 = vi.fn();
    renderHook(() => useHotkeys("f12", callback12));
    simulateKeyPress("F12");
    expect(callback12).toHaveBeenCalledTimes(1);
  });

  it('calls the callback when key combination is pressed', () => {
    const callback = vi.fn();
    renderHook(() => useHotkeys('ctrl+s', callback));
    simulateKeyPress('s', { ctrlKey: true });
    expect(callback).toHaveBeenCalledTimes(1);
  });

  it('matches modifier combinations regardless of their written order', () => {
    const callback = vi.fn();
    renderHook(() => useHotkeys('shift+ctrl+s', callback));
    simulateKeyPress('s', { ctrlKey: true, shiftKey: true });
    expect(callback).toHaveBeenCalledTimes(1);
  });

  it('calls the callback when metaKey combination pressed', () => {
    const callback = vi.fn();
    renderHook(() => useHotkeys('meta+space', callback));
    simulateKeyPress('space', { metaKey: true });
    expect(callback).toHaveBeenCalledTimes(1);
  });

  it('matches cmd as meta (macOS compatibility)', () => {
    const callback = vi.fn();
    renderHook(() => useHotkeys('cmd+s', callback));
    simulateKeyPress('s', { metaKey: true });
    expect(callback).toHaveBeenCalledTimes(1);
  });

  it('calls the callback when key combination with function keys is pressed', () => {
    const callback5 = vi.fn();
    renderHook(() => useHotkeys('ctrl+f5', callback5));
    simulateKeyPress('F5', { ctrlKey: true });
    expect(callback5).toHaveBeenCalledTimes(1);

    const callback12 = vi.fn();
    renderHook(() => useHotkeys('shift+f12', callback12));
    simulateKeyPress('F12', { shiftKey: true });
    expect(callback12).toHaveBeenCalledTimes(1);
  });

  it('does not call the callback for unmatched keys', () => {
    const callback = vi.fn();
    renderHook(() => useHotkeys('a', callback));
    simulateKeyPress('b');
    expect(callback).not.toHaveBeenCalled();
  });

  it('detects a simple key sequence', () => {
    const callback = vi.fn();
    renderHook(() => useHotkeys('g i', callback));
    simulateKeyPress('g');
    simulateKeyPress('i');
    expect(callback).toHaveBeenCalledTimes(1);
  });

  it('recognizes a real space key event in a sequence', () => {
    const callback = vi.fn();
    renderHook(() => useHotkeys('g space', callback));
    simulateKeyPress('g');
    simulateKeyPress(' ');
    expect(callback).toHaveBeenCalledTimes(1);
  });

  it('resets the sequence after successful match', () => {
    const callback = vi.fn();
    renderHook(() => useHotkeys('g i', callback));
    simulateKeyPress('g');
    simulateKeyPress('i');
    expect(callback).toHaveBeenCalledTimes(1);
    simulateKeyPress('g');
    simulateKeyPress('i');
    expect(callback).toHaveBeenCalledTimes(2);
  });

  it('handles multiple key sequences with different lengths', () => {
    const callbackShort = vi.fn();
    const callbackLong = vi.fn();
    
    renderHook(() => useHotkeys('g i', callbackShort));
    renderHook(() => useHotkeys('h i t', callbackLong));
    
    simulateKeyPress('g');
    simulateKeyPress('i');
    
    expect(callbackShort).toHaveBeenCalledTimes(1);
    expect(callbackLong).not.toHaveBeenCalled();
    
    callbackShort.mockClear();
    
    simulateKeyPress('h');
    simulateKeyPress('i');
    simulateKeyPress('t');
    
    expect(callbackLong).toHaveBeenCalledTimes(1);
    expect(callbackShort).not.toHaveBeenCalled();
  });

  it('clears the sequence after timeout', async () => {
    vi.useFakeTimers();
    const callback = vi.fn();
    renderHook(() => useHotkeys('g i', callback, 500));
    simulateKeyPress('g');
    vi.advanceTimersByTime(600);
    simulateKeyPress('i');
    expect(callback).not.toHaveBeenCalled();
    vi.useRealTimers();
  });

  it('registers event listeners', () => {
    renderHook(() => useHotkeys('a', vi.fn()));
    expect(document.addEventListener).toHaveBeenCalledWith('keydown', expect.any(Function));
  });

  it("does not trigger hotkey callback inside form elements", () => {
    const callback = vi.fn();
    renderHook(() => useHotkeys("a", callback));

    const elements = [
      document.createElement("input"),
      document.createElement("textarea"),
      document.createElement("select"),
      (() => {
        const div = document.createElement("div");
        div.setAttribute("contenteditable", "true");
        return div;
      })(),
    ];

    for (const el of elements) {
      simulateKeyPress("a", { target: el });
      expect(callback).not.toHaveBeenCalled();
      callback.mockClear();
    }
  });

  it('resets a partial sequence when a key is pressed in an editable element', () => {
    const callback = vi.fn();
    renderHook(() => useHotkeys('g i', callback));

    simulateKeyPress('g');
    simulateKeyPress('i', { target: document.createElement('input') });
    simulateKeyPress('i');

    expect(callback).not.toHaveBeenCalled();
  });

  it('ignores descendants of contenteditable elements', () => {
    const callback = vi.fn();
    renderHook(() => useHotkeys('a', callback));
    const editor = document.createElement('div');
    editor.setAttribute('contenteditable', 'true');
    const child = document.createElement('span');
    editor.appendChild(child);

    simulateKeyPress('a', { target: child });

    expect(callback).not.toHaveBeenCalled();
  });

  it("handles empty keys array", () => {
    const callback = vi.fn();
    renderHook(() => useHotkeys([], callback));
    simulateKeyPress("a");
    expect(callback).not.toHaveBeenCalled();
  });

  it("handles undefined target", () => {
    const callback = vi.fn();
    renderHook(() => useHotkeys("a", callback));
    simulateKeyPress("a", { target: undefined });
    expect(callback).toHaveBeenCalledTimes(1);
  });

  it("removes event listeners on unmount", () => {
    const callback = vi.fn();
    const { unmount } = renderHook(() => useHotkeys("a", callback));

    unmount();

    expect(document.removeEventListener).toHaveBeenCalledWith(
      "keydown",
      expect.any(Function)
    );
  });

  it("handles complex key sequences", () => {
    const callback = vi.fn();
    renderHook(() => useHotkeys("g i t space c o m m i t", callback));

    simulateKeyPress("g");
    simulateKeyPress("i");
    simulateKeyPress("t");
    simulateKeyPress(" ");
    simulateKeyPress("c");
    simulateKeyPress("o");
    simulateKeyPress("m");
    simulateKeyPress("m");
    simulateKeyPress("i");
    simulateKeyPress("t");

    expect(callback).toHaveBeenCalledTimes(1);
  });

  it("resets sequence on wrong key", () => {
    const callback = vi.fn();
    renderHook(() => useHotkeys("g i t", callback));

    simulateKeyPress("g");
    simulateKeyPress("i");
    simulateKeyPress("x");
    simulateKeyPress("t");

    expect(callback).not.toHaveBeenCalled();
  });

  it("handles key combination followed by sequence", () => {
    const callback = vi.fn();
    renderHook(() => useHotkeys("ctrl+k g", callback));

    simulateKeyPress("k", { ctrlKey: true });
    simulateKeyPress("g");

    expect(callback).toHaveBeenCalledTimes(1);
  });

  it("prevents default when callback returns false", () => {
    const callback = vi.fn().mockReturnValue(false);
    renderHook(() => useHotkeys("a", callback));

    const event = simulateKeyPress("a");

    expect(callback).toHaveBeenCalledTimes(1);
    expect(event.preventDefault).toHaveBeenCalled();
  });

  it("does not trigger on specific input types", () => {
    const callback = vi.fn();
    renderHook(() => useHotkeys("a", callback));

    const inputTypes = [
      "text",
      "password",
      "number",
      "email",
      "tel",
      "url",
      "search",
      "date",
      "datetime-local",
      "month",
      "week",
      "time",
      "color",
    ];

    for (const type of inputTypes) {
      const input = document.createElement("input");
      input.type = type;

      simulateKeyPress("a", { target: input });
      expect(callback).not.toHaveBeenCalled();
      callback.mockClear();
    }
  });

  it("triggers on non-editable input types", () => {
    const callback = vi.fn();
    renderHook(() => useHotkeys("a", callback));

    const nonEditableTypes = [
      "button",
      "submit",
      "reset",
      "checkbox",
      "radio",
      "file",
      "image",
    ];

    for (const type of nonEditableTypes) {
      const input = document.createElement("input");
      input.type = type;

      simulateKeyPress("a", { target: input });
      expect(callback).toHaveBeenCalledTimes(1);
      callback.mockClear();
    }
  });

  it("clears timeout on unmount", () => {
    vi.useFakeTimers();

    const mockSetTimeout = vi.fn().mockReturnValue(123); // Return a fake timer ID
    const mockClearTimeout = vi.fn();

    const origSetTimeout = window.setTimeout;
    const origClearTimeout = window.clearTimeout;

    window.setTimeout = mockSetTimeout;
    window.clearTimeout = mockClearTimeout;

    const callback = vi.fn();

    const { unmount } = renderHook(() => useHotkeys("g i", callback, 500));

    simulateKeyPress("g");

    expect(mockSetTimeout).toHaveBeenCalledWith(expect.any(Function), 500);

    unmount();

    expect(mockClearTimeout).toHaveBeenCalled();

    window.setTimeout = origSetTimeout;
    window.clearTimeout = origClearTimeout;

    vi.useRealTimers();
  });

  it("handles multiple modifiers", () => {
    const callback = vi.fn();
    renderHook(() => useHotkeys("ctrl+shift+alt+s", callback));

    simulateKeyPress("s", {
      ctrlKey: true,
      shiftKey: true,
      altKey: true,
    });

    expect(callback).toHaveBeenCalledTimes(1);
  });

  it("is case insensitive for regular keys", () => {
    const callback = vi.fn();
    renderHook(() => useHotkeys("a", callback));

    simulateKeyPress("A");

    expect(callback).toHaveBeenCalledTimes(1);
  });
});
