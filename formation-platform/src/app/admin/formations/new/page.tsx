import { requireCreator } from "@/lib/authz";
import { getMyOrganizations, canManageOrgFormations } from "@/lib/organizations";
import { createFormation } from "@/lib/admin-actions";

export default async function NewFormationPage() {
  const user = await requireCreator();
  const memberships = await getMyOrganizations(user.id);
  const manageableOrgs = memberships.filter((m) => canManageOrgFormations(m.role));

  return (
    <div className="max-w-xl">
      <h1 className="text-2xl font-semibold text-slate-900">Nouvelle formation</h1>
      <form action={createFormation} className="mt-6 flex flex-col gap-4">
        <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
          Titre
          <input
            name="title"
            required
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-teal-600"
          />
        </label>
        {manageableOrgs.length > 0 && (
          <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
            Organisation
            <select
              name="organizationId"
              defaultValue=""
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-teal-600"
            >
              <option value="">Personnelle (par défaut)</option>
              {manageableOrgs.map((m) => (
                <option key={m.organizationId} value={m.organizationId}>
                  {m.organization.name}
                </option>
              ))}
            </select>
          </label>
        )}
        <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
          Catégorie
          <input
            name="category"
            placeholder="Assurance du particulier, DDA..."
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-teal-600"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
          Résumé (affiché dans le catalogue)
          <textarea
            name="summary"
            rows={2}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-teal-600"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
          Description complète
          <textarea
            name="description"
            rows={6}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-teal-600"
          />
        </label>
        <button
          type="submit"
          className="mt-2 self-start rounded-full bg-slate-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-slate-700"
        >
          Créer la formation
        </button>
      </form>
    </div>
  );
}
