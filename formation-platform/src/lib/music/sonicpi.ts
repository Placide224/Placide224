/**
 * Transcription (JSON) -> ready-to-paste Sonic Pi code.
 *
 * `play` takes the raw MIDI note number directly (Sonic Pi's numbering
 * matches MIDI, e.g. 60 = middle C), which sidesteps any sharp/flat
 * spelling ambiguity; the note's scientific-pitch name is kept as a
 * trailing comment for readability.
 */

import type { Transcription } from "./types";

const MIN_SLEEP = 0.05;

export function transcriptionToSonicPi(transcription: Transcription): string {
  const { tempo, key, durationSec, notes } = transcription;

  const lines: string[] = [
    `# Tonalité estimée : ${key}`,
    `use_bpm ${tempo}`,
    `live_loop :melodie do`,
  ];

  let cursor = 0;
  notes.forEach((note, i) => {
    const wait = note.start - cursor;
    if (wait > 0.01) lines.push(`  sleep ${wait.toFixed(3)}`);

    lines.push(`  play ${note.midi}, release: ${note.duration.toFixed(3)} # ${note.pitch}`);

    const next = notes[i + 1];
    const advance = Math.max(
      next ? next.start - note.start : durationSec - note.start,
      MIN_SLEEP,
    );
    lines.push(`  sleep ${advance.toFixed(3)}`);
    cursor = note.start + advance;
  });

  lines.push(`end`);
  return lines.join("\n");
}
