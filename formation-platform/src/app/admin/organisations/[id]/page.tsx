import { notFound } from "next/navigation";
import { requireCreator } from "@/lib/authz";
import {
  getOrganizationWithMembers,
  getMembershipRole,
  canManageOrgMembers,
} from "@/lib/organizations";
import { addMember, changeMemberRole, removeMember } from "@/lib/organization-actions";

const TYPE_LABEL: Record<string, string> = {
  SCHOOL: "École",
  UNIVERSITY: "Université",
  COMPANY: "Entreprise",
  GOVERNMENT: "Administration",
  NGO: "ONG",
  INDEPENDENT: "Indépendant",
};

export default async function OrganisationDetailPage({
  params,
}: PageProps<"/admin/organisations/[id]">) {
  const { id } = await params;
  const user = await requireCreator();

  const organization = await getOrganizationWithMembers(id);
  if (!organization) notFound();

  const myRole = await getMembershipRole(user.id, id);
  const isMember = myRole !== null || user.role === "ADMIN";
  if (!isMember) notFound();

  const canManage = user.role === "ADMIN" || canManageOrgMembers(myRole);

  return (
    <div className="max-w-2xl">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
        {TYPE_LABEL[organization.type]}
      </p>
      <h1 className="mt-1 text-2xl font-semibold text-slate-900">{organization.name}</h1>

      <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6">
        <h2 className="text-lg font-semibold text-slate-900">Membres</h2>
        <ul className="mt-4 flex flex-col divide-y divide-slate-100">
          {organization.memberships.map((m) => (
            <li key={m.id} className="flex items-center justify-between gap-3 py-3">
              <div>
                <p className="text-sm font-medium text-slate-900">{m.user.name}</p>
                <p className="text-xs text-slate-500">{m.user.email}</p>
              </div>
              {canManage ? (
                <div className="flex items-center gap-2">
                  <form
                    action={changeMemberRole.bind(null, id, m.id)}
                    className="flex items-center gap-1"
                  >
                    <select
                      name="role"
                      defaultValue={m.role}
                      className="rounded-lg border border-slate-300 px-2 py-1 text-xs outline-none focus:border-teal-600"
                    >
                      <option value="OWNER">Propriétaire</option>
                      <option value="ADMIN">Admin</option>
                      <option value="CREATOR">Créateur</option>
                      <option value="MEMBER">Membre</option>
                    </select>
                    <button
                      type="submit"
                      className="rounded-lg border border-slate-200 px-2 py-1 text-xs font-medium hover:bg-slate-50"
                    >
                      OK
                    </button>
                  </form>
                  <form action={removeMember.bind(null, id, m.id)}>
                    <button type="submit" className="text-xs text-red-500 hover:underline">
                      Retirer
                    </button>
                  </form>
                </div>
              ) : (
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                  {m.role}
                </span>
              )}
            </li>
          ))}
        </ul>

        {canManage && (
          <form
            action={addMember.bind(null, id)}
            className="mt-4 flex items-center gap-2 border-t border-slate-100 pt-4"
          >
            <input
              type="email"
              name="email"
              required
              placeholder="email@exemple.com"
              className="flex-1 rounded-lg border border-slate-300 px-3 py-1.5 text-sm outline-none focus:border-teal-600"
            />
            <select
              name="role"
              defaultValue="CREATOR"
              className="rounded-lg border border-slate-300 px-2 py-1.5 text-sm outline-none focus:border-teal-600"
            >
              <option value="ADMIN">Admin</option>
              <option value="CREATOR">Créateur</option>
              <option value="MEMBER">Membre</option>
            </select>
            <button
              type="submit"
              className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-700"
            >
              + Ajouter
            </button>
          </form>
        )}
        {canManage && (
          <p className="mt-2 text-xs text-slate-400">
            La personne doit déjà avoir un compte NT7East (inscrite sur la plateforme).
          </p>
        )}
      </section>
    </div>
  );
}
