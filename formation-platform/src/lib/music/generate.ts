/**
 * Generates a new melody from scratch — key/tempo/length in, a
 * Transcription-shaped result out — instead of detecting one from audio.
 * Reuses every downstream piece built for transcription (score, PDF,
 * Strudel/Sonic Pi, MIDI/MusicXML/WAV exports) since the shape is
 * identical: notes + tempo + key + durationSec.
 *
 * The melody itself is a constrained random walk on the chosen scale, not
 * a trained model: small steps most of the time (stepwise motion reads as
 * "melodious"), occasional rests for phrasing, and every phrase resolves
 * back to the tonic for a cadence instead of just stopping. Generation
 * stays instrument-agnostic (same philosophy as detection) — the
 * instrument choice only shapes the exported sound/clef, not these notes.
 */

import { midiToPitchName } from "./pitch";
import { STEPS_PER_BEAT } from "./quantize";
import type { Note, Transcription } from "./types";

const PITCH_CLASS_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
const MAJOR_STEPS = [0, 2, 4, 5, 7, 9, 11];
const MINOR_STEPS = [0, 2, 3, 5, 7, 8, 10];
const HOME_OCTAVE_MIDI = 60; // C4 — a comfortable middle register for any instrument

// One rhythm pattern per bar (in 16th-note steps, summing to STEPS_PER_BAR)
// so a generated melody has a recognizable pulse instead of fully random
// note lengths every step.
const RHYTHM_PATTERNS: number[][] = [
  [4, 4, 4, 4],
  [4, 2, 2, 4, 4],
  [8, 4, 4],
  [2, 2, 4, 2, 2, 4],
  [6, 2, 4, 4],
  [4, 4, 2, 2, 4],
];

export interface MelodyGenerationOptions {
  key: string; // "C major" / "A minor" — same format as detectKey's output
  tempo: number;
  bars: number;
  seed?: number; // omit for a fresh random melody each call
}

function parseKey(key: string): { tonicPc: number; steps: number[] } {
  const match = key.match(/^([A-G]#?) (major|minor)$/);
  if (!match) return { tonicPc: 0, steps: MAJOR_STEPS };
  const tonicPc = PITCH_CLASS_NAMES.indexOf(match[1]);
  return { tonicPc: tonicPc < 0 ? 0 : tonicPc, steps: match[2] === "minor" ? MINOR_STEPS : MAJOR_STEPS };
}

// mulberry32: tiny seeded PRNG so a given seed always reproduces the same
// melody (useful for a "keep this one" flow later); a fresh Date.now()-based
// seed gives a different melody on every "Générer" click otherwise.
function mulberry32(seed: number): () => number {
  let state = seed | 0;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function buildScale(tonicPc: number, steps: number[]): number[] {
  const midis: number[] = [];
  for (let octave = -1; octave <= 1; octave++) {
    for (const step of steps) midis.push(HOME_OCTAVE_MIDI + tonicPc + step + octave * 12);
  }
  return midis.sort((a, b) => a - b);
}

function nearestTonicIndex(scale: number[], tonicPc: number, fromIndex: number): number {
  let best = fromIndex;
  let bestDistance = Infinity;
  scale.forEach((midi, index) => {
    if ((((midi - tonicPc) % 12) + 12) % 12 !== 0) return;
    const distance = Math.abs(index - fromIndex);
    if (distance < bestDistance) {
      bestDistance = distance;
      best = index;
    }
  });
  return best;
}

function stepDegree(rand: () => number, current: number, scaleLength: number): number {
  const r = rand();
  let delta: number;
  if (r < 0.45) delta = rand() < 0.5 ? 1 : -1;
  else if (r < 0.7) delta = rand() < 0.5 ? 2 : -2;
  else if (r < 0.85) delta = 0;
  else delta = rand() < 0.5 ? 3 : -3;
  return Math.max(0, Math.min(scaleLength - 1, current + delta));
}

export function generateMelody({ key, tempo, bars, seed }: MelodyGenerationOptions): Transcription {
  const rand = mulberry32(seed ?? Date.now());
  const { tonicPc, steps } = parseKey(key);
  const scale = buildScale(tonicPc, steps);
  const stepDuration = 60 / tempo / STEPS_PER_BEAT;

  let degreeIndex = nearestTonicIndex(scale, tonicPc, Math.floor(scale.length / 2));
  let stepCursor = 0;
  const notes: Note[] = [];

  for (let bar = 0; bar < bars; bar++) {
    const pattern = RHYTHM_PATTERNS[Math.floor(rand() * RHYTHM_PATTERNS.length)];
    const isLastBar = bar === bars - 1;

    pattern.forEach((lengthSteps, i) => {
      const isFinalNote = isLastBar && i === pattern.length - 1;
      const isRest = !isFinalNote && rand() < 0.12;

      if (!isRest) {
        degreeIndex = isFinalNote ? nearestTonicIndex(scale, tonicPc, degreeIndex) : stepDegree(rand, degreeIndex, scale.length);
        const midi = scale[degreeIndex];
        notes.push({
          pitch: midiToPitchName(midi),
          midi,
          start: Math.round(stepCursor * stepDuration * 1000) / 1000,
          duration: Math.round(lengthSteps * stepDuration * 0.96 * 1000) / 1000,
        });
      }

      stepCursor += lengthSteps;
    });
  }

  const durationSec = Math.round(stepCursor * stepDuration * 1000) / 1000;
  return { tempo, key, durationSec, notes, drums: [] };
}

export const GENERATABLE_KEYS: string[] = PITCH_CLASS_NAMES.flatMap((pc) => [`${pc} major`, `${pc} minor`]);
export const BAR_LENGTH_OPTIONS = [4, 8, 16, 32] as const;
