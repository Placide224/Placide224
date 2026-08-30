import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const creatorPasswordHash = await bcrypt.hash("Formation2026!", 12);
  const learnerPasswordHash = await bcrypt.hash("Apprenant2026!", 12);

  const creator = await prisma.user.upsert({
    where: { email: "createur@formation.local" },
    update: {},
    create: {
      name: "Camille Créateur",
      email: "createur@formation.local",
      passwordHash: creatorPasswordHash,
      role: "ADMIN",
    },
  });

  const learner = await prisma.user.upsert({
    where: { email: "apprenant@formation.local" },
    update: {},
    create: {
      name: "Alex Apprenant",
      email: "apprenant@formation.local",
      passwordHash: learnerPasswordHash,
      role: "LEARNER",
    },
  });

  const existing = await prisma.formation.findUnique({
    where: { slug: "decouverte-de-la-protection-sociale" },
  });
  if (existing) {
    console.log("Seed déjà appliquée, rien à faire.");
    return;
  }

  const formation = await prisma.formation.create({
    data: {
      slug: "decouverte-de-la-protection-sociale",
      title: "Découverte de la protection sociale",
      summary: "Les fondamentaux du système de protection sociale français.",
      description:
        "Cette formation d'introduction présente les grands principes de la protection sociale en France : régime obligatoire, complémentaires santé, et acteurs du secteur.",
      category: "Protection sociale",
      status: "PUBLISHED",
      creatorId: creator.id,
      modules: {
        create: [
          {
            title: "Les bases",
            position: 0,
            lessons: {
              create: [
                {
                  title: "Introduction au système français",
                  type: "TEXT",
                  position: 0,
                  textContent:
                    "La protection sociale française repose sur trois piliers : la sécurité sociale (régime obligatoire), les complémentaires santé, et la prévoyance. Elle est financée par les cotisations sociales et la CSG. Son objectif est de couvrir les risques maladie, vieillesse, famille et accidents du travail.",
                },
                {
                  title: "Présentation en vidéo",
                  type: "VIDEO",
                  position: 1,
                  videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
                },
                {
                  title: "Quiz de validation",
                  type: "QUIZ",
                  position: 2,
                  quiz: {
                    create: {
                      passingScore: 70,
                      questions: {
                        create: [
                          {
                            position: 0,
                            prompt: "Combien de piliers structurent la protection sociale française ?",
                            explanation: "Sécurité sociale, complémentaires santé et prévoyance.",
                            choices: {
                              create: [
                                { label: "Deux", position: 0, isCorrect: false },
                                { label: "Trois", position: 1, isCorrect: true },
                                { label: "Cinq", position: 2, isCorrect: false },
                              ],
                            },
                          },
                          {
                            position: 1,
                            prompt: "Quel prélèvement finance en partie la protection sociale ?",
                            explanation: "La CSG (contribution sociale généralisée) en est une source majeure.",
                            choices: {
                              create: [
                                { label: "La TVA", position: 0, isCorrect: false },
                                { label: "La CSG", position: 1, isCorrect: true },
                                { label: "L'impôt sur les sociétés", position: 2, isCorrect: false },
                              ],
                            },
                          },
                        ],
                      },
                    },
                  },
                },
              ],
            },
          },
        ],
      },
    },
  });

  await prisma.enrollment.create({
    data: { userId: learner.id, formationId: formation.id },
  });

  console.log("Seed appliquée :");
  console.log(`  Créateur/Admin: createur@formation.local / Formation2026!`);
  console.log(`  Apprenant:      apprenant@formation.local / Apprenant2026!`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
