# folio — markdown viewer

A quiet markdown viewer built with Vite and Tailwind CSS v4. The page is white, the type is sans, links are blue, and the outline lives in the margin. It starts on a blank page — open a file, drop one in, or write.

## Run it

```bash
npm install
npm run dev
```

Open the printed URL (http://localhost:5173). `npm run build` writes a static bundle to `dist/` that can be hosted anywhere.

## What it does

- Renders GitHub-flavoured markdown: tables, task lists, strikethrough, autolinks
- Margin rail with the document outline; ticks widen by heading level and the current one is marked as you read
- Read or Split view — edit the source and watch the page update
- Open a file with the button or **Ctrl/Cmd + O**; drop a `.md` file anywhere on the page
- **Export PDF** — builds and downloads a PDF directly, without a print dialog. The PDF is captured from the rendered page, so it matches the on-screen style: fonts, table borders and padding, code blocks, checkboxes, colours, and your custom CSS block. It is an image-based PDF, so text is not selectable.
- **Live markdown style editor** — the Customize panel contains one editable Tailwind CSS block that styles the markdown page. Change text sizes, table borders, cell padding, fonts, headings, code — the preview and the PDF update as you type.
- Light and dark themes, remembered between visits and seeded from your OS preference
- HTML in markdown is sanitised with DOMPurify

Keyboard: **Ctrl/Cmd + O** opens a file, **Ctrl/Cmd + E** toggles Split view, **Esc** closes the customizer. Ctrl/Cmd + P still prints the page.

## The markdown style block

The Customize button (sliders, top right) opens the panel. It has a Light/Dark switch and the full Tailwind CSS block that styles `.md-body`. It is compiled in the browser with `@tailwindcss/browser`, so `@theme`, `@apply`, arbitrary values, and plain CSS all work live.

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

Edit the numbers or the component rules directly. "Reset" restores the default block. "Copy" copies a standalone version of the block, with `@import "tailwindcss"` and the colour palette added, ready for a Tailwind v4 project. The same standalone stylesheet is generated as [`tailwind-theme.css`](tailwind-theme.css) with:

```bash
npm run theme
```

Colour tokens (`--paper`, `--surface`, `--ink`, `--mute`, `--line`, `--accent`, `--code-bg`, `--code-mute`) come from the viewer's light/dark theme, so the block works in both modes without duplicating colours. The default values live in [`src/style.css`](src/style.css); the editable block is in [`src/document-style.js`](src/document-style.js).

## Export PDF notes

- The PDF is produced from the rendered document (`html2pdf.js`), which is why it matches the screen exactly, including your style block.
- Because it is a raster capture, text in the PDF is not selectable or searchable. If you need selectable text, use Ctrl/Cmd + P and "Save as PDF"; the print stylesheet produces a light, text-based page.
- Images are captured when the browser can draw them (local/data images, and remote images that allow CORS). Other images appear as their alt text.
- Exporting from dark mode produces a light PDF (the page temporarily switches to the light theme so the margins and page background match).

## Typefaces

Self-hosted via Fontsource: Instrument Sans for the document and controls, JetBrains Mono for code.
