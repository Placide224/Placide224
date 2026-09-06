"""Load an audio file from disk into a mono waveform.

Kept separate from pitch/tempo/key detection so the rest of the pipeline
never has to know whether the audio came from an upload or a YouTube
download.
"""

from __future__ import annotations

import numpy as np


def load_waveform(path: str, sample_rate: int = 22050) -> tuple[np.ndarray, int]:
    """Return (mono_waveform, sample_rate).

    Uses librosa, which falls back to ffmpeg/audioread for compressed
    formats (mp3, m4a, ...) when soundfile can't read them directly.
    """
    import librosa

    y, sr = librosa.load(path, sr=sample_rate, mono=True)
    return y, sr
