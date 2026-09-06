const PITCH_CLASS_NAMES = [
  "C",
  "C#",
  "D",
  "D#",
  "E",
  "F",
  "F#",
  "G",
  "G#",
  "A",
  "A#",
  "B",
];

export function midiToPitchName(midi: number): string {
  const name = PITCH_CLASS_NAMES[((midi % 12) + 12) % 12];
  const octave = Math.floor(midi / 12) - 1;
  return `${name}${octave}`;
}

/** Lowercase, "s" for sharp — the note-name spelling shared by the Strudel
 * (e.g. "cs4") and Sonic Pi (e.g. ":cs4") code generators. */
export function midiToLowerName(midi: number): string {
  return midiToPitchName(midi).toLowerCase().replace("#", "s");
}
