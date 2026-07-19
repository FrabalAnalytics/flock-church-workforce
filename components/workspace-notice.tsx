export function WorkspaceNotice({ message, error }: { message?: string; error?: string }) {
  if (!message && !error) return null;
  return <div className={`mb-6 rounded-2xl border px-4 py-3 text-sm ${error ? "border-red-200 bg-red-50 text-red-700" : "border-[#cbd8fb] bg-[#eef3ff] text-[#3458b0]"}`}>{error ?? message}</div>;
}
