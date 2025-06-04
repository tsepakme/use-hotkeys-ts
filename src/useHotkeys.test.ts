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
    if (handlers.length === 0) throw new Error('No handlers registered');
    
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

  it('callsthe callback when key combination with function keys is pressed', () => {
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
});