import { getAllUsers } from "@/lib/platform";
import { changeUserPlatformRole } from "@/lib/platform-actions";

const ROLE_LABEL: Record<string, string> = {
  ADMIN: "Super-admin",
  CREATOR: "Créateur",
  LEARNER: "Apprenant",
};

export default async function ConsoleUsersPage() {
  const users = await getAllUsers();

  return (
    <div>
      <h1 className="text-2xl font-semibold text-white">Utilisateurs</h1>
      <p className="mt-1 text-sm text-slate-400">
        {users.length} compte{users.length > 1 ? "s" : ""} NT7East, tous rôles confondus.
      </p>

      <div className="mt-6 flex flex-col divide-y divide-slate-800 rounded-xl border border-slate-800 bg-slate-900">
        {users.map((u) => (
          <div key={u.id} className="flex items-center justify-between gap-4 px-4 py-3">
            <div>
              <p className="text-sm font-medium text-white">{u.name}</p>
              <p className="mt-0.5 text-xs text-slate-400">
                {u.email} · {u._count.memberships} organisation
                {u._count.memberships > 1 ? "s" : ""}
                {u._count.formationsCreated > 0 &&
                  ` · ${u._count.formationsCreated} formation${u._count.formationsCreated > 1 ? "s" : ""} créée${u._count.formationsCreated > 1 ? "s" : ""}`}
                {u._count.enrollments > 0 &&
                  ` · ${u._count.enrollments} inscription${u._count.enrollments > 1 ? "s" : ""}`}
              </p>
            </div>
            <form action={changeUserPlatformRole.bind(null, u.id)} className="flex items-center gap-2">
              <select
                name="role"
                defaultValue={u.role}
                className="rounded-lg border border-slate-700 bg-slate-950 px-2 py-1.5 text-xs text-slate-100 outline-none focus:border-teal-500"
              >
                <option value="LEARNER">{ROLE_LABEL.LEARNER}</option>
                <option value="CREATOR">{ROLE_LABEL.CREATOR}</option>
                <option value="ADMIN">{ROLE_LABEL.ADMIN}</option>
              </select>
              <button
                type="submit"
                className="rounded-lg border border-slate-700 px-2.5 py-1.5 text-xs font-medium text-slate-200 hover:bg-slate-800"
              >
                OK
              </button>
            </form>
          </div>
        ))}
      </div>
    </div>
  );
}
