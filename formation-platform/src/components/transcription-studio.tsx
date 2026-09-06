"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import { AI_PITCH_SAMPLE_RATE } from "@/lib/music/ai-pitch";
import { transcribeSamples } from "@/lib/music/pipeline";
import { transcriptionToSonicPi } from "@/lib/music/sonicpi";
import { transcriptionToStrudel } from "@/lib/music/strudel";
import type { Transcription } from "@/lib/music/types";
import { saveTranscription } from "@/lib/transcription-actions";
import { CodeBlock, DownloadButtons, NoteRoll } from "@/components/transcription-view";

const MAX_DURATION_SEC = 45;

async function decodeToMonoSamples(arrayBuffer: ArrayBuffer): Promise<Float32Array> {
  const AudioContextCtor =
    window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  const decodeContext = new AudioContextCtor();
  const decoded = await decodeContext.decodeAudioData(arrayBuffer);
  await decodeContext.close();

  if (decoded.duration > MAX_DURATION_SEC) {
    throw new Error(
      `Cet outil traite des mélodies courtes (${MAX_DURATION_SEC}s max pour rester réactif dans le navigateur). Découpez l'extrait et réessayez.`,
    );
  }

  const offline = new OfflineAudioContext(
    1,
    Math.ceil(decoded.duration * AI_PITCH_SAMPLE_RATE),
    AI_PITCH_SAMPLE_RATE,
  );
  const source = offline.createBufferSource();
  source.buffer = decoded;
  source.connect(offline.destination);
  source.start();
  const resampled = await offline.startRendering();
  return resampled.getChannelData(0).slice();
}

type Source = "UPLOAD" | "RECORDING";

export function TranscriptionStudio() {
  const [title, setTitle] = useState("");
  const [source, setSource] = useState<Source>("UPLOAD");
  const [status, setStatus] = useState<"idle" | "processing" | "done" | "error">("idle");
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Transcription | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isSaving, startSaving] = useTransition();

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);

  const strudelCode = useMemo(() => (result ? transcriptionToStrudel(result) : ""), [result]);
  const sonicPiCode = useMemo(() => (result ? transcriptionToSonicPi(result) : ""), [result]);

  async function runPipeline(arrayBuffer: ArrayBuffer) {
    setStatus("processing");
    setProgress(0);
    setError(null);
    try {
      const samples = await decodeToMonoSamples(arrayBuffer);
      const transcription = await transcribeSamples(samples, setProgress);
      if (transcription.notes.length === 0) {
        throw new Error(
          "Aucune note détectée. Vérifiez que l'extrait contient bien de la musique audible.",
        );
      }
      setResult(transcription);
      setStatus("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Échec de l'analyse audio.");
      setStatus("error");
    }
  }

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setSource("UPLOAD");
    if (!title) setTitle(file.name.replace(/\.[^/.]+$/, ""));
    const arrayBuffer = await file.arrayBuffer();
    await runPipeline(arrayBuffer);
  }

  async function startRecording() {
    setError(null);
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const recorder = new MediaRecorder(stream);
    recordedChunksRef.current = [];
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) recordedChunksRef.current.push(e.data);
    };
    recorder.onstop = async () => {
      stream.getTracks().forEach((track) => track.stop());
      const blob = new Blob(recordedChunksRef.current, { type: "audio/webm" });
      setSource("RECORDING");
      if (!title) setTitle(`Enregistrement du ${new Date().toLocaleString("fr-FR")}`);
      await runPipeline(await blob.arrayBuffer());
    };
    mediaRecorderRef.current = recorder;
    recorder.start();
    setIsRecording(true);
  }

  function stopRecording() {
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
  }

  function handleSave() {
    if (!result || !title.trim()) return;
    startSaving(async () => {
      await saveTranscription({
        title: title.trim(),
        source,
        tempo: result.tempo,
        key: result.key,
        durationSec: result.durationSec,
        notes: result.notes,
      });
    });
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <label className="text-sm font-medium text-slate-700">Titre de la transcription</label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Ex. Mélodie du refrain"
          className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-dashed border-slate-300 p-5 text-center">
            <p className="text-sm font-medium text-slate-700">Importer un fichier audio</p>
            <p className="mt-1 text-xs text-slate-500">WAV, MP3, M4A, OGG — {MAX_DURATION_SEC}s max</p>
            <input
              type="file"
              accept="audio/*"
              onChange={handleFileChange}
              className="mt-3 w-full text-xs"
            />
          </div>

          <div className="rounded-xl border border-dashed border-slate-300 p-5 text-center">
            <p className="text-sm font-medium text-slate-700">Enregistrer au micro</p>
            <p className="mt-1 text-xs text-slate-500">Chantez ou jouez la mélodie seule</p>
            <button
              type="button"
              onClick={isRecording ? stopRecording : startRecording}
              className={`mt-3 rounded-full px-4 py-2 text-xs font-semibold text-white ${
                isRecording ? "bg-red-600 hover:bg-red-700" : "bg-teal-600 hover:bg-teal-700"
              }`}
            >
              {isRecording ? "Arrêter l'enregistrement" : "Démarrer l'enregistrement"}
            </button>
          </div>
        </div>

        <div className="mt-4 rounded-xl bg-slate-50 px-4 py-3 text-xs text-slate-500">
          Import depuis YouTube / Instagram / TikTok : bientôt disponible (nécessite un
          service d&apos;extraction audio dédié — voir la feuille de route dans le README).
        </div>

        {status === "processing" && (
          <p className="mt-4 text-sm text-slate-500">
            Analyse de la mélodie par IA en cours… {Math.round(progress * 100)}%
          </p>
        )}
        {status === "error" && error && (
          <p className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
        )}
      </div>

      {result && (
        <div className="flex flex-col gap-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <div className="flex flex-wrap gap-6 text-sm">
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-400">Tempo</p>
                <p className="mt-1 font-semibold text-slate-900">{result.tempo} BPM</p>
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
                <p className="text-xs uppercase tracking-wide text-slate-400">Notes détectées</p>
                <p className="mt-1 font-semibold text-slate-900">{result.notes.length}</p>
              </div>
            </div>

            <NoteRoll transcription={result} />
          </div>

          <CodeBlock label="Strudel — à coller sur strudel.cc" code={strudelCode} />
          <CodeBlock label="Sonic Pi" code={sonicPiCode} />

          <DownloadButtons transcription={result} filename={title || "melodie"} />

          <button
            type="button"
            disabled={!title.trim() || isSaving}
            onClick={handleSave}
            className="w-fit rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50"
          >
            {isSaving ? "Enregistrement…" : "Enregistrer dans mes transcriptions"}
          </button>
        </div>
      )}
    </div>
  );
}
