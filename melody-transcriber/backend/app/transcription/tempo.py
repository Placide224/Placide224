"""Tempo estimation."""

from __future__ import annotations

import numpy as np


def detect_tempo(y: np.ndarray, sr: int) -> float:
    import librosa

    onset_env = librosa.onset.onset_strength(y=y, sr=sr)
    tempo, _ = librosa.beat.beat_track(onset_envelope=onset_env, sr=sr)
    value = float(np.atleast_1d(tempo)[0])
    return round(value, 1)
