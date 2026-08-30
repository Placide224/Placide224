import Link from "next/link";
import { requireCreator } from "@/lib/authz";

export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  const user = await requireCreator();

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 gap-8 px-4 py-10">
      <aside className="w-56 shrink-0">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
          Production
        </p>
        <p className="mt-1 text-sm text-slate-600">{user.name}</p>
        <nav className="mt-6 flex flex-col gap-1 text-sm font-medium text-slate-600">
          <Link href="/admin" className="rounded-lg px-3 py-2 hover:bg-slate-100">
            Tableau de bord
          </Link>
          <Link href="/admin/formations" className="rounded-lg px-3 py-2 hover:bg-slate-100">
            Formations
          </Link>
          <Link
            href="/admin/formations/new"
            className="rounded-lg px-3 py-2 hover:bg-slate-100"
          >
            Nouvelle formation
          </Link>
        </nav>
      </aside>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
