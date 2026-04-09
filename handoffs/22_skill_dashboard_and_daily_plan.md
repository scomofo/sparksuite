# SparkSuite – Skill Dashboard + Daily Plan + Mastery System (22)

## Goal
Turn intelligence into visible, motivating UX:
1. Skill dashboard (visual progress over time)
2. Daily plan (auto-generated session)
3. Mastery system (skills, not just songs)

---

# 1. SKILL DASHBOARD

## Model

```js
{
  timing: [0.6, 0.65, 0.7, 0.72],
  rhythm: [0.5, 0.55, 0.6],
  laneAccuracy: {
    0: [0.8, 0.82],
    1: [0.6, 0.65],
    2: [0.7, 0.72],
    3: [0.5, 0.6]
  }
}
```

---

## UI

- simple line chart per skill
- last 5–10 sessions
- highlight improving vs declining

---

## Minimal Render

```js
function renderSkillLine(data) {
  // simple canvas line chart
}
```

---

# 2. DAILY PLAN

## Goal
Automatically generate a short session:

```text
Warmup → Weak Skill → Song → Challenge
```

---

## Generator

```js
function generateDailyPlan(user) {
  const weakSkill = findWeakSkill(user.skills);

  return [
    { type: "warmup", duration: 60 },
    generateLesson(user),
    selectNextSong(user, songTree),
    { type: "challenge", difficulty: "slightly_harder" }
  ];
}
```

---

## UI

- "Today’s Plan"
- 3–4 items
- one-tap start

---

# 3. MASTERY SYSTEM

## Skill-Based Unlocks

```js
if (user.skills.timing > 0.8) {
  unlock("advanced_timing_tracks");
}
```

---

## Mastery Levels

```js
{
  timing: "bronze | silver | gold",
  rhythm: "bronze | silver | gold"
}
```

---

## Progression Shift

```text
Songs = content
Skills = progression
```

---

# 4. UI SURFACING

- dashboard tab
- daily plan card (home)
- mastery badges

---

# DONE CRITERIA

- user can see skill trends
- daily plan is auto-generated
- mastery unlocks based on skill

---

# WHY THIS MATTERS

This creates:
- long-term engagement
- visible improvement
- deeper motivation than song completion
