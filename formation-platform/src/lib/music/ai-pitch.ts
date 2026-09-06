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

import * as tf from "@tensorflow/tfjs";
import type { BackendWasm } from "@tensorflow/tfjs-backend-wasm";
import { setWasmPaths } from "@tensorflow/tfjs-backend-wasm";
import "@tensorflow/tfjs-backend-wasm";
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
let backendReady: Promise<void> | null = null;

/**
 * `@tensorflow/tfjs-backend-wasm@3.21.0`'s own "Fill" kernel forgets to
 * default a missing `dtype` attr to "float32" before computing
 * `bytesPerElement`, and throws "Unknown dtype undefined" instead — and
 * `tf.signal.frame` (used by Basic Pitch's own audio-framing step, see
 * `BasicPitch.prepareData` in `@spotify/basic-pitch`) calls the padding
 * `fill()` op without an explicit dtype, so every WASM-backed
 * transcription hit this immediately (verified against
 * node_modules/@tensorflow/tfjs-backend-wasm/dist/kernels/Fill.js and the
 * full failure stack). This re-registers a corrected version — same
 * logic, just with the default applied — so the WASM backend stays usable
 * for machines without WebGL. Safe to drop once upstream fixes it.
 */
function patchWasmFillKernel(): void {
  tf.unregisterKernel("Fill", "wasm");
  tf.registerKernel({
    kernelName: "Fill",
    backendName: "wasm",
    kernelFunc: (args) => {
      const { attrs, backend } = args as unknown as {
        attrs: { shape: number[]; value: number; dtype?: tf.DataType };
        backend: BackendWasm;
      };
      const dtype = attrs.dtype ?? "float32";
      const out = backend.makeOutput(attrs.shape, dtype);
      backend.typedArrayFromHeap(out).fill(attrs.value);
      return out;
    },
  });
}

/**
 * `@tensorflow/tfjs` picks a backend automatically, and silently falls back
 * to the plain-JS "cpu" backend whenever WebGL isn't available (hardware
 * acceleration disabled, too many WebGL contexts already open, limited GPU
 * driver...). That backend runs every model op synchronously on the main
 * thread with no GPU offload, so a multi-minute file can block the tab for
 * minutes at a time per inference step — exactly the "frozen, stuck at 0%"
 * symptom real users hit. WASM is a much faster, GPU-independent fallback
 * (near-native, SIMD/threaded when the browser allows it), so it goes
 * between WebGL and the slow "cpu" backend rather than skipping straight to it.
 */
function ensureFastBackend(): Promise<void> {
  if (!backendReady) {
    backendReady = (async () => {
      setWasmPaths("/tfjs-wasm/");
      patchWasmFillKernel();
      for (const backend of ["webgl", "wasm", "cpu"]) {
        try {
          await tf.setBackend(backend);
          await tf.ready();
          if (tf.getBackend() === backend) {
            console.info(`[transcription] moteur TensorFlow.js : ${backend}`);
            return;
          }
        } catch {
          // try the next backend
        }
      }
    })();
  }
  return backendReady;
}

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
  await ensureFastBackend();
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
