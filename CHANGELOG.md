# Changelog

## 1.2.3

### Fixes
- Ignore malformed shortcut combinations instead of interpreting them as a
  different shortcut; warn about them in development.

## 1.2.2

### Tests
- Cover the `control` modifier alias, repeated whitespace in sequences,
  `contenteditable="false"`, and sequence timer cleanup.

### Maintenance
- Verify that the release tag matches the package version.
- Build through `prepublishOnly` to avoid building twice in the publish workflow.
- Clarify shortcut and release documentation.

## 1.2.1

### Fixes
- Ignore empty and whitespace-only shortcuts instead of matching every key.
- Ignore empty entries in arrays while preserving the other shortcuts.

### Tests
- Cover empty shortcut strings and empty entries in shortcut arrays.

## 1.2.0

### Features
- Add `'*'` as a wildcard shortcut that matches any single keydown event.

## 1.1.4 (2026-02-17)

### Features
- Added ignoring of hotkeys in form elements (inputs, textareas, select dropdowns)
- Added support for contenteditable elements detection
- Improved focus handling for interactive elements

### Tests
- Added tests verifying that hotkeys don't trigger in form elements
- Added tests for contenteditable elements
- Expanded test coverage for keyboard event handling

### Fixes
- Fixed issue with hotkeys triggering while typing in form inputs
- Fixed contenteditable detection to prevent hotkey execution in rich text editors
- Fixed event handling in nested form elements

## 1.1.0 (2025-06-05)

### Features
- Added support for key sequences (e.g., "g i" for pressing 'g' followed by 'i')
- Added configurable timeout for key sequences
- Improved handling of function keys (F1-F12)
- Added comprehensive test suite for all features

### Fixes
- Fixed case sensitivity issues with function keys
- Fixed handling of keyboard events with modifier keys

## 1.0.2 (2025-06-03)

### Fixes
- Fixed compatibility with React 19
- Fixed keyboard event handling
- Updated tests to work with jsdom

## 1.0.1 (2025-06-03)

### Fixes
- First public release
