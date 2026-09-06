/**
 * Instrument presets: purely a presentation/export choice, not something
 * that changes detection (Basic Pitch doesn't take an instrument hint).
 * Picking one just selects a closer-matching Sonic Pi synth, Strudel
 * sound, and MusicXML clef instead of one generic default for everything.
 */

export type InstrumentId =
  | "piano"
  | "flute"
  | "basse"
  | "guitare"
  | "violon"
  | "chant"
  | "saxophone"
  | "autre";

export interface InstrumentInfo {
  id: InstrumentId;
  label: string;
  description: string;
  icon: string;
  sonicPiSynth: string;
  strudelSound: string;
  clef: "treble" | "bass";
}

export const INSTRUMENTS: InstrumentInfo[] = [
  {
    id: "piano",
    label: "Piano",
    description: "Transcription pour piano.",
    icon: "🎹",
    sonicPiSynth: "piano",
    strudelSound: "gm_piano",
    clef: "treble",
  },
  {
    id: "flute",
    label: "Flûte",
    description: "Transcription pour flûte.",
    icon: "🪈",
    sonicPiSynth: "beep",
    strudelSound: "gm_flute",
    clef: "treble",
  },
  {
    id: "basse",
    label: "Basse",
    description: "Transcription pour guitare basse.",
    icon: "🎸",
    sonicPiSynth: "tb303",
    strudelSound: "gm_acoustic_bass",
    clef: "bass",
  },
  {
    id: "guitare",
    label: "Guitare",
    description: "Transcription pour guitare acoustique.",
    icon: "🎸",
    sonicPiSynth: "pluck",
    strudelSound: "gm_acoustic_guitar_nylon",
    clef: "treble",
  },
  {
    id: "violon",
    label: "Violon",
    description: "Transcription pour violon.",
    icon: "🎻",
    sonicPiSynth: "saw",
    strudelSound: "gm_violin",
    clef: "treble",
  },
  {
    id: "chant",
    label: "Chant",
    description: "Transcription pour le chant.",
    icon: "🎤",
    sonicPiSynth: "hollow",
    strudelSound: "gm_voice_oohs",
    clef: "treble",
  },
  {
    id: "saxophone",
    label: "Saxophone",
    description: "Transcription pour saxophone.",
    icon: "🎷",
    sonicPiSynth: "growl",
    strudelSound: "gm_soprano_sax",
    clef: "treble",
  },
  {
    id: "autre",
    label: "Autre",
    description: "Instrument non listé, ou percussions.",
    icon: "🎵",
    sonicPiSynth: "fm",
    strudelSound: "piano",
    clef: "treble",
  },
];

const DEFAULT_INSTRUMENT = INSTRUMENTS[INSTRUMENTS.length - 1];

export function getInstrument(id: string | undefined): InstrumentInfo {
  return INSTRUMENTS.find((i) => i.id === id) ?? DEFAULT_INSTRUMENT;
}
