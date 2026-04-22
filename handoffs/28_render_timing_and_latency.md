# SparkSuite – Render Timing (60FPS) + Audio Latency Calibration (28)

## Goal
Achieve ultra-tight gameplay feel by:
1. Locking render + update loop to consistent timing
2. Ensuring input, audio, and visuals are synchronized
3. Calibrating latency per device

---

# 1. FRAME TIMING (60 FPS)

## Target

```js
FRAME_TIME = 16.67ms
```

---

## Game Loop

```js
function gameLoop(now) {
  const delta = now - lastFrame;

  update(delta);
  render();

  lastFrame = now;
  requestAnimationFrame(gameLoop);
}
```

---

## Critical Rule

> Never tie gameplay timing directly to frame rate

Use:

```js
gameTime += delta;
```

---

# 2. INPUT TIMING PIPELINE

## Flow

```text
Input → Timestamp → Judge → Feedback → Audio
```

---

## Capture

```js
const inputTime = performance.now();
```

---

## Sync Rule

- judge and audio must happen in same frame

---

# 3. AUDIO LATENCY CALIBRATION

## Problem

Devices vary:
- Bluetooth delay
- browser audio delay

---

## Calibration Model

```js
user.audioOffsetMs = 0
```

---

## Apply Offset

```js
adjustedTime = inputTime + user.audioOffsetMs;
```

---

## Manual Calibration

- play metronome
- user taps along
- measure average delta

```js
user.audioOffsetMs = averageDelta * -1;
```

---

# 4. NOTE SPAWN TIMING

## Lead Time

```js
NOTE_TRAVEL_TIME = 2000ms
```

Notes should spawn early enough to reach hit line at correct time

---

## Position Calculation

```js
progress = (note.time - currentTime) / NOTE_TRAVEL_TIME;
```

---

# 5. HIT REGISTRATION PIPELINE

```js
const delta = inputTime - note.time;
const result = judge(delta);
playSound(result);
renderFeedback(result);
```

---

# 6. DEBUG TOOLS (IMPORTANT)

## Overlay

Show:
- delta ms
- frame time
- FPS

---

## Logging

```js
log(delta, result);
```

---

# DONE CRITERIA

- stable 60 FPS
- no input lag perception
- audio feels perfectly aligned

---

# WHY THIS MATTERS

This is the final layer of responsiveness.
It separates "good" from "feels perfect".
