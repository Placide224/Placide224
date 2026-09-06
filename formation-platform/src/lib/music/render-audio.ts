/**
 * Transcription (JSON) -> a synthesized WAV preview, so a creator can
 * listen back to what was detected without needing MIDI/Sonic Pi/Strudel
 * software installed. Purely additive: it doesn't feed back into
 * detection, just renders the notes with a simple additive-harmonics
 * synth and a short attack/release envelope to avoid clicks.
 */

import type { Transcription } from "./types";

const DEFAULT_SAMPLE_RATE = 44100;

function synthesizeNote(
  buffer: Float32Array,
  sampleRate: number,
  midi: number,
  start: number,
  duration: number,
): void {
  const freq = 440 * Math.pow(2, (midi - 69) / 12);
  const startSample = Math.max(0, Math.floor(start * sampleRate));
  const endSample = Math.min(buffer.length, Math.ceil((start + duration) * sampleRate));
  const attack = Math.min(0.01, duration / 4);
  const release = Math.min(0.05, duration / 3);

  for (let i = startSample; i < endSample; i++) {
    const t = (i - startSample) / sampleRate;
    const remaining = (endSample - i) / sampleRate;
    let envelope = 1;
    if (t < attack) envelope = t / attack;
    else if (remaining < release) envelope = remaining / release;

    const tone =
      Math.sin(2 * Math.PI * freq * t) +
      0.3 * Math.sin(2 * Math.PI * freq * 2 * t) +
      0.15 * Math.sin(2 * Math.PI * freq * 3 * t);

    buffer[i] += envelope * tone * 0.25;
  }
}

export function renderTranscriptionToPcm(
  transcription: Transcription,
  sampleRate = DEFAULT_SAMPLE_RATE,
): Float32Array {
  const totalSamples = Math.max(1, Math.ceil(transcription.durationSec * sampleRate));
  const buffer = new Float32Array(totalSamples);

  for (const note of transcription.notes) {
    synthesizeNote(buffer, sampleRate, note.midi, note.start, note.duration);
  }

  let peak = 0;
  for (const sample of buffer) peak = Math.max(peak, Math.abs(sample));
  if (peak > 1) {
    const scale = 0.98 / peak;
    for (let i = 0; i < buffer.length; i++) buffer[i] *= scale;
  }

  return buffer;
}

export function pcmToWavBytes(samples: Float32Array, sampleRate = DEFAULT_SAMPLE_RATE): Uint8Array {
  const pcm = new Int16Array(samples.length);
  for (let i = 0; i < samples.length; i++) {
    pcm[i] = Math.round(Math.max(-1, Math.min(1, samples[i])) * 32767);
  }

  const dataSize = pcm.length * 2;
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);

  const writeString = (offset: number, value: string) => {
    for (let i = 0; i < value.length; i++) view.setUint8(offset + i, value.charCodeAt(i));
  };

  writeString(0, "RIFF");
  view.setUint32(4, 36 + dataSize, true);
  writeString(8, "WAVE");
  writeString(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, 1, true); // mono
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true); // byte rate
  view.setUint16(32, 2, true); // block align
  view.setUint16(34, 16, true); // bits per sample
  writeString(36, "data");
  view.setUint32(40, dataSize, true);
  new Int16Array(buffer, 44).set(pcm);

  return new Uint8Array(buffer);
}

export function transcriptionToWav(transcription: Transcription): Uint8Array {
  return pcmToWavBytes(renderTranscriptionToPcm(transcription));
}
