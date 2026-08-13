import { PDFDocument, StandardFonts, rgb, type PDFFont } from "pdf-lib";

/**
 * Server-side PDF generation for school documents.
 *
 * `GeneratedDocument.pdfUrl` was always null: the only export was the browser's
 * "print" on an HTML page, which a school cannot attach to an e-mail or file.
 *
 * pdf-lib rather than headless Chrome: a Chromium download per deploy to render
 * a one-page declaration is not a trade a school server should make. The cost is
 * that this understands a deliberately small subset of HTML — headings,
 * paragraphs, line breaks, bold, lists, rules and signature lines — which is
 * what the document templates actually use. Anything richer needs a real engine,
 * and that is a decision to take when a template needs it.
 */

const A4 = { width: 595.28, height: 841.89 };
const MARGIN = 56;
const LINE_HEIGHT = 1.45;

type Block =
  | { kind: "heading"; level: 1 | 2 | 3; text: string }
  | {
      kind: "paragraph";
      text: string;
      bold?: boolean;
      align?: "left" | "center";
    }
  | { kind: "listItem"; text: string }
  | { kind: "rule" }
  | { kind: "space"; size: number };

function decodeEntities(value: string): string {
  return value
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&ordm;/g, "º")
    .replace(/&aacute;/g, "á")
    .replace(/&eacute;/g, "é")
    .replace(/&ccedil;/g, "ç")
    .replace(/&atilde;/g, "ã")
    .replace(/&otilde;/g, "õ");
}

function stripTags(value: string): string {
  return decodeEntities(value.replace(/<[^>]+>/g, ""))
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Turns the document HTML into a flat list of blocks. Only the structure the
 * templates use is recognised; unknown tags contribute their text.
 */
export function parseDocumentHtml(html: string): Block[] {
  // Body only, and drop anything that carries no printable text.
  const body = html.replace(/<(script|style|head)[\s\S]*?<\/\1>/gi, "");

  const blocks: Block[] = [];
  const tokens = body.match(
    /<h1[^>]*>[\s\S]*?<\/h1>|<h2[^>]*>[\s\S]*?<\/h2>|<h3[^>]*>[\s\S]*?<\/h3>|<li[^>]*>[\s\S]*?<\/li>|<p[^>]*>[\s\S]*?<\/p>|<div[^>]*>[\s\S]*?<\/div>|<hr\s*\/?>/gi
  );

  if (!tokens) {
    const text = stripTags(body);
    return text ? [{ kind: "paragraph", text }] : [];
  }

  for (const token of tokens) {
    const lower = token.toLowerCase();

    if (lower.startsWith("<hr")) {
      blocks.push({ kind: "rule" });
      continue;
    }

    const text = stripTags(token);
    if (!text) continue;

    if (lower.startsWith("<h1")) {
      blocks.push({ kind: "heading", level: 1, text });
    } else if (lower.startsWith("<h2")) {
      blocks.push({ kind: "heading", level: 2, text });
    } else if (lower.startsWith("<h3")) {
      blocks.push({ kind: "heading", level: 3, text });
    } else if (lower.startsWith("<li")) {
      blocks.push({ kind: "listItem", text });
    } else {
      // A centred signature line in the templates is a div with text-align.
      const centred = /text-align:\s*center/i.test(token);
      blocks.push({
        kind: "paragraph",
        text,
        align: centred ? "center" : "left",
      });
    }
  }

  return blocks;
}

/** Greedy word wrap for a given font and width. */
function wrap(
  text: string,
  font: PDFFont,
  size: number,
  maxWidth: number
): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;

    if (font.widthOfTextAtSize(candidate, size) <= maxWidth) {
      current = candidate;
      continue;
    }

    if (current) lines.push(current);
    current = word;
  }

  if (current) lines.push(current);
  return lines.length > 0 ? lines : [""];
}

export interface PdfOptions {
  title: string;
  /** Printed in the footer of every page. */
  footer?: string;
}

/** Renders the blocks of a document into PDF bytes. */
export async function renderDocumentPdf(
  html: string,
  options: PdfOptions
): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  const regular = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);

  pdf.setTitle(options.title);
  pdf.setCreator("Sistema de Gestão Escolar D'Ávilla");

  const contentWidth = A4.width - MARGIN * 2;
  const ink = rgb(0.1, 0.1, 0.1);
  const faint = rgb(0.55, 0.55, 0.55);

  let page = pdf.addPage([A4.width, A4.height]);
  let cursor = A4.height - MARGIN;

  const newPage = () => {
    page = pdf.addPage([A4.width, A4.height]);
    cursor = A4.height - MARGIN;
  };

  const ensure = (needed: number) => {
    if (cursor - needed < MARGIN + 40) newPage();
  };

  const writeLines = (
    lines: string[],
    font: PDFFont,
    size: number,
    align: "left" | "center" = "left"
  ) => {
    for (const line of lines) {
      ensure(size * LINE_HEIGHT);
      const width = font.widthOfTextAtSize(line, size);
      const x =
        align === "center" ? MARGIN + (contentWidth - width) / 2 : MARGIN;

      page.drawText(line, { x, y: cursor - size, size, font, color: ink });
      cursor -= size * LINE_HEIGHT;
    }
  };

  for (const block of parseDocumentHtml(html)) {
    switch (block.kind) {
      case "heading": {
        const size = block.level === 1 ? 16 : block.level === 2 ? 13 : 11.5;
        cursor -= size * 0.6;
        writeLines(
          wrap(block.text, bold, size, contentWidth),
          bold,
          size,
          block.level === 1 ? "center" : "left"
        );
        cursor -= size * 0.35;
        break;
      }
      case "paragraph": {
        const size = 10.5;
        writeLines(
          wrap(block.text, regular, size, contentWidth),
          regular,
          size,
          block.align ?? "left"
        );
        cursor -= size * 0.5;
        break;
      }
      case "listItem": {
        const size = 10.5;
        const lines = wrap(block.text, regular, size, contentWidth - 14);
        lines.forEach((line, index) => {
          ensure(size * LINE_HEIGHT);
          page.drawText(index === 0 ? `•  ${line}` : `    ${line}`, {
            x: MARGIN,
            y: cursor - size,
            size,
            font: regular,
            color: ink,
          });
          cursor -= size * LINE_HEIGHT;
        });
        break;
      }
      case "rule": {
        ensure(18);
        cursor -= 8;
        page.drawLine({
          start: { x: MARGIN, y: cursor },
          end: { x: MARGIN + contentWidth, y: cursor },
          thickness: 0.6,
          color: faint,
        });
        cursor -= 12;
        break;
      }
      case "space":
        cursor -= block.size;
        break;
    }
  }

  if (options.footer) {
    const pages = pdf.getPages();
    pages.forEach((current, index) => {
      const text = `${options.footer} · página ${index + 1} de ${pages.length}`;
      current.drawText(text, {
        x: MARGIN,
        y: MARGIN - 18,
        size: 8,
        font: regular,
        color: faint,
      });
    });
  }

  return pdf.save();
}
