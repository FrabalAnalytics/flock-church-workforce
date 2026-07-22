import assert from "node:assert/strict";
import test from "node:test";
import { PDFDocument } from "pdf-lib";
import { createPdfReport, safePdfText } from "../lib/pdf-report.ts";
import { parseReportFilters, reportChurchName, reportFilenameStem, reportPeriod } from "../lib/report-export.ts";

test("PDF text sanitization preserves report generation for unsupported glyphs", () => {
  assert.equal(safePdfText("Sunday — Service • 😀"), "Sunday - Service | ?");
});

test("report filters validate dates, service types and maximum range", () => {
  const valid = parseReportFilters("https://flock.example/api?from=2026-01-01&to=2026-01-31&service=Sunday%20Service");
  assert.deepEqual(valid, { from: "2026-01-01", to: "2026-01-31", service: "Sunday Service", department: null });
  assert.equal("error" in parseReportFilters("https://flock.example/api?from=bad&to=2026-01-31"), true);
  assert.equal("error" in parseReportFilters("https://flock.example/api?from=2020-01-01&to=2026-01-31"), true);
  assert.equal("error" in parseReportFilters("https://flock.example/api?service=Unknown"), true);
});

test("report period formats a readable inclusive range", () => {
  assert.equal(reportPeriod("2026-01-01", "2026-01-31"), "1 Jan 2026 - 31 Jan 2026");
});

test("report branding validates church names and creates safe filename stems", () => {
  assert.equal(reportChurchName("  TREM Victory Centre  "), "TREM Victory Centre");
  assert.equal(reportChurchName(""), "Flock Church");
  assert.equal(reportFilenameStem("TREM Victory Centre, Lagos"), "trem-victory-centre-lagos");
  assert.equal(reportFilenameStem("Église Grâce"), "eglise-grace");
});

test("PDF report builder creates a valid paginated document", async () => {
  const rows = Array.from({ length: 70 }, (_, index) => ({
    date: `2026-01-${String((index % 28) + 1).padStart(2, "0")}`,
    service: "Sunday Service",
    total: 100 + index,
  }));
  const bytes = await createPdfReport({
    churchName: "Test Church",
    title: "Attendance report",
    period: "1 Jan 2026 - 31 Jan 2026",
    scope: "All visible departments",
    generatedBy: "Test administrator",
    summary: [
      { label: "Services", value: 70 },
      { label: "Present", value: 7000 },
      { label: "Absent", value: 100 },
      { label: "Rate", value: "98%" },
    ],
    tables: [{
      title: "Service log",
      columns: [
        { key: "date", label: "Date", width: 120 },
        { key: "service", label: "Service", width: 260 },
        { key: "total", label: "Total", width: 100, align: "right" },
      ],
      rows,
    }],
  });
  assert.equal(new TextDecoder().decode(bytes.slice(0, 4)), "%PDF");
  const document = await PDFDocument.load(bytes);
  assert.ok(document.getPageCount() >= 3);
});
