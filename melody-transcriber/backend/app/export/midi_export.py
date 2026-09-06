"""Transcription (JSON) -> MIDI file."""

from __future__ import annotations

from app.schema import Transcription


def to_midi_bytes(transcription: Transcription) -> bytes:
    import io

    import pretty_midi

    pm = pretty_midi.PrettyMIDI(initial_tempo=transcription.tempo)
    instrument = pretty_midi.Instrument(program=0)  # Acoustic Grand Piano

    for note in transcription.notes:
        instrument.notes.append(
            pretty_midi.Note(
                velocity=note.velocity,
                pitch=note.midi,
                start=note.start,
                end=note.start + note.duration,
            )
        )

    pm.instruments.append(instrument)

    buf = io.BytesIO()
    pm.write(buf)
    return buf.getvalue()
