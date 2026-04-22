# SparkSuite – Guitar Hero / Yousician Feel Benchmark Spec (30)

## Goal
Provide a concrete comparison target and tuning framework so SparkSuite matches industry feel.

---

# 1. REFERENCE TARGETS

## Guitar Hero / Clone Hero
- Tight timing windows
- Strong audio feedback
- Predictable highway spacing

## Yousician
- Slightly more forgiving timing
- Strong teaching feedback

---

# 2. TIMING WINDOWS (REFERENCE)

```js
PERFECT = ±25–35ms
GOOD = ±60–80ms
MISS > 80ms
```

---

# 3. INPUT OFFSET TARGET

```js
INPUT_OFFSET_MS = -10 to -25
```

Tune until:
- players feel “on beat” without overthinking

---

# 4. NOTE TRAVEL TIME

```js
NOTE_TRAVEL_TIME = 1800–2200ms
```

Too fast → stressful
Too slow → unreadable

---

# 5. VISUAL ALIGNMENT

```js
VISUAL_OFFSET_MS = -5 to +5
```

Goal:
- note visually hits exactly on beat

---

# 6. AUDIO PRIORITY

Rule:

```text
Audio = source of truth
```

- gameplay syncs to audio clock
- never drift

---

# 7. FEEDBACK COMPARISON

## Perfect
- GH: sharp + satisfying click
- Target: same clarity

## Miss
- GH: immediate negative signal
- Target: unmistakable

---

# 8. READABILITY

## GH Style
- strong lane contrast
- clear hit line

## Target
- predictable spacing
- zero ambiguity

---

# 9. TEST METHOD

1. Play identical rhythm in:
   - SparkSuite
   - Clone Hero (or video)
2. Compare:
   - timing feel
   - visual sync
   - feedback clarity

---

# 10. TUNING LOOP

```text
Adjust → Play → Compare → Repeat
```

Only adjust one variable at a time:
- input offset
- visual offset
- timing window

---

# DONE CRITERIA

- feels indistinguishable from reference
- no perceived lag
- timing feels natural

---

# WHY THIS MATTERS

This anchors SparkSuite to proven feel standards instead of guessing.
