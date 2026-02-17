# use-hotkeys-ts

[![npm version](https://img.shields.io/npm/v/use-hotkeys-ts)](https://www.npmjs.com/package/use-hotkeys-ts)
![TypeScript](https://img.shields.io/badge/language-TypeScript-blue)
[![License](https://img.shields.io/npm/l/use-hotkeys-ts)](./LICENSE)
[![Bundle Size](https://img.shields.io/bundlephobia/minzip/use-hotkeys-ts)](https://bundlephobia.com/package/use-hotkeys-ts)
[![codecov](https://codecov.io/gh/tsepakme/use-hotkeys-ts/branch/main/graph/badge.svg)](https://codecov.io/gh/tsepakme/use-hotkeys-ts)


A fully typed React hook for handling keyboard shortcuts and hotkeys with ease.

### Key Sequences

You can now use key sequences - combinations of keys pressed one after another:

```ts
// Detecting "g" followed by "h"
useHotkeys('g h', () => {
  console.log('Redirecting to home page');
});

// With custom delay (default is 1000ms)
useHotkeys('g i t', () => {
  console.log('Git command');
}, 2000); // 2 second timeout
```

### Improved Function Key Support

Function keys are now fully supported with better case handling:

```ts
useHotkeys('shift+f12', () => {
  console.log('Open developer tools');
});
```

## Installation

```bash
npm install use-hotkeys-ts
```

or 

```bash
yarn add use-hotkeys-ts
```

## Quick Start

```ts
import { useHotkeys } from 'use-hotkeys-ts';

useHotkeys('ctrl+s', (e) => {
  e.preventDefault();
  console.log('Saving...');
});
```

## Usage Examples

### Multiple Key Combinations

Use an array to match several shortcuts. On macOS, `cmd` and `meta` are equivalent (e.g. `cmd+s` matches ⌘+S):

```ts
useHotkeys(['ctrl+s', 'cmd+s'], (e) => {
  e.preventDefault();
  console.log('Save triggered');
});
```

### Special and Function Keys

```ts
useHotkeys('f5', () => {
  console.log('Page refresh');
});

useHotkeys('/', () => {
  console.log('Focus search');
});
```

### Integration with react-hook-form

```ts
const { handleSubmit } = useForm();

useHotkeys('ctrl+enter', () => {
  handleSubmit(onSubmit)();
});
```

### Callback return value

Return `false` from the callback to call `event.preventDefault()`:

```ts
useHotkeys('ctrl+s', (e) => {
  console.log('Saving...');
  return false; // prevents default browser save
});
```

## API

- **`useHotkeys(keys, callback, delay?)`**
  - `keys`: `string | string[]` — key combo(s), e.g. `'ctrl+s'`, `['ctrl+s', 'cmd+s']`, or a sequence like `'g h'`.
  - `callback`: `(e: KeyboardEvent) => void | boolean` — called when the shortcut matches. Return `false` to call `e.preventDefault()`.
  - `delay`: `number` (optional, default `1000`) — timeout in ms for key sequences (e.g. `'g i'`).

Hotkeys are ignored when focus is inside `<input>`, `<textarea>`, `<select>`, or `contenteditable` (except types like button, submit, checkbox, radio).

## Features

✅ Multiple key combinations

✅ Key sequences (e.g. `g i` then `t`)

✅ Full TypeScript support

✅ macOS / Windows: `cmd` and `meta` both work

✅ Ignores form elements and contenteditable

✅ Easy integration with forms and UI frameworks

## Future Plans

- Options: keydown/keyup, ignoreModifiers
- Scope restriction via ref (limit hotkey to a DOM node)
- Auto-detection of platform (ctrl vs cmd)

- Global mode for background hotkeys

- Dev/debug mode

- Logging and telemetry support

- Storybook demo support

## Links

- [Live Demo on CodeSandbox](https://codesandbox.io/p/sandbox/hgph7p)
- [npm page](https://www.npmjs.com/package/use-hotkeys-ts)
- [GitHub repository](https://github.com/tsepakme/use-hotkeys-ts)