# SparkSuite – Audio Feedback + Haptic Simulation + Typography System (26)

## Goal
Elevate sensory experience:
1. Audio feedback system
2. Haptic-style feedback (visual + audio)
3. Typography + spacing refinement

---

# 1. AUDIO FEEDBACK SYSTEM

## Events

```js
hit_perfect
hit_good
miss
menu_tap
```

---

## Design

- very short sounds (20–80ms)
- soft, percussive
- no harsh highs

---

## Mapping

```js
play("tick_soft") // perfect
play("tick_light") // good
play("tap_low") // miss
```

---

# 2. HAPTIC SIMULATION (VISUAL)

## Perfect

- scale + subtle glow

## Miss

- micro shake + dim flash

---

## Combined

```js
onHit → animation + sound
```

---

# 3. TYPOGRAPHY SYSTEM

## Font
- neutral sans-serif (SF / Inter)

## Scale

```text
H1: 28
H2: 20
Body: 16
Caption: 13
```

---

## Rules

- max 3 sizes per screen
- strong weight contrast
- no decorative fonts

---

# 4. SPACING SYSTEM

```text
4 / 8 / 16 / 24 / 32
```

---

# DONE CRITERIA

- sound reinforces actions
- visuals + sound feel unified
- typography is consistent and calm

---

# WHY THIS MATTERS

This completes the sensory loop:
visual + motion + sound
