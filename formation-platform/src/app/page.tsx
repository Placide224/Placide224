import Link from "next/link";
import { getPublishedFormations } from "@/lib/formations";

export default async function Home() {
  const formations = await getPublishedFormations();
  const highlights = formations.slice(0, 3);

  return (
    <div className="flex flex-col">
      <section className="border-b border-slate-200 bg-gradient-to-b from-teal-50 to-white">
        <div className="mx-auto max-w-6xl px-4 py-24 text-center">
          <p className="text-sm font-semibold uppercase tracking-wide text-teal-700">
            Vitrine de formation
          </p>
          <h1 className="mx-auto mt-4 max-w-3xl text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
            Créez, structurez et certifiez vos formations en ligne
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-600">
            Modules texte, vidéo et quiz générés et corrigés depuis un espace
            de production réservé aux créateurs. Vos apprenants suivent leur
            progression dans un espace dédié.
          </p>
          <div className="mt-10 flex items-center justify-center gap-4">
            <Link
              href="/catalogue"
              className="rounded-full bg-slate-900 px-6 py-3 text-sm font-medium text-white hover:bg-slate-700"
            >
              Voir le catalogue
            </Link>
            <Link
              href="/inscription"
              className="rounded-full border border-slate-300 px-6 py-3 text-sm font-medium text-slate-700 hover:border-slate-900"
            >
              Créer un compte apprenant
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto grid w-full max-w-6xl grid-cols-1 gap-8 px-4 py-16 sm:grid-cols-3">
        {[
          {
            title: "Structurer",
            body: "Organisez vos formations en modules et leçons texte, vidéo ou quiz depuis le back-office.",
          },
          {
            title: "Générer",
            body: "Générez des quiz à partir du contenu d'une leçon, puis relisez et corrigez chaque question avant publication.",
          },
          {
            title: "Suivre",
            body: "Les apprenants inscrits suivent leur progression module par module dans leur espace personnel.",
          },
        ].map((f) => (
          <div key={f.title} className="rounded-2xl border border-slate-200 bg-white p-6">
            <h3 className="text-lg font-semibold text-slate-900">{f.title}</h3>
            <p className="mt-2 text-sm text-slate-600">{f.body}</p>
          </div>
        ))}
      </section>

      {highlights.length > 0 && (
        <section className="mx-auto w-full max-w-6xl px-4 pb-24">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold text-slate-900">
              Dernières formations publiées
            </h2>
            <Link href="/catalogue" className="text-sm font-medium text-teal-700 hover:underline">
              Tout voir →
            </Link>
          </div>
          <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-3">
            {highlights.map((formation) => (
              <Link
                key={formation.id}
                href={`/catalogue/${formation.slug}`}
                className="rounded-2xl border border-slate-200 bg-white p-6 transition hover:border-teal-600"
              >
                {formation.category && (
                  <span className="text-xs font-semibold uppercase tracking-wide text-teal-700">
                    {formation.category}
                  </span>
                )}
                <h3 className="mt-2 text-lg font-semibold text-slate-900">
                  {formation.title}
                </h3>
                <p className="mt-2 line-clamp-3 text-sm text-slate-600">
                  {formation.summary}
                </p>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
