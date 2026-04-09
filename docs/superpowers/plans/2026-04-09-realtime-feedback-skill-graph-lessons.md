# Real-Time Feedback + Skill Graph + Personalized Lessons -- Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add real-time gameplay feedback, persistent skill tracking, and adaptive lesson generation to SparkSuite.

**Architecture:** One engine, two modes (performance | practice). Skill tracker updates after each session via exponential smoothing. Lesson generator reads skill graph to produce targeted drills.

**Tech Stack:** Vanilla JS, no new dependencies. Tests via Node.js assert module.

---

## File Structure

| File | Responsibility | Action |
|------|---------------|--------|
| js/sparksuite/core/skill_tracker.js | Skill graph model + update + helpers | Create |
| js/sparksuite/core/lesson_generator.js | Drill generation from skill gaps | Create |
| js/state.js | Add skillGraph + feedback state fields | Modify |
| js/performance/session.js | Add delta tracking + combo pulse | Modify |
| js/pages/perform.js | Enhance hit badge + combo pulse | Modify |
| js/sparksuite/bridges/progress_bridge.js | Wire skill graph on session complete | Modify |
| js/performance/arrangements.js | Add mode flag to chart builders | Modify |
| index.html | Load 2 new script files | Modify |
| tests/test_skill_tracker.js | Tests for skill_tracker.js | Create |
| tests/test_lesson_generator.js | Tests for lesson_generator.js | Create |

Tasks 1-11 cover: skill tracker tests+impl, lesson generator tests+impl, state fields, real-time feedback detection+rendering, skill graph wiring, results screen surfacing, mode flag, final verification.

See the design spec for full task details: docs/superpowers/specs/2026-04-09-realtime-feedback-skill-graph-lessons-design.md
