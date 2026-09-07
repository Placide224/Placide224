import { notFound } from "next/navigation";
import { requireCreator } from "@/lib/authz";
import { prisma } from "@/lib/prisma";
import { deleteTranscription } from "@/lib/transcription-actions";
import { getInstrument } from "@/lib/music/instruments";
import { transcriptionToMusicXml } from "@/lib/music/musicxml";
import { transcriptionToStrudel } from "@/lib/music/strudel";
import { transcriptionToSonicPi } from "@/lib/music/sonicpi";
import type { Transcription } from "@/lib/music/types";
import { AudioPreviewPlayer, CodeBlock, DownloadButtons, NoteRoll } from "@/components/transcription-view";
import { ScoreViewer } from "@/components/score-viewer";

export default async function TranscriptionDetailPage({
  params,
}: PageProps<"/admin/transcription/[id]">) {
  const { id } = await params;
  const user = await requireCreator();

  const record = await prisma.transcription.findUnique({ where: { id } });
  if (!record) notFound();
  if (record.creatorId !== user.id && user.role !== "ADMIN") notFound();

  const transcription: Transcription = {
    tempo: record.tempo,
    key: record.key,
    durationSec: record.durationSec,
    notes: record.notes as unknown as Transcription["notes"],
    drums: record.drums as unknown as Transcription["drums"],
  };

  const deleteWithId = deleteTranscription.bind(null, record.id);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">{record.title}</h1>
          <p className="mt-1 text-sm text-slate-500">
            {getInstrument(record.instrument).icon} {getInstrument(record.instrument).label} · Enregistrée
            le {record.createdAt.toLocaleDateString("fr-FR")}
          </p>
        </div>
        <form action={deleteWithId}>
          <button
            type="submit"
            className="rounded-full border border-red-200 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50"
          >
            Supprimer
          </button>
        </form>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <div className="flex flex-wrap gap-6 text-sm">
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-400">Tempo</p>
            <p className="mt-1 font-semibold text-slate-900">{transcription.tempo} BPM</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-400">Tonalité</p>
            <p className="mt-1 font-semibold text-slate-900">{transcription.key}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-400">Durée</p>
            <p className="mt-1 font-semibold text-slate-900">
              {transcription.durationSec.toFixed(1)} s
            </p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-400">Notes détectées</p>
            <p className="mt-1 font-semibold text-slate-900">{transcription.notes.length}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-400">Coups de batterie</p>
            <p className="mt-1 font-semibold text-slate-900">{transcription.drums.length}</p>
          </div>
        </div>

        <NoteRoll transcription={transcription} />
        <AudioPreviewPlayer transcription={transcription} />
      </div>

      {transcription.notes.length > 0 && (
        <ScoreViewer
          musicXml={transcriptionToMusicXml(transcription, record.title, record.instrument)}
          filename={record.title}
        />
      )}

      <CodeBlock
        label="Strudel — à coller sur strudel.cc"
        code={transcriptionToStrudel(transcription, record.instrument)}
      />
      <CodeBlock label="Sonic Pi" code={transcriptionToSonicPi(transcription, record.instrument)} />

      <DownloadButtons
        transcription={transcription}
        filename={record.title}
        instrumentId={record.instrument}
      />
    </div>
  );
}
