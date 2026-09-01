import Link from "next/link";
import { getAllFormationsGlobal } from "@/lib/platform";

export default async function ConsoleFormationsPage() {
  const formations = await getAllFormationsGlobal();

  return (
    <div>
      <h1 className="text-2xl font-semibold text-white">Formations</h1>
      <p className="mt-1 text-sm text-slate-400">
        Vue globale, toutes organisations et créateurs confondus.
      </p>

      <div className="mt-6 flex flex-col divide-y divide-slate-800 rounded-xl border border-slate-800 bg-slate-900">
        {formations.map((f) => (
          <Link
            key={f.id}
            href={`/admin/formations/${f.id}`}
            className="flex items-center justify-between gap-4 px-4 py-3 hover:bg-slate-800"
          >
            <div>
              <p className="text-sm font-medium text-white">{f.title}</p>
              <p className="mt-0.5 text-xs text-slate-400">
                {f.creator.name} ({f.creator.email})
                {f.organization && ` · ${f.organization.name}`} · {f._count.enrollments} inscrit
                {f._count.enrollments > 1 ? "s" : ""}
              </p>
            </div>
            <span
              className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                f.status === "PUBLISHED"
                  ? "bg-teal-900 text-teal-300"
                  : "bg-slate-800 text-slate-400"
              }`}
            >
              {f.status === "PUBLISHED" ? "Publiée" : "Brouillon"}
            </span>
          </Link>
        ))}
        {formations.length === 0 && (
          <p className="px-4 py-6 text-sm text-slate-500">Aucune formation.</p>
        )}
      </div>
    </div>
  );
}
