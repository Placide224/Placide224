import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  DollarSign,
  ShoppingBag,
  TrendingUp,
  Users,
} from "lucide-react";

const stats = [
  {
    label: "Visites",
    value: "54.2K",
    change: "+12.4%",
    positive: true,
    icon: Activity,
  },
  {
    label: "Commandes",
    value: "1,284",
    change: "+8.1%",
    positive: true,
    icon: ShoppingBag,
  },
  {
    label: "Clients",
    value: "842",
    change: "+5.3%",
    positive: true,
    icon: Users,
  },
  {
    label: "Revenus",
    value: "€48.7K",
    change: "-2.1%",
    positive: false,
    icon: DollarSign,
  },
];

const activity = [
  { name: "Formations vendues", value: "480", trend: "+18%" },
  { name: "Abonnements actifs", value: "1.9K", trend: "+9%" },
  { name: "Taux de conversion", value: "6.8%", trend: "+1.2%" },
];

export default function Dashboard() {
  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm font-medium text-zinc-500">Vue d’ensemble</p>
          <h1 className="text-3xl font-semibold tracking-tight text-zinc-900">
            Tableau de bord
          </h1>
        </div>

        <button className="inline-flex items-center justify-center rounded-xl bg-black px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-800">
          Exporter les rapports
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {stats.map(({ label, value, change, positive, icon: Icon }) => (
          <div key={label} className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
            <div className="mb-6 flex items-center justify-between">
              <span className="text-sm text-zinc-500">{label}</span>
              <div className="rounded-xl bg-zinc-100 p-2 text-zinc-700">
                <Icon className="h-4 w-4" />
              </div>
            </div>

            <div className="flex items-end justify-between gap-3">
              <p className="text-3xl font-semibold tracking-tight text-zinc-900">{value}</p>

              <div
                className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium ${
                  positive
                    ? "bg-emerald-50 text-emerald-700"
                    : "bg-red-50 text-red-600"
                }`}
              >
                {positive ? (
                  <ArrowUpRight className="h-3.5 w-3.5" />
                ) : (
                  <ArrowDownRight className="h-3.5 w-3.5" />
                )}
                {change}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.6fr_0.9fr]">
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <p className="text-sm text-zinc-500">Performance</p>
              <h2 className="text-xl font-semibold text-zinc-900">Croissance</h2>
            </div>
            <button className="rounded-lg bg-zinc-100 px-3 py-1.5 text-sm font-medium text-zinc-700">
              30 jours
            </button>
          </div>

          <div className="h-64 rounded-2xl bg-gradient-to-br from-zinc-100 via-white to-zinc-50 p-4">
            <div className="flex h-full items-end gap-3">
              {[32, 48, 38, 62, 54, 78, 86, 72, 94, 88, 110, 100].map((height, index) => (
                <div key={index} className="flex-1">
                  <div
                    className={`w-full rounded-t-2xl ${
                      index % 2 === 0 ? "bg-zinc-900" : "bg-zinc-300"
                    }`}
                    style={{ height: `${height}%` }}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <p className="text-sm text-zinc-500">Activité</p>
              <h2 className="text-xl font-semibold text-zinc-900">Métriques</h2>
            </div>
            <TrendingUp className="h-5 w-5 text-zinc-500" />
          </div>

          <div className="space-y-4">
            {activity.map((item) => (
              <div
                key={item.name}
                className="flex items-center justify-between rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-3"
              >
                <div>
                  <p className="text-sm text-zinc-500">{item.name}</p>
                  <p className="text-lg font-semibold text-zinc-900">{item.value}</p>
                </div>
                <span className="rounded-full bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700">
                  {item.trend}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
          <h3 className="text-lg font-semibold text-zinc-900">Ventes récentes</h3>
          <div className="mt-4 space-y-3">
            {[
              "Formation React",
              "Pack SEO",
              "Cohorte Design",
              "Certification PM",
            ].map((item, index) => (
              <div key={item} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-zinc-100 text-xs font-bold text-zinc-700">
                    {index + 1}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-zinc-800">{item}</p>
                    <p className="text-xs text-zinc-500">Achat en cours</p>
                  </div>
                </div>
                <span className="text-sm font-medium text-zinc-700">€{125 + index * 42}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
          <h3 className="text-lg font-semibold text-zinc-900">Canaux</h3>
          <div className="mt-4 space-y-4">
            {[
              { label: "Organic", value: "42%", color: "bg-zinc-900" },
              { label: "Social", value: "31%", color: "bg-zinc-400" },
              { label: "Email", value: "17%", color: "bg-zinc-200" },
              { label: "Referral", value: "10%", color: "bg-zinc-600" },
            ].map((item) => (
              <div key={item.label}>
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span className="text-zinc-600">{item.label}</span>
                  <span className="font-medium text-zinc-900">{item.value}</span>
                </div>
                <div className="h-2.5 rounded-full bg-zinc-100">
                  <div
                    className={`h-2.5 rounded-full ${item.color}`}
                    style={{ width: item.value }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
          <h3 className="text-lg font-semibold text-zinc-900">Alertes</h3>
          <div className="mt-4 space-y-3">
            <div className="rounded-xl bg-amber-50 p-3 text-sm text-amber-900">
              <strong>2 nouvelles demandes</strong> de remboursement à valider
            </div>
            <div className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-900">
              <strong>18 nouveaux cours</strong> ajoutés cette semaine
            </div>
            <div className="rounded-xl bg-blue-50 p-3 text-sm text-blue-900">
              <strong>Performance stable</strong> sur les marchés européens
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
