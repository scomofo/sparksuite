#!/usr/bin/env python3
"""
Generate realistic guitar chord WAV files using MIDI synthesis.
Requires: pip install midiutil midi2audio
Also requires FluidSynth and a GM SoundFont (e.g., FluidR3_GM.sf2).

Usage:
    python generate_guitar_chords.py

Output: guitar_chords/ directory with chord_*.wav files.
"""

import os
import struct
import math
import wave

# ===== Configuration =====
GUITAR_PRESET = 25       # GM patch: 25 = steel-string acoustic guitar
VELOCITY = 90             # 0-127, louder = brighter
STRUM_DELAY_SECS = 0.012  # Delay between string strikes
HOLD_SECS = 2.0           # How long notes sustain
DECAY_SECS = 1.5          # Release tail
SAMPLE_RATE = 44100
OUTPUT_DIR = "guitar_chords"

# ===== Chord definitions: name -> list of MIDI note numbers =====
# Standard guitar tuning: E2=40, A2=45, D3=50, G3=55, B3=59, E4=64
CHORDS = {
    # Major
    "C":     [48, 52, 55, 60, 64],        # x32010
    "D":     [50, 57, 62, 66],            # xx0232
    "E":     [40, 47, 52, 56, 59, 64],    # 022100
    "F":     [41, 48, 53, 57, 60, 65],    # 133211
    "G":     [43, 47, 50, 55, 59, 67],    # 320003
    "A":     [45, 52, 57, 61, 64],        # x02220
    "B":     [47, 54, 59, 63, 66, 71],    # x24442

    # Minor
    "Am":    [45, 52, 57, 60, 64],        # x02210
    "Bm":    [47, 54, 59, 62, 66],        # x24432
    "Dm":    [50, 57, 62, 65],            # xx0231
    "Em":    [40, 47, 52, 55, 59, 64],    # 022000
    "Fm":    [41, 48, 53, 56, 60, 65],    # 133111

    # Dominant 7th
    "G7":    [43, 47, 50, 55, 59, 65],    # 320001
    "C7":    [48, 52, 58, 60, 64],        # x32310
    "D7":    [50, 57, 60, 66],            # xx0212
    "E7":    [40, 47, 50, 56, 59, 64],    # 020100
    "A7":    [45, 52, 55, 61, 64],        # x02020
    "B7":    [47, 51, 54, 59, 63, 66],    # x21202

    # Minor 7th
    "Am7":   [45, 52, 55, 60, 64],        # x02010
    "Em7":   [40, 47, 50, 55, 59, 64],    # 020000
    "Dm7":   [50, 57, 60, 65],            # xx0211

    # Sus
    "Dsus2": [50, 57, 62, 64],            # xx0230
    "Dsus4": [50, 57, 62, 67],            # xx0233
    "Asus2": [45, 52, 57, 59, 64],        # x02200
    "Asus4": [45, 52, 57, 62, 64],        # x02230

    # Add
    "Cadd9": [48, 52, 55, 60, 62],        # x32030
    "Gadd9": [43, 47, 50, 55, 59, 69],    # 320005 (approximate)

    # Power chords
    "E5":    [40, 47, 52],                # 022xxx
    "A5":    [45, 52, 57],                # x022xx

    # Extra
    "Gm":    [43, 50, 55, 58, 62, 67],    # 355333
    "Cm":    [48, 51, 55, 60, 63],        # x35543
    "Fmaj7": [41, 48, 52, 57, 60, 64],   # 133210 (approx)
    "F#m":   [42, 49, 54, 57, 61, 66],    # 244222
}


def note_freq(midi_note):
    """Convert MIDI note number to frequency in Hz."""
    return 440.0 * (2.0 ** ((midi_note - 69) / 12.0))


def generate_guitar_tone(freq, duration, sample_rate=SAMPLE_RATE):
    """Generate a single plucked guitar-like tone using Karplus-Strong-inspired synthesis."""
    n_samples = int(duration * sample_rate)
    samples = []

    # Simple additive synthesis with harmonics that decay at different rates
    harmonics = [
        (1.0,  1.0,  3.0),   # fundamental, amplitude, decay rate
        (2.0,  0.5,  4.5),   # 2nd harmonic
        (3.0,  0.25, 6.0),   # 3rd harmonic
        (4.0,  0.12, 8.0),   # 4th harmonic
        (5.0,  0.06, 10.0),  # 5th harmonic
    ]

    for i in range(n_samples):
        t = i / sample_rate
        sample = 0.0
        for harm_mult, amp, decay in harmonics:
            f = freq * harm_mult
            if f > sample_rate / 2:
                continue  # skip if above Nyquist
            envelope = amp * math.exp(-decay * t)
            sample += envelope * math.sin(2 * math.pi * f * t)

        # Attack envelope (quick pluck)
        attack_samples = int(0.005 * sample_rate)
        if i < attack_samples:
            sample *= i / attack_samples

        samples.append(sample)

    return samples


def generate_chord_wav(name, midi_notes, output_dir):
    """Generate a strummed chord WAV file."""
    total_duration = HOLD_SECS + DECAY_SECS
    n_samples = int(total_duration * SAMPLE_RATE)
    mixed = [0.0] * n_samples

    for idx, note in enumerate(midi_notes):
        freq = note_freq(note)
        strum_offset = int(idx * STRUM_DELAY_SECS * SAMPLE_RATE)
        tone = generate_guitar_tone(freq, total_duration - idx * STRUM_DELAY_SECS)

        # Velocity scaling
        vel_scale = VELOCITY / 127.0
        for i, s in enumerate(tone):
            pos = strum_offset + i
            if pos < n_samples:
                mixed[pos] += s * vel_scale

    # Normalize
    peak = max(abs(s) for s in mixed) or 1.0
    scale = 0.85 / peak
    mixed = [s * scale for s in mixed]

    # Fade out last 0.5s
    fade_samples = int(0.5 * SAMPLE_RATE)
    fade_start = n_samples - fade_samples
    for i in range(fade_samples):
        mixed[fade_start + i] *= 1.0 - (i / fade_samples)

    # Write WAV
    filepath = os.path.join(output_dir, f"chord_{name}.wav")
    with wave.open(filepath, "w") as wf:
        wf.setnchannels(1)
        wf.setsampwidth(2)  # 16-bit
        wf.setframerate(SAMPLE_RATE)
        for s in mixed:
            clamped = max(-1.0, min(1.0, s))
            wf.writeframes(struct.pack("<h", int(clamped * 32767)))

    return filepath


def main():
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    print(f"Generating {len(CHORDS)} guitar chord WAV files...")

    for name, notes in CHORDS.items():
        path = generate_chord_wav(name, notes, OUTPUT_DIR)
        print(f"  {path}")

    print(f"\nDone! {len(CHORDS)} WAV files written to {OUTPUT_DIR}/")
    print("Copy them to your project and select the 'Guitar' strum tone to use them.")


if __name__ == "__main__":
    main()
