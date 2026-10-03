import {
  BarChart3,
  ChevronDown,
  FileText,
  Globe,
  Landmark,
  LayoutGrid,
  Package,
  Percent,
  Settings,
  ShoppingCart,
  Sparkles,
  TrendingUp,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

const items: { label: string; icon: LucideIcon; active?: boolean }[] = [
  { label: "Accueil", icon: LayoutGrid, active: true },
  { label: "Commandes", icon: ShoppingCart },
  { label: "Produits", icon: Package },
  { label: "Clients", icon: Users },
  { label: "Croissance", icon: TrendingUp },
  { label: "Réductions", icon: Percent },
  { label: "Contenu", icon: FileText },
  { label: "Marchés", icon: Globe },
  { label: "Finances", icon: Landmark },
  { label: "Analyses de données", icon: BarChart3 },
  { label: "Paramètres", icon: Settings },
];

export default function Sidebar() {
  return (
    <aside className="hidden w-72 shrink-0 border-r border-zinc-200 bg-white md:flex md:flex-col">
      <div className="flex items-center justify-between border-b border-zinc-200 px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-black text-sm font-bold text-white">
            N
          </div>
          <div>
            <p className="text-lg font-semibold tracking-tight">NT7East</p>
            <p className="text-xs text-zinc-500">Console admin</p>
          </div>
        </div>

        <button className="rounded-md border border-zinc-200 p-1.5 text-zinc-500 transition hover:bg-zinc-100">
          <ChevronDown className="h-4 w-4" />
        </button>
      </div>

      <div className="px-3 py-4">
        <div className="mb-3 flex items-center justify-between px-2">
          <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-zinc-400">
            Navigation
          </p>
          <Sparkles className="h-4 w-4 text-zinc-400" />
        </div>

        <nav className="space-y-1">
          {items.map(({ label, icon: Icon, active }) => (
            <button
              key={label}
              className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition ${
                active
                  ? "bg-zinc-900 text-white shadow-sm"
                  : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{label}</span>
            </button>
          ))}
        </nav>
      </div>

      <div className="mt-auto border-t border-zinc-200 p-4">
        <div className="rounded-2xl bg-zinc-100 p-3">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-[10px] font-medium uppercase tracking-[0.12em] text-zinc-500">
              État
            </span>
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
          </div>
          <p className="text-sm font-medium text-zinc-800">Plateforme active</p>
          <p className="mt-1 text-xs text-zinc-500">19 modules opérationnels</p>
        </div>
      </div>
    </aside>
  );
}
