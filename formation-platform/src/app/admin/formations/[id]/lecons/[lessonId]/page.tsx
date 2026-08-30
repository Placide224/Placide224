import Link from "next/link";
import { notFound } from "next/navigation";
import { assertFormationAccess } from "@/lib/authz";
import { prisma } from "@/lib/prisma";
import { updateLessonContent } from "@/lib/admin-actions";
import {
  updatePassingScore,
  addQuestion,
  deleteQuestion,
  updateQuestion,
  addChoice,
  updateChoiceLabel,
  deleteChoice,
  setCorrectChoice,
} from "@/lib/quiz-actions";
import QuizGeneratorPanel from "./quiz-generator-panel";

export default async function LessonEditorPage({
  params,
}: PageProps<"/admin/formations/[id]/lecons/[lessonId]">) {
  const { id, lessonId } = await params;
  await assertFormationAccess(id);

  const lesson = await prisma.lesson.findFirst({
    where: { id: lessonId, module: { formationId: id } },
    include: {
      quiz: {
        include: {
          questions: {
            orderBy: { position: "asc" },
            include: { choices: { orderBy: { position: "asc" } } },
          },
        },
      },
    },
  });
  if (!lesson) notFound();

  const saveContent = updateLessonContent.bind(null, id, lessonId);

  return (
    <div className="flex flex-col gap-8 pb-24">
      <div>
        <Link href={`/admin/formations/${id}`} className="text-sm text-teal-700 hover:underline">
          ← Retour à la formation
        </Link>
        <h1 className="mt-2 text-2xl font-semibold text-slate-900">{lesson.title}</h1>
        <p className="text-sm text-slate-500">
          Type :{" "}
          {lesson.type === "TEXT" ? "Texte" : lesson.type === "VIDEO" ? "Vidéo" : "Quiz"}
        </p>
      </div>

      {(lesson.type === "TEXT" || lesson.type === "VIDEO") && (
        <section className="rounded-2xl border border-slate-200 bg-white p-6">
          <form action={saveContent} className="flex flex-col gap-4">
            <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
              Titre
              <input
                name="title"
                defaultValue={lesson.title}
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-teal-600"
              />
            </label>
            {lesson.type === "TEXT" && (
              <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
                Contenu
                <textarea
                  name="textContent"
                  defaultValue={lesson.textContent ?? ""}
                  rows={12}
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-teal-600"
                />
              </label>
            )}
            {lesson.type === "VIDEO" && (
              <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
                URL de la vidéo (mp4 direct, embed YouTube/Vimeo...)
                <input
                  name="videoUrl"
                  defaultValue={lesson.videoUrl ?? ""}
                  placeholder="https://www.youtube.com/embed/..."
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-teal-600"
                />
              </label>
            )}
            <button
              type="submit"
              className="self-start rounded-full bg-slate-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-slate-700"
            >
              Enregistrer
            </button>
          </form>
        </section>
      )}

      {lesson.type === "QUIZ" && lesson.quiz && (
        <>
          <section className="rounded-2xl border border-slate-200 bg-white p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">Questions</h2>
              <form
                action={updatePassingScore.bind(null, id, lesson.quiz.id)}
                className="flex items-center gap-2 text-sm text-slate-600"
              >
                Seuil de réussite
                <input
                  type="number"
                  name="passingScore"
                  min={0}
                  max={100}
                  defaultValue={lesson.quiz.passingScore}
                  className="w-16 rounded-lg border border-slate-300 px-2 py-1 text-sm outline-none focus:border-teal-600"
                />
                %
                <button
                  type="submit"
                  className="rounded-lg border border-slate-200 px-3 py-1 text-xs font-medium hover:bg-slate-50"
                >
                  OK
                </button>
              </form>
            </div>

            <div className="mt-4 flex flex-col gap-4">
              {lesson.quiz.questions.map((question, qi) => (
                <div key={question.id} className="rounded-xl border border-slate-200 p-4">
                  <div className="flex items-start justify-between gap-2">
                    <form
                      action={updateQuestion.bind(null, id, question.id)}
                      className="flex flex-1 flex-col gap-2"
                    >
                      <input
                        name="prompt"
                        defaultValue={question.prompt}
                        className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium outline-none focus:border-teal-600"
                      />
                      <input
                        name="explanation"
                        defaultValue={question.explanation ?? ""}
                        placeholder="Explication (optionnelle)"
                        className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-600 outline-none focus:border-teal-600"
                      />
                      <button
                        type="submit"
                        className="self-start rounded-lg border border-slate-200 px-3 py-1 text-xs font-medium hover:bg-slate-50"
                      >
                        Enregistrer la question {qi + 1}
                      </button>
                    </form>
                    <form action={deleteQuestion.bind(null, id, question.id)}>
                      <button type="submit" className="text-xs text-red-500 hover:underline">
                        Supprimer
                      </button>
                    </form>
                  </div>

                  <div className="mt-3 flex flex-col gap-2">
                    {question.choices.map((choice) => (
                      <div key={choice.id} className="flex items-center gap-2">
                        <form action={setCorrectChoice.bind(null, id, question.id, choice.id)}>
                          <button
                            type="submit"
                            title="Marquer comme bonne réponse"
                            className={`flex h-5 w-5 items-center justify-center rounded-full border text-[10px] ${
                              choice.isCorrect
                                ? "border-teal-600 bg-teal-600 text-white"
                                : "border-slate-300 text-transparent hover:border-teal-400"
                            }`}
                          >
                            ✓
                          </button>
                        </form>
                        <form
                          action={updateChoiceLabel.bind(null, id, choice.id)}
                          className="flex flex-1 items-center gap-2"
                        >
                          <input
                            name="label"
                            defaultValue={choice.label}
                            className="flex-1 rounded-lg border border-slate-300 px-2 py-1 text-sm outline-none focus:border-teal-600"
                          />
                          <button
                            type="submit"
                            className="text-xs text-slate-500 hover:underline"
                          >
                            OK
                          </button>
                        </form>
                        <form action={deleteChoice.bind(null, id, choice.id)}>
                          <button type="submit" className="text-xs text-red-500 hover:underline">
                            ✕
                          </button>
                        </form>
                      </div>
                    ))}
                    <form action={addChoice.bind(null, id, question.id)}>
                      <button
                        type="submit"
                        className="text-xs font-medium text-teal-700 hover:underline"
                      >
                        + Ajouter une réponse
                      </button>
                    </form>
                  </div>
                </div>
              ))}
            </div>

            <form action={addQuestion.bind(null, id, lesson.quiz.id)} className="mt-4 flex gap-2">
              <input
                name="prompt"
                placeholder="Nouvelle question..."
                required
                className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-teal-600"
              />
              <button
                type="submit"
                className="rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
              >
                + Question
              </button>
            </form>
          </section>

          <QuizGeneratorPanel formationId={id} quizId={lesson.quiz.id} />
        </>
      )}
    </div>
  );
}
