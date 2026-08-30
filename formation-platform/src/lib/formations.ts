import { prisma } from "@/lib/prisma";

export function getPublishedFormations() {
  return prisma.formation.findMany({
    where: { status: "PUBLISHED" },
    orderBy: { createdAt: "desc" },
    include: { creator: { select: { name: true } } },
  });
}

export function getFormationBySlugPublished(slug: string) {
  return prisma.formation.findFirst({
    where: { slug, status: "PUBLISHED" },
    include: {
      creator: { select: { name: true } },
      modules: {
        orderBy: { position: "asc" },
        include: { lessons: { orderBy: { position: "asc" } } },
      },
    },
  });
}

export async function countFormationLessons(formationId: string) {
  return prisma.lesson.count({
    where: { module: { formationId } },
  });
}

export function getUserEnrollments(userId: string) {
  return prisma.enrollment.findMany({
    where: { userId },
    orderBy: { enrolledAt: "desc" },
    include: {
      formation: {
        include: {
          modules: { include: { lessons: true } },
        },
      },
    },
  });
}

export async function getEnrolledFormation(userId: string, slug: string) {
  const enrollment = await prisma.enrollment.findFirst({
    where: { userId, formation: { slug } },
    include: {
      formation: {
        include: {
          modules: {
            orderBy: { position: "asc" },
            include: { lessons: { orderBy: { position: "asc" } } },
          },
        },
      },
    },
  });
  return enrollment?.formation ?? null;
}

export async function getCompletedLessonIds(userId: string, formationId: string) {
  const rows = await prisma.lessonProgress.findMany({
    where: { userId, completed: true, lesson: { module: { formationId } } },
    select: { lessonId: true },
  });
  return new Set(rows.map((r) => r.lessonId));
}

export async function getLessonForLearner(userId: string, slug: string, lessonId: string) {
  const enrollment = await prisma.enrollment.findFirst({
    where: { userId, formation: { slug } },
    select: { formationId: true },
  });
  if (!enrollment) return null;

  const lesson = await prisma.lesson.findFirst({
    where: { id: lessonId, module: { formationId: enrollment.formationId } },
    include: {
      quiz: { include: { questions: { orderBy: { position: "asc" }, include: { choices: { orderBy: { position: "asc" } } } } } },
    },
  });
  return lesson;
}

export async function getLatestQuizAttempt(userId: string, quizId: string) {
  return prisma.quizAttempt.findFirst({
    where: { userId, quizId },
    orderBy: { createdAt: "desc" },
  });
}

export async function getFormationProgress(userId: string, formationId: string) {
  const totalLessons = await countFormationLessons(formationId);
  if (totalLessons === 0) return 0;

  const completed = await prisma.lessonProgress.count({
    where: {
      userId,
      completed: true,
      lesson: { module: { formationId } },
    },
  });

  return Math.round((completed / totalLessons) * 100);
}
