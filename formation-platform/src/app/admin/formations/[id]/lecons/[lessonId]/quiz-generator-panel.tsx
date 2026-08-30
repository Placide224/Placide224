"use client";

import { useActionState, useState, useTransition } from "react";
import { generateQuizDraft, type QuizDraft } from "@/lib/quiz-generator";
import { saveGeneratedQuestions } from "@/lib/quiz-actions";

export default function QuizGeneratorPanel({
  formationId,
  quizId,
}: {
  formationId: string;
  quizId: string;
}) {
  const [state, formAction, pending] = useActionState(generateQuizDraft, {});
  const [draft, setDraft] = useState<QuizDraft | null>(null);
  const [saving, startSaving] = useTransition();
  const [saved, setSaved] = useState(false);

  // Re-seed the editable copy whenever a fresh draft comes back from the action
  // (React-sanctioned pattern for adjusting state from props during render).
  const [seededDraft, setSeededDraft] = useState<QuizDraft | undefined>(undefined);
  if (state.draft && state.draft !== seededDraft) {
    setSeededDraft(state.draft);
    setDraft(state.draft);
    setSaved(false);
  }

  const activeDraft = draft;

  function updateQuestion(qi: number, patch: Partial<QuizDraft["questions"][number]>) {
    if (!activeDraft) return;
    const next = structuredClone(activeDraft);
    next.questions[qi] = { ...next.questions[qi], ...patch };
    setDraft(next);
  }

  function updateChoice(qi: number, ci: number, label: string, isCorrect: boolean) {
    if (!activeDraft) return;
    const next = structuredClone(activeDraft);
    next.questions[qi].choices[ci] = { label, isCorrect };
    setDraft(next);
  }

  function removeQuestion(qi: number) {
    if (!activeDraft) return;
    const next = structuredClone(activeDraft);
    next.questions.splice(qi, 1);
    setDraft(next);
  }

  function save() {
    if (!activeDraft) return;
    startSaving(async () => {
      await saveGeneratedQuestions(formationId, quizId, activeDraft.questions);
      setSaved(true);
      setDraft(null);
    });
  }

  return (
    <div className="rounded-2xl border border-teal-200 bg-teal-50/50 p-5">
      <h3 className="text-sm font-semibold text-teal-900">
        Générer des questions avec Claude
      </h3>
      <p className="mt-1 text-xs text-teal-800">
        Collez le contenu de la leçon (ou tout texte source). Relisez et corrigez chaque
        question avant d&apos;enregistrer.
      </p>

      <form action={formAction} className="mt-3 flex flex-col gap-2">
        <textarea
          name="sourceText"
          rows={5}
          required
          placeholder="Collez ici le texte de la leçon..."
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-teal-600"
        />
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-2 text-xs text-slate-600">
            Nombre de questions
            <input
              type="number"
              name="count"
              min={1}
              max={10}
              defaultValue={5}
              className="w-16 rounded-lg border border-slate-300 px-2 py-1 text-sm outline-none focus:border-teal-600"
            />
          </label>
          <button
            type="submit"
            disabled={pending}
            className="rounded-full bg-teal-700 px-4 py-2 text-sm font-medium text-white hover:bg-teal-600 disabled:opacity-60"
          >
            {pending ? "Génération..." : "Générer"}
          </button>
        </div>
      </form>

      {state.error && <p className="mt-3 text-sm text-red-600">{state.error}</p>}
      {saved && (
        <p className="mt-3 text-sm text-teal-800">Questions ajoutées au quiz ci-dessus.</p>
      )}

      {activeDraft && (
        <div className="mt-5 flex flex-col gap-4">
          <p className="text-xs font-medium text-teal-900">
            Relecture et correction avant enregistrement :
          </p>
          {activeDraft.questions.map((q, qi) => (
            <div key={qi} className="rounded-xl border border-slate-200 bg-white p-4">
              <div className="flex items-start justify-between gap-2">
                <input
                  value={q.prompt}
                  onChange={(e) => updateQuestion(qi, { prompt: e.target.value })}
                  className="flex-1 rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium outline-none focus:border-teal-600"
                />
                <button
                  type="button"
                  onClick={() => removeQuestion(qi)}
                  className="text-xs text-red-500 hover:underline"
                >
                  Retirer
                </button>
              </div>
              <div className="mt-2 flex flex-col gap-1.5">
                {q.choices.map((c, ci) => (
                  <label key={ci} className="flex items-center gap-2 text-sm">
                    <input
                      type="radio"
                      name={`correct-${qi}`}
                      checked={c.isCorrect}
                      onChange={() => {
                        const next = structuredClone(activeDraft);
                        next.questions[qi].choices = next.questions[qi].choices.map(
                          (choice, i) => ({ ...choice, isCorrect: i === ci })
                        );
                        setDraft(next);
                      }}
                    />
                    <input
                      value={c.label}
                      onChange={(e) => updateChoice(qi, ci, e.target.value, c.isCorrect)}
                      className="flex-1 rounded-lg border border-slate-300 px-2 py-1 text-sm outline-none focus:border-teal-600"
                    />
                  </label>
                ))}
              </div>
              <textarea
                value={q.explanation ?? ""}
                onChange={(e) => updateQuestion(qi, { explanation: e.target.value })}
                placeholder="Explication (optionnelle)"
                rows={2}
                className="mt-2 w-full rounded-lg border border-slate-200 px-2 py-1 text-xs text-slate-600 outline-none focus:border-teal-600"
              />
            </div>
          ))}
          <button
            type="button"
            onClick={save}
            disabled={saving}
            className="self-start rounded-full bg-slate-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-60"
          >
            {saving ? "Enregistrement..." : "Enregistrer ces questions dans le quiz"}
          </button>
        </div>
      )}
    </div>
  );
}
