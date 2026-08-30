import Link from "next/link";
import { requireCreator } from "@/lib/authz";
import { prisma } from "@/lib/prisma";

export default async function AdminFormationsPage() {
  const user = await requireCreator();
  const scope = user.role === "ADMIN" ? {} : { creatorId: user.id };

  const formations = await prisma.formation.findMany({
    where: scope,
    orderBy: { updatedAt: "desc" },
    include: { _count: { select: { enrollments: true, modules: true } } },
  });

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-slate-900">Formations</h1>
        <Link
          href="/admin/formations/new"
          className="rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
        >
          + Nouvelle formation
        </Link>
      </div>

      {formations.length === 0 ? (
        <p className="mt-10 text-slate-500">Aucune formation pour le moment.</p>
      ) : (
        <div className="mt-6 flex flex-col divide-y divide-slate-200 rounded-2xl border border-slate-200 bg-white">
          {formations.map((f) => (
            <Link
              key={f.id}
              href={`/admin/formations/${f.id}`}
              className="flex items-center justify-between gap-4 px-5 py-4 hover:bg-slate-50"
            >
              <div>
                <p className="font-medium text-slate-900">{f.title}</p>
                <p className="mt-0.5 text-xs text-slate-500">
                  {f._count.modules} module{f._count.modules > 1 ? "s" : ""} ·{" "}
                  {f._count.enrollments} inscrit{f._count.enrollments > 1 ? "s" : ""}
                </p>
              </div>
              <span
                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                  f.status === "PUBLISHED"
                    ? "bg-teal-100 text-teal-800"
                    : "bg-slate-100 text-slate-600"
                }`}
              >
                {f.status === "PUBLISHED" ? "Publiée" : "Brouillon"}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
