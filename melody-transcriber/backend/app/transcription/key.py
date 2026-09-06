"""Key estimation using the Krumhansl-Schmuckler key-finding algorithm:
correlate the audio's chroma (pitch-class energy) profile against the
textbook major/minor key profiles and pick the best match.
"""

from __future__ import annotations

import numpy as np

PITCH_CLASS_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"]

# Krumhansl & Kessler (1982) tonal hierarchy profiles.
MAJOR_PROFILE = np.array(
    [6.35, 2.23, 3.48, 2.33, 4.38, 4.09, 2.52, 5.19, 2.39, 3.66, 2.29, 2.88]
)
MINOR_PROFILE = np.array(
    [6.33, 2.68, 3.52, 5.38, 2.60, 3.53, 2.54, 4.75, 3.98, 2.69, 3.34, 3.17]
)


def detect_key(y: np.ndarray, sr: int) -> str:
    import librosa

    chroma = librosa.feature.chroma_cqt(y=y, sr=sr)
    profile = chroma.mean(axis=1)

    best_score = -np.inf
    best_key = "C major"
    for shift in range(12):
        major_corr = np.corrcoef(profile, np.roll(MAJOR_PROFILE, shift))[0, 1]
        minor_corr = np.corrcoef(profile, np.roll(MINOR_PROFILE, shift))[0, 1]
        tonic = PITCH_CLASS_NAMES[shift]
        if major_corr > best_score:
            best_score = major_corr
            best_key = f"{tonic} major"
        if minor_corr > best_score:
            best_score = minor_corr
            best_key = f"{tonic} minor"

    return best_key
