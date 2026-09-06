/**
 * Transcription (JSON) -> ready-to-paste Strudel (strudel.cc) code.
 *
 * Notes are quantized onto a 16th-note grid, one bar (4 beats) per Strudel
 * cycle. `_` elongates the previous step and `~` is a rest, per Strudel's
 * mini-notation; each bar is wrapped in `[...]` and all bars are wrapped in
 * `<...>` so one bar plays per cycle (`setcpm` makes 1 cycle = 1 bar).
 */

import { midiToPitchName } from "./pitch";
import type { Transcription } from "./types";

const STEPS_PER_BEAT = 4;
const BEATS_PER_BAR = 4;
const STEPS_PER_BAR = STEPS_PER_BEAT * BEATS_PER_BAR;

function toStrudelNoteName(midi: number): string {
  return midiToPitchName(midi).toLowerCase().replace("#", "s");
}

export function transcriptionToStrudel(transcription: Transcription): string {
  const { tempo, key, durationSec, notes } = transcription;
  const stepDuration = 60 / tempo / STEPS_PER_BEAT;

  const totalSteps = Math.max(STEPS_PER_BAR, Math.ceil(durationSec / stepDuration));
  const totalBars = Math.ceil(totalSteps / STEPS_PER_BAR);
  const gridSteps = totalBars * STEPS_PER_BAR;

  const steps: string[] = new Array(gridSteps).fill("~");

  for (const note of notes) {
    const startStep = Math.round(note.start / stepDuration);
    if (startStep >= gridSteps) continue;
    const lengthSteps = Math.max(1, Math.round(note.duration / stepDuration));

    steps[startStep] = toStrudelNoteName(note.midi);
    for (let i = startStep + 1; i < Math.min(startStep + lengthSteps, gridSteps); i++) {
      steps[i] = "_";
    }
  }

  const bars: string[] = [];
  for (let bar = 0; bar < totalBars; bar++) {
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
