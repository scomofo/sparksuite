# SparkSuite – Adaptive Difficulty + Emotion Detection + Flow System (32)

## Goal
Create a system that keeps the player in the optimal learning zone (“flow”) by:
1. Dynamically adjusting difficulty in real-time
2. Detecting frustration or boredom signals
3. Steering sessions to maintain engagement

---

# 1. ADAPTIVE DIFFICULTY ENGINE

## Inputs

```js
accuracy
timingConsistency
missStreak
retryCount
```

---

## Logic

```js
function adjustDifficulty(state) {
  if (state.accuracy > 0.9 && state.timingConsistency > 0.85) {
    return "increase";
  }

  if (state.accuracy < 0.6 || state.missStreak > 5) {
    return "decrease";
  }

  return "maintain";
}
```

---

## Actions

```js
increase → faster tempo / denser notes
decrease → slower tempo / fewer notes
```

---

# 2. EMOTION DETECTION (BEHAVIORAL)

## Signals

```js
frustration:
  - rapid misses
  - repeated retries

boredom:
  - perfect streaks
  - low input variance
```

---

## Detection

```js
function detectEmotion(state) {
  if (state.missStreak > 8) return "frustrated";
  if (state.accuracy > 0.95 && state.combo > 30) return "bored";
  return "engaged";
}
```

---

# 3. FLOW CONTROL SYSTEM

## Flow Model

```text
Challenge ≈ Skill
```

---

## Controller

```js
function flowController(state) {
  const emotion = detectEmotion(state);

  if (emotion === "frustrated") {
    return { action: "reduce_difficulty" };
  }

  if (emotion === "bored") {
    return { action: "increase_difficulty" };
  }

  return { action: "maintain" };
}
```

---

# 4. REAL-TIME ADJUSTMENTS

## During Exercise

```js
if (flow.action === "reduce_difficulty") {
  tempo *= 0.9;
}

if (flow.action === "increase_difficulty") {
  tempo *= 1.05;
}
```

---

# 5. SESSION-LEVEL ADAPTATION

## After Segment

```js
if (emotion === "frustrated") {
  nextSegment = generatePractice(user);
}

if (emotion === "bored") {
  nextSegment = selectHarderSong();
}
```

---

# 6. UX SIGNALS

- subtle encouragement when struggling
- subtle escalation when succeeding
- never explicitly say "difficulty changed"

---

# DONE CRITERIA

- user rarely feels stuck
- user rarely feels bored
- sessions feel smooth and adaptive

---

# WHY THIS MATTERS

This creates true "flow state" gameplay:
- always engaging
- always improving
- never frustrating
