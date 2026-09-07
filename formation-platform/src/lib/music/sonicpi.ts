/**
 * Transcription (JSON) -> ready-to-paste Sonic Pi code.
 *
 * Uses readable note symbols (`:cs4`) rather than raw MIDI numbers, and
 * collapses runs of identical repeated events into `N.times do ... end` —
 * purely cosmetic, idiomatic Sonic Pi (the exact pitches/timings are
 * unchanged either way). Melody and drums are independent `live_loop`s:
 * Sonic Pi runs them concurrently on its own clock, the way a real track
 * layers a beat under a melodic line.
 */

import { getInstrument } from "./instruments";
import { midiToLowerName } from "./pitch";
import { splitNotesByRegister } from "./quantize";
import type { DrumType, Transcription } from "./types";

const MIN_SLEEP = 0.05;

// Real Sonic Pi built-in sample names (etc/doc/cheatsheets/samples.md in
// the sonic-pi-net/sonic-pi repo) — generic enough to sound reasonable
// regardless of what the original drum kit actually was.
const DRUM_SAMPLE: Record<DrumType, string> = {
  kick: "drum_bass_hard",
  snare: "drum_snare_hard",
  hihat_closed: "drum_cymbal_closed",
  hihat_open: "drum_cymbal_open",
};

interface Beat {
  line: string;
  sleep: number;
}

interface Run {
  beat: Beat;
  count: number;
}

function compressRuns(beats: Beat[]): Run[] {
  const runs: Run[] = [];
  for (const beat of beats) {
    const last = runs[runs.length - 1];
    if (last && last.beat.line === beat.line && Math.abs(last.beat.sleep - beat.sleep) < 0.01) {
      last.count += 1;
    } else {
      runs.push({ beat, count: 1 });
    }
  }
  return runs;
}

function renderLoop(name: string, leadingWait: number, beats: Beat[], extraLines: string[] = []): string {
  const lines = [`live_loop :${name} do`, ...extraLines.map((l) => `  ${l}`)];

  if (beats.length === 0) {
    lines.push(`  sleep 1`, `end`);
    return lines.join("\n");
  }

  if (leadingWait > 0.01) lines.push(`  sleep ${leadingWait.toFixed(3)}`);

  for (const run of compressRuns(beats)) {
    if (run.count === 1) {
      lines.push(`  ${run.beat.line}`, `  sleep ${run.beat.sleep.toFixed(3)}`);
    } else {
      lines.push(`  ${run.count}.times do`, `    ${run.beat.line}`, `    sleep ${run.beat.sleep.toFixed(3)}`, `  end`);
    }
  }

  lines.push(`end`);
  return lines.join("\n");
}

function melodyBeats(notes: Transcription["notes"], durationSec: number): Beat[] {
  return notes.map((note, i) => {
    const next = notes[i + 1];
    const sleep = Math.max(next ? next.start - note.start : durationSec - note.start, MIN_SLEEP);
    return { line: `play :${midiToLowerName(note.midi)}, release: ${note.duration.toFixed(3)}`, sleep };
  });
}

function drumBeats(transcription: Transcription): Beat[] {
  const { drums, durationSec } = transcription;
  return drums.map((hit, i) => {
    const next = drums[i + 1];
    const sleep = Math.max(next ? next.start - hit.start : durationSec - hit.start, MIN_SLEEP);
    return { line: `sample :${DRUM_SAMPLE[hit.type]}`, sleep };
  });
}

export function transcriptionToSonicPi(transcription: Transcription, instrumentId?: string): string {
  const { tempo, key, durationSec, notes, drums } = transcription;
  const instrument = getInstrument(instrumentId);

  const blocks = [`# Tonalité estimée : ${key}`, `use_bpm ${tempo}`, ""];

  if (notes.length > 0) {
    blocks.push(
      renderLoop("melodie", notes[0].start, melodyBeats(notes, durationSec), [
        `use_synth :${instrument.sonicPiSynth}`,
      ]),
    );
  }
  if (drums.length > 0) {
    if (notes.length > 0) blocks.push("");
    blocks.push(renderLoop("batterie", drums[0].start, drumBeats(transcription)));
  }
  if (notes.length === 0 && drums.length === 0) {
    blocks.push(renderLoop("melodie", 0, []));
  }

  return blocks.join("\n");
}

export function transcriptionToSonicPiMultiVoix(transcription: Transcription, instrumentId?: string): string {
  const { tempo, key, durationSec, notes, drums } = transcription;
  const { grave, medium, aigu } = splitNotesByRegister(notes);

  const voices: Array<{ name: string; notes: Transcription["notes"]; synth: string }> = [
    { name: "grave", notes: grave, synth: getInstrument("basse").sonicPiSynth },
    { name: "medium", notes: medium, synth: getInstrument(instrumentId).sonicPiSynth },
    { name: "aigu", notes: aigu, synth: getInstrument("violon").sonicPiSynth },
  ];

  const blocks = [
    `# Tonalité estimée : ${key}`,
    `# Version "fidèle" : les notes détectées sont réparties par registre`,
    `# (grave/médium/aigu) sur 3 synthés différents pour une texture plus`,
    `# riche — ce n'est pas une vraie séparation des instruments d'origine.`,
    `use_bpm ${tempo}`,
    "",
  ];

  let any = false;
  for (const voice of voices) {
    if (voice.notes.length === 0) continue;
    if (any) blocks.push("");
    blocks.push(
      renderLoop(voice.name, voice.notes[0].start, melodyBeats(voice.notes, durationSec), [
        `use_synth :${voice.synth}`,
      ]),
    );
    any = true;
  }
  if (drums.length > 0) {
    if (any) blocks.push("");
    blocks.push(renderLoop("batterie", drums[0].start, drumBeats(transcription)));
    any = true;
  }
  if (!any) {
    blocks.push(renderLoop("melodie", 0, []));
  }

  return blocks.join("\n");
}
