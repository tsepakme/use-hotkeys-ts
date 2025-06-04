import '@testing-library/jest-dom';
import { vi } from 'vitest';

vi.mock('react', async () => {
  const actual = await vi.importActual('react');
  return {
    ...actual,
    useRef: <T>(initialValue: T) => ({ current: initialValue }),
    useEffect: (callback: () => void | (() => void), deps?: any[]) => callback(),
  };
});