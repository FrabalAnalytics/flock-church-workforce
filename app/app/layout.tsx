import Link from "next/link";
import { redirect } from "next/navigation";
import { signOut } from "@/app/auth/actions";
import { FlockBrand } from "@/components/flock-brand";
import { WorkspaceNav, type WorkspaceLink } from "@/components/workspace-nav";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

const roleLabels = { super_admin: "Super Admin", church_leader: "Church Leader", department_head: "Department Head" };

export default async function WorkspaceLayout({ children }: { children: React.ReactNode }) {
  const { profile } = await requireProfile();
  if (profile.role === "pending") redirect("/pending");

  let departmentName: string | null = null;
  if (profile.department_id) {
    const supabase = await createClient();
    const { data } = await supabase.from("departments").select("name").eq("id", profile.department_id).single();
    departmentName = data?.name ?? null;
  }

  const links: Record<string, WorkspaceLink[]> = {
    super_admin: [
      { label: "Overview", href: "/app/reports" },
      { label: "Workers", href: "/app/workers" },
      { label: "Departments", href: "/app/departments" },
      { label: "Users", href: "/app/users" },
      { label: "Attendance", href: "/app/attendance" },
      { label: "Care alerts", href: "/app/follow-ups" },
    ],
    church_leader: [
      { label: "Overview", href: "/app/reports" },
      { label: "Attendance", href: "/app/attendance" },
      { label: "Care alerts", href: "/app/follow-ups" },
    ],
    department_head: [
      { label: "Overview", href: "/app" },
      { label: "Log attendance", href: "/app/attendance/new" },
      { label: "History", href: "/app/attendance" },
      { label: "Reports", href: "/app/reports" },
      { label: "Follow-ups", href: "/app/follow-ups" },
    ],
  };

  return (
    <main className="min-h-screen bg-[#f5f7fc] text-[#101c3d] lg:grid lg:grid-cols-[260px_1fr]">
      <aside className="border-b border-[#e0e6f2] bg-white px-5 py-4 lg:min-h-screen lg:border-b-0 lg:border-r lg:px-6 lg:py-7">
        <div className="flex items-center justify-between lg:block">
          <div className="-ml-2"><FlockBrand compact /></div>
          <div className="rounded-full bg-[#edf2ff] px-3 py-1.5 text-xs font-semibold text-[#4f7df3] lg:mt-4 lg:inline-block">{roleLabels[profile.role]}</div>
        </div>
        <WorkspaceNav links={links[profile.role]} />
        <div className="mt-8 hidden space-y-3 lg:block">
          <Link href="/privacy" className="block text-sm font-semibold text-[#7a859a] hover:text-[#4f7df3]">Privacy notice</Link>
          <form action={signOut}><button type="submit" className="text-sm font-semibold text-[#7a859a] hover:text-[#4f7df3]">Sign out</button></form>
        </div>
      </aside>
      <section className="min-w-0">
        <header className="flex items-center justify-between border-b border-[#e2e7f1] bg-white px-5 py-4 sm:px-8 lg:px-12">
          <div className="min-w-0 pr-3"><p className="truncate text-sm font-semibold text-[#253252]">{profile.full_name}</p><p className="mt-0.5 truncate text-xs text-[#8993a7]">{departmentName ? `${departmentName} Department` : roleLabels[profile.role]}</p></div>
          <div className="flex shrink-0 items-center gap-3 lg:hidden">
            <Link href="/privacy" className="text-xs font-semibold text-[#647087]">Privacy</Link>
            <form action={signOut}><button type="submit" className="text-xs font-semibold text-[#647087]">Sign out</button></form>
          </div>
        </header>
        <div className="overflow-x-hidden px-4 py-7 sm:px-8 sm:py-8 lg:px-12 lg:py-10">{children}</div>
      </section>
    </main>
  );
}
