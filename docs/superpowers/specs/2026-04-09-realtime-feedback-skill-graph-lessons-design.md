# Real-Time Feedback + Skill Graph + Personalized Lessons

**Date:** 2026-04-09
**Handoff:** #21 — `21_realtime_feedback_skill_graph_lessons.md`
**Status:** Approved

---

## Goal

Push SparkSuite into an adaptive learning platform with three capabilities:

1. Real-time feedback DURING gameplay (timing direction, lane errors, combo pulses)
2. Skill graph that tracks ability over time with trend history
3. Personalized lesson generation from skill gaps

## Architecture

One engine, two modes. Charts carry a `mode` flag:

- `"performance"` — song-driven, full scoring, progression
- `"practice"` — generated drills, pattern-driven, skill-building

Both modes use the same highway renderer and scoring pipeline. The difference is content source and UI emphasis.

---

## 1. Real-Time Feedback (In-Game)

### Location

- Detection: `js/performance/session.js`
- Rendering: `js/pages/perform.js` + `js/performance/highway.js`

### Three feedback signals

**Timing indicator:** On every hit, classify the delta as early/perfect/late and display direction + color on the highway. Thresholds: perfect < 30ms, good < 90ms, else early/late.

**Lane error flash:** When the played lane differs from expected, pulse the correct lane with an error color via `SparkHighway.notifyHit()`. The highway already accepts (x, y, color) — pass error color [255, 68, 68] for misses.

**Combo pulse:** At every 10x combo milestone, set `S.performComboPulseAt = Date.now()`. The perform page checks this timestamp and renders a brief scale/glow animation on the combo counter.

### New state fields in `js/state.js`

```js
performLastHitDelta: 0,        // ms: negative = early, positive = late
performLastHitDirection: "",   // "early" | "perfect" | "late" | ""
performComboPulseAt: 0         // timestamp of last 10x combo milestone
```

### Changes to `js/performance/session.js`

In the hit detection path (~line 417-445):

- Compute `delta = hitTimeSec - expectedTimeSec` in ms
- Set `S.performLastHitDelta = delta`
- Set `S.performLastHitDirection` based on thresholds
- On combo % 10 === 0: set `S.performComboPulseAt = Date.now()`

### Changes to `js/pages/perform.js`

- Extend hit feedback badge to show direction ("Early", "Perfect!", "Late") with color coding:
  - Perfect: #4ECDC4 (teal)
  - Early: #FFE66D (gold)
  - Late: #FF6B6B (red)
- Add combo pulse: when `Date.now() - S.performComboPulseAt < 600`, apply scale animation to combo counter

---

## 2. Skill Graph

### Location

New file: `js/sparksuite/core/skill_tracker.js` (~80 lines)

### Data model (stored in `S.skillGraph`)

```js
{
  timing: 0.5,
  rhythm: 0.5,
  chordAccuracy: 0.5,
  laneAccuracy: { 0: 0.5, 1: 0.5, 2: 0.5, 3: 0.5, 4: 0.5, 5: 0.5 },
  history: []  // Array of { date: timestamp, skills: { timing, rhythm, chordAccuracy } }
}
```

### Update algorithm

Called after each session completes, receives the scoring summary. Uses exponential smoothing with alpha = 0.3.

- Timing: `1 - (avgAbsDelta / 100)`, clamped 0-1
- Rhythm: directly from accuracy
- Chord accuracy: chord hits / chord attempts
- Lane accuracy: `1 - (laneErrors[lane] / totalNotes)` per lane

History capped at 30 snapshots.

### Integration point

Wire into `js/sparksuite/bridges/progress_bridge.js` in the session completion flow. Call `updateSkillGraph(S.skillGraph, summary)` after scoring.

### Helper functions

- `getWeakestSkill(skillGraph)` — returns the skill key with lowest value
- `getWeakestLane(skillGraph)` — returns the lane index with lowest accuracy
- `getSkillDelta(skillGraph, previousSnapshot)` — returns per-skill changes for results display

---

## 3. Personalized Lesson Generation

### Location

New file: `js/sparksuite/core/lesson_generator.js` (~60 lines)

### Output

A practice chart descriptor:

```js
{
  type: "timing_drill" | "lane_drill" | "chord_drill",
  mode: "practice",
  tempo: number,
  pattern: string,
  lane: number | null,
  duration: 30,
  label: string
}
```

### Decision tree

1. If timing < 0.6 → timing_drill (60 BPM, "D D D D")
2. Else if any laneAccuracy < 0.5 → lane_drill (weakest lane, 80 BPM)
3. Else if chordAccuracy < 0.7 → chord_drill ("D D U U D U", 70 BPM)
4. Else → null (no drill needed, advance to next song)

### Integration

- Called from `practice_engine.js` when building daily plan segments
- Called on results screen to generate "Practice Recommended" card
- Descriptor converted to playable chart via `expandStrumPattern()`

---

## 4. Mode Flag

Add `mode: "performance" | "practice"` to chart objects. Default: `"performance"`.

Practice mode differences:
- Results show skill focus instead of song title
- No star rating or phrase breakdown
- "Retry Drill" instead of "Retry Song"
- No song completion tracking (XP still awarded)

---

## 5. UI Surfacing

### Results screen additions

Skill delta card showing per-skill changes with arrows.
"Practice Recommended" card with drill details and [Start Drill] button.

### Files modified

- Rhythm highway results (~line 335)
- Guitar/shared perform results
- Piano results page

---

## Files Summary

| Component | File | Action |
|-----------|------|--------|
| State fields | `js/state.js` | Add skillGraph, feedback fields |
| Real-time feedback | `js/performance/session.js` | Add delta tracking, combo pulse |
| Feedback rendering | `js/pages/perform.js` | Enhance hit badge, add combo pulse |
| Skill tracker | `js/sparksuite/core/skill_tracker.js` | **New** (~80 lines) |
| Lesson generator | `js/sparksuite/core/lesson_generator.js` | **New** (~60 lines) |
| Skill graph wiring | `js/sparksuite/bridges/progress_bridge.js` | Call updateSkillGraph on session complete |
| Results surfacing | perform results pages | Add skill delta + practice card |
| Script loading | `index.html` | Add 2 new script tags |

---

## Done Criteria

1. User sees timing direction feedback (early/perfect/late) during play
2. Lane errors flash the correct lane
3. Combo milestones (10x) trigger a visual pulse
4. `S.skillGraph` persists timing, rhythm, chordAccuracy, laneAccuracy with 30-entry history
5. `generateLesson()` returns a targeted drill based on weakest skill
6. Results screen shows skill changes and "Practice Recommended" card
7. Chart mode flag distinguishes performance vs practice
