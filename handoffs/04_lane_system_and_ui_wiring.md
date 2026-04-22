# Lane System Spec + UI Wiring (SparkSuite Core)

## PART 1 — UNIVERSAL LANE SPEC

### Core Principle
The performance engine is **lane-based**, not instrument-based.

---

## Lane Object

```js
{
  lane: 0,                 // integer index
  label: "G",            // display label
  input: "key_a",        // input binding
}
```

---

## Note Object (Canonical)

```js
{
  id: "note_1",
  time: 1234,             // ms from start
  lane: 2,                // REQUIRED
  duration: 0,            // sustain if > 0
  velocity: 1.0,          // optional
}
```

---

## Chart Structure

```js
{
  chartId: "uke_island_pattern_01",

  tempo: 76,

  lanes: [
    { lane: 0, label: "G" },
    { lane: 1, label: "C" },
    { lane: 2, label: "E" },
    { lane: 3, label: "A" }
  ],

  notes: [
    { time: 0, lane: 0 },
    { time: 500, lane: 2 }
  ]
}
```

---

## Adapter Responsibility

Adapters convert domain → chart:

```js
ukuleleAdapter.createPayload()
  → returns chart with lanes + notes
```

NO instrument logic allowed in engine.

---

## HARD RULES

- No "guitar" anywhere in chart
- No stringIndex in runtime
- lane is REQUIRED
- engine reads only lane + time

---


# PART 2 — PERFORMANCE LOOP (UI INTEGRATION)

## Step 1 — Get Exercise

```js
function getExercise(segment, session) {
  return session.exercises.find(e => e.id === segment.exerciseIds[0]);
}
```

---

## Step 2 — Extract Chart

```js
const exercise = getExercise(segment, session);
const chart = exercise.data.gameplay;
```

---

## Step 3 — Initialize Runtime

```js
const state = {
  startTime: performance.now(),
  currentIndex: 0,
  hits: 0,
  total: chart.notes.length
};
```

---

## Step 4 — Input Handling

```js
window.addEventListener("keydown", (e) => {
  const lane = mapKeyToLane(e.key);
  handleInput(lane);
});
```

---

## Step 5 — Scoring

```js
function handleInput(lane) {
  const now = performance.now() - state.startTime;
  const note = chart.notes[state.currentIndex];

  const delta = Math.abs(now - note.time);

  if (lane === note.lane && delta < 100) {
    state.hits++;
  }

  state.currentIndex++;
}
```

---

## Step 6 — End Results

```js
function finish() {
  return {
    accuracy: state.hits / state.total,
    hits: state.hits,
    total: state.total
  };
}
```

---


# PART 3 — UI RENDERING

## Render Lanes

```js
chart.lanes.forEach(l => renderLane(l));
```

---

## Render Notes

```js
chart.notes.forEach(n => renderNote(n));
```

---

## IMPORTANT

UI NEVER:
- checks instrument type
- checks lesson type
- generates notes

UI ONLY:
- renders lanes
- renders notes
- captures input

---

# DONE CRITERIA

- Works for ukulele (4 lanes)
- Works for guitar (6 lanes)
- Same engine code
- No instrument conditionals

---

# WHY THIS IS THE CORE

This is the system that makes SparkSuite scalable.

Everything else (AI, curriculum, monetization) plugs into THIS.
