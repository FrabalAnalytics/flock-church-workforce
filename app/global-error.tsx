"use client";

export default function GlobalError({ unstable_retry }: { error: Error & { digest?: string }; unstable_retry: () => void }) {
  return (
    <html lang="en"><head><title>Something went wrong · Flock</title></head><body style={{ margin: 0, background: "#f5f7fc", color: "#101c3d", fontFamily: "Arial, sans-serif" }}><main style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 24 }}><section style={{ width: "100%", maxWidth: 520, boxSizing: "border-box", border: "1px solid #e0e6f2", borderRadius: 28, background: "white", padding: 36, textAlign: "center", boxShadow: "0 18px 50px rgba(16,28,61,.1)" }}><p style={{ color: "#a94740", fontSize: 13, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".12em" }}>Unexpected problem</p><h1 style={{ margin: "12px 0", fontSize: 32 }}>Flock could not load</h1><p style={{ color: "#667188", lineHeight: 1.6 }}>Your data has not been changed. Please retry, or return later if the problem continues.</p><button type="button" onClick={() => unstable_retry()} style={{ marginTop: 18, minHeight: 48, border: 0, borderRadius: 12, background: "#4f7df3", padding: "0 24px", color: "white", fontWeight: 700, cursor: "pointer" }}>Try again</button></section></main></body></html>
  );
}
