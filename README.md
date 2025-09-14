# Realtime JS Console

Type JavaScript on the left; the console output appears on the right in real time. Each run clears the output (not accumulated). Code runs inside a sandboxed iframe with scripts-only permission for safety.

## Usage

1. Open `index.html` directly in a browser or serve it with any static server.
2. Click "Example" to load the initial sample code into the editor.
3. Enable "Auto Run" to update on input, or click "Run" to execute manually.
4. Use "Save Cache" to store current code in browser localStorage; "Load Cache" restores it (with overwrite confirmation).


## Editor Features

- **Tab / Shift+Tab**: Indent or outdent selected lines by 4 spaces.
- **Auto bracket/quote pairing**: If text is selected, typing (, [, {, ', ", or ` will wrap the selection with matching brackets/quotes. When not selecting text, auto-pairing is disabled to ensure undo/redo (Ctrl+Z) works natively and smoothly.
- **Auto-indent on Enter**: Pressing Enter continues the previous line's indentation, and adds an extra indent after { [ ( .
- **Auto-format on paste**: When pasting multi-line code, common leading indentation is removed and the code is aligned to the current line's indent.
- **Save Cache / Load Cache**: Persist the current editor content to `localStorage` and retrieve it later. Loading asks for confirmation before overwriting.
- **Export JS**: Download the current editor content as a timestamped `.js` file.

## Keyboard Shortcuts

| Shortcut | Action |
| -------- | ------ |
| Ctrl / Cmd + Enter | Run code |
| Ctrl / Cmd + S | Save Cache |
| Ctrl / Cmd + L | Load Cache (confirmation) |
| Ctrl / Cmd + E | Load Example (confirmation if editor not empty) |
| Ctrl / Cmd + A | Toggle Auto Run |
| Ctrl / Cmd + D | Export JS |

## Notes
- The iframe sandbox allows only scripts; it cannot modify the parent DOM and has no network access unless explicitly allowed.
- Exceptions and unhandled promise rejections are shown on the right.

---
© 2025 NTUT Chen Chia Hsing
