import "@tailwindcss/browser";

import MarkdownIt from "markdown-it";
import anchor from "markdown-it-anchor";
import taskLists from "markdown-it-task-lists";
import DOMPurify from "dompurify";
import hljs from "highlight.js/lib/core";

import javascript from "highlight.js/lib/languages/javascript";
import typescript from "highlight.js/lib/languages/typescript";
import python from "highlight.js/lib/languages/python";
import bash from "highlight.js/lib/languages/bash";
import json from "highlight.js/lib/languages/json";
import css from "highlight.js/lib/languages/css";
import xml from "highlight.js/lib/languages/xml";
import markdown from "highlight.js/lib/languages/markdown";
import sql from "highlight.js/lib/languages/sql";
import yaml from "highlight.js/lib/languages/yaml";
import diff from "highlight.js/lib/languages/diff";

import { DEFAULT_DOC_STYLE, buildStandaloneStyle } from "./document-style.js";

/* ------------------------------------------------------------------ */
/* Elements                                                            */
/* ------------------------------------------------------------------ */

const app = document.getElementById("app");
const doc = document.getElementById("doc");
const previewPane = document.getElementById("preview-pane");
const progressBar = document.getElementById("progress-bar");
const outlineEl = document.getElementById("outline");
const sourceEl = document.getElementById("source");
const fileNameEl = document.getElementById("file-name");
const fileInput = document.getElementById("file-input");
const openBtn = document.getElementById("open-btn");
const exportBtn = document.getElementById("export-btn");
const wordsEl = document.getElementById("stat-words");
const timeEl = document.getElementById("stat-time");
const statusHint = document.querySelector(".status-hint");
const viewButtons = [...document.querySelectorAll("[data-view-btn]")];
const themeButtons = [...document.querySelectorAll("[data-theme-btn]")];
const metaThemeColor = document.querySelector('meta[name="theme-color"]');
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

const customizeBtn = document.getElementById("customize-btn");
const customizerEl = document.getElementById("customizer");
const customizeCloseBtn = document.getElementById("customize-close");
const exportOverlay = document.getElementById("export-overlay");
const docStyleEl = document.getElementById("doc-style");
const docStyleEditor = document.getElementById("doc-style-editor");
const copyDocStyleBtn = document.getElementById("copy-doc-style");
const resetDocStyleBtn = document.getElementById("reset-doc-style");
const printPdfBtn = document.getElementById("print-pdf");
const printBtn = document.getElementById("print-btn");
const exportProgressBtn = document.getElementById("export-progress");
const importProgressBtn = document.getElementById("import-progress");
const progressInput = document.getElementById("progress-input");

const UNTITLED_NAME = "untitled.md";
const WORDS_PER_MINUTE = 220;

/* ------------------------------------------------------------------ */
/* Storage                                                             */
/* ------------------------------------------------------------------ */

const storage = {
  get(key) {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  set(key, value) {
    try {
      localStorage.setItem(key, value);
    } catch {
      /* private mode */
    }
  },
};

/* ------------------------------------------------------------------ */
/* Markdown pipeline                                                   */
/* ------------------------------------------------------------------ */

hljs.registerLanguage("javascript", javascript);
hljs.registerLanguage("typescript", typescript);
hljs.registerLanguage("python", python);
hljs.registerLanguage("bash", bash);
hljs.registerLanguage("json", json);
hljs.registerLanguage("css", css);
hljs.registerLanguage("xml", xml);
hljs.registerLanguage("markdown", markdown);
hljs.registerLanguage("sql", sql);
hljs.registerLanguage("yaml", yaml);
hljs.registerLanguage("diff", diff);

const escapeHtml = (value) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const slugify = (text) =>
  text
    .toLowerCase()
    .trim()
    .replace(/<[^>]+>/g, "")
    .replace(/[^\p{L}\p{N}\s-]/gu, "")
    .replace(/\s+/g, "-") || "section";

const md = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: true,
  breaks: false,
});

md.use(anchor, { level: [1, 2, 3, 4], slugify, tabIndex: false });
md.use(taskLists, { enabled: false, label: false, labelAfter: false });

md.renderer.rules.fence = (tokens, idx) => {
  const token = tokens[idx];
  const info = token.info ? token.info.trim() : "";
  const lang = info.split(/\s+/)[0] || "";
  const label = lang || "text";

  let body;
  if (lang && hljs.getLanguage(lang)) {
    try {
      body = hljs.highlight(token.content, { language: lang, ignoreIllegals: true }).value;
    } catch {
      body = escapeHtml(token.content);
    }
  } else {
    body = escapeHtml(token.content);
  }

  return [
    '<figure class="code-frame">',
    '<figcaption class="code-head">',
    `<span class="code-lang">${escapeHtml(label)}</span>`,
    '<button class="copy-btn" type="button" data-copy>Copy</button>',
    "</figcaption>",
    `<pre><code class="hljs">${body}</code></pre>`,
    "</figure>",
  ].join("");
};

const defaultLinkOpen = md.renderer.rules.link_open;
md.renderer.rules.link_open = (tokens, idx, options, env, self) => {
  const href = tokens[idx].attrGet("href") || "";
  if (/^https?:\/\//i.test(href)) {
    tokens[idx].attrSet("target", "_blank");
    tokens[idx].attrSet("rel", "noopener noreferrer");
  }
  return defaultLinkOpen
    ? defaultLinkOpen(tokens, idx, options, env, self)
    : self.renderToken(tokens, idx, options);
};

const defaultImage = md.renderer.rules.image;
md.renderer.rules.image = (tokens, idx, options, env, self) => {
  tokens[idx].attrSet("loading", "lazy");
  return defaultImage(tokens, idx, options, env, self);
};

const sanitize = (html) =>
  DOMPurify.sanitize(html, {
    ADD_ATTR: ["target", "rel", "loading"],
    FORBID_TAGS: ["style"],
  });

/* ------------------------------------------------------------------ */
/* Rendering                                                           */
/* ------------------------------------------------------------------ */

let headings = [];
let activeHeadingId = "";
let pinnedHeadingId = "";

const EMPTY_STATE = `
  <div class="doc-empty">
    <p class="doc-empty-title">A blank page.</p>
    <p class="doc-empty-copy">Open a markdown file, drop one anywhere on the page, or switch to Split and start writing.</p>
  </div>`;

function render(source, { resetScroll = false } = {}) {
  pinnedHeadingId = "";

  if (!source.trim()) {
    doc.innerHTML = EMPTY_STATE;
  } else {
    doc.innerHTML = sanitize(md.render(source));
    wrapTables();
  }

  headings = [...doc.querySelectorAll("h1, h2, h3")].filter(
    (heading) => !heading.closest(".doc-empty"),
  );
  ensureUniqueIds(headings);
  buildOutline();
  updateStats(source);

  if (resetScroll) previewPane.scrollTop = 0;

  requestAnimationFrame(() => {
    updateProgress();
    updateActiveHeading();
  });
}

function wrapTables() {
  doc.querySelectorAll("table").forEach((table) => {
    if (table.parentElement?.classList.contains("table-wrap")) return;
    const wrap = document.createElement("div");
    wrap.className = "table-wrap";
    table.replaceWith(wrap);
    wrap.append(table);
  });
}

function ensureUniqueIds(items) {
  const used = new Set();
  items.forEach((heading, index) => {
    let id = heading.id || `section-${index + 1}`;
    if (!heading.id) {
      while (used.has(id) || document.getElementById(id)) id += "-1";
      heading.id = id;
    }
    used.add(id);
  });
}

/* ------------------------------------------------------------------ */
/* Margin rail                                                         */
/* ------------------------------------------------------------------ */

function buildOutline() {
  outlineEl.replaceChildren();

  if (!headings.length) {
    const empty = document.createElement("p");
    empty.className = "rail-empty";
    empty.textContent = "Headings will appear here as soon as the document has some.";
    outlineEl.append(empty);
    activeHeadingId = "";
    return;
  }

  headings.forEach((heading) => {
    const item = document.createElement("button");
    item.type = "button";
    item.className = "outline-item";
    item.dataset.level = heading.tagName.slice(1);
    item.dataset.target = heading.id;
    item.title = heading.textContent.trim();

    const tick = document.createElement("span");
    tick.className = "tick";
    const label = document.createElement("span");
    label.className = "label";
    label.textContent = heading.textContent.trim();

    item.append(tick, label);
    outlineEl.append(item);
  });

  activeHeadingId = "";
  updateActiveHeading();
}

function updateActiveHeading() {
  if (!headings.length) return;

  if (pinnedHeadingId && document.getElementById(pinnedHeadingId)) {
    setActiveHeading(pinnedHeadingId);
    return;
  }

  const paneTop = previewPane.getBoundingClientRect().top;
  const threshold = 84;
  let active = headings[0];

  for (const heading of headings) {
    const top = heading.getBoundingClientRect().top - paneTop;
    if (top <= threshold) active = heading;
    else break;
  }

  const atBottom =
    previewPane.scrollTop + previewPane.clientHeight >= previewPane.scrollHeight - 4;
  if (atBottom && previewPane.scrollHeight > previewPane.clientHeight) {
    active = headings[headings.length - 1];
  }

  setActiveHeading(active.id);
}

function setActiveHeading(id) {
  if (id === activeHeadingId) return;
  activeHeadingId = id;

  outlineEl.querySelectorAll(".outline-item").forEach((item) => {
    const isActive = item.dataset.target === id;
    item.classList.toggle("is-active", isActive);
    if (isActive) item.setAttribute("aria-current", "true");
    else item.removeAttribute("aria-current");
  });
}

outlineEl.addEventListener("click", (event) => {
  const item = event.target.closest(".outline-item");
  if (!item) return;
  const heading = document.getElementById(item.dataset.target);
  if (!heading) return;

  // Keep the chosen entry marked until the reader scrolls by themselves.
  pinnedHeadingId = item.dataset.target;
  setActiveHeading(pinnedHeadingId);

  heading.scrollIntoView({
    behavior: reduceMotion.matches ? "auto" : "smooth",
    block: "start",
  });
});

const unpin = () => {
  pinnedHeadingId = "";
};
previewPane.addEventListener("wheel", unpin, { passive: true });
previewPane.addEventListener("touchmove", unpin, { passive: true });
previewPane.addEventListener("pointerdown", unpin);

/* ------------------------------------------------------------------ */
/* Progress, stats                                                     */
/* ------------------------------------------------------------------ */

function updateProgress() {
  const max = previewPane.scrollHeight - previewPane.clientHeight;
  const ratio = max > 0 ? previewPane.scrollTop / max : 0;
  progressBar.style.transform = `scaleX(${Math.min(1, Math.max(0, ratio))})`;
}

let scrollFrame = 0;
previewPane.addEventListener("scroll", () => {
  updateProgress();
  saveSession();
  if (scrollFrame) return;
  scrollFrame = requestAnimationFrame(() => {
    scrollFrame = 0;
    updateActiveHeading();
  });
});

function countWords(source) {
  const plain = source
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`[^`]*`/g, " ")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/^[#>\-*+~|=]+[ \t]*/gm, " ")
    .replace(/[*_~]/g, " ");
  return plain.trim() ? plain.trim().split(/\s+/).filter(Boolean).length : 0;
}

function updateStats(source) {
  const words = countWords(source);
  const minutes = words > 0 ? Math.ceil(words / WORDS_PER_MINUTE) : 0;
  wordsEl.textContent = `${words.toLocaleString()} ${words === 1 ? "word" : "words"}`;
  timeEl.textContent = `${minutes} min read`;
}

/* ------------------------------------------------------------------ */
/* Documents                                                           */
/* ------------------------------------------------------------------ */

function setDocument(text, name, { resetScroll = true } = {}) {
  sourceEl.value = text;
  fileNameEl.textContent = name;
  document.title = `${name} — folio`;
  render(text, { resetScroll });
  saveSession();
}

/* ------------------------------------------------------------------ */
/* Session — the page and reading position survive a reload            */
/* ------------------------------------------------------------------ */

const DOC_KEY = "folio-doc";
const DOC_NAME_KEY = "folio-doc-name";
const DOC_SCROLL_KEY = "folio-doc-scroll";

function scrollRatio() {
  const max = previewPane.scrollHeight - previewPane.clientHeight;
  return max > 0 ? Math.min(1, Math.max(0, previewPane.scrollTop / max)) : 0;
}

function restoreScroll(ratio) {
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      const max = previewPane.scrollHeight - previewPane.clientHeight;
      if (max > 0) previewPane.scrollTop = max * Math.min(1, Math.max(0, ratio));
    });
  });
}

function writeSession() {
  storage.set(DOC_KEY, sourceEl.value);
  storage.set(DOC_NAME_KEY, fileNameEl.textContent);
  storage.set(DOC_SCROLL_KEY, scrollRatio().toFixed(4));
}

let sessionTimer = 0;
function saveSession() {
  clearTimeout(sessionTimer);
  sessionTimer = setTimeout(writeSession, 350);
}

// Closing the tab mid-keystroke should not lose the last edit.
window.addEventListener("pagehide", () => {
  clearTimeout(sessionTimer);
  writeSession();
});

function buildProgress() {
  return {
    app: "folio",
    version: 1,
    savedAt: new Date().toISOString(),
    document: {
      name: fileNameEl.textContent,
      source: sourceEl.value,
      scroll: Number(scrollRatio().toFixed(4)),
    },
    settings: {
      view: app.dataset.view === "split" ? "split" : "read",
      theme: document.documentElement.classList.contains("dark") ? "dark" : "light",
      docStyle: docStyleEditor.value,
    },
  };
}

function flashButton(button, message) {
  const label = button.querySelector(".cz-button-label");
  if (!label) return;
  const original = label.textContent;
  label.textContent = message;
  clearTimeout(button._flashTimer);
  button._flashTimer = setTimeout(() => {
    label.textContent = original;
  }, 1600);
}

exportProgressBtn.addEventListener("click", () => {
  const data = buildProgress();
  const stem = (data.document.name || "untitled").replace(/\.[^.]+$/, "") || "untitled";
  const blob = new Blob([`${JSON.stringify(data, null, 2)}\n`], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${stem}-progress.json`;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  flashButton(exportProgressBtn, "Exported");
  flashStatus("Progress exported.");
});

importProgressBtn.addEventListener("click", () => progressInput.click());

progressInput.addEventListener("change", async () => {
  const file = progressInput.files?.[0];
  progressInput.value = "";
  if (!file) return;

  try {
    const data = JSON.parse(await file.text());
    const source = data?.document?.source;
    if (typeof source !== "string") throw new Error("Not a folio progress file.");

    const rawName = data.document.name;
    const name = typeof rawName === "string" && rawName.trim() ? rawName : UNTITLED_NAME;
    setDocument(source, name);

    const settings = data.settings ?? {};
    if (settings.view === "split" || settings.view === "read") setView(settings.view);
    if (settings.theme === "dark" || settings.theme === "light") {
      storage.set("folio-theme", settings.theme);
      setTheme(settings.theme);
    }
    if (typeof settings.docStyle === "string" && settings.docStyle.trim()) {
      docStyle = settings.docStyle;
      docStyleEditor.value = docStyle;
      applyDocStyle(docStyle);
    }

    const scroll = Number(data.document.scroll);
    if (Number.isFinite(scroll) && scroll > 0) restoreScroll(scroll);

    flashButton(importProgressBtn, "Imported");
    flashStatus(`Imported ${name}.`);
  } catch {
    flashButton(importProgressBtn, "Invalid file");
    flashStatus("That file is not a folio progress file.");
  }
});

function isTextFile(file) {
  return /\.(md|markdown|mdown|mdx|txt)$/i.test(file.name) || file.type.startsWith("text/");
}

let statusTimer = 0;
const defaultStatus = statusHint ? statusHint.textContent : "";
function flashStatus(message) {
  if (!statusHint) return;
  statusHint.textContent = message;
  clearTimeout(statusTimer);
  statusTimer = setTimeout(() => {
    statusHint.textContent = defaultStatus;
  }, 2600);
}

async function loadFile(file) {
  if (!isTextFile(file)) {
    flashStatus("Only markdown and text files, please.");
    return;
  }
  try {
    const text = await file.text();
    setDocument(text, file.name);
  } catch {
    flashStatus("That file could not be read.");
  }
}

openBtn.addEventListener("click", () => fileInput.click());

fileInput.addEventListener("change", () => {
  const file = fileInput.files?.[0];
  if (file) loadFile(file);
  fileInput.value = "";
});

let inputTimer = 0;
sourceEl.addEventListener("input", () => {
  clearTimeout(inputTimer);
  inputTimer = setTimeout(() => {
    render(sourceEl.value);
    saveSession();
  }, 60);
});

/* ------------------------------------------------------------------ */
/* Drag and drop                                                       */
/* ------------------------------------------------------------------ */

let dragDepth = 0;

const carriesFiles = (event) =>
  Boolean(event.dataTransfer) && [...event.dataTransfer.types].includes("Files");

const showDropTarget = () => document.body.classList.add("is-dragging");
const hideDropTarget = () => {
  dragDepth = 0;
  document.body.classList.remove("is-dragging");
};

window.addEventListener("dragenter", (event) => {
  if (!carriesFiles(event)) return;
  event.preventDefault();
  dragDepth += 1;
  showDropTarget();
});

window.addEventListener("dragover", (event) => {
  if (!carriesFiles(event)) return;
  event.preventDefault();
  event.dataTransfer.dropEffect = "copy";
  showDropTarget();
});

window.addEventListener("dragleave", (event) => {
  if (!carriesFiles(event)) {
    if (event.relatedTarget === null) hideDropTarget();
    return;
  }
  dragDepth = Math.max(0, dragDepth - 1);
  if (dragDepth === 0) hideDropTarget();
});

window.addEventListener("dragend", hideDropTarget);

window.addEventListener("drop", (event) => {
  if (!carriesFiles(event)) return;
  event.preventDefault();
  hideDropTarget();
  const file = [...(event.dataTransfer?.files || [])].find(isTextFile);
  if (file) loadFile(file);
  else flashStatus("Drop a markdown or text file.");
});

/* ------------------------------------------------------------------ */
/* Copy controls                                                       */
/* ------------------------------------------------------------------ */

async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const helper = document.createElement("textarea");
    helper.value = text;
    helper.setAttribute("readonly", "");
    helper.style.position = "fixed";
    helper.style.opacity = "0";
    document.body.append(helper);
    helper.select();
    let ok = false;
    try {
      ok = document.execCommand("copy");
    } catch {
      ok = false;
    }
    helper.remove();
    return ok;
  }
}

doc.addEventListener("click", async (event) => {
  const button = event.target.closest("[data-copy]");
  if (!button) return;
  const code = button.closest(".code-frame")?.querySelector("code");
  if (!code) return;

  const ok = await copyText(code.innerText);
  button.textContent = ok ? "Copied" : "Copy failed";
  button.classList.toggle("is-copied", ok);
  clearTimeout(button._copyTimer);
  button._copyTimer = setTimeout(() => {
    button.textContent = "Copy";
    button.classList.remove("is-copied");
  }, 1400);
});

/* ------------------------------------------------------------------ */
/* View mode                                                           */
/* ------------------------------------------------------------------ */

function setView(view, { persist = true } = {}) {
  app.dataset.view = view === "split" ? "split" : "read";
  viewButtons.forEach((button) => {
    button.setAttribute("aria-pressed", String(button.dataset.viewBtn === app.dataset.view));
  });
  if (persist) storage.set("folio-view", app.dataset.view);

  requestAnimationFrame(() => {
    updateProgress();
    updateActiveHeading();
  });
}

viewButtons.forEach((button) => {
  button.addEventListener("click", () => setView(button.dataset.viewBtn));
});

setView(storage.get("folio-view") === "split" ? "split" : "read", { persist: false });

/* ------------------------------------------------------------------ */
/* Markdown style + theme                                              */
/* ------------------------------------------------------------------ */

const DOC_STYLE_KEY = "folio-doc-style";
let docStyle = storage.get(DOC_STYLE_KEY) || DEFAULT_DOC_STYLE;

function applyDocStyle(style, { persist = true } = {}) {
  if (docStyleEl.textContent !== style) docStyleEl.textContent = style;
  if (persist) storage.set(DOC_STYLE_KEY, style);
}

docStyleEditor.value = docStyle;
applyDocStyle(docStyle, { persist: false });

let docStyleTimer = 0;
docStyleEditor.addEventListener("input", () => {
  clearTimeout(docStyleTimer);
  docStyleTimer = setTimeout(() => {
    docStyle = docStyleEditor.value;
    applyDocStyle(docStyle);
  }, 200);
});

copyDocStyleBtn.addEventListener("click", async () => {
  const ok = await copyText(buildStandaloneStyle(docStyleEditor.value));
  const original = copyDocStyleBtn.textContent;
  copyDocStyleBtn.textContent = ok ? "Copied" : "Copy failed";
  clearTimeout(copyDocStyleBtn._copyTimer);
  copyDocStyleBtn._copyTimer = setTimeout(() => {
    copyDocStyleBtn.textContent = original;
  }, 1400);
});

resetDocStyleBtn.addEventListener("click", () => {
  docStyle = DEFAULT_DOC_STYLE;
  docStyleEditor.value = docStyle;
  applyDocStyle(docStyle);
});

function printDocument() {
  if (!sourceEl.value.trim()) {
    flashStatus("Open a file or write something to export.");
    return;
  }
  window.print();
}

printPdfBtn.addEventListener("click", printDocument);
printBtn.addEventListener("click", printDocument);

/* Theme */

function setTheme(theme) {
  const dark = theme === "dark";
  document.documentElement.classList.toggle("dark", dark);
  themeButtons.forEach((button) => {
    button.setAttribute(
      "aria-pressed",
      String(button.dataset.themeBtn === (dark ? "dark" : "light")),
    );
  });
  if (metaThemeColor) metaThemeColor.setAttribute("content", dark ? "#0d1117" : "#ffffff");
}

themeButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const next = button.dataset.themeBtn === "dark" ? "dark" : "light";
    storage.set("folio-theme", next);
    setTheme(next);
  });
});

window
  .matchMedia("(prefers-color-scheme: dark)")
  .addEventListener("change", (event) => {
    if (!storage.get("folio-theme")) setTheme(event.matches ? "dark" : "light");
  });

setTheme(document.documentElement.classList.contains("dark") ? "dark" : "light");

/* ------------------------------------------------------------------ */
/* Panel open and close */

let lastFocusedBeforePanel = null;

function openCustomizer() {
  lastFocusedBeforePanel = document.activeElement;
  customizerEl.classList.add("is-open");
  customizerEl.inert = false;
  customizerEl.setAttribute("aria-hidden", "false");
  customizeBtn.setAttribute("aria-expanded", "true");
  customizeCloseBtn.focus();
}

function closeCustomizer({ restoreFocus = true } = {}) {
  if (!customizerEl.classList.contains("is-open")) return;
  customizerEl.classList.remove("is-open");
  customizerEl.inert = true;
  customizerEl.setAttribute("aria-hidden", "true");
  customizeBtn.setAttribute("aria-expanded", "false");
  if (restoreFocus && lastFocusedBeforePanel instanceof HTMLElement) {
    lastFocusedBeforePanel.focus();
  }
}

customizeBtn.addEventListener("click", () => {
  if (customizerEl.classList.contains("is-open")) closeCustomizer();
  else openCustomizer();
});

customizeCloseBtn.addEventListener("click", closeCustomizer);

document.addEventListener("pointerdown", (event) => {
  if (!customizerEl.classList.contains("is-open")) return;
  if (customizerEl.contains(event.target) || customizeBtn.contains(event.target)) return;
  closeCustomizer({ restoreFocus: false });
});

/* ------------------------------------------------------------------ */
/* Export                                                              */
/* ------------------------------------------------------------------ */

let pdfModulePromise = null;
function loadPdfModule() {
  if (!pdfModulePromise) pdfModulePromise = import("./pdf.js");
  return pdfModulePromise;
}

const warmPdf = () => {
  loadPdfModule().catch(() => {});
};
exportBtn.addEventListener("pointerenter", warmPdf, { once: true });
exportBtn.addEventListener("focus", warmPdf, { once: true });

let exporting = false;

exportBtn.addEventListener("click", async () => {
  if (exporting) return;
  if (!sourceEl.value.trim()) {
    flashStatus("Open a file or write something to export.");
    return;
  }

  exporting = true;
  exportBtn.disabled = true;
  exportBtn.setAttribute("aria-busy", "true");
  const label = exportBtn.querySelector(".btn-label");
  const originalLabel = label?.textContent || "Export PDF";
  if (label) label.textContent = "Preparing…";
  exportOverlay.hidden = false;
  flashStatus("Preparing PDF…");

  const wasDark = document.documentElement.classList.contains("dark");
  if (wasDark) document.documentElement.classList.remove("dark");

  try {
    render(sourceEl.value, { resetScroll: false });
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    const { downloadPdf } = await loadPdfModule();
    await downloadPdf({ element: doc, name: fileNameEl.textContent });
    flashStatus("PDF downloaded.");
  } catch (error) {
    console.error(error);
    flashStatus("Could not build the PDF.");
  } finally {
    if (wasDark) document.documentElement.classList.add("dark");
    exportOverlay.hidden = true;
    exporting = false;
    exportBtn.disabled = false;
    exportBtn.removeAttribute("aria-busy");
    if (label) label.textContent = originalLabel;
  }
});

/* ------------------------------------------------------------------ */
/* Keyboard                                                            */
/* ------------------------------------------------------------------ */

window.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && customizerEl.classList.contains("is-open")) {
    closeCustomizer();
    return;
  }

  const mod = event.metaKey || event.ctrlKey;
  if (!mod) return;

  const key = event.key.toLowerCase();
  if (key === "o") {
    event.preventDefault();
    fileInput.click();
  } else if (key === "e") {
    event.preventDefault();
    setView(app.dataset.view === "split" ? "read" : "split");
  }
});

/* ------------------------------------------------------------------ */
/* Start                                                               */
/* ------------------------------------------------------------------ */

const savedSource = storage.get(DOC_KEY);
const savedName = storage.get(DOC_NAME_KEY);
const savedScroll = Number.parseFloat(storage.get(DOC_SCROLL_KEY) ?? "0");

setDocument(
  savedSource ?? "",
  savedSource === null ? UNTITLED_NAME : savedName || UNTITLED_NAME,
  { resetScroll: savedSource === null },
);

if (savedSource && Number.isFinite(savedScroll) && savedScroll > 0) {
  restoreScroll(savedScroll);
}

doc.classList.add("is-entering");
doc.addEventListener(
  "animationend",
  () => doc.classList.remove("is-entering"),
  { once: true },
);
