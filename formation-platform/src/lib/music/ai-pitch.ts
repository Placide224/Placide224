/**
 * Audio -> notes, via Spotify's Basic Pitch (Apache-2.0): a lightweight
 * neural network for polyphonic automatic music transcription, running
 * entirely client-side through TensorFlow.js. It replaces a hand-rolled
 * autocorrelation detector with a real ML model that also picks up chords
 * (not just single-note melodies), which is what actually gets close to
 * reproducing a recording "à l'identique".
 *
 * The model weights are served as static assets from `/public/basic-pitch-model`
 * (copied from the npm package) and fetched lazily by the browser on first use.
 */

import {
  BasicPitch,
  addPitchBendsToNoteEvents,
  noteFramesToTime,
  outputToNotesPoly,
} from "@spotify/basic-pitch";
import { midiToPitchName } from "./pitch";
import type { Note } from "./types";

export const AI_PITCH_SAMPLE_RATE = 22050;

let basicPitch: BasicPitch | null = null;

function getBasicPitch(): BasicPitch {
  if (!basicPitch) {
    basicPitch = new BasicPitch("/basic-pitch-model/model.json");
  }
  return basicPitch;
}

/**
 * Detect notes (monophonic or polyphonic) in a mono waveform already
 * resampled to `AI_PITCH_SAMPLE_RATE`.
 */
export async function detectNotesWithAI(
  samples: Float32Array,
  onProgress?: (percent: number) => void,
): Promise<Note[]> {
  const model = getBasicPitch();

  const frames: number[][] = [];
  const onsets: number[][] = [];
  const contours: number[][] = [];

  await model.evaluateModel(
    samples,
    (f, o, c) => {
      frames.push(...f);
      onsets.push(...o);
      contours.push(...c);
    },
    (percent) => onProgress?.(percent),
  );

  const noteEvents = addPitchBendsToNoteEvents(
    contours,
    outputToNotesPoly(frames, onsets),
  );

  return noteFramesToTime(noteEvents)
    .map((event): Note => {
      const midi = Math.round(event.pitchMidi);
      return {
        pitch: midiToPitchName(midi),
        midi,
        start: Math.round(event.startTimeSeconds * 1000) / 1000,
        duration: Math.round(event.durationSeconds * 1000) / 1000,
      };
    })
    .sort((a, b) => a.start - b.start);
}
