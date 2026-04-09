# Vertical Slice V2 – Ukulele (Full System)

## Goal
Complete end-to-end playable session with no UI logic.

---

## Flow

1. SparkCore.startSession(user)
2. SessionEngine builds SessionPlan
3. UI renders segments
4. PerformanceEngine runs gameplay
5. Results → SparkCore.completeSession()

---

## SessionPlan Example

```js
{
  lesson: "uke_02",
  difficulty: "easy",
  segments: [
    { type: "practice", exerciseIds: ["ex1"] },
    { type: "song", exerciseIds: ["ex2"] }
  ],
  exercises: [
    { id: "ex1", type: "chord", data: { chords: ["C","Am","F"] } },
    { id: "ex2", type: "song", data: { progression: ["C","F","G"] } }
  ],
  rewards: { xp: 50 }
}
```

---

## UI Rules
- No conditionals for logic
- Only render segment.type

---

## Completion

```js
SparkCore.completeSession(results)
```

---

## Done Criteria
- Full loop works
- No UI logic
- Easily swap instrument
