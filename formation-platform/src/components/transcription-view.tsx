"use client";

import { useEffect, useMemo } from "react";
import { transcriptionToMidi } from "@/lib/music/midi";
import { transcriptionToMusicXml, transcriptionToMusicXmlMultiVoix } from "@/lib/music/musicxml";
import { transcriptionToWav } from "@/lib/music/render-audio";
import type { Transcription } from "@/lib/music/types";

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

/** Lets a creator listen to what was detected without downloading first. */
export function AudioPreviewPlayer({
  transcription,
  instrumentId,
}: {
  transcription: Transcription;
  instrumentId?: string;
}) {
  const url = useMemo(() => {
    const blob = new Blob([new Uint8Array(transcriptionToWav(transcription, instrumentId))], { type: "audio/wav" });
    return URL.createObjectURL(blob);
  }, [transcription, instrumentId]);

  useEffect(() => () => URL.revokeObjectURL(url), [url]);

  return <audio className="mt-3 w-full" controls src={url} />;
}

export function NoteRoll({ transcription }: { transcription: Transcription }) {
  const minMidi = Math.min(...transcription.notes.map((n) => n.midi));
  const maxMidi = Math.max(...transcription.notes.map((n) => n.midi));
  const span = Math.max(1, maxMidi - minMidi);

  return (
    <div className="relative mt-6 h-32 w-full overflow-hidden rounded-xl bg-slate-50">
      {transcription.notes.map((note, i) => {
        const left = (note.start / transcription.durationSec) * 100;
        const width = Math.max((note.duration / transcription.durationSec) * 100, 0.5);
        const bottom = ((note.midi - minMidi) / span) * 85;
        return (
          <div
            key={i}
            title={`${note.pitch} — ${note.start.toFixed(2)}s`}
            className="absolute h-3 rounded bg-teal-600"
            style={{ left: `${left}%`, width: `${width}%`, bottom: `${bottom}%` }}
          />
        );
      })}
    </div>
  );
}

export function CodeBlock({
  label,
  code,
}: {
  label: string;
  code: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-slate-700">{label}</p>
        <button
          type="button"
          onClick={() => navigator.clipboard.writeText(code)}
          className="rounded-full border border-slate-300 px-3 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50"
        >
          Copier
        </button>
      </div>
      <pre className="mt-3 overflow-x-auto rounded-lg bg-slate-900 p-4 text-xs text-slate-100">
        <code>{code}</code>
      </pre>
    </div>
  );
}

export function DownloadButtons({
  transcription,
  filename,
  instrumentId,
}: {
  transcription: Transcription;
  filename: string;
  instrumentId?: string;
}) {
  return (
    <div className="flex flex-wrap gap-3">
      <button
        type="button"
        onClick={() =>
          downloadBlob(
            new Blob([new Uint8Array(transcriptionToWav(transcription, instrumentId))], { type: "audio/wav" }),
            `${filename}.wav`,
          )
        }
        className="rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
      >
        Télécharger l&apos;audio (aperçu)
      </button>
      <button
        type="button"
        onClick={() =>
          downloadBlob(
            new Blob([new Uint8Array(transcriptionToMidi(transcription))], { type: "audio/midi" }),
            `${filename}.mid`,
          )
        }
        className="rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
      >
        Télécharger le MIDI
      </button>
      <button
        type="button"
        onClick={() =>
          downloadBlob(
            new Blob(
              [
                instrumentId === "multi"
                  ? transcriptionToMusicXmlMultiVoix(transcription, filename)
                  : transcriptionToMusicXml(transcription, filename, instrumentId),
              ],
              { type: "application/vnd.recordare.musicxml+xml" },
            ),
            `${filename}.musicxml`,
          )
        }
        className="rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
      >
        Télécharger le MusicXML
      </button>
      <button
        type="button"
        onClick={() =>
          downloadBlob(
            new Blob([JSON.stringify(transcription, null, 2)], { type: "application/json" }),
            `${filename}.json`,
          )
        }
        className="rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
      >
        Télécharger le JSON
      </button>
    </div>
  );
}
