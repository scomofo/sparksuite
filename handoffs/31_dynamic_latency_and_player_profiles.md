# SparkSuite – Dynamic Latency Compensation + Player Profiles + Feel Presets (31)

## Goal
Push feel beyond static tuning into adaptive, player-specific responsiveness:
1. Dynamic latency compensation (auto-adjust during play)
2. Player-specific timing profiles
3. Feel presets (arcade vs training)

---

# 1. DYNAMIC LATENCY COMPENSATION

## Problem
Static offsets (INPUT_OFFSET_MS) are not perfect for all players or sessions.

---

## Solution
Continuously measure timing bias during gameplay.

```js
function computeTimingBias(events) {
  const avg = events.reduce((s,e)=>s+e.delta,0) / events.length;
  return avg;
}
```

---

## Apply Adaptive Offset

```js
function updateDynamicOffset(events) {
  const bias = computeTimingBias(events);

  // small gradual adjustment
  state.dynamicOffset = clamp(
    state.dynamicOffset - bias * 0.1,
    -40,
    40
  );
}
```

---

## Final Judgment

```js
adjustedDelta = delta + INPUT_OFFSET_MS + state.dynamicOffset;
```

---

## Rule

- adjust slowly (avoid jitter)
- never change more than ~2–3ms per second

---

# 2. PLAYER TIMING PROFILES

## Model

```js
user.profile = {
  preferredOffset: -18,
  consistency: 0.72,
  timingBias: "late"
};
```

---

## Update After Session

```js
user.profile.preferredOffset = smooth(
  user.profile.preferredOffset,
  state.dynamicOffset
);
```

---

## Use On Load

```js
INPUT_OFFSET_MS = user.profile.preferredOffset;
```

---

# 3. FEEL PRESETS

## Modes

```js
const presets = {
  arcade: {
    perfect: 25,
    good: 60,
    inputOffset: -15
  },
  training: {
    perfect: 40,
    good: 90,
    inputOffset: -10
  }
};
```

---

## Apply Preset

```js
function applyPreset(mode) {
  const p = presets[mode];

  PERFECT_WINDOW = p.perfect;
  GOOD_WINDOW = p.good;
  INPUT_OFFSET_MS = p.inputOffset;
}
```

---

# 4. WHEN TO USE

## Arcade Mode
- progression
- performance

## Training Mode
- practice mode
- beginner users

---

# 5. UX INTEGRATION

- hidden by default
- optional toggle in settings

---

# DONE CRITERIA

- timing adapts subtly to player
- sessions feel more consistent
- different modes feel distinct

---

# WHY THIS MATTERS

This moves SparkSuite beyond static tuning into:
- personalized feel
- adaptive responsiveness

This is extremely rare in rhythm systems.
