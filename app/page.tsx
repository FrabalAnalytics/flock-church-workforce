import type { Metadata } from "next";
import Link from "next/link";
import { FlockBrand } from "@/components/flock-brand";

export const metadata: Metadata = {
  title: { absolute: "Flock — Church operations, attendance and ministry care" },
  description:
    "Plan services, manage church workers, record attendance, coordinate programmes, act on care alerts and govern access from one secure workspace.",
};

const features = [
  {
    number: "01",
    title: "Control every service day",
    description:
      "Schedule expected departments, monitor submissions in real time and close each service only when the required records are complete.",
    icon: (
      <svg viewBox="0 0 24 24" className="h-6 w-6 stroke-current fill-none" strokeWidth="1.8">
        <path d="M9 11.75 11.1 14 15.5 9.5M7 3v3m10-3v3M5.5 5h13A1.5 1.5 0 0 1 20 6.5v12a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 18.5v-12A1.5 1.5 0 0 1 5.5 5Z" />
      </svg>
    ),
  },
  {
    number: "02",
    title: "Record attendance in seconds",
    description:
      "Department Heads check the Active workers who attended. Flock records the full roster, saves recoverable drafts and prevents accidental duplicate submissions.",
    icon: (
      <svg viewBox="0 0 24 24" className="h-6 w-6 stroke-current fill-none" strokeWidth="1.8">
        <path d="M4 19V9m6 10V5m6 14v-7m4 7H2" />
      </svg>
    ),
  },
  {
    number: "03",
    title: "Keep priorities in one place",
    description:
      "A role-aware Action Centre brings overdue attendance, access approvals, unresolved care and failed message delivery into one focused queue.",
    icon: (
      <svg viewBox="0 0 24 24" className="h-6 w-6 stroke-current fill-none" strokeWidth="1.8">
        <path d="M20 11.5a8 8 0 0 1-11.7 7.1L4 20l1.4-4.1A8 8 0 1 1 20 11.5Z" />
        <path d="M8.5 11.5h.01m3.49 0h.01m3.49 0h.01" />
      </svg>
    ),
  },
  {
    number: "04",
    title: "Manage the workforce at scale",
    description:
      "Maintain departments and worker records individually or import validated CSV batches with duplicate checks, consent controls and a clear preview.",
    icon: (
      <svg viewBox="0 0 24 24" className="h-6 w-6 stroke-current fill-none" strokeWidth="1.8">
        <path d="M16 20v-1.5a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4V20m7-9a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm8-1v6m3-3h-6" />
      </svg>
    ),
  },
  {
    number: "05",
    title: "Care before people disconnect",
    description:
      "Repeated absence creates accountable care alerts, escalation history and consent-aware WhatsApp messages so leaders can respond personally.",
    icon: (
      <svg viewBox="0 0 24 24" className="h-6 w-6 stroke-current fill-none" strokeWidth="1.8">
        <path d="M12 21s-7-4.35-7-11a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 6.65-7 11-7 11Z" />
      </svg>
    ),
  },
  {
    number: "06",
    title: "Understand congregation growth",
    description:
      "Track adult male, adult female, children, new members and new converts without collecting unnecessary attendee identities or double-counting first steps.",
    icon: (
      <svg viewBox="0 0 24 24" className="h-6 w-6 stroke-current fill-none" strokeWidth="1.8">
        <path d="M4 19V5m0 14h16M7 15l4-4 3 2 5-7" />
      </svg>
    ),
  },
  {
    number: "07",
    title: "Coordinate the service programme",
    description:
      "Keep a consistent minister directory, build reusable programme schedules, publish the final order and share or print it for the service team.",
    icon: (
      <svg viewBox="0 0 24 24" className="h-6 w-6 stroke-current fill-none" strokeWidth="1.8">
        <path d="M7 3v3m10-3v3M5.5 5h13A1.5 1.5 0 0 1 20 6.5v12a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 18.5v-12A1.5 1.5 0 0 1 5.5 5Zm2.5 5h8m-8 4h5" />
      </svg>
    ),
  },
  {
    number: "08",
    title: "Lead with dependable reports",
    description:
      "Use trend charts, service logs, filters and CSV exports to compare participation across dates, services and departments from phone or computer.",
    icon: (
      <svg viewBox="0 0 24 24" className="h-6 w-6 stroke-current fill-none" strokeWidth="1.8">
        <path d="M4 19V5m0 14h16M7 15l4-4 3 2 5-7" />
      </svg>
    ),
  },
  {
    number: "09",
    title: "Protect access and accountability",
    description:
      "Invite approved leaders securely, assign role-based access, review sensitive changes in the audit trail and safely remove managed accounts when needed.",
    icon: (
      <svg viewBox="0 0 24 24" className="h-6 w-6 stroke-current fill-none" strokeWidth="1.8">
        <path d="M12 3 5 6v5c0 4.6 2.9 8.1 7 10 4.1-1.9 7-5.4 7-10V6l-7-3Zm-3 9 2 2 4-4" />
      </svg>
    ),
  },
];

const steps = [
  ["Invite and organize the team", "The Super Admin securely invites leaders, assigns roles and departments, imports workers and maintains the minister directory."],
  ["Prepare the service", "Create the service day, select the departments expected to report and publish a clear programme for everyone serving."],
  ["Capture participation", "Department Heads record worker attendance from their phones while the Super Admin records aggregate congregation and first-step totals."],
  ["Review one trusted picture", "Dashboards, service logs and exports bring workforce participation, congregation growth and ministry operations together."],
  ["Act and remain accountable", "The Action Centre routes outstanding work, care alerts guide follow-up and the audit history preserves sensitive changes."],
];

const operatingPillars = [
  {
    phase: "Prepare",
    title: "Set the service up clearly",
    description: "Organize departments, workers, ministers, expected attendance and the published programme before the service begins.",
    items: ["Department and worker directory", "Service-day expectations", "Minister and programme planning"],
  },
  {
    phase: "Record",
    title: "Capture complete records",
    description: "Use phone-friendly rosters and protected correction workflows to preserve an accurate account of everyone who served and attended.",
    items: ["Recoverable attendance drafts", "Congregation and first steps", "Safe record corrections"],
  },
  {
    phase: "Respond",
    title: "Turn patterns into care",
    description: "Bring the work that needs attention forward and help the right leader respond without losing the human story behind the numbers.",
    items: ["Role-aware Action Centre", "Absence escalation history", "Opt-in WhatsApp delivery"],
  },
  {
    phase: "Govern",
    title: "Keep access accountable",
    description: "Control who can see and change each area while retaining a reliable history of sensitive administrative activity.",
    items: ["Secure account invitations", "Role and department access", "Audit history and account removal"],
  },
];

function Arrow() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true" className="h-4 w-4 fill-current">
      <path d="M4 10h11m-4-4 4 4-4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
    </svg>
  );
}

export default function Home() {
  return (
    <main className="overflow-hidden bg-[#fbfcff] text-[#101c3d] antialiased">
      {/* HEADER SECTION (UNTOUCHED) */}
      <header className="relative z-20 border-b border-[#dfe6f8]/80 bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-5 sm:h-24 sm:px-8 lg:px-12">
          <a href="#top" aria-label="Flock home" className="-ml-2">
            <FlockBrand compact />
          </a>

          <nav
            aria-label="Main navigation"
            className="hidden items-center gap-7 text-sm font-medium text-[#5e6880] lg:flex"
          >
            <a className="transition hover:text-[#4f7df3]" href="#why-flock">
              Why Flock
            </a>
            <a className="transition hover:text-[#4f7df3]" href="#features">
              Features
            </a>
            <a className="transition hover:text-[#4f7df3]" href="#operations">
              Full workflow
            </a>
            <a className="transition hover:text-[#4f7df3]" href="#insights">
              Insights
            </a>
            <a className="transition hover:text-[#4f7df3]" href="#how-it-works">
              How it works
            </a>
          </nav>

          <div className="flex items-center gap-2 sm:gap-3">
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
        <nav aria-label="Mobile main navigation" className="border-t border-[#e8edf8] px-4 py-2 lg:hidden">
          <div className="mx-auto flex max-w-7xl gap-2 overflow-x-auto overscroll-x-contain pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {[
              ["Why Flock", "#why-flock"],
              ["Features", "#features"],
              ["Full workflow", "#operations"],
              ["Insights", "#insights"],
              ["How it works", "#how-it-works"],
            ].map(([label, href]) => (
              <a key={href} href={href} className="flex min-h-10 shrink-0 items-center rounded-full border border-[#dfe6f3] bg-white px-4 text-sm font-semibold text-[#5e6880] transition active:bg-[#edf2ff] active:text-[#365fc7]">
                {label}
              </a>
            ))}
          </div>
        </nav>
      </header>

      {/* HERO SECTION */}
      <section
        id="top"
        className="relative isolate border-b border-[#e5eaf7] px-5 pb-20 pt-12 sm:px-8 sm:pb-28 sm:pt-20 lg:px-12 lg:pb-32 lg:pt-24"
      >
        <div className="absolute inset-x-0 top-0 -z-20 h-full bg-[radial-gradient(circle_at_76%_20%,rgba(79,125,243,0.12),transparent_40%),radial-gradient(circle_at_12%_70%,rgba(166,188,250,0.15),transparent_35%)]" />
        <div className="absolute right-[-10rem] top-[-10rem] -z-10 h-[30rem] w-[30rem] rounded-full border border-[#4f7df3]/10 sm:h-[42rem] sm:w-[42rem]" />

        <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:gap-12">
          <div className="max-w-3xl">
            <div className="mb-6 inline-flex items-center gap-2.5 rounded-full border border-[#d9e3ff] bg-white/80 px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-[#3f67ce] shadow-sm backdrop-blur-sm">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#4f7df3] opacity-75"></span>
                <span className="relative inline-flex h-2 w-2 rounded-full bg-[#4f7df3]"></span>
              </span>
              Church operations, insight and care
            </div>
            <h1 className="max-w-3xl text-balance text-4xl font-bold leading-[1.05] tracking-[-0.04em] text-[#101c3d] sm:text-6xl lg:text-[4.75rem]">
              See your church clearly.
              <span className="mt-1 block text-[#4f7df3]">Care more personally.</span>
            </h1>
            <p className="mt-6 max-w-xl text-base leading-7 text-[#5e6880] sm:text-xl sm:leading-8">
              Plan services, coordinate people, record participation, recognize
              growth and act on care priorities from one secure, mobile-friendly
              ministry workspace.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
              <Link
                href="/sign-up"
                className="group inline-flex items-center justify-center gap-2.5 rounded-full bg-[#4f7df3] px-7 py-4 text-sm font-semibold text-white shadow-[0_12px_30px_rgba(79,125,243,0.3)] transition hover:-translate-y-0.5 hover:bg-[#3f6fe5] hover:shadow-[0_16px_35px_rgba(79,125,243,0.38)]"
              >
                Request access
                <span className="transition-transform group-hover:translate-x-0.5">
                  <Arrow />
                </span>
              </Link>
              <Link
                href="/sign-in"
                className="inline-flex items-center justify-center rounded-full border border-[#d9e1f3] bg-white px-7 py-4 text-sm font-semibold text-[#253252] shadow-sm transition hover:border-[#b9caf6] hover:bg-[#f7f9ff]"
              >
                Sign in
              </Link>
            </div>
            <p className="mt-6 flex items-center gap-2 text-xs sm:text-sm text-[#7d879d]">
              <svg viewBox="0 0 20 20" className="h-4 w-4 shrink-0 stroke-[#4f7df3]" fill="none" strokeWidth="2">
                <path d="m4.5 10 3.25 3.25 7.75-7.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Clear operations. Trusted records. Better-informed care.
            </p>
          </div>

          {/* DASHBOARD PREVIEW CARD */}
          <div className="relative mx-auto w-full max-w-[540px] lg:ml-auto">
            <div className="absolute -inset-4 -z-10 rounded-[2.5rem] bg-gradient-to-tr from-[#4f7df3]/20 to-indigo-100 blur-2xl" />
            <div className="relative rounded-[2rem] border border-white/80 bg-white/95 p-5 shadow-[0_25px_60px_rgba(34,56,112,0.12)] backdrop-blur sm:p-7">
              <div className="flex items-center justify-between border-b border-[#e8edf8] pb-4">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#8993a8]">
                    Sunday operations overview
                  </p>
                  <p className="mt-0.5 text-base font-bold text-[#172344]">
                    Service ready for review
                  </p>
                </div>
                <div className="rounded-full border border-[#d3e0ff] bg-[#edf2ff] px-3 py-1 text-[11px] font-semibold text-[#4f7df3]">
                  Workspace preview
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2.5 py-4 sm:gap-3">
                {[
                  ["8/8", "Departments", "text-[#4f7df3]"],
                  ["92%", "Worker att.", "text-[#172344]"],
                  ["3", "Actions left", "text-[#d26a4d]"],
                ].map(([value, label, color]) => (
                  <div key={label} className="rounded-xl bg-[#f6f8fd] p-3 text-center sm:text-left sm:p-3.5">
                    <p className={`text-xl font-bold sm:text-2xl ${color}`}>
                      {value}
                    </p>
                    <p className="mt-0.5 text-[11px] font-medium text-[#7a8499]">{label}</p>
                  </div>
                ))}
              </div>

              <div className="rounded-xl border border-[#e6ebf7] bg-white p-4">
                <div className="flex items-center justify-between border-b border-[#f0f4fc] pb-2.5">
                  <p className="text-xs font-semibold text-[#253252]">
                    Service completion
                  </p>
                  <p className="text-[11px] font-medium text-[#8a94a8]">Today</p>
                </div>
                <div className="mt-3 space-y-3">
                  {[
                    ["Worker attendance", "100%", "100%"],
                    ["Congregation record", "100%", "100%"],
                    ["Care follow-up", "72%", "72%"],
                  ].map(([name, value, width]) => (
                    <div key={name}>
                      <div className="mb-1 flex justify-between text-[11px]">
                        <span className="font-medium text-[#4d5871]">{name}</span>
                        <span className="font-semibold text-[#78839a]">{value}</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-[#e9eef9]">
                        <div
                          className="h-full rounded-full bg-[#4f7df3] transition-all duration-500"
                          style={{ width }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-4 flex items-center gap-3 rounded-2xl border border-[#e0e7f6] bg-white/90 p-3.5 shadow-lg backdrop-blur sm:absolute sm:-bottom-6 sm:-left-6 sm:mt-0 sm:max-w-[240px]">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#edf2ff] text-[#4f7df3]">
                <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current" strokeWidth="2">
                  <path d="M20 11.5a8 8 0 0 1-11.7 7.1L4 20l1.4-4.1A8 8 0 1 1 20 11.5Z" />
                  <path d="M9 12.5 11 14l4-4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <div>
                <p className="text-xs font-bold text-[#253252]">
                  Action Centre updated
                </p>
                <p className="mt-0.5 text-[11px] leading-tight text-[#7e889d]">
                  Attendance, access and care in one queue
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* WHY FLOCK / PROBLEM STATEMENT */}
      <section id="why-flock" className="bg-[#101c3d] px-5 py-16 text-white sm:px-8 sm:py-24 lg:px-12">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#89a8ff]">
              The invisible problem
            </p>
            <h2 className="mt-3 text-3xl font-bold leading-tight tracking-[-0.03em] sm:text-4xl lg:text-5xl">
              People rarely disconnect all at once.
            </h2>
          </div>
          <div className="flex flex-col justify-center">
            <p className="text-base leading-7 text-[#c7d0e5] sm:text-xl sm:leading-9">
              It often starts quietly: a worker misses one service, then another.
              Paper sheets record an absence, but they cannot recognize a pattern
              or help the right leader respond with care.
            </p>
            <div className="mt-8 grid gap-6 border-t border-white/15 pt-6 sm:grid-cols-2">
              <div className="rounded-xl border border-white/5 bg-white/[0.03] p-4">
                <p className="text-2xl font-bold text-white sm:text-3xl">Earlier</p>
                <p className="mt-1 text-xs leading-5 text-[#9faccc] sm:text-sm">
                  See repeated absences before weeks quietly pass.
                </p>
              </div>
              <div className="rounded-xl border border-white/5 bg-white/[0.03] p-4">
                <p className="text-2xl font-bold text-white sm:text-3xl">Together</p>
                <p className="mt-1 text-xs leading-5 text-[#9faccc] sm:text-sm">
                  Give every leader the same clear, current picture.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES GRID */}
      <section id="features" className="px-5 py-16 sm:px-8 sm:py-24 lg:px-12">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#4f7df3]">
              One connected workspace
            </p>
            <h2 className="mt-3 text-3xl font-bold tracking-[-0.03em] text-[#101c3d] sm:text-4xl lg:text-5xl">
              Everything your ministry team needs around every service.
            </h2>
            <p className="mt-4 text-base leading-7 text-[#667188] sm:text-lg">
              Prepare with clarity, record with confidence, respond with care
              and keep sensitive administration accountable.
            </p>
          </div>

          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <article
                key={feature.number}
                className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-[#e0e6f3] bg-white p-6 transition duration-300 hover:-translate-y-1 hover:border-[#c4d2f7] hover:shadow-[0_20px_45px_rgba(47,68,119,0.08)] sm:p-7"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#edf2ff] text-[#4f7df3] transition-colors group-hover:bg-[#4f7df3] group-hover:text-white">
                      {feature.icon}
                    </div>
                    <span className="text-xs font-bold text-[#b2bacb]">
                      {feature.number}
                    </span>
                  </div>
                  <h3 className="mt-6 text-lg font-bold tracking-tight text-[#172344]">
                    {feature.title}
                  </h3>
                  <p className="mt-2.5 text-sm leading-6 text-[#6c768c]">
                    {feature.description}
                  </p>
                </div>
                <div className="mt-6 h-1 w-full rounded-full bg-[#f0f4fd]">
                  <div className="h-1 w-0 rounded-full bg-[#4f7df3] transition-all duration-300 group-hover:w-full" />
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* OPERATIONS WORKFLOW */}
      <section id="operations" className="border-y border-[#e4e9f5] bg-[#101c3d] px-5 py-16 text-white sm:px-8 sm:py-24 lg:px-12">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr] lg:items-end">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#89a8ff]">
                The complete service lifecycle
              </p>
              <h2 className="mt-3 text-3xl font-bold tracking-[-0.03em] sm:text-4xl lg:text-5xl">
                One flow from preparation to accountable care.
              </h2>
            </div>
            <p className="text-base leading-7 text-[#b9c5df] sm:text-lg lg:ml-auto lg:max-w-xl">
              Flock connects work that is often split between spreadsheets,
              paper registers, messaging apps and individual memory. Each role
              sees the right next step without losing the wider church picture.
            </p>
          </div>

          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {operatingPillars.map((pillar, index) => (
              <article key={pillar.phase} className="rounded-2xl border border-white/10 bg-white/[0.05] p-6 backdrop-blur-sm">
                <div className="flex items-center justify-between gap-4">
                  <span className="rounded-full bg-[#4f7df3] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.12em] text-white">
                    {pillar.phase}
                  </span>
                  <span className="text-xs font-semibold text-white/40">0{index + 1}</span>
                </div>
                <h3 className="mt-5 text-lg font-bold tracking-tight">{pillar.title}</h3>
                <p className="mt-2 text-xs leading-5 text-[#aebbd6]">{pillar.description}</p>
                <ul className="mt-5 space-y-2.5 border-t border-white/10 pt-4">
                  {pillar.items.map((item) => (
                    <li key={item} className="flex items-center gap-2 text-xs text-[#d5def1]">
                      <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#89a8ff]" aria-hidden="true" />
                      {item}
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* INSIGHTS SECTION */}
      <section id="insights" className="border-b border-[#e4e9f5] bg-white px-5 py-16 sm:px-8 sm:py-24 lg:px-12">
        <div className="mx-auto grid max-w-7xl items-center gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#4f7df3]">More than a headcount</p>
            <h2 className="mt-3 text-3xl font-bold tracking-[-0.03em] text-[#101c3d] sm:text-4xl lg:text-5xl">
              See participation, growth and care in context.
            </h2>
            <p className="mt-4 text-base leading-7 text-[#667188] sm:text-lg">
              Flock keeps congregation attendance accurate while separately showing new members and new converts. Leaders can connect those trends with workforce participation and care priorities without collecting unnecessary personal data.
            </p>
            <div className="mt-6 grid gap-2.5 sm:grid-cols-2">
              {[
                "Male, female and children breakdown",
                "New members and converts by gender",
                "Service-by-service trend charts",
                "Exportable leadership reports",
              ].map((item) => (
                <div key={item} className="flex items-center gap-2.5 rounded-xl border border-[#e2e8f5] bg-[#f8faff] px-3.5 py-2.5 text-xs font-semibold text-[#42506d]">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#e8efff] text-[11px] font-bold text-[#4f7df3]">✓</span>
                  {item}
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl bg-[#101c3d] p-5 text-white shadow-xl sm:p-7">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#8da9f6]">Attendance trend</p>
                <p className="mt-1 text-lg font-bold">Growing participation</p>
              </div>
              <span className="rounded-full bg-[#20335f] px-3 py-1 text-[11px] font-medium text-[#b9caf8]">Last 6 services</span>
            </div>

            <div className="mt-6 flex h-40 items-end gap-2.5 border-b border-l border-white/15 px-2 pb-2 sm:gap-4 sm:px-3">
              {[48, 58, 54, 70, 76, 88].map((height, index) => (
                <div key={height + index} className="flex h-full flex-1 items-end">
                  <div className="w-full rounded-t bg-gradient-to-t from-[#4f7df3] to-[#90abf7] transition-all hover:brightness-110" style={{ height: `${height}%` }} />
                </div>
              ))}
            </div>

            <div className="mt-5 grid grid-cols-3 gap-2.5">
              {[
                ["426", "Total att."],
                ["8", "New members"],
                ["6", "New converts"],
              ].map(([value, label]) => (
                <div key={label} className="rounded-xl bg-white/5 p-3 text-center sm:text-left">
                  <p className="text-xl font-bold sm:text-2xl">{value}</p>
                  <p className="mt-0.5 text-[11px] text-[#aab8da]">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how-it-works" className="px-5 py-16 sm:px-8 sm:py-24 lg:px-12">
        <div className="mx-auto max-w-7xl overflow-hidden rounded-[2rem] bg-[#eef3ff] px-5 py-10 sm:px-10 sm:py-16 lg:px-16">
          <div className="grid gap-10 lg:grid-cols-[0.75fr_1.25fr] lg:gap-16">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#4f7df3]">
                How it works
              </p>
              <h2 className="mt-3 text-3xl font-bold tracking-[-0.03em] text-[#101c3d] sm:text-4xl">
                A clear rhythm before, during and after every service.
              </h2>
            </div>
            <ol className="space-y-6 sm:space-y-8">
              {steps.map(([title, description], index) => (
                <li
                  key={title}
                  className="grid grid-cols-[36px_1fr] gap-4 border-b border-[#d3def6] pb-6 last:border-0 last:pb-0 sm:grid-cols-[44px_1fr] sm:pb-8"
                >
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-xs font-bold text-[#4f7df3] shadow-sm sm:h-10 sm:w-10 sm:text-sm">
                    {index + 1}
                  </span>
                  <div>
                    <h3 className="text-base font-bold text-[#1d2a4b] sm:text-lg">{title}</h3>
                    <p className="mt-1 text-xs leading-5 text-[#667188] sm:text-sm sm:leading-6">
                      {description}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      {/* FINAL CALL TO ACTION */}
      <section className="px-5 pb-16 sm:px-8 sm:pb-24 lg:px-12">
        <div className="relative mx-auto max-w-7xl overflow-hidden rounded-[2rem] bg-[#4f7df3] px-6 py-12 text-center text-white sm:px-12 sm:py-20">
          <div className="absolute -left-20 -top-32 h-72 w-72 rounded-full border border-white/20" />
          <div className="absolute -bottom-40 -right-20 h-80 w-80 rounded-full border border-white/15" />
          <div className="relative mx-auto max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/80">
              Stronger ministry starts with shared clarity
            </p>
            <h2 className="mt-4 text-3xl font-bold leading-tight tracking-[-0.03em] sm:text-4xl lg:text-5xl">
              Bring service operations, trusted insight and personal care together.
            </h2>
            <div className="mt-8 flex flex-col sm:flex-row justify-center gap-3">
              <Link
                href="/sign-up"
                className="group inline-flex items-center justify-center gap-2 rounded-full bg-white px-7 py-4 text-sm font-semibold text-[#345fc9] shadow-lg transition hover:-translate-y-0.5"
              >
                Request access
                <span className="transition-transform group-hover:translate-x-0.5">
                  <Arrow />
                </span>
              </Link>
              <Link
                href="/sign-in"
                className="inline-flex items-center justify-center rounded-full border border-white/35 bg-white/10 px-7 py-4 text-sm font-semibold text-white transition hover:bg-white/15"
              >
                Sign in
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER SECTION (UNTOUCHED) */}
      <footer className="border-t border-[#e0e6f2] bg-white px-5 sm:px-8 lg:px-12">
        <div className="mx-auto max-w-7xl py-12">
          <div className="flex flex-col gap-8 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <FlockBrand compact />
              <p className="mt-1 max-w-xs text-sm leading-6 text-[#7a8499]">
                Helping churches prepare services, understand participation, recognize growth and care well for people.
              </p>
            </div>
            <nav aria-label="Footer navigation" className="flex flex-wrap gap-x-7 gap-y-3 text-sm font-medium text-[#68738a]">
              <a className="hover:text-[#4f7df3]" href="#why-flock">Why Flock</a>
              <a className="hover:text-[#4f7df3]" href="#features">Features</a>
              <a className="hover:text-[#4f7df3]" href="#operations">Full workflow</a>
              <a className="hover:text-[#4f7df3]" href="#insights">Insights</a>
              <a className="hover:text-[#4f7df3]" href="#how-it-works">How it works</a>
              <Link className="hover:text-[#4f7df3]" href="/privacy">Privacy</Link>
            </nav>
          </div>
          <div className="mt-10 flex flex-col gap-3 border-t border-[#e7ebf4] pt-6 text-xs text-[#9099ac] sm:flex-row sm:items-center sm:justify-between">
            <p>© {new Date().getFullYear()} Flock. All rights reserved.</p>
            <p>Church operations, participation and care in one place.</p>
          </div>
        </div>
      </footer>
    </main>
  );
}
