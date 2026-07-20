export function WorkspaceNotice({ message, error }: { message?: string; error?: string }) {
  if (!message && !error) return null;
  return <div role={error ? "alert" : "status"} aria-live={error ? "assertive" : "polite"} className={`mb-6 flex items-start gap-3 rounded-2xl border px-4 py-3.5 text-sm leading-6 ${error ? "border-red-200 bg-red-50 text-red-700" : "border-[#cbd8fb] bg-[#eef3ff] text-[#3458b0]"}`}><span aria-hidden="true" className="mt-0.5 font-bold">{error ? "!" : "✓"}</span><span>{error ?? message}</span></div>;
}
