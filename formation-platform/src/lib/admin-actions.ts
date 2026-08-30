"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireCreator, assertFormationAccess } from "@/lib/authz";
import { slugify } from "@/lib/slug";
import type { LessonType } from "@prisma/client";

export async function createFormation(formData: FormData) {
  const user = await requireCreator();
  const title = String(formData.get("title") ?? "").trim();
  if (!title) throw new Error("Titre requis");

  const baseSlug = slugify(title) || "formation";
  let slug = baseSlug;
  let n = 1;
  while (await prisma.formation.findUnique({ where: { slug } })) {
    n += 1;
    slug = `${baseSlug}-${n}`;
  }

  const formation = await prisma.formation.create({
    data: {
      title,
      slug,
      summary: String(formData.get("summary") ?? ""),
      description: String(formData.get("description") ?? ""),
      category: String(formData.get("category") ?? "") || null,
      creatorId: user.id,
    },
  });

  revalidatePath("/admin/formations");
  redirect(`/admin/formations/${formation.id}`);
}

export async function updateFormationMeta(formationId: string, formData: FormData) {
  const { formation } = await assertFormationAccess(formationId);

  await prisma.formation.update({
    where: { id: formationId },
    data: {
      title: String(formData.get("title") ?? ""),
      summary: String(formData.get("summary") ?? ""),
      description: String(formData.get("description") ?? ""),
      category: String(formData.get("category") ?? "") || null,
      coverImage: String(formData.get("coverImage") ?? "") || null,
    },
  });

  revalidatePath(`/admin/formations/${formationId}`);
  revalidatePath(`/catalogue/${formation.slug}`);
}

export async function toggleFormationStatus(formationId: string) {
  const { formation: access } = await assertFormationAccess(formationId);
  const formation = await prisma.formation.findUniqueOrThrow({
    where: { id: formationId },
    select: { status: true },
  });

  await prisma.formation.update({
    where: { id: formationId },
    data: { status: formation.status === "PUBLISHED" ? "DRAFT" : "PUBLISHED" },
  });

  revalidatePath(`/admin/formations/${formationId}`);
  revalidatePath("/catalogue");
  revalidatePath(`/catalogue/${access.slug}`);
}

export async function deleteFormation(formationId: string) {
  await assertFormationAccess(formationId);
  await prisma.formation.delete({ where: { id: formationId } });
  revalidatePath("/admin/formations");
  redirect("/admin/formations");
}

export async function addModule(formationId: string, formData: FormData) {
  await assertFormationAccess(formationId);
  const title = String(formData.get("title") ?? "").trim();
  if (!title) return;

  const last = await prisma.module.findFirst({
    where: { formationId },
    orderBy: { position: "desc" },
  });

  await prisma.module.create({
    data: { formationId, title, position: (last?.position ?? -1) + 1 },
  });

  revalidatePath(`/admin/formations/${formationId}`);
}

export async function renameModule(formationId: string, moduleId: string, formData: FormData) {
  await assertFormationAccess(formationId);
  const title = String(formData.get("title") ?? "").trim();
  if (!title) return;
  await prisma.module.update({ where: { id: moduleId }, data: { title } });
  revalidatePath(`/admin/formations/${formationId}`);
}

export async function deleteModule(formationId: string, moduleId: string) {
  await assertFormationAccess(formationId);
  await prisma.module.delete({ where: { id: moduleId } });
  revalidatePath(`/admin/formations/${formationId}`);
}

export async function moveModule(formationId: string, moduleId: string, direction: "up" | "down") {
  await assertFormationAccess(formationId);
  const modules = await prisma.module.findMany({
    where: { formationId },
    orderBy: { position: "asc" },
  });
  const index = modules.findIndex((m) => m.id === moduleId);
  const swapWith = direction === "up" ? index - 1 : index + 1;
  if (index === -1 || swapWith < 0 || swapWith >= modules.length) return;

  const a = modules[index];
  const b = modules[swapWith];
  await prisma.$transaction([
    prisma.module.update({ where: { id: a.id }, data: { position: b.position } }),
    prisma.module.update({ where: { id: b.id }, data: { position: a.position } }),
  ]);

  revalidatePath(`/admin/formations/${formationId}`);
}

export async function addLesson(formationId: string, moduleId: string, formData: FormData) {
  await assertFormationAccess(formationId);
  const title = String(formData.get("title") ?? "").trim();
  const type = String(formData.get("type") ?? "TEXT") as LessonType;
  if (!title) return;

  const last = await prisma.lesson.findFirst({
    where: { moduleId },
    orderBy: { position: "desc" },
  });

  const lesson = await prisma.lesson.create({
    data: { moduleId, title, type, position: (last?.position ?? -1) + 1 },
  });

  if (type === "QUIZ") {
    await prisma.quiz.create({ data: { lessonId: lesson.id } });
  }

  revalidatePath(`/admin/formations/${formationId}`);
}

export async function deleteLesson(formationId: string, lessonId: string) {
  await assertFormationAccess(formationId);
  await prisma.lesson.delete({ where: { id: lessonId } });
  revalidatePath(`/admin/formations/${formationId}`);
}

export async function moveLesson(
  formationId: string,
  moduleId: string,
  lessonId: string,
  direction: "up" | "down"
) {
  await assertFormationAccess(formationId);
  const lessons = await prisma.lesson.findMany({
    where: { moduleId },
    orderBy: { position: "asc" },
  });
  const index = lessons.findIndex((l) => l.id === lessonId);
  const swapWith = direction === "up" ? index - 1 : index + 1;
  if (index === -1 || swapWith < 0 || swapWith >= lessons.length) return;

  const a = lessons[index];
  const b = lessons[swapWith];
  await prisma.$transaction([
    prisma.lesson.update({ where: { id: a.id }, data: { position: b.position } }),
    prisma.lesson.update({ where: { id: b.id }, data: { position: a.position } }),
  ]);

  revalidatePath(`/admin/formations/${formationId}`);
}

export async function updateLessonContent(
  formationId: string,
  lessonId: string,
  formData: FormData
) {
  await assertFormationAccess(formationId);
  const title = String(formData.get("title") ?? "").trim();
  const textContent = String(formData.get("textContent") ?? "");
  const videoUrl = String(formData.get("videoUrl") ?? "");

  await prisma.lesson.update({
    where: { id: lessonId },
    data: {
      title: title || undefined,
      textContent: textContent || null,
      videoUrl: videoUrl || null,
    },
  });

  revalidatePath(`/admin/formations/${formationId}`);
  revalidatePath(`/admin/formations/${formationId}/lecons/${lessonId}`);
}
