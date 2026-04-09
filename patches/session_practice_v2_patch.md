# SparkSuite Patch – Session + Practice Engine (V2 Cleanup)

## Objective
- Remove UI-shaped data from segments
- Normalize exercise schema
- Eliminate duplication
- Standardize rewards

---

# PATCH 1 — practice_engine.js

## REPLACE segment creation block

### BEFORE (conceptual)
Segments include label, desc, duration, meta

### AFTER

```js
var exercises = [];
var segments = [];

for (var i = 0; i < rawSegments.length; i++) {
  var seg = rawSegments[i];
  var exId = "ex_" + i;

  var exercise = {
    id: exId,
    type: seg.type,
    difficulty: context.difficulty || "normal",
    data: {
      presentation: {
        label: seg.label,
        reason: seg.desc
      },
      core: buildCore(seg),
      gameplay: buildGameplay(seg, context)
    }
  };

  exercises.push(exercise);

  segments.push({
    id: seg.id || ("seg_" + i),
    type: mapSegmentType(seg.type),
    exerciseIds: [exId]
  });
}
```

---

## ADD helpers

```js
function buildCore(seg) {
  return {
    skill: seg.meta?.skill || null,
    chords: seg.meta?.chords || null,
    pattern: seg.meta?.pattern || null
  };
}

function buildGameplay(seg, context) {
  var instrumentContext = context.instrumentContext || {};
  var rhythmAdapter = instrumentContext.rhythmAdapter;

  if (!rhythmAdapter) return null;

  return rhythmAdapter.createPayload({
    segment: seg,
    curriculum: context.curriculum || null,
    instrumentContext: instrumentContext
  });
}
```

---

# PATCH 2 — session_engine.js

## UPDATE buildSession return

### BEFORE
Segments only, no exercises, weak rewards

### AFTER

```js
return new SessionPlan({
  flow: flow,
  instrumentId: context.instrumentContext?.appId || null,
  focus: practicePlan.focus,

  difficulty: difficulty,

  segments: practicePlan.segments,
  exercises: practicePlan.exercises,

  rewards: {
    xp: 40,
    unlocks: [],
    achievements: []
  },

  context: {
    curriculum: curriculumContext
  }
});
```

---

# PATCH 3 — REMOVE duplication

DELETE from segments:
- label
- desc
- durationSec
- meta

All of this must live in exercise.data.presentation

---

# PATCH 4 — UI ADAPTER

Add helper:

```js
function getExercise(segment, session) {
  return session.exercises.find(e => e.id === segment.exerciseIds[0]);
}
```

Render from:

```js
const ex = getExercise(segment, session);

ex.data.presentation.label
ex.data.presentation.reason
```

---

# DONE CRITERIA

- Segments contain only orchestration
- Exercises contain ALL data
- No duplicated fields
- UI reads only from exercises
- Rewards standardized
