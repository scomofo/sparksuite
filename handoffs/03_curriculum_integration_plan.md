# SparkSuite Curriculum Integration Plan

Source artifacts (in `~/Downloads/`):
- `sparksuite_instrument_curriculum_modules.zip` — ESM curriculum data for guitar/piano/bass/ukulele/vocals (49 files, 10 per instrument)
- `sparksuite_other_instruments_curriculum_seed.json` — same data as one JSON (9,592 lines, source-of-truth, **not loaded at runtime**)
- `SparkSuite_Other_Instruments_Curriculum_Handoff.md` — spec for guitar/piano/bass/ukulele/vocals
- `SparkSuite_Drum_Curriculum_Handoff.md` — drums-only spec (no code shipped — out of scope this round)

## Locked decisions

1. **Lesson IDs → replace.** No alias bridge. Old bare IDs (`down_strum`, `uke_01`…) are abandoned. New `lesson_uke_*` / `uke_*` IDs are canonical.
2. **Save-progress migration → not a concern.** Existing user mastery is OK to drop.
3. **Charts must be authored.** Every new skill ID must resolve to a chart in the rhythm library. No "data ready, runtime later" carve-outs.
4. **Seed JSON → undecided.** Treated as informational only for now; per-instrument JS files are the runtime source.
5. **Drums → out of scope this round** (skip Step 6).
6. **Module loading → IIFE / window.* globals**, not ESM. Convert incoming ESM files into IIFEs that register `window.SparkXxxSkillTree` / `Lessons` / `Exercises` / `Curriculum` / `Songs` / `Packs` / `Progression` / `RuntimeAdapter`. Module facade (`window.SparkXxxModule`) keeps owning `getCurriculumMap`, `getRhythmAdapter`, etc., and adds `getSkillTree / getCurriculum / getLessons / getExercises / getProgressionRules / getPacks / getRuntimeAdapter`.

## Step list

| Step | Instrument | Status |
|---|---|---|
| 1 | Ukulele | ✅ DONE |
| 2 | Guitar | ✅ DONE (during rate limit) |
| 3 | Piano | ✅ DONE (during rate limit) |
| 4 | Bass | ✅ DONE (during rate limit) |
| 5 | Vocals | ✅ DONE |
| 6 | ~~Drums~~ | skipped |
| 7 | Seed JSON | skipped (kept on disk, not loaded) |
| 8 | InstrumentManager wiring + smoke test page | pending |

## Step 5 — Vocals (DONE 2026-04-27)

### Files created in `js/sparksuite/instruments/vocals/` (net-new module)
- `vocals_skill_tree.js` — 29 skills (`vocal_*`, `pitch_*`, `harmony_*`, etc.)
- `vocals_lessons.js` — 29 lessons (`lesson_vocal_*`)
- `vocals_exercises.js` — compact tuple-array, 29 exercises, indexed by both lessonId and skill
- `vocals_curriculum.js` — `window.SparkVocalsCurriculum` (5 tracks)
- `vocals_songs.js` — `SparkVocalsSongs` + `SparkVocalsRepertoire` (6 forgiving covers)
- `vocals_packs.js` — 5 packs
- `vocals_progression.js` — pitch/timing/range/tone weights
- `vocals_runtime_adapter.js` — pitch-lane runtime: `getPitchLanes()` returns 5 solfege lanes (do/re/mi/sol/la), `getDefaultInputMode() === "microphone_pitch"`, `getRangeProfile(profile)` exposes comfort_low/comfort_mid/comfort_high MIDI roots
- `vocals_chart_library.js` — 6 base charts on the 5-lane pitch highway + 23 skill-specific clones via `cloneChartWithSkill`
- `vocals_rhythm_curriculum.js` — `VOCALS_SKILL_CHART_MAP` covering all 29 skills
- `vocals_rhythm_adapter.js` — `SparkVocalsRhythmAdapter` returns `adapterType: "vocals"` payloads with `pitchLanes` and `rangeProfile` fields and `assistMode.showPitchText`/`showLyricText` flags
- `vocals_module.js` — facade with `getCurriculum/getProgressionRules/getPacks/getRuntimeAdapter/getRhythmAdapter/getPracticeRecommendation/getPitchLanes`
- `vocals_adapter.js` — InstrumentManager-contract adapter (`getId/getType/getCurriculumMap/getSkillTree/getLessons/getExercises/getCapabilities/getRhythmAdapter`)
- `index.js` — registers `SparkSuiteInstrumentAdapters.vocals`

### Files edited outside instrument folder
- `index.html` — added 14 new `<script data-deferred-src>` tags after the guitar block

### Tests fixed (regressions from Step 2 guitar work, surfaced by full-suite run)
- `tests/test_sparksuite_rhythm_core.js` — `chart io normalizes guitar exercise definitions` now asserts 8 notes / 1 phrase (new `gtr_open_strums_01` default); `practice engine upgrades rhythm candidates...` now asserts default chart is `gtr_open_strums_01`

### Skill → chart mapping (final, 29 skills)

Foundations: `vocal_comfort_setup → voc_setup_comfort_01`, `vocal_posture → voc_posture_01`, `vocal_breath → voc_breath_quiet_01`, `range_map → voc_range_map_01`.
Pitch/melody: `pitch_matching → voc_pitch_match_base`, `call_response → voc_call_response_base`, `three_note_patterns → voc_three_note_01`, `stepwise_melody → voc_stepwise_melody_base`, `intervals_3rds → voc_intervals_3rds_01`, `major_scale_vocal → voc_major_scale_01`.
Timing: `entrances → voc_count_entrances_01`, `phrase_timing → voc_phrase_timing_01`, `syncopation_vocal → voc_syncopation_01`.
Tone/diction: `vowels → voc_vowels_01`, `resonance → voc_resonance_01`, `dynamics → voc_dynamics_01`, `consonants → voc_consonants_01`.
Songs/feedback: `song_phrase → voc_song_short_phrase_01`, `verse_chorus → voc_song_verse_chorus_01`, `vocal_phrase_retry → voc_phrase_retry_01`, `record_listen → voc_record_listen_01`.
Harmony/performance: `harmony_drone → voc_harmony_drone_base`, `harmony_third → voc_harmony_drone_base`, `call_response_improv → voc_call_response_improv_01`, `background_vocals → voc_background_vocals_01`, `mic_technique → voc_mic_technique_01`, `confidence_take → voc_confidence_take_01`, `full_vocal_song → voc_full_easy_song_01`, `vocal_performance_set → voc_stage_flow_base`.

### Test results after Step 5

`npm test` — full suite green (no failures).

## Chart authoring contract (every step)

Every skill referenced by lessons must resolve to a chart. Pattern (matches existing ukulele):
- `XXX_RHYTHM_LIBRARY` keyed by chart ID (notes, phrases, bpm, enginePreset, totalBeats)
- `XXX_SKILL_CHART_MAP` mapping each skill → chart ID
- `XXX_RECOMMENDATION_HINTS` per skill (priorityBoost, reason, focusTag)
- Adapter `createPayload(context)` returns `{chartId, adapterType, enginePreset, laneCount, laneLabels, songChart}`
- For piano: lanes derive from a key/octave window. For vocals: lanes are pitch zones; adapter exposes `getPitchLanes()` and `getDefaultInputMode() === "mic_or_keyboard"`.
- For each new skill, `cloneChartWithSkill(srcId, newId, newTitle, newSkillId, bpmOverride?)` clones a base chart and re-tags every note's `skillId` so mastery accrues to the per-skill chart.

## Step 1 — Ukulele (DONE 2026-04-27)

### Files changed in `js/sparksuite/instruments/ukulele/`
- **Replaced** `ukulele_skill_tree.js` — 24 skills, new IDs (`uke_orientation`, `uke_tuning`, `uke_c6_sound`, `uke_down_strum`, `uke_quarter_counting`, `uke_c_chord`, `uke_am_chord`, `uke_f_chord`, `uke_g7_chord`, `uke_g_chord`, `uke_chord_switching`, `uke_four_chord_loop`, `uke_eighth_strum`, `uke_down_up_strum`, `uke_island_strum`, `uke_chuck`, `uke_fingerpicking`, `uke_c_scale`, `uke_melody`, `uke_styles`, `uke_performance_set`, `uke_two_chord_song`, `uke_song`, `uke_phrase_retry`)
- **Replaced** `ukulele_lessons.js` — 29 lessons (`lesson_uke_*`)
- **Replaced** `ukulele_exercises.js` — compact tuple-array, 29 exercises, indexed by both lessonId and skill
- **New** `ukulele_curriculum.js` — `window.SparkUkuleleCurriculum` (5 tracks)
- **New** `ukulele_songs.js` — `window.SparkUkuleleSongs` (8 song refs) + `window.SparkUkuleleRepertoire` (12 covers)
- **New** `ukulele_packs.js` — `window.SparkUkulelePacks` (5 packs)
- **New** `ukulele_runtime_adapter.js` — `window.SparkUkuleleRuntimeAdapter`
- **Rewrote** `ukulele_module.js` — chart library expanded from 6 base + 4 clones to 6 base + 18 clones covering all 24 new skills; `UKULELE_SKILL_CHART_MAP` and `UKULELE_RECOMMENDATION_HINTS` re-keyed; module facade adds `getCurriculum`, `getProgressionRules`, `getPacks`, `getRuntimeAdapter`, `getSongLibrary`; default fallback skill is now `uke_down_strum`
- **Untouched** `ukulele_chords.js`, `ukulele_scales.js`, `ukulele_tuning.js`, `ukulele_progression.js`, `ukulele_adapter.js`, `index.js`

### Files edited outside instrument folder
- `index.html` — 4 new `<script data-deferred-src>` tags after `ukulele_exercises.js` (curriculum, songs, packs, runtime_adapter)
- `js/onboarding/actions.js` — starter-lesson IDs updated to new `lesson_uke_*` namespace
- `js/instruments/ukulele/register.js` — LC/LN now keyed by `lesson.level` (1-8) instead of by num (1-12); `getUkuleleLessonSkill` fallback changed to `uke_down_strum`; `renderUkuleleStatsTab` filter accepts `lesson_uke_` prefix; `getSkillTree` and `renderUkuleleGuideTab` use `skill.name || skill.label || skill.id`; `lesson.desc` falls back to `objectives.join(" • ")`
- `js/dev/curriculum_validator.js` — `PREREQ_NOT_IN_TREE` accepts lesson IDs as well as skill IDs
- `tests/test_curriculum_guardrails.js` — prereq test renamed and accepts lesson IDs
- `tests/test_curriculum_service_instrument_resolution.js` — accepts both `lesson_uke_` and `uke_` ID prefixes
- `tests/test_sparksuite_core_migration.js` — both ukulele tests updated to new lesson IDs

### Skill → chart mapping (final)

| Skill | Chart |
|---|---|
| uke_orientation | uke_orientation_01 (clone of open_strums @ 60 BPM) |
| uke_tuning | uke_tuning_check_01 (clone of open_strums @ 60) |
| uke_c6_sound | uke_c6_sound_01 (clone of open_strums @ 66) |
| uke_down_strum | uke_open_strums_01 (base) |
| uke_quarter_counting | uke_quarter_count_01 (clone of open_strums @ 68) |
| uke_c_chord / uke_am_chord / uke_f_chord / uke_g7_chord / uke_g_chord | uke_*_chord_pulse_01 (clones of open_strums) |
| uke_two_chord_song | uke_two_chord_song_01 (clone of switch_flow @ 72) |
| uke_chord_switching | uke_switch_flow_01 (base) |
| uke_four_chord_loop | uke_four_chord_loop_01 (clone of switch_flow @ 78) |
| uke_eighth_strum | uke_eighth_strum_01 (clone of island_pattern @ 80) |
| uke_down_up_strum | uke_down_up_strum_01 (clone of island_pattern @ 78) |
| uke_island_strum | uke_island_pattern_01 (base) |
| uke_chuck | uke_chuck_intro_01 (clone of island_pattern @ 82) |
| uke_styles | uke_styles_swing_01 (clone of island_pattern @ 88) |
| uke_fingerpicking | uke_pick_arpeggio_01 (base) |
| uke_c_scale | uke_c_scale_climb_01 (clone of melody_lift @ 76) |
| uke_melody | uke_melody_lift_01 (base) |
| uke_song | uke_song_run_01 (clone of stage_flow @ 82) |
| uke_phrase_retry | uke_phrase_retry_01 (clone of stage_flow @ 80) |
| uke_performance_set | uke_stage_flow_01 (base) |

### Test results after Step 1

`npm test` — all suites green. Tests touched:
- `test_curriculum_guardrails.js` (35 PASS)
- `test_curriculum_service_instrument_resolution.js` (7 PASS)
- `test_sparksuite_core_migration.js` (127 PASS)
- All other suites unchanged.

## Steps 2-5 (per-instrument template)

For each instrument (guitar / piano / bass / vocals):

1. Read incoming files in `~/Downloads/sparksuite_instrument_curriculum_modules/js/sparksuite/instruments/<name>/`.
2. Identify skill list from new lessons.
3. Convert ESM files → IIFEs that register `window.SparkXxxSkillTree` / `Lessons` / `Exercises` / `Curriculum` / `Songs` / `Packs` / `Progression` / `RuntimeAdapter`.
4. Compact `ukulele_exercises.js`-style tuple array if list is long.
5. Audit which new skills lack a chart in the existing `XXX_RHYTHM_LIBRARY`.
6. Author missing charts (clones of base charts, re-skilled), plus any net-new bases needed for piano/vocals.
7. Update `XXX_SKILL_CHART_MAP` + `XXX_RECOMMENDATION_HINTS`.
8. Extend module facade with `getCurriculum / getProgressionRules / getPacks / getRuntimeAdapter`.
9. Update `index.html` script tags (curriculum, songs, packs, runtime_adapter).
10. Update `js/instruments/<name>/register.js` if it has hardcoded LC/LN tied to old numbering or hardcoded skill/lesson IDs.
11. Update any `js/onboarding/actions.js` starter-ID references.
12. Update tests that hardcode old IDs (`test_sparksuite_core_migration.js`, `test_curriculum_service_instrument_resolution.js`, etc.).
13. Run `npm test` → expect green.

### Special handling per instrument

- **Guitar**: existing `guitar_rhythm_curriculum.js` is the chart-library curriculum, not the lesson-graph curriculum. Keep both: rhythm curriculum for gameplay engine, new curriculum for `CurriculumEngine`. Build `GUITAR_SKILL_CHART_MAP`.
- **Piano**: net-new module. Add piano runtime adapter that adheres to the rhythm-engine contract (lane labels = key/octave window, chart payload). Author piano chart library from scratch.
- **Bass**: existing `bass_module.js` already has authored exercises and chart library — merge handoff data, don't replace. Keep current chart library; add new clones for any new bass skills.
- **Vocals**: net-new module. Pitch-lane chart format + mic runtime adapter. `getPitchLanes()` returns pitch zones; `getDefaultInputMode() === "mic_or_keyboard"`.

## Step 8 — Cross-cutting

- Confirm `SparkValidateInstrumentModule` accepts the augmented modules.
- Add `debug/curriculum_engine_smoke.html` that, for each instrument, calls `SparkCore.startSession({instrument})` and prints next 5 lessons + segments.

## Open questions

1. Should `sparksuite_other_instruments_curriculum_seed.json` be checked in under `js/sparksuite/content/curriculum_seed.json` as the source-of-truth for regenerating the JS files? (deferred)
2. When tackling drums later, will the runtime renderer be ready, or do we author data only? (deferred)
