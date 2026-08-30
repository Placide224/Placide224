import Link from "next/link";
import { requireCreator } from "@/lib/authz";
import { prisma } from "@/lib/prisma";

export default async function AdminDashboardPage() {
  const user = await requireCreator();
  const scope = user.role === "ADMIN" ? {} : { creatorId: user.id };

  const [total, published, draft, enrollments] = await Promise.all([
    prisma.formation.count({ where: scope }),
    prisma.formation.count({ where: { ...scope, status: "PUBLISHED" } }),
    prisma.formation.count({ where: { ...scope, status: "DRAFT" } }),
    prisma.enrollment.count({ where: { formation: scope } }),
  ]);

  const stats = [
    { label: "Formations", value: total },
    { label: "Publiées", value: published },
    { label: "Brouillons", value: draft },
    { label: "Inscriptions", value: enrollments },
  ];

  return (
    <div>
      <h1 className="text-2xl font-semibold text-slate-900">Tableau de bord</h1>
      <p className="mt-1 text-sm text-slate-500">
        Espace de production réservé aux créateurs et administrateurs.
      </p>

      <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-2xl border border-slate-200 bg-white p-5">
            <p className="text-2xl font-semibold text-slate-900">{s.value}</p>
            <p className="mt-1 text-xs text-slate-500">{s.label}</p>
          </div>
        ))}
      </div>

      <Link
        href="/admin/formations/new"
        className="mt-8 inline-block rounded-full bg-slate-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-slate-700"
      >
        + Nouvelle formation
      </Link>
    </div>
  );
}
