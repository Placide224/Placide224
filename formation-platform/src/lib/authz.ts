import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function getSessionUser() {
  const session = await auth();
  return session?.user ?? null;
}

export async function requireUser() {
  const user = await getSessionUser();
  if (!user) redirect("/connexion");
  return user;
}

export async function requireCreator() {
  const user = await getSessionUser();
  if (!user || (user.role !== "ADMIN" && user.role !== "CREATOR")) {
    redirect("/connexion");
  }
  return user;
}

export async function assertFormationAccess(formationId: string) {
  const user = await requireCreator();
  const formation = await prisma.formation.findUnique({
    where: { id: formationId },
    select: { id: true, creatorId: true, slug: true },
  });
  if (!formation) throw new Error("Formation introuvable");
  if (user.role !== "ADMIN" && formation.creatorId !== user.id) {
    throw new Error("Vous n'avez pas accès à cette formation");
  }
  return { user, formation };
}
