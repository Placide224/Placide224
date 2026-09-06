"""Orchestrates audio -> Transcription (the JSON contract in app/schema.py)."""

from __future__ import annotations

from app.audio.loader import load_waveform
from app.schema import Transcription
from app.transcription.key import detect_key
from app.transcription.pitch import detect_notes
from app.transcription.tempo import detect_tempo


def transcribe_file(path: str) -> Transcription:
    y, sr = load_waveform(path)
    duration = round(float(len(y) / sr), 3)

    notes = detect_notes(y, sr)
    tempo = detect_tempo(y, sr)
    key = detect_key(y, sr)

    return Transcription(tempo=tempo, key=key, duration=duration, notes=notes)
