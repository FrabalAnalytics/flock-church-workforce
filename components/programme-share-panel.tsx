"use client";

import Image from "next/image";
import { useState } from "react";
import {
  disableProgrammeShare,
  enableProgrammeShare,
  rotateProgrammeShare,
} from "@/app/app/programmes/actions";
import { FormSubmitButton } from "@/components/form-submit-button";

type ProgrammeSharePanelProps = {
  programmeId: string;
  enabled: boolean;
  shareUrl: string | null;
  qrDataUrl: string | null;
  expiresAt: string | null;
};

export function ProgrammeSharePanel({
  programmeId,
  enabled,
  shareUrl,
  qrDataUrl,
  expiresAt,
}: ProgrammeSharePanelProps) {
  const [copyLabel, setCopyLabel] = useState("Copy link");
  const expired = Boolean(expiresAt && new Date(expiresAt) <= new Date());

  async function copyLink() {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopyLabel("Copied");
      window.setTimeout(() => setCopyLabel("Copy link"), 1800);
    } catch {
      setCopyLabel("Copy failed");
      window.setTimeout(() => setCopyLabel("Copy link"), 1800);
    }
  }

  if (enabled && (!shareUrl || !qrDataUrl)) {
    return (
      <section className="print:hidden border-t border-[#f0d7d4] bg-[#fff9f8] px-5 py-5 sm:px-7">
        <p className="text-sm font-semibold text-[#a94740]">Public app address unavailable</p>
        <p className="mt-1 text-xs leading-5 text-[#7d5a57]">Set NEXT_PUBLIC_APP_URL to the deployed HTTPS address, then reload this page to regenerate the correct link and QR code.</p>
      </section>
    );
  }

  if (!enabled || !shareUrl || !qrDataUrl) {
    return (
      <section className="print:hidden border-t border-[#e5e9f1] bg-[#f8faff] px-5 py-5 sm:px-7">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold text-[#34415f]">Share by link or QR code</p>
            <p className="mt-1 text-xs leading-5 text-[#758097]">Create a private public link for this published programme. Visitors can see only the schedule, and you can revoke access at any time.</p>
          </div>
          <form action={enableProgrammeShare} className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <input type="hidden" name="programme_id" value={programmeId} />
            <label className="text-xs font-semibold text-[#68738a]">Link access period
              <select name="expiry_days" defaultValue="30" className="mt-1 h-11 w-full rounded-xl border border-[#dce3f1] bg-white px-3 text-sm font-normal sm:w-44">
                <option value="7">7 days</option>
                <option value="30">30 days</option>
                <option value="90">90 days</option>
                <option value="never">No expiry</option>
              </select>
            </label>
            <FormSubmitButton pendingLabel="Creating link..." className="h-11 rounded-xl bg-[var(--color-primary)] px-5 text-sm font-semibold text-white disabled:cursor-wait disabled:opacity-60">Create public link</FormSubmitButton>
          </form>
        </div>
      </section>
    );
  }

  return (
    <section className="print:hidden border-t border-[#dbe3f2] bg-[#f8faff] px-5 py-6 sm:px-7">
      <div className="grid gap-6 lg:grid-cols-[1fr_210px] lg:items-start">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-sm font-semibold text-[#34415f]">Public programme link</h3>
            <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${expired ? "bg-[#fff1f0] text-[#a94740]" : "bg-[#eaf8f0] text-[#27754c]"}`}>{expired ? "Expired" : "Active"}</span>
          </div>
          <p className="mt-2 text-xs leading-5 text-[#758097]">Anyone with this hard-to-guess link can view the published schedule. No worker, attendance, account or internal programme data is exposed.</p>
          <label className="mt-4 block text-xs font-semibold text-[#68738a]">Share link
            <input readOnly value={shareUrl} onFocus={(event) => event.currentTarget.select()} className="mt-2 h-11 w-full rounded-xl border border-[#dce3f1] bg-white px-3 font-mono text-xs font-normal text-[#536078]" />
          </label>
          <p className="mt-2 text-xs text-[#8993a7]">{expiresAt ? `${expired ? "Expired" : "Expires"} ${new Intl.DateTimeFormat("en-NG", { dateStyle: "medium", timeStyle: "short" }).format(new Date(expiresAt))}` : "This link does not expire automatically."}</p>

          <div className="mt-4 flex flex-wrap gap-2">
            <button type="button" onClick={copyLink} className="min-h-10 rounded-xl bg-[var(--color-primary)] px-4 text-xs font-semibold text-white hover:bg-[var(--color-primary-strong)]">{copyLabel}</button>
            <a href={qrDataUrl} download={`flock-programme-${programmeId}.png`} className="inline-flex min-h-10 items-center rounded-xl border border-[#cad6ef] bg-white px-4 text-xs font-semibold text-[#4168cd]">Download QR</a>
            <a href={shareUrl} target="_blank" rel="noreferrer" className="inline-flex min-h-10 items-center rounded-xl border border-[#cad6ef] bg-white px-4 text-xs font-semibold text-[#536078]">Preview page</a>
          </div>

          <details className="mt-5 rounded-2xl border border-[#e0e6f2] bg-white p-4">
            <summary className="cursor-pointer text-xs font-semibold text-[#536078]">Link security and expiry</summary>
            <div className="mt-4 grid gap-4 xl:grid-cols-2">
              <form action={enableProgrammeShare} className="flex flex-col gap-3 sm:flex-row sm:items-end">
                <input type="hidden" name="programme_id" value={programmeId} />
                <label className="flex-1 text-xs font-semibold text-[#68738a]">Update access period
                  <select name="expiry_days" defaultValue="30" className="mt-1 h-10 w-full rounded-lg border border-[#dce3f1] bg-white px-3 text-xs font-normal">
                    <option value="7">7 days from now</option>
                    <option value="30">30 days from now</option>
                    <option value="90">90 days from now</option>
                    <option value="never">No expiry</option>
                  </select>
                </label>
                <FormSubmitButton pendingLabel="Updating..." className="h-10 rounded-lg bg-[#edf2ff] px-4 text-xs font-semibold text-[#4168cd] disabled:cursor-wait disabled:opacity-60">Update</FormSubmitButton>
              </form>
              <div className="flex flex-wrap items-end gap-2 xl:justify-end">
                <form action={rotateProgrammeShare} onSubmit={(event) => { if (!window.confirm("Replace this public link? The current URL and QR code will stop working immediately.")) event.preventDefault(); }}>
                  <input type="hidden" name="programme_id" value={programmeId} />
                  <input type="hidden" name="confirmation" value="rotate" />
                  <FormSubmitButton pendingLabel="Replacing..." className="h-10 rounded-lg border border-[#e4c98e] bg-[#fffaf0] px-4 text-xs font-semibold text-[#92661c] disabled:cursor-wait disabled:opacity-60">Replace link</FormSubmitButton>
                </form>
                <form action={disableProgrammeShare} onSubmit={(event) => { if (!window.confirm("Disable this public link now? Anyone using it will immediately lose access.")) event.preventDefault(); }}>
                  <input type="hidden" name="programme_id" value={programmeId} />
                  <FormSubmitButton pendingLabel="Disabling..." className="h-10 rounded-lg bg-[#fff1f0] px-4 text-xs font-semibold text-[#a94740] disabled:cursor-wait disabled:opacity-60">Disable link</FormSubmitButton>
                </form>
              </div>
            </div>
            <p className="mt-3 text-[11px] leading-5 text-[#8993a7]">Replacing the link immediately invalidates the old QR code and URL. Use it if a link was shared with the wrong audience.</p>
          </details>
        </div>
        <div className="rounded-2xl border border-[#dbe3f2] bg-white p-4 text-center shadow-[var(--shadow-sm)]">
          <Image src={qrDataUrl} alt="QR code for the public service programme" width={180} height={180} unoptimized className="mx-auto h-auto w-full max-w-[180px]" />
          <p className="mt-3 text-[11px] font-semibold text-[#68738a]">Scan to view programme</p>
        </div>
      </div>
    </section>
  );
}
