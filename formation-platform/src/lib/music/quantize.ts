/**
 * Shared time-quantization used by every export that needs a musical grid
 * (Strudel, MusicXML): notes are snapped onto 16th-note steps, one bar of
 * 4 beats per cycle/measure, and simultaneous onsets are grouped into
 * chords so polyphonic transcriptions (Basic Pitch can detect chords, not
 * just single-line melodies) don't lose notes to a monophonic grid.
 */

import type { Note } from "./types";

export const STEPS_PER_BEAT = 4;
export const BEATS_PER_BAR = 4;
export const STEPS_PER_BAR = STEPS_PER_BEAT * BEATS_PER_BAR;

export interface Grid {
  stepDuration: number; // seconds per 16th-note step
  gridSteps: number; // total steps, rounded up to full bars
}

export function computeGrid(tempo: number, durationSec: number): Grid {
  const stepDuration = 60 / tempo / STEPS_PER_BEAT;
  const totalSteps = Math.max(STEPS_PER_BAR, Math.ceil(durationSec / stepDuration));
  const totalBars = Math.ceil(totalSteps / STEPS_PER_BAR);
  return { stepDuration, gridSteps: totalBars * STEPS_PER_BAR };
}

export interface NoteGroup {
  step: number;
  lengthSteps: number;
  notes: Note[];
}

/** Groups notes that share a quantized onset step into chords, sorted by step. */
export function groupNotesOnGrid(notes: Note[], grid: Grid): NoteGroup[] {
  const groups = new Map<number, Note[]>();
  for (const note of notes) {
    const step = Math.round(note.start / grid.stepDuration);
    if (step >= grid.gridSteps) continue;
    const existing = groups.get(step);
    if (existing) existing.push(note);
    else groups.set(step, [note]);
  }

  return Array.from(groups.entries())
    .map(([step, groupNotes]) => ({
      step,
      lengthSteps: Math.max(1, ...groupNotes.map((n) => Math.round(n.duration / grid.stepDuration))),
      notes: groupNotes,
    }))
    .sort((a, b) => a.step - b.step);
}

/**
 * Basic Pitch detects polyphony (chords) but has no notion of which
 * original instrument played which note — there's no source separation
 * here. Splitting the same detected notes into 3 registers instead gives
 * a practical, honest approximation of "several instruments": each
 * register becomes its own simultaneous voice with its own sound, for a
 * fuller texture built from the same data (see instruments.ts, id "multi").
 */
export const REGISTER_SPLIT = { bassMax: 55, trebleMin: 72 }; // G3 / C5

export function splitNotesByRegister(notes: Note[]): { grave: Note[]; medium: Note[]; aigu: Note[] } {
  return {
    grave: notes.filter((n) => n.midi < REGISTER_SPLIT.bassMax),
    medium: notes.filter((n) => n.midi >= REGISTER_SPLIT.bassMax && n.midi < REGISTER_SPLIT.trebleMin),
    aigu: notes.filter((n) => n.midi >= REGISTER_SPLIT.trebleMin),
  };
}
