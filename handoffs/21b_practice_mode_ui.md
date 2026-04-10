# SparkSuite – Practice Mode UI (Apple-Level) (21b)

## Goal
Design a clean, focused UI for rhythm/practice mode:
- zero distraction
- high clarity
- immediate feedback

---

# 1. LAYOUT

Top:
- Label: "Practice"
- Focus tag: "Timing"

Center:
- Highway (larger than performance mode)

Bottom:
- Tempo control
- Exit / Back

---

# 2. HIGHWAY DIFFERENCES

- Fewer lanes (1–2 max)
- Larger note size (+20%)
- Slower default scroll

---

# 3. REAL-TIME FEEDBACK

## Indicators

- Perfect → subtle green pulse
- Early → left nudge indicator
- Late → right nudge indicator

---

# 4. SIMPLIFIED UI

No:
- score
- combo
- clutter

Only:
- timing feedback

---

# 5. TEMPO CONTROL

```js
[ 60 BPM ]  [-] [+]
```

---

# 6. SESSION FLOW

```text
Start Drill → Repeat Loop → Adjust Tempo → Exit
```

---

# DONE CRITERIA

- user can focus on one skill
- feedback is immediate and clear
- no distractions from gameplay UI

---

# WHY THIS MATTERS

This creates a true training mode separate from performance.
