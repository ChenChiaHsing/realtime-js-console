// Minimal realtime JS console with sandboxed iframe
// © 2025 NTUT Chen Chia Hsing
const editor = document.getElementById('editor');
const consoleEl = document.getElementById('console');
const autoRunEl = document.getElementById('autoRun');
const runBtn = document.getElementById('runBtn');
const exampleBtn = document.getElementById('exampleBtn');
const clearBtn = document.getElementById('clearBtn');
const saveBtn = document.getElementById('saveBtn');
const loadBtn = document.getElementById('loadBtn');
const exportBtn = document.getElementById('exportBtn');
const highlightEl = document.getElementById('highlight');
const editStampEl = document.getElementById('editStamp');
const VERSION = '1.1.0';
const BUILD_DATE = '2025-09-17';

// Example code snippet
const DEFAULT_CODE = `// Type your JavaScript here. It runs immediately, and output is cleared on every run.\nconsole.log('Hello', 'World');\nconsole.info('info message');\nconsole.warn('warning');\nconsole.error('something wrong?');\n\n// You can also use async/await\n(async () => {\n    await new Promise(r => setTimeout(r, 500));\n    console.log('done after 500ms');\n})();`;

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
exampleBtn.addEventListener('click', () => { editor.value = DEFAULT_CODE; if (autoRunEl.checked) run(); scheduleHighlight(); });
editor.addEventListener('input', () => { if (autoRunEl.checked) run(); scheduleHighlight(); });
autoRunEl.addEventListener('change', () => { if (autoRunEl.checked) run(); scheduleHighlight(); });

// Save / Load cache (localStorage)
const LS_KEY = 'realtime_console_code_v1';
saveBtn.addEventListener('click', () => {
  try {
    localStorage.setItem(LS_KEY, editor.value);
    const original = 'Save Cache';
    saveBtn.textContent = 'Cached';
    setTimeout(() => saveBtn.textContent = original, 1200);
  } catch (err) {
    alert('Cache save failed: ' + err);
  }
});
loadBtn.addEventListener('click', () => {
  const cached = localStorage.getItem(LS_KEY);
  if (cached == null) { alert('No cached code found.'); return; }
  if (!confirm('Loading cached code will overwrite current content. Continue?')) return;
  editor.value = cached;
  if (autoRunEl.checked) run(); else clearConsole();
  scheduleHighlight();
});

// Export current code as a .js file
exportBtn.addEventListener('click', () => {
  const code = editor.value || '';
  const blob = new Blob([code], { type: 'text/javascript' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const stamp = new Date().toISOString().replace(/[:T]/g,'-').replace(/\..+/, '');
  a.href = url;
  a.download = `code-${stamp}.js`;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => { URL.revokeObjectURL(url); a.remove(); }, 0);
  scheduleHighlight();
});

// Clear editor content button
clearBtn.addEventListener('click', () => {
  if (editor.value && editor.value.trim()) {
    if (!confirm('Clear all code in editor? This cannot be undone.')) return;
  }
  editor.value = '';
  clearConsole();
  scheduleHighlight();
  if (autoRunEl.checked) run();
});

// Keyboard shortcuts
// Ctrl/Cmd + Enter : Run
// Ctrl/Cmd + S     : Save Cache
// Ctrl/Cmd + L     : Load Cache (with confirmation)
// Ctrl/Cmd + E     : Load Example (ask before overwrite if not empty)
// Ctrl/Cmd + A     : 在編輯區 -> 全選 (預設瀏覽器行為)；非編輯區 -> Toggle Auto Run
// Ctrl/Cmd + D     : Export JS
window.addEventListener('keydown', (e) => {
  if (!(e.ctrlKey || e.metaKey)) return;
  const key = e.key.toLowerCase();
  switch (key) {
    case 'enter':
      e.preventDefault();
      run();
      break;
    case 's':
      e.preventDefault();
      saveBtn.click();
      break;
    case 'l':
      e.preventDefault();
      loadBtn.click();
      break;
    case 'e':
      e.preventDefault();
      if (editor.value && editor.value.trim() && editor.value !== DEFAULT_CODE) {
        if (!confirm('Load example code and overwrite current content?')) return;
      }
      exampleBtn.click();
      break;
    case 'a':
      // 若焦點在 editor，交還給瀏覽器原生 Ctrl+A 全選
      if (document.activeElement === editor) return; // 不攔截，讓瀏覽器全選
      e.preventDefault();
      autoRunEl.checked = !autoRunEl.checked;
      if (autoRunEl.checked) run();
      break;
    case 'd':
      e.preventDefault();
      exportBtn.click();
      break;
    case 'g':
      // 僅在焦點為 editor 時生效
      if (document.activeElement !== editor) return;
      e.preventDefault();
      const { selectionStart: gs, selectionEnd: ge, value: gv } = editor;
      const selectedText = gv.slice(gs, ge);
      const snippet = selectedText
        ? `console.log(${selectedText});`
        : 'console.log();';
      editor.setRangeText(snippet, gs, ge, 'end');
      // 將游標放在括號中間（若有選取則重新選取原本文字）
      if (selectedText) {
        const insideStart = gs + 'console.log('.length;
        editor.selectionStart = insideStart;
        editor.selectionEnd = insideStart + selectedText.length;
      } else {
        const caretInside = gs + 'console.log('.length;
        editor.selectionStart = editor.selectionEnd = caretInside;
      }
      if (autoRunEl.checked) run();
      scheduleHighlight();
      break;
    case '/':
      // Ctrl+/ 註解/取消註解（需焦點在 editor）
      if (document.activeElement !== editor) return;
      e.preventDefault();
      toggleComment();
      break;
    default:
      break;
  }
});

// Toggle line comment for current selection / line
function toggleComment(){
  const { value, selectionStart, selectionEnd } = editor;
  const lineStart = value.lastIndexOf('\n', selectionStart - 1) + 1; // -1 => -2? handled by +1
  let lineEnd = value.indexOf('\n', selectionEnd);
  if (lineEnd === -1) lineEnd = value.length;
  const block = value.slice(lineStart, lineEnd);
  const lines = block.split(/\n/);
  // 判斷是否全部已是註解行（忽略空白）
  const allCommented = lines.every(l => /^\s*\/\//.test(l) || l.trim() === '');
  const updated = lines.map(l => {
    if (l.trim() === '') return l; // 保持空行
    if (allCommented) {
      // 移除第一個 // （在前導空白之後）
      return l.replace(/^(\s*)\/\//, '$1');
    } else {
      // 加上 // 於前導空白後
      return l.replace(/^(\s*)/, '$1//');
    }
  }).join('\n');
  const before = value.slice(0, lineStart);
  const after = value.slice(lineEnd);
  editor.value = before + updated + after;
  // 調整選取範圍：保留整個更新後區塊
  editor.selectionStart = lineStart;
  editor.selectionEnd = lineStart + updated.length;
  if (autoRunEl.checked) run();
  scheduleHighlight();
}

// --- Syntax Highlighting ---
function highlight(code) {
  if (!code) return '';
  // 先 escape html，避免任何字元被破壞
  code = code.replace(/[&<>]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));
  // 用一個陣列存所有 token
  const tokens = [];
  // helper: 產生唯一 placeholder
  let tid = 0;
  function mark(type, val) {
    const id = `__TOK${tid++}__`;
    tokens.push({id, type, val});
    return id;
  }
  // block comments
  code = code.replace(/\/\*[\s\S]*?\*\//g, m => mark('com', m));
  // line comments
  code = code.replace(/(^|\n)(\s*\/\/.*)/g, (m, p1, c) => p1 + mark('com', c));
  // strings (允許任意非結尾引號的字元，包括中文)
  code = code.replace(/(["'`])((?:[^\\\1\r\n]|\\[\s\S])*)\1/g, (m, q, body) => mark('str', q + body + q));
  // numbers
  code = code.replace(/\b(0x[0-9a-fA-F]+|\d+(?:\.\d+)?(?:e[+-]?\d+)?)\b/g, m => mark('num', m));
  // keywords
  code = code.replace(/\b(const|let|var|function|return|if|else|for|while|break|continue|switch|case|default|try|catch|finally|throw|new|class|extends|super|import|from|export|async|await|yield|in|of|delete|typeof|instanceof)\b/g, m => mark('kw', m));
  // builtins
  code = code.replace(/\b(console|Math|Date|JSON|Array|Object|Promise|window|document|Error|Number|String|Boolean|Set|Map)\b/g, m => mark('bi', m));
  // 最後再把 token 還原成 span
  for (const t of tokens) {
    let html = '';
    switch(t.type) {
      case 'com': html = `<span class="tok-com">${t.val}</span>`; break;
      case 'str': html = `<span class="tok-str">${t.val}</span>`; break;
      case 'num': html = `<span class="tok-num">${t.val}</span>`; break;
      case 'kw': html = `<span class="tok-kw">${t.val}</span>`; break;
      case 'bi': html = `<span class="tok-builtin">${t.val}</span>`; break;
      default: html = t.val;
    }
    // 注意：token 內容已經 escape 過 html，不會有 XSS
    code = code.split(t.id).join(html);
  }
  return code;
}

function refreshHighlight(){
  if(!highlightEl) return;
  const code = editor.value.endsWith('\n') ? editor.value + ' ' : editor.value;
  highlightEl.innerHTML = '<code>' + highlight(code) + '</code>';
  highlightEl.scrollTop = editor.scrollTop;
  highlightEl.scrollLeft = editor.scrollLeft;
}

let highlightPending = false;

function scheduleHighlight(){
  if(highlightPending) return;
  highlightPending = true;
  requestAnimationFrame(()=>{ highlightPending = false; refreshHighlight(); });
}
// 固定顯示版本
if (editStampEl) editStampEl.textContent = 'Version: ' + VERSION + " (" + BUILD_DATE + ")";

editor.addEventListener('scroll', () => {
  if(!highlightEl) return;
  highlightEl.scrollTop = editor.scrollTop;
  highlightEl.scrollLeft = editor.scrollLeft;
});
refreshHighlight();

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
  scheduleHighlight();
});

// Auto bracket/quote pairing & navigation（只在有選取文字時自動包裹，否則不自動補對，undo/redo 完全原生）
const openToClose = { '(': ')', '[': ']', '{': '}', '"': '"', "'": "'", '`': '`' };
const closers = new Set(Object.values(openToClose));
editor.addEventListener('keydown', (e) => {
  // 只在有選取文字時自動包裹
  if (openToClose[e.key]) {
    const { selectionStart: start, selectionEnd: end, value } = editor;
    if (start !== end) {
      // 包裹選取內容
      e.preventDefault();
      const close = openToClose[e.key];
      editor.setRangeText(e.key + value.slice(start, end) + close, start, end, 'select');
      editor.selectionStart = start + 1;
      editor.selectionEnd = end + 1;
      if (autoRunEl.checked) run();
      scheduleHighlight();
    } else {
      // 無選取內容時自動補成對符號並將游標置中
      const close = openToClose[e.key];
      const next = value[start];
      const prev = value[start - 1];
      // 若下一個字元已是空白/結束/關閉符號/換行，才自動補；否則（如在單字中間）就不補
      const shouldPair = !next || /[\s\]\)\}\,;:.]/.test(next);
      // 對於引號，若前面是跳脫符號則不自動補，避免在字串內新增多餘引號
      const escapedQuote = (e.key === '"' || e.key === "'" || e.key === '`') && prev === '\\';
      if (shouldPair && !escapedQuote) {
        e.preventDefault();
        editor.setRangeText(e.key + close, start, start, 'end');
        // caret 移到中間
        editor.selectionStart = editor.selectionEnd = start + 1;
        if (autoRunEl.checked) run();
        scheduleHighlight();
      }
    }
  }
});

// Backspace 刪除成對符號
editor.addEventListener('keydown', (e) => {
  if (e.key !== 'Backspace') return;
  const { selectionStart: start, selectionEnd: end, value } = editor;
  if (start !== end || start === 0 || start >= value.length) return;
  const prev = value[start - 1];
  const next = value[start];
  if (openToClose[prev] === next) {
    e.preventDefault();
    editor.setRangeText('', start - 1, start + 1, 'start');
    if (autoRunEl.checked) run();
    scheduleHighlight();
  }
});

// 跳過已存在的 close
editor.addEventListener('keydown', (e) => {
  if (!closers.has(e.key)) return;
  const { selectionStart: start, selectionEnd: end, value } = editor;
  if (start !== end) return;
  if (value.slice(start, start + 1) === e.key) {
    e.preventDefault();
    editor.selectionStart = editor.selectionEnd = start + 1;
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
  scheduleHighlight();
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
  scheduleHighlight();
});
