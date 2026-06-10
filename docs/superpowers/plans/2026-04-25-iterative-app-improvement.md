# SparkSuite Iterative Improvement Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Keep improving SparkSuite in small, shippable slices without backsliding into mock-driven UI, legacy-first runtime ownership, or weak release confidence.

**Architecture:** The app should keep moving toward `SparkCore` and the shared session/runtime layer as the source of truth, while user-facing surfaces stop inventing sample data and instead render real state or honest empty states. Each iteration should close one visible product gap, add focused regression coverage, and then rerun the existing suite and release gates before the next slice begins.

**Tech Stack:** Electron, browser-rendered JS UI, SparkCore/session runtime, legacy `S.*` compatibility layer, Node-based test scripts, packaged desktop smoke workflow.

---

## Current Working Assumptions

- The repo already has the handoff and production-readiness infrastructure in place.
- The most urgent visible quality issue is user-facing template/sample data still showing up on active surfaces.
- The current in-flight work is concentrated in:
  - `C:\Users\Scott Morley\Dev\sparksuite\js\showroom\spark-showroom.js`
  - `C:\Users\Scott Morley\Dev\sparksuite\tests\test_profile_page_resolution.js`
- `npm test`, `npm run verify`, and `npm run smoke:desktop -- --skip-verify` are the core gates for all iterative improvements unless a smaller slice only needs focused tests first.

---

### Task 1: Finish The Showroom Honesty Pass

**Files:**
- Modify: `C:\Users\Scott Morley\Dev\sparksuite\js\showroom\spark-showroom.js`
- Modify: `C:\Users\Scott Morley\Dev\sparksuite\js\render_showroom.js`
- Test: `C:\Users\Scott Morley\Dev\sparksuite\tests\test_profile_page_resolution.js`
- Test: `C:\Users\Scott Morley\Dev\sparksuite\tests\test_launcher.js`
- Test: `C:\Users\Scott Morley\Dev\sparksuite\tests\test_session_song_page_instrument_resolution.js`

- [ ] Remove every active sample/template fallback from the profile-adjacent Showroom surfaces.
  Focus first on `profileRender`, `songLibraryRender`, `songDetailsRender`, `leaderboardRender`, `sessionSummaryRender`, `performanceRender`, `curriculumDashboardRender`, and `courseSyllabusRender`.

- [ ] Replace fake personas, stats, songs, badges, leaderboards, and curriculum modules with one of two outcomes only:
  1. real runtime/storage/instrument data
  2. explicit empty-state copy that tells the truth

- [ ] Make empty states consistent across these surfaces.
  Use neutral phrases such as “No song selected”, “No scored runs yet”, “No badges unlocked yet”, and “No curriculum module loaded yet” instead of “hero” sample content.

- [ ] Lock the cleanup in with targeted regressions.
  `C:\Users\Scott Morley\Dev\sparksuite\tests\test_profile_page_resolution.js` should stay focused on profile honesty, while broader Showroom regressions should live in the existing launcher/session-facing suites instead of spawning many one-off files.

- [ ] Run the focused honesty checks first.

Run: `node tests/test_profile_page_resolution.js`
Expected: PASS with no sample names, fake badges, or fake XP/song data leaking into active profile rendering.

- [ ] Run the broader affected UI suites.

Run: `node tests/test_launcher.js`
Expected: PASS

Run: `node tests/test_session_song_page_instrument_resolution.js`
Expected: PASS

- [ ] Run the full suite after the honesty pass is stable.

Run: `npm test`
Expected: PASS

---

### Task 2: Converge User-Facing Pages On Canonical Session And Profile State

**Files:**
- Modify: `C:\Users\Scott Morley\Dev\sparksuite\js\pages\practice.js`
- Modify: `C:\Users\Scott Morley\Dev\sparksuite\js\pages\plan.js`
- Modify: `C:\Users\Scott Morley\Dev\sparksuite\js\pages\session.js`
- Modify: `C:\Users\Scott Morley\Dev\sparksuite\js\instruments\piano\pages\practice.js`
- Modify: `C:\Users\Scott Morley\Dev\sparksuite\js\instruments\piano\pages\plan.js`
- Modify: `C:\Users\Scott Morley\Dev\sparksuite\js\instruments\piano\pages\session.js`
- Modify: `C:\Users\Scott Morley\Dev\sparksuite\js\sparksuite\core\spark_core.js`
- Test: `C:\Users\Scott Morley\Dev\sparksuite\tests\test_practice_page_instrument_resolution.js`
- Test: `C:\Users\Scott Morley\Dev\sparksuite\tests\test_instrument_specific_surface_resolution.js`
- Test: `C:\Users\Scott Morley\Dev\sparksuite\tests\test_piano_session_page_resolution.js`

- [ ] Audit each major page family for places where it still prefers legacy snapshot state over `sparkCore.getActiveSessionView()` or canonical profile/storage output.

- [ ] Convert the highest-traffic surfaces first:
  - shared practice
  - shared plan
  - shared session
  - piano-specific practice/plan/session

- [ ] For each page, enforce one rendering rule:
  if a canonical session/profile view exists, render that first; only fall back to legacy state when there is no canonical source available.

- [ ] Keep the UI honest during fallback.
  Do not recreate mock summaries just because canonical state is missing.

- [ ] Re-run the page resolution suites after each page-family conversion.

Run: `node tests/test_practice_page_instrument_resolution.js`
Expected: PASS

Run: `node tests/test_instrument_specific_surface_resolution.js`
Expected: PASS

Run: `node tests/test_piano_session_page_resolution.js`
Expected: PASS

- [ ] Re-run the full suite before moving on.

Run: `npm test`
Expected: PASS

---

### Task 3: Flatten Remaining Compatibility-Era Runtime Islands

**Files:**
- Modify: `C:\Users\Scott Morley\Dev\sparksuite\js\actions\*.js`
- Modify: `C:\Users\Scott Morley\Dev\sparksuite\js\sparksuite\bridges\progress_bridge.js`
- Modify: `C:\Users\Scott Morley\Dev\sparksuite\js\sparksuite\core\session_runtime.js`
- Modify: `C:\Users\Scott Morley\Dev\sparksuite\js\sparksuite\core\execution_gateway.js`
- Test: `C:\Users\Scott Morley\Dev\sparksuite\tests\test_sparksuite_core_migration.js`
- Test: `C:\Users\Scott Morley\Dev\sparksuite\tests\test_sparksuite_legacy_bridge_cleanup.js`
- Test: `C:\Users\Scott Morley\Dev\sparksuite\tests\test_execution_gateway.js`
- Test: `C:\Users\Scott Morley\Dev\sparksuite\tests\test_session_runtime.js`

- [ ] Sweep the remaining action families and helper modules for inline `S.*` mutations that still own behavior instead of just syncing projection state.

- [ ] For each island, move behavior into one of these boundaries only:
  - `SparkCore`
  - `SparkSessionRuntime`
  - `ExecutionGateway`
  - bridge helpers that only project/sync

- [ ] Keep the bridge layer thin.
  If a bridge is still deciding product behavior, move that logic inward.

- [ ] Re-run the runtime/bridge regression suites after each convergence slice.

Run: `node tests/test_sparksuite_core_migration.js`
Expected: PASS

Run: `node tests/test_sparksuite_legacy_bridge_cleanup.js`
Expected: PASS

Run: `node tests/test_execution_gateway.js`
Expected: PASS

Run: `node tests/test_session_runtime.js`
Expected: PASS

- [ ] Re-run the full suite when the slice is done.

Run: `npm test`
Expected: PASS

---

### Task 4: Close Instrument And Content Parity Gaps

**Files:**
- Modify: `C:\Users\Scott Morley\Dev\sparksuite\js\sparksuite\instruments\bass\**\*.js`
- Modify: `C:\Users\Scott Morley\Dev\sparksuite\js\sparksuite\instruments\ukulele\**\*.js`
- Modify: `C:\Users\Scott Morley\Dev\sparksuite\content\instruments\**\*.json`
- Modify: `C:\Users\Scott Morley\Dev\sparksuite\js\performance\chart_manifest.js`
- Test: `C:\Users\Scott Morley\Dev\sparksuite\tests\test_content_authoring_pipeline.js`
- Test: `C:\Users\Scott Morley\Dev\sparksuite\tests\test_curriculum_asset_pipeline.js`
- Test: `C:\Users\Scott Morley\Dev\sparksuite\tests\test_performance_instrument_routing.js`
- Test: `C:\Users\Scott Morley\Dev\sparksuite\tests\test_practice_selectors.js`

- [ ] Prioritize bass and ukulele parity until they feel productized rather than merely “registered”.

- [ ] Expand authored content only where the runtime already supports it.
  Prefer deepening real practice/performance/curriculum paths over adding more design-only surface area.

- [ ] Keep all new content flowing through the content pipeline, validator, and generated manifests instead of hardcoding content in UI files.

- [ ] Re-run the content and routing suites after each parity slice.

Run: `node tests/test_content_authoring_pipeline.js`
Expected: PASS

Run: `node tests/test_curriculum_asset_pipeline.js`
Expected: PASS

Run: `node tests/test_performance_instrument_routing.js`
Expected: PASS

Run: `node tests/test_practice_selectors.js`
Expected: PASS

- [ ] Re-run the full suite and content verification.

Run: `npm test`
Expected: PASS

Run: `npm run verify`
Expected: PASS

---

### Task 5: Keep Desktop And Release Confidence Ahead Of Product Polish

**Files:**
- Modify: `C:\Users\Scott Morley\Dev\sparksuite\js\desktop\bridge.js`
- Modify: `C:\Users\Scott Morley\Dev\sparksuite\desktop\packaged_smoke.js`
- Modify: `C:\Users\Scott Morley\Dev\sparksuite\scripts\desktop_packaged_smoke.js`
- Modify: `C:\Users\Scott Morley\Dev\sparksuite\docs\release\desktop_release_checklist.md`
- Test: `C:\Users\Scott Morley\Dev\sparksuite\tests\test_desktop_backup_resolution.js`
- Test: `C:\Users\Scott Morley\Dev\sparksuite\tests\test_packaged_smoke_desktop.js`
- Test: `C:\Users\Scott Morley\Dev\sparksuite\tests\test_release_regression_fixtures.js`

- [ ] Any time a storage, profile, session, or packaged-startup surface changes, keep the desktop/export/import path in lockstep with the canonical storage model.

- [ ] Expand the packaged smoke flow only when it catches a real class of failure.
  Avoid turning it into a giant brittle script; keep it focused on startup, session flow, export/import, and debug bundle health.

- [ ] Re-run release-facing checks after each desktop-affecting slice.

Run: `node tests/test_desktop_backup_resolution.js`
Expected: PASS

Run: `node tests/test_packaged_smoke_desktop.js`
Expected: PASS

Run: `node tests/test_release_regression_fixtures.js`
Expected: PASS

- [ ] Re-run the release gates.

Run: `npm run verify`
Expected: PASS

Run: `npm run smoke:desktop -- --skip-verify`
Expected: PASS

---

### Task 6: Product Polish Only After Truthfulness And Convergence

**Files:**
- Modify: `C:\Users\Scott Morley\Dev\sparksuite\js\pages\**\*.js`
- Modify: `C:\Users\Scott Morley\Dev\sparksuite\js\showroom\**\*.js`
- Modify: `C:\Users\Scott Morley\Dev\sparksuite\styles.css`
- Modify: `C:\Users\Scott Morley\Dev\sparksuite\spark-visual.css`
- Test: the smallest focused suites affected by each polish slice

- [ ] Restrict polish work to surfaces that are already using real data and canonical runtime sources.

- [ ] Prefer these polish targets:
  - profile and recovery UX
  - honest achievement/progress presentation
  - session/media surfaces that still feel placeholder-heavy even after the honesty pass
  - accessibility and packaged-desktop ergonomics

- [ ] Do not add decorative UI that depends on fake or future-only data.

- [ ] For each polish slice, run the smallest affected suites first, then the full suite before merging.

Run: `npm test`
Expected: PASS

---

## Iteration Rules

- [ ] Work from top to bottom; do not start deeper polish while active surfaces still leak template data.
- [ ] Every slice must leave the app more truthful, not just prettier.
- [ ] Prefer extending existing regression suites over creating many narrow, overlapping tests.
- [ ] Commit and merge each green slice before starting the next one so the tree stays clean.
- [ ] If a change uncovers a broader architecture hole, fix the smallest reusable boundary instead of patching around it in the page.

---

## Exit Conditions For This Plan

This plan is considered materially complete when all of the following are true:

- active user-facing surfaces no longer paper over missing state with fake people, fake songs, fake scores, or fake curriculum
- major pages prefer canonical session/profile/runtime sources over legacy shell snapshots
- remaining bridge/action/runtime islands are thin enough that behavior is core-owned
- bass and ukulele feel peer-level on core practice/performance/content paths
- desktop smoke, export/import, and verify gates stay green after iterative product work

