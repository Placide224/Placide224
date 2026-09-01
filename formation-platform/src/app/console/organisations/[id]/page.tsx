import Link from "next/link";
import { notFound } from "next/navigation";
import { getOrganizationForConsole } from "@/lib/platform";
import { changeOrganizationStatus, changeOrganizationType } from "@/lib/platform-actions";

const TYPE_LABEL: Record<string, string> = {
  SCHOOL: "École",
  UNIVERSITY: "Université",
  COMPANY: "Entreprise",
  GOVERNMENT: "Administration",
  NGO: "ONG",
  INDEPENDENT: "Indépendant",
};

export default async function ConsoleOrganisationDetailPage({
  params,
}: PageProps<"/console/organisations/[id]">) {
  const { id } = await params;
  const organization = await getOrganizationForConsole(id);
  if (!organization) notFound();

  const suspend = changeOrganizationStatus.bind(null, id, "SUSPENDED");
  const activate = changeOrganizationStatus.bind(null, id, "ACTIVE");

  return (
    <div className="max-w-2xl">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            {TYPE_LABEL[organization.type]}
          </p>
          <h1 className="mt-1 text-2xl font-semibold text-white">{organization.name}</h1>
        </div>
        {organization.status === "ACTIVE" ? (
          <form action={suspend}>
            <button
              type="submit"
              className="rounded-full border border-red-800 px-4 py-2 text-sm font-medium text-red-300 hover:bg-red-950"
            >
              Suspendre
            </button>
          </form>
        ) : (
          <form action={activate}>
            <button
              type="submit"
              className="rounded-full bg-teal-700 px-4 py-2 text-sm font-medium text-white hover:bg-teal-600"
            >
              Réactiver
            </button>
          </form>
        )}
      </div>

      <section className="mt-6 rounded-xl border border-slate-800 bg-slate-900 p-5">
        <h2 className="text-sm font-semibold text-white">Type d&apos;organisation</h2>
        <form action={changeOrganizationType.bind(null, id)} className="mt-2 flex items-center gap-2">
          <select
            name="type"
            defaultValue={organization.type}
            className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 text-sm text-slate-100 outline-none focus:border-teal-500"
          >
            <option value="INDEPENDENT">Indépendant</option>
            <option value="SCHOOL">École</option>
            <option value="UNIVERSITY">Université</option>
            <option value="COMPANY">Entreprise</option>
            <option value="GOVERNMENT">Administration</option>
            <option value="NGO">ONG</option>
          </select>
          <button
            type="submit"
            className="rounded-lg border border-slate-700 px-3 py-1.5 text-xs font-medium text-slate-200 hover:bg-slate-800"
          >
            Enregistrer
          </button>
        </form>
      </section>

      <section className="mt-6 rounded-xl border border-slate-800 bg-slate-900 p-5">
        <h2 className="text-sm font-semibold text-white">
          Membres ({organization.memberships.length})
        </h2>
        <ul className="mt-3 flex flex-col divide-y divide-slate-800">
          {organization.memberships.map((m) => (
            <li key={m.id} className="flex items-center justify-between py-2">
              <div>
                <p className="text-sm text-slate-100">{m.user.name}</p>
                <p className="text-xs text-slate-500">{m.user.email}</p>
              </div>
              <span className="rounded-full bg-slate-800 px-2.5 py-1 text-xs text-slate-300">
                {m.role}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-6 rounded-xl border border-slate-800 bg-slate-900 p-5">
        <h2 className="text-sm font-semibold text-white">
          Formations ({organization.formations.length})
        </h2>
        <ul className="mt-3 flex flex-col divide-y divide-slate-800">
          {organization.formations.map((f) => (
            <li key={f.id} className="flex items-center justify-between py-2">
              <Link
                href={`/admin/formations/${f.id}`}
                className="text-sm text-slate-100 hover:text-teal-400 hover:underline"
              >
                {f.title}
              </Link>
              <span
                className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                  f.status === "PUBLISHED"
                    ? "bg-teal-900 text-teal-300"
                    : "bg-slate-800 text-slate-400"
                }`}
              >
                {f.status === "PUBLISHED" ? "Publiée" : "Brouillon"}
              </span>
            </li>
          ))}
          {organization.formations.length === 0 && (
            <p className="py-2 text-sm text-slate-500">Aucune formation.</p>
          )}
        </ul>
      </section>
    </div>
  );
}
