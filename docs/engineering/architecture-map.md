# SparkSuite Architecture Map

## Boot Order (index.html)

1. **Core Utilities** - spark-highway, contracts, time/math/ids utils, persistence, analytics, progression
2. **Spark-Core v0.2** - profile, storage, events, progress-engine, achievements, content, psychology, progress-orchestrator, instrument-adapter, session-engine, index (namespace barrel)
3. **Performance-Core** - chart-contract, transport-contract, highway-adapter, events, index
4. **Launcher** - SparkInstruments registry (register/activate/getActive)
5. **Instrument Modules** - guitar (pages, capo, register, app), ukulele (normalizer, validator, svg, register), piano (data, audio, ui, register, app), bass (data, ui, register, app), drums (register)
6. **Shared UI + Data** - data.js, state.js, audio.js, ui.js (chordSVG, ringHTML, etc.)
7. **Page Renderers** - shared, practice, session, games, songs, tools, guided, dual
8. **Performance System** - config, difficulties, arrangements, adapters, chart, transport, input, calibration, scoring, session, progression, recommendations, practice_engine, analytics, badges, highway, midi_backing
9. **Performance Pages** - perform, rhythm_highway, perform_song, performance_stats, editor, calibration
10. **Practice Stack** - exercises/generator, weakspots, adaptive, plan, progress, selectors, engine, launchers
11. **SparkSuite Domain** - types, session_segment, session, tempo_map, note_event, phrase, chart, gameplay_result, engine_preset
12. **Bridges** - practice_bridge, curriculum_bridge, progress_bridge, performance_bridge
13. **SparkSuite Instruments** - ukulele (skill_tree, lessons, chords, scales, tuning, exercises, progression, module, adapter, index), bass, piano, guitar
14. **SparkSuite Core** - storage, ai_engine, instrument_manager, psychology_engine, curriculum_engine, calibration_engine, timing_engine, chart_io, replay_engine, input_judge, scoring_engine, rhythm_gameplay_engine, practice_engine, progress_engine, session_engine, **spark_core.js** (composition root)
15. **Progression** - adaptive, mastery, unlocks, tree, progress_ui, skill_tree
16. **Meta** - xp, levels, achievements, profile, challenges, weekly_goals, skill_tree_meta, meta_progress, dashboard
17. **Analytics** - stats, trends, charts, reports, dashboard
18. **Editor, MIDI, Desktop, Cloud, Content, Curriculum, Recommend, Career, Insights, Challenges, Home, Settings, Onboarding**
19. **app.js** - final initialization

## Key Globals

- `S` - Application state (loaded/saved via state.js)
- `SparkInstruments` - Instrument registry (launcher.js)
- `SparkCore` (v0.2 barrel) - window.SparkCore namespace pointing at individual engine globals
- `SparkSuiteCore` - Constructor-based composition root (js/sparksuite/core/spark_core.js), instantiated in app.js

## Composition Roots

### Legacy: `window.SparkCore` (js/spark-core/index.js)
Namespace barrel. Points at: SparkProfile, SparkStorage, SparkEvents, SparkProgress, SparkAchievements, SparkContent, SparkContentNormalizer, SparkSession, SparkPsychology, SparkInstrumentAdapter, SparkProgressOrchestrator.

### Current: `SparkSuiteCore` (js/sparksuite/core/spark_core.js)
Constructor-based. Instantiates: SparkSuiteStorage, SparkAIEngine, SparkInstrumentManager, SparkSuitePsychologyEngine, SparkSuiteCurriculumEngine, SparkSuitePracticeEngine, SparkSuiteProgressEngine, SparkSuiteSessionEngine. Manages runtime state, session plans, performance editor, all flow orchestration.

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

## Session Flow

1. UI calls `SparkSession.buildSession({ mode, level, ... })`
2. Session engine reads instrument data via `SparkInstruments.getActive().getData()`
3. Returns session plan: { type, chord, duration, level }
4. On completion, `SparkSession.processResults(results)` handles:
   - Streak, XP, chord mastery, level-up, badges, progress cascade
5. `SparkProgressOrchestrator.evaluateAll(event)` runs 12-step cascade
