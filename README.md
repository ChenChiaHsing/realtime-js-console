# Realtime JS Console

Type JavaScript on the left; the console output appears on the right in real time. Each run clears the output (not accumulated). Code runs inside a sandboxed iframe with scripts-only permission for safety.

## Usage

1. Open `index.html` directly in a browser or serve it with any static server.
2. Click "Example" to load the initial sample code into the editor.
3. Enable "Auto Run" to update on input, or click "Run" to execute manually.
4. Use "Save Cache" to store current code in browser localStorage; "Load Cache" restores it (with overwrite confirmation).


## Editor Features

- **Tab / Shift+Tab**: Indent or outdent selected lines by 4 spaces (multiline + partial indent handling).
- **Bracket / Quote Pairing**:
	- When selecting text: typing `(` `[` `{` `'` `"` `` ` `` wraps the selection.
	- When no selection: auto-inserts matching pair only if next char is blank/whitespace/closer; cursor placed in the middle.
	- Backspace on an empty pair removes both characters.
	- Typing a closing bracket when cursor is before the same closer just moves the cursor (skip-over behavior).
- **Ctrl+/ Line Comment Toggle**: Toggles `//` for all selected lines (idempotent; removes when all already commented).
- **Ctrl+G Quick Log**: Inserts `console.log()`; wraps selection as `console.log(selection);` and selects inside.
- **Auto-indent on Enter**: Carries indentation and adds one extra level after `{ [ (`; smart block insertion when immediate next char is a closer.
- **Auto-format on paste**: Normalizes multi-line indentation (detects common leading spaces; converts tabs to 4 spaces).
- **Clear Button**: Quickly empties the editor (with confirmation if non-empty) and clears console output.
- **Cache Save / Load**: Persist editor content in `localStorage` (confirmation before overwrite when loading).
- **Export JS**: Download current content as a timestamped `.js` file.
- **Sandboxed Execution**: Each run executes in a fresh sandboxed iframe (scripts only) for isolation.
- **Version Badge**: Bottom-right shows static `Version: x.y.z` (editable via `main.js`).

## Keyboard Shortcuts

| Shortcut | Action |
| -------- | ------ |
| Ctrl / Cmd + Enter | Run code |
| Ctrl / Cmd + S | Save Cache |
| Ctrl / Cmd + L | Load Cache (confirmation) |
| Ctrl / Cmd + E | Load Example (confirmation if editor not empty) |
| Ctrl / Cmd + A | In editor: native Select All; outside: toggle Auto Run |
| Ctrl / Cmd + D | Export JS file |
| Ctrl / Cmd + G | Insert `console.log()` / wrap selection |
| Ctrl / Cmd + / | Toggle line comment (`//`) |

## Notes
- The iframe sandbox allows only scripts; it cannot modify the parent DOM and has no network access unless explicitly allowed.
- Exceptions and unhandled promise rejections are shown on the right.

## Version
Displayed at bottom-right as `Version: x.y.z`. To update, edit the `VERSION` constant near the top of `main.js`.

---
© 2025 NTUT Chen Chia Hsing
