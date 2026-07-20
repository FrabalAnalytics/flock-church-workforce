import Link from "next/link";
import { FlockBrand } from "@/components/flock-brand";
import { PublicMobileNav } from "@/components/public-mobile-nav";

const features = [
  {
    number: "01",
    title: "Attendance that takes seconds",
    description:
      "After service, department heads check the Active workers who were present. Flock records everyone else as absent automatically.",
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M9 11.75 11.1 14 15.5 9.5M7 3v3m10-3v3M5.5 5h13A1.5 1.5 0 0 1 20 6.5v12a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 18.5v-12A1.5 1.5 0 0 1 5.5 5Z" />
      </svg>
    ),
  },
  {
    number: "02",
    title: "See workforce health clearly",
    description:
      "Church leaders get one dependable view of attendance patterns across every department and every service.",
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M4 19V9m6 10V5m6 14v-7m4 7H2" />
      </svg>
    ),
  },
  {
    number: "03",
    title: "Care before people disconnect",
    description:
      "Attendance patterns create clear care alerts so department and pastoral leaders can follow up personally and responsibly.",
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M20 11.5a8 8 0 0 1-11.7 7.1L4 20l1.4-4.1A8 8 0 1 1 20 11.5Z" />
        <path d="M8.5 11.5h.01m3.49 0h.01m3.49 0h.01" />
      </svg>
    ),
  },
  {
    number: "04",
    title: "Understand congregation growth",
    description:
      "Record adult male, adult female and children totals, then follow attendance trends across services without collecting attendee identities.",
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M16 20v-1.5a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4V20m7-9a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm8-1v6m3-3h-6" />
      </svg>
    ),
  },
  {
    number: "05",
    title: "Recognize every first step",
    description:
      "Track new members and new converts by male and female while keeping them correctly included in the overall congregation count.",
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 21s-7-4.35-7-11a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 6.65-7 11-7 11Z" />
      </svg>
    ),
  },
  {
    number: "06",
    title: "Lead with dependable reports",
    description:
      "Use trend charts, service logs and CSV exports to identify patterns and support better ministry decisions from phone or computer.",
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M4 19V5m0 14h16M7 15l4-4 3 2 5-7" />
      </svg>
    ),
  },
];

const steps = [
  ["Department heads record workers", "After service, each head checks the Active workers who were present. Flock records the complete department result."],
  ["The super admin records congregation", "Overall attendance is captured by adult male, adult female and children, with new members and converts identified as subsets."],
  ["Leaders see the whole picture", "Role-based dashboards reveal attendance trends, department performance, newcomers and people who may need care."],
  ["Care follows insight", "Opted-in messages and leadership alerts help the church respond to repeated absence with timely, human care."],
];

function Arrow() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true" className="h-4 w-4">
      <path d="M4 10h11m-4-4 4 4-4 4" />
    </svg>
  );
}

export default function Home() {
  return (
    <main className="overflow-hidden bg-[#fbfcff] text-[#101c3d]">
      <header className="relative z-20 border-b border-[#dfe6f8]/80 bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex h-24 max-w-7xl items-center justify-between px-5 sm:px-8 lg:px-12">
          <a href="#top" aria-label="Flock home" className="-ml-2">
            <FlockBrand compact />
          </a>

          <nav
            aria-label="Main navigation"
            className="hidden items-center gap-8 text-sm font-medium text-[#5e6880] md:flex"
          >
            <a className="transition hover:text-[#4f7df3]" href="#why-flock">
              Why Flock
            </a>
            <a className="transition hover:text-[#4f7df3]" href="#features">
              Features
            </a>
            <a className="transition hover:text-[#4f7df3]" href="#insights">
              Insights
            </a>
            <a className="transition hover:text-[#4f7df3]" href="#how-it-works">
              How it works
            </a>
          </nav>

          <div className="flex items-center gap-2 sm:gap-3">
            <PublicMobileNav />
            <Link
              href="/sign-in"
              className="hidden rounded-full px-3 py-2.5 text-sm font-semibold text-[#253252] transition hover:bg-[#f0f4ff] sm:inline-flex sm:px-5"
            >
              Sign in
            </Link>
            <Link
              href="/sign-up"
              className="rounded-full bg-[#4f7df3] px-4 py-2.5 text-sm font-semibold text-white shadow-[0_8px_24px_rgba(79,125,243,0.28)] transition hover:-translate-y-0.5 hover:bg-[#3f6fe5] sm:px-5"
            >
              Request access
            </Link>
          </div>
        </div>
      </header>

      <section
        id="top"
        className="relative isolate border-b border-[#e5eaf7] px-5 pb-20 pt-16 sm:px-8 sm:pb-28 sm:pt-24 lg:px-12 lg:pb-32"
      >
        <div className="absolute inset-x-0 top-0 -z-20 h-full bg-[radial-gradient(circle_at_76%_28%,rgba(79,125,243,0.16),transparent_32%),radial-gradient(circle_at_12%_85%,rgba(166,188,250,0.18),transparent_27%)]" />
        <div className="absolute right-[-7rem] top-[-8rem] -z-10 h-[26rem] w-[26rem] rounded-full border-[1px] border-[#4f7df3]/15 sm:h-[38rem] sm:w-[38rem]" />

        <div className="mx-auto grid max-w-7xl items-center gap-16 lg:grid-cols-[1.02fr_0.98fr] lg:gap-10">
          <div className="max-w-3xl">
            <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-[#d9e3ff] bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#3f67ce] shadow-sm">
              <span className="h-2 w-2 rounded-full bg-[#4f7df3]" />
              Church people and growth, understood
            </div>
            <h1 className="max-w-3xl text-balance text-[3.35rem] font-semibold leading-[0.98] tracking-[-0.055em] text-[#101c3d] sm:text-7xl lg:text-[5.2rem]">
              See your church clearly.
              <span className="block text-[#4f7df3]">Care more personally.</span>
          </h1>
            <p className="mt-7 max-w-xl text-lg leading-8 text-[#5e6880] sm:text-xl sm:leading-9">
              Flock brings worker attendance, congregation growth, newcomers,
              converts and caring follow-up into one secure, mobile-friendly
              ministry workspace.
            </p>
            <div className="mt-9 flex flex-wrap items-center gap-4">
              <Link
                href="/sign-up"
                className="group inline-flex items-center gap-2 rounded-full bg-[#4f7df3] px-7 py-3.5 text-sm font-semibold text-white shadow-[0_14px_35px_rgba(79,125,243,0.3)] transition hover:-translate-y-0.5 hover:bg-[#3f6fe5]"
              >
                Request access
                <span className="transition-transform group-hover:translate-x-0.5">
                  <Arrow />
                </span>
              </Link>
              <Link
                href="/sign-in"
                className="rounded-full border border-[#d9e1f3] bg-white px-7 py-3.5 text-sm font-semibold text-[#253252] shadow-sm transition hover:border-[#b9caf6] hover:bg-[#f7f9ff]"
              >
                Sign in
              </Link>
            </div>
            <p className="mt-6 flex items-center gap-2 text-sm text-[#7d879d]">
              <svg viewBox="0 0 20 20" className="h-4 w-4 stroke-[#4f7df3]" fill="none" strokeWidth="1.8">
                <path d="m4.5 10 3.25 3.25 7.75-7.5" />
              </svg>
              Clear records. Useful trends. Better-informed care.
            </p>
          </div>

          <div className="relative mx-auto w-full max-w-[560px] lg:ml-auto">
            <div className="absolute -inset-8 -z-10 rounded-full bg-[#4f7df3]/10 blur-3xl" />
            <div className="relative rounded-[2rem] border border-white/70 bg-white/90 p-4 shadow-[0_30px_80px_rgba(34,56,112,0.16)] backdrop-blur sm:p-6">
              <div className="flex items-center justify-between border-b border-[#e8edf8] pb-5">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#8993a8]">
                    Sunday ministry overview
                  </p>
                  <p className="mt-1 text-lg font-semibold text-[#172344]">
                    People and participation
                  </p>
                </div>
                <div className="rounded-full bg-[#edf2ff] px-3 py-1.5 text-xs font-semibold text-[#4f7df3]">
                  Illustrative preview
                </div>
              </div>

              <div className="grid gap-3 py-5 sm:grid-cols-3">
                {[
                  ["426", "Congregation", "text-[#4f7df3]"],
                  ["92%", "Worker attendance", "text-[#172344]"],
                  ["6", "Need care", "text-[#d26a4d]"],
                ].map(([value, label, color]) => (
                  <div key={label} className="rounded-2xl bg-[#f6f8fd] p-4">
                    <p className={`text-2xl font-semibold tracking-tight ${color}`}>
                      {value}
                    </p>
                    <p className="mt-1 text-xs text-[#7a8499]">{label}</p>
                  </div>
                ))}
              </div>

              <div className="rounded-2xl border border-[#e6ebf7] p-4 sm:p-5">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-[#253252]">
                    Congregation composition
                  </p>
                  <p className="text-xs text-[#8a94a8]">This month</p>
                </div>
                <div className="mt-5 space-y-4">
                  {[
                    ["Adult female", "48%", "48%"],
                    ["Adult male", "39%", "39%"],
                    ["Children", "13%", "13%"],
                  ].map(([name, value, width]) => (
                    <div key={name}>
                      <div className="mb-2 flex justify-between text-xs">
                        <span className="font-medium text-[#4d5871]">{name}</span>
                        <span className="text-[#78839a]">{value}</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-[#e9eef9]">
                        <div
                          className="h-full rounded-full bg-[#4f7df3]"
                          style={{ width }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="absolute -bottom-8 -left-4 flex max-w-[235px] items-center gap-3 rounded-2xl border border-[#e0e7f6] bg-white p-3.5 shadow-[0_18px_45px_rgba(31,48,94,0.16)] sm:-left-12 sm:p-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#edf2ff] text-[#4f7df3]">
                <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current" strokeWidth="1.8">
                  <path d="M20 11.5a8 8 0 0 1-11.7 7.1L4 20l1.4-4.1A8 8 0 1 1 20 11.5Z" />
                  <path d="M9 12.5 11 14l4-4" />
                </svg>
              </div>
              <div>
                <p className="text-xs font-semibold text-[#253252]">
                  14 first steps recorded
                </p>
                <p className="mt-0.5 text-[11px] leading-4 text-[#7e889d]">
                  8 new members · 6 new converts
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="why-flock" className="bg-[#101c3d] px-5 py-20 text-white sm:px-8 sm:py-28 lg:px-12">
        <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-24">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#89a8ff]">
              The invisible problem
            </p>
            <h2 className="mt-5 text-4xl font-semibold leading-tight tracking-[-0.035em] sm:text-5xl">
              People rarely disconnect all at once.
            </h2>
          </div>
          <div className="lg:pt-10">
            <p className="max-w-2xl text-xl leading-9 text-[#c7d0e5] sm:text-2xl sm:leading-10">
              It often starts quietly: a worker misses one service, then another.
              Paper sheets record an absence, but they cannot recognize a pattern
              or help the right leader respond with care.
            </p>
            <div className="mt-10 grid gap-6 border-t border-white/15 pt-8 sm:grid-cols-2">
              <div>
                <p className="text-3xl font-semibold text-white">Earlier</p>
                <p className="mt-2 text-sm leading-6 text-[#9faccc]">
                  See repeated absences before weeks quietly pass.
                </p>
              </div>
              <div>
                <p className="text-3xl font-semibold text-white">Together</p>
                <p className="mt-2 text-sm leading-6 text-[#9faccc]">
                  Give every leader the same clear, current picture.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="px-5 py-20 sm:px-8 sm:py-28 lg:px-12">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#4f7df3]">
              One simple system
            </p>
            <h2 className="mt-4 text-4xl font-semibold tracking-[-0.04em] text-[#101c3d] sm:text-5xl">
              From service records to meaningful ministry insight.
            </h2>
            <p className="mt-5 text-lg leading-8 text-[#667188]">
              Less administration for your team. More visibility for leaders.
              A clearer understanding of everyone who attends and serves.
            </p>
          </div>

          <div className="mt-14 grid gap-5 lg:grid-cols-3">
            {features.map((feature) => (
              <article
                key={feature.number}
                className="group relative overflow-hidden rounded-[1.75rem] border border-[#e0e6f3] bg-white p-7 transition duration-300 hover:-translate-y-1 hover:border-[#c4d2f7] hover:shadow-[0_22px_55px_rgba(47,68,119,0.1)] sm:p-8"
              >
                <div className="flex items-start justify-between">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#edf2ff] text-[#4f7df3]">
                    <span className="h-6 w-6 fill-none stroke-current stroke-[1.7]">
                      {feature.icon}
                    </span>
                  </div>
                  <span className="text-sm font-medium text-[#b2bacb]">
                    {feature.number}
                  </span>
                </div>
                <h3 className="mt-8 text-xl font-semibold tracking-[-0.02em] text-[#172344]">
                  {feature.title}
                </h3>
                <p className="mt-3 text-[15px] leading-7 text-[#6c768c]">
                  {feature.description}
                </p>
                <div className="absolute inset-x-8 bottom-0 h-1 origin-left scale-x-0 rounded-full bg-[#4f7df3] transition-transform duration-300 group-hover:scale-x-100" />
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="insights" className="border-y border-[#e4e9f5] bg-white px-5 py-20 sm:px-8 sm:py-28 lg:px-12">
        <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:gap-20">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#4f7df3]">More than a headcount</p>
            <h2 className="mt-4 text-4xl font-semibold tracking-[-0.04em] text-[#101c3d] sm:text-5xl">See participation, growth and care in context.</h2>
            <p className="mt-5 text-lg leading-8 text-[#667188]">Flock keeps overall congregation attendance accurate while separately showing new members and new converts. Leaders can recognize growth patterns without double-counting people or collecting unnecessary personal data.</p>
            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              {["Male, female and children breakdown", "New members and converts by gender", "Service-by-service trend charts", "Exportable leadership reports"].map((item) => <div key={item} className="flex items-center gap-3 rounded-2xl border border-[#e2e8f5] bg-[#f8faff] px-4 py-3 text-sm font-medium text-[#42506d]"><span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#e8efff] text-[#4f7df3]">✓</span>{item}</div>)}
            </div>
          </div>
          <div className="rounded-[2rem] bg-[#101c3d] p-5 text-white shadow-[0_26px_70px_rgba(16,28,61,0.18)] sm:p-7">
            <div className="flex items-start justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-[0.15em] text-[#8da9f6]">Attendance trend</p><p className="mt-2 text-xl font-semibold">Growing participation</p></div><span className="rounded-full bg-[#20335f] px-3 py-1.5 text-xs text-[#b9caf8]">Last 6 services</span></div>
            <div className="mt-8 flex h-44 items-end gap-3 border-b border-l border-white/15 px-3 pb-3 sm:gap-5">
              {[48, 58, 54, 70, 76, 88].map((height, index) => <div key={height + index} className="flex h-full flex-1 items-end"><div className="w-full rounded-t-lg bg-gradient-to-t from-[#4f7df3] to-[#90abf7]" style={{ height: `${height}%` }} /></div>)}
            </div>
            <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {[["426", "Total attendance"], ["8", "New members"], ["6", "New converts"]].map(([value, label]) => <div key={label} className="rounded-2xl bg-white/8 p-4"><p className="text-2xl font-semibold">{value}</p><p className="mt-1 text-xs text-[#aab8da]">{label}</p></div>)}
            </div>
          </div>
        </div>
      </section>

      <section id="how-it-works" className="px-5 py-20 sm:px-8 sm:py-28 lg:px-12">
        <div className="mx-auto max-w-7xl overflow-hidden rounded-[2rem] bg-[#eef3ff] px-6 py-12 sm:px-10 sm:py-16 lg:px-16">
          <div className="grid gap-12 lg:grid-cols-[0.75fr_1.25fr] lg:gap-20">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#4f7df3]">
                How it works
              </p>
              <h2 className="mt-4 text-3xl font-semibold tracking-[-0.035em] text-[#101c3d] sm:text-4xl">
                A natural part of every service.
              </h2>
            </div>
            <ol className="space-y-8">
              {steps.map(([title, description], index) => (
                <li
                  key={title}
                  className="grid grid-cols-[44px_1fr] gap-4 border-b border-[#d3def6] pb-8 last:border-0 last:pb-0"
                >
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-sm font-semibold text-[#4f7df3] shadow-sm">
                    {index + 1}
                  </span>
                  <div>
                    <h3 className="text-lg font-semibold text-[#1d2a4b]">{title}</h3>
                    <p className="mt-1.5 text-sm leading-6 text-[#667188]">
                      {description}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      <section className="px-5 pb-20 sm:px-8 sm:pb-28 lg:px-12">
        <div className="relative mx-auto max-w-7xl overflow-hidden rounded-[2rem] bg-[#4f7df3] px-6 py-14 text-center text-white sm:px-12 sm:py-20">
          <div className="absolute -left-20 -top-32 h-72 w-72 rounded-full border border-white/20" />
          <div className="absolute -bottom-40 -right-20 h-80 w-80 rounded-full border border-white/15" />
          <div className="relative mx-auto max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-white/75">
              Stronger teams start with seeing clearly
            </p>
            <h2 className="mt-5 text-4xl font-semibold leading-tight tracking-[-0.04em] sm:text-5xl">
              Turn every service into clearer insight and better care.
            </h2>
            <div className="mt-9 flex flex-wrap justify-center gap-3">
              <Link
                href="/sign-up"
                className="group inline-flex items-center gap-2 rounded-full bg-white px-7 py-3.5 text-sm font-semibold text-[#345fc9] shadow-lg transition hover:-translate-y-0.5"
              >
                Request access
                <span className="transition-transform group-hover:translate-x-0.5">
                  <Arrow />
                </span>
              </Link>
              <Link
                href="/sign-in"
                className="rounded-full border border-white/35 bg-white/10 px-7 py-3.5 text-sm font-semibold text-white transition hover:bg-white/15"
              >
                Sign in
              </Link>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-[#e0e6f2] bg-white px-5 sm:px-8 lg:px-12">
        <div className="mx-auto max-w-7xl py-12">
          <div className="flex flex-col gap-8 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <FlockBrand compact />
              <p className="mt-1 max-w-xs text-sm leading-6 text-[#7a8499]">
                Helping churches understand attendance, recognize growth and care well for people.
              </p>
            </div>
            <nav aria-label="Footer navigation" className="flex flex-wrap gap-x-7 gap-y-3 text-sm font-medium text-[#68738a]">
              <a className="hover:text-[#4f7df3]" href="#why-flock">Why Flock</a>
              <a className="hover:text-[#4f7df3]" href="#features">Features</a>
              <a className="hover:text-[#4f7df3]" href="#insights">Insights</a>
              <a className="hover:text-[#4f7df3]" href="#how-it-works">How it works</a>
              <Link className="hover:text-[#4f7df3]" href="/privacy">Privacy</Link>
            </nav>
          </div>
          <div className="mt-10 flex flex-col gap-3 border-t border-[#e7ebf4] pt-6 text-xs text-[#9099ac] sm:flex-row sm:items-center sm:justify-between">
            <p>© {new Date().getFullYear()} Flock. All rights reserved.</p>
            <p>Church insight, participation and care in one place.</p>
          </div>
        </div>
      </footer>
    </main>
  );
}
