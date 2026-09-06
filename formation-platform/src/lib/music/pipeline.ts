import { detectKey } from "./key";
import { detectNotes, type DetectNotesOptions } from "./pitch";
import { detectTempo } from "./tempo";
import type { Transcription } from "./types";

/** Orchestrates samples -> Transcription. Runs entirely client-side: no
 * audio ever leaves the browser unless the creator explicitly saves the
 * result. */
export function transcribeSamples(
  samples: Float32Array,
  sampleRate: number,
  options?: DetectNotesOptions,
): Transcription {
  const notes = detectNotes(samples, sampleRate, options);
  const tempo = detectTempo(notes);
  const key = detectKey(notes);
  const durationSec = Math.round((samples.length / sampleRate) * 1000) / 1000;

  return { tempo, key, durationSec, notes };
}
