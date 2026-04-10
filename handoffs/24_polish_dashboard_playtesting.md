# SparkSuite – Animation Polish + Skill Dashboard UI + Playtesting Loop (24)

## Goal
Finalize product quality and prepare for real users:
1. Animation polish (premium feel)
2. Skill dashboard UI (visual progress)
3. Playtesting + iteration loop

---

# 1. ANIMATION POLISH

## Principles
- subtle
- fast
- purposeful

---

## Key Animations

### Screen Transitions

```js
fade + slight scale (0.98 → 1)
```

---

### Note Hit Feedback

```js
perfect → quick scale + fade
miss → slight shake
```

---

### Progression Map

- node unlock: scale + fade
- recommended: slow pulse

---

# 2. SKILL DASHBOARD UI

## Layout

Top:
- Title: "Progress"

Middle:
- Skill cards (stacked)

---

## Skill Card

- Label: "Timing"
- Trend: ↑ or ↓
- Mini line graph (last 5 sessions)

---

## Minimal Chart

```js
function drawLine(data) {
  // simple canvas line
}
```

---

## Focus

- show improvement
- avoid complexity

---

# 3. PLAYTESTING LOOP

## Goal
Iterate based on real usage

---

## What to Track

- session length
- completion rate
- retries per song
- drop-off point

---

## Simple Logging

```js
logEvent("song_complete", { accuracy, time });
```

---

## Feedback Questions

Ask users:
- was timing clear?
- did you know what to do next?
- did it feel fun?

---

## Iteration Cycle

```text
Test → Observe → Fix → Repeat
```

---

# DONE CRITERIA

- app feels smooth and responsive
- users understand flow immediately
- no major friction points

---

# WHY THIS MATTERS

This is where good systems become great products.
