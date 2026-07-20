import Link from "next/link";
import { FlockBrand } from "@/components/flock-brand";

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--color-canvas)] px-5 py-10">
      <section className="w-full max-w-xl rounded-[2rem] border border-[var(--color-border)] bg-white p-7 text-center shadow-[0_24px_70px_rgba(41,61,112,0.12)] sm:p-12">
        <div className="mx-auto w-fit"><FlockBrand compact /></div>
        <p className="mt-8 text-sm font-semibold uppercase tracking-[0.16em] text-[var(--color-primary)]">404 · Page not found</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-[-0.035em] sm:text-4xl">This page has moved or does not exist</h1>
        <p className="mx-auto mt-4 max-w-md text-sm leading-7 text-[var(--color-text-secondary)]">Check the address, or return to the Flock home page and continue from there.</p>
        <Link href="/" className="mt-7 inline-flex min-h-12 items-center justify-center rounded-xl bg-[var(--color-primary)] px-6 text-sm font-semibold text-white hover:bg-[var(--color-primary-strong)]">Return home</Link>
      </section>
    </main>
  );
}
