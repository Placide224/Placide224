import Link from "next/link";
import { getPublishedFormations } from "@/lib/formations";

export default async function CataloguePage() {
  const formations = await getPublishedFormations();

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-16">
      <h1 className="text-3xl font-semibold text-slate-900">Catalogue</h1>
      <p className="mt-2 text-slate-600">
        {formations.length} formation{formations.length > 1 ? "s" : ""} disponible
        {formations.length > 1 ? "s" : ""}.
      </p>

      {formations.length === 0 ? (
        <p className="mt-12 text-slate-500">
          Aucune formation publiée pour le moment. Revenez bientôt.
        </p>
      ) : (
        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {formations.map((formation) => (
            <Link
              key={formation.id}
              href={`/catalogue/${formation.slug}`}
              className="flex flex-col rounded-2xl border border-slate-200 bg-white p-6 transition hover:border-teal-600"
            >
              {formation.category && (
                <span className="text-xs font-semibold uppercase tracking-wide text-teal-700">
                  {formation.category}
                </span>
              )}
              <h2 className="mt-2 text-lg font-semibold text-slate-900">
                {formation.title}
              </h2>
              <p className="mt-2 line-clamp-3 flex-1 text-sm text-slate-600">
                {formation.summary}
              </p>
              <p className="mt-4 text-xs text-slate-400">
                Par {formation.creator.name}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
