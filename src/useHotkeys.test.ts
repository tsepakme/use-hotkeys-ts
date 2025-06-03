import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, cleanup, act } from '@testing-library/react';
import { useHotkeys } from './useHotkeys';

describe('useHotkeys', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  
  afterEach(() => {
    cleanup();
  });
  
  it('calls the callback when the specified key is pressed', () => {
    const callback = vi.fn();
    
    const { result } = renderHook(() => useHotkeys('a', callback));
    
    act(() => {
      document.dispatchEvent(new KeyboardEvent('keydown', { 
        key: 'a',
        bubbles: true
      }));
    });
    
    expect(callback).toHaveBeenCalledTimes(1);
  });
  
  it('calls the callback when key combination is pressed', () => {
    const callback = vi.fn();
    
    const { result } = renderHook(() => useHotkeys('ctrl+s', callback));
    
    act(() => {
      document.dispatchEvent(new KeyboardEvent('keydown', { 
        key: 's',
        ctrlKey: true,
        bubbles: true
      }));
    });
    
    expect(callback).toHaveBeenCalledTimes(1);
  });

  it('does not call the callback for unmatched keys', () => {
    const callback = vi.fn();
    
    const { result } = renderHook(() => useHotkeys('a', callback));
    
    act(() => {
      document.dispatchEvent(new KeyboardEvent('keydown', { 
        key: 'b',
        bubbles: true
      }));
    });
    
    expect(callback).not.toHaveBeenCalled();
  });
});