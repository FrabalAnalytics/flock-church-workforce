import Link from "next/link";
import { FlockBrand } from "@/components/flock-brand";

export function AuthShell({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <main className="grid min-h-screen bg-[#fbfcff] lg:grid-cols-[0.9fr_1.1fr]">
      <section className="hidden bg-[#101c3d] p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <Link href="/" className="w-fit rounded-xl bg-white px-3">
          <FlockBrand compact />
        </Link>
        <div className="max-w-lg">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#8ba9ff]">
            Church workforce, cared for
          </p>
          <p className="mt-6 text-4xl font-semibold leading-tight tracking-[-0.04em]">
            Notice the pattern. Reach out with care. Keep people connected.
          </p>
        </div>
        <p className="text-xs text-[#8996b4]">Flock · Built for the rhythm of church life</p>
      </section>

      <section className="flex items-center justify-center px-5 py-10 sm:px-8">
        <div className="w-full max-w-md">
          <Link href="/" className="mb-8 block w-fit rounded-xl bg-white px-2 lg:hidden">
            <FlockBrand compact />
          </Link>
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#4f7df3]">
            {eyebrow}
          </p>
          <h1 className="mt-3 text-4xl font-semibold tracking-[-0.04em] text-[#101c3d]">
            {title}
          </h1>
          <p className="mt-3 text-sm leading-6 text-[#68738a]">{description}</p>
          <div className="mt-8">{children}</div>
        </div>
      </section>
    </main>
  );
}
