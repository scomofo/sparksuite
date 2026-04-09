# Refactor Execution Handoff V2 (Codex-Ready, Detailed)

## Objective
Fully migrate SparkSuite to engine-driven architecture. UI must render only.

---

## Step 1 — Hard Search Targets
Search and flag ALL matches:
- lesson
- difficulty
- xp
- reward
- next
- level

For each match, tag destination:
- CurriculumEngine → lesson selection
- PsychologyEngine → difficulty decisions
- ProgressEngine → xp/rewards
- PracticeEngine → exercise creation
- SessionEngine → flow

---

## Step 2 — Replace Session Entry

Replace ALL session starts with:

```js
const session = SparkCore.startSession(user);
```

Replace ALL completions with:

```js
const result = SparkCore.completeSession(results);
```

---

## Step 3 — Delete UI Logic (Mandatory)

Remove ALL:

```js
if (user.level > ...)
if (accuracy > ...)
if (lesson.type === ...)
```

Replace with:

```js
segment.type
```

---

## Step 4 — Enforce SessionPlan Contract

SessionEngine MUST return:

```js
{
  lesson,
  difficulty,
  segments,
  exercises,
  rewards
}
```

---

## Step 5 — Isolation Test

Add test instrument:

```js
instrumentManager.registerInstrument("test", {...});
```

If core changes required → architecture is broken.

---

## Done Criteria
- UI has zero learning logic
- SparkCore owns all decisions
- New instruments plug in cleanly
