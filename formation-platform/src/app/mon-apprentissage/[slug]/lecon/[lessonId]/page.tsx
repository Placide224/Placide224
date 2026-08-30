import { notFound } from "next/navigation";
import Link from "next/link";
import { requireUser } from "@/lib/authz";
import { getLessonForLearner, getLatestQuizAttempt } from "@/lib/formations";
import { markLessonComplete, submitQuizAttempt } from "@/lib/progress-actions";

function VideoEmbed({ url }: { url: string }) {
  const isEmbeddable = /youtube\.com\/embed|player\.vimeo\.com/.test(url);
  if (isEmbeddable) {
    return (
      <div className="aspect-video w-full overflow-hidden rounded-xl bg-black">
        <iframe src={url} className="h-full w-full" allowFullScreen title="Vidéo de la leçon" />
      </div>
    );
  }
  return <video controls className="w-full rounded-xl bg-black" src={url} />;
}

export default async function LessonPage({
  params,
}: PageProps<"/mon-apprentissage/[slug]/lecon/[lessonId]">) {
  const { slug, lessonId } = await params;
  const user = await requireUser();
  const lesson = await getLessonForLearner(user.id, slug, lessonId);
  if (!lesson) notFound();

  const markComplete = markLessonComplete.bind(null, lessonId);

  const latestAttempt =
    lesson.type === "QUIZ" && lesson.quiz
      ? await getLatestQuizAttempt(user.id, lesson.quiz.id)
      : null;

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-16">
      <Link href={`/mon-apprentissage/${slug}`} className="text-sm text-teal-700 hover:underline">
        ← Retour à la formation
      </Link>
      <h1 className="mt-3 text-2xl font-semibold text-slate-900">{lesson.title}</h1>

      {lesson.type === "TEXT" && (
        <div className="prose prose-slate mt-8 max-w-none whitespace-pre-line">
          {lesson.textContent}
        </div>
      )}

      {lesson.type === "VIDEO" && lesson.videoUrl && (
        <div className="mt-8">
          <VideoEmbed url={lesson.videoUrl} />
        </div>
      )}

      {(lesson.type === "TEXT" || lesson.type === "VIDEO") && (
        <form action={markComplete} className="mt-8">
          <button
            type="submit"
            className="rounded-full bg-teal-700 px-5 py-2.5 text-sm font-medium text-white hover:bg-teal-600"
          >
            Marquer comme terminée
          </button>
        </form>
      )}

      {lesson.type === "QUIZ" && lesson.quiz && (
        <div className="mt-8">
          {latestAttempt && (
            <div
              className={`mb-6 rounded-xl border p-4 text-sm ${
                latestAttempt.passed
                  ? "border-teal-200 bg-teal-50 text-teal-800"
                  : "border-amber-200 bg-amber-50 text-amber-800"
              }`}
            >
              Dernier essai : {latestAttempt.score}% —{" "}
              {latestAttempt.passed ? "réussi" : "à retenter"} (seuil{" "}
              {lesson.quiz.passingScore}%)
            </div>
          )}

          <form
            action={submitQuizAttempt.bind(null, lesson.quiz.id, lessonId)}
            className="flex flex-col gap-6"
          >
            {lesson.quiz.questions.map((question, qi) => (
              <fieldset key={question.id} className="rounded-xl border border-slate-200 bg-white p-4">
                <legend className="px-1 text-sm font-medium text-slate-900">
                  {qi + 1}. {question.prompt}
                </legend>
                <div className="mt-3 flex flex-col gap-2">
                  {question.choices.map((choice) => (
                    <label
                      key={choice.id}
                      className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                    >
                      <input
                        type="radio"
                        name={`question-${question.id}`}
                        value={choice.id}
                        required
                        className="accent-teal-600"
                      />
                      {choice.label}
                    </label>
                  ))}
                </div>
              </fieldset>
            ))}
            <button
              type="submit"
              className="self-start rounded-full bg-slate-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-slate-700"
            >
              Valider le quiz
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
