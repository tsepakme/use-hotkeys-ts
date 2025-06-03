# use-hotkeys-ts

A typed React hook for handling keyboard shortcuts with TypeScript support.

## Installation

```bash
npm install use-hotkeys-ts
```

## Usage

```ts
import { useHotkeys } from 'use-hotkeys-ts';

function MyComponent() {
  useHotkeys('ctrl+s', (e) => {
    e.preventDefault();
    console.log('Ctrl+S was pressed!');
    // Save functionality
  });

  useHotkeys(['ctrl+z', 'command+z'], (e) => {
    e.preventDefault();
    console.log('Undo shortcut triggered!');
    // Undo functionality
  });

  return <div>Press some hotkeys</div>;
}
```

## API 

useHotkeys(keys, callback)
- keys: String or array of strings representing keyboard combinations
- callback: Function to call when the key combination is pressed