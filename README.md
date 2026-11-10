# folio — markdown viewer

A quiet markdown viewer built with Vite and Tailwind CSS v4. The page is white, the type is sans, links are blue, and the outline lives in the margin. It starts on a blank page — open a file, drop one in, or write.

## Run it

```bash
npm install
npm run dev
```

Open the printed URL (http://localhost:5173). `npm run build` writes a static bundle to `dist/` that can be hosted anywhere; `npm run preview` serves that build.

On Windows you can skip the terminal entirely: double-click [`start.bat`](start.bat). It checks for Node.js, installs dependencies the first time, starts the dev server, and opens the app in your browser.

## What it does

- Renders GitHub-flavoured markdown: tables, task lists, strikethrough, autolinks, fenced code with syntax highlighting
- Margin rail with the document outline; ticks widen by heading level and the current heading is marked as you scroll
- Read or Split view — edit the source on the left, watch the page on the right
- Open a file with the button or **Ctrl/Cmd + O**; drop a `.md` file anywhere on the page
- Light and dark themes, remembered between visits and seeded from your OS preference
- HTML in markdown is sanitised with DOMPurify

Keyboard: **Ctrl/Cmd + O** opens a file, **Ctrl/Cmd + E** toggles Split view, **Esc** closes the Customize panel.

## Exporting a PDF

There are two ways out, because a browser cannot silently generate a text-based PDF on its own.

| | **Export PDF** (toolbar, download icon) | **Print** (printer icon, or the Print link in Customize) |
|---|---|---|
| Dialog | None — the file downloads | Browser print preview, then **Save as PDF** |
| Built with | `html2pdf.js` — the rendered page is rasterised | The browser's own HTML → PDF engine |
| Text | An image; not selectable or searchable | Real text, selectable and searchable |
| Styling | Matches the screen exactly, including your style block | Uses the `@media print` stylesheet in `src/style.css` |

The direct exporter captures the document at its reading width (46rem minus padding), so exporting from Split view gives the same layout as Read view. Exporting from dark mode produces a light PDF: the page briefly switches to the light theme while it is captured so the background and margins match.

Notes on the direct export: images render when the browser is allowed to draw them (local/data images, and remote images that send CORS headers); other images fall back to their alt text. Task-list checkboxes are redrawn as plain elements before capture because `html2canvas` cannot parse `<input>` styling.

## The markdown style block

The Customize button (sliders, top right) opens the panel. Alongside the Light/Dark switch is the full Tailwind CSS block that styles `.md-body`. It is compiled in the browser with `@tailwindcss/browser`, so `@theme`, `@apply`, arbitrary values, and plain CSS all work live — the preview re-renders as you type.

The default block starts with the values you are most likely to change:

```css
@theme {
  --text-doc: 16px;       /* body text */
  --text-h1: 28px;
  --text-h2: 20.8px;
  --text-table: 14px;
  --text-code: 13.5px;
  --radius-doc: 6px;
}

@layer components {
  .md-body thead th {
    @apply border-b border-line bg-surface px-[15px] py-[10px];
  }
  .table-wrap {
    border: 1px solid var(--line);
  }
}
```

Edit the numbers or the component rules directly. **Reset** restores the default block. **Copy** copies a standalone version — `@import "tailwindcss"` plus the colour palette plus your block — ready to paste into a Tailwind v4 project. The same standalone stylesheet is written to [`tailwind-theme.css`](tailwind-theme.css) with:

```bash
npm run theme
```

Colour tokens (`--paper`, `--surface`, `--ink`, `--mute`, `--line`, `--accent`, `--code-bg`, `--code-mute`) come from the viewer's light/dark theme, so one block serves both modes without duplicating colours.

## Where things live

| Path | What it is |
|---|---|
| `index.html` | App shell: toolbar, rail, editor, preview, Customize panel |
| `src/main.js` | Rendering, outline and scroll-spy, views, drag and drop, theme, export wiring, keyboard |
| `src/style.css` | Viewer chrome, palette, syntax colours, and the `@media print` stylesheet |
| `src/document-style.js` | The default markdown style block and the standalone export of it |
| `src/pdf.js` | Direct PDF export (`html2pdf.js` capture and download) |
| `scripts/generate-theme.mjs` | Writes `tailwind-theme.css` from the default block |
| `tailwind-theme.css` | Generated standalone stylesheet — do not edit by hand |
| `public/` | Static assets (favicon) |

Saved preferences use three localStorage keys: `folio-theme` (light/dark), `folio-view` (read/split), and `folio-doc-style` (your style block). The theme and style block are applied before first paint, so there is no flash on reload.

## Typefaces

Self-hosted via Fontsource: Instrument Sans for the document and controls, JetBrains Mono for code.
