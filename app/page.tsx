"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase/clients";

type ConnectionStatus = "idle" | "testing" | "success" | "error";

export default function Home() {
  const [status, setStatus] = useState<ConnectionStatus>("idle");
  const [message, setMessage] = useState(
    "Run the connection test when your Supabase SQL is ready.",
  );

  async function testConnection() {
    setStatus("testing");
    setMessage("Connecting to Supabase...");

    const { data, error } = await supabase
      .from("connection_test")
      .select("message")
      .limit(1)
      .single();

    if (error) {
      setStatus("error");
      setMessage(`Connection failed: ${error.message}`);
      return;
    }

    setStatus("success");
    setMessage(data.message);
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-6 py-16 text-white">
      <section className="w-full max-w-2xl rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur sm:p-12">
        <p className="mb-4 text-sm font-semibold uppercase tracking-[0.3em] text-emerald-400">
          Church workforce care
        </p>
        <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
          Welcome to Flock
        </h1>
        <p className="mt-6 text-lg leading-8 text-slate-300">
          Flock helps churches replace paper attendance sheets with a simple
          digital workflow. Department heads can record attendance quickly,
          leaders can see workforce health in real time, and missing workers can
          receive timely follow-up before they become disconnected.
        </p>

        <div className="mt-10 rounded-2xl border border-white/10 bg-slate-900/80 p-6">
          <h2 className="text-lg font-semibold">Supabase connection</h2>
          <p
            className={`mt-2 text-sm leading-6 ${
              status === "success"
                ? "text-emerald-400"
                : status === "error"
                  ? "text-red-400"
                  : "text-slate-400"
            }`}
            aria-live="polite"
          >
            {message}
          </p>
          <button
            type="button"
            onClick={testConnection}
            disabled={status === "testing"}
            className="mt-5 rounded-full bg-emerald-400 px-6 py-3 font-semibold text-slate-950 transition hover:bg-emerald-300 disabled:cursor-wait disabled:opacity-60"
          >
            {status === "testing" ? "Testing connection..." : "Test connection"}
          </button>
        </div>
      </section>
    </main>
  );
}
