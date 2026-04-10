# Curriculum Contract

## Purpose

Documents the real curriculum data shapes used across SparkSuite instruments.
This is a reference for the actual contracts in use, not aspirational architecture.

---

## getCurriculumMap() Return Values

Every instrument exposes getCurriculumMap() on its registration object.
All return arrays, but the item shape varies by instrument.

### Source Locations

| Instrument | Source | Backing Data |
|------------|--------|--------------|
| Guitar | js/instruments/guitar/register.js | window.CURRICULUM (js/data.js) |
| Piano | js/instruments/piano/register.js | D.CURRICULUM (js/instruments/piano/data.js) |
| Bass | js/instruments/bass/register.js | this.getData().CURRICULUM (js/instruments/bass/data.js) |
| Ukulele | js/instruments/ukulele/register.js | window.SparkUkuleleLessons (js/sparksuite/instruments/ukulele/ukulele_lessons.js) |

---

## Curriculum Item Shapes

### Guitar / Piano (shared shape)

```javascript
{
  num: number,             // Level number (1-8)
  title: string,           // e.g. "First Spark"
  sub: string,             // Subtitle e.g. "Two-Finger"
  icon: string,            // Emoji or HTML entity
  sessions: string,        // Range e.g. "1-3"
  chords: string[],        // Chord names introduced at this level
  desc: string,            // Level description
  tip: string,             // Learning tip
  songs: string[],         // Song titles
  transitions: [{          // Chord transition metadata
    a: string,             //   from chord
    b: string,             //   to chord
    difficulty: number,    //   1-3 scale
    anchor: string         //   fingering instruction
  }]
}
```

Piano adds:
- `lhPattern: string` — left hand pattern ID (e.g. "R1", "R2")

### Bass

```javascript
{
  num: number,             // Level number (1-6)
  title: string,
  sub: string,
  sessions: string,
  skills: string[],        // Skill IDs (not chord names)
  desc: string,
  tip: string,
  icon: string,
  bpmRange: [number, number]  // Min/max tempo
}
```

Key difference: Bass uses `skills[]` instead of `chords[]`.

### Ukulele

```javascript
{
  id: string,              // e.g. "uke_01"
  num: number,             // Sequence number
  title: string,
  skill: string,           // Single skill ID
  prerequisites: string[], // Skill IDs that must precede
  masteryRequired: number, // 0.0-1.0 threshold
  desc: string
}
```

Key differences:
- Has explicit `id` field (others use `num` as implicit ID)
- Single `skill` instead of `chords[]` or `skills[]`
- Explicit `prerequisites` and `masteryRequired`
- No `sessions`, `songs`, or `transitions`

---

## Curriculum Registry

Located in `js/curriculum/curriculum_registry.js`.

```javascript
SparkCurriculum = {
  curriculums: {},   // id -> curriculum root
  tracks: {},        // id -> track
  units: {},         // id -> unit
  lessons: {}        // id -> lesson
}
```

Items registered via `registerCurriculum(type, items)` where items have `id` fields.
This is the legacy structured curriculum (curriculum -> tracks -> units -> lessons).
Not all instruments use it -- some bypass it with flat arrays from getCurriculumMap().

---

## Curriculum Engine (Legacy)

Located in `js/curriculum/curriculum_engine.js`.

Key functions:
- `getNextLessonFromCurriculum(curriculumId, completedLessons)` -- walks curriculum -> tracks -> units -> lessons
- `checkLessonUnlockRules(lessonId)` -- checks unlock prerequisites

Service wrapper: `window.SparkCurriculumService`
- `getNextLesson(curriculumId, completedLessons)`
- `isLessonUnlocked(lessonId)`
- `getLessonById(lessonId)`
- `getReviewTargets(userContext)` -- finds chords below 75% mastery
- `buildLearningQueue(userContext)` -- assembles review + next lesson + drills

---

## Curriculum Engine (SparkSuite Core)

Located in `js/sparksuite/core/curriculum_engine.js`.

Thin wrapper over `SparkCurriculumBridge`:
- `getDailyPracticeContext(instrumentContext)` -- returns `{ nextLessonId, nextLessonUnlocked }`

---

## Curriculum Bridge

Located in `js/sparksuite/bridges/curriculum_bridge.js`.

Bridges legacy curriculum engine to SparkSuite core:
- `getNextLesson(context)` -- resolves next lesson from curriculumMap array
- `isLessonUnlocked(lessonId)` -- delegates to legacy `checkLessonUnlockRules`

---

## Unlock Rules Shape

```javascript
{
  lessonsCompleted: string[],  // Lesson IDs that must be done
  playerLevel: number,         // Minimum player level
  mastery: {
    chords: string[]           // Chords that must be mastered
  }
}
```

---

## Review Target Shape

Returned by `SparkCurriculumService.getReviewTargets()`:

```javascript
{
  type: "chord",
  id: string,           // Chord name
  mastery: number,      // Current mastery (0-100)
  priority: string      // "high" (<25) | "medium" (<50) | "low" (<75)
}
```

---

## Learning Queue Item Shape

Returned by `SparkCurriculumService.buildLearningQueue()`:

```javascript
{
  type: string,         // "review" | "lesson" | "drill"
  id: string,           // Item identifier
  label: string,        // Display label
  priority: string,     // "high" | "medium" | "low" | "normal"
  mastery?: number      // Present for review items
}
```

---

## Level Colors and Names

All instruments provide parallel LC/LN objects:

```javascript
LC: { 1: "#22c55e", 2: "#3b82f6", 3: "#f97316", ... }
LN: { 1: "First Spark", 2: "The Anchor", ... }
```

Used by progression UI to color-code and label levels.

---

## Skill Tree Shape

```javascript
{
  id: string,           // e.g. "down_strum"
  category: string,     // e.g. "rhythm", "chords", "lead"
  label: string         // Display label
}
```

Returned by `getSkillTree()` on each instrument (as `{ branches: [] }` or flat array).
Skill IDs must match those referenced in curriculum items.

---

## Data Flow

```
Instrument.getCurriculumMap()
  |
  v
SparkCurriculumBridge.getNextLesson(context)
  |
  v
SparkCurriculumService.buildLearningQueue()
  |
  v
SessionEngine builds SessionPlan
  |
  v
PracticeEngine generates exercises from skills/chords
```

---

## Common Contract Violations

1. Curriculum references chords/skills that have no exercises
2. Skill tree IDs do not match curriculum skill references
3. Lesson unlock rules reference nonexistent lesson IDs
4. getCurriculumMap() returns items missing required fields for the instrument type
5. Bass/ukulele data copied from guitar with wrong field names (chords vs skills)
6. Level numbers in LC/LN do not cover all levels in curriculum

---

## Validation Checklist

When modifying curriculum for any instrument:

1. Every chord/skill in curriculum has matching exercises from getExercises()
2. Every skill ID in curriculum exists in getSkillTree()
3. Unlock rules reference valid, existing lesson IDs
4. LC/LN entries cover every level number in the curriculum
5. getCurriculumMap() returns non-empty array
6. CurriculumBridge can resolve at least one next lesson for a fresh user

