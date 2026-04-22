# SparkSuite – Gameplay Feel Fix + Precision Spec (27)

## Goal
Close the gap between functional gameplay and premium feel by:
1. Fixing timing + responsiveness issues
2. Standardizing feedback (visual + audio)
3. Defining exact gameplay feel parameters (ms-level)

---

# 1. INPUT TIMING CALIBRATION

## Global Offset

```js
INPUT_OFFSET_MS = -15
```

Reason:
- players naturally hit slightly late
- this makes timing feel "fair"

---

## Hit Windows (ms)

```js
PERFECT = ±30
GOOD = ±70
MISS = >70
```

---

## Judgment Function

```js
function judge(delta) {
  const d = delta + INPUT_OFFSET_MS;

  if (Math.abs(d) <= 30) return "perfect";
  if (Math.abs(d) <= 70) return "good";
  return "miss";
}
```

---

# 2. AUDIO FEEDBACK (MANDATORY)

## Timing

- play sound immediately on hit (no delay)

## Mapping

```js
perfect → soft click (bright)
good → softer click
miss → low tap
```

---

## Critical Rule

> audio must fire within same frame as input

---

# 3. VISUAL FEEDBACK SPEC

## Perfect

- scale: 1 → 1.15 → 1
- duration: 120ms

## Good

- scale: 1 → 1.05 → 1

## Miss

- shake: 6px horizontal
- duration: 120ms

---

## Lane Flash

```js
opacity: 0 → 0.2 → 0
duration: 100ms
```

---

# 4. HIGHWAY READABILITY

## Adjustments

- lane separators: +10% brightness
- hit line: subtle glow
- notes: add soft shadow

---

## Goal

- player can predict timing without thinking

---

# 5. TRANSITIONS (REMOVE FRICTION)

## Standard Transition

```js
fade + scale (0.98 → 1)
duration: 180ms
```

Apply to:
- gameplay → results
- results → next

---

# 6. PRACTICE MODE DIFFERENTIATION

## Remove

- score
- combo

## Emphasize

- timing indicators

---

# 7. CONSISTENCY RULES

## Spacing

```text
8 / 16 / 24 / 32
```

## Typography

- max 3 sizes per screen

## Animation

- use shared timing constants

---

# 8. TESTING CHECKLIST

## Gameplay

- hits feel immediate
- misses feel clear
- timing feels fair

## UI

- no jarring transitions
- interactions feel responsive

---

# DONE CRITERIA

- gameplay feels tight (not floaty)
- feedback is instant and clear
- experience feels consistent across screens

---

# WHY THIS MATTERS

This is the layer that transforms:
- a working system
→ a satisfying experience users want to repeat
