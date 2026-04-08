# Changelog

## 2026-04-02 — SparkSuite Platform Convergence

A major architecture day: merged the feature/convergence branch, built out the SparkCore engine layer, added BassSpark as a full instrument, introduced capo support for guitar, integrated PixiJS highway rendering, and migrated practice/performance pages toward core-backed session state.

### Core Engine

- Created `SparkSession` engine with `buildSession()` and `processResults()` — centralizes session lifecycle across all instruments
- Created `SparkPsychology` engine with reward scheduling and adaptive difficulty heuristics
- Created `SparkInstrumentAdapter` bridge between the launcher registry and core engine
- Created `SparkProgressOrchestrator` unified progression cascade (XP, badges, unlocks, streaks) and hooked it into `SparkSession.processResults()`
- Routed reward timing through `SparkPsychology.shouldReward()`, removed legacy `shouldFireReward`
- Exposed `InstrumentModule` interface methods (getCurriculumMap, getRhythmAdapter, getSongs) via `SparkInstrumentAdapter` for guitar, piano, and bass
- Registered new engines in SparkCore barrel with correct script load order

### BassSpark (New Instrument)

- Created full BassSpark data module: curriculum, notes, sessions, songs, skill tree
- Created bass fretboard SVG renderer (4 strings)
- Created bass `act()` handler with session/drill/guided actions
- Created BassSpark registration with full `InstrumentModule` interface
- Added script tags to `index.html`

### Guitar — Capo Module

- Created capo module: transposition helpers, skills, lessons, exercise generators
- Wired capo data and skill tree into guitar registration
- Added 3 capo-focused guided sessions to `GUITAR_SESSIONS`
- Added `capo.js` script tag to `index.html`

### Guitar — Session Routing

- Routed `quickStart` through `SparkSession.buildSession()`
- Routed session completion through `SparkSession.processResults()`
- Routed drill/chord/resume sessions through `SparkSession`

### Unified Tab System

- Instruments now define their own tabs and renderers — tab navigation is data-driven from instrument registration config

### PixiJS Highway Renderer

- Integrated PixiJS highway renderer (Phase 1 — visual parity with canvas)
- Updated build with sprite assets and bloom effects
- Added AI-generated sprite assets for gems, highway, and VFX

### Platform Convergence Merge

- Merged `feature/convergence` branch: SparkSuite platform architecture unification

### PianoSpark Integration

- MIDI backing track support
- Exported all piano `data.js` IIFE variables to `window` for page access
- Multiple PianoSpark integration fixes

### SparkSuite Core Migration

- Implemented SparkSuite core migration and ukulele module
- Advanced convergence and runtime state across all instruments
- Moved practice pages toward core-backed session state
- Advanced session runtime convergence (session plans, guided state, performance state all routed through SparkCore)

### Performance Calibration & Screen Transitions

- Added explicit SparkCore runtime actions for performance stats, editor, and calibration screen transitions
- Added dedicated `performStatsBack` and `performCalibrationBack` actions instead of falling through generic back handler
- Calibration page now reads source/mode from SparkCore runtime state with fallback to legacy state

### Bug Fixes

- Fixed tautological ternary in `completeSession` that silently dropped `performanceSummary` data
- Fixed plan-reuse branch of `startSession` not resetting `performanceCalibrationMode`
- Fixed `performCalibrationReset` and `performCalibrationStart` reading source from stale legacy state instead of SparkCore
- Fixed `calibration_source` action using `||` fallback instead of `hasOwnProperty` guard
- Differentiated `calibration_reset` from `calibration_stop` by preserving calibration source
- Fixed string tab IDs in SparkSuite `act()` for dashboard tab navigation (3 iterations: map to numeric, then keep as-is)
- Resolved code review issues: CURRICULUM migration + guidedComplete routing

### Tests

- Added test coverage for calibration screen transitions (open_stats, open_editor, open_calibration, calibration_source, calibration_start/stop/reset)
- Added test for cross-action `performanceCalibrationMode` reset (start action clears calibration mode)
- Added transport status assertions for all navigation actions
