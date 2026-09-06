/**
 * Key estimation with the Krumhansl-Schmuckler algorithm: build a
 * pitch-class histogram weighted by note duration, then correlate it
 * against the textbook major/minor tonal-hierarchy profiles and keep the
 * best-matching tonic/mode.
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

// Krumhansl & Kessler (1982) tonal hierarchy profiles.
const MAJOR_PROFILE = [6.35, 2.23, 3.48, 2.33, 4.38, 4.09, 2.52, 5.19, 2.39, 3.66, 2.29, 2.88];
const MINOR_PROFILE = [6.33, 2.68, 3.52, 5.38, 2.6, 3.53, 2.54, 4.75, 3.98, 2.69, 3.34, 3.17];

function correlate(a: number[], b: number[]): number {
  const meanA = a.reduce((s, v) => s + v, 0) / a.length;
  const meanB = b.reduce((s, v) => s + v, 0) / b.length;
  let num = 0;
  let denomA = 0;
  let denomB = 0;
  for (let i = 0; i < a.length; i++) {
    num += (a[i] - meanA) * (b[i] - meanB);
    denomA += (a[i] - meanA) ** 2;
    denomB += (b[i] - meanB) ** 2;
  }
  const denom = Math.sqrt(denomA * denomB);
  return denom === 0 ? 0 : num / denom;
}

function rotate(profile: number[], shift: number): number[] {
  return profile.map((_, i) => profile[(i - shift + 12) % 12]);
}

export function detectKey(notes: Note[]): string {
  const histogram = new Array(12).fill(0);
  for (const note of notes) {
    histogram[((note.midi % 12) + 12) % 12] += note.duration;
  }

  if (histogram.every((v) => v === 0)) return "C major";

  let bestScore = -Infinity;
  let bestKey = "C major";
  for (let shift = 0; shift < 12; shift++) {
    const tonic = PITCH_CLASS_NAMES[shift];
    const majorScore = correlate(histogram, rotate(MAJOR_PROFILE, shift));
    const minorScore = correlate(histogram, rotate(MINOR_PROFILE, shift));
    if (majorScore > bestScore) {
      bestScore = majorScore;
      bestKey = `${tonic} major`;
    }
    if (minorScore > bestScore) {
      bestScore = minorScore;
      bestKey = `${tonic} minor`;
    }
  }

  return bestKey;
}
