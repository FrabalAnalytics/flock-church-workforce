import Link from "next/link";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { signOut } from "@/app/auth/actions";
import { FlockBrand } from "@/components/flock-brand";
import { WorkspaceNav, type WorkspaceGroup } from "@/components/workspace-nav";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

const roleLabels = { super_admin: "Super Admin", church_leader: "Church Leader", department_head: "Department Head" };

export const metadata: Metadata = { title: "Workspace", robots: { index: false, follow: false } };

export default async function WorkspaceLayout({ children }: { children: React.ReactNode }) {
  const { profile } = await requireProfile();
  if (profile.role === "pending") redirect("/pending");

  let departmentName: string | null = null;
  if (profile.department_id) {
    const supabase = await createClient();
    const { data } = await supabase.from("departments").select("name").eq("id", profile.department_id).single();
    departmentName = data?.name ?? null;
  }

  const navigation: Record<string, WorkspaceGroup[]> = {
    super_admin: [
      { label: "Workspace", links: [{ label: "Overview", href: "/app/reports", icon: "overview" }, { label: "Action Centre", href: "/app/action-centre", icon: "actions" }, { label: "Getting started", href: "/app/getting-started", icon: "setup" }] },
      { label: "People", links: [
        { label: "Worker directory", href: "/app/workers", icon: "people" },
        { label: "Users", href: "/app/users", icon: "users" },
        { label: "Ministers", href: "/app/ministers", icon: "ministers" },
        { label: "Departments", href: "/app/departments", icon: "departments" },
        { label: "Audit history", href: "/app/audit", icon: "audit" },
        { label: "Settings & health", href: "/app/settings", icon: "settings" },
      ] },
      { label: "Ministry operations", links: [
        { label: "Service-day control", href: "/app/service-days", icon: "control" },
        { label: "Worker attendance", href: "/app/attendance", icon: "attendance" },
        { label: "Congregation attendance", href: "/app/church-attendance", icon: "congregation" },
        { label: "Service programme", href: "/app/programmes", icon: "programme" },
        { label: "Care alerts", href: "/app/follow-ups", icon: "care" },
      ] },
    ],
    church_leader: [
      { label: "Workspace", links: [{ label: "Overview", href: "/app/reports", icon: "overview" }, { label: "Action Centre", href: "/app/action-centre", icon: "actions" }] },
      { label: "Ministry oversight", links: [
        { label: "Service-day control", href: "/app/service-days", icon: "control" },
        { label: "Worker attendance", href: "/app/attendance", icon: "attendance" },
        { label: "Congregation attendance", href: "/app/church-attendance", icon: "congregation" },
        { label: "Service programme", href: "/app/programmes", icon: "programme" },
        { label: "Care alerts", href: "/app/follow-ups", icon: "care" },
      ] },
    ],
    department_head: [
      { label: "Workspace", links: [{ label: "Overview", href: "/app", icon: "overview" }, { label: "Action Centre", href: "/app/action-centre", icon: "actions" }] },
      { label: "Department operations", links: [
        { label: "Log worker attendance", href: "/app/attendance/new", icon: "attendance" },
        { label: "Attendance history", href: "/app/attendance", icon: "attendance" },
        { label: "Worker reports", href: "/app/reports", icon: "overview" },
        { label: "Service programme", href: "/app/programmes", icon: "programme" },
        { label: "Follow-ups", href: "/app/follow-ups", icon: "care" },
      ] },
    ],
  };

  return (
    <main className="min-h-screen bg-[var(--color-canvas)] text-[var(--color-text)] lg:grid lg:grid-cols-[280px_minmax(0,1fr)]">
      <a href="#workspace-content" className="skip-link">Skip to main content</a>
      <aside className="border-b border-[var(--color-border)] bg-white px-5 py-4 lg:sticky lg:top-0 lg:h-screen lg:overflow-y-auto lg:border-b-0 lg:border-r lg:px-6 lg:py-7">
        <div className="flex items-center justify-between lg:block">
          <div className="-ml-2"><FlockBrand compact /></div>
          <div className="rounded-full bg-[#edf2ff] px-3 py-1.5 text-xs font-semibold text-[#4f7df3] lg:mt-4 lg:inline-block">{roleLabels[profile.role]}</div>
        </div>
        <WorkspaceNav groups={navigation[profile.role]} />
        <div className="mt-9 hidden border-t border-[var(--color-border)] pt-5 lg:block">
          <Link href="/privacy" className="flex min-h-11 items-center rounded-xl px-3 text-sm font-medium text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-subtle)] hover:text-[var(--color-text)]">Privacy notice</Link>
          <form action={signOut}><button type="submit" className="flex min-h-11 w-full items-center rounded-xl px-3 text-sm font-medium text-[var(--color-text-secondary)] hover:bg-[var(--color-danger-soft)] hover:text-[var(--color-danger)]">Sign out</button></form>
        </div>
      </aside>
      <section className="min-w-0">
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-[var(--color-border)] bg-white/95 px-5 py-3.5 backdrop-blur-xl sm:px-8 lg:px-10">
          <div className="min-w-0 pr-3"><p className="truncate text-sm font-semibold text-[#253252]">{profile.full_name}</p><p className="mt-0.5 truncate text-xs text-[#8993a7]">{departmentName ? `${departmentName} Department` : roleLabels[profile.role]}</p></div>
          <div className="flex shrink-0 items-center gap-3 lg:hidden">
            <Link href="/privacy" className="text-xs font-semibold text-[#647087]">Privacy</Link>
            <form action={signOut}><button type="submit" className="text-xs font-semibold text-[#647087]">Sign out</button></form>
          </div>
        </header>
        <div id="workspace-content" tabIndex={-1} className="px-4 py-7 outline-none sm:px-8 sm:py-8 lg:px-10 lg:py-10">{children}</div>
      </section>
    </main>
  );
}
