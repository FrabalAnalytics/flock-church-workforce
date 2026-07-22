import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { FlockBrand } from "@/components/flock-brand";
import { createPublicClient } from "@/lib/supabase/public";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Service programme",
  description: "View a published Flock service programme.",
  robots: { index: false, follow: false },
};

type SharedProgrammeItem = {
  position: number;
  start_time: string;
  end_time: string;
  event_name: string;
  responsible_name: string;
  duration_minutes: number;
  notes: string | null;
};

type SharedProgramme = {
  title: string;
  service_date: string;
  service_type: string;
  updated_at: string;
  items: SharedProgrammeItem[];
};

function displayDate(value: string) {
  return new Intl.DateTimeFormat("en-NG", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${value}T00:00:00Z`));
}

function shortTime(value: string) {
  return value.slice(0, 5);
}

export default async function SharedProgrammePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  if (!/^[0-9a-f]{48}$/.test(token)) notFound();

  const supabase = createPublicClient();
  const { data, error } = await supabase.rpc("get_shared_service_programme", {
    p_token: token,
  });
  if (error || !data) notFound();

  const programme = data as SharedProgramme;
  const items = Array.isArray(programme.items) ? programme.items : [];
  const totalDuration = items.reduce((total, item) => total + item.duration_minutes, 0);

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,#edf2ff_0,#f8faff_38%,#fbfcff_70%)] px-4 py-6 sm:px-6 sm:py-10">
      <div className="mx-auto max-w-4xl">
        <header className="flex items-center justify-between gap-4">
          <Link href="/" aria-label="Flock home" className="rounded-xl bg-white px-2 shadow-[var(--shadow-sm)]">
            <FlockBrand compact />
          </Link>
          <span className="rounded-full border border-[#cad8fb] bg-white/85 px-3 py-1.5 text-xs font-semibold text-[#4168cd] shadow-[var(--shadow-sm)]">
            Published programme
          </span>
        </header>

        <section className="mt-6 overflow-hidden rounded-[2rem] border border-[#dbe3f2] bg-white shadow-[0_24px_80px_rgba(16,28,61,0.10)] sm:mt-8">
          <div className="border-b border-[#e5e9f1] bg-[linear-gradient(135deg,#101c3d,#1e3268)] px-5 py-8 text-center text-white sm:px-10 sm:py-11">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#a9c0ff]">TREM Ejigbo</p>
            <h1 className="mx-auto mt-4 max-w-2xl text-2xl font-semibold tracking-[-0.02em] sm:text-4xl">{programme.title}</h1>
            <p className="mt-4 text-sm font-medium text-[#dbe5ff] sm:text-base">{displayDate(programme.service_date)}</p>
            <p className="mt-1 text-sm text-[#aebfe8]">{programme.service_type}</p>
            {!!items.length && (
              <div className="mt-5 flex flex-wrap justify-center gap-2 text-xs font-semibold text-[#e5ebff]">
                <span className="rounded-full bg-white/10 px-3 py-1.5">{items.length} schedule {items.length === 1 ? "item" : "items"}</span>
                <span className="rounded-full bg-white/10 px-3 py-1.5">{totalDuration} minutes</span>
              </div>
            )}
          </div>

          <div className="hidden grid-cols-[130px_1.2fr_1fr_90px] gap-4 border-b border-[#e5e9f1] bg-[#f7f9fd] px-7 py-3 text-xs font-semibold uppercase tracking-[0.08em] text-[#68738a] md:grid">
            <span>Time</span><span>Activity</span><span>Responsible</span><span>Duration</span>
          </div>
          <div className="divide-y divide-[#edf0f6]">
            {items.map((item) => (
              <article key={item.position} className="grid gap-2 px-5 py-5 md:grid-cols-[130px_1.2fr_1fr_90px] md:gap-4 md:px-7">
                <p className="text-sm font-semibold text-[#4f7df3]">{shortTime(item.start_time)}–{shortTime(item.end_time)}</p>
                <div>
                  <h2 className="text-sm font-semibold text-[#34415f]">{item.event_name}</h2>
                  {item.notes && <p className="mt-1 text-xs leading-5 text-[#8993a7]">{item.notes}</p>}
                </div>
                <p className="text-sm text-[#5f6b82]">{item.responsible_name}</p>
                <p className="text-xs font-semibold text-[#8993a7] md:text-sm">{item.duration_minutes} min</p>
              </article>
            ))}
          </div>
          {!items.length && (
            <div className="px-5 py-12 text-center">
              <p className="font-semibold text-[#34415f]">Schedule details are being prepared</p>
              <p className="mt-2 text-sm text-[#8993a7]">Please check this link again later.</p>
            </div>
          )}
          <div className="border-t border-[#edf0f6] bg-[#fafbfe] px-5 py-4 text-center text-xs text-[#8993a7]">
            Last updated {new Intl.DateTimeFormat("en-NG", { dateStyle: "medium", timeStyle: "short" }).format(new Date(programme.updated_at))}
          </div>
        </section>

        <footer className="mt-6 flex flex-col items-center justify-between gap-3 px-2 text-center text-xs text-[#758097] sm:flex-row sm:text-left">
          <p>This private link can be disabled or replaced by a Flock administrator.</p>
          <Link href="/sign-in" className="font-semibold text-[#4168cd] hover:text-[#2f54b4]">Church team sign in</Link>
        </footer>
      </div>
    </main>
  );
}
