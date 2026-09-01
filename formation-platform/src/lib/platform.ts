import { prisma } from "@/lib/prisma";

export async function getPlatformStats() {
  const [organizations, users, formations, publishedFormations, enrollments, learners, creators] =
    await Promise.all([
      prisma.organization.count(),
      prisma.user.count(),
      prisma.formation.count(),
      prisma.formation.count({ where: { status: "PUBLISHED" } }),
      prisma.enrollment.count(),
      prisma.user.count({ where: { role: "LEARNER" } }),
      prisma.user.count({ where: { role: { in: ["CREATOR", "ADMIN"] } } }),
    ]);

  return {
    organizations,
    users,
    formations,
    publishedFormations,
    enrollments,
    learners,
    creators,
  };
}

export function getRecentOrganizations(limit = 5) {
  return prisma.organization.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
    include: { _count: { select: { memberships: true, formations: true } } },
  });
}

export function getAllOrganizations() {
  return prisma.organization.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { memberships: true, formations: true } } },
  });
}

export function getOrganizationForConsole(organizationId: string) {
  return prisma.organization.findUnique({
    where: { id: organizationId },
    include: {
      memberships: {
        orderBy: { createdAt: "asc" },
        include: { user: { select: { id: true, name: true, email: true } } },
      },
      formations: {
        orderBy: { updatedAt: "desc" },
        select: { id: true, title: true, status: true, slug: true },
      },
    },
  });
}

export function getAllUsers() {
  return prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { memberships: true, formationsCreated: true, enrollments: true } } },
  });
}

export function getAllFormationsGlobal() {
  return prisma.formation.findMany({
    orderBy: { updatedAt: "desc" },
    include: {
      creator: { select: { name: true, email: true } },
      organization: { select: { name: true } },
      _count: { select: { enrollments: true } },
    },
  });
}
