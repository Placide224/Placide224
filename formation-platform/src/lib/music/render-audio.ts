/**
 * Transcription (JSON) -> a synthesized WAV preview, so a creator can
 * listen back to what was detected without needing MIDI/Sonic Pi/Strudel
 * software installed. Purely additive: it doesn't feed back into
 * detection, just renders the notes with a simple additive-harmonics
 * synth and a short attack/release envelope to avoid clicks.
 *
 * The instrument choice shapes the synth a little (attack shape, harmonic
 * mix, vibrato, a touch of breath noise for winds, legato pitch-glide
 * between back-to-back notes) so the preview sounds closer to that family
 * of instrument instead of one generic tone for everything — still a
 * synthesized approximation, not a sampled/recorded instrument.
 */

import { getInstrument } from "./instruments";
import type { Transcription } from "./types";

const DEFAULT_SAMPLE_RATE = 44100;

type InstrumentFamily = "breath" | "pluck" | "bow" | "voice" | "bright";

const FAMILY_BY_INSTRUMENT: Record<string, InstrumentFamily> = {
  flute: "breath",
  saxophone: "breath",
  clarinette: "breath",
  trompette: "breath",
  trombone: "breath",
  guitare: "pluck",
  basse: "pluck",
  contrebasse: "pluck",
  violon: "bow",
  chant: "voice",
};

function instrumentFamily(instrumentId?: string): InstrumentFamily {
  return FAMILY_BY_INSTRUMENT[getInstrument(instrumentId).id] ?? "bright";
}

function midiToFreq(midi: number): number {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

function synthesizeNote(
  buffer: Float32Array,
  sampleRate: number,
  midi: number,
  start: number,
  duration: number,
  family: InstrumentFamily,
  glideFromMidi: number | null,
): void {
  const targetFreq = midiToFreq(midi);
  const glideFreq = glideFromMidi != null ? midiToFreq(glideFromMidi) : targetFreq;
  const startSample = Math.max(0, Math.floor(start * sampleRate));
  const endSample = Math.min(buffer.length, Math.ceil((start + duration) * sampleRate));

  const attack = family === "pluck" ? Math.min(0.005, duration / 4) : family === "breath" ? Math.min(0.04, duration / 3) : Math.min(0.015, duration / 4);
  const release = family === "pluck" ? Math.min(0.08, duration / 3) : Math.min(0.05, duration / 3);
  const glideTime = glideFromMidi != null ? Math.min(0.04, duration / 4) : 0;

  // Real wind/bowed/vocal tone wavers slightly once a note is sustained —
  // ramped in so the onset itself stays clean, like a player easing into it.
  const vibratoRate = 5.5;
  const vibratoDepth = family === "breath" || family === "bow" || family === "voice" ? 0.008 : 0;
  const vibratoRampIn = 0.15;

  const harmonics =
    family === "pluck" ? [1, 0.5, 0.25, 0.12] : family === "bright" ? [1, 0.3, 0.15] : [1, 0.35, 0.18, 0.08];

  for (let i = startSample; i < endSample; i++) {
    const t = (i - startSample) / sampleRate;
    const remaining = (endSample - i) / sampleRate;
    let envelope = 1;
    if (t < attack) envelope = t / attack;
    else if (remaining < release) envelope = remaining / release;

    const glidedFreq = glideTime > 0 && t < glideTime ? glideFreq + (targetFreq - glideFreq) * (t / glideTime) : targetFreq;
    const vibratoAmount = vibratoDepth * Math.min(1, t / vibratoRampIn);
    const freq = glidedFreq * (1 + vibratoAmount * Math.sin(2 * Math.PI * vibratoRate * t));

    let tone = 0;
    for (let h = 0; h < harmonics.length; h++) {
      tone += harmonics[h] * Math.sin(2 * Math.PI * freq * (h + 1) * t);
    }
    // A short breathy noise burst at onset, just for winds — mimics the
    // attack of an embouchure/reed catching before the tone settles.
    if (family === "breath" && t < 0.02) {
      tone += (Math.random() * 2 - 1) * 0.15 * (1 - t / 0.02);
    }

    buffer[i] += envelope * tone * 0.22;
  }
}

export function renderTranscriptionToPcm(
  transcription: Transcription,
  sampleRate = DEFAULT_SAMPLE_RATE,
  instrumentId?: string,
): Float32Array {
  const totalSamples = Math.max(1, Math.ceil(transcription.durationSec * sampleRate));
  const buffer = new Float32Array(totalSamples);
  const family = instrumentFamily(instrumentId);

  const notes = transcription.notes;
  for (let i = 0; i < notes.length; i++) {
    const note = notes[i];
    const prev = notes[i - 1];
    // Treat back-to-back notes (near-zero gap) as legato: glide into the
    // new pitch instead of a hard re-attack.
    const glideFromMidi = prev && note.start - (prev.start + prev.duration) < 0.03 ? prev.midi : null;
    synthesizeNote(buffer, sampleRate, note.midi, note.start, note.duration, family, glideFromMidi);
  }

  let peak = 0;
  for (const sample of buffer) peak = Math.max(peak, Math.abs(sample));
  if (peak > 1) {
    const scale = 0.98 / peak;
    for (let i = 0; i < buffer.length; i++) buffer[i] *= scale;
  }

  return buffer;
}

export function pcmToWavBytes(samples: Float32Array, sampleRate = DEFAULT_SAMPLE_RATE): Uint8Array {
  const pcm = new Int16Array(samples.length);
  for (let i = 0; i < samples.length; i++) {
    pcm[i] = Math.round(Math.max(-1, Math.min(1, samples[i])) * 32767);
  }

  const dataSize = pcm.length * 2;
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);

  const writeString = (offset: number, value: string) => {
    for (let i = 0; i < value.length; i++) view.setUint8(offset + i, value.charCodeAt(i));
  };

  writeString(0, "RIFF");
  view.setUint32(4, 36 + dataSize, true);
  writeString(8, "WAVE");
  writeString(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, 1, true); // mono
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true); // byte rate
  view.setUint16(32, 2, true); // block align
  view.setUint16(34, 16, true); // bits per sample
  writeString(36, "data");
  view.setUint32(40, dataSize, true);
  new Int16Array(buffer, 44).set(pcm);

  return new Uint8Array(buffer);
}

export function transcriptionToWav(transcription: Transcription, instrumentId?: string): Uint8Array {
  return pcmToWavBytes(renderTranscriptionToPcm(transcription, DEFAULT_SAMPLE_RATE, instrumentId));
}
