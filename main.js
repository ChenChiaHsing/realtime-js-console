// Minimal realtime JS console with sandboxed iframe
// © 2025 NTUT Chen Chia Hsing
const editor = document.getElementById('editor');
const consoleEl = document.getElementById('console');
const autoRunEl = document.getElementById('autoRun');
const runBtn = document.getElementById('runBtn');
const exampleBtn = document.getElementById('exampleBtn');

// Seed example
const DEFAULT_CODE = `// Type your JavaScript here. It runs immediately, and output is cleared on every run.\nconsole.log('Hello', 'World');\nconsole.info('info message');\nconsole.warn('warning');\nconsole.error('something wrong?');\n\n// You can also use async/await\n(async () => {\n  await new Promise(r => setTimeout(r, 500));\n  console.log('done after 500ms');\n})();`;

// Start with an empty editor; user can insert the example via the Example button
editor.value = '';

// Build sandboxed iframe each run to ensure clean environment
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

function clearConsole() {
  consoleEl.textContent = '';
}
function printLine(type, ...parts) {
  const line = document.createElement('div');
  line.className = `line ${type}`;
  line.textContent = parts.map(format).join(' ');
  consoleEl.appendChild(line);
  consoleEl.scrollTop = consoleEl.scrollHeight;
}
function format(v) {
  if (typeof v === 'string') return v;
  try { return JSON.stringify(v); } catch { return String(v); }
}

// Parent listener for sandbox messages
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

// Wire up UI
runBtn.addEventListener('click', run);
exampleBtn.addEventListener('click', () => { editor.value = DEFAULT_CODE; if (autoRunEl.checked) run(); });
editor.addEventListener('input', () => { if (autoRunEl.checked) run(); });
autoRunEl.addEventListener('change', () => { if (autoRunEl.checked) run(); });

// Do not auto-run on load; waits for user input or Example/Run
