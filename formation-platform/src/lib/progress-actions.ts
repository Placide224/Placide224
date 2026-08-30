"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/authz";

async function assertEnrolled(userId: string, lessonId: string) {
  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    select: { module: { select: { formationId: true, formation: { select: { slug: true } } } } },
  });
  if (!lesson) return null;

  const enrolled = await prisma.enrollment.findUnique({
    where: {
      userId_formationId: { userId, formationId: lesson.module.formationId },
    },
  });
  if (!enrolled) return null;

  return lesson.module.formation.slug;
}

export async function markLessonComplete(lessonId: string) {
  const user = await requireUser();
  const slug = await assertEnrolled(user.id, lessonId);
  if (!slug) return;

  await prisma.lessonProgress.upsert({
    where: { userId_lessonId: { userId: user.id, lessonId } },
    update: { completed: true, completedAt: new Date() },
    create: { userId: user.id, lessonId, completed: true, completedAt: new Date() },
  });

  revalidatePath(`/mon-apprentissage/${slug}`);
  revalidatePath(`/mon-apprentissage/${slug}/lecon/${lessonId}`);
}

export async function submitQuizAttempt(
  quizId: string,
  lessonId: string,
  formData: FormData
) {
  const user = await requireUser();
  const slug = await assertEnrolled(user.id, lessonId);
  if (!slug) return;

  const quiz = await prisma.quiz.findUnique({
    where: { id: quizId },
    include: { questions: { include: { choices: true } } },
  });
  if (!quiz) return;

  let correctCount = 0;
  const answers: Record<string, string> = {};

  for (const question of quiz.questions) {
    const selectedChoiceId = String(formData.get(`question-${question.id}`) ?? "");
    answers[question.id] = selectedChoiceId;
    const choice = question.choices.find((c) => c.id === selectedChoiceId);
    if (choice?.isCorrect) correctCount += 1;
  }

  const score =
    quiz.questions.length === 0
      ? 0
      : Math.round((correctCount / quiz.questions.length) * 100);
  const passed = score >= quiz.passingScore;

  await prisma.quizAttempt.create({
    data: { userId: user.id, quizId, score, passed, answers },
  });

  if (passed) {
    await prisma.lessonProgress.upsert({
      where: { userId_lessonId: { userId: user.id, lessonId } },
      update: { completed: true, completedAt: new Date() },
      create: { userId: user.id, lessonId, completed: true, completedAt: new Date() },
    });
  }

  revalidatePath(`/mon-apprentissage/${slug}`);
  revalidatePath(`/mon-apprentissage/${slug}/lecon/${lessonId}`);
}
