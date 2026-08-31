"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireCreator } from "@/lib/authz";
import { canManageOrgMembers, getMembershipRole } from "@/lib/organizations";
import { slugify } from "@/lib/slug";
import type { OrganizationType, MembershipRole } from "@prisma/client";

async function assertOrgManageAccess(organizationId: string) {
  const user = await requireCreator();
  if (user.role === "ADMIN") return user;

  const role = await getMembershipRole(user.id, organizationId);
  if (!canManageOrgMembers(role)) {
    throw new Error("Vous n'avez pas accès à cette organisation");
  }
  return user;
}

export async function createOrganization(formData: FormData) {
  const user = await requireCreator();
  const name = String(formData.get("name") ?? "").trim();
  const type = String(formData.get("type") ?? "INDEPENDENT") as OrganizationType;
  if (!name) throw new Error("Nom requis");

  const baseSlug = slugify(name) || "organisation";
  let slug = baseSlug;
  let n = 1;
  while (await prisma.organization.findUnique({ where: { slug } })) {
    n += 1;
    slug = `${baseSlug}-${n}`;
  }

  const organization = await prisma.organization.create({
    data: {
      name,
      slug,
      type,
      memberships: { create: { userId: user.id, role: "OWNER" } },
    },
  });

  revalidatePath("/admin/organisations");
  redirect(`/admin/organisations/${organization.id}`);
}

export async function addMember(organizationId: string, formData: FormData) {
  await assertOrgManageAccess(organizationId);

  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const role = String(formData.get("role") ?? "MEMBER") as MembershipRole;
  if (!email) return;

  const targetUser = await prisma.user.findUnique({ where: { email } });
  if (!targetUser) {
    throw new Error("Aucun compte NT7East trouvé avec cet email");
  }

  await prisma.membership.upsert({
    where: { userId_organizationId: { userId: targetUser.id, organizationId } },
    update: { role },
    create: { userId: targetUser.id, organizationId, role },
  });

  revalidatePath(`/admin/organisations/${organizationId}`);
}

export async function changeMemberRole(
  organizationId: string,
  membershipId: string,
  formData: FormData
) {
  await assertOrgManageAccess(organizationId);
  const role = String(formData.get("role") ?? "MEMBER") as MembershipRole;

  await prisma.membership.update({
    where: { id: membershipId },
    data: { role },
  });

  revalidatePath(`/admin/organisations/${organizationId}`);
}

export async function removeMember(organizationId: string, membershipId: string) {
  const user = await assertOrgManageAccess(organizationId);

  const membership = await prisma.membership.findUnique({ where: { id: membershipId } });
  if (membership?.userId === user.id && membership.role === "OWNER") {
    const ownerCount = await prisma.membership.count({
      where: { organizationId, role: "OWNER" },
    });
    if (ownerCount <= 1) {
      throw new Error("Impossible de retirer le dernier propriétaire de l'organisation");
    }
  }

  await prisma.membership.delete({ where: { id: membershipId } });
  revalidatePath(`/admin/organisations/${organizationId}`);
}
