import { AI_PITCH_SAMPLE_RATE, detectNotesWithAI } from "./ai-pitch";
import { detectKey } from "./key";
import { detectTempo } from "./tempo";
import type { Transcription } from "./types";

/**
 * Orchestrates samples -> Transcription. Runs entirely client-side: no
 * audio ever leaves the browser unless the creator explicitly saves the
 * result. `samples` must already be mono, resampled to
 * `AI_PITCH_SAMPLE_RATE` (see decodeToMonoSamples in transcription-studio).
 */
export async function transcribeSamples(
  samples: Float32Array,
  onProgress?: (percent: number) => void,
): Promise<Transcription> {
  const notes = await detectNotesWithAI(samples, onProgress);
  const tempo = detectTempo(notes);
  const key = detectKey(notes);
  const durationSec = Math.round((samples.length / AI_PITCH_SAMPLE_RATE) * 1000) / 1000;

  return { tempo, key, durationSec, notes };
}
