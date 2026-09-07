/**
 * Transcription (JSON) -> ready-to-paste Strudel (strudel.cc) code.
 *
 * `_` elongates the previous step and `~` is a rest, per Strudel's
 * mini-notation; simultaneous notes (chords) use `[a,b,c]`. Each bar is
 * wrapped in `[...]` and all bars in `<...>` so one bar plays per cycle
 * (`setcpm` makes 1 cycle = 1 bar). Melody and drums are independent `$:`
 * pattern blocks — Strudel plays every `$:` block in a file at once, the
 * way the editor's own starter pattern layers a beat under a bassline.
 */

import { getInstrument } from "./instruments";
import { midiToLowerName } from "./pitch";
import { BEATS_PER_BAR, STEPS_PER_BAR, computeGrid, groupNotesOnGrid, splitNotesByRegister } from "./quantize";
import type { Grid } from "./quantize";
import type { DrumHit, DrumType, Transcription } from "./types";

// Roland TR-909 sample bank (built into Strudel) — a generic drum-machine
// stand-in regardless of what the original kit actually was.
const DRUM_TOKEN: Record<DrumType, string> = {
  kick: "bd",
  snare: "sd",
  hihat_closed: "hh",
  hihat_open: "oh",
};

function stepsToBars(steps: string[]): string {
  const bars: string[] = [];
  for (let bar = 0; bar * STEPS_PER_BAR < steps.length; bar++) {
    bars.push(`[${steps.slice(bar * STEPS_PER_BAR, (bar + 1) * STEPS_PER_BAR).join(" ")}]`);
  }
  return `<${bars.join(" ")}>`;
}

function melodyPattern(notes: Transcription["notes"], grid: Grid): string {
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

  return stepsToBars(steps);
}

function drumPattern(hits: DrumHit[], grid: Grid, token: string): string {
  const steps: string[] = new Array(grid.gridSteps).fill("~");
  for (const hit of hits) {
    const step = Math.round(hit.start / grid.stepDuration);
    if (step < grid.gridSteps) steps[step] = token;
  }
  return stepsToBars(steps);
}

function drumLines(drums: DrumHit[], grid: Grid): string[] {
  const lines: string[] = [];
  for (const type of Object.keys(DRUM_TOKEN) as DrumType[]) {
    const hits = drums.filter((d) => d.type === type);
    if (hits.length === 0) continue;
    lines.push(`$: s("${drumPattern(hits, grid, DRUM_TOKEN[type])}").bank("tr909")`);
  }
  return lines;
}

export function transcriptionToStrudel(transcription: Transcription, instrumentId?: string): string {
  const { tempo, key, durationSec, notes, drums } = transcription;
  const grid = computeGrid(tempo, durationSec);
  const cyclesPerMinute = Math.round((tempo / BEATS_PER_BAR) * 10) / 10;
  const instrument = getInstrument(instrumentId);

  const patternLines: string[] = [];
  if (notes.length > 0) {
    patternLines.push(`$: note("${melodyPattern(notes, grid)}").s("${instrument.strudelSound}")`);
  }
  patternLines.push(...drumLines(drums, grid));
  if (patternLines.length === 0) {
    patternLines.push(`$: s("~")`);
  }

  return [
    `// Tonalité estimée : ${key} — ${tempo} BPM`,
    `setcpm(${cyclesPerMinute}) // 1 cycle = 1 mesure de ${BEATS_PER_BAR} temps`,
    ...patternLines,
  ].join("\n");
}

export function transcriptionToStrudelMultiVoix(transcription: Transcription, instrumentId?: string): string {
  const { tempo, key, durationSec, notes, drums } = transcription;
  const grid = computeGrid(tempo, durationSec);
  const cyclesPerMinute = Math.round((tempo / BEATS_PER_BAR) * 10) / 10;
  const { grave, medium, aigu } = splitNotesByRegister(notes);

  const voices: Array<{ notes: Transcription["notes"]; sound: string }> = [
    { notes: grave, sound: getInstrument("basse").strudelSound },
    { notes: medium, sound: getInstrument(instrumentId).strudelSound },
    { notes: aigu, sound: getInstrument("violon").strudelSound },
  ];

  const patternLines: string[] = [];
  for (const voice of voices) {
    if (voice.notes.length === 0) continue;
    patternLines.push(`$: note("${melodyPattern(voice.notes, grid)}").s("${voice.sound}")`);
  }
  patternLines.push(...drumLines(drums, grid));
  if (patternLines.length === 0) {
    patternLines.push(`$: s("~")`);
  }

  return [
    `// Tonalité estimée : ${key} — ${tempo} BPM`,
    `// Version "fidèle" : les notes détectées sont réparties par registre`,
    `// (grave/médium/aigu) sur 3 sons différents pour une texture plus`,
    `// riche — ce n'est pas une vraie séparation des instruments d'origine.`,
    `setcpm(${cyclesPerMinute}) // 1 cycle = 1 mesure de ${BEATS_PER_BAR} temps`,
    ...patternLines,
  ].join("\n");
}
