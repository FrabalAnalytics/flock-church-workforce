export default function WorkspaceLoading() {
  return (
    <div className="mx-auto max-w-7xl animate-pulse" aria-label="Loading workspace" role="status">
      <span className="sr-only">Loading workspace content</span>
      <div className="h-3 w-32 rounded-full bg-[#dfe6f3]" />
      <div className="mt-4 h-10 w-72 max-w-full rounded-xl bg-[#e4eaf5]" />
      <div className="mt-3 h-4 w-[32rem] max-w-full rounded-full bg-[#e8edf6]" />
      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[0, 1, 2, 3].map((item) => <div key={item} className="h-36 rounded-3xl border border-[var(--color-border)] bg-white" />)}
      </div>
      <div className="mt-7 h-80 rounded-3xl border border-[var(--color-border)] bg-white" />
    </div>
  );
}
