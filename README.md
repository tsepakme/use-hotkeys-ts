# use-hotkeys-ts

[![npm version](https://img.shields.io/npm/v/use-hotkeys-ts)](https://www.npmjs.com/package/use-hotkeys-ts)
![TypeScript](https://img.shields.io/badge/language-TypeScript-blue)
[![License](https://img.shields.io/npm/l/use-hotkeys-ts)](./LICENSE)
[![Bundle size](https://img.shields.io/bundlejs/size/use-hotkeys-ts?externals=react&label=bundle%20size)](https://bundlejs.com/?q=use-hotkeys-ts)
[![codecov](https://codecov.io/gh/tsepakme/use-hotkeys-ts/branch/main/graph/badge.svg)](https://codecov.io/gh/tsepakme/use-hotkeys-ts)
[![XERJ Corpus Hub contributor](https://hub.xerj.org/contributors/tsepakme/badge.svg)](https://hub.xerj.org/contributors/tsepakme)

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

Join modifier names and a key with `+`. Modifier order does not matter, and
pressed modifiers must match the shortcut exactly. The supported modifier names
are `ctrl`/`control`, `shift`, `alt`, and `meta`/`cmd`/`command`.

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
If a key interrupts a partial sequence, it can start a new attempt when it
matches the first step.

When a completed shortcut is also the prefix of a longer registered sequence,
its callback waits for the longer sequence or the timeout. If the longer
sequence completes, only its callback runs. If the user pauses or presses a key
that cannot continue it, the shorter callback runs. This also works when the
sequences are registered by different hook instances.

```tsx
useHotkeys('g h', goHome);
useHotkeys('g i t', openGit, 2000);
useHotkeys(['g h', 'g h i'], navigate); // navigate runs after h and again after i
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
useHotkeys(keys, callback, options?)
useHotkeys(keys, callback, delay, options?)
```

- `keys: string | string[]` — a shortcut, a sequence, a wildcard, or an array
  of shortcuts. Use `+` between modifiers and the key, and spaces between
  sequential keys.
- `callback: (event: KeyboardEvent) => void | boolean` — called when a shortcut
  matches. Returning `false` calls `event.preventDefault()`.
- `delay?: number` — maximum time between keys in a sequence and the wait for
  an ambiguous shortcut, in milliseconds; defaults to `1000`.
- `preventDefaultOnAmbiguous?: boolean` — synchronously prevents the browser
  default when this shortcut's callback is deferred. Set it on the registration
  for the shorter shortcut; it defaults to `false`. Since the callback runs
  later, its `event.preventDefault()` call or `return false` cannot cancel the
  browser action. When enabled, the key event is prevented even if a longer
  sequence eventually wins.

Pass the full options object as the third argument, or keep the numeric
`delay` argument and pass `preventDefaultOnAmbiguous` fourth:

```tsx
useHotkeys(['g h', 'g h i'], navigate, {
  delay: 800,
  preventDefaultOnAmbiguous: true,
});
```

## Behavior and limitations

- The hook listens for `keydown` events on `document`.
- Shortcuts are ignored when the event target is an `<input>`, except when its
  type is `button`, `submit`, `reset`, `checkbox`, `radio`, `file`, or `image`.
  They are also ignored in `<textarea>`, `<select>`, and editable
  `contenteditable` areas. A nested element with `contenteditable="false"` is
  treated as non-editable, so shortcuts work there.
- The options object currently supports `delay` and
  `preventDefaultOnAmbiguous`. There is no `keyup` listener, DOM scope, or
  platform-specific `mod` alias yet.
- Empty or whitespace-only shortcut strings are ignored. If a shortcut array
  contains empty entries, those entries are ignored; non-empty shortcuts in the
  same array still work.
- A combination must end with a key, and every part before it must be a
  supported modifier. Invalid combinations such as `ctrl+`, `+a`, or `a+b` are
  ignored; development builds log a warning. Invalid entries do not disable
  other valid shortcuts in the same array.
- Shortcut strings are validated at runtime. TypeScript does not currently
  reject invalid string literals at compile time.

## Links

- [Live demo on CodeSandbox](https://codesandbox.io/p/sandbox/hgph7p)
- [npm package](https://www.npmjs.com/package/use-hotkeys-ts)
- [GitHub repository](https://github.com/tsepakme/use-hotkeys-ts)
