# SparkSuite – Progression UI (Apple-Level, Pixel-Perfect) (11b)

## Design Principles
- Extreme clarity
- Generous whitespace
- Minimal color
- Strong hierarchy
- Subtle motion

---

# 1. LAYOUT STRUCTURE

## Screen

Top (Safe Area)
- Title: "Progress"
- Subtitle: "Ukulele Path"

Middle (Primary)
- Progression Map (centered, breathing room)

Bottom (Secondary)
- Current Level + XP bar
- "Continue" button (recommended song)

---

# 2. GRID + SPACING

- 8pt spacing system
- Node size: 56px
- Vertical spacing between tiers: 96px
- Horizontal spacing: 80–120px adaptive

---

# 3. NODE DESIGN

## Default Node

- Shape: Circle
- Size: 56px
- Fill: #FFFFFF
- Stroke: none

## Locked Node

- Fill: #1C1C1E
- Opacity: 0.4

## Completed Node

- Fill: #FFFFFF
- Subtle inner shadow

## Recommended Node

- Outer ring: 2px
- Color: #00FF88

---

# 4. STAR DISPLAY

Below node:

- Font size: 12px
- Color:
  - Filled: #FFD60A
  - Empty: #3A3A3C

```text
★★☆
```

---

# 5. CONNECTION LINES

- Color: #2C2C2E
- Width: 1px
- Slight opacity (0.6)

---

# 6. TYPOGRAPHY

- Title: 24px / Semibold
- Subtitle: 14px / Regular / #8E8E93
- Node labels: hidden (clean map)

---

# 7. CONTINUE BUTTON

- Full width
- Height: 52px
- Radius: 14px
- Fill: #FFFFFF
- Text: "Continue"
- Secondary text: song title

---

# 8. XP BAR

- Height: 6px
- Background: #2C2C2E
- Fill: #00FF88
- Rounded ends

---

# 9. INTERACTIONS

## Tap Node
- Scale: 1 → 0.96 → 1
- Duration: 120ms

## Unlock Animation
- Fade in + scale from 0.9 → 1

## Recommended Pulse
- Subtle glow pulse every 2s

---

# 10. COLOR SYSTEM

- Background: #000000
- Primary: #FFFFFF
- Secondary: #8E8E93
- Accent: #00FF88
- Warning: #FF453A

---

# DONE CRITERIA

- Map is readable at a glance
- Recommended path is obvious
- No visual clutter
- Smooth interactions

---

# WHY THIS MATTERS

This is the layer users emotionally connect with.

It turns progression into something they *want* to complete.
