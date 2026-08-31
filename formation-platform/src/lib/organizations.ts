import { prisma } from "@/lib/prisma";
import type { MembershipRole } from "@prisma/client";

export function getMyOrganizations(userId: string) {
  return prisma.membership.findMany({
    where: { userId },
    orderBy: { createdAt: "asc" },
    include: {
      organization: { include: { _count: { select: { memberships: true, formations: true } } } },
    },
  });
}

export function getOrganizationWithMembers(organizationId: string) {
  return prisma.organization.findUnique({
    where: { id: organizationId },
    include: {
      memberships: {
        orderBy: { createdAt: "asc" },
        include: { user: { select: { id: true, name: true, email: true } } },
      },
    },
  });
}

export async function getMembershipRole(
  userId: string,
  organizationId: string
): Promise<MembershipRole | null> {
  const membership = await prisma.membership.findUnique({
    where: { userId_organizationId: { userId, organizationId } },
    select: { role: true },
  });
  return membership?.role ?? null;
}

const CAN_MANAGE_FORMATIONS: MembershipRole[] = ["OWNER", "ADMIN", "CREATOR"];
const CAN_MANAGE_MEMBERS: MembershipRole[] = ["OWNER", "ADMIN"];

export function canManageOrgFormations(role: MembershipRole | null) {
  return role !== null && CAN_MANAGE_FORMATIONS.includes(role);
}

export function canManageOrgMembers(role: MembershipRole | null) {
  return role !== null && CAN_MANAGE_MEMBERS.includes(role);
}

export async function getFormationScopeWhere(user: { id: string; role: string }) {
  if (user.role === "ADMIN") return {};

  const memberships = await prisma.membership.findMany({
    where: { userId: user.id, role: { in: CAN_MANAGE_FORMATIONS } },
    select: { organizationId: true },
  });
  const orgIds = memberships.map((m) => m.organizationId);

  return {
    OR: [{ creatorId: user.id }, ...(orgIds.length > 0 ? [{ organizationId: { in: orgIds } }] : [])],
  };
}
