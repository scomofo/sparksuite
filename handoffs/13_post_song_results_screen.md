# SparkSuite – Post-Song Results Screen (13)

## Goal
Create a high-impact results screen that:
- reinforces performance
- motivates improvement
- drives next action

---

# 1. LAYOUT STRUCTURE

## Top
- Result label ("Great", "Nice", "Keep Going")
- Accuracy % (large)

## Middle
- Star rating (1–3 stars, large)
- Stats row (combo, hits, misses)

## Bottom
- Primary CTA: "Continue" (recommended song)
- Secondary: "Retry"

---

# 2. VISUAL HIERARCHY

## Accuracy
- 48px
- bold
- centered

## Stars
- large (32px each)
- animated fill

---

# 3. RESULT STATES

```js
function getResultLabel(acc) {
  if (acc >= 0.9) return "Excellent";
  if (acc >= 0.75) return "Great";
  if (acc >= 0.6) return "Good";
  return "Keep Going";
}
```

---

# 4. STATS

```js
{
  accuracy,
  maxCombo,
  hits,
  misses
}
```

Display as 3 columns:
- Combo
- Hits
- Misses

---

# 5. STAR ANIMATION

```js
function animateStars(stars) {
  for (let i = 0; i < stars; i++) {
    setTimeout(() => fillStar(i), i * 150);
  }
}
```

---

# 6. CTA LOGIC

## Continue
- goes to recommended next song

## Retry
- restarts same song

---

# 7. OPTIONAL INSIGHT (LIGHT AI HOOK)

```js
if (accuracy < 0.7) {
  message = "Focus on timing consistency";
}
```

---

# 8. UX RULES

- no clutter
- focus on 3 things: score, stars, next action
- fast transition from gameplay → results

---

# DONE CRITERIA

- accuracy clearly displayed
- stars visible + animated
- stats readable
- next action obvious

---

# WHY THIS MATTERS

This is the emotional peak of the loop.

If done right:
- users feel progress
- users want to continue
