import Link from "next/link";
import { notFound } from "next/navigation";
import { assertFormationAccess } from "@/lib/authz";
import { prisma } from "@/lib/prisma";
import {
  updateFormationMeta,
  toggleFormationStatus,
  deleteFormation,
  addModule,
  renameModule,
  deleteModule,
  moveModule,
  addLesson,
  deleteLesson,
  moveLesson,
} from "@/lib/admin-actions";

export default async function FormationBuilderPage({
  params,
}: PageProps<"/admin/formations/[id]">) {
  const { id } = await params;
  await assertFormationAccess(id);

  const formation = await prisma.formation.findUnique({
    where: { id },
    include: {
      modules: {
        orderBy: { position: "asc" },
        include: { lessons: { orderBy: { position: "asc" } } },
      },
    },
  });
  if (!formation) notFound();

  const updateMeta = updateFormationMeta.bind(null, id);
  const toggleStatus = toggleFormationStatus.bind(null, id);
  const remove = deleteFormation.bind(null, id);
  const createModule = addModule.bind(null, id);

  return (
    <div className="flex flex-col gap-10 pb-24">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            /catalogue/{formation.slug}
          </p>
          <h1 className="mt-1 text-2xl font-semibold text-slate-900">{formation.title}</h1>
        </div>
        <div className="flex items-center gap-2">
          <form action={toggleStatus}>
            <button
              type="submit"
              className={`rounded-full px-4 py-2 text-sm font-medium ${
                formation.status === "PUBLISHED"
                  ? "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  : "bg-teal-700 text-white hover:bg-teal-600"
              }`}
            >
              {formation.status === "PUBLISHED" ? "Dépublier" : "Publier"}
            </button>
          </form>
          <form action={remove}>
            <button
              type="submit"
              className="rounded-full border border-red-200 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
            >
              Supprimer
            </button>
          </form>
        </div>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-6">
        <h2 className="text-lg font-semibold text-slate-900">Informations</h2>
        <form action={updateMeta} className="mt-4 flex flex-col gap-4">
          <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
            Titre
            <input
              name="title"
              defaultValue={formation.title}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-teal-600"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
            Catégorie
            <input
              name="category"
              defaultValue={formation.category ?? ""}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-teal-600"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
            Résumé
            <textarea
              name="summary"
              defaultValue={formation.summary}
              rows={2}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-teal-600"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
            Description
            <textarea
              name="description"
              defaultValue={formation.description}
              rows={6}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-teal-600"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
            Image de couverture (URL)
            <input
              name="coverImage"
              defaultValue={formation.coverImage ?? ""}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-teal-600"
            />
          </label>
          <button
            type="submit"
            className="self-start rounded-full bg-slate-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-slate-700"
          >
            Enregistrer
          </button>
        </form>
      </section>

      <section>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">Structure de la formation</h2>
        </div>

        <div className="mt-4 flex flex-col gap-4">
          {formation.modules.map((module, mi) => {
            const rename = renameModule.bind(null, id, module.id);
            const removeModule = deleteModule.bind(null, id, module.id);
            const up = moveModule.bind(null, id, module.id, "up");
            const down = moveModule.bind(null, id, module.id, "down");
            const createLesson = addLesson.bind(null, id, module.id);

            return (
              <div key={module.id} className="rounded-2xl border border-slate-200 bg-white p-5">
                <div className="flex items-center gap-2">
                  <div className="flex flex-col">
                    <form action={up}>
                      <button
                        type="submit"
                        disabled={mi === 0}
                        className="block text-xs text-slate-400 hover:text-slate-900 disabled:opacity-30"
                      >
                        ▲
                      </button>
                    </form>
                    <form action={down}>
                      <button
                        type="submit"
                        disabled={mi === formation.modules.length - 1}
                        className="block text-xs text-slate-400 hover:text-slate-900 disabled:opacity-30"
                      >
                        ▼
                      </button>
                    </form>
                  </div>
                  <form action={rename} className="flex flex-1 items-center gap-2">
                    <input
                      name="title"
                      defaultValue={module.title}
                      className="flex-1 rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium outline-none focus:border-teal-600"
                    />
                    <button
                      type="submit"
                      className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
                    >
                      Renommer
                    </button>
                  </form>
                  <form action={removeModule}>
                    <button
                      type="submit"
                      className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50"
                    >
                      Supprimer
                    </button>
                  </form>
                </div>

                <ul className="mt-4 flex flex-col gap-1">
                  {module.lessons.map((lesson, li) => {
                    const removeLesson = deleteLesson.bind(null, id, lesson.id);
                    const upLesson = moveLesson.bind(null, id, module.id, lesson.id, "up");
                    const downLesson = moveLesson.bind(
                      null,
                      id,
                      module.id,
                      lesson.id,
                      "down"
                    );
                    return (
                      <li
                        key={lesson.id}
                        className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-slate-50"
                      >
                        <div className="flex flex-col">
                          <form action={upLesson}>
                            <button
                              type="submit"
                              disabled={li === 0}
                              className="block text-[10px] text-slate-400 hover:text-slate-900 disabled:opacity-30"
                            >
                              ▲
                            </button>
                          </form>
                          <form action={downLesson}>
                            <button
                              type="submit"
                              disabled={li === module.lessons.length - 1}
                              className="block text-[10px] text-slate-400 hover:text-slate-900 disabled:opacity-30"
                            >
                              ▼
                            </button>
                          </form>
                        </div>
                        <span className="w-14 shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-center text-xs font-medium text-slate-500">
                          {lesson.type === "TEXT" && "Texte"}
                          {lesson.type === "VIDEO" && "Vidéo"}
                          {lesson.type === "QUIZ" && "Quiz"}
                        </span>
                        <Link
                          href={`/admin/formations/${id}/lecons/${lesson.id}`}
                          className="flex-1 text-sm font-medium text-slate-800 hover:underline"
                        >
                          {lesson.title}
                        </Link>
                        <form action={removeLesson}>
                          <button
                            type="submit"
                            className="text-xs text-red-500 hover:underline"
                          >
                            Supprimer
                          </button>
                        </form>
                      </li>
                    );
                  })}
                </ul>

                <form action={createLesson} className="mt-3 flex items-center gap-2">
                  <input
                    name="title"
                    placeholder="Titre de la leçon"
                    required
                    className="flex-1 rounded-lg border border-slate-300 px-3 py-1.5 text-sm outline-none focus:border-teal-600"
                  />
                  <select
                    name="type"
                    className="rounded-lg border border-slate-300 px-2 py-1.5 text-sm outline-none focus:border-teal-600"
                  >
                    <option value="TEXT">Texte</option>
                    <option value="VIDEO">Vidéo</option>
                    <option value="QUIZ">Quiz</option>
                  </select>
                  <button
                    type="submit"
                    className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-700"
                  >
                    + Leçon
                  </button>
                </form>
              </div>
            );
          })}

          <form
            action={createModule}
            className="flex items-center gap-2 rounded-2xl border border-dashed border-slate-300 p-5"
          >
            <input
              name="title"
              placeholder="Nom du nouveau module"
              required
              className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-teal-600"
            />
            <button
              type="submit"
              className="rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
            >
              + Module
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}
