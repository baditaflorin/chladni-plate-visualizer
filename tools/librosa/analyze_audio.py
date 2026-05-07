#!/usr/bin/env python3
"""Local-only helper for comparing Web Audio FFT bands with librosa features."""

from __future__ import annotations

import argparse
import json
from pathlib import Path

import librosa
import numpy as np


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("audio", type=Path)
    parser.add_argument("--output", type=Path, default=Path("librosa-analysis.json"))
    args = parser.parse_args()

    signal, sample_rate = librosa.load(args.audio, mono=True, sr=None)
    chroma = librosa.feature.chroma_stft(y=signal, sr=sample_rate)
    centroid = librosa.feature.spectral_centroid(y=signal, sr=sample_rate)
    bandwidth = librosa.feature.spectral_bandwidth(y=signal, sr=sample_rate)

    result = {
        "source": str(args.audio),
        "sample_rate": sample_rate,
        "duration_seconds": float(librosa.get_duration(y=signal, sr=sample_rate)),
        "mean_chroma": np.mean(chroma, axis=1).round(6).tolist(),
        "mean_centroid": float(np.mean(centroid)),
        "mean_bandwidth": float(np.mean(bandwidth)),
    }
    args.output.write_text(json.dumps(result, indent=2) + "\n", encoding="utf-8")


if __name__ == "__main__":
    main()
