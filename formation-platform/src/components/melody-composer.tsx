"use client";

import { useState, useTransition } from "react";
import { INSTRUMENTS } from "@/lib/music/instruments";
import { BAR_LENGTH_OPTIONS, GENERATABLE_KEYS, generateMelody } from "@/lib/music/generate";
import type { Transcription } from "@/lib/music/types";
import { saveTranscription } from "@/lib/transcription-actions";
import { TranscriptionResultPanel } from "@/components/transcription-result-panel";

type Step = "instrument" | "compose";

/**
 * Generates a melody from scratch (key/tempo/length in, notes out —
 * see generate.ts) instead of detecting one from audio, then reuses the
 * exact same result view as the transcription flow: same score/PDF, same
 * Strudel/Sonic Pi code, same exports, same "Enregistrer" action.
 */
export function MelodyComposer() {
  const [step, setStep] = useState<Step>("instrument");
  const [instrumentId, setInstrumentId] = useState("saxophone");
  const [title, setTitle] = useState("");
  const [key, setKey] = useState("C major");
  const [tempo, setTempo] = useState(100);
  const [bars, setBars] = useState<number>(8);
  const [result, setResult] = useState<Transcription | null>(null);
  const [isSaving, startSaving] = useTransition();

  function generate() {
    const melody = generateMelody({ key, tempo, bars });
    setResult(melody);
    if (!title.trim()) setTitle(`Mélodie ${key}`);
  }

  function handleSave() {
    if (!result || !title.trim()) return;
    startSaving(async () => {
      await saveTranscription({
        title: title.trim(),
        source: "GENERATED",
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
          <p className="text-sm font-medium text-slate-700">Pour quel instrument générer la mélodie ?</p>
          <p className="mt-1 text-xs text-slate-500">
            Choisit le son / la clé de portée à l&apos;export — la mélodie générée reste la même quel
            que soit l&apos;instrument.
          </p>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {INSTRUMENTS.map((instrument) => (
              <button
                key={instrument.id}
                type="button"
                onClick={() => {
                  setInstrumentId(instrument.id);
                  setStep("compose");
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

      {step === "compose" && (
        <>
          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-slate-700">Titre de la mélodie</label>
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
              placeholder="Ex. Improvisation en do majeur"
              className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />

            <div className="mt-6 grid gap-4 sm:grid-cols-3">
              <label className="flex flex-col gap-1 text-xs text-slate-600">
                Tonalité
                <select
                  value={key}
                  onChange={(e) => setKey(e.target.value)}
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                >
                  {GENERATABLE_KEYS.map((k) => (
                    <option key={k} value={k}>
                      {k}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-1 text-xs text-slate-600">
                Tempo (BPM)
                <input
                  type="number"
                  min={40}
                  max={220}
                  value={tempo}
                  onChange={(e) => setTempo(Number(e.target.value))}
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
              </label>
              <label className="flex flex-col gap-1 text-xs text-slate-600">
                Longueur
                <select
                  value={bars}
                  onChange={(e) => setBars(Number(e.target.value))}
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                >
                  {BAR_LENGTH_OPTIONS.map((b) => (
                    <option key={b} value={b}>
                      {b} mesures
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <button
              type="button"
              onClick={generate}
              className="mt-4 rounded-full bg-teal-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-teal-700"
            >
              {result ? "🎲 Régénérer une autre mélodie" : "Générer la mélodie"}
            </button>
            <p className="mt-2 text-xs text-slate-500">
              Une marche aléatoire contrainte à la gamme choisie (pas surtout par degrés conjoints,
              quelques respirations, une cadence sur la tonique) — pas un modèle entraîné : chaque clic
              sur « Régénérer » propose une mélodie différente avec les mêmes réglages.
            </p>
          </div>

          {result && (
            <TranscriptionResultPanel
              result={result}
              title={title}
              instrumentId={instrumentId}
              onTempoChange={updateTempo}
              onSave={handleSave}
              isSaving={isSaving}
              saveLabel="Enregistrer cette mélodie"
            />
          )}
        </>
      )}
    </div>
  );
}
