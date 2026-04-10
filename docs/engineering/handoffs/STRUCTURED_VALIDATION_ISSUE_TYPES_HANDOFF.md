# Structured Validation Issue Types Handoff

## Goal

Define a formal issue type schema so that the validator, fix suggester,
CI guardrails, inline highlighter, and dev panel all speak the same
language when describing curriculum problems.

## Current State

Issues are currently free-form strings assembled ad hoc in:
- tests/test_curriculum_guardrails.js (assert messages)
- scripts/suggest_curriculum_fixes.js ("FIX: [id] ..." strings)
- js/dev/dev_curriculum_highlighter.js (getIssues() returns { skills, lessons, levels })

This makes it impossible to filter, sort, deduplicate, or route issues
consistently across tools.

## Issue Type Schema

Every validation issue should be a structured object:

    {
      code: string,        // machine-readable issue code
      severity: string,    // "error" | "warning" | "info"
      category: string,    // "skill" | "lesson" | "level" | "chord" | "exercise"
      instrument: string,  // instrument id (e.g. "ukespark")
      target: string,      // the specific item with the issue (skill id, lesson id, level num)
      message: string,     // human-readable description
      fix: string|null,    // suggested fix action (optional)
      nav: object|null     // navigation hint for UI (optional)
    }

## Issue Codes

### Errors (hard breaks)

| Code | Category | Description |
|------|----------|-------------|
| SKILL_NOT_IN_TREE | skill | Lesson references a skill not in skill tree |
| PREREQ_NOT_IN_TREE | skill | Lesson prerequisite not in skill tree |
| CHORD_NOT_IN_DATA | chord | Curriculum chord not in ALL_CHORDS |
| CURRICULUM_EMPTY | lesson | getCurriculumMap() returns empty array |
| LESSON_MISSING_ID | lesson | Lesson item has no id or num |
| DUPLICATE_LESSON_ID | lesson | Two lessons share the same id |

### Warnings (degraded but functional)

| Code | Category | Description |
|------|----------|-------------|
| NO_EXERCISES_FOR_SKILL | exercise | Skill exists but has no mapped exercises |
| LC_MISSING | level | Level has no color in LC map |
| LN_MISSING | level | Level has no name in LN map |
| MASTERY_OUT_OF_RANGE | lesson | masteryRequired not in 0-1 range |
| SKILL_TREE_EMPTY | skill | getSkillTree() returns empty structure |

### Info

| Code | Category | Description |
|------|----------|-------------|
| EXERCISES_EMPTY | exercise | getExercises() returns empty array |
| SONGS_EMPTY | lesson | getSongs() returns empty array |

## Navigation Hints

Each issue can include a nav object for click-to-navigate:

    { screen: "skillTree", focus: "overview" }
    { screen: "home", tab: "practice", level: 5 }

The dev panel uses these to wire up clickable issue rows.

## Fix Suggestions

Each issue can include a fix string:

    "Add skill barre_chords to SparkUkuleleSkillTree"
    "Add LC[5] entry in register.js"

The fix suggester script should output these alongside the issue.

## Severity Filtering

The dev panel (DOCKABLE_FILTERABLE_OVERLAY_HANDOFF.md) uses severity
to filter the issue list:

- **error**: always shown, red badge
- **warning**: shown by default, orange badge
- **info**: hidden by default, gray badge

## Implementation

### Shared validator module

Create: js/dev/curriculum_validator.js

Exports a single function:

    function validateCurriculum(instrument) -> Issue[]

This replaces the inline getIssues() in dev_curriculum_highlighter.js
and the ad hoc checks in test_curriculum_guardrails.js.

All three consumers use the same validator:
- dev_curriculum_highlighter.js (UI highlighting)
- test_curriculum_guardrails.js (CI test)
- suggest_curriculum_fixes.js (CLI fix suggestions)

### Consumer changes

| Consumer | Change |
|----------|--------|
| dev_curriculum_highlighter.js | Replace getIssues() with validateCurriculum() |
| test_curriculum_guardrails.js | Call validateCurriculum(), assert no errors |
| suggest_curriculum_fixes.js | Call validateCurriculum(), print fix field |
| dev_panel.js (future) | Filter by severity/category from structured issues |

## Constraints

- Validator must work in both browser (eval) and Node (require) contexts
- No external dependencies
- Issue codes must be stable (used in CI assertions)
- Adding new issue types must not break existing consumers

## Definition of Done

- All issues returned as structured objects with code, severity, category
- Single validator module used by all consumers
- Dev panel can filter issues by severity and category
- CI test can assert on issue codes not just string messages
- Fix suggestions include actionable fix strings

## Related Docs

- docs/engineering/CURRICULUM_CONTRACT.md
- docs/engineering/INSTRUMENT_DEBUG_GUIDE.md
- docs/engineering/handoffs/DOCKABLE_FILTERABLE_OVERLAY_HANDOFF.md
- docs/engineering/handoffs/HOT_RELOAD_DEV_OVERLAY_HANDOFF.md
