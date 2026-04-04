# Instrument Module Contract

## Required Registration Fields

Every instrument registers via `SparkInstruments.register(config)` with:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | yes | Unique app identifier (e.g. "chordspark", "ukespark") |
| `instrument` | string | yes | Instrument type ("guitar", "ukulele", "piano", "bass") |
| `name` | string | yes | Display name |
| `icon` | string | yes | Emoji or HTML entity |
| `skin` | object | no | Highway skin config: { laneCount, labels } |
| `available` | boolean | yes | Whether selectable by user |

## Required Methods

| Method | Returns | Description |
|--------|---------|-------------|
| `getData()` | object | { CHORDS, ALL_CHORDS, SESSIONS, SONGS, LC, LN, CHORD_NOTES, STRINGS, STRUM_PATTERNS, FINGER_EXERCISES, CURRICULUM, SKILL_TREE } |
| `init()` | void | One-time initialization on activation |
| `getSkillTree()` | { branches: [] } | Skill tree for progression UI |
| `getCurriculumMap()` | array | Lesson/curriculum data |
| `getExercises(skill?)` | array | Exercises for current or given skill |
| `getSongs()` | array | Available songs |
| `getDifficultyRules(context?)` | object | { targetType, difficultyAction, currentValue, nextValue, reason } |
| `analyzePerformance(sessionData)` | object | { accuracy, avgScore, stars } |
| `generateDrills(skill?, level?)` | array | Generated drill exercises |

## Required UI Overrides

| Method | Returns | Description |
|--------|---------|-------------|
| `ui.chord(chordObj, size, label, animate)` | string (SVG HTML) | Chord/note diagram for this instrument |
| `ui.header()` | string (HTML) | Instrument-specific header content |
| `ui.ring(pct, size, color)` | string (HTML) | Progress ring |

## Capability Flags (recommended)

Add to skin or top-level config:
- `stringCount` - number of strings (null for non-stringed)
- `noteLaneType` - "string" | "key" | "pad"
- `chordShapeSupport` - boolean
- `midiInput` - boolean
- `capoSupport` - boolean
- `performanceModes` - ["rhythm", "freestyle", "song"]

## Tab Renderers

Each instrument provides `tabRenderers: { practice, songs, stats, guide }` where each value is a `function()` returning HTML string.
