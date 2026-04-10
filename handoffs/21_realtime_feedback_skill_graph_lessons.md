# SparkSuite – Real-Time Feedback + Skill Graph + Personalized Lessons (21)

## Goal
Push SparkSuite into elite territory:
1. Real-time feedback DURING gameplay
2. Skill graph (track ability over time)
3. Personalized lesson generation

---

# 1. REAL-TIME FEEDBACK (IN-GAME)

## Immediate Visual Feedback

```js
function renderRealtimeFeedback(delta, lane) {
  if (Math.abs(delta) < 30) showIndicator(lane, "perfect");
  else if (delta > 30) showIndicator(lane, "late");
  else if (delta < -30) showIndicator(lane, "early");
}
```

---

## Lane Error Highlight

```js
if (lanePlayed !== laneExpected) {
  flashLane(laneExpected, "error");
}
```

---

## Streak-Based Feedback

```js
if (state.combo % 10 === 0) {
  triggerComboPulse();
}
```

---

# 2. SKILL GRAPH

## Model

```js
user.skills = {
  timing: 0.7,
  rhythm: 0.6,
  chordAccuracy: 0.8,
  laneAccuracy: {
    0: 0.9,
    1: 0.6,
    2: 0.7,
    3: 0.5
  }
};
```

---

## Update Skills

```js
function updateSkills(events, user) {
  const timingScore = 1 - (avgAbsDelta(events) / 100);
  user.skills.timing = smooth(user.skills.timing, timingScore);

  const laneStats = analyzeLanes(events);
  Object.keys(laneStats).forEach(lane => {
    user.skills.laneAccuracy[lane] = 1 - (laneStats[lane] / events.length);
  });
}
```

---

## Trend Tracking

```js
user.history.push({
  date: Date.now(),
  skills: { ...user.skills }
});
```

---

# 3. PERSONALIZED LESSON GENERATION

## Input

```js
{
  weakestSkill: "timing",
  weakestLane: 3,
  accuracy: 0.62
}
```

---

## Generator

```js
function generateLesson(user) {
  if (user.skills.timing < 0.7) {
    return {
      type: "timing_drill",
      tempo: 60,
      pattern: "D D D D"
    };
  }

  const weakLane = findWeakLane(user.skills.laneAccuracy);

  return {
    type: "lane_drill",
    lane: weakLane,
    duration: 60
  };
}
```

---

## Inject into Flow

```js
if (needsPractice(user)) {
  next = generateLesson(user);
} else {
  next = selectNextSong(user, songTree);
}
```

---

# 4. UI SURFACING

- real-time indicators on highway
- results screen shows skill changes
- optional "Practice Recommended" card

---

# DONE CRITERIA

- user sees feedback DURING play
- skills tracked over time
- system generates targeted lessons

---

# WHY THIS MATTERS

This creates:
- true learning system
- visible improvement
- adaptive teaching loop
