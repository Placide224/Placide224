import Link from "next/link";
import { requireUser } from "@/lib/authz";
import { getUserEnrollments, getFormationProgress } from "@/lib/formations";

export default async function MonApprentissagePage() {
  const user = await requireUser();
  const enrollments = await getUserEnrollments(user.id);

  const withProgress = await Promise.all(
    enrollments.map(async (e) => ({
      enrollment: e,
      progress: await getFormationProgress(user.id, e.formationId),
    }))
  );

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-16">
      <h1 className="text-3xl font-semibold text-slate-900">Mon apprentissage</h1>
      <p className="mt-2 text-slate-600">
        Bienvenue {user.name}. Retrouvez ici vos formations en cours.
      </p>

      {withProgress.length === 0 ? (
        <div className="mt-10 rounded-2xl border border-dashed border-slate-300 p-10 text-center">
          <p className="text-slate-600">Vous n&apos;êtes inscrit à aucune formation.</p>
          <Link
            href="/catalogue"
            className="mt-4 inline-block rounded-full bg-slate-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-slate-700"
          >
            Parcourir le catalogue
          </Link>
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2">
          {withProgress.map(({ enrollment, progress }) => (
            <Link
              key={enrollment.id}
              href={`/mon-apprentissage/${enrollment.formation.slug}`}
              className="rounded-2xl border border-slate-200 bg-white p-6 transition hover:border-teal-600"
            >
              <h2 className="text-lg font-semibold text-slate-900">
                {enrollment.formation.title}
              </h2>
              <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-teal-600"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="mt-2 text-sm text-slate-500">{progress}% complété</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
