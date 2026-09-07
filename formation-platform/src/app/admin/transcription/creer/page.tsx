import Link from "next/link";
import { requireCreator } from "@/lib/authz";
import { MelodyComposer } from "@/components/melody-composer";

export default async function CreerMelodiePage() {
  await requireCreator();

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-slate-900">Créer une mélodie</h1>
        <Link
          href="/admin/transcription"
          className="rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Historique
        </Link>
      </div>
      <p className="mt-1 text-sm text-slate-500">
        Génère une mélodie à partir d&apos;une tonalité, d&apos;un tempo et d&apos;une longueur — sans
        partir d&apos;un enregistrement. Une marche aléatoire sur la gamme choisie, pas un modèle
        entraîné ni un échantillon réel : de quoi obtenir rapidement une base à écouter, ajuster et
        exporter, pas une reproduction fidèle d&apos;un musicien professionnel.
      </p>

      <div className="mt-6">
        <MelodyComposer />
      </div>
    </div>
  );
}
