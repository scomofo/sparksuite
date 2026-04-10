# SparkSuite – Polished Highway + MIDI Import + AI Coach (06)

## Goal
Elevate system from functional → production-grade:
1. Polished note highway (UI/UX)
2. MIDI → chart pipeline
3. AI feedback layer

---

# 1. POLISHED NOTE HIGHWAY

## Visual Principles
- minimal color
- strong contrast
- motion clarity
- feedback-first design

---

## Lane Rendering

```js
function renderLane(lane) {
  const x = getLaneX(lane.lane);

  ctx.fillStyle = "#111";
  ctx.fillRect(x, 0, 60, canvas.height);

  ctx.strokeStyle = "#333";
  ctx.strokeRect(x, 0, 60, canvas.height);
}
```

---

## Hit Line

```js
ctx.fillStyle = "#fff";
ctx.fillRect(0, HIT_LINE_Y, canvas.width, 2);
```

---

## Note Style

```js
function drawNote(lane, y, state) {
  const x = getLaneX(lane);

  if (state === "perfect") ctx.fillStyle = "#0f0";
  else if (state === "good") ctx.fillStyle = "#ff0";
  else ctx.fillStyle = "#888";

  ctx.fillRect(x, y, 60, 20);
}
```

---

# 2. MIDI → CHART PIPELINE

## Input
- MIDI file

## Output
```js
{
  tempo,
  lanes,
  notes
}
```

---

## Conversion Flow

```js
MIDI
 → parse tracks
 → extract note events
 → map pitch → lane
 → quantize timing
 → output chart
```

---

## Example Mapper

```js
function pitchToLane(pitch, laneCount) {
  return pitch % laneCount;
}
```

---

## Quantization

```js
function quantize(time, beatMs) {
  return Math.round(time / beatMs) * beatMs;
}
```

---

# 3. AI COACH LAYER

## Input

```js
{
  accuracy,
  timingErrors,
  missedNotes
}
```

---

## Output

```js
{
  message: "Your chord transitions are slightly late",
  focus: "timing",
  suggestion: "Slow to 70% and repeat"
}
```

---

## Rule Engine (starter)

```js
function generateFeedback(results) {
  if (results.accuracy < 0.6) {
    return "Focus on consistency";
  }

  if (results.timingErrors > 0.2) {
    return "Your timing needs tightening";
  }

  return "Great work";
}
```

---

# DONE CRITERIA

- highway looks clean and readable
- MIDI converts into playable chart
- AI produces actionable feedback

---

# WHY THIS MATTERS

This layer turns SparkSuite into:
- scalable (MIDI ingestion)
- premium (UI feel)
- intelligent (AI coaching)
