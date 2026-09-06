import { AI_PITCH_SAMPLE_RATE, detectNotesWithAI } from "./ai-pitch";
import { detectDrumHits } from "./drums";
import { detectKey } from "./key";
import { detectTempo } from "./tempo";
import type { Transcription } from "./types";

/**
 * Orchestrates samples -> Transcription. Runs entirely client-side: no
 * audio ever leaves the browser unless the creator explicitly saves the
 * result. `samples` must already be mono, resampled to
 * `AI_PITCH_SAMPLE_RATE` (see decodeToMonoSamples in transcription-studio).
 *
 * Runs both the pitched-note detector (Basic Pitch, for melodies/chords)
 * and the percussion detector (plain DSP, for drums) — they look at
 * different things in the same audio, so a recording with both a melody
 * and a beat gets both back.
 */
export async function transcribeSamples(
  samples: Float32Array,
  onProgress?: (percent: number) => void,
): Promise<Transcription> {
  // Note detection (Basic Pitch, the slower of the two by far) gets the
  // first 85% of the progress bar; drum detection the remaining 15% — so
  // the bar keeps moving instead of sitting still during the second pass.
  const notes = await detectNotesWithAI(samples, (percent) => onProgress?.(percent * 0.85));
  const drums = await detectDrumHits(samples, AI_PITCH_SAMPLE_RATE, (percent) =>
    onProgress?.(0.85 + percent * 0.15),
  );
  const tempo = detectTempo(notes);
  const key = detectKey(notes);
  const durationSec = Math.round((samples.length / AI_PITCH_SAMPLE_RATE) * 1000) / 1000;

  return { tempo, key, durationSec, notes, drums };
}
