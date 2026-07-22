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

export type PdfReportChart = {
  title: string;
  type: "line" | "bar";
  points: Array<{ label: string; value: number }>;
  suffix?: string;
  maximum?: number;
  emptyMessage?: string;
};

export type PdfReportOptions = {
  churchName: string;
  title: string;
  period: string;
  scope: string;
  generatedBy: string;
  summary: Array<{ label: string; value: string | number }>;
  charts?: PdfReportChart[];
  tables: PdfReportTable[];
};

const PAGE_WIDTH = 842;
const PAGE_HEIGHT = 595;
const MARGIN = 40;
const NAVY = rgb(16 / 255, 28 / 255, 61 / 255);
const MUTED = rgb(104 / 255, 115 / 255, 138 / 255);
const BORDER = rgb(224 / 255, 230 / 255, 242 / 255);
const SUBTLE = rgb(247 / 255, 249 / 255, 253 / 255);
const ACCENT = rgb(79 / 255, 125 / 255, 243 / 255);
const SUCCESS = rgb(52 / 255, 116 / 255, 87 / 255);

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

function drawPageHeader(page: PDFPage, churchName: string, title: string, period: string, font: PDFFont, bold: PDFFont) {
  page.drawRectangle({ x: 0, y: PAGE_HEIGHT - 82, width: PAGE_WIDTH, height: 82, color: NAVY });
  page.drawText(fitText(churchName.toUpperCase(), bold, 10, 500), { x: MARGIN, y: PAGE_HEIGHT - 34, size: 10, font: bold, color: rgb(169 / 255, 192 / 255, 1) });
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

function chartValue(value: number, suffix = "") {
  return `${new Intl.NumberFormat("en-NG", { maximumFractionDigits: 1 }).format(value)}${suffix}`;
}

function drawLineChart(page: PDFPage, chart: PdfReportChart, x: number, top: number, width: number, height: number, font: PDFFont, bold: PDFFont) {
  page.drawRectangle({ x, y: top - height, width, height, color: rgb(1, 1, 1), borderColor: BORDER, borderWidth: 0.7 });
  page.drawText(fitText(chart.title, bold, 10, width - 20), { x: x + 10, y: top - 18, size: 10, font: bold, color: NAVY });
  const points = chart.points.slice(-10);
  if (!points.length) {
    page.drawText(fitText(chart.emptyMessage ?? "No chart data for this period.", font, 8.5, width - 20), { x: x + 10, y: top - 48, size: 8.5, font, color: MUTED });
    return;
  }

  const plotLeft = x + 34;
  const plotRight = x + width - 12;
  const plotTop = top - 38;
  const plotBottom = top - height + 27;
  const plotHeight = plotTop - plotBottom;
  const maximum = Math.max(chart.maximum ?? 0, ...points.map((point) => point.value), 1);
  for (let index = 0; index <= 3; index += 1) {
    const lineY = plotBottom + (plotHeight * index) / 3;
    page.drawLine({ start: { x: plotLeft, y: lineY }, end: { x: plotRight, y: lineY }, thickness: 0.45, color: BORDER });
  }
  const maxLabel = chartValue(maximum, chart.suffix);
  page.drawText(maxLabel, { x: plotLeft - font.widthOfTextAtSize(maxLabel, 6.5) - 4, y: plotTop - 2, size: 6.5, font, color: MUTED });
  page.drawText("0", { x: plotLeft - font.widthOfTextAtSize("0", 6.5) - 4, y: plotBottom - 2, size: 6.5, font, color: MUTED });

  const coordinates = points.map((point, index) => ({
    x: points.length === 1 ? (plotLeft + plotRight) / 2 : plotLeft + ((plotRight - plotLeft) * index) / (points.length - 1),
    y: plotBottom + (Math.max(0, point.value) / maximum) * plotHeight,
  }));
  coordinates.slice(1).forEach((coordinate, index) => {
    page.drawLine({ start: coordinates[index], end: coordinate, thickness: 2, color: ACCENT });
  });
  coordinates.forEach((coordinate) => {
    page.drawCircle({ x: coordinate.x, y: coordinate.y, size: 2.5, color: rgb(1, 1, 1), borderColor: ACCENT, borderWidth: 1.4 });
  });

  const labelEvery = Math.max(1, Math.ceil(points.length / 5));
  points.forEach((point, index) => {
    if (index % labelEvery !== 0 && index !== points.length - 1) return;
    const label = fitText(point.label, font, 6.5, 46);
    const labelWidth = font.widthOfTextAtSize(label, 6.5);
    page.drawText(label, { x: Math.max(x + 5, Math.min(coordinates[index].x - labelWidth / 2, x + width - labelWidth - 5)), y: plotBottom - 14, size: 6.5, font, color: MUTED });
  });
}

function drawBarChart(page: PDFPage, chart: PdfReportChart, x: number, top: number, width: number, height: number, font: PDFFont, bold: PDFFont) {
  page.drawRectangle({ x, y: top - height, width, height, color: rgb(1, 1, 1), borderColor: BORDER, borderWidth: 0.7 });
  page.drawText(fitText(chart.title, bold, 10, width - 20), { x: x + 10, y: top - 18, size: 10, font: bold, color: NAVY });
  const points = chart.points.slice(0, 6);
  if (!points.length) {
    page.drawText(fitText(chart.emptyMessage ?? "No chart data for this period.", font, 8.5, width - 20), { x: x + 10, y: top - 48, size: 8.5, font, color: MUTED });
    return;
  }

  const maximum = Math.max(chart.maximum ?? 0, ...points.map((point) => point.value), 1);
  const labelWidth = Math.min(104, width * 0.31);
  const valueWidth = 42;
  const barLeft = x + 10 + labelWidth;
  const barWidth = width - labelWidth - valueWidth - 24;
  const rowHeight = Math.min(20, (height - 42) / points.length);
  points.forEach((point, index) => {
    const rowY = top - 41 - index * rowHeight;
    page.drawText(fitText(point.label, font, 7.5, labelWidth - 8), { x: x + 10, y: rowY - 2, size: 7.5, font, color: NAVY });
    page.drawRectangle({ x: barLeft, y: rowY - 3, width: barWidth, height: 7, color: SUBTLE });
    page.drawRectangle({ x: barLeft, y: rowY - 3, width: Math.max(2, barWidth * (Math.max(0, point.value) / maximum)), height: 7, color: index === 0 ? SUCCESS : ACCENT });
    const value = chartValue(point.value, chart.suffix);
    page.drawText(value, { x: x + width - 10 - font.widthOfTextAtSize(value, 7.5), y: rowY - 2, size: 7.5, font: bold, color: NAVY });
  });
}

export async function createPdfReport(options: PdfReportOptions) {
  const document = await PDFDocument.create();
  const font = await document.embedFont(StandardFonts.Helvetica);
  const bold = await document.embedFont(StandardFonts.HelveticaBold);
  document.setTitle(safePdfText(`${options.churchName} - ${options.title}`));
  document.setAuthor(safePdfText(options.churchName));
  document.setSubject(safePdfText(options.scope));
  document.setCreator("Flock church workforce system");
  document.setProducer("Flock");
  document.setCreationDate(new Date());

  let page = document.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  drawPageHeader(page, options.churchName, options.title, options.period, font, bold);
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
    drawPageHeader(page, options.churchName, options.title, options.period, font, bold);
    y = PAGE_HEIGHT - 112;
  }

  const charts = options.charts?.slice(0, 2) ?? [];
  if (charts.length) {
    const chartGap = 12;
    const chartWidth = (PAGE_WIDTH - MARGIN * 2 - chartGap) / 2;
    const chartHeight = 166;
    charts.forEach((chart, index) => {
      const chartX = MARGIN + index * (chartWidth + chartGap);
      if (chart.type === "line") drawLineChart(page, chart, chartX, y, chartWidth, chartHeight, font, bold);
      else drawBarChart(page, chart, chartX, y, chartWidth, chartHeight, font, bold);
    });
    y -= chartHeight + 24;
    newPage();
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
    const footer = `${safePdfText(options.churchName)}  |  Generated ${generatedAt} by ${safePdfText(options.generatedBy)}  |  Confidential`;
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
