# SparkSuite – Final Layer: Polish + AI Coach + Launch (15)

## Goal
Take SparkSuite from complete system → production-ready product:
1. Visual polish (premium feel)
2. AI coach (intelligent feedback)
3. Launch readiness (deployable loop)

---

# 1. VISUAL POLISH PASS

## Principles
- motion clarity
- zero clutter
- consistent spacing

---

## Additions

### Note Highway
- subtle gradient background
- lane separators (low contrast)

### Feedback
- particle burst on perfect
- slight screen shake on miss

### Transitions

```js
function fadeTransition(next) {
  ctx.globalAlpha = 0;
  // fade in/out logic
}
```

---

# 2. AI COACH (POST-RESULTS)

## Input

```js
{
  accuracy,
  timingErrors,
  missedNotes,
  weakLanes
}
```

---

## Output

```js
{
  message: "You're slightly late on chord changes",
  recommendation: "Replay at 75% speed",
  focus: "timing"
}
```

---

## Rule Engine v1

```js
function generateCoach(results) {
  if (results.accuracy < 0.6) return "Slow down and focus on accuracy";
  if (results.misses > results.hits * 0.3) return "Work on consistency";
  return "Great timing—push for perfection";
}
```

---

# 3. PRACTICE RECOMMENDATIONS

```js
if (results.accuracy < 0.7) {
  nextMode = "practice";
} else {
  nextMode = "progression";
}
```

---

# 4. LAUNCH LOOP

## Entry

```js
const next = selectNextSong(user, songTree);
startSong(next.id);
```

---

## Persistent State

- user progress saved locally
- resume last session

---

# 5. DONE CRITERIA

- gameplay feels smooth and responsive
- feedback feels rewarding
- AI provides useful guidance
- loop runs without friction

---

# WHY THIS MATTERS

This is the difference between:
- a working system
- a product people actually use daily
