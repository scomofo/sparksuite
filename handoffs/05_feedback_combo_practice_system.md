# SparkSuite – Feedback, Combo, and Practice Assist System (05)

## Goal
Add game feel and training power on top of runtime:
- visual feedback (hit/miss)
- combo + streak system
- practice assist tools

---

# 1. VISUAL FEEDBACK SYSTEM

## Hit Feedback Model

```js
{
  type: "perfect" | "good" | "miss",
  lane: 0,
  time: 1234
}
```

---

## Render Feedback

```js
function renderFeedback(feedback) {
  const x = getLaneX(feedback.lane);
  const y = HIT_LINE_Y;

  if (feedback.type === "perfect") ctx.fillStyle = "green";
  if (feedback.type === "good") ctx.fillStyle = "yellow";
  if (feedback.type === "miss") ctx.fillStyle = "red";

  ctx.fillRect(x, y, 60, 10);
}
```

---

# 2. COMBO SYSTEM

## State

```js
state.combo = 0;
state.maxCombo = 0;
```

---

## Update Logic

```js
function updateCombo(result) {
  if (result === "miss") {
    state.combo = 0;
  } else {
    state.combo++;
    state.maxCombo = Math.max(state.maxCombo, state.combo);
  }
}
```

---

# 3. SCORE SYSTEM

```js
function scoreResult(result) {
  if (result === "perfect") return 100;
  if (result === "good") return 70;
  return 0;
}
```

---

# 4. PRACTICE ASSIST

## Slow Mode

```js
state.speedMultiplier = 0.75;
```

Apply:

```js
const adjustedTime = (performance.now() - state.startTime) * state.speedMultiplier;
```

---

## Loop Section

```js
function loopSection(start, end) {
  state.loop = { start, end };
}
```

---

## Ghost Notes (preview)

```js
function renderGhostNotes() {
  chart.notes.forEach(n => {
    if (n.time > currentTime && n.time < currentTime + 2000) {
      drawGhost(n);
    }
  });
}
```

---

# DONE CRITERIA

- feedback renders per hit
- combo increments correctly
- score accumulates
- slow mode works
- loop mode works

---

# WHY THIS MATTERS

This transforms the engine from functional → engaging + trainable.
