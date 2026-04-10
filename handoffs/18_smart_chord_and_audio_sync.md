# SparkSuite – Smart Chord Detection + Audio Sync (18)

## Goal
Upgrade system to near real-world musical accuracy:
1. Smart chord detection (music theory aware)
2. Audio sync (play with real song backing)

---

# 1. SMART CHORD DETECTION

## Problem
Basic detection only handles simple triads.

---

## Solution: Interval-Based Detection

```js
function detectChordAdvanced(notes) {
  const pcs = notes.map(n => n.pitch % 12).sort();

  const patterns = {
    "major": [0,4,7],
    "minor": [0,3,7],
    "dim": [0,3,6],
    "maj7": [0,4,7,11],
    "min7": [0,3,7,10]
  };

  for (let root = 0; root < 12; root++) {
    const normalized = pcs.map(p => (p - root + 12) % 12);

    for (const [name, pattern] of Object.entries(patterns)) {
      if (matches(normalized, pattern)) {
        return noteName(root) + name;
      }
    }
  }

  return "unknown";
}
```

---

## Add Support
- inversions
- slash chords (C/E)
- extended chords

---

# 2. AUDIO SYNC SYSTEM

## Goal
Play backing track aligned with gameplay timing

---

## Audio Model

```js
{
  audioFile,
  offsetMs,
  tempo
}
```

---

## Start Sync

```js
function startPlayback(chart, audio) {
  const startTime = performance.now();

  audio.play();

  return {
    startTime,
    audioStart: startTime + audio.offsetMs
  };
}
```

---

## Time Alignment

```js
const now = performance.now() - state.startTime;
const adjusted = now - audio.offsetMs;
```

---

# 3. HIT ALIGNMENT WITH AUDIO

Ensure note timing matches waveform peaks.

---

# 4. OPTIONAL: METRONOME LAYER

```js
if (debugMode) {
  playClickTrack(tempo);
}
```

---

# DONE CRITERIA

- chords detected accurately across songs
- backing audio aligns with notes
- gameplay feels synced to music

---

# WHY THIS MATTERS

This transforms SparkSuite into:
- real music experience
- not just abstract rhythm gameplay
