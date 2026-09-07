"use client";

import { useMemo } from "react";
import { transcriptionToMusicXml, transcriptionToMusicXmlMultiVoix } from "@/lib/music/musicxml";
import { transcriptionToSonicPi, transcriptionToSonicPiMultiVoix } from "@/lib/music/sonicpi";
import { transcriptionToStrudel, transcriptionToStrudelMultiVoix } from "@/lib/music/strudel";
import type { Transcription } from "@/lib/music/types";
import { AudioPreviewPlayer, CodeBlock, DownloadButtons, NoteRoll } from "@/components/transcription-view";
import { ScoreViewer } from "@/components/score-viewer";

/**
 * The shared "here's what we've got" view: stats, note roll, audio
 * preview, score/PDF, Strudel/Sonic Pi code (simple + fidèle multi-voix),
 * downloads, and a save button. Used both after a transcription analysis
 * and after generating a melody from scratch — both end up as the same
 * `Transcription` shape, so the same view works for either.
 */
export function TranscriptionResultPanel({
  result,
  title,
  instrumentId,
  onTempoChange,
  onSave,
  isSaving,
  saveLabel = "Enregistrer dans mes transcriptions",
}: {
  result: Transcription;
  title: string;
  instrumentId: string;
  onTempoChange: (tempo: number) => void;
  onSave: () => void;
  isSaving: boolean;
  saveLabel?: string;
}) {
  const strudelCode = useMemo(() => transcriptionToStrudel(result, instrumentId), [result, instrumentId]);
  const strudelMultiVoixCode = useMemo(
    () => transcriptionToStrudelMultiVoix(result, instrumentId),
    [result, instrumentId],
  );
  const sonicPiCode = useMemo(() => transcriptionToSonicPi(result, instrumentId), [result, instrumentId]);
  const sonicPiMultiVoixCode = useMemo(
    () => transcriptionToSonicPiMultiVoix(result, instrumentId),
    [result, instrumentId],
  );
  const musicXml = useMemo(
    () =>
      instrumentId === "multi"
        ? transcriptionToMusicXmlMultiVoix(result, title || "melodie")
        : transcriptionToMusicXml(result, title || "melodie", instrumentId),
    [result, instrumentId, title],
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <div className="flex flex-wrap gap-6 text-sm">
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-400">Tempo</p>
            <div className="mt-1 flex items-center gap-1">
              <input
                type="number"
                step={0.1}
                value={result.tempo}
                onChange={(e) => onTempoChange(Number(e.target.value))}
                className="w-20 rounded border border-slate-300 px-2 py-1 text-sm font-semibold text-slate-900"
              />
              <span className="font-semibold text-slate-900">BPM</span>
            </div>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-400">Tonalité</p>
            <p className="mt-1 font-semibold text-slate-900">{result.key}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-400">Durée</p>
            <p className="mt-1 font-semibold text-slate-900">{result.durationSec.toFixed(1)} s</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-400">Notes</p>
            <p className="mt-1 font-semibold text-slate-900">{result.notes.length}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-400">Coups de batterie</p>
            <p className="mt-1 font-semibold text-slate-900">{result.drums.length}</p>
          </div>
        </div>
        <p className="mt-2 text-xs text-slate-500">
          Tempo modifiable sur place : la correction se répercute immédiatement sur tous les exports
          (et sur ce qui sera enregistré).
        </p>

        <NoteRoll transcription={result} />
        <AudioPreviewPlayer transcription={result} instrumentId={instrumentId} />
      </div>

      {result.notes.length > 0 && <ScoreViewer musicXml={musicXml} filename={title || "melodie"} />}

      <p className="text-xs text-slate-500">
        Deux versions du code : <strong>simple</strong> joue toutes les notes avec le son de
        l&apos;instrument choisi ; <strong>fidèle multi-voix</strong> répartit ces mêmes notes sur 3
        sons différents selon leur registre (grave/médium/aigu) pour une texture plus riche. Ce
        n&apos;est pas une vraie séparation des instruments, juste une approximation plus dense.
      </p>
      <CodeBlock label="Strudel — simple (1 instrument) — à coller sur strudel.cc" code={strudelCode} />
      <CodeBlock
        label="Strudel — fidèle multi-voix (grave/médium/aigu) — à coller sur strudel.cc"
        code={strudelMultiVoixCode}
      />
      <CodeBlock label="Sonic Pi — simple (1 instrument)" code={sonicPiCode} />
      <CodeBlock label="Sonic Pi — fidèle multi-voix (grave/médium/aigu)" code={sonicPiMultiVoixCode} />

      <DownloadButtons transcription={result} filename={title || "melodie"} instrumentId={instrumentId} />

      <button
        type="button"
        disabled={!title.trim() || isSaving}
        onClick={onSave}
        className="w-fit rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50"
      >
        {isSaving ? "Enregistrement…" : saveLabel}
      </button>
    </div>
  );
}
