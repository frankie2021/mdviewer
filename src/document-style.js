export const DEFAULT_DOC_STYLE = `/* folio — markdown style
   This is a live Tailwind CSS v4 block. Edit text sizes, table borders,
   padding, fonts, colours — the preview and the PDF follow immediately.
   Colour tokens come from the viewer: --paper, --surface, --ink, --mute,
   --line, --accent, --code-bg, --code-mute. */

@custom-variant dark (&:where(.dark, .dark *));

@theme {
  --font-doc: "Instrument Sans Variable", ui-sans-serif, system-ui, sans-serif;
  --font-code: "JetBrains Mono Variable", ui-monospace, SFMono-Regular, Menlo, monospace;

  --text-doc: 16px;
  --text-doc--line-height: 1.7;
  --text-h1: 28px;
  --text-h2: 20.8px;
  --text-h3: 17.6px;
  --text-h4: 16px;
  --text-table: 14px;
  --text-code: 13.5px;

  --radius-doc: 6px;
}

@theme inline {
  --color-paper: var(--paper);
  --color-surface: var(--surface);
  --color-surface-2: var(--surface-2);
  --color-ink: var(--ink);
  --color-mute: var(--mute);
  --color-faint: var(--faint);
  --color-line: var(--line);
  --color-accent: var(--accent);
  --color-accent-soft: var(--accent-soft);
  --color-code: var(--code-bg);
  --color-code-mute: var(--code-mute);
}

@layer components {
  .md-body {
    @apply mx-auto w-full max-w-[46rem] px-5 pb-24 pt-14 font-doc text-doc text-ink sm:px-8;
  }

  .md-body p {
    @apply my-[0.9em];
    text-wrap: pretty;
  }

  .md-body h1,
  .md-body h2,
  .md-body h3,
  .md-body h4 {
    @apply text-balance font-semibold;
    scroll-margin-top: 1.5rem;
  }

  .md-body h1 {
    @apply text-h1 font-bold leading-[1.2] tracking-[-0.02em];
    margin: 0 0 0.45em;
  }

  .md-body h1 + p {
    @apply mt-0 text-[0.95em] leading-[1.6] text-mute;
  }

  .md-body h2 {
    @apply mt-[2em] mb-[0.5em] text-h2 leading-[1.3] tracking-[-0.012em];
  }

  .md-body h3 {
    @apply mt-[1.7em] mb-[0.35em] text-h3 leading-[1.4];
  }

  .md-body h4 {
    @apply mt-[1.5em] mb-[0.3em] text-h4 leading-[1.4];
  }

  .md-body a {
    @apply text-accent no-underline hover:underline;
    text-underline-offset: 2px;
  }

  .md-body strong {
    font-weight: 650;
  }

  .md-body em {
    @apply italic;
  }

  .md-body del {
    @apply text-mute;
  }

  .md-body ul {
    @apply my-[0.9em] list-disc pl-6;
  }

  .md-body ol {
    @apply my-[0.9em] list-decimal pl-6;
  }

  .md-body ul ul {
    @apply list-[circle];
  }

  .md-body ol ol {
    @apply list-[lower-alpha];
  }

  .md-body li {
    @apply my-[0.28em] pl-[0.15em];
  }

  .md-body li > ul,
  .md-body li > ol {
    @apply my-[0.25em];
  }

  .md-body li::marker {
    @apply text-faint;
  }

  .md-body blockquote {
    @apply my-6 rounded-doc border-l-[3px] border-accent bg-surface px-4 py-3 text-[0.95em] text-mute;
  }

  .md-body blockquote p {
    @apply my-[0.35em];
  }

  .md-body blockquote strong {
    @apply text-accent;
  }

  .md-body hr {
    @apply my-9 h-px border-0 bg-line;
  }

  .md-body img {
    @apply mx-auto my-7 max-w-full rounded-doc border border-line;
  }

  .md-body mark {
    @apply bg-accent-soft px-[0.15em] text-ink;
  }

  .md-body code {
    @apply rounded bg-surface-2 px-1.5 py-0.5 font-code text-code text-ink;
    overflow-wrap: break-word;
  }

  .md-body .code-frame {
    @apply my-6 overflow-hidden rounded-doc border border-line bg-code;
  }

  .md-body .code-head {
    @apply flex items-center justify-between border-b border-line px-4 py-1.5;
  }

  .md-body .code-lang {
    @apply font-code text-[11px] text-code-mute;
  }

  .md-body .copy-btn {
    @apply rounded border border-line px-2 py-0.5 text-[11px] text-code-mute;
  }

  .md-body .copy-btn:hover {
    @apply bg-surface-2 text-ink;
  }

  .md-body .copy-btn.is-copied {
    color: var(--syn-type);
  }

  .md-body .code-frame pre {
    @apply m-0 overflow-x-auto px-4 py-3;
  }

  .md-body .code-frame code {
    @apply block bg-transparent p-0 text-code;
  }

  .table-wrap {
    @apply my-6 overflow-x-auto rounded-doc bg-paper;
    border: 1px solid var(--line);
  }

  .md-body table {
    @apply w-full border-collapse text-table;
  }

  .md-body thead th {
    @apply border-b border-line bg-surface px-[15px] py-[10px] text-left font-semibold;
  }

  .md-body tbody td {
    @apply border-t border-line px-[15px] py-[10px] align-top;
  }

  .md-body tbody tr:first-child td {
    @apply border-t-0;
  }

  .md-body .contains-task-list {
    @apply list-none pl-1;
  }

  .md-body .task-list-item {
    @apply list-none;
  }

  .md-body .task-list-item-checkbox {
    appearance: none;
    position: relative;
    display: inline-block;
    width: 1em;
    height: 1em;
    margin-right: 0.55em;
    border: 1.5px solid var(--mute);
    border-radius: 3px;
    background: transparent;
    vertical-align: -0.08em;
  }

  .md-body .task-list-item-checkbox:checked {
    border-color: var(--accent);
    background: var(--accent);
  }

  .md-body .task-list-item-checkbox:checked::after {
    content: "";
    position: absolute;
    left: 0.24em;
    top: 0.03em;
    width: 0.26em;
    height: 0.52em;
    border: solid var(--paper);
    border-width: 0 1.5px 1.5px 0;
    transform: rotate(45deg);
  }

  .md-body .doc-empty {
    @apply py-4;
  }

  .md-body .doc-empty-title {
    @apply mb-[0.4em] text-[1.75em] font-bold tracking-[-0.02em] text-ink;
    margin-top: 0;
  }

  .md-body .doc-empty-copy {
    @apply m-0 max-w-[26rem] text-mute;
  }
}`;

const STANDALONE_COLORS = `:root {
  --paper: #ffffff;
  --surface: #f6f8fa;
  --surface-2: #eef1f4;
  --ink: #1f2328;
  --mute: #59636e;
  --faint: #7d8590;
  --line: #d8dee4;
  --accent: #0969da;
  --accent-soft: #ddf4ff;
  --code-bg: #f6f8fa;
  --code-mute: #6e7781;
}

.dark {
  --paper: #0d1117;
  --surface: #161b22;
  --surface-2: #21262d;
  --ink: #e6edf3;
  --mute: #9198a1;
  --faint: #6e7681;
  --line: #30363d;
  --accent: #4493f8;
  --accent-soft: #17243a;
  --code-bg: #161b22;
  --code-mute: #8b949e;
}`;

export function buildStandaloneStyle(style = DEFAULT_DOC_STYLE) {
  return `/* folio — markdown style, standalone
   Copy into a Tailwind CSS v4 project. */

@import "tailwindcss";

${STANDALONE_COLORS}

${style}`;
}

export const STANDALONE_DOC_STYLE = buildStandaloneStyle();
