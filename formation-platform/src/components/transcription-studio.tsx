"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import { AI_PITCH_SAMPLE_RATE } from "@/lib/music/ai-pitch";
import { INSTRUMENTS } from "@/lib/music/instruments";
import { transcriptionToMusicXml } from "@/lib/music/musicxml";
import { transcribeSamples } from "@/lib/music/pipeline";
import { transcriptionToSonicPi } from "@/lib/music/sonicpi";
import { transcriptionToStrudel } from "@/lib/music/strudel";
import type { Transcription } from "@/lib/music/types";
import { saveTranscription } from "@/lib/transcription-actions";
import { AudioPreviewPlayer, CodeBlock, DownloadButtons, NoteRoll } from "@/components/transcription-view";
import { ScoreViewer } from "@/components/score-viewer";

const MAX_DURATION_SEC = 300; // 5 minutes

function getAudioContextCtor() {
  return window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
}

async function decodeAudioBuffer(arrayBuffer: ArrayBuffer): Promise<AudioBuffer> {
  const ctx = new (getAudioContextCtor())();
  const decoded = await ctx.decodeAudioData(arrayBuffer);
  await ctx.close();
  return decoded;
}

/** Resamples only [startSec, endSec) of `decoded` to AI_PITCH_SAMPLE_RATE mono. */
async function resampleRange(decoded: AudioBuffer, startSec: number, endSec: number): Promise<Float32Array> {
  const duration = Math.max(0, endSec - startSec);
  const offline = new OfflineAudioContext(1, Math.max(1, Math.ceil(duration * AI_PITCH_SAMPLE_RATE)), AI_PITCH_SAMPLE_RATE);
  const source = offline.createBufferSource();
  source.buffer = decoded;
  source.connect(offline.destination);
  source.start(0, startSec, duration);
  const rendered = await offline.startRendering();
  return rendered.getChannelData(0).slice();
}

type Source = "UPLOAD" | "RECORDING";
type Step = "instrument" | "capture" | "trim" | "processing" | "done" | "error";

export function TranscriptionStudio() {
  const [step, setStep] = useState<Step>("instrument");
  const [instrumentId, setInstrumentId] = useState<string>("autre");
  const [title, setTitle] = useState("");
  const [source, setSource] = useState<Source>("UPLOAD");
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Transcription | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isSaving, startSaving] = useTransition();

  const [decodedBuffer, setDecodedBuffer] = useState<AudioBuffer | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [trimStart, setTrimStart] = useState(0);
  const [trimEnd, setTrimEnd] = useState(0);

  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [youtubeRightsConfirmed, setYoutubeRightsConfirmed] = useState(false);
  const [youtubeLoading, setYoutubeLoading] = useState(false);
  const [youtubeError, setYoutubeError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);

  const strudelCode = useMemo(
    () => (result ? transcriptionToStrudel(result, instrumentId) : ""),
    [result, instrumentId],
  );
  const sonicPiCode = useMemo(
    () => (result ? transcriptionToSonicPi(result, instrumentId) : ""),
    [result, instrumentId],
  );
  const musicXml = useMemo(
    () => (result ? transcriptionToMusicXml(result, title || "melodie", instrumentId) : ""),
    [result, instrumentId, title],
  );

  async function loadForTrimming(arrayBuffer: ArrayBuffer, blobForPreview: Blob) {
    setError(null);
    const decoded = await decodeAudioBuffer(arrayBuffer);
    setDecodedBuffer(decoded);
    setPreviewUrl((old) => {
      if (old) URL.revokeObjectURL(old);
      return URL.createObjectURL(blobForPreview);
    });
    setTrimStart(0);
    setTrimEnd(Math.min(decoded.duration, MAX_DURATION_SEC));
    setStep("trim");
  }

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setSource("UPLOAD");
    if (!title) setTitle(file.name.replace(/\.[^/.]+$/, ""));
    await loadForTrimming(await file.arrayBuffer(), file);
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
      await loadForTrimming(await blob.arrayBuffer(), blob);
    };
    mediaRecorderRef.current = recorder;
    recorder.start();
    setIsRecording(true);
  }

  function stopRecording() {
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
  }

  async function importFromYoutube() {
    if (!youtubeRightsConfirmed || !youtubeUrl.trim()) return;
    setYoutubeLoading(true);
    setYoutubeError(null);
    try {
      const res = await fetch("/api/youtube-audio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: youtubeUrl.trim() }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}) as { error?: string });
        throw new Error(body.error || "Échec de l'import YouTube.");
      }
      const blob = await res.blob();
      const videoTitle = res.headers.get("X-Video-Title");
      setSource("UPLOAD");
      if (!title && videoTitle) setTitle(decodeURIComponent(videoTitle));
      await loadForTrimming(await blob.arrayBuffer(), blob);
    } catch (err) {
      setYoutubeError(err instanceof Error ? err.message : "Échec de l'import YouTube.");
    } finally {
      setYoutubeLoading(false);
    }
  }

  async function runAnalysis() {
    if (!decodedBuffer) return;
    if (trimEnd - trimStart > MAX_DURATION_SEC) {
      setError(`L'extrait sélectionné dépasse ${Math.round(MAX_DURATION_SEC / 60)} minutes. Réduisez la sélection.`);
      setStep("error");
      return;
    }
    setStep("processing");
    setProgress(0);
    setError(null);
    try {
      const samples = await resampleRange(decodedBuffer, trimStart, trimEnd);
      const transcription = await transcribeSamples(samples, setProgress);
      if (transcription.notes.length === 0 && transcription.drums.length === 0) {
        throw new Error(
          "Rien de détecté (ni notes ni percussions). Vérifiez que l'extrait contient bien de la musique audible.",
        );
      }
      setResult(transcription);
      setStep("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Échec de l'analyse audio.");
      setStep("error");
    }
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
        drums: result.drums,
        instrument: instrumentId,
      });
    });
  }

  function updateTempo(newTempo: number) {
    if (!result || !Number.isFinite(newTempo) || newTempo <= 0) return;
    setResult({ ...result, tempo: Math.round(newTempo * 10) / 10 });
  }

  return (
    <div className="flex flex-col gap-8">
      {step === "instrument" && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <p className="text-sm font-medium text-slate-700">Quel instrument voulez-vous transcrire ?</p>
          <p className="mt-1 text-xs text-slate-500">
            Sert uniquement à choisir un son / une clé de portée adaptés à l&apos;export — la détection
            elle-même ne change pas.
          </p>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {INSTRUMENTS.map((instrument) => (
              <button
                key={instrument.id}
                type="button"
                onClick={() => {
                  setInstrumentId(instrument.id);
                  setStep("capture");
                }}
                className={`flex flex-col items-center gap-1 rounded-xl border p-4 text-center hover:border-teal-500 hover:bg-teal-50 ${
                  instrumentId === instrument.id ? "border-teal-600 bg-teal-50" : "border-slate-200"
                }`}
              >
                <span className="text-2xl">{instrument.icon}</span>
                <span className="text-sm font-medium text-slate-900">{instrument.label}</span>
                <span className="text-xs text-slate-500">{instrument.description}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {step !== "instrument" && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-slate-700">Titre de la transcription</label>
            <button
              type="button"
              onClick={() => setStep("instrument")}
              className="text-xs font-medium text-teal-700 hover:underline"
            >
              {INSTRUMENTS.find((i) => i.id === instrumentId)?.icon} Changer d&apos;instrument
            </button>
          </div>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ex. Mélodie du refrain"
            className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />

          {step === "capture" && (
            <>
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <div className="rounded-xl border border-dashed border-slate-300 p-5 text-center">
                  <p className="text-sm font-medium text-slate-700">Importer un fichier audio</p>
                  <p className="mt-1 text-xs text-slate-500">
                    WAV, MP3, M4A, OGG, FLAC — {Math.round(MAX_DURATION_SEC / 60)} minutes max
                  </p>
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

              <div className="mt-4 rounded-xl border border-dashed border-slate-300 p-5">
                <p className="text-sm font-medium text-slate-700">Importer depuis un lien YouTube</p>
                <p className="mt-1 text-xs text-slate-500">
                  Repose sur une méthode non officielle (pas l&apos;API YouTube) : peut cesser de
                  fonctionner si YouTube change son lecteur, et n&apos;est à utiliser que pour du
                  contenu dont vous détenez les droits.
                </p>
                <input
                  type="url"
                  value={youtubeUrl}
                  onChange={(e) => setYoutubeUrl(e.target.value)}
                  placeholder="https://www.youtube.com/watch?v=..."
                  className="mt-3 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
                <label className="mt-3 flex items-start gap-2 text-xs text-slate-600">
                  <input
                    type="checkbox"
                    checked={youtubeRightsConfirmed}
                    onChange={(e) => setYoutubeRightsConfirmed(e.target.checked)}
                    className="mt-0.5"
                  />
                  Je confirme détenir les droits nécessaires pour transcrire cette vidéo.
                </label>
                <button
                  type="button"
                  onClick={importFromYoutube}
                  disabled={!youtubeRightsConfirmed || !youtubeUrl.trim() || youtubeLoading}
                  className="mt-3 rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-700 disabled:opacity-50"
                >
                  {youtubeLoading ? "Import en cours…" : "Importer"}
                </button>
                {youtubeError && <p className="mt-2 text-xs text-red-700">{youtubeError}</p>}
              </div>

              <div className="mt-4 rounded-xl bg-slate-50 px-4 py-3 text-xs text-slate-500">
                Import depuis Instagram / TikTok : bientôt disponible. Les extraits de plusieurs
                minutes prennent plus de temps à analyser (l&apos;IA tourne dans votre navigateur).
              </div>
            </>
          )}

          {step === "trim" && decodedBuffer && (
            <div className="mt-6">
              <p className="text-sm font-medium text-slate-700">Découpez votre audio</p>
              <p className="mt-1 text-xs text-slate-500">
                Choisissez la portion à transcrire (durée totale : {decodedBuffer.duration.toFixed(1)} s).
              </p>

              {previewUrl && <audio className="mt-3 w-full" controls src={previewUrl} />}

              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <label className="flex flex-col gap-1 text-xs text-slate-600">
                  Début (s)
                  <input
                    type="number"
                    min={0}
                    max={decodedBuffer.duration}
                    step={0.1}
                    value={trimStart}
                    onChange={(e) => setTrimStart(Math.max(0, Math.min(Number(e.target.value), trimEnd - 0.1)))}
                    className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  />
                </label>
                <label className="flex flex-col gap-1 text-xs text-slate-600">
                  Fin (s)
                  <input
                    type="number"
                    min={0}
                    max={decodedBuffer.duration}
                    step={0.1}
                    value={trimEnd}
                    onChange={(e) =>
                      setTrimEnd(Math.min(decodedBuffer.duration, Math.max(Number(e.target.value), trimStart + 0.1)))
                    }
                    className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  />
                </label>
              </div>

              <p className="mt-2 text-xs text-slate-500">
                Durée sélectionnée : {(trimEnd - trimStart).toFixed(1)} s
              </p>

              <button
                type="button"
                onClick={runAnalysis}
                className="mt-4 rounded-full bg-teal-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-teal-700"
              >
                Analyser cet extrait
              </button>
            </div>
          )}

          {step === "processing" && (
            <p className="mt-4 text-sm text-slate-500">
              Analyse de la mélodie par IA en cours… {Math.round(progress * 100)}%
            </p>
          )}
          {step === "error" && error && (
            <div className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
              {decodedBuffer && (
                <button
                  type="button"
                  onClick={() => setStep("trim")}
                  className="ml-2 font-medium underline"
                >
                  Revenir au découpage
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {step === "done" && result && (
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
                    onChange={(e) => updateTempo(Number(e.target.value))}
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
                <p className="text-xs uppercase tracking-wide text-slate-400">Notes détectées</p>
                <p className="mt-1 font-semibold text-slate-900">{result.notes.length}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-400">Coups de batterie</p>
                <p className="mt-1 font-semibold text-slate-900">{result.drums.length}</p>
              </div>
            </div>
            <p className="mt-2 text-xs text-slate-500">
              Tempo estimé automatiquement, parfois imprécis — corrigez-le si besoin, les exports se
              mettent à jour aussitôt.
            </p>

            <NoteRoll transcription={result} />
            <AudioPreviewPlayer transcription={result} />
          </div>

          {result.notes.length > 0 && <ScoreViewer musicXml={musicXml} />}

          <CodeBlock label="Strudel — à coller sur strudel.cc" code={strudelCode} />
          <CodeBlock label="Sonic Pi" code={sonicPiCode} />

          <DownloadButtons transcription={result} filename={title || "melodie"} instrumentId={instrumentId} />

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
