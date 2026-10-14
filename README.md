# use-hotkeys-ts

[![npm version](https://img.shields.io/npm/v/use-hotkeys-ts)](https://www.npmjs.com/package/use-hotkeys-ts)
![TypeScript](https://img.shields.io/badge/language-TypeScript-blue)
[![License](https://img.shields.io/npm/l/use-hotkeys-ts)](./LICENSE)
[![Bundle size](https://img.shields.io/bundlejs/size/use-hotkeys-ts?externals=react&label=bundle%20size)](https://bundlejs.com/?q=use-hotkeys-ts)
[![codecov](https://codecov.io/gh/tsepakme/use-hotkeys-ts/branch/main/graph/badge.svg)](https://codecov.io/gh/tsepakme/use-hotkeys-ts)

A typed React hook for handling keyboard shortcuts and key sequences.

## Installation

```bash
npm install use-hotkeys-ts
```

or

```bash
yarn add use-hotkeys-ts
```

## Quick start

```tsx
import { useHotkeys } from 'use-hotkeys-ts';

function SaveButton() {
  useHotkeys('ctrl+s', (event) => {
    event.preventDefault();
    console.log('Saving...');
  });

  return <button>Save</button>;
}
```

## Usage

### Key combinations

Join modifier names and a key with `+`. Modifier order does not matter. The
supported modifier names are `ctrl`/`control`, `shift`, `alt`, and
`meta`/`cmd`/`command`.

```tsx
useHotkeys('ctrl+shift+s', save);
useHotkeys('shift+ctrl+s', save); // equivalent
useHotkeys('cmd+s', save); // cmd is an alias for meta
```

Pass an array to use more than one shortcut for the same callback:

```tsx
useHotkeys(['ctrl+s', 'cmd+s'], (event) => {
  event.preventDefault();
  save();
});
```

### Key sequences

Separate keys with spaces to match them in order. The optional `delay` is the
maximum time in milliseconds between sequence keys; it defaults to `1000`.

```tsx
useHotkeys('g h', goHome);
useHotkeys('g i t', openGit, 2000);
```

### Wildcard

Use `'*'` to call a handler for any single keydown event:

```tsx
useHotkeys('*', (event) => {
  console.log('Pressed:', event.key);
});
```

### Special keys

The final part of a shortcut is compared to the browser's `KeyboardEvent.key`
value, case-insensitively. For example:

```tsx
useHotkeys('f5', refresh);
useHotkeys('shift+f12', openTools);
useHotkeys('space', togglePlayback); // also matches an actual space key event
useHotkeys('enter', submit);
```

### Preventing the browser default

Call `event.preventDefault()` in the callback, or return `false`:

```tsx
useHotkeys('ctrl+s', () => {
  save();
  return false;
});
```

## API

```ts
useHotkeys(keys, callback, delay?)
```

- `keys: string | string[]` — a shortcut, a sequence, a wildcard, or an array
  of shortcuts. Use `+` between modifiers and the key, and spaces between
  sequential keys.
- `callback: (event: KeyboardEvent) => void | boolean` — called when a shortcut
  matches. Returning `false` calls `event.preventDefault()`.
- `delay?: number` — timeout between keys in a sequence, in milliseconds;
  defaults to `1000`.

## Behavior and limitations

- The hook listens for `keydown` events on `document`.
- Shortcuts are ignored when the event target is an `<input>`, except when its
  type is `button`, `submit`, `reset`, `checkbox`, `radio`, `file`, or `image`.
  They are also ignored in `<textarea>`, `<select>`, and `contenteditable` areas.
- There is no options object, `keyup` listener, DOM scope, or platform-specific
  `mod` alias yet.
- Pass non-empty shortcut strings. Empty shortcut strings are not a supported
  input; validation for malformed or empty strings is not implemented yet.

## Links

- [Live demo on CodeSandbox](https://codesandbox.io/p/sandbox/hgph7p)
- [npm package](https://www.npmjs.com/package/use-hotkeys-ts)
- [GitHub repository](https://github.com/tsepakme/use-hotkeys-ts)
