# SparkSuite – SessionEngine Refactor Patch (Apply to Existing Code)

## Goal
Provide a DIRECT patch-style guide to refactor your existing `session_engine.js` and `practice_engine.js` into V2 clean architecture.

---

# 🔴 BEFORE (Typical Current State)

```js
segments.push({
  label: "Island timing",
  desc: "Tighten groove",
  durationSec: 120,
  exerciseType: "rhythm"
});
```

❌ Problems:
- UI fields inside core
- no normalization
- duplicated responsibility

---

# 🟢 AFTER (V2 CLEAN)

```js
const exId = "ex_" + id();

exercises.push({
  id: exId,
  type: "rhythm",
  data: buildRhythmData()
});

segments.push({
  id: "seg_rhythm",
  type: "practice",
  exerciseIds: [exId]
});
```

---

# 1. PATCH: practice_engine.js

## ❌ REMOVE

- label
- desc
- durationSec
- UI metadata

---

## ✅ ADD RETURN SHAPE

```js
return {
  segments,
  exercises
};
```

---

## ✅ ENSURE

- NO UI fields
- ONLY domain data

---

# 2. PATCH: session_engine.js

## ❌ REMOVE

Any logic like:

```js
if (uiMode === "something")
```

---

## ✅ ADD CLEAN PLAN STRUCTURE

```js
const plan = {
  id,
  flow,
  instrumentId,
  lesson,
  difficulty,
  segments: [],
  exercises: [],
  rewards: []
};
```

---

## ✅ MERGE PRACTICE OUTPUT

```js
const block = PracticeEngine.build(...);

plan.segments.push(...block.segments);
plan.exercises.push(...block.exercises);
```

---

# 3. PATCH: REMOVE UI LEAKS

## Anywhere you see:

```js
label
name
subtitle
description
```

👉 DELETE from core

---

# 4. PATCH: SEGMENT STANDARDIZATION

## Replace ALL segment types with ONLY:

```js
"practice"
"song"
"challenge"
```

---

# 5. PATCH: LEARNING BRAIN HOOK

## ADD

```js
const focus = findWeakestSkill(user.skills);
```

Pass into PracticeEngine

---

# 6. PATCH: UI CONTRACT

## FINAL RULE

UI receives ONLY:

```js
sessionPlan
```

UI derives:
- labels
- display text
- formatting

---

# 7. VALIDATION CHECKLIST

After patch:

- no UI fields in session plan
- segments reference exerciseIds only
- exercises contain all data
- UI renders without modifying data

---

# 🔥 RESULT

After applying this:

- architecture becomes enforceable
- engines become reusable
- system becomes extensible

---

# 🚨 FINAL RULE

If you see UI concepts inside engines → remove them immediately

This is the single biggest architecture risk.
