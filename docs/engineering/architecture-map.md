# SparkSuite Architecture Map

_This document describes the code as it is. Dated documents under
`docs/superpowers/plans/` and `docs/superpowers/specs/` are historical
records of work as it was planned; several predate the `js/spark-core/`
retirement and reference paths that no longer exist. Trust this map and
`index.html` over them._

Related architecture guardrails:

- [ADR index](../adr/README.md)
- [ADR 001 - Engine-first architecture](../adr/001-engine-first-architecture.md)
- [ADR 002 - SessionPlan is canonical](../adr/002-sessionplan-is-canonical.md)
- [ADR 003 - Instruments are modules](../adr/003-instruments-are-modules.md)
- [ADR 004 - UI does not own progression](../adr/004-ui-does-not-own-progression.md)
- [ADR 005 - AI Coach is advisory](../adr/005-ai-coach-is-advisory.md)
- [ADR 006 - No social, leaderboard, or store scope](../adr/006-no-social-leaderboard-store-scope.md)

## Boot Order (index.html)

_363 script tags, in this order. Regenerate this list rather than editing it
by hand — it drifted badly enough to describe a directory that no longer
existed. The counts are script tags per directory:_

```
 1. js/*.js (root)                17    spark-highway, launcher, boot_loader, data, state,
                                        audio, ui, timers, render*, actions, app
 2. js/sparksuite/core            30    contracts, progress_orchestrator, then the engines
 3. js/sparksuite/services         8    profile_schema, storage, events, progress,
                                        achievements, content_*, psychology
 4. js/sparksuite/bridges          5    instrument_adapter, practice/curriculum/progress/
                                        performance bridges
 5. js/sparksuite/legacy           2    practice_engine, session_engine (SparkSession)
 6. js/performance-core            5    chart/transport contracts, highway adapter, events
 7. js/sparksuite/instruments/*   55    vocals, ukulele, bass, piano, guitar module trees
 8. js/instruments/*              21    per-instrument page code (deferred via boot_loader,
                                        except vocals/register.js)
 9. js/showroom, js/ui, js/core    8    launcher chrome and shared UI helpers
10. js/utils                       9    day, normalize, ids, mastery, chord_progress, …
11. js/pages                      18    practice, session, games, songs, tools, guided, …
12. js/performance                19    config → chart → transport → scoring → session → …
13. js/sparksuite/domain           9    types, session, chart, tempo_map, engine_preset, …
14. js/practice, js/exercises      8    plan, adaptive, weakspots, selectors, engine
15. js/analytics, js/insights     14
16. js/progression, js/meta       22    mastery, unlocks, tree; xp, levels, challenges
17. js/audio, js/editor, js/midi  34    timing, metronome, latency; chart editor; MIDI
18. js/import, js/storage, debug   8
19. js/desktop, js/cloud           9
20. js/content, js/curriculum,    30    registry/loader, recommend, career, home,
    recommend, career, home,             settings, onboarding
    settings, onboarding
21. js/actions                    10    action families (dispatch)
22. js/dev                         5    dev overlay and validators (deferred)
23. js/instruments/piano/pages    13    piano page overrides, registered by the inline
                                        script at the end of index.html
```

Two ordering constraints are load-bearing and pinned by
`tests/test_engine_boot_wiring.js`: the engines must precede `spark_core.js`,
which composes them, and `js/utils/day.js` must precede `js/state.js`, which
uses it for streaks and the daily-goal reset. Note that anything placed
between `<!-- Instrument Modules -->` and `js/data.js` sits inside the block
`scripts/apply_generated_instrument.js` regenerates and will be stripped.

## Key Globals

- `S` - Application state (loaded/saved via state.js)
- `SparkInstruments` - Instrument registry (launcher.js)
- `SparkCore` (v0.2 barrel) - window.SparkCore namespace pointing at individual engine globals
- `SparkSuiteCore` - Constructor-based composition root (js/sparksuite/core/spark_core.js), instantiated in app.js

## Composition Roots

### `SparkSuiteCore` (js/sparksuite/core/spark_core.js)
The composition root. Constructor-based; instantiates SparkSuiteStorage,
SparkAIEngine, SparkInstrumentManager, SparkSuitePsychologyEngine,
SparkSuiteCurriculumEngine, SparkSuitePracticeEngine, SparkSuiteProgressEngine
and SparkSuiteSessionEngine. `createDefaultSparkCore()` builds the app's single
`window.sparkCore`.

It is also a god object: 143 prototype methods and ~150 runtime-state fields,
including roughly two dozen `sync*RuntimeState` methods — one per screen — and
a `Legacy` family covering the pre-engine minigame flows. Splitting it by
lifecycle is open work; see migration-checklist.md.

### The former `js/spark-core/` barrel — retired
That directory is gone. Its contents were relocated, which is what the (now
deleted) spark-core-retirement-inventory.md set out to do:

| Global | Now lives in |
|---|---|
| SparkContracts | js/sparksuite/core/contracts.js |
| SparkProgressOrchestrator | js/sparksuite/core/progress_orchestrator.js |
| SparkProfile | js/sparksuite/services/profile_schema.js |
| SparkStorage | js/sparksuite/services/storage.js |
| SparkEvents | js/sparksuite/services/events.js |
| SparkProgress | js/sparksuite/services/progress.js |
| SparkAchievements | js/sparksuite/services/achievements.js |
| SparkContentNormalizer | js/sparksuite/services/content_normalizer.js |
| SparkPsychology | js/sparksuite/services/psychology.js |
| SparkSession | js/sparksuite/legacy/session_engine.js |
| SparkPracticeEngine | js/sparksuite/legacy/practice_engine.js |
| SparkInstrumentAdapter | js/sparksuite/bridges/instrument_adapter.js |
| SparkContent | js/content/registry.js |

`window.SparkCore` as a namespace barrel no longer exists. The two remaining
files that reference it (`spotify_integration.js`, `system_wiring.js`) are part
of the unshipped play-along/Spotify feature and are not loaded.

## Instrument Module Contract

Each instrument registers via `SparkInstruments.register(config)` with:
- `id`, `instrument`, `name`, `icon`, `skin`, `available`
- `getData()` -> { CHORDS, ALL_CHORDS, SESSIONS, SONGS, LC, LN, ... }
- `ui` -> { chord(), header(), tabNav(), ring() }
- `tabRenderers` -> { practice, songs, stats, guide }
- `pages` -> { screenId: renderFn }
- `tabs` -> [{ id, label, icon }]
- `init()`, `getSkillTree()`, `getCurriculumMap()`, `getExercises()`, `getSongs()`
- `getDifficultyRules()`, `analyzePerformance()`, `generateDrills()`

## Service Registry

`SparkCore.getServices()` returns:

| Service | Global | Purpose |
|---------|--------|---------|
| session | SparkSession | Session plan building, result processing |
| psychology | SparkPsychology | Reinforcement schedules, difficulty, comeback bonuses |
| progressOrchestrator | SparkProgressOrchestrator | 12-step progression cascade, applySessionOutcome |
| instrumentAdapter | SparkInstrumentAdapter | Proxy to active instrument module methods |
| curriculum | SparkCurriculumService | Next lesson, unlock checks, review targets, learning queue |
| recommendations | SparkRecommendationService | Generate/track practice recommendations |
| profile | SparkProfile | User profile schema |
| storage | SparkStorage | Persistent storage |
| events | SparkEvents | Event bus |
| progress | SparkProgress | XP/level tracking |
| achievements | SparkAchievements | Suite-level achievement evaluation |
| content | SparkContent | Content schema |
| contentNormalizer | SparkContentNormalizer | Content normalization |

## Normalized Contracts

`SparkContracts` provides factory functions:
- `createSessionPlan(opts)` — session plan with sessionId, mode, instruments, exercises, difficulty
- `createSessionResult(opts)` — completion payload with mode, accuracy, duration, chordName
- `createProgressOutcome(opts)` — outcome summary with xpEarned, levelUps, masteryChanges, achievements

## Session Flow

1. UI calls `SparkSession.buildSession({ mode, level, ... })`
2. Session engine reads instrument data via `SparkInstruments.getActive().getData()`
3. Returns session plan: { type, chord, duration, level }
4. On completion, `SparkSession.processResults(results)` handles:
   - Streak, XP, chord mastery, level-up, badges, progress cascade
5. `SparkProgressOrchestrator.evaluateAll(event)` runs 12-step cascade
