export function AuthNotice({
  error,
  message,
}: {
  error?: string;
  message?: string;
}) {
  if (!error && !message) return null;
  return (
    <div
      className={`mb-5 rounded-2xl border px-4 py-3 text-sm leading-6 ${
        error
          ? "border-red-200 bg-red-50 text-red-700"
          : "border-[#cbd8fb] bg-[#eef3ff] text-[#3458b0]"
      }`}
      role={error ? "alert" : "status"}
      aria-live={error ? "assertive" : "polite"}
    >
      {error ?? message}
    </div>
  );
}

export const inputClass =
  "mt-2 h-12 w-full rounded-xl border border-[#d9e1f0] bg-white px-4 text-sm text-[#172344] outline-none transition placeholder:text-[#a0a9ba] focus:border-[#4f7df3] focus:ring-4 focus:ring-[#4f7df3]/10";

export const buttonClass =
  "mt-2 h-12 w-full rounded-xl bg-[#4f7df3] px-5 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(79,125,243,0.24)] transition hover:bg-[#416fe5]";
