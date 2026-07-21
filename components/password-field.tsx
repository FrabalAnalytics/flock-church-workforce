"use client";

import { useId, useState } from "react";
import { inputClass } from "@/components/auth-form";

export function PasswordField({
  label,
  name,
  autoComplete,
  placeholder,
  minLength,
  hint,
}: {
  label: string;
  name: string;
  autoComplete: "current-password" | "new-password";
  placeholder?: string;
  minLength?: number;
  hint?: string;
}) {
  const [visible, setVisible] = useState(false);
  const inputId = useId();
  const hintId = useId();

  return (
    <div>
      <label htmlFor={inputId} className="block text-sm font-medium text-[#34415f]">{label}</label>
      <div className="relative">
        <input
          id={inputId}
          className={`${inputClass} pr-14`}
          name={name}
          type={visible ? "text" : "password"}
          autoComplete={autoComplete}
          required
          minLength={minLength}
          placeholder={placeholder}
          aria-describedby={hint ? hintId : undefined}
        />
        <button
          type="button"
          onClick={() => setVisible((current) => !current)}
          aria-label={`${visible ? "Hide" : "Show"} ${label.toLocaleLowerCase()}`}
          aria-pressed={visible}
          className="absolute right-1.5 top-3.5 flex h-9 w-10 items-center justify-center rounded-lg text-[#758097] transition hover:bg-[#f0f3f9] hover:text-[#34415f] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#4f7df3]"
        >
          {visible ? (
            <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5 fill-none stroke-current" strokeWidth="1.7" strokeLinecap="round"><path d="M3 3l18 18M10.6 10.7a2 2 0 0 0 2.7 2.7M9.8 5.2A10.6 10.6 0 0 1 12 5c5.5 0 9 7 9 7a15.8 15.8 0 0 1-2.2 3.1M6.4 6.4C4.2 7.9 3 10.2 3 12c0 0 3.5 7 9 7 1.4 0 2.7-.4 3.8-1" /></svg>
          ) : (
            <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5 fill-none stroke-current" strokeWidth="1.7"><path d="M3 12s3.5-7 9-7 9 7 9 7-3.5 7-9 7-9-7-9-7Z" /><circle cx="12" cy="12" r="2.5" /></svg>
          )}
        </button>
      </div>
      {hint && <p id={hintId} className="mt-2 text-xs leading-5 text-[#858fa3]">{hint}</p>}
    </div>
  );
}
