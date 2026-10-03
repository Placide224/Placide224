import { Bell, ChevronDown, Plus, Search } from "lucide-react";

export default function Topbar() {
  return (
    <header className="border-b border-zinc-200 bg-black text-white">
      <div className="flex items-center justify-between gap-4 px-4 py-3 md:px-6">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-300">
            <Search className="h-4 w-4" />
            <input
              aria-label="Rechercher"
              placeholder="Rechercher..."
              className="w-40 bg-transparent text-sm text-white placeholder:text-zinc-400 outline-none md:w-72"
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button className="inline-flex items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm font-medium text-zinc-100 transition hover:bg-zinc-800">
            <Plus className="h-4 w-4" />
            Nouveau
          </button>

          <button className="relative rounded-lg border border-zinc-700 bg-zinc-900 p-2 text-zinc-200 transition hover:bg-zinc-800">
            <Bell className="h-4 w-4" />
            <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-400 text-[9px] font-bold text-black">
              3
            </span>
          </button>

          <button className="flex items-center gap-3 rounded-lg border border-zinc-700 bg-zinc-900 px-2.5 py-1.5 transition hover:bg-zinc-800">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-zinc-200 to-zinc-500 text-sm font-semibold text-black">
              P
            </div>
            <div className="hidden text-left md:block">
              <p className="text-sm font-medium text-white">Placide</p>
              <p className="text-[11px] text-zinc-400">Administrateur</p>
            </div>
            <ChevronDown className="hidden h-4 w-4 text-zinc-400 md:block" />
          </button>
        </div>
      </div>
    </header>
  );
}
