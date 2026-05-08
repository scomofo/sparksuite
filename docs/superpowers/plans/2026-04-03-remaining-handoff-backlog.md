# SparkSuite Remaining Handoff Backlog

Updated: 2026-04-03

## Purpose

This document is the trimmed follow-up to the larger status tracker. It lists only the meaningful work still unresolved from the current SparkSuite handoffs and roadmap, based on the repo state after the latest migration passes.

Use this as the practical backlog for "what is still left," without re-reading the full implementation history.

## Current Summary

The repo is no longer missing the major platform scaffolding.

Already true:
- `SparkCore` is real and central
- major session families have explicit core-backed request helpers
- performance, guided, daily practice, songs, dashboard, editor, and many utility flows now have core-backed runtime paths
- guitar, piano, bass, and ukulele all exist in the SparkSuite instrument layer
- rhythm/import/performance architecture is implemented beyond a stub
- imported-technique practice focus now has real end-to-end follow-through across launch, song detail, runtime UI, retry targeting, scoring feedback, progression, recommendations, and practice planning
- rhythm highway now has selectable assist modes, micro-loop tooling, and instrument-aware lane layouts instead of only a single early slice
- ukulele is no longer just structural scaffolding; it has deeper lesson depth, multiple performance charts, and module-owned recommendation/progression hooks

Still true:
- the app is still in a hybrid migration state
- `S.*` remains the practical persistence/runtime substrate in many places
- several flows are mirrored into core rather than fully owned by core runtime/domain objects

## Must Finish For Phase 1

### 1. Finish Remaining Runtime Ownership

Goal:
- no major user flow should depend on legacy orchestration for correctness

Still open:
- older tool/utility flows beyond simple settings snapshots
- remaining non-performance live loop families that are mirrored into core but not actually engine-owned
- any instrument-local branches that still rely on local shell behavior for correctness instead of using shared request helpers plus shared runtime ownership

Best next slices:
- utility families beyond screen ownership and shallow snapshots
- remaining shared mini-game/runtime flows that still use shell-owned timers/state machines
- any parallel instrument behavior not yet covered by focused runtime tests

### 2. Finish Progression Convergence

Goal:
- one authoritative progression path per flow

Still open:
- bridge layers still do more than pure projection in a few places
- `S.*` is still the final persistence model
- some recommendation/weak-spot surfaces still consume compatibility-era state rather than a true engine-owned domain profile

Best next slices:
- move more progression state shaping into core/domain objects
- reduce bridge logic to projection/sync where possible
- align recommendation inputs with the newer core-owned outputs

### 3. Bring Bass to Real Phase 1 Parity

Goal:
- bass should be a real migrated instrument, not just a registered adapter with partial runtime coverage

Still open:
- authored bass content breadth beyond the current groove/ghost/funk slices
- broader bass performance/practice parity across more real song/chart surfaces
- stronger bass-specific module/runtime identity beyond the currently migrated guided/practice/recommendation surfaces

### 4. Finish Ukulele Phase 1 Parity

Goal:
- ukulele should feel fully peer-level with the stronger instrument tracks

Still open:
- broader song/performance depth beyond the current lesson/rhythm/chart slice
- more authored chart/song coverage
- continued module-specific polish so ukulele feels fully productized, not just clearly real

### 5. Finish Rhythm-Highway Phase 1 Parity

Goal:
- move from "credible real feature" to "matches handoff intent in later-phase depth"

Still open:
- more authored rhythm content breadth
- deeper loop refinement and practice polish
- more instrument-specific authored rhythm coverage and later-phase tuning

### 6. Finish Import/Performance Parity

Goal:
- imported charts should feel robust and polished enough for real Phase 1 use

Still open:
- more robustness around import edge cases
- deeper imported-technique behavior in shared rendering
- challenge/daily/follow-on surfaces that should respect the current focused imported-technique block

## Main Phase 2 Gaps

### 1. `S.*` Is Still The Real Substrate

This is still the biggest architectural mismatch with the roadmap.

Current state:
- `SparkCore` owns much more runtime/session state than before
- pages increasingly read core state first
- but many flows still ultimately depend on `S.*` as the practical source of truth

### 2. Live Loops Are Still Mostly Outside Engine-Owned Runtime Objects

Current state:
- performance, session, drill, and tool flows now mirror more state into core
- but the important live loops/timers/transport ownership are still largely shell-owned

This is the biggest remaining Phase 2 convergence gap after state ownership.

### 3. Bridges Are Cleaner, But Not Thin Yet

Current state:
- bridges are much less ad hoc
- but some still contain meaningful compatibility logic, not just projection

End-state target:
- engines/domain objects own behavior
- bridges mainly sync/projection/persistence compatibility

### 4. Pages Are Core-First In Many Places, Not Everywhere

Current state:
- several major pages now prefer core-backed session/runtime state
- some screens still lean heavily on legacy shell state for rendering details

Most likely remaining page families:
- utility/tool screens beyond the current settings/MIDI snapshot slice
- long-tail legacy surfaces that still read shell state first

## Lower-Priority But Real Product Gaps

### 1. Shared Renderer Parity For Imported Techniques

Current state:
- imported techniques affect conversion, scoring, preview, hit color, and overlay behavior
- the shared note sprite/highway renderer still has more generic treatment underneath

### 2. Utility Family Depth

Current state:
- utility screens now have explicit open/return helpers
- settings and MIDI now have a first core-backed state slice
- cloud/curriculum/import workflows are cleaner than before, but still more shell-owned than the major session families

### 3. Long-Tail Instrument Polish

Current state:
- guitar is still the strongest path
- piano is much more converged than before
- bass still needs the most parity work
- ukulele is in much better shape now, but still needs more breadth/depth to feel fully peer-level

## Recommended Next Order

1. Finish the biggest remaining Phase 1 gaps:
- runtime ownership
- progression convergence
- bass parity
- utility/workflow depth
- imported-technique follow-through in remaining surfaces

2. Keep Phase 2 moving in parallel where it has the highest payoff:
- reduce `S.*` dependence
- move more live loops into engine-owned runtime paths
- thin the bridge layer

3. Save true Phase 3 work for later:
- replacing the legacy shell wholesale
- deleting major compatibility pathways
- deeper platform/editor/content polish beyond handoff compliance

## Follow-ups From 2026-05-07 Master Review

Surfaced while reviewing commits `b987ee1..b14174e` (UI polish sweep + new `PracticeEngine`/`PsychologyEngine`).

### Engine migration retirement plan

- `js/sparksuite/core/psychology_engine.js` `getSessionStructure` and `shouldReward` fall back to global `SparkPsychology.*` if defined. Same dual-path shape in `practice_engine.js` `buildDailyPracticePlan`, which short-circuits to `SparkUkuleleMiniSessions` and `SparkPracticeTemplates` globals before the engine's own `generateExercises` runs. Functional today, but if the legacy globals drift the new engine silently inherits divergent behavior by load order. Track each fallback's retirement criterion alongside the broader `S.*` reduction work.

### `practice_engine.js` robustness

- `clone()` is `JSON.parse(JSON.stringify(v))` — drops functions/`undefined`/`Date`, throws on cycles. Currently safe because callers clone plain segment/exercise/meta data, but `meta.gameplayPayload` comes from `rhythmAdapter.createPayload` and is one refactor away from carrying non-JSON values. Either swap to a structured-clone shim or document the plain-data constraint at the call sites.
- `generateEarTrainingQuestion` does pool build → question pick → distractor fill (with attempts cap) → Fisher-Yates in one function. Logic is correct, but the empty-string padding on the `while (options.length < 4)` branch will surface blank quiz options to users rather than failing loudly. Split into helpers and add boundary tests for "<4 unique chords across all pools" and "fallbackPool exhausts."

### Browser smoke durability

- `tests/browser_clickthrough_smoke.js` leans on text selectors for CTAs (`"LET'S GO!"`, `"START VOCAL LESSON"`, `"PERFORM"`). Copy edits will silently break smoke without changing app behavior. Migrate CTA assertions to `data-testid` or aria-labels (the launcher's `getByLabel("Launch <name>")` is the right pattern).
- Fixed `await page.waitForTimeout(250..900)` is used throughout. Replace with `waitFor` on target locator/state where possible — the suite is slow today and will get racier as load characteristics shift.
- Confirm `npm run test:browser` is in the CI matrix. Headless Playwright + `file://` on Windows is fragile and will rot quickly if it only runs locally.

### Repo hygiene

- `js/performance/chart_data.generated.js` is 25,342 lines committed (necessary for `file://` use without a build step). Add `.gitattributes` entry `js/performance/chart_data.generated.js linguist-generated=true` (and consider `merge=ours`) so it stops dominating diffs and `git blame` and gets collapsed in PR views.

## Honest Status

The app is now credibly on the roadmap and no longer just "inspired by" it.

But it is not yet fully handoff-complete, and it is definitely not at the final architecture described by the roadmap.

The remaining work is now mostly:
- convergence
- parity depth
- reducing legacy ownership

not missing foundational systems.
