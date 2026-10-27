# Beat grid for a music track: least-squares fit over librosa's beat times
# (its tempo scalar can be off by 2 %), kick strength per beat and RMS per bar.
# The timeline is written in beats, so this file is the audit trail for every cut.
# uv run --with librosa --with scipy --python 3.11 scripts/beats.py <track.mp3> <out.json>
import json
import sys

import librosa
import numpy as np
from scipy.signal import butter, sosfilt

src, dst = sys.argv[1], sys.argv[2]
y, sr = librosa.load(src, sr=None, mono=True)
drums = librosa.effects.hpss(y)[1]
_, beats = librosa.beat.beat_track(y=drums, sr=sr, tightness=400, units="time")

i = np.arange(len(beats))
(T, t0), *_ = np.linalg.lstsq(np.vstack([i, np.ones_like(i)]).T, beats, rcond=None)
residual = beats - (t0 + i * T)

sos = butter(4, [40, 160], btype="band", fs=sr, output="sos")
kick = librosa.onset.onset_strength(y=sosfilt(sos, drums), sr=sr)
kick_t = librosa.times_like(kick, sr=sr)
onsets = librosa.onset.onset_detect(onset_envelope=kick, sr=sr, units="time")
off_grid = np.array([abs((o - t0) / T - round((o - t0) / T)) * T for o in onsets])

rms = librosa.feature.rms(y=y)[0]
rms_t = librosa.times_like(rms, sr=sr)
n_beats = int((len(y) / sr - t0) / T)
per_beat = []
for n in range(n_beats):
    t = t0 + n * T
    window = (rms_t >= t) & (rms_t < t + T)
    per_beat.append({
        "n": n,
        "t": round(float(t), 4),
        "kick": round(float(kick[np.argmin(np.abs(kick_t - t))]), 3),
        "rms": round(float(rms[window].mean()) if window.any() else 0.0, 4),
    })

json.dump({
    "source": src.split("/")[-1],
    "bpm": round(float(60 / T), 4),
    "t0": float(t0),
    "T": float(T),
    "residual_ms": round(float(np.abs(residual).max() * 1000), 2),
    "kick_on_grid": round(float((off_grid < 0.03).mean()), 4),
    "beats": per_beat,
}, open(dst, "w"), indent=1)
print(f"{60 / T:.3f} bpm, t0 {t0:.4f} s, residual {np.abs(residual).max() * 1000:.1f} ms")
