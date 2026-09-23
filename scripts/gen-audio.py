"""Generates the three Transition mood tracks (US-05) as original, procedurally
synthesised ambient music, so the test audio has a clear licence (made for this
project, CC0) instead of depending on third-party downloads.

Requires numpy + scipy, and macOS `afconvert` for the AAC (.m4a) encode.
Output: public/audio/*.m4a. Run: npm run assets:audio
"""
import json
import subprocess
import tempfile
import wave
from pathlib import Path

import numpy as np
from scipy.signal import butter, fftconvolve, sosfilt

SR = 44100
OUT = Path(__file__).resolve().parent.parent / "public" / "audio"
rng = np.random.default_rng(2026)


def midi(n):
    return 440.0 * 2 ** ((n - 69) / 12)


def envelope(n, attack, release):
    env = np.ones(n)
    a = min(n, int(attack * SR))
    r = min(n - a, int(release * SR))
    if a:
        env[:a] = np.linspace(0, 1, a) ** 2
    if r:
        env[n - r:] *= np.linspace(1, 0, r) ** 1.5
    return env


def pad_note(freq, dur, attack=2.4, release=3.0, bright=1.0):
    n = int(dur * SR)
    t = np.arange(n) / SR
    out = np.zeros(n)
    for detune in (-0.0018, 0.0018):
        f = freq * (1 + detune)
        for k, amp in ((1, 1.0), (2, 0.32 * bright), (3, 0.12 * bright), (4, 0.05 * bright)):
            out += amp * np.sin(2 * np.pi * f * k * t + rng.uniform(0, 2 * np.pi))
    return out * envelope(n, attack, release) * 0.5


def pluck(freq, dur=1.6, decay=0.55):
    n = int(dur * SR)
    t = np.arange(n) / SR
    tone = np.sin(2 * np.pi * freq * t) + 0.35 * np.sin(2 * np.pi * freq * 2 * t) + 0.12 * np.sin(2 * np.pi * freq * 3 * t)
    return tone * np.exp(-t / decay) * envelope(n, 0.006, 0.05)


def bell(freq, dur=4.0):
    n = int(dur * SR)
    t = np.arange(n) / SR
    partials = ((1, 1.0, 1.6), (2.76, 0.4, 0.9), (5.4, 0.18, 0.5))
    tone = sum(a * np.sin(2 * np.pi * freq * r * t) * np.exp(-t / d) for r, a, d in partials)
    return tone * envelope(n, 0.01, 0.2)


def add(buf, sig, start):
    i = int(start * SR)
    end = min(len(buf), i + len(sig))
    if end > i:
        buf[i:end] += sig[: end - i]


def lowpass(x, cutoff):
    return sosfilt(butter(2, cutoff, btype="low", fs=SR, output="sos"), x)


def reverb(mono, seconds=3.2, wet=0.38):
    n = int(seconds * SR)
    t = np.arange(n) / SR
    channels = []
    for _ in range(2):
        ir = rng.standard_normal(n) * np.exp(-t / (seconds / 4.2))
        ir = lowpass(ir, 5200)
        ir /= np.sqrt(np.sum(ir ** 2))
        channels.append((1 - wet) * np.pad(mono, (0, n - 1)) + wet * fftconvolve(mono, ir))
    return np.stack(channels, axis=1)


def render(spec):
    chords, chord_len, cycles = spec["chords"], spec["chord_len"], spec["cycles"]
    total = len(chords) * chord_len * cycles
    tail = 4.0
    mono = np.zeros(int((total + tail) * SR))
    step = 0
    for c in range(cycles):
        for chord in chords:
            start = step * chord_len
            for note in chord:
                add(mono, pad_note(midi(note), chord_len + 2.5, bright=spec["bright"]) * 0.22, start - 0.8 if start else 0)
            add(mono, pad_note(midi(chord[0] - 12), chord_len + 2.0, attack=1.5, bright=0.4) * 0.25, start)
            if spec.get("arp"):
                beat = 60 / spec["bpm"] / 2
                pattern = [0, 1, 2, 3, 2, 1, 2, 3]
                for i in range(int(chord_len / beat)):
                    note = chord[pattern[i % len(pattern)]] + 12
                    add(mono, pluck(midi(note)) * 0.09 * (0.8 + 0.2 * rng.random()), start + i * beat)
            if spec.get("bells"):
                for _ in range(2):
                    add(mono, bell(midi(rng.choice(spec["bells"]))) * 0.06, start + rng.uniform(0.5, chord_len - 1))
            step += 1

    if spec.get("tremolo"):
        t = np.arange(len(mono)) / SR
        mono *= 1 - 0.18 * (0.5 + 0.5 * np.sin(2 * np.pi * spec["tremolo"] * t))
    mono = lowpass(mono, spec["cutoff"])
    stereo = reverb(mono)

    # Fold the ringing tail back onto the start so the track loops without a gap.
    body_len = int(total * SR)
    body = stereo[:body_len].copy()
    spill = stereo[body_len:]
    body[: len(spill)] += spill
    peak = np.max(np.abs(body))
    return (body / peak * 0.84).astype(np.float32)


TRACKS = [
    {
        "file": "still-waters.m4a",
        "chords": [[50, 57, 62, 66], [47, 54, 59, 62], [43, 55, 59, 62], [45, 57, 61, 64]],
        "chord_len": 7.5, "cycles": 3, "bright": 0.9, "cutoff": 3200,
        "bells": [74, 76, 78, 81, 83],
    },
    {
        "file": "turning.m4a",
        "chords": [[45, 52, 57, 60], [41, 53, 57, 60], [48, 55, 60, 64], [43, 55, 59, 62]],
        "chord_len": 9.0, "cycles": 2, "bright": 0.6, "cutoff": 1900, "tremolo": 0.18,
    },
    {
        "file": "daybreak.m4a",
        "chords": [[52, 59, 64, 68], [47, 59, 63, 66], [49, 56, 61, 64], [45, 57, 61, 64]],
        "chord_len": 60 / 84 * 8, "cycles": 4, "bright": 1.1, "cutoff": 4200, "arp": True, "bpm": 84,
    },
]


def write_wav(path, data):
    pcm = (np.clip(data, -1, 1) * 32767).astype("<i2")
    with wave.open(str(path), "wb") as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(pcm.tobytes())


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    durations = {}
    with tempfile.TemporaryDirectory() as tmp:
        for spec in TRACKS:
            audio = render(spec)
            wav = Path(tmp) / (spec["file"] + ".wav")
            write_wav(wav, audio)
            target = OUT / spec["file"]
            subprocess.run(["afconvert", "-f", "m4af", "-d", "aac", "-b", "96000", str(wav), str(target)], check=True)
            durations[spec["file"]] = round(len(audio) / SR, 1)
            print(f"{target.name}: {durations[spec['file']]}s, {target.stat().st_size // 1024} KB")
    print(json.dumps(durations))


if __name__ == "__main__":
    main()
