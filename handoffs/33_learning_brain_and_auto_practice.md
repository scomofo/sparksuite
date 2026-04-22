# SparkSuite – Learning Brain + Auto Practice Generation + Flow Visualization (33)

## Goal
Unify all engines into a cohesive "learning brain" that:
1. Understands user weaknesses
2. Generates targeted practice automatically
3. Surfaces improvement visually in real-time

---

# 1. LEARNING BRAIN (ORCHESTRATOR)

## Concept

The Learning Brain sits above engines and decides:
- what to train
- when to train it
- how to adapt over time

---

## Inputs

```js
performanceHistory
skillLevels
recentSessions
emotionState
```

---

## Output

```js
{
  focusSkill: "timing",
  confidence: 0.72,
  recommendation: "targeted_practice"
}
```

---

## Implementation

```js
function analyzeUser(user) {
  const weakest = findWeakestSkill(user.skills);

  return {
    focusSkill: weakest,
    recommendation: "practice"
  };
}
```

---

# 2. AUTO PRACTICE GENERATION

## Goal
Generate drills dynamically instead of relying only on static content

---

## Generator

```js
function generatePracticeFromWeakness(skill) {
  if (skill === "timing") {
    return {
      type: "rhythm",
      pattern: "D D D D",
      tempo: 60
    };
  }

  if (skill === "chord_transition") {
    return {
      type: "transition",
      from: "C",
      to: "Am"
    };
  }
}
```

---

## Integration

```js
if (brain.recommendation === "practice") {
  segment = generatePracticeFromWeakness(brain.focusSkill);
}
```

---

# 3. AUTO SONG ADAPTATION

## Concept

Modify songs based on skill:

```js
if (user.skill.timing < 0.6) {
  simplifyRhythm(chart);
}

if (user.skill.chords < 0.5) {
  reduceChordChanges(chart);
}
```

---

# 4. FLOW VISUALIZATION

## Goal
Show user improvement in real-time without clutter

---

## Signals

- "Timing improving"
- "Cleaner transitions"
- "Consistency up"

---

## Minimal UI

```text
Timing ↑
Accuracy ↑
```

---

# 5. ENGINE INTEGRATION

## Learning Brain should use:

- PracticeEngine → generate drills
- ProgressEngine → read skill levels
- PsychologyEngine → adjust delivery

---

# 6. SESSION HOOK

```js
const brain = analyzeUser(user);

const session = SessionEngine.buildSession(user);

session.segments.unshift(
  generatePracticeFromWeakness(brain.focusSkill)
);
```

---

# DONE CRITERIA

- system identifies weakest skill
- generates targeted practice automatically
- adapts songs and sessions dynamically

---

# WHY THIS MATTERS

This turns SparkSuite into a true intelligent learning system:
- not static lessons
- not fixed paths
- adaptive, personalized learning
