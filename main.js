// Minimal realtime JS console with sandboxed iframe
// © 2025 NTUT Chen Chia Hsing
const editor = document.getElementById('editor');
const consoleEl = document.getElementById('console');
const autoRunEl = document.getElementById('autoRun');
const runBtn = document.getElementById('runBtn');
const exampleBtn = document.getElementById('exampleBtn');

// Example code snippet
const DEFAULT_CODE = `// Type your JavaScript here. It runs immediately, and output is cleared on every run.\nconsole.log('Hello', 'World');\nconsole.info('info message');\nconsole.warn('warning');\nconsole.error('something wrong?');\n\n// You can also use async/await\n(async () => {\n  await new Promise(r => setTimeout(r, 500));\n  console.log('done after 500ms');\n})();`;

// Start with an empty editor; user can insert the example via the Example button
editor.value = '';

// Build a sandboxed iframe for each run to ensure a clean environment
let iframe = null;
function createSandbox() {
  if (iframe && iframe.parentNode) iframe.parentNode.removeChild(iframe);
  iframe = document.createElement('iframe');
  iframe.setAttribute('sandbox', 'allow-scripts');
  iframe.style.display = 'none';
  // Build the sandbox content via srcdoc to avoid touching contentDocument under strict sandbox
  const script = `(() => {\n    const send = (type, args) => parent.postMessage({ __fromSandbox: true, type, args }, '*');\n    const wrap = (fn, type) => (...a) => { try { fn.apply(console, a); } catch(_){} send(type, a); };\n    console.log = wrap(console.log, 'log');\n    console.info = wrap(console.info, 'info');\n    console.warn = wrap(console.warn, 'warn');\n    console.error = wrap(console.error, 'error');\n    window.addEventListener('error', (e) => send('error', [String(e.message || e.error)]));\n    window.addEventListener('unhandledrejection', (e) => send('error', [String(e.reason)]));\n    window.addEventListener('message', (e) => {\n      const data = e.data;\n      if (!data || !data.__runCode) return;\n      try {\n        // eslint-disable-next-line no-new-func\n        const f = new Function(data.code);\n        f();\n      } catch (err) {\n        send('error', [String(err && err.stack || err)]);\n      }\n    });\n  })();`;
  iframe.srcdoc = `<!doctype html><html><head><meta charset="utf-8"></head><body><script>${script}<\/script></body></html>`;
  document.body.appendChild(iframe);
}

// Clear the console output
function clearConsole() {
  consoleEl.textContent = '';
}
// Print a line to the console output
function printLine(type, ...parts) {
  const line = document.createElement('div');
  line.className = `line ${type}`;
  line.textContent = parts.map(format).join(' ');
  consoleEl.appendChild(line);
  consoleEl.scrollTop = consoleEl.scrollHeight;
}
// Format output for display
function format(v) {
  if (typeof v === 'string') return v;
  try { return JSON.stringify(v); } catch { return String(v); }
}

// Listen for messages from the sandboxed iframe
window.addEventListener('message', (e) => {
  const data = e.data;
  if (!data || !data.__fromSandbox) return;
  printLine(data.type || 'log', ...(data.args || []));
});

function run() {
  clearConsole(); // Not accumulated: clear before each run
  createSandbox();
  // Ensure the iframe is ready before sending code
  const send = () => iframe && iframe.contentWindow && iframe.contentWindow.postMessage({ __runCode: true, code: editor.value }, '*');
  if (iframe.contentWindow) {
    // If already available, queue to next tick to let script init
    setTimeout(send, 0);
  }
  iframe.addEventListener('load', () => {
    send();
  }, { once: true });
}

// Wire up UI event listeners
runBtn.addEventListener('click', run);
exampleBtn.addEventListener('click', () => { editor.value = DEFAULT_CODE; if (autoRunEl.checked) run(); });
editor.addEventListener('input', () => { if (autoRunEl.checked) run(); });
autoRunEl.addEventListener('change', () => { if (autoRunEl.checked) run(); });

// Handle Tab indentation inside textarea (insert 4 spaces; support multi-line & Shift+Tab)
editor.addEventListener('keydown', (e) => {
  if (e.key !== 'Tab') return;
  e.preventDefault();
  const indent = '    '; // 4 spaces
  const { selectionStart: start, selectionEnd: end, value } = editor;
  const before = value.slice(0, start);
  const selected = value.slice(start, end);
  const after = value.slice(end);

  // Multi-line selection?
  if (selected.includes('\n')) {
    const lines = selected.split(/\n/);
    if (e.shiftKey) {
  // Outdent
  let removedFirst = 0; // adjust new caret start shift
      const outdented = lines.map((line, idx) => {
        if (line.startsWith(indent)) {
          if (idx === 0) removedFirst = indent.length; // caret shift for first line
          return line.slice(indent.length);
        } else if (line.startsWith('   ')) { // odd partial
          if (idx === 0) removedFirst = 3;
          return line.slice(3);
        } else if (line.startsWith('  ')) {
          if (idx === 0) removedFirst = 2;
          return line.slice(2);
        } else if (line.startsWith(' ')) {
          if (idx === 0) removedFirst = 1;
          return line.slice(1);
        }
        return line; // unchanged
      }).join('\n');
      const newValue = before + outdented + after;
      editor.value = newValue;
      const newStart = start - removedFirst;
      const newEnd = start - removedFirst + outdented.length;
      editor.selectionStart = newStart < before.length ? newStart : before.length; // safety
      editor.selectionEnd = newEnd;
    } else {
  // Indent each non-empty line (and empty ones too for consistency)
      const indented = lines.map(l => indent + l).join('\n');
      editor.value = before + indented + after;
      editor.selectionStart = start + indent.length; // first line moves right
      editor.selectionEnd = start + indented.length; // full new selection
    }
  } else {
    if (e.shiftKey) {
  // Outdent single line
  // Find start of line
      const lineStart = before.lastIndexOf('\n') + 1;
      const line = value.slice(lineStart, end);
      let remove = 0;
      if (line.startsWith(indent)) remove = indent.length;
      else if (line.startsWith('   ')) remove = 3;
      else if (line.startsWith('  ')) remove = 2;
      else if (line.startsWith(' ')) remove = 1;
      if (remove) {
        editor.value = value.slice(0, lineStart) + line.slice(remove) + after;
        const delta = remove;
        editor.selectionStart = start - delta > lineStart ? start - delta : lineStart;
        editor.selectionEnd = end - delta;
      }
    } else {
  // Simple insert
      editor.value = before + indent + after;
      editor.selectionStart = editor.selectionEnd = start + indent.length;
    }
  }
  if (autoRunEl.checked) run(); // keep live behavior
});

// Auto bracket/quote pairing & navigation
editor.addEventListener('keydown', (e) => {
  const openToClose = { '(': ')', '[': ']', '{': '}', '"': '"', "'": "'", '`': '`' };
  const closers = new Set(Object.values(openToClose));
  const { selectionStart: start, selectionEnd: end, value } = editor;

  // Wrap selection or insert pair
  if (openToClose[e.key]) {
    e.preventDefault();
    const close = openToClose[e.key];
    const before = value.slice(0, start);
    const selected = value.slice(start, end);
    const after = value.slice(end);
    if (selected) {
  // Wrap selection
      editor.value = before + e.key + selected + close + after;
      editor.selectionStart = start + 1; // keep selection inside
      editor.selectionEnd = end + 1;
    } else {
  // Insert empty pair and place caret between
      editor.value = before + e.key + close + after;
      editor.selectionStart = editor.selectionEnd = start + 1;
    }
    if (autoRunEl.checked) run();
    return;
  }

  // Skip over existing closer if the next char already matches
  if (closers.has(e.key)) {
    if (start === end && value.slice(start, start + 1) === e.key) {
      e.preventDefault();
      editor.selectionStart = editor.selectionEnd = start + 1;
      return;
    }
  }

  // Backspace deletes pair if empty between
  if (e.key === 'Backspace') {
    if (start === end && start > 0 && start < value.length) {
      const prev = value[start - 1];
      const next = value[start];
      if (openToClose[prev] === next) {
        e.preventDefault();
        editor.value = value.slice(0, start - 1) + value.slice(start + 1);
        editor.selectionStart = editor.selectionEnd = start - 1;
        if (autoRunEl.checked) run();
      }
    }
  }
});

// Auto-indent on Enter key
editor.addEventListener('keydown', (e) => {
  if (e.key !== 'Enter') return;
  const { selectionStart: start, selectionEnd: end, value } = editor;
  if (start !== end) return; // If there is a selection, use default behavior
  e.preventDefault();
  const before = value.slice(0, start);
  const after = value.slice(end);
  const lineStart = before.lastIndexOf('\n') + 1;
  const currentLine = before.slice(lineStart);
  const baseIndent = (currentLine.match(/^[ \t]*/)||[''])[0];
  const opensExtra = /[\{\[\(]\s*$/.test(currentLine);
  const extra = opensExtra ? '    ' : '';
  // If the next non-space character is a closing bracket and the current line ends with an opening bracket, create a block structure with an empty line
  const nextChar = after[0];
  if (opensExtra && nextChar && /[}\]\)]/.test(nextChar)) {
    const insert = '\n' + baseIndent + extra + '\n' + baseIndent;
    editor.value = before + insert + after;
  const caretPos = start + 1 + baseIndent.length + extra.length; // Move caret to inner line
    editor.selectionStart = editor.selectionEnd = caretPos;
  } else {
    const insert = '\n' + baseIndent + extra;
    editor.value = before + insert + after;
    editor.selectionStart = editor.selectionEnd = start + insert.length;
  }
  if (autoRunEl.checked) run();
});

// Do not auto-run on load; waits for user input or Example/Run

// Auto-format pasted code (basic indentation normalization)
editor.addEventListener('paste', (e) => {
  if (!e.clipboardData) return;
  const text = e.clipboardData.getData('text/plain');
  if (!text || !/\n/.test(text)) return; // Only format multi-line paste
  e.preventDefault();
  // Normalize indentation: remove common leading spaces, convert tabs to 4 spaces
  let lines = text.replace(/\t/g, '    ').split(/\r?\n/);
  // Ignore empty lines for indent detection
  const nonEmpty = lines.filter(l => l.trim());
  let minIndent = 1e9;
  for (const l of nonEmpty) {
    const m = l.match(/^ +/);
    if (m) minIndent = Math.min(minIndent, m[0].length);
    else minIndent = 0;
  }
  if (minIndent > 0 && minIndent < 1e9) {
    lines = lines.map(l => l.startsWith(' '.repeat(minIndent)) ? l.slice(minIndent) : l);
  }
  // When inserting, auto-align to the current line's indentation
  const { selectionStart: start, selectionEnd: end, value } = editor;
  const before = value.slice(0, start);
  const after = value.slice(end);
  const lineStart = before.lastIndexOf('\n') + 1;
  const baseIndent = (before.slice(lineStart).match(/^[ \t]*/)||[''])[0];
  const formatted = lines.map((l,i) => (i===0?l:baseIndent+l)).join('\n');
  editor.value = before + formatted + after;
  const newPos = before.length + formatted.length;
  editor.selectionStart = editor.selectionEnd = newPos;
  if (autoRunEl.checked) run();
});
