"""Download the audio track of a YouTube / Instagram / TikTok video so it
can go through the same pipeline as an uploaded file.

Requires ffmpeg on the host for the audio-extraction postprocessor.
"""

from __future__ import annotations

import os
import tempfile


class DownloadError(RuntimeError):
    pass


def download_audio(url: str) -> str:
    """Download `url`'s audio track and return the path to a .wav file.

    The caller is responsible for deleting the returned file (and its
    containing temp directory) once done with it.
    """
    import yt_dlp

    out_dir = tempfile.mkdtemp(prefix="melody-yt-")
    out_template = os.path.join(out_dir, "audio.%(ext)s")

    ydl_opts = {
        "format": "bestaudio/best",
        "outtmpl": out_template,
        "noplaylist": True,
        "quiet": True,
        "no_warnings": True,
        "postprocessors": [
            {
                "key": "FFmpegExtractAudio",
                "preferredcodec": "wav",
                "preferredquality": "192",
            }
        ],
    }

    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            ydl.download([url])
    except Exception as exc:  # yt_dlp raises its own DownloadError subclass
        raise DownloadError(f"Could not download audio from {url}: {exc}") from exc

    wav_path = os.path.join(out_dir, "audio.wav")
    if not os.path.exists(wav_path):
        raise DownloadError(f"Audio extraction failed for {url} (ffmpeg missing?)")
    return wav_path
