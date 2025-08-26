# Realtime JS Console

Type JavaScript on the left; the console output appears on the right in real time. Each run clears the output (not accumulated). Code runs inside a sandboxed iframe with scripts-only permission for safety.

## Usage

1. Open `index.html` directly in a browser or serve it with any static server.
2. Click "Example" to load the initial sample code into the editor.
3. Enable "Auto Run" to update on input, or click "Run" to execute manually.

## Notes
- The iframe sandbox allows only scripts; it cannot modify the parent DOM and has no network access unless explicitly allowed.
- Exceptions and unhandled promise rejections are shown on the right.

---
© 2025 NTUT Chen Chia Hsing
