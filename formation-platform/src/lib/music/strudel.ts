/**
 * Transcription (JSON) -> ready-to-paste Strudel (strudel.cc) code.
 *
 * `_` elongates the previous step and `~` is a rest, per Strudel's
 * mini-notation; simultaneous notes (chords) use `[a,b,c]`. Each bar is
 * wrapped in `[...]` and all bars in `<...>` so one bar plays per cycle
 * (`setcpm` makes 1 cycle = 1 bar).
 */

import { midiToLowerName } from "./pitch";
import { BEATS_PER_BAR, STEPS_PER_BAR, computeGrid, groupNotesOnGrid } from "./quantize";
import type { Transcription } from "./types";

export function transcriptionToStrudel(transcription: Transcription): string {
  const { tempo, key, durationSec, notes } = transcription;
  const grid = computeGrid(tempo, durationSec);
  const groups = groupNotesOnGrid(notes, grid);

  const steps: string[] = new Array(grid.gridSteps).fill("~");
  for (const group of groups) {
    const pitches = group.notes.map((n) => midiToLowerName(n.midi));
    steps[group.step] = pitches.length === 1 ? pitches[0] : `[${pitches.join(",")}]`;

    // `_` elongates the previous step, so it's only valid within the same
    // bar as the note it's continuing — a bar can't start with a bare `_`.
    // Cap the fill at the current bar's end rather than let it bleed into
    // (and desync) the next bar.
    const barEnd = (Math.floor(group.step / STEPS_PER_BAR) + 1) * STEPS_PER_BAR;
    const fillEnd = Math.min(group.step + group.lengthSteps, grid.gridSteps, barEnd);
    for (let i = group.step + 1; i < fillEnd; i++) {
      steps[i] = "_";
    }
  }

  const bars: string[] = [];
  for (let bar = 0; bar * STEPS_PER_BAR < grid.gridSteps; bar++) {
    const barSteps = steps.slice(bar * STEPS_PER_BAR, (bar + 1) * STEPS_PER_BAR);
    bars.push(`[${barSteps.join(" ")}]`);
  }

  const cyclesPerMinute = Math.round((tempo / BEATS_PER_BAR) * 10) / 10;

  return [
    `// Tonalité estimée : ${key} — ${tempo} BPM`,
    `setcpm(${cyclesPerMinute}) // 1 cycle = 1 mesure de ${BEATS_PER_BAR} temps`,
    `note("<${bars.join(" ")}>").s("piano")`,
  ].join("\n");
}
