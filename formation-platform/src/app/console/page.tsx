import Link from "next/link";
import { getPlatformStats, getRecentOrganizations } from "@/lib/platform";

const TYPE_LABEL: Record<string, string> = {
  SCHOOL: "École",
  UNIVERSITY: "Université",
  COMPANY: "Entreprise",
  GOVERNMENT: "Administration",
  NGO: "ONG",
  INDEPENDENT: "Indépendant",
};

export default async function ConsoleDashboardPage() {
  const [stats, recentOrgs] = await Promise.all([getPlatformStats(), getRecentOrganizations()]);

  const cards = [
    { label: "Organisations", value: stats.organizations },
    { label: "Utilisateurs", value: stats.users },
    { label: "Créateurs / Admins", value: stats.creators },
    { label: "Apprenants", value: stats.learners },
    { label: "Formations", value: stats.formations },
    { label: "Formations publiées", value: stats.publishedFormations },
    { label: "Inscriptions", value: stats.enrollments },
  ];

  return (
    <div>
      <h1 className="text-2xl font-semibold text-white">Vue d&apos;ensemble de la plateforme</h1>
      <p className="mt-1 text-sm text-slate-400">
        Statistiques globales, tous partenaires et organisations confondus.
      </p>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {cards.map((c) => (
          <div key={c.label} className="rounded-xl border border-slate-800 bg-slate-900 p-4">
            <p className="text-2xl font-semibold text-white">{c.value}</p>
            <p className="mt-1 text-xs text-slate-400">{c.label}</p>
          </div>
        ))}
      </div>

      <div className="mt-8 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-white">Dernières organisations</h2>
        <Link href="/console/organisations" className="text-sm text-teal-400 hover:underline">
          Voir tout →
        </Link>
      </div>

      {recentOrgs.length === 0 ? (
        <p className="mt-4 text-sm text-slate-500">Aucune organisation pour le moment.</p>
      ) : (
        <div className="mt-4 flex flex-col divide-y divide-slate-800 rounded-xl border border-slate-800 bg-slate-900">
          {recentOrgs.map((o) => (
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
