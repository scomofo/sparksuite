# SparkSuite – Daily Plan UI (Apple-Level, Pixel-Perfect) (23)

## Goal
Design a calm, clear, high-conversion home screen centered around the Daily Plan.

---

# 1. LAYOUT STRUCTURE

Top (Safe Area)
- Title: "Today"
- Subtitle: "Stay consistent"

Middle (Primary)
- Daily Plan Card (dominant element)

Below
- Secondary cards:
  - Progress (skills)
  - Continue Song

---

# 2. DAILY PLAN CARD

## Container
- Radius: 20px
- Padding: 20px
- Background: #1C1C1E

## Content

### Header
- "Today’s Plan" (16px semibold)
- Small badge: "~5 min"

### Steps (vertical list)

```text
• Warmup
• Timing Drill
• Island Groove (Song)
• Challenge
```

Each step:
- left: minimal icon (circle)
- center: label
- right: duration (e.g., 1m, 2m)

---

# 3. PRIMARY CTA

- Button: "Start"
- Full width
- Height: 52px
- Radius: 14px
- Fill: #FFFFFF
- Text: #000000

---

# 4. STEP STATES

- current → highlighted dot (#00FF88)
- completed → filled dot
- upcoming → outline

---

# 5. MICRO INTERACTIONS

## Start
- slight scale (1 → 0.96 → 1)

## Step completion
- checkmark fade + subtle pulse

---

# 6. SECONDARY CARDS

## Continue Song
- small horizontal card
- shows last played song + stars

## Skill Progress
- "Timing ↑"
- "Lane 3 improving"

---

# 7. COLOR SYSTEM

- Background: #000000
- Surface: #1C1C1E
- Primary: #FFFFFF
- Accent: #00FF88
- Secondary: #8E8E93

---

# 8. UX RULES

- one dominant action (Start)
- minimal text
- no clutter
- instant clarity

---

# DONE CRITERIA

- user knows exactly what to do in <2 seconds
- plan feels achievable
- UI feels calm and focused

---

# WHY THIS MATTERS

This becomes the habit loop entry point.

Open app → Start → Play → Improve → Repeat
