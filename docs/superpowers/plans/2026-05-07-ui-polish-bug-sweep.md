# UI Polish Bug Sweep Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove the remaining UI polish bugs that match the recent fixes: overly heavy in-card typography, crowded orange/action buttons, inline `<b>` labels that visually pop too hard, and flex rows that can crowd because they rely on `space-between` without a gap.

**Architecture:** Keep behavior unchanged. Add or reuse shared CSS primitives in `styles.css`, then migrate high-visibility renderers away from inline one-off styles. Add static/renderer tests so new pages do not reintroduce the same defects.

**Tech Stack:** Static HTML app, JavaScript renderer modules, CSS, Node test suite via `npm test`.

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
