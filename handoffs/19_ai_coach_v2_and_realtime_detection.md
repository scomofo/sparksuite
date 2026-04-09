# SparkSuite – AI Coach v2 + Real-Time Mistake Detection (19)

## Goal
Add true intelligence to gameplay:
1. AI Coach v2 (personalized feedback)
2. Real-time mistake detection (per lane, per timing)

---

# 1. REAL-TIME MISTAKE DETECTION

## Extend Runtime State

```js
state.events = [];
```

---

## Capture Every Input

```js
function recordEvent(note, inputTime, lane, result) {
  state.events.push({
    noteTime: note.time,
    inputTime,
    laneExpected: note.lane || note.primaryLane,
    lanePlayed: lane,
    delta: inputTime - note.time,
    result
  });
}
```

---

## Hook Into Input

```js
const delta = now - note.time;
const result = judge(delta);

recordEvent(note, now, lane, result);
```

---

# 2. ANALYZE PERFORMANCE

## Timing Analysis

```js
function analyzeTiming(events) {
  const avg = events.reduce((s,e) => s + e.delta, 0) / events.length;

  if (avg > 40) return "late";
  if (avg < -40) return "early";
  return "on_time";
}
```

---

## Lane Accuracy

```js
function analyzeLanes(events) {
  const misses = {};

  events.forEach(e => {
    if (e.lanePlayed !== e.laneExpected) {
      misses[e.laneExpected] = (misses[e.laneExpected] || 0) + 1;
    }
  });

  return misses;
}
```

---

## Density Issues

```js
function detectStruggle(events) {
  const missRate = events.filter(e => e.result === "miss").length / events.length;

  if (missRate > 0.3) return "overloaded";
  return "ok";
}
```

---

# 3. AI COACH V2 OUTPUT

```js
function generateCoachV2(events, results) {
  const timing = analyzeTiming(events);
  const lanes = analyzeLanes(events);
  const struggle = detectStruggle(events);

  if (struggle === "overloaded") {
    return {
      message: "Too many misses—let’s slow this down",
      action: "reduce_speed",
      value: 0.75
    };
  }

  if (timing === "late") {
    return {
      message: "You’re consistently late—anticipate the beat",
      action: "timing_focus"
    };
  }

  if (timing === "early") {
    return {
      message: "You’re slightly early—relax into the rhythm",
      action: "timing_focus"
    };
  }

  const weakLane = Object.entries(lanes).sort((a,b) => b[1]-a[1])[0];

  if (weakLane) {
    return {
      message: `You’re missing notes on lane ${weakLane[0]}`,
      action: "lane_practice",
      lane: weakLane[0]
    };
  }

  return {
    message: "Great playing—push for perfection",
    action: "advance"
  };
}
```

---

# 4. PRACTICE INTEGRATION

```js
function applyCoachAction(coach) {
  if (coach.action === "reduce_speed") {
    state.speedMultiplier = coach.value;
  }

  if (coach.action === "lane_practice") {
    startLaneDrill(coach.lane);
  }
}
```

---

# 5. UI INTEGRATION

Results screen shows:

```js
coach.message
```

Optional:
- "Practice this" button
- "Slow down" toggle

---

# DONE CRITERIA

- events captured per note
- timing bias detected (early/late)
- weak lanes identified
- coach provides actionable advice

---

# WHY THIS MATTERS

This transforms SparkSuite into:
- personalized learning system
- not just gameplay
