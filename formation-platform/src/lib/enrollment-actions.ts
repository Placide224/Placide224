"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/authz";

export async function enrollAction(formationId: string, slug: string) {
  const user = await requireUser();

  const formation = await prisma.formation.findFirst({
    where: { id: formationId, status: "PUBLISHED" },
    select: { id: true },
  });
  if (!formation) return;

  await prisma.enrollment.upsert({
    where: { userId_formationId: { userId: user.id, formationId } },
    update: {},
    create: { userId: user.id, formationId },
  });

  revalidatePath(`/catalogue/${slug}`);
  redirect("/mon-apprentissage");
}
