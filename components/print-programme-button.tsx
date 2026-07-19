"use client";

export function PrintProgrammeButton() {
  return <button type="button" onClick={() => window.print()} className="print:hidden rounded-xl border border-[#dce3f1] bg-white px-4 py-2.5 text-sm font-semibold text-[#536078]">Print / Save PDF</button>;
}
