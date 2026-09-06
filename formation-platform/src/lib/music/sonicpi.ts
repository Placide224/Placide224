/**
 * Transcription (JSON) -> ready-to-paste Sonic Pi code.
 *
 * Uses readable note symbols (`:cs4`) rather than raw MIDI numbers, and
 * collapses runs of identical repeated notes into `N.times do ... end` —
 * purely cosmetic, idiomatic Sonic Pi (the exact pitches/timings are
 * unchanged either way).
 */

import { midiToLowerName } from "./pitch";
import type { Transcription } from "./types";

const MIN_SLEEP = 0.05;

interface Beat {
  note: string;
  release: number;
  sleep: number;
}

function buildBeats(transcription: Transcription): Beat[] {
  const { notes, durationSec } = transcription;
  return notes.map((note, i) => {
    const next = notes[i + 1];
    const sleep = Math.max(next ? next.start - note.start : durationSec - note.start, MIN_SLEEP);
    return { note: `:${midiToLowerName(note.midi)}`, release: note.duration, sleep };
  });
}

interface Run {
  beat: Beat;
  count: number;
}

function compressRuns(beats: Beat[]): Run[] {
  const runs: Run[] = [];
  for (const beat of beats) {
    const last = runs[runs.length - 1];
    if (last && last.beat.note === beat.note && Math.abs(last.beat.sleep - beat.sleep) < 0.01) {
      last.count += 1;
    } else {
      runs.push({ beat, count: 1 });
    }
  }
  return runs;
}

export function transcriptionToSonicPi(transcription: Transcription): string {
  const { tempo, key, notes } = transcription;

  const lines: string[] = [
    `# Tonalité estimée : ${key}`,
    `use_bpm ${tempo}`,
    `live_loop :melodie do`,
    `  use_synth :fm`,
  ];

  if (notes.length === 0) {
    lines.push(`  sleep 1`, `end`);
    return lines.join("\n");
  }

  const leadingWait = notes[0].start;
  if (leadingWait > 0.01) lines.push(`  sleep ${leadingWait.toFixed(3)}`);

  for (const run of compressRuns(buildBeats(transcription))) {
    const playLine = `play ${run.beat.note}, release: ${run.beat.release.toFixed(3)}`;
    const sleepLine = `sleep ${run.beat.sleep.toFixed(3)}`;
    if (run.count === 1) {
      lines.push(`  ${playLine}`, `  ${sleepLine}`);
    } else {
      lines.push(`  ${run.count}.times do`, `    ${playLine}`, `    ${sleepLine}`, `  end`);
    }
  }

  lines.push(`end`);
  return lines.join("\n");
}
