/**
 * Transcription (JSON) -> Standard MIDI File (format 0), written by hand
 * against the SMF spec so the export has no native/binary dependency
 * (important for a Vercel serverless deployment).
 */

import type { Transcription } from "./types";

const TICKS_PER_QUARTER_NOTE = 480;

function variableLengthQuantity(value: number): number[] {
  let buffer = value & 0x7f;
  const bytes: number[] = [];
  while ((value >>= 7) > 0) {
    buffer <<= 8;
    buffer |= 0x80 | (value & 0x7f);
  }
  while (true) {
    bytes.push(buffer & 0xff);
    if (buffer & 0x80) buffer >>= 8;
    else break;
  }
  return bytes;
}

interface MidiEvent {
  tick: number;
  order: number; // "off" before "on" when ticks tie, to avoid overlap
  bytes: number[];
}

export function transcriptionToMidi(transcription: Transcription): Uint8Array {
  const { tempo, notes } = transcription;
  const ticksPerSecond = (TICKS_PER_QUARTER_NOTE * tempo) / 60;
  const microsecondsPerQuarterNote = Math.round(60_000_000 / tempo);

  const events: MidiEvent[] = [
    {
      tick: 0,
      order: -1,
      bytes: [
        0xff,
        0x51,
        0x03,
        (microsecondsPerQuarterNote >> 16) & 0xff,
        (microsecondsPerQuarterNote >> 8) & 0xff,
        microsecondsPerQuarterNote & 0xff,
      ],
    },
  ];

  for (const note of notes) {
    const onTick = Math.round(note.start * ticksPerSecond);
    const offTick = Math.round((note.start + note.duration) * ticksPerSecond);
    events.push({ tick: offTick, order: 0, bytes: [0x80, note.midi, 0] });
    events.push({ tick: onTick, order: 1, bytes: [0x90, note.midi, 80] });
  }

  events.sort((a, b) => a.tick - b.tick || a.order - b.order);

  const trackBytes: number[] = [];
  let previousTick = 0;
  for (const event of events) {
    trackBytes.push(...variableLengthQuantity(event.tick - previousTick));
    trackBytes.push(...event.bytes);
    previousTick = event.tick;
  }
  trackBytes.push(0x00, 0xff, 0x2f, 0x00); // end of track

  const header = [
    0x4d,
    0x54,
    0x68,
    0x64, // "MThd"
    0x00,
    0x00,
    0x00,
    0x06, // header length
    0x00,
    0x00, // format 0
    0x00,
    0x01, // 1 track
    (TICKS_PER_QUARTER_NOTE >> 8) & 0xff,
    TICKS_PER_QUARTER_NOTE & 0xff,
  ];

  const trackHeader = [
    0x4d,
    0x54,
    0x72,
    0x6b, // "MTrk"
    (trackBytes.length >> 24) & 0xff,
    (trackBytes.length >> 16) & 0xff,
    (trackBytes.length >> 8) & 0xff,
    trackBytes.length & 0xff,
  ];

  return new Uint8Array([...header, ...trackHeader, ...trackBytes]);
}
