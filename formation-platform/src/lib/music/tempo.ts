/**
 * Tempo estimation from note onsets: take the inter-onset intervals,
 * fold octave-related durations (double/half note vs. quarter note) into
 * a common range, and use the median as the beat length.
 */

import type { Note } from "./types";

export function detectTempo(notes: Note[]): number {
  if (notes.length < 2) return 120;

  const iois: number[] = [];
  for (let i = 1; i < notes.length; i++) {
    const ioi = notes[i].start - notes[i - 1].start;
    if (ioi > 0.05) iois.push(ioi);
  }
  if (iois.length === 0) return 120;

  // Fold every interval into the plausible beat range [0.25s, 1.2s]
  // (50-240 BPM) by repeated doubling/halving.
  const folded = iois.map((ioi) => {
    let value = ioi;
    while (value < 0.25) value *= 2;
    while (value > 1.2) value /= 2;
    return value;
  });

  folded.sort((a, b) => a - b);
  const median = folded[Math.floor(folded.length / 2)];

  return Math.round((60 / median) * 10) / 10;
}
