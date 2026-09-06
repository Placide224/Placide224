"""Shared data model: the JSON representation every stage of the pipeline
reads or writes (audio -> notes, notes -> MIDI/MusicXML/Strudel/Sonic Pi)."""

from __future__ import annotations

from pydantic import BaseModel, Field


class Note(BaseModel):
    pitch: str  # scientific pitch notation, e.g. "C#4"
    midi: int  # MIDI note number, 0-127
    start: float  # seconds from the start of the audio
    duration: float  # seconds
    velocity: int = 80  # 0-127


class Transcription(BaseModel):
    tempo: float = Field(..., description="Estimated tempo in BPM")
    key: str = Field(..., description="Estimated key, e.g. 'F# minor'")
    duration: float = Field(..., description="Total audio duration in seconds")
    notes: list[Note]
