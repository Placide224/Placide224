"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/authz";
import type { Role, OrganizationStatus, OrganizationType } from "@prisma/client";

export async function changeUserPlatformRole(userId: string, formData: FormData) {
  const admin = await requireSuperAdmin();
  const role = String(formData.get("role") ?? "LEARNER") as Role;

  if (userId === admin.id && role !== "ADMIN") {
    throw new Error("Vous ne pouvez pas retirer votre propre rôle super-administrateur");
  }

  await prisma.user.update({ where: { id: userId }, data: { role } });
  revalidatePath("/console/utilisateurs");
}

export async function changeOrganizationStatus(
  organizationId: string,
  status: OrganizationStatus
) {
  await requireSuperAdmin();
  await prisma.organization.update({ where: { id: organizationId }, data: { status } });
  revalidatePath("/console/organisations");
  revalidatePath(`/console/organisations/${organizationId}`);
}

export async function changeOrganizationType(organizationId: string, formData: FormData) {
  await requireSuperAdmin();
  const type = String(formData.get("type") ?? "INDEPENDENT") as OrganizationType;
  await prisma.organization.update({ where: { id: organizationId }, data: { type } });
  revalidatePath(`/console/organisations/${organizationId}`);
}
