import type { Metadata } from "next";
import Link from "next/link";
import { FlockBrand } from "@/components/flock-brand";

export const metadata: Metadata = {
  title: "Privacy notice | Flock",
  description:
    "How Flock handles church workforce attendance, contact, and follow-up information.",
};

const sections = [
  {
    title: "Who is responsible for your information",
    body: (
      <>
        <p>
          The church organization using Flock is responsible for deciding why
          and how worker information is used. Flock provides the technology used
          to record attendance, identify care needs, and support authorized
          follow-up.
        </p>
        <p>
          Questions or requests should first be directed to your department head
          or the church administrator responsible for Flock.
        </p>
      </>
    ),
  },
  {
    title: "Information we handle",
    body: (
      <ul>
        <li>Worker name, phone number, department, service status, and join date.</li>
        <li>Service attendance recorded as Present or Absent.</li>
        <li>Consecutive absence counts, care alerts, and follow-up notes.</li>
        <li>WhatsApp consent preferences and, when messaging is enabled, delivery history.</li>
        <li>User account details for authorized church leaders and administrators.</li>
        <li>First-timer contact details, consent, visits, assignments, journey stage, and coordinator follow-up outcomes.</li>
        <li>Technical and security records needed to operate and protect the service.</li>
      </ul>
    ),
  },
  {
    title: "Why we use it",
    body: (
      <ul>
        <li>To replace paper-based workforce attendance records.</li>
        <li>To help authorized leaders understand workforce engagement.</li>
        <li>To notice absence patterns and support timely pastoral care.</li>
        <li>To support agreed workforce check-ins if WhatsApp delivery is enabled.</li>
        <li>To maintain accurate records, prevent misuse, and secure the platform.</li>
        <li>To coordinate consent-based welcome and newcomer follow-up.</li>
      </ul>
    ),
  },
  {
    title: "Automated care alerts",
    body: (
      <>
        <p>
          Flock can automatically recognize consecutive missed services and
          create department, urgent, or pastoral care alerts. WhatsApp delivery
          is currently paused and requires separate church approval and setup.
        </p>
        <p>
          These alerts support human care. They do not make disciplinary or other
          significant decisions about a worker. Authorized leaders remain
          responsible for the response.
        </p>
      </>
    ),
  },
  {
    title: "WhatsApp choice",
    body: (
      <>
        <p>
          If automated WhatsApp delivery is enabled in the future, messages will
          be sent only where the worker has opted in. A phone number may still be retained for legitimate church
          administration or emergencies even when automated messages are off.
        </p>
        <p>
          A worker can withdraw consent at any time by contacting their
          department head or asking the church administrator to update their
          communication preference.
        </p>
      </>
    ),
  },
  {
    title: "Who may receive information",
    body: (
      <>
        <p>
          Access inside the church is role-based. Department heads see their own
          department, Church Leaders receive a read-only church-wide view, and
          Super Admins manage the platform and workforce records.
          First Timers Coordinators can access newcomer records needed for
          registration and follow-up, but not unrelated administrative records.
        </p>
        <p>
          Flock relies on service providers such as Supabase for database and
          authentication services and Vercel for hosting. If messaging is later
          enabled, approved messaging providers may process only the information
          needed to provide those services, potentially in other countries.
        </p>
      </>
    ),
  },
  {
    title: "Retention and security",
    body: (
      <>
        <p>
          Information should be kept only for as long as it supports workforce
          administration, newcomer care, safeguarding, reporting, or applicable legal
          obligations. Inactive worker records may be retained to preserve
          historical attendance, then deleted or anonymized under the church’s
          retention schedule.
        </p>
        <p>
          Flock uses authenticated access, database row-level security,
          role-based permissions, encrypted network connections, and activity
          records. No online system can guarantee absolute security.
        </p>
      </>
    ),
  },
  {
    title: "Your choices and rights",
    body: (
      <>
        <p>
          Subject to applicable law, workers may ask to access, correct, or
          delete their information; object to or restrict certain processing;
          withdraw communication consent; or raise a concern with the church.
          Some information may need to be retained for legitimate or legal
          reasons.
        </p>
        <p>
          Individuals in Nigeria may also have the right to complain to the
          Nigeria Data Protection Commission.
        </p>
      </>
    ),
  },
];

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-[#fbfcff] text-[#101c3d]">
      <header className="border-b border-[#dfe6f8] bg-white">
        <div className="mx-auto flex h-24 max-w-6xl items-center justify-between px-5 sm:px-8">
          <Link href="/" aria-label="Flock home" className="-ml-2">
            <FlockBrand compact />
          </Link>
          <Link
            href="/"
            className="rounded-full border border-[#dbe3f5] px-4 py-2.5 text-sm font-semibold text-[#34415f] transition hover:border-[#b8c8f5] hover:bg-[#f4f7ff]"
          >
            Back to home
          </Link>
        </div>
      </header>

      <section className="border-b border-[#e3e9f6] bg-[#eef3ff] px-5 py-16 sm:px-8 sm:py-20">
        <div className="mx-auto max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#4f7df3]">
            Your information
          </p>
          <h1 className="mt-4 text-4xl font-semibold tracking-[-0.045em] sm:text-6xl">
            Privacy notice
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-[#5f6b84]">
            Flock helps churches care for the people who serve. That trust also
            means handling workforce information transparently, respectfully,
            and only for clear church purposes.
          </p>
          <p className="mt-6 text-sm font-medium text-[#768198]">
            Effective 12 July 2026 · Last reviewed 20 July 2026
          </p>
        </div>
      </section>

      <div className="mx-auto grid max-w-6xl gap-12 px-5 py-16 sm:px-8 sm:py-20 lg:grid-cols-[220px_1fr]">
        <aside className="hidden lg:block">
          <div className="sticky top-8 rounded-2xl border border-[#e0e6f2] bg-white p-5 text-sm leading-6 text-[#6d7890] shadow-sm">
            <p className="font-semibold text-[#263452]">Plain-language notice</p>
            <p className="mt-2">
              This page explains Flock’s current product practices. The church
              deploying Flock should add its legal name, privacy contact, and
              approved retention periods before launch.
            </p>
          </div>
        </aside>

        <article className="max-w-3xl space-y-12">
          {sections.map((section, index) => (
            <section key={section.title} className="scroll-mt-8">
              <div className="flex gap-5">
                <span className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#edf2ff] text-xs font-semibold text-[#4f7df3]">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <div>
                  <h2 className="text-2xl font-semibold tracking-[-0.025em] text-[#172344]">
                    {section.title}
                  </h2>
                  <div className="mt-4 space-y-4 text-[15px] leading-7 text-[#5f6b82] [&_li]:relative [&_li]:mb-2 [&_li]:pl-5 [&_li]:before:absolute [&_li]:before:left-0 [&_li]:before:top-[0.7rem] [&_li]:before:h-1.5 [&_li]:before:w-1.5 [&_li]:before:rounded-full [&_li]:before:bg-[#4f7df3]">
                    {section.body}
                  </div>
                </div>
              </div>
            </section>
          ))}

          <section className="rounded-3xl bg-[#101c3d] p-7 text-white sm:p-9">
            <h2 className="text-2xl font-semibold">Questions or concerns?</h2>
            <p className="mt-3 max-w-xl text-sm leading-7 text-[#c3cce0]">
              Contact your department head or the church administrator managing
              Flock. The deploying church should publish its dedicated privacy
              contact here before production launch.
            </p>
          </section>
        </article>
      </div>

      <footer className="border-t border-[#e0e6f2] bg-white px-5 sm:px-8">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 py-7 text-xs text-[#8993a7] sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Flock. All rights reserved.</p>
          <Link className="font-medium hover:text-[#4f7df3]" href="/">
            Church workforce, cared for.
          </Link>
        </div>
      </footer>
    </main>
  );
}
