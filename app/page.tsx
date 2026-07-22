import type { Metadata } from "next";
import Link from "next/link";
import { FlockBrand } from "@/components/flock-brand";
import { HomeDashboardPreview, HomeReportPreview } from "@/components/home-product-previews";

export const metadata: Metadata = {
  title: { absolute: "Flock — Simple church operations, attendance and pastoral care" },
  description:
    "Plan services, record attendance, coordinate ministry teams, and care for your congregation—all in one simple, secure workspace.",
};

const features = [
  {
    number: "01",
    title: "Run smooth service days",
    description:
      "Set expected departments, track attendance submissions in real time, and make sure every service record is complete before closing out the day.",
    icon: (
      <svg viewBox="0 0 24 24" className="h-6 w-6 stroke-current fill-none" strokeWidth="1.8">
        <path d="M9 11.75 11.1 14 15.5 9.5M7 3v3m10-3v3M5.5 5h13A1.5 1.5 0 0 1 20 6.5v12a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 18.5v-12A1.5 1.5 0 0 1 5.5 5Z" />
      </svg>
    ),
  },
  {
    number: "02",
    title: "Installable phone attendance",
    description:
      "Install Flock on a phone, take attendance in seconds, and keep recoverable drafts when a connection drops during service.",
    icon: (
      <svg viewBox="0 0 24 24" className="h-6 w-6 stroke-current fill-none" strokeWidth="1.8">
        <path d="M4 19V9m6 10V5m6 14v-7m4 7H2" />
      </svg>
    ),
  },
  {
    number: "03",
    title: "One place for weekly tasks",
    description:
      "A simple action centre that keeps overdue attendance, new care alerts, and team requests together so nothing falls through the cracks.",
    icon: (
      <svg viewBox="0 0 24 24" className="h-6 w-6 stroke-current fill-none" strokeWidth="1.8">
        <path d="M20 11.5a8 8 0 0 1-11.7 7.1L4 20l1.4-4.1A8 8 0 1 1 20 11.5Z" />
        <path d="M8.5 11.5h.01m3.49 0h.01m3.49 0h.01" />
      </svg>
    ),
  },
  {
    number: "04",
    title: "Complete worker profiles",
    description:
      "Add or bulk-import rosters, then bring each worker's contact details, attendance rate, service history, and pastoral follow-ups into one secure profile.",
    icon: (
      <svg viewBox="0 0 24 24" className="h-6 w-6 stroke-current fill-none" strokeWidth="1.8">
        <path d="M16 20v-1.5a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4V20m7-9a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm8-1v6m3-3h-6" />
      </svg>
    ),
  },
  {
    number: "05",
    title: "Care before people slip away",
    description:
      "Spot repeated absences early. Automatically remind leaders to reach out, track follow-ups, and send friendly WhatsApp messages.",
    icon: (
      <svg viewBox="0 0 24 24" className="h-6 w-6 stroke-current fill-none" strokeWidth="1.8">
        <path d="M12 21s-7-4.35-7-11a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 6.65-7 11-7 11Z" />
      </svg>
    ),
  },
  {
    number: "06",
    title: "Track growth & first-time visitors",
    description:
      "Keep clear numbers on men, women, children, new members, and converts—giving leaders accurate pictures of church growth.",
    icon: (
      <svg viewBox="0 0 24 24" className="h-6 w-6 stroke-current fill-none" strokeWidth="1.8">
        <path d="M4 19V5m0 14h16M7 15l4-4 3 2 5-7" />
      </svg>
    ),
  },
  {
    number: "07",
    title: "Organize the service programme",
    description:
      "Create reusable orders of service, publish clear run-sheets, and share revocable public links or QR codes with the team.",
    icon: (
      <svg viewBox="0 0 24 24" className="h-6 w-6 stroke-current fill-none" strokeWidth="1.8">
        <path d="M7 3v3m10-3v3M5.5 5h13A1.5 1.5 0 0 1 20 6.5v12a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 18.5v-12A1.5 1.5 0 0 1 5 5Zm2.5 5h8m-8 4h5" />
      </svg>
    ),
  },
  {
    number: "08",
    title: "Leadership-ready reports",
    description:
      "Compare attendance trends and download church-branded PDF or CSV reports with the exact date, service, and department filters you need.",
    icon: (
      <svg viewBox="0 0 24 24" className="h-6 w-6 stroke-current fill-none" strokeWidth="1.8">
        <path d="M4 19V5m0 14h16M7 15l4-4 3 2 5-7" />
      </svg>
    ),
  },
  {
    number: "09",
    title: "Safe and secure access",
    description:
      "Invite leaders safely, give department heads access only to what they need, and keep your church records protected.",
    icon: (
      <svg viewBox="0 0 24 24" className="h-6 w-6 stroke-current fill-none" strokeWidth="1.8">
        <path d="M12 3 5 6v5c0 4.6 2.9 8.1 7 10 4.1-1.9 7-5.4 7-10V6l-7-3Zm-3 9 2 2 4-4" />
      </svg>
    ),
  },
];

const steps = [
  ["Invite your leadership team", "Super Admins invite pastors and department heads, set up departments, and upload worker rosters."],
  ["Prepare the service", "Set up the service day, assign required departments, and share the published order of service with your team."],
  ["Take fast attendance", "Department heads mark worker attendance from their phones during service, while admins record visitor and congregation numbers."],
  ["See the big picture", "Leaders get one clean dashboard showing attendance, growth, and team participation across services."],
  ["Follow up with care", "Care alerts highlight members who have missed services, helping pastoral teams reach out warmly and personally."],
];

const operatingPillars = [
  {
    phase: "Prepare",
    title: "Plan before Sunday",
    description: "Organize teams, ministers, service rosters, and programme orders before doors open.",
    items: ["Department rosters", "Service expectations", "Order of service planning"],
  },
  {
    phase: "Record",
    title: "Simple attendance",
    description: "Let department heads take attendance on their phones without paper forms or messy group chats.",
    items: ["Mobile attendance drafts", "Visitor & convert counts", "Safe record updates"],
  },
  {
    phase: "Respond",
    title: "Personal pastoral care",
    description: "Turn attendance records into genuine care by knowing who needs a check-in or visit.",
    items: ["Automatic care alerts", "Follow-up history", "Friendly WhatsApp updates"],
  },
  {
    phase: "Govern",
    title: "Safe & trusted",
    description: "Keep member data private and ensure every leader sees only what they need to manage.",
    items: ["Secure leader invites", "Role permissions", "Activity logs"],
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
              Reports
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
              ["Reports", "#insights"],
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
              Installable, secure software for ministry teams
            </div>
            <h1 className="max-w-3xl text-balance text-4xl font-bold leading-[1.05] tracking-[-0.04em] text-[#101c3d] sm:text-6xl lg:text-[4.75rem]">
              See your church clearly.
              <span className="mt-1 block text-[#4f7df3]">Care for your people easily.</span>
            </h1>
            <p className="mt-6 max-w-xl text-base leading-7 text-[#5e6880] sm:text-xl sm:leading-8">
              Replace messy spreadsheets, paper registers, and scattered WhatsApp chats with one installable workspace for attendance, leadership reports, worker care, and service coordination.
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
              Built specifically for pastors, church administrators, and department leaders.
            </p>
            <div className="mt-5 flex flex-wrap gap-2 text-[11px] font-semibold text-[#52617d]">
              {["Installable on phones", "Recoverable attendance drafts", "Church-branded reports"].map((item) => (
                <span key={item} className="rounded-full border border-[#dce4f3] bg-white/80 px-3 py-1.5 shadow-sm">{item}</span>
              ))}
            </div>
          </div>

          <HomeDashboardPreview />
        </div>
      </section>

      {/* WHY FLOCK / PROBLEM STATEMENT */}
      <section id="why-flock" className="bg-[#101c3d] px-5 py-16 text-white sm:px-8 sm:py-24 lg:px-12">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#89a8ff]">
              Why Churches Use Flock
            </p>
            <h2 className="mt-3 text-3xl font-bold leading-tight tracking-[-0.03em] sm:text-4xl lg:text-5xl">
              People quietly slip away when no one notices.
            </h2>
          </div>
          <div className="flex flex-col justify-center">
            <p className="text-base leading-7 text-[#c7d0e5] sm:text-xl sm:leading-9">
              It usually starts small: a devoted worker misses one Sunday, then two. When attendance lives on paper sheets or gets buried in WhatsApp group chats, leaders only realize someone is missing after months have passed.
            </p>
            <div className="mt-8 grid gap-6 border-t border-white/15 pt-6 sm:grid-cols-2">
              <div className="rounded-xl border border-white/5 bg-white/[0.03] p-4">
                <p className="text-2xl font-bold text-white sm:text-3xl">Notice Sooner</p>
                <p className="mt-1 text-xs leading-5 text-[#9faccc] sm:text-sm">
                  Spot missed services right away before weeks quietly slip by.
                </p>
              </div>
              <div className="rounded-xl border border-white/5 bg-white/[0.03] p-4">
                <p className="text-2xl font-bold text-white sm:text-3xl">Stay Connected</p>
                <p className="mt-1 text-xs leading-5 text-[#9faccc] sm:text-sm">
                  Give every department head and pastor the same simple picture.
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
              Designed For Ministry
            </p>
            <h2 className="mt-3 text-3xl font-bold tracking-[-0.03em] text-[#101c3d] sm:text-4xl lg:text-5xl">
              Everything your church needs around every service.
            </h2>
            <p className="mt-4 text-base leading-7 text-[#667188] sm:text-lg">
              Prepare with ease, take attendance in seconds, care for members personally, and keep your church records safe.
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
                Weekly Church Rhythm
              </p>
              <h2 className="mt-3 text-3xl font-bold tracking-[-0.03em] sm:text-4xl lg:text-5xl">
                From pre-service prep to loving follow-up.
              </h2>
            </div>
            <p className="text-base leading-7 text-[#b9c5df] sm:text-lg lg:ml-auto lg:max-w-xl">
              Flock connects the work usually scattered across paper, messaging apps, and memory. Each leader sees their exact role clearly so the church runs smoothly.
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
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#4f7df3]">Leadership reports</p>
            <h2 className="mt-3 text-3xl font-bold tracking-[-0.03em] text-[#101c3d] sm:text-4xl lg:text-5xl">
              Understand attendance, visitors, and care at a glance.
            </h2>
            <p className="mt-4 text-base leading-7 text-[#667188] sm:text-lg">
              Move from live dashboard insight to a meeting-ready document without rebuilding figures in a spreadsheet. Every export keeps the active filters and carries the church name configured in Settings.
            </p>
            <div className="mt-6 grid gap-2.5 sm:grid-cols-2">
              {[
                "Worker and congregation trends",
                "Department attendance comparisons",
                "Filtered service-by-service logs",
                "Church-branded PDF and CSV downloads",
              ].map((item) => (
                <div key={item} className="flex items-center gap-2.5 rounded-xl border border-[#e2e8f5] bg-[#f8faff] px-3.5 py-2.5 text-xs font-semibold text-[#42506d]">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#e8efff] text-[11px] font-bold text-[#4f7df3]">✓</span>
                  {item}
                </div>
              ))}
            </div>
          </div>

          <HomeReportPreview />
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how-it-works" className="px-5 py-16 sm:px-8 sm:py-24 lg:px-12">
        <div className="mx-auto max-w-7xl overflow-hidden rounded-[2rem] bg-[#eef3ff] px-5 py-10 sm:px-10 sm:py-16 lg:px-16">
          <div className="grid gap-10 lg:grid-cols-[0.75fr_1.25fr] lg:gap-16">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#4f7df3]">
                How It Works
              </p>
              <h2 className="mt-3 text-3xl font-bold tracking-[-0.03em] text-[#101c3d] sm:text-4xl">
                A simple weekly routine for your whole team.
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
              Get Started with Flock
            </p>
            <h2 className="mt-4 text-3xl font-bold leading-tight tracking-[-0.03em] sm:text-4xl lg:text-5xl">
              Bring your service operations, attendance, and care together today.
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
                Helping churches prepare services, record attendance, track growth, and care well for every member.
              </p>
            </div>
            <nav aria-label="Footer navigation" className="flex flex-wrap gap-x-7 gap-y-3 text-sm font-medium text-[#68738a]">
              <a className="hover:text-[#4f7df3]" href="#why-flock">Why Flock</a>
              <a className="hover:text-[#4f7df3]" href="#features">Features</a>
              <a className="hover:text-[#4f7df3]" href="#operations">Full workflow</a>
              <a className="hover:text-[#4f7df3]" href="#insights">Reports</a>
              <a className="hover:text-[#4f7df3]" href="#how-it-works">How it works</a>
              <Link className="hover:text-[#4f7df3]" href="/privacy">Privacy</Link>
            </nav>
          </div>
          <div className="mt-10 flex flex-col gap-3 border-t border-[#e7ebf4] pt-6 text-xs text-[#9099ac] sm:flex-row sm:items-center sm:justify-between">
            <p>© {new Date().getFullYear()} Flock. All rights reserved.</p>
            <p>Church operations, attendance and care in one place.</p>
          </div>
        </div>
      </footer>
    </main>
  );
}
