import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/authz";
import { getEnrolledFormation, getCompletedLessonIds } from "@/lib/formations";

export default async function FormationPlayerPage({
  params,
}: PageProps<"/mon-apprentissage/[slug]">) {
  const { slug } = await params;
  const user = await requireUser();
  const formation = await getEnrolledFormation(user.id, slug);
  if (!formation) notFound();

  const completed = await getCompletedLessonIds(user.id, formation.id);

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-16">
      <h1 className="text-3xl font-semibold text-slate-900">{formation.title}</h1>
      <p className="mt-2 text-slate-600">{formation.summary}</p>

      <div className="mt-8 flex flex-col gap-6">
        {formation.modules.map((module, i) => (
          <div key={module.id} className="rounded-2xl border border-slate-200 bg-white p-5">
            <p className="font-medium text-slate-900">
              Module {i + 1} — {module.title}
            </p>
            <ul className="mt-3 flex flex-col gap-1">
              {module.lessons.map((lesson) => {
                const done = completed.has(lesson.id);
                return (
                  <li key={lesson.id}>
                    <Link
                      href={`/mon-apprentissage/${slug}/lecon/${lesson.id}`}
                      className="flex items-center gap-3 rounded-lg px-2 py-2 text-sm hover:bg-slate-50"
                    >
                      <span
                        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
                          done ? "bg-teal-600 text-white" : "bg-slate-100 text-slate-400"
                        }`}
                      >
                        {done ? "✓" : ""}
                      </span>
                      <span className="w-14 shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-center text-xs font-medium text-slate-500">
                        {lesson.type === "TEXT" && "Texte"}
                        {lesson.type === "VIDEO" && "Vidéo"}
                        {lesson.type === "QUIZ" && "Quiz"}
                      </span>
                      <span className="text-slate-800">{lesson.title}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
