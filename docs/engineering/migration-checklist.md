# SparkSuite Migration Checklist

Tracks which flows use the new engine contracts vs legacy direct-call paths.

## Legend
- **Dual-path**: Both legacy and contract paths run (validation phase)
- **Contract-only**: Fully migrated to engine contracts
- **Legacy-only**: Not yet migrated

## Session Planning (Phase 2)

| Flow | SessionPlan Contract | Status |
|------|---------------------|--------|
| quickStart | Yes (via wrapPlan) | Dual-path |
| guided | Yes (via wrapPlan + lessonRef) | Dual-path |
| chord | Yes (via wrapPlan) | Dual-path |
| drill | Yes (via wrapPlan) | Dual-path |

## Progress Outcomes (Phase 3/6)

| Flow | applySessionOutcome | Status |
|------|-------------------|--------|
| quickStart timer complete | Yes | **Contract-only** — orchestrator drives via `applySessionOutcome(result, {drive:true})`; the paired legacy `processResults` call at the call site is retired (the same completion handler also serves single-chord timer sessions) |
| drill timer complete | Yes | **Contract-only** — orchestrator drives the drill completion sequence via `applySessionOutcome(result, {drive:true})` (drill-mode branch); the paired legacy call at the call site is retired |
| performance finish | Core-driven | **Contract-only** — `core.completeSession` is the single driver; the shadow observer beside it is retired |
| guided session complete | Core-driven | **Contract-only** — `core.completeGuidedSession`/`completeSession` drive; the coreless read-only observer is retired |
| daily challenge complete | Yes | **Contract-only** — orchestrator drives via `{drive:true}` daily branch (challenge XP policy lives in the engine) |
| runner game complete | Yes | **Contract-only** — orchestrator drives via `{drive:true}` runner branch (score→XP policy lives in the engine) |
| rhythm game complete | Yes | **Contract-only** — orchestrator drives via `{drive:true}` rhythm branch (score→XP policy lives in the engine) |
| practice engine finish | Core-driven | **Contract-only** — `core.completeSession` with `earnedCompletion` is the single driver; the shadow observer is retired |

## Instrument Contracts (Phase 4)

| Instrument | Capability Flags | Normalized Methods | Status |
|-----------|-----------------|-------------------|--------|
| Guitar | Yes | getExercisesForLesson, getPerformanceConfig | Complete |
| Ukulele | Yes | getExercisesForLesson, getPerformanceConfig | Complete |
| Piano | Yes | getExercisesForLesson, getPerformanceConfig | Complete |
| Bass | Yes | getExercisesForLesson, getPerformanceConfig | Complete |

## Curriculum (Phase 5)

| Feature | Service API | Status |
|---------|-----------|--------|
| getNextLesson | SparkCurriculumService.getNextLesson | Available |
| isLessonUnlocked | SparkCurriculumService.isLessonUnlocked | Available |
| getLessonById | SparkCurriculumService.getLessonById | Available |
| getReviewTargets | SparkCurriculumService.getReviewTargets | Implemented |
| buildLearningQueue | SparkCurriculumService.buildLearningQueue | Implemented |
| getNextGuidedSession | SparkCurriculumService.getNextGuidedSession | Implemented |
| Legacy SparkSession guided mode | Asks getNextGuidedSession for next session + lock check | Done (groundwork — see note) |
| Live v2 guided flow (session_engine.js buildGuidedSession) | Calls getNextGuidedSession with per-instrument completion scoping (PR #108) | Done |

## Gameplay Logic Extraction

| Handler | Engine Method | Status |
|---------|--------------|--------|
| guitar drillSwitch (adaptive BPM, transition stats, microrewards) | PracticeEngine.processDrillSwitch (PR #110) | Dual-path |
| guitar answerQuiz (XP delta, streak, hat-trick) | PracticeEngine.processQuizAnswer (PR #110) | Dual-path |
| guitar startFingerEx completion (counts, XP, finger stats) | PracticeEngine.processFingerExerciseCompletion (PR #110) | Dual-path |

## Performance Integration (Phase 6)

| Flow | Unified Result Schema | Status |
|------|---------------------|--------|
| Performance song finish | Core completion request | Contract-only (core-driven; shadow observer retired) |
| Practice engine finish | Core completion request | Contract-only (core-driven; shadow observer retired) |

## Legacy Removal (Phase 7)

**All Phase 3/6 dual-path flows are retired.** Two retirement shapes were used:

- **Orchestrator-driven** (quickStart, drill, daily, rhythm, runner): the flows
  whose legacy driver lived at the call site now make one
  `applySessionOutcome(result, {drive:true})` call; drive mode dispatches per
  result mode and owns the reward policy (activity XP, score→XP formulas,
  challenge XP). Legacy branches remain only as no-contract-stack fallbacks.
- **Core-driven** (performance finish, guided complete, practice plan finish):
  these were already driven by the v2 core's `completeSession` — the
  "dual-path" was a read-only shadow observer beside it, which is now removed.

The session progression sequence itself is absorbed into the orchestrator as
`SparkProgressOrchestrator.runSessionProgression`; `SparkSession.processResults`
is a thin delegate kept for legacy callers. Pinned by
`tests/test_progress_orchestrator_drive.js`. Next consolidation step (see
spark-core-retirement-inventory.md): converge the two completion entry points
(`core.completeSession` and drive mode) and finish the barrel retirement.

### Retirement criteria (met)
The 2+ week dual-path validation window elapsed with no logged discrepancies
before the retirements above landed; the criteria section is kept for the
record.

## Visual Refresh (Vibrant Playground)

| Component | V2 Styled | Status |
|-----------|----------|--------|
| CSS Foundation | spark-visual-v2.css | Complete |
| Theme Engine | js/ui/theme.js | Complete |
| Home Dashboard | sv2HomeDashboard() | Complete |
| Header/Logo | v2 overrides | Complete |
| Tab Active State | Instrument colored | Complete |
| Confetti System | SparkConfetti.burst() | Complete |
| XP Float | SparkXPFloat.show() | Complete |
| Session Page | Not yet | Pending |
| Completion Page | Not yet | Pending |
| Chord Diagram Glow | Not yet | Pending |
| Focus Toggle | Not yet | Pending |

## Remaining Work

_Audited against source 2026-08-05. Several items previously listed here were
already implemented; the list below reflects current reality._

### Done

0. ✅ Removed the abandoned top-level `engine/` TypeScript prototype (10 files, one early-history commit, zero references from `index.html`, `js/`, tests, or the electron-builder `files` list). The live core is `js/sparksuite/core/`; the TS tree only duplicated it (e.g. `timing-engine.ts` vs the wired, calibration-aware `js/sparksuite/core/timing_engine.js`) and misled readers about the target architecture.
1. ✅ `buildLearningQueue(userContext)` on CurriculumService — `js/curriculum/curriculum_engine.js`; covered by `test_curriculum_service_instrument_resolution.js` and the curriculum guardrails.
3. ✅ InstrumentAdapter normalized methods proxied through spark-core (`getExercisesForLesson`, `getPerformanceConfig`) — `js/sparksuite/bridges/instrument_adapter.js` + `js/spark-core/practice-engine.js`; Phase 4 table is Complete for all four instruments.
4. ✅ Recommendation engine wired through SparkCore — `SparkCore.getServices().recommendations` and `SparkCore.recommendNextAction()` in `js/spark-core/index.js` (curriculum queue first, recommendation fallback).
6. ✅ Scriptable smoke checks — packaged desktop smoke (`scripts/desktop_packaged_smoke.js`, `test_packaged_smoke_*`) and the browser clickthrough smoke run in CI.

2. ✅ SessionEngine ⇆ CurriculumEngine lesson choice — **live wiring landed** (PR #108, issue #93). `js/sparksuite/core/session_engine.js::buildGuidedSession` now asks `SparkCurriculumService.getNextGuidedSession()` for the next session, with per-instrument completion scoping added to reconcile the completion-vocabulary concern previously noted here.
7. ✅ Guitar gameplay logic extracted into PracticeEngine (PR #110) — `processDrillSwitch`, `processQuizAnswer`, `processFingerExerciseCompletion` return pure state patches; `guitar/app.js` handlers delegate and apply. Covered by `tests/test_practice_engine_guitar.js`. Runs dual-path (inline logic retained as fallback).

### Remaining

5. Begin retiring legacy paths once dual-path validation passes (see Phase 7 retirement criteria — process-gated, not a code task). The 2-week validation window has long elapsed (migrated flows have run dual-path since mid-June); next concrete step is to verify no logged discrepancies for one flow (quickStart is the simplest) and retire its legacy branch first.
8. ✅ Guided session choice is engine-owned end to end. Correction to an earlier audit note: `js/pages/guided.js` was already dual-path (its `getGuidedSessionView()` prefers `sparkCore.getActiveSessionView()`), but every UI entry point pinned an explicit `sessionNum` (`parseInt(v) || S.guidedSession || 1`), so the engine's `getNextGuidedSession` choice was never exercised from the app. Now an unpinned start — plain "start/continue" buttons, the done-page next-session CTA, and launcher items without an explicit number — passes no `sessionNum`, letting the CurriculumEngine advance by per-instrument completion. Explicit picks (lesson list, showroom, done-page display labels aside) still pin. Touched: `js/actions/system_family.js`, `js/instruments/{guitar,bass,piano}/app.js`, `js/practice/launchers.js`, `js/pages/guided.js`. Remaining page-level target: `js/pages/practice.js`.
9. ✅ Core de-leaked of the flagship instrument hardcodes (CLAUDE.md failure-mode #2). Instrument adapters now declare their specifics via `getCapabilities()`: `sessionStructure` (bass's groove block order) and `skillProgress: { stateKey, movementBasis }` (bass/ukulele rhythm-drill persistence). Both psychology engines resolve session structure from the adapter registry, `progress_engine.js` builds skill-progress patches from the declared config, and `progress_bridge.js` merges any `*SkillProgress` patch key generically. Zero instrument names remain in `psychology_engine.js`, `progress_engine.js`, or `js/spark-core/psychology-engine.js`. The remaining leaks are gone too: `execution_gateway.js` and `session_runtime.js` recognize instrument types via adapter-registry membership instead of a hardcoded shortlist, and `calibration_engine.js` gates the mic-latency offset on the adapter-declared `micCalibration` capability (declared by guitar). Zero instrument-name equality checks remain anywhere in `js/sparksuite/core/`.
10. Consolidate composition roots: the legacy `js/spark-core/` barrel and the constructor-based `js/sparksuite/core/` both load in `index.html`. Consumer inventory and phased retirement order now live in `docs/engineering/spark-core-retirement-inventory.md` — key finding: the barrel mixes true legacy engines (retire onto v2) with the Phase 7 contract infrastructure (`contracts.js`, `progress-orchestrator.js` — relocate, don't delete). Steps are gated on retiring the remaining session-shaped dual-path flows first.
