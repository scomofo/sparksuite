# UI Polish Bug Sweep Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove the remaining UI polish bugs that match the recent fixes: overly heavy in-card typography, crowded orange/action buttons, inline `<b>` labels that visually pop too hard, and flex rows that can crowd because they rely on `space-between` without a gap.

**Architecture:** Keep behavior unchanged. Add or reuse shared CSS primitives in `styles.css`, then migrate high-visibility renderers away from inline one-off styles. Add static/renderer tests so new pages do not reintroduce the same defects.

**Tech Stack:** Static HTML app, JavaScript renderer modules, CSS, Node test suite via `npm test`.

---

## Handoff Update - May 7, 2026

Current branch: `codex/ui-polish-sweep`

Latest clean checkpoint: `bced23f Fix shared ear and progression tool launches`

### What Changed Today

Today's sweep moved from visual-only polish into browser-proven runtime fixes. The working pattern was:

1. Reproduce with Playwright or targeted file-url browser probes.
2. Identify the root cause, usually a shared renderer/action surface.
3. Add or extend regression coverage.
4. Verify with focused tests, `npm run test:browser`, and full `npm test`.
5. Commit each clean checkpoint.

Commits made today, newest first:

- `bced23f` Fix shared ear and progression tool launches
- `c5f7c88` Fix Ukulele shared drill and quiz actions
- `e54166b` Fix remaining hero practice launches
- `2140323` Fix Ukulele and Vocal quick starts
- `489b234` Fix compact mobile intention inputs
- `e9c089b` Fix showroom secondary action hit areas
- `6e82c18` Fix showroom mobile action targets
- `2e12697` Fix mobile instrument row overflow
- `8915cbb` Preserve constant instrument ids in generator
- `754c94d` Fix crowded mobile action controls
- `477d06e` Fix file launch performance chart loading
- `00d13d7` Reset mobile scroll on instrument navigation
- `07b5627` Fix VocalSpark lesson plan launch
- `c029c7c` Extend browser sweep across instruments
- `7a93d16` Fix mobile showroom scrollability
- `428f71d` Add browser clickthrough smoke sweep
- `77585e6` Install Playwright test tooling
- `d410729` Implement UI polish sweep

### Main Fix Areas

- Browser smoke coverage now exists through Playwright and runs via `npm run test:browser`.
- Launcher/showroom mobile views were tightened: scrollability, bottom-nav coverage, mobile action targets, row overflow, secondary action hit areas, and compact onboarding/intention inputs.
- Instrument navigation now resets bad mobile scroll positions between instrument/tab changes.
- VocalSpark quick start and lesson-plan launch now enter the intended lesson/session flow.
- Ukulele and Vocal quick starts route through the intended shared practice entry points.
- Guitar/Piano/Ukulele/Bass hero practice launch controls were aligned with real runtime handlers.
- Ukulele shared Drill, Quiz, and Ear tab controls now work when Ukulele inherits shared tabs instead of defining local handlers.
- Guitar/Ukulele progression builder template/play controls are covered by browser clickthrough and no longer trigger the Piano `scaleSVG` global collision that produced invalid SVG like `viewBox="0 0 E NaN"`.
- Ukulele ear-training preview now resolves active-instrument chord-note aliases instead of warning through guitar/global chord-note data.
- Bass and Ukulele performance mode now launches under direct `file://` use by avoiding local JSON `fetch()` failures.
- Mobile action-control fit regressions are now covered for crowded controls such as Guitar Dual `Listen` and Bass/Ukulele `PERFORM`.
- The instrument manifest generator now preserves constant instrument IDs so `npm test` no longer dirties `js/instruments/instrument_manifest.generated.js`.

### Test Coverage Added Or Extended

- `tests/browser_clickthrough_smoke.js`
  - Console/page-error tracking across file-url browser smoke.
  - Tab rendering and raw UI token checks.
  - Mobile scroll reset and bottom-nav coverage checks.
  - Selected lesson launch checks.
  - Bass/Ukulele performance launch checks.
  - Mobile action-control fit checks.
  - Shared Ukulele Ear launch and Guitar/Ukulele progression template/play clickthrough.
- `tests/test_practice_action_family.js`
  - Shared `startEarTrain` works for instruments without local handlers.
- `tests/test_audio_instrument_chord_notes.js`
  - Strum preview prefers active-instrument chord-note maps before global guitar note names.
- `tests/test_games_page_resolution.js`
  - Progression scale explorer uses the stringed scale renderer even if Piano overwrites the global `scaleSVG`.
- Existing visual/runtime contract tests were extended where fixes touched shared visual or launch behavior.

### Verified At Latest Checkpoint

For `bced23f`:

```powershell
node tests\browser_clickthrough_smoke.js
npm run test:browser
npm test
git diff --check
```

Results:

- Browser clickthrough smoke passed and stayed console-clean.
- Full `npm test` passed.
- `git diff --check` reported no whitespace errors, only the repo's normal CRLF warnings.
- Working tree was clean after commit.

### Further Refinements For Handoff

Prioritize these next:

1. Expand shared-tool clickthrough coverage to every instrument that inherits shared tabs:
   - Bass/Ukulele/Guitar: Ear, Rhythm, Runner, Build, Tuner.
   - Confirm actual state changes, not just visible text changes.
   - Treat tuner separately because browser microphone permission can make assertions environment-sensitive.
2. Audit global function collisions introduced by multi-instrument script loading:
   - Known fixed case: stringed `scaleSVG` versus Piano `scaleSVG`.
   - Search likely globals such as `songsTab`, `gamesTab`, `toolsTab`, `scaleSVG`, `CHORDS`, `CHORD_NOTES`, and instrument-specific renderer helpers.
   - Prefer namespaced aliases for shared renderers and active-instrument lookups over bare globals.
3. Strengthen audio preview routing:
   - `strumChord()` now uses active instrument `CHORD_NOTES`; follow up by checking Bass, Ukulele, and Guitar aliases for complete note coverage.
   - Add a data integrity test that every active instrument chord name in `getData().ALL_CHORDS` has a note entry in its own `CHORD_NOTES` when audio preview is expected.
4. Continue mobile layout sweeps beyond action-button fit:
   - Check all shared tab groups at 390px and 320px widths.
   - Include long labels, wrapped buttons, sticky nav overlap, and horizontal overflow.
   - Add permanent browser assertions only after a bug is reproduced.
5. Finish the original visual-contract plan below:
   - Reduce remaining heavy in-card labels and raw `<b>` labels.
   - Replace no-gap `space-between` rows on high-traffic surfaces.
   - Keep gameplay HUD and primary CTAs intentionally strong.
6. Add a focused fixture for direct `file://` data loading:
   - Bass/Ukulele performance launch is covered, but a smaller unit-level guard around local chart loading would make failures easier to diagnose.
7. Keep watching generated files after full tests:
   - `npm test` should not dirty `js/instruments/instrument_manifest.generated.js`.
   - If it does, inspect the generator/ID constants rather than restoring generated output manually.
8. Review Tuner behavior intentionally:
   - The Tuner tab can appear unchanged because microphone permission/state is not deterministic in headless browser tests.
   - Decide whether to expose a testable "requested tuner start" state separate from live audio permission success.
9. Add browser screenshots for the most visual mobile fixes:
   - The current smoke catches geometry and errors, but a small screenshot set for launcher/showroom/actions would make regressions easier to triage.
10. Consider splitting `npm test` into named phase scripts:
   - The main script is now broad and effective, but long single-line command maintenance is getting brittle.
   - Candidate scripts: `test:unit`, `test:ui-contracts`, `test:runtime-contracts`, `test:e2e`, then keep `npm test` as the aggregate.

---

## Scan Summary

The scan looked for the bug families that have already shown up during clickthrough:

- Heavy in-panel labels: `font-size:13-16px;font-weight:800/900`
- Heavy card/page titles: `font-size:20-26px;font-weight:900`
- Raw bold labels: `<b>Label</b>`
- Crowded buttons: adjacent buttons without an action-row class or gap
- Fragile rows: `display:flex;justify-content:space-between;align-items:center` without `gap`
- Manual spacing: `margin-left` used to separate controls

Largest remaining clusters:

- `js/pages/tools.js`
- `js/pages/songs.js`
- `js/pages/games.js`
- `js/pages/perform.js`
- `js/pages/session.js`
- `js/pages/guided.js`
- `js/pages/performance_stats.js`
- `js/pages/perform_song.js`
- `js/instruments/piano/pages/perform_results.js`
- `js/instruments/piano/pages/perform_song.js`
- `js/instruments/piano/pages/analytics.js`
- `js/pages/dual.js`
- Shared/older UI surfaces: `js/analytics/dashboard.js`, `js/home/home_cards.js`, `js/insights/ui.js`, `js/settings/settings_ui.js`, `js/curriculum/curriculum_ui.js`, `js/import/midi_ui.js`, `js/progression/progress_ui.js`

## Implementation Tasks

### 1. Add Shared Visual Primitives And Static Guardrails

- [ ] Add shared classes to `styles.css` for the repeated fixes instead of creating page-specific one-offs:

```css
.card-section-heading {
  font-size: 14px;
  font-weight: 650;
  letter-spacing: 0;
}

.card-micro-heading {
  font-size: 13px;
  font-weight: 650;
  letter-spacing: 0;
}

.metric-label {
  font-size: 12px;
  font-weight: 650;
  color: var(--muted);
}

.metric-value {
  font-size: 20px;
  font-weight: 760;
  letter-spacing: 0;
}

.split-row,
.action-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.split-row {
  justify-content: space-between;
}

.action-row {
  flex-wrap: wrap;
}
```

- [ ] Keep existing classes such as `.practice-card-heading`, `.practice-quick-title`, `.guided-card-heading`, `.guided-status-line`, `.song-controls`, `.style-controls`, `.build-controls`, `.build-palette`, `.plan-actions`, and `.result-actions`. Use the new primitives for surfaces that are not practice/guided-specific.
- [ ] Add a static contract test, preferably `tests/test_ui_visual_contracts.js`, that scans renderer files and fails on new instances of the bug families unless the instance is in a documented allowlist.
- [ ] Initial allowlist should cover intentional hero/gameplay emphasis only: large score numbers, game CTA buttons, rhythm/game HUD labels, page hero titles, and existing third-party/demo blocks if any.

Verification:

```powershell
npm test -- tests/test_ui_visual_contracts.js
```

### 2. Clean Shared Session And Practice Residuals

- [ ] Update `js/sparksuite/ui/session_shell.js` compact summary labels from inline heavy typography to `.card-micro-heading` or `.guided-status-line`.
- [ ] Review `js/pages/session.js` remaining result/session rows. Replace any non-HUD `font-weight:800/900` labels with shared heading classes.
- [ ] Replace any remaining adjacent session result controls with `.result-actions` or `.action-row`.
- [ ] Do not flatten intentional timer, score, streak, or live-performance HUD numbers.

Tests to update:

- `tests/test_session_song_page_instrument_resolution.js`
- `tests/test_sparksuite_core_migration.js`

Verification:

```powershell
npm test -- tests/test_session_song_page_instrument_resolution.js tests/test_sparksuite_core_migration.js
```

Browser clickthrough:

- Guitar launch -> guided session -> complete/exit controls
- Piano launch -> C Major lesson/session -> result controls

### 3. Clean Songs, Strum, Stem, And Import Surfaces

- [ ] Update `js/pages/songs.js` card headings, import panel headings, stem panel headings, and song meta labels to use `.card-section-heading`, `.card-micro-heading`, `.metric-label`, or existing song classes.
- [ ] Add `gap` or `.split-row` to rows currently using `display:flex;justify-content:space-between;align-items:center` without spacing.
- [ ] Keep large song titles readable, but avoid `font-weight:900` inside cards unless it is a true page-level title.
- [ ] Update `js/instruments/piano/pages/songs.js` no-gap split row.

Tests to update:

- `tests/test_session_song_page_instrument_resolution.js`
- Add `tests/test_song_page_visual_contracts.js` only if existing song tests become too broad.

Verification:

```powershell
npm test -- tests/test_session_song_page_instrument_resolution.js
```

Browser clickthrough:

- Guitar launch -> Songs
- Piano launch -> Songs
- Open any song card with secondary controls visible

### 4. Clean Performance And Result Surfaces

- [ ] Update `js/pages/perform.js` non-hero labels and panel headings.
- [ ] Update `js/pages/performance_stats.js` card headings and stat labels.
- [ ] Update `js/pages/perform_song.js` secondary labels while preserving primary play/performance controls.
- [ ] Update `js/instruments/piano/pages/perform_results.js` raw `<b>` metric labels and phrase breakdown labels.
- [ ] Update `js/instruments/piano/pages/perform_song.js` raw `<b>` labels for Arrangement, LH Pattern, Difficulty, and Song Audio.
- [ ] Use `.split-row` or explicit `gap` for phrase/result rows that can crowd on narrow widths.

Tests to update:

- `tests/test_perform_page_resolution.js`
- `tests/test_perform_song_page_resolution.js`
- `tests/test_piano_perform_live_page_resolution.js` if present
- `tests/test_performance_action_family.js`

Verification:

```powershell
npm test -- tests/test_perform_page_resolution.js tests/test_perform_song_page_resolution.js tests/test_performance_action_family.js
```

Browser clickthrough:

- Guitar launch -> Performance
- Piano launch -> Performance
- Open result/details states where available

### 5. Clean Tools, Guide, And Stats Surfaces

- [ ] Update `js/pages/tools.js`, which has the largest remaining cluster, with shared heading and metric classes.
- [ ] Preserve genuinely important numeric hierarchy, but reduce in-card labels and explanatory headings that now look too thick.
- [ ] Check any orange/action buttons on Tools/Guide/Stats views and place them in `.action-row` or existing action classes.

Tests to update:

- `tests/test_practice_page_instrument_resolution.js`
- Add `tests/test_tools_page_visual_contracts.js` only if the page needs isolated coverage.

Verification:

```powershell
npm test -- tests/test_practice_page_instrument_resolution.js
```

Browser clickthrough:

- Guitar launch -> Tools/Stats/Guide route variants
- Piano launch -> equivalent shared tools routes if exposed

### 6. Clean Games, Builder, And Dual Surfaces

- [ ] Update `js/pages/games.js` card/panel headings and non-gameplay labels.
- [ ] Leave gameplay CTA buttons, big level numbers, score numbers, and active HUD elements visually strong.
- [ ] Update `js/instruments/piano/pages/games.js` any remaining small heavy label.
- [ ] Update `js/pages/dual.js` card headings and split rows.
- [ ] Add `gap` to builder/game mode rows that use `space-between`.

Tests to update:

- `tests/test_games_page_resolution.js`
- `tests/test_piano_games_page_resolution.js`
- `tests/test_instrument_specific_surface_resolution.js`

Verification:

```powershell
npm test -- tests/test_games_page_resolution.js tests/test_piano_games_page_resolution.js tests/test_instrument_specific_surface_resolution.js
```

Browser clickthrough:

- Guitar launch -> Games
- Piano launch -> Games
- Any builder/dual-view route exposed from the launch flow

### 7. Clean Older Shared Surfaces

- [ ] Replace raw `<b>` labels and small heavy inline headings in lower-traffic shared UI:

```text
js/analytics/dashboard.js
js/home/home_cards.js
js/insights/ui.js
js/settings/settings_ui.js
js/curriculum/curriculum_ui.js
js/import/midi_ui.js
js/progression/progress_ui.js
js/instruments/piano/pages/analytics.js
```

- [ ] Treat `margin-left` as a bug only when it separates buttons or action controls. Leave semantic indentation alone.
- [ ] Prefer classes over inline styles. If a module already has helper functions, update the helper instead of each caller.

Tests to update:

- Existing tests covering each page, if present
- Static visual contract test from Task 1

Verification:

```powershell
npm test -- tests/test_ui_visual_contracts.js
```

### 8. Final Static And Browser Regression Sweep

- [ ] Run the full static scan again and confirm no unplanned matches remain outside the allowlist.

```powershell
Select-String -Path .\js\**\*.js -Pattern 'font-size:1[3456]px;font-weight:(800|900)','font-size:2[0246]px;font-weight:900','<b>[^<]+</b>','</button> <button','margin-left:[0-9]+px','display:flex;justify-content:space-between;align-items:center' -AllMatches
```

- [ ] Run targeted tests from each task.
- [ ] Run full suite.

```powershell
npm test
```

- [ ] Browser clickthrough sweep with cache-busted URLs:

```text
file:///C:/Users/Scott%20Morley/Dev/sparksuite/index.html?uiPolishSweep=<timestamp>
```

Routes to inspect:

- Launcher
- Guitar Practice
- Guitar Guided Session
- Guitar Songs
- Guitar Performance
- Guitar Games
- Guitar Tools/Stats/Guide
- Piano Practice
- Piano C Major lesson/session/result
- Piano Songs
- Piano Performance
- Piano Games

Acceptance criteria:

- No once-per-second blinking on lesson/session pages.
- No orange/action buttons overlap or crowd at desktop width.
- No in-card headings that look heavier than surrounding hierarchy unless intentionally acting as the primary card title.
- No raw `<b>` labels in visible app renderers outside the allowlist.
- No no-gap `space-between` rows in action/result/card rows.
- Full `npm test` passes.
