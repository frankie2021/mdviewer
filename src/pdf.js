import html2pdf from "html2pdf.js";

const PAGE_MARGIN_MM = 14;

function baseName(name) {
  return (name || "untitled").replace(/\.[^.]+$/, "") || "untitled";
}

function replaceTaskInputs(root) {
  const accent = getComputedStyle(document.documentElement).getPropertyValue("--accent").trim() || "#0969da";

  root.querySelectorAll("input.task-list-item-checkbox").forEach((input) => {
    const checked = input.checked || input.hasAttribute("checked");
    const box = document.createElement("span");
    box.className = `task-list-item-checkbox pdf-task-checkbox${checked ? " is-checked" : ""}`;
    box.setAttribute("aria-hidden", "true");

    if (checked) {
      box.style.position = "relative";
      box.style.backgroundColor = accent;
      box.style.borderColor = accent;

      const mark = document.createElement("span");
      mark.style.position = "absolute";
      mark.style.left = "28%";
      mark.style.top = "6%";
      mark.style.width = "28%";
      mark.style.height = "52%";
      mark.style.border = "solid #ffffff";
      mark.style.borderWidth = "0 0.14em 0.14em 0";
      mark.style.transform = "rotate(45deg)";
      box.append(mark);
    }

    input.replaceWith(box);
  });
}

export async function downloadPdf({ element, name }) {
  if (!element) throw new Error("There is no document to export.");

  await document.fonts.ready;

  const styles = getComputedStyle(element);
  const maxWidth = parseFloat(styles.maxWidth);
  const contentWidth = Number.isFinite(maxWidth)
    ? maxWidth - parseFloat(styles.paddingLeft) - parseFloat(styles.paddingRight)
    : element.clientWidth -
      parseFloat(styles.paddingLeft) -
      parseFloat(styles.paddingRight);
  const width = Math.max(Math.round(contentWidth), 320);
  const paper = getComputedStyle(document.documentElement).getPropertyValue("--paper").trim() || "#ffffff";

  const clone = element.cloneNode(true);
  clone.classList.remove("is-entering");
  clone.classList.add("is-exporting");
  clone.querySelectorAll(".copy-btn").forEach((button) => button.remove());
  replaceTaskInputs(clone);

  const host = document.createElement("div");
  host.className = "pdf-host";
  host.style.width = `${width}px`;
  host.style.background = paper;
  host.append(clone);
  document.body.append(host);

  try {
    await Promise.all(
      [...clone.querySelectorAll("img")].map(
        (image) =>
          new Promise((resolve) => {
            if (image.complete) resolve();
            else {
              image.addEventListener("load", resolve, { once: true });
              image.addEventListener("error", resolve, { once: true });
            }
          }),
      ),
    );

    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));

    const scale = Math.min(3, Math.max(1.2, 14000 / Math.max(clone.scrollHeight, 1)));

    await html2pdf()
      .set({
        margin: [PAGE_MARGIN_MM, PAGE_MARGIN_MM, PAGE_MARGIN_MM + 2, PAGE_MARGIN_MM],
        filename: `${baseName(name)}.pdf`,
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: {
          scale,
          useCORS: true,
          backgroundColor: paper,
          logging: false,
          scrollX: 0,
          scrollY: 0,
        },
        jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
        pagebreak: {
          mode: ["css", "legacy"],
          avoid: ["tr", "pre", "blockquote", "img", "h1", "h2", "h3", "h4"],
        },
      })
      .from(clone)
      .save();
  } finally {
    host.remove();
  }
}
