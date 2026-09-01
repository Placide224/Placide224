import Link from "next/link";
import { requireSuperAdmin } from "@/lib/authz";

export default async function ConsoleLayout({ children }: LayoutProps<"/console">) {
  const user = await requireSuperAdmin();

  return (
    <div className="flex flex-1 bg-slate-950 text-slate-100">
      <aside className="flex w-60 shrink-0 flex-col border-r border-slate-800 bg-slate-900 px-3 py-5">
        <div className="px-2">
          <p className="text-sm font-semibold tracking-tight text-white">
            NT7East <span className="text-teal-400">Console</span>
          </p>
          <p className="mt-0.5 text-xs text-slate-400">{user.name}</p>
        </div>
        <nav className="mt-6 flex flex-col gap-0.5 text-sm text-slate-300">
          <Link href="/console" className="rounded-lg px-3 py-2 hover:bg-slate-800 hover:text-white">
            Accueil
          </Link>
          <Link
            href="/console/organisations"
            className="rounded-lg px-3 py-2 hover:bg-slate-800 hover:text-white"
          >
            Organisations
          </Link>
          <Link
            href="/console/utilisateurs"
            className="rounded-lg px-3 py-2 hover:bg-slate-800 hover:text-white"
          >
            Utilisateurs
          </Link>
          <Link
            href="/console/formations"
            className="rounded-lg px-3 py-2 hover:bg-slate-800 hover:text-white"
          >
            Formations
          </Link>
          <div className="mt-4 rounded-lg px-3 py-2 text-xs text-slate-500">
            Finances (bientôt)
          </div>
        </nav>
        <div className="mt-auto px-2 pt-6">
          <Link href="/admin" className="text-xs text-slate-500 hover:text-slate-300">
            ← Retour à l&apos;espace de production
          </Link>
        </div>
      </aside>
      <div className="min-w-0 flex-1 bg-slate-950 px-8 py-8">{children}</div>
    </div>
  );
}
