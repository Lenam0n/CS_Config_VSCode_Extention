// media/heatmap/main.js
(function () {
  const vscode = acquireVsCodeApi();

  const LAYOUT = [
    // Funktionstasten
    [
      { k: "esc", l: "Esc", cls: "small" },
      { k: "f1", l: "F1", cls: "small" },
      { k: "f2", l: "F2", cls: "small" },
      { k: "f3", l: "F3", cls: "small" },
      { k: "f4", l: "F4", cls: "small" },
      { k: "f5", l: "F5", cls: "small" },
      { k: "f6", l: "F6", cls: "small" },
      { k: "f7", l: "F7", cls: "small" },
      { k: "f8", l: "F8", cls: "small" },
      { k: "f9", l: "F9", cls: "small" },
      { k: "f10", l: "F10", cls: "small" },
      { k: "f11", l: "F11", cls: "small" },
      { k: "f12", l: "F12", cls: "small" },
    ],
    // Zahlreihe
    [
      { k: "grave", l: "`~", cls: "small" },
      { k: "1", l: "1" },
      { k: "2", l: "2" },
      { k: "3", l: "3" },
      { k: "4", l: "4" },
      { k: "5", l: "5" },
      { k: "6", l: "6" },
      { k: "7", l: "7" },
      { k: "8", l: "8" },
      { k: "9", l: "9" },
      { k: "0", l: "0" },
      { k: "minus", l: "-_" },
      { k: "equals", l: "=+" },
      { k: "backspace", l: "Backspace", cls: "xwide small" },
    ],
    // QWERTY
    [
      { k: "tab", l: "Tab", cls: "wide small" },
      { k: "q", l: "Q" },
      { k: "w", l: "W" },
      { k: "e", l: "E" },
      { k: "r", l: "R" },
      { k: "t", l: "T" },
      { k: "y", l: "Y" },
      { k: "u", l: "U" },
      { k: "i", l: "I" },
      { k: "o", l: "O" },
      { k: "p", l: "P" },
      { k: "leftbracket", l: "[{" },
      { k: "rightbracket", l: "]}" },
      { k: "backslash", l: "\\|", cls: "wide" },
    ],
    // ASDF
    [
      { k: "capslock", l: "Caps", cls: "xwide small" },
      { k: "a", l: "A" },
      { k: "s", l: "S" },
      { k: "d", l: "D" },
      { k: "f", l: "F" },
      { k: "g", l: "G" },
      { k: "h", l: "H" },
      { k: "j", l: "J" },
      { k: "k", l: "K" },
      { k: "l", l: "L" },
      { k: "semicolon", l: ";:" },
      { k: "apostrophe", l: "'\"" },
      { k: "enter", l: "Enter", cls: "xwide small" },
    ],
    // ZXCV
    [
      { k: "shift", l: "Shift", cls: "xwide small" },
      { k: "z", l: "Z" },
      { k: "x", l: "X" },
      { k: "c", l: "C" },
      { k: "v", l: "V" },
      { k: "b", l: "B" },
      { k: "n", l: "N" },
      { k: "m", l: "M" },
      { k: "comma", l: ",<" },
      { k: "period", l: ".>" },
      { k: "slash", l: "/?" },
      { k: "rshift", l: "RShift", cls: "xwide small" },
    ],
    // Bottom
    [
      { k: "ctrl", l: "Ctrl", cls: "wide small" },
      { k: "alt", l: "Alt", cls: "wide small" },
      { k: "space", l: "Space", cls: "space" },
      { k: "ralt", l: "RAlt", cls: "wide small" },
      { k: "rctrl", l: "RCtrl", cls: "wide small" },
    ],
    // Navigation / Arrows
    [
      { k: "printscreen", l: "PrtSc", cls: "small" },
      { k: "scrolllock", l: "ScrLk", cls: "small" },
      { k: "pause", l: "Pause", cls: "small" },
      { k: "ins", l: "Ins", cls: "small" },
      { k: "home", l: "Home", cls: "small" },
      { k: "pgup", l: "PgUp", cls: "small" },
      { k: "del", l: "Del", cls: "small" },
      { k: "end", l: "End", cls: "small" },
      { k: "pgdn", l: "PgDn", cls: "small" },
      { k: "up", l: "↑", cls: "small" },
      { k: "left", l: "←", cls: "small" },
      { k: "down", l: "↓", cls: "small" },
      { k: "right", l: "→", cls: "small" },
    ],
    // Numpad
    [
      { k: "kp_ins", l: "Num 0", cls: "wide small" },
      { k: "kp_del", l: "Num .", cls: "small" },
      { k: "kp_end", l: "Num 1", cls: "small" },
      { k: "kp_downarrow", l: "Num 2", cls: "small" },
      { k: "kp_pgdn", l: "Num 3", cls: "small" },
      { k: "kp_enter", l: "Num Enter", cls: "wide small" },
      { k: "kp_leftarrow", l: "Num 4", cls: "small" },
      { k: "kp_5", l: "Num 5", cls: "small" },
      { k: "kp_rightarrow", l: "Num 6", cls: "small" },
      { k: "kp_plus", l: "Num +", cls: "small" },
      { k: "kp_home", l: "Num 7", cls: "small" },
      { k: "kp_uparrow", l: "Num 8", cls: "small" },
      { k: "kp_pgup", l: "Num 9", cls: "small" },
      { k: "kp_minus", l: "Num -", cls: "small" },
      { k: "kp_multiply", l: "Num *", cls: "small" },
      { k: "kp_slash", l: "Num /", cls: "small" },
    ],
  ];

  const keyboardEl = document.getElementById("keyboard");
  const selectionEl = document.getElementById("selection");
  const filterEl = document.getElementById("filterInput");

  function buildKeyboard() {
    keyboardEl.innerHTML = "";
    LAYOUT.forEach((row) => {
      const rowEl = document.createElement("div");
      rowEl.className = "row";
      row.forEach((k) => {
        const keyEl = document.createElement("div");
        keyEl.className = `key ${k.cls || ""}`;
        keyEl.dataset.key = k.k;
        keyEl.title = k.k;
        keyEl.innerHTML = `<span class="label">${k.l}</span><span class="sub" data-sub></span>`;
        keyEl.addEventListener("click", () => focusKey(keyEl));
        rowEl.appendChild(keyEl);
      });
      keyboardEl.appendChild(rowEl);
    });
  }

  function focusKey(el) {
    keyboardEl
      .querySelectorAll(".key")
      .forEach((k) => k.classList.remove("highlight"));
    el.classList.add("highlight");
    const key = el.dataset.key;
    const cmd = el.querySelector("[data-sub]").textContent || "(unbound)";
    selectionEl.textContent = `Key: ${key}\nCommand: ${cmd}`;
  }

  let lastBindings = {};
  function applyBindings(binds) {
    lastBindings = binds || {};
    const query = (filterEl.value || "").trim().toLowerCase();
    keyboardEl.querySelectorAll(".key").forEach((el) => {
      const key = el.dataset.key;
      const val = lastBindings[key] || "";
      const sub = el.querySelector("[data-sub]");
      sub.textContent = val;
      el.classList.toggle("bound", !!val);
      el.classList.toggle("unbound", !val);
      // filter highlight
      const hit = query && val.toLowerCase().includes(query);
      el.classList.toggle("highlight", !!hit);
    });
  }

  filterEl.addEventListener("input", () => applyBindings(lastBindings));

  // Theme hook
  function setTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);
  }

  // Messaging
  window.addEventListener("message", (ev) => {
    const msg = ev.data;
    if (msg?.type === "heatmap:setData") {
      applyBindings(msg.payload?.bindings || {});
    } else if (msg?.type === "heatmap:setTheme") {
      setTheme(msg.payload?.theme || "dark");
    }
  });

  // Init
  buildKeyboard();
  vscode.postMessage({ type: "ready" });
})();
