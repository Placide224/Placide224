/**
 * Percussion detection: onsets + a kick/snare/hi-hat classifier.
 *
 * Basic Pitch (ai-pitch.ts) is built for pitched instruments — fed a drum
 * loop it just hallucinates pseudo-notes from the transients. Drums need a
 * different approach entirely: spectral-flux onset detection (find the
 * transient attacks) followed by a spectral heuristic per onset (where is
 * the energy — low/mid/high, does it ring out or die immediately) to tell
 * a kick from a snare from a hi-hat. Pure DSP, hand-rolled (including the
 * FFT) so this has no dependency beyond what's already in the repo.
 */

import type { DrumHit, DrumType } from "./types";

const FRAME_SIZE = 1024;
const HOP_SIZE = 256;
const ANALYSIS_WINDOW = 1024;
const MIN_ONSET_GAP_SEC = 0.05;
const PEAK_WINDOW_RADIUS = 10; // frames, for adaptive threshold
const DECAY_OFFSET_SEC = 0.1;

/** In-place iterative radix-2 Cooley-Tukey FFT. `real`/`imag` length must
 * be a power of 2. */
function fft(real: Float64Array, imag: Float64Array): void {
  const n = real.length;
  for (let i = 1, j = 0; i < n; i++) {
    let bit = n >> 1;
    for (; j & bit; bit >>= 1) j ^= bit;
    j ^= bit;
    if (i < j) {
      [real[i], real[j]] = [real[j], real[i]];
      [imag[i], imag[j]] = [imag[j], imag[i]];
    }
  }

  for (let len = 2; len <= n; len <<= 1) {
    const angle = (-2 * Math.PI) / len;
    const wReal = Math.cos(angle);
    const wImag = Math.sin(angle);
    for (let i = 0; i < n; i += len) {
      let curReal = 1;
      let curImag = 0;
      for (let j = 0; j < len / 2; j++) {
        const uReal = real[i + j];
        const uImag = imag[i + j];
        const vReal = real[i + j + len / 2] * curReal - imag[i + j + len / 2] * curImag;
        const vImag = real[i + j + len / 2] * curImag + imag[i + j + len / 2] * curReal;
        real[i + j] = uReal + vReal;
        imag[i + j] = uImag + vImag;
        real[i + j + len / 2] = uReal - vReal;
        imag[i + j + len / 2] = uImag - vImag;
        const nextReal = curReal * wReal - curImag * wImag;
        const nextImag = curReal * wImag + curImag * wReal;
        curReal = nextReal;
        curImag = nextImag;
      }
    }
  }
}

function hannWindow(size: number): Float64Array {
  const w = new Float64Array(size);
  for (let i = 0; i < size; i++) w[i] = 0.5 - 0.5 * Math.cos((2 * Math.PI * i) / (size - 1));
  return w;
}

const ANALYSIS_HANN = hannWindow(ANALYSIS_WINDOW);
const FRAME_HANN = hannWindow(FRAME_SIZE);

function magnitudeSpectrum(windowedFrame: Float64Array): Float64Array {
  const n = windowedFrame.length;
  const real = Float64Array.from(windowedFrame);
  const imag = new Float64Array(n);
  fft(real, imag);
  const mags = new Float64Array(n / 2);
  for (let i = 0; i < n / 2; i++) mags[i] = Math.hypot(real[i], imag[i]);
  return mags;
}

function windowedFrameAt(
  samples: Float32Array,
  startSample: number,
  size: number,
  window: Float64Array,
): Float64Array {
  const frame = new Float64Array(size);
  for (let i = 0; i < size; i++) {
    const idx = startSample + i;
    frame[i] = idx >= 0 && idx < samples.length ? samples[idx] * window[i] : 0;
  }
  return frame;
}

function totalEnergy(spectrum: Float64Array): number {
  let sum = 0;
  for (const v of spectrum) sum += v;
  return sum;
}

function bandEnergy(spectrum: Float64Array, sampleRate: number, size: number, fLow: number, fHigh: number): number {
  const binHz = sampleRate / size;
  const loBin = Math.max(0, Math.floor(fLow / binHz));
  const hiBin = Math.min(spectrum.length, Math.ceil(fHigh / binHz));
  let sum = 0;
  for (let b = loBin; b < hiBin; b++) sum += spectrum[b];
  return sum;
}

function spectralCentroid(spectrum: Float64Array, sampleRate: number, size: number): number {
  const binHz = sampleRate / size;
  let weighted = 0;
  let total = 0;
  for (let b = 0; b < spectrum.length; b++) {
    weighted += b * binHz * spectrum[b];
    total += spectrum[b];
  }
  return total > 0 ? weighted / total : 0;
}

function classifyHit(samples: Float32Array, sampleRate: number, startSample: number): DrumType {
  const early = magnitudeSpectrum(windowedFrameAt(samples, startSample, ANALYSIS_WINDOW, ANALYSIS_HANN));
  const late = magnitudeSpectrum(
    windowedFrameAt(samples, startSample + Math.round(DECAY_OFFSET_SEC * sampleRate), ANALYSIS_WINDOW, ANALYSIS_HANN),
  );

  // Centroid (energy-weighted average frequency) is the standard feature
  // for this: unlike a raw band-energy sum, it isn't biased by how wide a
  // frequency band happens to be, which matters because noise-heavy hits
  // (snare, hi-hat) both have real energy above 3kHz — what tells them
  // apart is *where the energy is centered*, not just "is there any up
  // there".
  const earlyTotal = totalEnergy(early) || 1e-9;
  const lowRatio = bandEnergy(early, sampleRate, ANALYSIS_WINDOW, 20, 150) / earlyTotal;
  const centroid = spectralCentroid(early, sampleRate, ANALYSIS_WINDOW);
  const decayRatio = totalEnergy(late) / earlyTotal;

  if (lowRatio > 0.4 || centroid < 300) return "kick";
  if (centroid > 4000) return decayRatio > 0.25 ? "hihat_open" : "hihat_closed";
  return "snare";
}

function pickPeaks(flux: Float64Array, sampleRate: number): number[] {
  const n = flux.length;
  const minGapFrames = Math.max(1, Math.ceil((MIN_ONSET_GAP_SEC * sampleRate) / HOP_SIZE));
  const peaks: number[] = [];
  let lastPeak = -Infinity;

  for (let i = 1; i < n - 1; i++) {
    const lo = Math.max(0, i - PEAK_WINDOW_RADIUS);
    const hi = Math.min(n, i + PEAK_WINDOW_RADIUS + 1);
    let mean = 0;
    for (let j = lo; j < hi; j++) mean += flux[j];
    mean /= hi - lo;
    let variance = 0;
    for (let j = lo; j < hi; j++) variance += (flux[j] - mean) ** 2;
    const std = Math.sqrt(variance / (hi - lo));
    const threshold = mean + 2 * std;

    // A purely relative threshold degenerates to ~0 in an exactly-silent
    // neighborhood (mean and std both collapse), so also require an
    // absolute minimum — small enough to never matter for a real hit, but
    // enough to ignore FFT/windowing noise floor in true silence.
    const isLocalMax =
      flux[i] > threshold && flux[i] > 1e-3 && flux[i] > flux[i - 1] && flux[i] >= flux[i + 1];
    if (isLocalMax && i - lastPeak >= minGapFrames) {
      peaks.push(i);
      lastPeak = i;
    }
  }
  return peaks;
}

export function detectDrumHits(samples: Float32Array, sampleRate: number): DrumHit[] {
  const numFrames = Math.floor((samples.length - FRAME_SIZE) / HOP_SIZE) + 1;
  if (numFrames < 3) return [];

  // Log-compress magnitudes before differencing ("log flux"): without it,
  // a loud transient's own decay tail still produces small-but-nonzero
  // frame-to-frame differences that read as a second onset once an
  // adaptive threshold normalizes to the (very quiet) local neighborhood.
  // Compression flattens that out while still highlighting genuine attacks.
  const spectra: Float64Array[] = new Array(numFrames);
  for (let f = 0; f < numFrames; f++) {
    const mags = magnitudeSpectrum(windowedFrameAt(samples, f * HOP_SIZE, FRAME_SIZE, FRAME_HANN));
    for (let bin = 0; bin < mags.length; bin++) mags[bin] = Math.log1p(mags[bin] * 50);
    spectra[f] = mags;
  }

  // Compare each bin against the *max* of a small neighborhood in the
  // previous frame (not just the same bin) before differencing. A real
  // attack raises energy across many bins at once and still shows up;
  // a slow pitch glide (e.g. an 808-style kick sweeping down in
  // frequency) just shifts energy between neighboring bins over time and
  // gets filtered out instead of registering as a second onset.
  const NEIGHBORHOOD = 3;
  const flux = new Float64Array(numFrames);
  for (let f = 1; f < numFrames; f++) {
    let sum = 0;
    const prev = spectra[f - 1];
    const cur = spectra[f];
    for (let bin = 0; bin < cur.length; bin++) {
      let prevMax = 0;
      for (let d = -NEIGHBORHOOD; d <= NEIGHBORHOOD; d++) {
        const b = bin + d;
        if (b >= 0 && b < prev.length) prevMax = Math.max(prevMax, prev[b]);
      }
      const diff = cur[bin] - prevMax;
      if (diff > 0) sum += diff;
    }
    flux[f] = sum;
  }

  return pickPeaks(flux, sampleRate).map((frameIndex) => {
    const startSample = frameIndex * HOP_SIZE;
    return {
      type: classifyHit(samples, sampleRate, startSample),
      start: Math.round((startSample / sampleRate) * 1000) / 1000,
    };
  });
}
