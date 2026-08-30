"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { assertFormationAccess } from "@/lib/authz";

export async function updatePassingScore(
  formationId: string,
  quizId: string,
  formData: FormData
) {
  await assertFormationAccess(formationId);
  const passingScore = Math.min(100, Math.max(0, Number(formData.get("passingScore") ?? 70)));
  await prisma.quiz.update({ where: { id: quizId }, data: { passingScore } });
  revalidatePath(`/admin/formations/${formationId}`, "layout");
}

export async function addQuestion(formationId: string, quizId: string, formData: FormData) {
  await assertFormationAccess(formationId);
  const prompt = String(formData.get("prompt") ?? "").trim();
  if (!prompt) return;

  const last = await prisma.question.findFirst({
    where: { quizId },
    orderBy: { position: "desc" },
  });

  const question = await prisma.question.create({
    data: { quizId, prompt, position: (last?.position ?? -1) + 1 },
  });

  await prisma.choice.createMany({
    data: [
      { questionId: question.id, label: "Réponse A", position: 0, isCorrect: true },
      { questionId: question.id, label: "Réponse B", position: 1, isCorrect: false },
    ],
  });

  revalidatePath(`/admin/formations/${formationId}`, "layout");
}

export async function deleteQuestion(formationId: string, questionId: string) {
  await assertFormationAccess(formationId);
  await prisma.question.delete({ where: { id: questionId } });
  revalidatePath(`/admin/formations/${formationId}`, "layout");
}

export async function updateQuestion(
  formationId: string,
  questionId: string,
  formData: FormData
) {
  await assertFormationAccess(formationId);
  await prisma.question.update({
    where: { id: questionId },
    data: {
      prompt: String(formData.get("prompt") ?? ""),
      explanation: String(formData.get("explanation") ?? "") || null,
    },
  });
  revalidatePath(`/admin/formations/${formationId}`, "layout");
}

export async function addChoice(formationId: string, questionId: string) {
  await assertFormationAccess(formationId);
  const last = await prisma.choice.findFirst({
    where: { questionId },
    orderBy: { position: "desc" },
  });
  await prisma.choice.create({
    data: {
      questionId,
      label: "Nouvelle réponse",
      position: (last?.position ?? -1) + 1,
    },
  });
  revalidatePath(`/admin/formations/${formationId}`, "layout");
}

export async function updateChoiceLabel(
  formationId: string,
  choiceId: string,
  formData: FormData
) {
  await assertFormationAccess(formationId);
  await prisma.choice.update({
    where: { id: choiceId },
    data: { label: String(formData.get("label") ?? "") },
  });
  revalidatePath(`/admin/formations/${formationId}`, "layout");
}

export async function deleteChoice(formationId: string, choiceId: string) {
  await assertFormationAccess(formationId);
  await prisma.choice.delete({ where: { id: choiceId } });
  revalidatePath(`/admin/formations/${formationId}`, "layout");
}

export async function setCorrectChoice(
  formationId: string,
  questionId: string,
  choiceId: string
) {
  await assertFormationAccess(formationId);
  await prisma.$transaction([
    prisma.choice.updateMany({ where: { questionId }, data: { isCorrect: false } }),
    prisma.choice.update({ where: { id: choiceId }, data: { isCorrect: true } }),
  ]);
  revalidatePath(`/admin/formations/${formationId}`, "layout");
}

type GeneratedQuestion = {
  prompt: string;
  explanation?: string;
  choices: { label: string; isCorrect: boolean }[];
};

export async function saveGeneratedQuestions(
  formationId: string,
  quizId: string,
  questions: GeneratedQuestion[]
) {
  await assertFormationAccess(formationId);

  const last = await prisma.question.findFirst({
    where: { quizId },
    orderBy: { position: "desc" },
  });
  let position = (last?.position ?? -1) + 1;

  for (const q of questions) {
    if (!q.prompt?.trim() || q.choices.length < 2) continue;
    await prisma.question.create({
      data: {
        quizId,
        prompt: q.prompt.trim(),
        explanation: q.explanation?.trim() || null,
        position: position++,
        choices: {
          create: q.choices.map((c, i) => ({
            label: c.label,
            isCorrect: Boolean(c.isCorrect),
            position: i,
          })),
        },
      },
    });
  }

  revalidatePath(`/admin/formations/${formationId}`, "layout");
}
