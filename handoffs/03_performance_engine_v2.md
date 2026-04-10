# Performance Engine V2 (Detailed Spec)

## Goal
Create reusable rhythm gameplay engine (Guitar Hero style)

---

## Architecture

PerformanceEngine
- NoteMapper
- TimingWindow
- InputHandler
- ScoringSystem

---

## Note Model

```js
{
  time: 1000,
  type: "chord",
  value: "C"
}
```

---

## Input Model

```js
{
  timestamp: 1020,
  input: "C_chord"
}
```

---

## Timing Windows

- perfect: <50ms
- good: <100ms
- miss: >100ms

---

## Scoring

```js
function score(input, note) {
  const delta = Math.abs(input.timestamp - note.time);
  if (delta < 50) return "perfect";
  if (delta < 100) return "good";
  return "miss";
}
```

---

## Output

```js
{
  accuracy: 0.87,
  timing: 0.81,
  mistakes: 2
}
```

---

## Rule
No instrument-specific logic.
Use instrument modules.

---

## Done Criteria
- Works across instruments
- Feeds PracticeEngine + ProgressEngine
