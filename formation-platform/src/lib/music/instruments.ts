/**
 * Instrument presets: purely a presentation/export choice, not something
 * that changes detection (Basic Pitch doesn't take an instrument hint).
 * Picking one just selects a closer-matching Sonic Pi synth, Strudel
 * sound, and MusicXML clef instead of one generic default for everything.
 *
 * Sonic Pi synth keys verified against the official cheatsheet
 * (sonic-pi-net/sonic-pi, etc/doc/cheatsheets/synths.md) — notably
 * `:synthpiano`/`:synthpluck`, not the more guessable `:piano`/`:pluck`.
 * Strudel sample names verified against strudel.cc's own sample browser
 * (the gm_* General MIDI set).
 *
 * "multi" ("Tous les instruments") is a special choice: instead of one
 * instrument for every detected note, exports split the notes by pitch
 * register into several simultaneous voices — see `splitNotesByRegister`
 * in quantize.ts and its uses in strudel.ts/sonicpi.ts/musicxml.ts. Its own
 * synth/sound/clef fields are just the fallback used for a voice that has
 * no other instrument to draw from (there's no per-instrument detection).
 */

export type InstrumentId =
  | "piano"
  | "flute"
  | "basse"
  | "contrebasse"
  | "guitare"
  | "violon"
  | "chant"
  | "saxophone"
  | "trompette"
  | "trombone"
  | "clarinette"
  | "multi"
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
    sonicPiSynth: "synthpiano",
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
    description: "Transcription pour guitare basse (électrique).",
    icon: "🎸",
    sonicPiSynth: "tb303",
    strudelSound: "gm_acoustic_bass",
    clef: "bass",
  },
  {
    id: "contrebasse",
    label: "Contrebasse",
    description: "Transcription pour contrebasse (jazz, cordes frottées/pincées).",
    icon: "🎻",
    sonicPiSynth: "prophet",
    strudelSound: "gm_contrabass",
    clef: "bass",
  },
  {
    id: "guitare",
    label: "Guitare",
    description: "Transcription pour guitare acoustique.",
    icon: "🎸",
    sonicPiSynth: "synthpluck",
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
    id: "trompette",
    label: "Trompette",
    description: "Transcription pour trompette (cuivres jazz).",
    icon: "🎺",
    sonicPiSynth: "dsaw",
    strudelSound: "gm_trumpet",
    clef: "treble",
  },
  {
    id: "trombone",
    label: "Trombone",
    description: "Transcription pour trombone (cuivres jazz).",
    icon: "🎺",
    sonicPiSynth: "dark_ambience",
    strudelSound: "gm_trombone",
    clef: "bass",
  },
  {
    id: "clarinette",
    label: "Clarinette",
    description: "Transcription pour clarinette (bois jazz).",
    icon: "🎵",
    sonicPiSynth: "mod_sine",
    strudelSound: "gm_clarinet",
    clef: "treble",
  },
  {
    id: "multi",
    label: "Tous les instruments",
    description: "Répartit les notes détectées sur plusieurs voix (grave/médium/aigu), comme un petit ensemble.",
    icon: "🎼",
    sonicPiSynth: "synthpiano",
    strudelSound: "gm_piano",
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
