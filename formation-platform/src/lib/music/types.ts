export interface Note {
  pitch: string; // scientific pitch notation, e.g. "C#4"
  midi: number; // MIDI note number, 0-127
  start: number; // seconds from the start of the audio
  duration: number; // seconds
}

export interface Transcription {
  tempo: number; // BPM
  key: string; // e.g. "F# minor"
  durationSec: number;
  notes: Note[];
}
