# Handoff: Warm Ember Showroom revival + merge consolidation

**Date:** 2026-04-22
**Session tip:** `c142599` on `master`
**Branch state:** `master` synced with `origin/master`; `feature/convergence` kept as a historical branch (already merged via PR #33); `archive/pre-convergence-master` preserves the 51-commit pre-merge master state.

---

## What happened in the previous session

### Part 1 — Merge consolidation (big)
The repo had **many unmerged pushes** when we started. Worked through them as follows:

| Action | Detail |
|---|---|
| Deleted 3 stale branches | `harmony-knight-export`, `claude/harmony-knight-setup-M8nO1`, `claude/gallant-jackson` |
| Closed PR #25 (rhythm-highway-v3-redesign) | Superseded by `feat/warm-ember-design-sync` manual Stitch port (`d8a4b06`) |
| Closed PR #26 (session-summary Bento Grid) | Superseded by manual Stitch port (`dbcd91c`) |
| Cherry-picked `codex/bug-hunt-hardening` into convergence | 2 commits (desktop MIDI fix + loader hardening) + 1 reconciliation (SessionPlan rewards shape, chart_manifest test, `SparkSessionV2.getExercise`). Kept convergence versions of ukulele files (convergence's data was more complete) |
| Addressed Codex review items on already-merged PRs | Profile menu regression (`backToHome()` vs `nav("home")`), BPM XSS escape, curriculum `\|\| 0` zero-overwrite bug, progress bar hardcoded 75%, `ctaLabel.toUpperCase()` crash, `lock_open → lock` glyph, hardcoded CAPS text, onclick escaping, `100vh → 100dvh`, 10× `prettyToken` normalizers |
| Deleted `fix/claude-md-reality-alignment` | 48 commits of abandoned experimental dev-overlay + instrument-generator scaffolding. 397 commits behind convergence. Archived in git history, never merged |
| Merged PR #33 (convergence → master) | Clean merge; origin/master picked up all warm-ember / showroom design work |
| Cherry-picked master's 51 commits onto new origin/master | 34 applied, 3 skipped as redundant (`aba8fd2` performance_editor parens, `d7f0ecf` onclick quoting, `7dac787` lightweight ukulele), 14 skipped as architecture-incompatible (persistedState / SparkTimerManager / bridge-absorption refactor — convergence took a different architectural path) |
| Archived the skipped work | `archive/pre-convergence-master` branch pushed to origin with the full original 51-commit master tip at `3e0c1f2` — preserves the 14 architecture commits forever so they can be revisited/reapplied individually later |

### Part 2 — Feature polish
With the merge landed, tackled several quality issues:

| Fix | Commit | Notes |
|---|---|---|
| Added "Switch Instrument" row to legacy `settingsPage` | `1d22eeb` | `S.activeInstrument` is persisted to localStorage; without this the launcher was effectively one-way after the first pick. Dispatches via new `act("switchInstrumentBack")` in `js/actions.js` |
| Wired real lesson data + prev/next into Showroom `lessonRender` / `pathRender` | `0572376` | Added `getActiveInstrumentLessons()` + `findActiveLesson(id)` helpers; extended `nav()` to accept a second-arg param so `nav("lesson", id)` pins `S._showroomLessonId`. Per-instrument chord visuals via `inst.ui.chord()` |
| 10× prettyToken normalizers | `edea6c6` | Changed guard from "reject number/boolean/object/..." to "accept only string or number" so numeric labels render instead of being silently dropped |
| `.env.local` + `.superpowers/` untracked | `81e7f4e` | `git add -A` slip in a previous commit; SPOTIFY_CLIENT_ID is a public identifier so no credential rotation needed. Added to `.gitignore` |
| Codex review polish | `d0a6d9b` | `lock_open → lock`, caps → sentence case, onclick escaping, `100vh → 100dvh` |
| Per-instrument chord visuals in lessons | `2a0186b` | `lessonRender` now calls `inst.ui.chord(chordObj, 220)` for any instrument that knows how to draw itself (piano keyboard, uke/bass fretboard). Guitar hand-drawn fallback only when the chord isn't in ALL_CHORDS |
| Removed 12 dead `ui.header / ui.tabNav / ui.ring` wrappers | `ec38db6` | All 4 instrument register.js files. Nothing ever called them. `headerHTML` and `tabNavHTML` are now fully gone; `pianoHeaderHTML` / `pianoTabNavHTML` / `ringHTML` are still active |
| Wired "Start Practice" CTA to guided session | `6fb0ff5` | `act('start_guided_session', <num>)` when a real lesson is loaded; falls back to `nav("performance")` for sample renders |
| Surfaced Spark prompt in lessonRender | `f03fad3` | New dedicated amber-tinted section between title and chord card |

### Part 3 — Showroom revival (Phase 1 + 2)
Discovered mid-session that **the entire Warm Ember Showroom set is design-reference mocks not wired into the live render pipeline** — explicit comment in `js/render.js` says so. `_showroomOverride` was written by the dispatcher but never read by anything.

Wired **7 Showroom renderers** into the live render pipeline:

| Renderer | How reached | Real-data source | Commit |
|---|---|---|---|
| `SparkLesson` | `nav("lesson", id)` from path; prev/next inside the lesson | `getActiveInstrumentLessons()` + `findActiveLesson()` | `0572376` / `f03fad3` / `2a0186b` |
| `SparkPath` | Legacy Tools "Learning Path" button; `nav("path")` | Same helpers; `S.completedGuidedSessions` for unlock state | `0a8ec24` |
| `SparkProfileScreen` | `nav("profile")` from any Warm Ember screen | `SparkStorage.load()` + `SparkInstruments.getAll()` | `0a8ec24` |
| `SparkSessionSummary` | **Auto-upgrades legacy `SCR.COMPLETE`** | `S.xp` / `S.streak` / `S.lastSessionAccuracy` / `S.completedGuidedSessions` → `findActiveLesson()` for the last lesson | `fd5e783` |
| `SparkSongLibrary` | `nav("library")` | Active instrument's `getData().SONGS` | `8f10374` |
| `SparkTuner` | `nav("tuner")` | `getLegacyTunerRuntime()` + per-instrument `STRINGS` → tuning string | `8f10374` |
| `SparkSongDetails` | Click song in library → `nav("song-details", id)` pins `S._showroomSongId` | Active instrument's SONGS lookup by id or title | `a37a8a2` |
| `SparkPracticeMetro` | Opt-in `nav("practice-metro")` | Already data-aware; drill Start now uses `launchPracticePlanItem(id)` | `c142599` |

### Infrastructure added

- **`nav(view, param)`** — optional second-arg deep-link. Used for `nav("lesson", num)` and `nav("song-details", id)`.
- **`SparkShowroomNavigate(view, param)`** — dispatcher. Sets `S._showroomOverride = <view>` + (when relevant) a context pin like `S._showroomLessonId` / `S._showroomSongId`. Also sets legacy slots as fallback for cases where the Showroom module isn't loaded.
- **`_showroomRoute` allow-list in `js/render.js::_renderInner`** — early-return routing that picks a Warm Ember renderer before the legacy pipeline fires. Hides the legacy top header (`document.getElementById("header").style.display = "none"`) since Warm Ember screens carry their own appbars.
- **`_legacyToShowroom` auto-upgrade map in `js/render.js`** — secondary routing layer that upgrades specific legacy `SCR.*` screens (currently just `SCR.COMPLETE → SparkSessionSummary`) to their Warm Ember equivalents when the engine drives the user there.
- **Override-preserve list** — `_overrideRoutes = { "profile":1, "lesson":1, "path":1, "learn":1, "library":1, "tuner":1, "session-summary":1, "song-details":1, "practice-metro":1 }` in `SparkShowroomNavigate`. Routes NOT in this list clear `_showroomOverride` so legacy slot routing wins.
- **Context-pin cleanup** — `S._showroomLessonId` / `S._showroomSongId` clear automatically when navigating away from their respective views (except to settings/profile/library for songs).
- **`getActiveInstrumentLessons()` / `findActiveLesson(id)`** — normalized lesson lookup helpers in `spark-showroom.js`. Handle ukulele's richer `SparkUkuleleLessons` shape AND the plainer `SESSIONS` array shape used by guitar/piano/bass.

---

## Current repo state

```
master  = c142599  (35 commits ahead of where we started)
origin/master ← synced
feature/convergence  (preserved, conceptually retired)
archive/pre-convergence-master  (preserves the 51-commit pre-merge master — has the 14 skipped architecture commits)
claude/pensive-bell-17c05c  (scratch worktree, untouched)
```

### All-green test suite at handoff
```
$ npm test
… many passing suites …
(no FAIL lines)
```

### What's in the tree but NOT wired (mocks)

These Showroom renderers are still hardcoded / partial:

| Renderer | Status | Blocker for wiring |
|---|---|---|
| `SparkSettings` | Data-aware (reads `S.darkMode`, flags) but **lacks legacy features** (theme picker, UI volume slider, practice-reminder toggle, version info, Rerun Setup button). Switching cold would regress. |
| `SparkPerformance` | Mock. Hardcoded "score 42850 streak 124 mult 4 rank S+ feedback PERFECT" etc. The legacy performance flow is the live rhythm-highway gameplay engine — a straight renderer swap won't work; needs engine-level integration |
| `SparkOnboardingWelcome` | Mock. Needs decision: does it replace the existing `_renderOnboardingOverlay()` (render.js line ~108) in the launcher gate, or does it gate separately? |
| `SparkCurriculumDashboard` | Mock (Ember Studio Curriculum Dashboard). No clear legacy counterpart — experimental screen. Port is optional |
| `SparkCourseSyllabus` | Mock (syllabus tree). Same — no legacy counterpart. Port optional |

---

## Outstanding work for the next session

### P1 — Port `SparkSettings` to real data with legacy feature parity

**Why:** It's on the allow-list path (`nav("settings")` currently still routes to legacy `SCR.SETTINGS`). Once `SparkSettings` has parity we can flip `nav("settings")` to the override and retire the legacy Settings page UI.

**Gap analysis:**
| Feature | Legacy (`settings_ui.js`) | `SparkSettings` | Action |
|---|---|---|---|
| Theme picker (dark/light/blue/highcontrast/retro) | ✅ | ❌ (only dark/light toggle) | Port the 5-theme picker into SparkSettings |
| UI Volume | Display only | ❌ | Add slider via `S.settings.uiVolume` |
| Practice Reminder | Display only | ❌ | Add toggle via `S.settings.practiceReminder` |
| Version info | ✅ | ❌ | Add a "System Core v…" footer row that reads `S.releaseInfo` |
| Rerun Setup | `act('openOnboarding')` | ❌ | Add a "Reset setup" link |
| Microphone Sensitivity | ❌ | ✅ | Legacy should absorb or move on |
| Latency Calibration | ❌ | ✅ | Same |
| Dark Mode | ✅ | ✅ | Already consistent |
| Push / Email notifications | ❌ | ✅ | Ditto |
| **Switch Instrument** | ✅ (added this session) | ✅ (added this session) | Already consistent |

**Plan:**
1. Add the missing rows to `settingsRender` in `js/showroom/spark-showroom.js` (Theme picker is the biggest — model after the legacy `renderSettingsCategory` `display` block).
2. Add an entry to `_showroomRoute` in `render.js` for `"settings"`.
3. Change `"settings"` dispatcher in `SparkShowroomNavigate` from `S.screen = SCR_.SETTINGS` to `S._showroomOverride = "settings"` + keep the legacy slot as fallback.
4. Delete or deprecate `js/settings/settings_ui.js::settingsPage` once parity is verified.

### P2 — Investigate `SparkOnboardingWelcome` integration

**Why:** First-run users currently see `_renderOnboardingOverlay()` which is the legacy onboarding flow. The Warm Ember welcome is nicer.

**Decision points:**
- Is `_renderOnboardingOverlay()` a multi-step flow (engine + state) or a single-screen gate?
- Does `SparkOnboardingWelcome` need multi-step support, or is it just a one-shot welcome?
- The `ctaAction` defaults to `act('completeOnboarding')` — does that action exist? (Quick grep:)
  ```bash
  grep -rn "completeOnboarding" js/ 2>/dev/null
  ```

**Plan:** Audit the legacy onboarding flow, compare to SparkOnboardingWelcome capabilities, then either (a) wire SparkOnboardingWelcome as the first screen of the flow, (b) replace the whole legacy flow (only if SparkOnboardingWelcome covers all steps), or (c) leave as design reference if it's a single screen that doesn't address the multi-step needs.

### P3 — Feature parity / integration for `SparkPracticeMetro`

**Why:** Currently opt-in via `nav("practice-metro")`. Legacy practice tab (reached via bottom nav) is what users see by default. To promote the Warm Ember version, verify:
- Drill launchers actually work end-to-end (launch via `launchPracticePlanItem`, land on correct screens, complete properly)
- Metronome `toggleMetro` / `metroBpm` actions fire correctly from within the override render
- Today's Practice Time is accurate
- "View All" link has a destination (currently dead)

**Plan:**
1. Click-test each drill type from a real practice plan in a live build (`npm start`).
2. If all flows work, change the bottom-nav "Practice" button in other Showroom screens (already calls `nav("practice")`) to call `nav("practice-metro")` instead. Or extend the dispatcher so `nav("practice")` sets the override when `SparkPracticeMetro` is available.
3. Document any gaps found.

### P4 — `SparkPerformance` is the hard one

Legacy performance (rhythm-highway gameplay) is live canvas + audio + physics. `SparkPerformance` is a static HUD mock. Wiring it means either:
- (a) Rewriting it to host the live gameplay engine (canvas, `updatePerformanceFrame`, score/combo state, `notifyHighwayHit`, etc.)
- (b) Treating it as a pre-gameplay "ready screen" that delegates to the legacy gameplay on Start

(b) is much more realistic. Scope it as a separate, dedicated session.

### P5 — Experimental dashboards (`SparkCurriculumDashboard`, `SparkCourseSyllabus`)

Decide: keep as design references? Delete? Port? No user-facing impact either way; probably lowest priority.

---

## Architecture notes / gotchas

### The `_showroomOverride` pattern
- Written by `SparkShowroomNavigate(view)` in `js/showroom/spark-showroom.js`
- Read by `_renderInner()` in `js/render.js` via the `_showroomRoute` allow-list
- Cleared on navigations to routes NOT in `_overrideRoutes`
- Also cleared when `SparkInstruments.activate()` / `deactivate()` runs (so switching instruments doesn't carry override state)

### Context pins (`_showroomLessonId`, `_showroomSongId`)
- Set when `nav()` is called with a second-arg param
- Consumed by the relevant renderer (`findActiveLesson` / song lookup in `songDetailsRender`)
- Cleared by `SparkShowroomNavigate` when navigating away from the pin's route family

### Legacy fallback safety net
Each dispatcher that sets `_showroomOverride` ALSO sets a legacy `S.screen` slot. If the Showroom module isn't loaded (e.g. `SparkSongLibrary` undefined), `render.js`'s allow-list check returns a function that's `false`, falls through, and the legacy pipeline renders the fallback screen. Users never land on a blank viewport.

### The 14 architecture commits (preserved on `archive/pre-convergence-master`)
These were master commits that did a coherent TODO-burndown refactor:
- Add `persistedState` helpers (`sc.p()` / `sc.r()`) to SparkCore
- Add `SparkTimerManager` to own all timer lifecycle
- Absorb `performance_bridge` / `progress_bridge` into SparkCore
- Migrate all page `S.*` reads to `sparkCore.p()/r()` accessors
- Guard 53 unsafe property accesses

Not applied because convergence took a different architectural path (split-app-js + render.js extraction + `progress_orchestrator` + keeping the bridges separate). **Nothing in the currently-wired code depends on persistedState or the timer manager** — I rewrote any `sc.r()` references back to `S.x` during cherry-picking.

If you want to revisit this refactor in the future: `git checkout archive/pre-convergence-master` and cherry-pick individual commits that still make sense.

### Remaining Codex review items (not addressed)
All low-severity cosmetic / refactor suggestions:
- Inline styles migration to CSS classes (scattered)
- `if-else` chain → map-object refactor (`render.js` showroomContent block — applies to ours too but small)
- Base64 SVG pattern in `.showroom-difficulty-fill::after` (misleading "pattern" comment — SVG is just a solid pixel)
- Redundant CSS rule `.showroom-drill.group:hover .showroom-drill-icon` (already covered by `.showroom-drill:hover …`)

---

## How to verify (next session)

```bash
cd sparksuite
npm start           # Electron launch; opens http://localhost at the app
# OR
npm run tauri:dev   # Tauri alternative
npm test            # Should all pass (~12 suites, 200+ tests)
```

### Click-path smoke tests

1. **First-time launcher:** Clear `localStorage`, refresh. Should see instrument picker.
2. **Switch Instrument:** Pick an instrument → Settings → Switch Instrument → back to picker.
3. **Learning Path + lesson deep-link:** Pick instrument → Tools tab → "Learning Path" button → Warm Ember path renders with real lessons → click a Review lesson → lesson screen shows real title / chord / spark text / prev-next buttons.
4. **Song Library + details:** `nav("library")` via a path Library button → real instrument SONGS list → click a song → Warm Ember song details with real title, chord progression, bpm.
5. **Tuner:** `nav("tuner")` → Warm Ember tuner, tuning letters match active instrument (EADGBE / EADG / GCEA).
6. **Session summary:** Complete any guided session. Post-session should show Warm Ember summary (not the bare legacy "Awesome!" page).
7. **PracticeMetro opt-in:** `SparkShowroomNavigate('practice-metro')` in devtools console → Warm Ember practice surface. Drill Start buttons should actually launch their items.

### If something breaks
- Check `js/render.js::_renderInner` logs `S._showroomOverride` value. If render is blank, the allow-list probably returned a falsy function.
- Check that the renderer's window export exists: `typeof SparkLesson !== "undefined"` etc.
- Check that the legacy fallback slots are set in the dispatcher handler (safety net).

---

## File pointers

| Area | File |
|---|---|
| Override routing | `js/render.js::_renderInner` (search for `_showroomOverride`, `_legacyToShowroom`) |
| Navigation dispatcher + allow-list | `js/showroom/spark-showroom.js::SparkShowroomNavigate` (around line 45) |
| Lesson helpers | `js/showroom/spark-showroom.js::getActiveInstrumentLessons` + `findActiveLesson` |
| Legacy settings | `js/settings/settings_ui.js::settingsPage` (has the Switch Instrument button added this session) |
| Legacy completePage | `js/pages/session.js::completePage` (replaced by SparkSessionSummary when available) |
| Main action dispatcher | `js/actions.js::window.act` (has `switchInstrumentBack`, `practiceStartItem`, `planStart*`, `start_guided_session`) |
| Instrument register files | `js/instruments/<type>/register.js` (each has `ui.chord()` — the canonical chord visual entry point) |
| Codex review thread | GitHub PRs #25–#33 comments; the real bugs have been addressed, the cosmetic ones haven't |

---

## One-line state summary

**Warm Ember Showroom is 70% live** — 7 renderers wired through a clean `_showroomOverride` + legacy-screen-upgrade pipeline with real data from the active instrument. 5 renderers remain as mocks (Settings parity, Performance engine integration, Onboarding flow decision, 2 experimental dashboards). The underlying merge + cleanup work is complete; `master` is in sync with `origin/master` and all tests pass.
