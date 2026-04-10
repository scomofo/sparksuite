# SparkSuite – Frame Alignment + Audio Sync + Feel Benchmarking (29)

## Goal
Push gameplay feel to industry-grade precision:
1. Frame-perfect hit line alignment
2. Audio waveform synchronization
3. Benchmark feel against top rhythm systems

---

# 1. HIT LINE ALIGNMENT (FRAME-LEVEL)

## Principle

The moment a note visually reaches the hit line MUST equal:

```text
note.time === gameTime
```

---

## Correction

```js
visualTime = gameTime + VISUAL_OFFSET_MS;
```

Tune:

```js
VISUAL_OFFSET_MS = -10 → +10
```

---

## Debug Overlay

Show:
- note.time
- gameTime
- delta

Goal:

```text
delta ≈ 0 at hit line
```

---

# 2. AUDIO WAVEFORM SYNC

## Problem

Audio playback and chart timing drift.

---

## Model

```js
audioStartTime = performance.now();
```

---

## Sync Equation

```js
currentAudioTime = performance.now() - audioStartTime + audioOffsetMs;
```

---

## Align With Chart

```js
chartTime = currentAudioTime;
```

---

## Calibration Rule

- adjust audioOffsetMs until hits match beat

---

# 3. FRAME vs AUDIO PRIORITY

## Rule

> Audio is the source of truth

Gameplay must follow audio timing, not vice versa

---

# 4. FEEL BENCHMARKING

## Compare Against

- Guitar Hero
- Yousician
- Clone Hero

---

## What to Evaluate

### Timing
- does it feel forgiving but precise?

### Feedback
- are perfect hits satisfying?

### Readability
- can you predict notes easily?

---

## Test Method

```text
Play same rhythm pattern across systems
Compare feel side-by-side
```

---

# 5. MICRO-TUNING VALUES

## Starting Targets

```js
INPUT_OFFSET_MS = -15
VISUAL_OFFSET_MS = 0
AUDIO_OFFSET_MS = user calibrated
NOTE_TRAVEL_TIME = 1800–2200ms
```

---

# 6. FINAL CHECKLIST

- hits align with beat
- no perceived lag
- visuals match audio exactly
- timing feels consistent

---

# WHY THIS MATTERS

This is the final 5% that creates:
- "this feels right"
- "I trust the system"

Without this, even great systems feel slightly off.
