import { redirect } from "next/navigation";
import { signOut } from "@/app/auth/actions";
import { ApprovalStatusButton } from "@/components/approval-status-button";
import { FlockBrand } from "@/components/flock-brand";
import { FormSubmitButton } from "@/components/form-submit-button";
import { getCurrentProfile, getCurrentUser } from "@/lib/auth";

export const metadata = { title: "Approval pending", description: "Your Flock account is awaiting administrator approval.", robots: { index: false, follow: false } };

export default async function PendingPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");
  const profile = await getCurrentProfile();
  if (profile && profile.role !== "pending") redirect("/app");
  const metadataName = String(user.user_metadata?.full_name ?? "").trim();
  const displayName = profile?.full_name || metadataName || user.email?.split("@")[0] || "there";
  const profileMissing = !profile;

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#eef3ff] px-5 py-8 sm:py-12">
      <section className="w-full max-w-xl rounded-[2rem] border border-white bg-white p-6 text-center shadow-[0_24px_70px_rgba(41,61,112,0.14)] sm:p-12">
        <div className="mx-auto w-fit"><FlockBrand compact /></div>
        <div className="mx-auto mt-5 flex h-16 w-16 items-center justify-center rounded-full bg-[#edf2ff] text-[#4f7df3]">
          <svg viewBox="0 0 24 24" className="h-8 w-8 fill-none stroke-current" strokeWidth="1.6"><path d="M12 7v5l3 2m6-2a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg>
        </div>
        <p className="mt-6 text-sm font-semibold uppercase tracking-[0.16em] text-[#4f7df3]">{profileMissing ? "Account setup" : "Account received"}</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-[-0.035em] text-[#101c3d]">{profileMissing ? "Your workspace profile is being prepared" : "Approval is pending"}</h1>
        <p className="mx-auto mt-4 max-w-md text-sm leading-7 text-[#68738a]">
          Welcome, {displayName}. {profileMissing
            ? "Your secure sign-in account exists, but its Flock workspace profile is not available yet. An administrator may need to complete account provisioning."
            : `A Super Admin needs to assign your role${profile.department_id ? "" : " and department"} before you can enter Flock.`}
          {" "}You can safely close this page and return later.
        </p>
        <div className="mt-7 rounded-2xl bg-[#f6f8fd] px-5 py-4 text-left">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#8a94a8]">Signed in as</p>
          <p className="mt-1 text-sm font-medium text-[#34415f]">{user.email}</p>
        </div>
        <ol className="mt-6 grid gap-3 text-left sm:grid-cols-3" aria-label="Account approval progress">
          <li className={`rounded-2xl border p-4 ${profileMissing ? "border-[#efdcb6] bg-[#fffaf0]" : "border-[#d7e1f7] bg-[#f7f9ff]"}`}><span className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${profileMissing ? "bg-[#fff0cf] text-[#976619]" : "bg-[#e2ebff] text-[#4168cd]"}`}>{profileMissing ? "1" : "✓"}</span><p className="mt-3 text-sm font-semibold text-[#34415f]">Workspace profile</p><p className="mt-1 text-xs leading-5 text-[#7b8599]">{profileMissing ? "Waiting for provisioning." : "Account details received."}</p></li>
          <li className={`rounded-2xl border p-4 ${profileMissing ? "border-[#e3e7ef] bg-[#fafbfe]" : "border-[#efdcb6] bg-[#fffaf0]"}`}><span className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${profileMissing ? "bg-[#edf0f5] text-[#7b8599]" : "bg-[#fff0cf] text-[#976619]"}`}>2</span><p className={`mt-3 text-sm font-semibold ${profileMissing ? "text-[#657087]" : "text-[#5f4a22]"}`}>Admin review</p><p className={`mt-1 text-xs leading-5 ${profileMissing ? "text-[#929bad]" : "text-[#8c7853]"}`}>Role and department assigned.</p></li>
          <li className="rounded-2xl border border-[#e3e7ef] bg-[#fafbfe] p-4"><span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#edf0f5] text-xs font-bold text-[#7b8599]">3</span><p className="mt-3 text-sm font-semibold text-[#657087]">Enter Flock</p><p className="mt-1 text-xs leading-5 text-[#929bad]">Your workspace becomes available.</p></li>
        </ol>
        <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
          <ApprovalStatusButton />
          <form action={signOut}>
            <FormSubmitButton pendingLabel="Signing out..." className="min-h-12 w-full rounded-xl border border-[#d8e0f0] bg-white px-6 text-sm font-semibold text-[#34415f] transition hover:bg-[#f5f7fc] disabled:opacity-60 sm:w-auto">Sign out</FormSubmitButton>
          </form>
        </div>
      </section>
    </main>
  );
}
