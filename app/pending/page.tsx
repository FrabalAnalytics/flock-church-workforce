import { redirect } from "next/navigation";
import { signOut } from "@/app/auth/actions";
import { FlockBrand } from "@/components/flock-brand";
import { requireProfile } from "@/lib/auth";

export default async function PendingPage() {
  const { user, profile } = await requireProfile();
  if (profile.role !== "pending") redirect("/app");

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#eef3ff] px-5 py-12">
      <section className="w-full max-w-xl rounded-[2rem] border border-white bg-white p-7 text-center shadow-[0_24px_70px_rgba(41,61,112,0.14)] sm:p-12">
        <div className="mx-auto w-fit"><FlockBrand compact /></div>
        <div className="mx-auto mt-5 flex h-16 w-16 items-center justify-center rounded-full bg-[#edf2ff] text-[#4f7df3]">
          <svg viewBox="0 0 24 24" className="h-8 w-8 fill-none stroke-current" strokeWidth="1.6"><path d="M12 7v5l3 2m6-2a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg>
        </div>
        <p className="mt-6 text-sm font-semibold uppercase tracking-[0.16em] text-[#4f7df3]">Account received</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-[-0.035em] text-[#101c3d]">Approval is pending</h1>
        <p className="mx-auto mt-4 max-w-md text-sm leading-7 text-[#68738a]">
          Welcome, {profile.full_name}. A Super Admin needs to assign your role
          {profile.department_id ? "" : " and department"} before you can enter Flock.
          You can safely close this page and return later.
        </p>
        <div className="mt-7 rounded-2xl bg-[#f6f8fd] px-5 py-4 text-left">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#8a94a8]">Signed in as</p>
          <p className="mt-1 text-sm font-medium text-[#34415f]">{user.email}</p>
        </div>
        <form action={signOut} className="mt-7">
          <button type="submit" className="rounded-full border border-[#d8e0f0] px-6 py-3 text-sm font-semibold text-[#34415f] transition hover:bg-[#f5f7fc]">Sign out</button>
        </form>
      </section>
    </main>
  );
}
