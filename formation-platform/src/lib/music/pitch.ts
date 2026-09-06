/**
 * Audio -> notes: the hard problem this whole feature exists to solve.
 *
 * Frame-level pitch tracking by normalized autocorrelation (a simplified,
 * single-pitch YIN-style detector), then merging consecutive frames that
 * land on the same MIDI note into discrete Note events. Everything
 * downstream (MIDI/Strudel/Sonic Pi export) is mechanical once we have
 * this list, so this file is deliberately the only place doing signal
 * analysis.
 */

import type { Note } from "./types";

const PITCH_CLASS_NAMES = [
  "C",
  "C#",
  "D",
  "D#",
  "E",
  "F",
  "F#",
  "G",
  "G#",
  "A",
  "A#",
  "B",
];

export function midiToPitchName(midi: number): string {
  const name = PITCH_CLASS_NAMES[((midi % 12) + 12) % 12];
  const octave = Math.floor(midi / 12) - 1;
  return `${name}${octave}`;
}

/**
 * Detect the fundamental frequency of one frame via normalized
 * autocorrelation. Returns null when the frame is silent or has no clear
 * periodicity (unvoiced/noisy).
 */
export function detectPitchInFrame(
  frame: Float32Array,
  sampleRate: number,
  fmin = 65,
  fmax = 1046.5,
): number | null {
  const n = frame.length;

  let energy = 0;
  for (let i = 0; i < n; i++) energy += frame[i] * frame[i];
  const rms = Math.sqrt(energy / n);
  if (rms < 0.01) return null; // silence gate

  const minLag = Math.floor(sampleRate / fmax);
  const maxLag = Math.min(Math.floor(sampleRate / fmin), n - 1);
  if (maxLag <= minLag) return null;

  let bestLag = -1;
  let bestValue = 0;
  const autocorrAt = (lag: number) => {
    let sum = 0;
    for (let i = 0; i < n - lag; i++) sum += frame[i] * frame[i + lag];
    return sum;
  };

  const r0 = autocorrAt(0);
  if (r0 <= 0) return null;

  for (let lag = minLag; lag <= maxLag; lag++) {
    const value = autocorrAt(lag);
    if (value > bestValue) {
      bestValue = value;
      bestLag = lag;
    }
  }

  if (bestLag === -1 || bestValue / r0 < 0.3) return null; // not periodic enough

  // Parabolic interpolation around the peak for sub-sample accuracy.
  const prev = bestLag > minLag ? autocorrAt(bestLag - 1) : bestValue;
  const next = bestLag < maxLag ? autocorrAt(bestLag + 1) : bestValue;
  const denom = prev - 2 * bestValue + next;
  const shift = denom !== 0 ? (0.5 * (prev - next)) / denom : 0;
  const refinedLag = bestLag + shift;

  return sampleRate / refinedLag;
}

export function hzToMidi(freqHz: number): number {
  return 69 + 12 * Math.log2(freqHz / 440);
}

export interface DetectNotesOptions {
  frameSize?: number;
  hopSize?: number;
  fmin?: number;
  fmax?: number;
  minNoteDuration?: number;
}

/** Detect a monophonic sequence of notes across a full waveform. */
export function detectNotes(
  samples: Float32Array,
  sampleRate: number,
  options: DetectNotesOptions = {},
): Note[] {
  const {
    frameSize = 2048,
    hopSize = 256,
    fmin = 65,
    fmax = 1046.5,
    minNoteDuration = 0.08,
  } = options;

  const midiFrames: (number | null)[] = [];
  for (let start = 0; start + frameSize <= samples.length; start += hopSize) {
    const frame = samples.subarray(start, start + frameSize);
    const freq = detectPitchInFrame(frame, sampleRate, fmin, fmax);
    midiFrames.push(freq !== null ? Math.round(hzToMidi(freq)) : null);
  }

  const frameDuration = hopSize / sampleRate;
  const notes: Note[] = [];
  let currentPitch: number | null = null;
  let currentStart = 0;

  const flush = (endTime: number) => {
    if (currentPitch === null) return;
    const duration = endTime - currentStart;
    if (duration >= minNoteDuration) {
      notes.push({
        pitch: midiToPitchName(currentPitch),
        midi: currentPitch,
        start: Math.round(currentStart * 1000) / 1000,
        duration: Math.round(duration * 1000) / 1000,
      });
    }
    currentPitch = null;
  };

  midiFrames.forEach((pitch, i) => {
    const t = i * frameDuration;
    if (pitch !== currentPitch) {
      flush(t);
      if (pitch !== null) {
        currentPitch = pitch;
        currentStart = t;
      }
    }
  });
  flush(midiFrames.length * frameDuration);

  return notes;
}
