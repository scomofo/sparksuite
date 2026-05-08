# SparkSuite Lesson A/V Pipeline

## Purpose

This document defines the canonical lesson asset pipeline used by SparkSuite.

Goals:
- predictable lesson structure
- beat-accurate timing foundations
- ADHD-friendly consistency
- CI-safe lesson publishing
- future sync-engine compatibility

---

# Required Lesson Assets

Each lesson folder should contain:

```txt
lessons/<lesson-id>/
  manifest.json

  lesson.wav
  lesson.mp3
  lesson.pdf
  lesson.srt

  source/
    lesson.mscz
```

---

# Export Standards

## WAV

- 44.1kHz
- 16-bit PCM
- peak <= -1 dBFS
- RMS between -18 and -10 dBFS

---

## MP3

- 192kbps CBR
- duration must match WAV

---

## PDF

- single page strongly preferred
- include tempo, key, time signature

---

## SRT

- UTF-8
- no overlapping cues
- ascending timestamps only

---

# Smoke Tests

SparkSuite CI validates:

- sample rate
- bit depth
- RMS loudness
- clipping
- silence
- DC offset
- PDF page count
- caption timing
- duration alignment
- beat grid consistency
- MuseScore export compatibility

---

# Beat Grid Metadata

Optional but recommended:

```json
"beat_grid": {
  "bpm": 92,
  "time_signature": "4/4",
  "downbeats_s": [0, 2.608, 5.217]
}
```

This is the future foundation for:
- rhythm gameplay
- sync engine
- challenge timing
- AI feedback
- visual beat indicators

---

# Running Locally

```bash
npm install
npm run test:av
```

---

# Future Planned Checks

- BPM detection from waveform
- waveform cache generation
- MIDI timing validation
- stem integrity checks
- AI-generated chart QA
- chord-density analysis
