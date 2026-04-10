# SparkSuite – Animation System (Premium Feel Spec) (25)

## Goal
Define a cohesive animation system that makes SparkSuite feel polished, responsive, and premium.

---

# 1. PRINCIPLES

- Fast (100–200ms)
- Subtle (no exaggeration)
- Functional (feedback-driven)

---

# 2. GLOBAL MOTION SYSTEM

## Timing

```js
FAST = 120ms
MED = 180ms
SLOW = 240ms
```

## Easing

```js
easeOut = cubic-bezier(0.22, 1, 0.36, 1)
```

---

# 3. GAMEPLAY ANIMATIONS

## Note Hit

Perfect:
- scale: 1 → 1.15 → 1
- duration: 120ms

Good:
- scale: 1 → 1.05 → 1

Miss:
- slight horizontal shake (6px)

---

## Lane Feedback

- flash opacity: 0 → 0.2 → 0
- duration: 100ms

---

# 4. UI TRANSITIONS

## Screen Change

- fade + scale (0.98 → 1)
- duration: 180ms

---

## Button Tap

- scale: 1 → 0.96 → 1
- duration: 120ms

---

# 5. PROGRESSION MAP

## Node Unlock

- scale: 0.9 → 1
- fade: 0 → 1
- duration: 200ms

---

## Recommended Pulse

- subtle glow loop every 2s

---

# 6. RESULTS SCREEN

## Stars

- stagger: 120ms per star
- scale pop + fade

---

## Accuracy

- count-up animation

---

# 7. PRACTICE MODE

- minimal animation
- focus on clarity

---

# DONE CRITERIA

- animations feel responsive
- no lag or jitter
- motion enhances clarity

---

# WHY THIS MATTERS

This is the difference between:
- a working app
- a premium experience
