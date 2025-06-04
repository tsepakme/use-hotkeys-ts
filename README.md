# use-hotkeys-ts

[![npm version](https://img.shields.io/npm/v/use-hotkeys-ts)](https://www.npmjs.com/package/use-hotkeys-ts)
![TypeScript](https://img.shields.io/badge/language-TypeScript-blue)
[![License](https://img.shields.io/npm/l/use-hotkeys-ts)](./LICENSE)
[![Bundle Size](https://img.shields.io/bundlephobia/minzip/use-hotkeys-ts)](https://bundlephobia.com/package/use-hotkeys-ts)
[![codecov](https://codecov.io/gh/tsepakme/use-hotkeys-ts/branch/main/graph/badge.svg)](https://codecov.io/gh/tsepakme/use-hotkeys-ts)


A fully typed React hook for handling keyboard shortcuts and hotkeys with ease.

## New in v1.1.0

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

### Handling keydown / keyup events

```ts
useHotkeys('ctrl+enter', () => {
  console.log('Form submitted');
}, { keydown: true, keyup: false });
```

### Integration with react-hook-form

```ts
const { handleSubmit } = useForm();

useHotkeys('ctrl+enter', () => {
  handleSubmit(onSubmit)();
});
```

### Limiting to a DOM element (with ref)

```ts
const ref = useRef(null);

useHotkeys('esc', () => {
  console.log('Close modal');
}, {}, [ref]);
```

### Using `ignoreModifiers`

```ts
useHotkeys('/', () => {
  console.log('Focus search');
}, { ignoreModifiers: true });
```

### Handling multiple shortcuts with different actions

```ts
useHotkeys(['ctrl+a', 'ctrl+b'], (e, handler) => {
  switch (handler.keys.join('+')) {
    case 'ctrl+a':
      console.log('Action A');
      break;
    case 'ctrl+b':
      console.log('Action B');
      break;
  }
});
```

## Features

✅ Multiple key combinations

✅ Full TypeScript support

✅ Scope restriction via ref

✅ keydown / keyup event options

✅ macOS / Windows key compatibility

✅ Easy integration with forms and UI frameworks


## Future Plans

- Auto-detection of platform (ctrl vs cmd)

- Global mode for background hotkeys

- Dev/debug mode

- Logging and telemetry support

- Storybook demo support

##  Links

- [Live Demo on CodeSandbox](https://codesandbox.io/p/sandbox/hgph7p)
- [npm page](https://www.npmjs.com/package/use-hotkeys-ts)
- [GitHub repository](https://github.com/tsepakme/use-hotkeys-ts)