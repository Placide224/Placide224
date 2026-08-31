import Link from "next/link";
import { requireCreator } from "@/lib/authz";
import { getMyOrganizations } from "@/lib/organizations";

const TYPE_LABEL: Record<string, string> = {
  SCHOOL: "École",
  UNIVERSITY: "Université",
  COMPANY: "Entreprise",
  GOVERNMENT: "Administration",
  NGO: "ONG",
  INDEPENDENT: "Indépendant",
};

const ROLE_LABEL: Record<string, string> = {
  OWNER: "Propriétaire",
  ADMIN: "Admin",
  CREATOR: "Créateur",
  MEMBER: "Membre",
};

export default async function OrganisationsPage() {
  const user = await requireCreator();
  const memberships = await getMyOrganizations(user.id);

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-slate-900">Organisations</h1>
        <Link
          href="/admin/organisations/new"
          className="rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
        >
          + Nouvelle organisation
        </Link>
      </div>
      <p className="mt-1 text-sm text-slate-500">
        Une organisation (école, entreprise, université...) permet à plusieurs créateurs de
        gérer des formations en commun.
      </p>

      {memberships.length === 0 ? (
        <p className="mt-10 text-slate-500">Tu n&apos;appartiens à aucune organisation.</p>
      ) : (
        <div className="mt-6 flex flex-col divide-y divide-slate-200 rounded-2xl border border-slate-200 bg-white">
          {memberships.map((m) => (
            <Link
              key={m.id}
              href={`/admin/organisations/${m.organizationId}`}
              className="flex items-center justify-between gap-4 px-5 py-4 hover:bg-slate-50"
            >
              <div>
                <p className="font-medium text-slate-900">{m.organization.name}</p>
                <p className="mt-0.5 text-xs text-slate-500">
                  {TYPE_LABEL[m.organization.type]} · {m.organization._count.memberships} membre
                  {m.organization._count.memberships > 1 ? "s" : ""} ·{" "}
                  {m.organization._count.formations} formation
                  {m.organization._count.formations > 1 ? "s" : ""}
                </p>
              </div>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                {ROLE_LABEL[m.role]}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
