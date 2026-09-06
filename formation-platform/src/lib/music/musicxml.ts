/**
 * Transcription (JSON) -> MusicXML (uncompressed, partwise), readable by
 * MuseScore, Finale, Sibelius, etc.
 *
 * Notes are placed on the same 16th-note grid used for the Strudel export
 * (see quantize.ts) and durations are decomposed into standard note values
 * (whole/half/quarter/eighth/16th, dotted where needed), split and tied at
 * barlines so every measure adds up to exactly one bar of 4/4.
 */

import { getInstrument } from "./instruments";
import { midiToPitchName } from "./pitch";
import { BEATS_PER_BAR, STEPS_PER_BAR, computeGrid, groupNotesOnGrid } from "./quantize";
import type { NoteGroup } from "./quantize";
import type { Transcription } from "./types";

const DIVISIONS_PER_QUARTER = 4; // matches STEPS_PER_BEAT: 1 grid step == 1 division

interface DurationValue {
  steps: number;
  type: string;
  dots: number;
}

// Ordered longest-first; a "16th" (1 step) is always available as a fallback,
// so any positive step count can be decomposed.
const DURATION_TABLE: DurationValue[] = [
  { steps: 16, type: "whole", dots: 0 },
  { steps: 12, type: "half", dots: 1 },
  { steps: 8, type: "half", dots: 0 },
  { steps: 6, type: "quarter", dots: 1 },
  { steps: 4, type: "quarter", dots: 0 },
  { steps: 3, type: "eighth", dots: 1 },
  { steps: 2, type: "eighth", dots: 0 },
  { steps: 1, type: "16th", dots: 0 },
];

interface Segment extends DurationValue {
  startStep: number;
  tieStart: boolean;
  tieStop: boolean;
}

/** Splits a duration into standard note values, never crossing a barline. */
function splitAtBarlines(startStep: number, durationSteps: number): Segment[] {
  const segments: Segment[] = [];
  let pos = startStep;
  let remaining = durationSteps;
  while (remaining > 0) {
    const stepsUntilBarEnd = STEPS_PER_BAR - (pos % STEPS_PER_BAR);
    const cap = Math.min(remaining, stepsUntilBarEnd);
    const value = DURATION_TABLE.find((d) => d.steps <= cap)!;
    segments.push({ ...value, startStep: pos, tieStart: false, tieStop: false });
    pos += value.steps;
    remaining -= value.steps;
  }
  segments.forEach((segment, i) => {
    segment.tieStop = i > 0;
    segment.tieStart = i < segments.length - 1;
  });
  return segments;
}

// Circle of fifths, keyed by tonic pitch class + mode. detectKey() (key.ts)
// only ever names tonics with sharps (never flats), so D#/G#/A# major are
// mapped to the fifths of their conventional enharmonic spelling
// (Eb/Ab/Bb major) — nobody writes a key signature with 8+ sharps.
const FIFTHS_BY_KEY: Record<string, number> = {
  "C major": 0,
  "G major": 1,
  "D major": 2,
  "A major": 3,
  "E major": 4,
  "B major": 5,
  "F# major": 6,
  "C# major": 7,
  "F major": -1,
  "A# major": -2,
  "D# major": -3,
  "G# major": -4,
  "A minor": 0,
  "E minor": 1,
  "B minor": 2,
  "F# minor": 3,
  "C# minor": 4,
  "G# minor": 5,
  "D# minor": 6,
  "A# minor": 7,
  "D minor": -1,
  "G minor": -2,
  "C minor": -3,
  "F minor": -4,
};

function midiToPitchXml(midi: number): { step: string; alter: number; octave: number } {
  const match = midiToPitchName(midi).match(/^([A-G])(#?)(-?\d+)$/);
  if (!match) throw new Error(`Unexpected pitch name for MIDI ${midi}`);
  const [, step, sharp, octave] = match;
  return { step, alter: sharp ? 1 : 0, octave: Number(octave) };
}

function escapeXml(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function noteXml(segment: Segment, pitches: number[] | null, chordIndex: number, voice: number): string {
  const dotsXml = "<dot/>".repeat(segment.dots);
  const tieXml =
    (segment.tieStart ? '<tie type="start"/>' : "") + (segment.tieStop ? '<tie type="stop"/>' : "");
  const tiedNotationsXml =
    segment.tieStart || segment.tieStop
      ? `<notations>${segment.tieStart ? '<tied type="start"/>' : ""}${
          segment.tieStop ? '<tied type="stop"/>' : ""
        }</notations>`
      : "";

  if (!pitches) {
    return `<note><rest/><duration>${segment.steps}</duration><voice>${voice}</voice><type>${segment.type}</type>${dotsXml}</note>`;
  }

  const midi = pitches[chordIndex];
  const { step, alter, octave } = midiToPitchXml(midi);
  return (
    `<note>${chordIndex > 0 ? "<chord/>" : ""}` +
    `<pitch><step>${step}</step>${alter ? `<alter>${alter}</alter>` : ""}<octave>${octave}</octave></pitch>` +
    `<duration>${segment.steps}</duration>${tieXml}<voice>${voice}</voice><type>${segment.type}</type>${dotsXml}${tiedNotationsXml}</note>`
  );
}

interface Placed {
  segment: Segment;
  pitches: number[] | null;
}

/**
 * Assigns each chord/note group to a voice using greedy interval coloring:
 * a group joins the first voice that's already free by the time it starts,
 * or opens a new voice. Needed because Basic Pitch can detect genuinely
 * overlapping notes that don't share the same onset (not a chord, but two
 * notes sounding at once) — a single music staff can't express that as one
 * sequential stream of notes.
 */
function assignVoices(groups: NoteGroup[]): NoteGroup[][] {
  const voices: { endStep: number; groups: NoteGroup[] }[] = [];
  for (const group of groups) {
    const voice = voices.find((v) => v.endStep <= group.step);
    if (voice) {
      voice.groups.push(group);
      voice.endStep = group.step + group.lengthSteps;
    } else {
      voices.push({ endStep: group.step + group.lengthSteps, groups: [group] });
    }
  }
  return voices.map((v) => v.groups);
}

/** Builds a gapless sequence of note/rest segments for one voice, from
 * `fromStep` to `toStep` (silence in between becomes rests). */
function buildVoiceTrack(groups: NoteGroup[], fromStep: number, toStep: number): Placed[] {
  const placed: Placed[] = [];
  let cursor = fromStep;
  for (const group of groups) {
    if (group.step > cursor) {
      for (const segment of splitAtBarlines(cursor, group.step - cursor)) {
        placed.push({ segment, pitches: null });
      }
      cursor = group.step;
    }
    const pitches = group.notes.map((n) => n.midi);
    for (const segment of splitAtBarlines(cursor, group.lengthSteps)) {
      placed.push({ segment, pitches });
    }
    cursor += group.lengthSteps;
  }
  if (cursor < toStep) {
    for (const segment of splitAtBarlines(cursor, toStep - cursor)) {
      placed.push({ segment, pitches: null });
    }
  }
  return placed;
}

export function transcriptionToMusicXml(transcription: Transcription, title: string, instrumentId?: string): string {
  const { tempo, key, durationSec, notes } = transcription;
  const instrument = getInstrument(instrumentId);
  const grid = computeGrid(tempo, durationSec);
  const groups = groupNotesOnGrid(notes, grid);

  const tracks = assignVoices(groups).map((voiceGroups, i) => {
    if (i === 0) return buildVoiceTrack(voiceGroups, 0, grid.gridSteps);
    // Extra (overlapping) voices only appear for the measures they're
    // actually in — pad out to whole measures so each one they touch
    // still sums to a full bar.
    const first = voiceGroups[0].step;
    const last = voiceGroups[voiceGroups.length - 1];
    const lastEnd = last.step + last.lengthSteps;
    const from = first - (first % STEPS_PER_BAR);
    const to = lastEnd + ((STEPS_PER_BAR - (lastEnd % STEPS_PER_BAR)) % STEPS_PER_BAR);
    return buildVoiceTrack(voiceGroups, from, to);
  });

  const totalBars = grid.gridSteps / STEPS_PER_BAR;
  const measuresXml: string[] = [];
  for (let bar = 0; bar < totalBars; bar++) {
    const barStart = bar * STEPS_PER_BAR;
    const barEnd = barStart + STEPS_PER_BAR;

    const voicesXml: string[] = [];
    tracks.forEach((track, voiceIndex) => {
      const barPlaced = track.filter((p) => p.segment.startStep >= barStart && p.segment.startStep < barEnd);
      if (barPlaced.length === 0) return;
      const notesXml = barPlaced
        .map((p) =>
          p.pitches
            ? p.pitches.map((_, i) => noteXml(p.segment, p.pitches, i, voiceIndex + 1)).join("")
            : noteXml(p.segment, null, 0, voiceIndex + 1),
        )
        .join("");
      voicesXml.push(notesXml);
    });
    const barNotesXml = voicesXml.join(`<backup><duration>${STEPS_PER_BAR}</duration></backup>`);

    const attributesXml =
      bar === 0
        ? `<attributes><divisions>${DIVISIONS_PER_QUARTER}</divisions>` +
          `<key><fifths>${FIFTHS_BY_KEY[key] ?? 0}</fifths><mode>${key.endsWith("minor") ? "minor" : "major"}</mode></key>` +
          `<time><beats>${BEATS_PER_BAR}</beats><beat-type>4</beat-type></time>` +
          `<clef>${
            instrument.clef === "bass" ? "<sign>F</sign><line>4</line>" : "<sign>G</sign><line>2</line>"
          }</clef></attributes>`
        : "";

    measuresXml.push(`<measure number="${bar + 1}">${attributesXml}${barNotesXml}</measure>`);
  }

  return (
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<!DOCTYPE score-partwise PUBLIC "-//Recordare//DTD MusicXML 4.0 Partwise//EN" "http://www.musicxml.org/dtds/partwise.dtd">\n` +
    `<score-partwise version="4.0">` +
    `<work><work-title>${escapeXml(title)}</work-title></work>` +
    `<part-list><score-part id="P1"><part-name>${escapeXml(instrument.label)}</part-name></score-part></part-list>` +
    `<part id="P1">${measuresXml.join("")}</part>` +
    `</score-partwise>`
  );
}
