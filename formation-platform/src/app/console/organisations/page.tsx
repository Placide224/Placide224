import Link from "next/link";
import { getAllOrganizations } from "@/lib/platform";

const TYPE_LABEL: Record<string, string> = {
  SCHOOL: "École",
  UNIVERSITY: "Université",
  COMPANY: "Entreprise",
  GOVERNMENT: "Administration",
  NGO: "ONG",
  INDEPENDENT: "Indépendant",
};

export default async function ConsoleOrganisationsPage() {
  const organizations = await getAllOrganizations();

  return (
    <div>
      <h1 className="text-2xl font-semibold text-white">Organisations & partenaires</h1>
      <p className="mt-1 text-sm text-slate-400">
        Toutes les organisations créées sur la plateforme, tous créateurs confondus.
      </p>

      {organizations.length === 0 ? (
        <p className="mt-10 text-slate-500">Aucune organisation pour le moment.</p>
      ) : (
        <div className="mt-6 flex flex-col divide-y divide-slate-800 rounded-xl border border-slate-800 bg-slate-900">
          {organizations.map((o) => (
            <Link
              key={o.id}
              href={`/console/organisations/${o.id}`}
              className="flex items-center justify-between gap-4 px-4 py-3 hover:bg-slate-800"
            >
              <div>
                <p className="text-sm font-medium text-white">{o.name}</p>
                <p className="mt-0.5 text-xs text-slate-400">
                  {TYPE_LABEL[o.type]} · {o._count.memberships} membre
                  {o._count.memberships > 1 ? "s" : ""} · {o._count.formations} formation
                  {o._count.formations > 1 ? "s" : ""}
                </p>
              </div>
              <span
                className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                  o.status === "ACTIVE"
                    ? "bg-teal-900 text-teal-300"
                    : "bg-red-900 text-red-300"
                }`}
              >
                {o.status === "ACTIVE" ? "Actif" : "Suspendu"}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
