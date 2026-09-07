import Link from "next/link";
import { requireCreator } from "@/lib/authz";
import { getInstrument } from "@/lib/music/instruments";
import { prisma } from "@/lib/prisma";
import type { Note } from "@/lib/music/types";

const SOURCE_LABELS: Record<string, string> = {
  UPLOAD: "Fichier importé",
  RECORDING: "Enregistrement micro",
  GENERATED: "Mélodie générée",
};

export default async function AdminTranscriptionPage() {
  const user = await requireCreator();

  const transcriptions = await prisma.transcription.findMany({
    where: user.role === "ADMIN" ? {} : { creatorId: user.id },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Transcription musicale</h1>
          <p className="mt-1 text-sm text-slate-500">
            Faites écouter une mélodie, obtenez ses notes et le code prêt à coller dans
            Strudel ou Sonic Pi.
          </p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/admin/transcription/creer"
            className="rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            🎼 Créer une mélodie
          </Link>
          <Link
            href="/admin/transcription/nouvelle"
            className="rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
          >
            + Nouvelle transcription
          </Link>
        </div>
      </div>

      {transcriptions.length === 0 ? (
        <p className="mt-10 text-slate-500">Aucune transcription pour le moment.</p>
      ) : (
        <div className="mt-6 flex flex-col divide-y divide-slate-200 rounded-2xl border border-slate-200 bg-white">
          {transcriptions.map((t) => {
            const notes = t.notes as unknown as Note[];
            return (
              <Link
                key={t.id}
                href={`/admin/transcription/${t.id}`}
                className="flex items-center justify-between gap-4 px-5 py-4 hover:bg-slate-50"
              >
                <div>
                  <p className="font-medium text-slate-900">
                    {getInstrument(t.instrument).icon} {t.title}
                  </p>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {getInstrument(t.instrument).label} · {t.key} · {t.tempo} BPM · {notes.length} notes ·{" "}
                    {t.durationSec.toFixed(1)}s
                  </p>
                </div>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                  {SOURCE_LABELS[t.source] ?? t.source}
                </span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
