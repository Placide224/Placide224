"""Audio -> notes.

This is the hard problem the whole app exists to solve: turn a monophonic
melody (voice or a single instrument) into a sequence of discrete notes
with pitch, onset and duration. Everything downstream (MIDI, MusicXML,
Strudel, Sonic Pi) is comparatively mechanical once we have this list.

Approach: frame-level pitch tracking with librosa's probabilistic YIN
(`pyin`), then merge consecutive voiced frames that land on the same
MIDI note into a single note event, dropping notes shorter than a minimum
duration (grace-note-level noise from octave jitter / vibrato).
"""

from __future__ import annotations

import numpy as np

from app.schema import Note

PITCH_CLASS_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"]


def midi_to_pitch_name(midi: int) -> str:
    name = PITCH_CLASS_NAMES[midi % 12]
    octave = midi // 12 - 1
    return f"{name}{octave}"


def hz_to_midi(freq_hz: np.ndarray) -> np.ndarray:
    return 69 + 12 * np.log2(freq_hz / 440.0)


def detect_notes(
    y: np.ndarray,
    sr: int,
    fmin: float = 65.0,  # ~C2
    fmax: float = 1046.5,  # ~C6
    min_note_duration: float = 0.08,
) -> list[Note]:
    """Detect a monophonic sequence of notes in `y`."""
    import librosa

    hop_length = 256
    f0, voiced_flag, voiced_prob = librosa.pyin(
        y, fmin=fmin, fmax=fmax, sr=sr, hop_length=hop_length
    )
    times = librosa.times_like(f0, sr=sr, hop_length=hop_length)

    midi_frames = np.full(f0.shape, np.nan)
    valid = voiced_flag & ~np.isnan(f0)
    midi_frames[valid] = np.round(hz_to_midi(f0[valid])).astype(int)

    notes: list[Note] = []
    current_pitch: int | None = None
    current_start: float | None = None
    frame_dur = hop_length / sr

    def flush(end_time: float) -> None:
        nonlocal current_pitch, current_start
        if current_pitch is None or current_start is None:
            return
        duration = end_time - current_start
        if duration >= min_note_duration:
            notes.append(
                Note(
                    pitch=midi_to_pitch_name(current_pitch),
                    midi=current_pitch,
                    start=round(float(current_start), 3),
                    duration=round(float(duration), 3),
                    velocity=80,
                )
            )
        current_pitch = None
        current_start = None

    for i, t in enumerate(times):
        pitch = midi_frames[i]
        pitch = int(pitch) if not np.isnan(pitch) else None

        if pitch != current_pitch:
            flush(float(t))
            if pitch is not None:
                current_pitch = pitch
                current_start = float(t)

    flush(float(times[-1] + frame_dur) if len(times) else 0.0)
    return notes
