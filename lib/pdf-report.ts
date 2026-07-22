import { PDFDocument, type PDFFont, type PDFPage, rgb, StandardFonts } from "pdf-lib";

export type PdfReportColumn = {
  key: string;
  label: string;
  width: number;
  align?: "left" | "right";
};

export type PdfReportTable = {
  title: string;
  columns: PdfReportColumn[];
  rows: Array<Record<string, string | number>>;
  emptyMessage?: string;
};

export type PdfReportOptions = {
  title: string;
  period: string;
  scope: string;
  generatedBy: string;
  summary: Array<{ label: string; value: string | number }>;
  tables: PdfReportTable[];
};

const PAGE_WIDTH = 842;
const PAGE_HEIGHT = 595;
const MARGIN = 40;
const NAVY = rgb(16 / 255, 28 / 255, 61 / 255);
const MUTED = rgb(104 / 255, 115 / 255, 138 / 255);
const BORDER = rgb(224 / 255, 230 / 255, 242 / 255);
const SUBTLE = rgb(247 / 255, 249 / 255, 253 / 255);

export function safePdfText(value: unknown) {
  return Array.from(String(value ?? ""), (character) => {
    const codePoint = character.codePointAt(0) ?? 0;
    if (codePoint === 0x2013 || codePoint === 0x2014) return "-";
    if (codePoint === 0x2022 || codePoint === 0x00b7) return "|";
    if ((codePoint >= 0x20 && codePoint <= 0x7e) || (codePoint >= 0x00a0 && codePoint <= 0x00ff)) return character;
    return "?";
  }).join("");
}

function fitText(text: unknown, font: PDFFont, size: number, maxWidth: number) {
  const safe = safePdfText(text);
  if (font.widthOfTextAtSize(safe, size) <= maxWidth) return safe;
  let result = safe;
  while (result.length > 1 && font.widthOfTextAtSize(`${result}...`, size) > maxWidth) {
    result = result.slice(0, -1);
  }
  return `${result.trimEnd()}...`;
}

function drawPageHeader(page: PDFPage, title: string, period: string, font: PDFFont, bold: PDFFont) {
  page.drawRectangle({ x: 0, y: PAGE_HEIGHT - 82, width: PAGE_WIDTH, height: 82, color: NAVY });
  page.drawText("FLOCK", { x: MARGIN, y: PAGE_HEIGHT - 34, size: 10, font: bold, color: rgb(169 / 255, 192 / 255, 1) });
  page.drawText(fitText(title, bold, 21, 500), { x: MARGIN, y: PAGE_HEIGHT - 59, size: 21, font: bold, color: rgb(1, 1, 1) });
  const periodText = fitText(period, font, 9, 220);
  page.drawText(periodText, { x: PAGE_WIDTH - MARGIN - font.widthOfTextAtSize(periodText, 9), y: PAGE_HEIGHT - 55, size: 9, font, color: rgb(219 / 255, 229 / 255, 1) });
}

function drawTableHeader(page: PDFPage, columns: PdfReportColumn[], y: number, font: PDFFont) {
  const width = columns.reduce((sum, column) => sum + column.width, 0);
  page.drawRectangle({ x: MARGIN, y: y - 20, width, height: 22, color: SUBTLE, borderColor: BORDER, borderWidth: 0.6 });
  let x = MARGIN;
  for (const column of columns) {
    const label = fitText(column.label.toUpperCase(), font, 7.5, column.width - 12);
    const labelWidth = font.widthOfTextAtSize(label, 7.5);
    page.drawText(label, {
      x: column.align === "right" ? x + column.width - labelWidth - 6 : x + 6,
      y: y - 13,
      size: 7.5,
      font,
      color: MUTED,
    });
    x += column.width;
  }
  return y - 20;
}

export async function createPdfReport(options: PdfReportOptions) {
  const document = await PDFDocument.create();
  const font = await document.embedFont(StandardFonts.Helvetica);
  const bold = await document.embedFont(StandardFonts.HelveticaBold);
  document.setTitle(safePdfText(options.title));
  document.setAuthor("Flock");
  document.setSubject(safePdfText(options.scope));
  document.setCreator("Flock church workforce system");
  document.setProducer("Flock");
  document.setCreationDate(new Date());

  let page = document.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  drawPageHeader(page, options.title, options.period, font, bold);
  let y = PAGE_HEIGHT - 112;

  page.drawText(fitText(options.scope, font, 9, PAGE_WIDTH - MARGIN * 2), { x: MARGIN, y, size: 9, font, color: MUTED });
  y -= 18;
  const cardGap = 10;
  const cardWidth = (PAGE_WIDTH - MARGIN * 2 - cardGap * 3) / 4;
  options.summary.slice(0, 4).forEach((item, index) => {
    const x = MARGIN + index * (cardWidth + cardGap);
    page.drawRectangle({ x, y: y - 54, width: cardWidth, height: 54, color: SUBTLE, borderColor: BORDER, borderWidth: 0.7 });
    page.drawText(fitText(item.label, font, 8, cardWidth - 18), { x: x + 9, y: y - 17, size: 8, font, color: MUTED });
    page.drawText(fitText(item.value, bold, 19, cardWidth - 18), { x: x + 9, y: y - 43, size: 19, font: bold, color: NAVY });
  });
  y -= 82;

  function newPage() {
    page = document.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
    drawPageHeader(page, options.title, options.period, font, bold);
    y = PAGE_HEIGHT - 112;
  }

  for (const table of options.tables) {
    if (y < 150) newPage();
    page.drawText(fitText(table.title, bold, 12, PAGE_WIDTH - MARGIN * 2), { x: MARGIN, y, size: 12, font: bold, color: NAVY });
    y -= 13;
    y = drawTableHeader(page, table.columns, y, bold);

    if (!table.rows.length) {
      page.drawText(safePdfText(table.emptyMessage ?? "No records match these filters."), { x: MARGIN + 6, y: y - 22, size: 9, font, color: MUTED });
      y -= 42;
      continue;
    }

    for (let rowIndex = 0; rowIndex < table.rows.length; rowIndex += 1) {
      if (y < 58) {
        newPage();
        page.drawText(fitText(`${table.title} (continued)`, bold, 11, PAGE_WIDTH - MARGIN * 2), { x: MARGIN, y, size: 11, font: bold, color: NAVY });
        y -= 13;
        y = drawTableHeader(page, table.columns, y, bold);
      }
      const row = table.rows[rowIndex];
      if (rowIndex % 2 === 1) {
        page.drawRectangle({ x: MARGIN, y: y - 21, width: table.columns.reduce((sum, column) => sum + column.width, 0), height: 21, color: rgb(251 / 255, 252 / 255, 1) });
      }
      let x = MARGIN;
      for (const column of table.columns) {
        const cell = fitText(row[column.key], font, 8, column.width - 12);
        const cellWidth = font.widthOfTextAtSize(cell, 8);
        page.drawText(cell, {
          x: column.align === "right" ? x + column.width - cellWidth - 6 : x + 6,
          y: y - 14,
          size: 8,
          font,
          color: NAVY,
        });
        x += column.width;
      }
      page.drawLine({ start: { x: MARGIN, y: y - 21 }, end: { x: x, y: y - 21 }, thickness: 0.4, color: BORDER });
      y -= 21;
    }
    y -= 24;
  }

  const pages = document.getPages();
  const generatedAt = new Intl.DateTimeFormat("en-NG", { dateStyle: "medium", timeStyle: "short", timeZone: "Africa/Lagos" }).format(new Date());
  pages.forEach((currentPage, index) => {
    const footer = `Generated ${generatedAt} by ${safePdfText(options.generatedBy)}  |  Confidential leadership report`;
    currentPage.drawText(fitText(footer, font, 7.5, 630), { x: MARGIN, y: 23, size: 7.5, font, color: MUTED });
    const pageNumber = `Page ${index + 1} of ${pages.length}`;
    currentPage.drawText(pageNumber, { x: PAGE_WIDTH - MARGIN - font.widthOfTextAtSize(pageNumber, 7.5), y: 23, size: 7.5, font, color: MUTED });
  });

  return document.save();
}

export function pdfDownloadResponse(bytes: Uint8Array, filename: string) {
  const body = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
  return new Response(body, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename.replace(/[^a-zA-Z0-9._-]/g, "-")}"`,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
