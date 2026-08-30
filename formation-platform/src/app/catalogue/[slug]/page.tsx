import Link from "next/link";
import { notFound } from "next/navigation";
import { getFormationBySlugPublished } from "@/lib/formations";
import { getSessionUser } from "@/lib/authz";
import { prisma } from "@/lib/prisma";
import { enrollAction } from "@/lib/enrollment-actions";

export default async function FormationDetailPage({
  params,
}: PageProps<"/catalogue/[slug]">) {
  const { slug } = await params;
  const formation = await getFormationBySlugPublished(slug);
  if (!formation) notFound();

  const user = await getSessionUser();
  const alreadyEnrolled = user
    ? Boolean(
        await prisma.enrollment.findUnique({
          where: { userId_formationId: { userId: user.id, formationId: formation.id } },
        })
      )
    : false;

  const totalLessons = formation.modules.reduce((n, m) => n + m.lessons.length, 0);
  const enroll = enrollAction.bind(null, formation.id, formation.slug);

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-16">
      {formation.category && (
        <span className="text-xs font-semibold uppercase tracking-wide text-teal-700">
          {formation.category}
        </span>
      )}
      <h1 className="mt-2 text-3xl font-semibold text-slate-900">{formation.title}</h1>
      <p className="mt-3 text-lg text-slate-600">{formation.summary}</p>
      <p className="mt-1 text-sm text-slate-400">
        Par {formation.creator.name} · {formation.modules.length} module
        {formation.modules.length > 1 ? "s" : ""} · {totalLessons} leçon
        {totalLessons > 1 ? "s" : ""}
      </p>

      <div className="mt-6">
        {!user ? (
          <Link
            href="/connexion"
            className="inline-block rounded-full bg-slate-900 px-6 py-3 text-sm font-medium text-white hover:bg-slate-700"
          >
            Se connecter pour s&apos;inscrire
          </Link>
        ) : alreadyEnrolled ? (
          <Link
            href="/mon-apprentissage"
            className="inline-block rounded-full bg-teal-700 px-6 py-3 text-sm font-medium text-white hover:bg-teal-600"
          >
            Continuer la formation
          </Link>
        ) : (
          <form action={enroll}>
            <button
              type="submit"
              className="rounded-full bg-slate-900 px-6 py-3 text-sm font-medium text-white hover:bg-slate-700"
            >
              S&apos;inscrire gratuitement
            </button>
          </form>
        )}
      </div>

      <div className="prose prose-slate mt-10 max-w-none whitespace-pre-line">
        {formation.description}
      </div>

      <h2 className="mt-12 text-xl font-semibold text-slate-900">Programme</h2>
      <ol className="mt-4 flex flex-col gap-4">
        {formation.modules.map((module, i) => (
          <li key={module.id} className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="font-medium text-slate-900">
              Module {i + 1} — {module.title}
            </p>
            <ul className="mt-2 flex flex-col gap-1 text-sm text-slate-600">
              {module.lessons.map((lesson) => (
                <li key={lesson.id} className="flex items-center gap-2">
                  <span className="inline-block w-14 shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-center text-xs font-medium text-slate-500">
                    {lesson.type === "TEXT" && "Texte"}
                    {lesson.type === "VIDEO" && "Vidéo"}
                    {lesson.type === "QUIZ" && "Quiz"}
                  </span>
                  {lesson.title}
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ol>
    </div>
  );
}
