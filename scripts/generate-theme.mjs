import { writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { STANDALONE_DOC_STYLE } from "../src/document-style.js";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
writeFileSync(resolve(root, "tailwind-theme.css"), `${STANDALONE_DOC_STYLE}\n`);
console.log("Wrote tailwind-theme.css");
