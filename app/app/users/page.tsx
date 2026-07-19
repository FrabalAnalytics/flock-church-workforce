import { updateUserAccess } from "@/app/app/admin/actions";
import { WorkspaceNotice } from "@/components/workspace-notice";
import { requireSuperAdmin } from "@/lib/admin";
import { createClient } from "@/lib/supabase/server";

const labels = {
  pending: "Pending",
  super_admin: "Super Admin",
  church_leader: "Church Leader",
  department_head: "Department Head",
};

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("");
}

export default async function UsersPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string; error?: string }>;
}) {
  await requireSuperAdmin();
  const params = await searchParams;
  const supabase = await createClient();
  const [{ data: users }, { data: departments }] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, full_name, email, phone_number, role, department_id, created_at")
      .order("created_at", { ascending: false }),
    supabase.from("departments").select("id, name").order("name"),
  ]);
  const pendingCount =
    users?.filter((user) => user.role === "pending").length ?? 0;

  return (
    <div className="mx-auto max-w-6xl">
      <WorkspaceNotice message={params.message} error={params.error} />
      <p className="text-sm font-semibold uppercase tracking-[0.15em] text-[#4f7df3]">
        Access control
      </p>
      <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-[-0.035em]">Users</h1>
          <p className="mt-2 text-sm text-[#758097]">
            Approve accounts and assign the right level of access.
          </p>
        </div>
        <span className="w-fit rounded-full bg-[#fff3dc] px-4 py-2 text-xs font-semibold text-[#a76813]">
          {pendingCount} pending
        </span>
      </div>

      <div className="mt-8 space-y-4">
        {users?.map((user) => (
          <article
            key={user.id}
            className="rounded-3xl border border-[#e0e6f2] bg-white p-5 sm:p-6"
          >
            <div className="grid gap-5 lg:grid-cols-[1fr_1.5fr] lg:items-center">
              <div>
                <div className="flex items-center gap-3">
                  <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#edf2ff] text-sm font-semibold text-[#4f7df3]">
                    {initials(user.full_name)}
                  </span>
                  <div>
                    <p className="font-semibold text-[#253252]">{user.full_name}</p>
                    <p className="mt-1 text-xs text-[#8993a7]">
                      {user.email ?? "Email unavailable"}
                    </p>
                  </div>
                </div>
                <span
                  className={`mt-4 inline-block rounded-full px-3 py-1 text-xs font-semibold ${
                    user.role === "pending"
                      ? "bg-[#fff3dc] text-[#a76813]"
                      : "bg-[#edf7f1] text-[#347457]"
                  }`}
                >
                  {labels[user.role as keyof typeof labels]}
                </span>
              </div>

              <form
                action={updateUserAccess}
                className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]"
              >
                <input type="hidden" name="id" value={user.id} />
                <label className="text-xs font-semibold text-[#68738a]">
                  Role
                  <select
                    name="role"
                    defaultValue={user.role}
                    className="mt-2 h-11 w-full rounded-xl border border-[#dce3f1] bg-white px-3 text-sm"
                  >
                    <option value="pending">Pending</option>
                    <option value="department_head">Department Head</option>
                    <option value="church_leader">Church Leader</option>
                    <option value="super_admin">Super Admin</option>
                  </select>
                </label>
                <label className="text-xs font-semibold text-[#68738a]">
                  Department
                  <select
                    name="department_id"
                    defaultValue={user.department_id ?? ""}
                    className="mt-2 h-11 w-full rounded-xl border border-[#dce3f1] bg-white px-3 text-sm"
                  >
                    <option value="">Not assigned</option>
                    {departments?.map((department) => (
                      <option key={department.id} value={department.id}>
                        {department.name}
                      </option>
                    ))}
                  </select>
                </label>
                <button className="self-end rounded-xl bg-[#4f7df3] px-5 py-3 text-sm font-semibold text-white">
                  Save access
                </button>
              </form>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
