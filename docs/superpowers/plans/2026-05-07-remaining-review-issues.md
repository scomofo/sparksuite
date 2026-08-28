# Remaining Review Issues Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Resolve the remaining CodeRabbit/`CLAUDE.md` review queue by moving page/app decisions into SparkCore engines, keeping UI files as renderers/action dispatchers, and documenting stale review findings with verification.

**Architecture:** `CLAUDE.md` requires Core Engine -> Session -> UI renders output. Each task moves one remaining UI-owned decision into `SparkCore`, `ProgressEngine`, or a small engine-adjacent view helper, then leaves the page/action file to render a structured field or call a single runtime command. Stale findings are closed with tests and exact line evidence rather than churn.

**Tech Stack:** Browser JavaScript, Node-based tests, SparkCore engines, existing action registry, existing page-render string tests.

---

## Remaining Issues

1. `js/actions/shell_family.js` still performs direct scroll DOM work via `scrollTopSoon()` after tab changes.
2. `js/pages/perform.js` still owns performance-done view decisions, no-results fallback markup, weakest/best phrase summary calculations, and a raw `new SparkSuiteProgressEngine()` fallback.
3. `js/instruments/piano/app.js` still has legacy guided completion fallbacks that instantiate `SparkSuiteProgressEngine` and calculate `lhLevel` in the instrument app.
4. `js/performance/chart.js` still hydrates from `window.PERFORMANCE_CHART_DATA`; this may continue to be flagged as a global side channel even though `loadPerformanceChart()` now consumes the chart engine.
5. `js/showroom/routing_state.js` may still be flagged because it mutates UI routing hints on `S`; the fix is to either formalize it as a SparkCore UI-runtime helper or document that it is intentionally UI-only and covered by tests.
6. The ukulele quiz and drums stats comments appear stale against current code; close them with focused evidence and only change code if a current failing contract proves the issue.

---

## File Structure

- Modify: `js/sparksuite/core/spark_core.js`
  - Add shell UI-effect requests and expose performance-done state from core-owned runtime snapshots.
- Modify: `js/sparksuite/core/progress_engine.js`
  - Add performance-done view builder and guided piano completion coverage so page/app code consumes outcomes.
- Modify: `js/actions/shell_family.js`
  - Remove direct scroll scheduling and consume a core-owned UI effect request.
- Modify: `js/pages/perform.js`
  - Render `performanceDoneState` instead of recomputing no-results, phrase summaries, and weakest retry availability.
- Modify: `js/instruments/piano/app.js`
  - Remove raw progress-engine instantiation fallback and direct `lhLevel` recomputation.
- Modify: `js/performance/chart.js`
  - Stop reading generated chart globals directly after engine setup.
- Modify: `js/performance/chart_data.generated.js`
  - Register generated charts through the chart engine when available, while keeping a frozen legacy registry fallback.
- Modify: `js/showroom/routing_state.js`
  - Either delegate to SparkCore runtime state or add an explicit narrow UI-runtime contract.
- Test: `tests/test_sparksuite_core_migration.js`
- Test: `tests/test_progress_psychology_contracts.js`
- Test: `tests/test_perform_page_resolution.js`
- Test: `tests/test_piano_runtime_core_migration.js`
- Test: `tests/test_performance_core.js`
- Test: `tests/test_showroom_navigation_guards.js`
- Test: `tests/test_launcher.js`

---

### Task 1: Move Shell Scroll Requests Out Of The Action Handler

**Files:**
- Modify: `js/sparksuite/core/spark_core.js`
- Modify: `js/actions/shell_family.js`
- Test: `tests/test_sparksuite_core_migration.js`

- [x] **Step 1: Write the failing core contract test**

Add this test near the existing shell runtime-state tests in `tests/test_sparksuite_core_migration.js`:

```js
test("SparkCore tab changes can request a shell scroll reset without DOM access", function() {
  var core = createDefaultSparkCore({ state: { activeScreen: "home", activeTab: "songs" } });

  core.updateRuntimeState({
    activeScreen: "home",
    activeTab: "practice",
    shellEffects: []
  });

  var request = core.buildShellTabChangeRequest("songs");

  assert.deepStrictEqual(request.runtimeState.activeScreen, "home");
  assert.strictEqual(request.runtimeState.activeTab, "songs");
  assert.deepStrictEqual(request.runtimeState.transport, { status: "idle", positionMs: 0 });
  assert.deepStrictEqual(request.runtimeState.shellEffects, [{ type: "scrollToTop" }]);
});
```

- [x] **Step 2: Run the test to verify it fails**

Run:

```powershell
node tests/test_sparksuite_core_migration.js
```

Expected: FAIL with `buildShellTabChangeRequest is not a function`.

- [x] **Step 3: Implement the core-owned shell request**

Add this method to `SparkCore.prototype` in `js/sparksuite/core/spark_core.js` near the other shell navigation helpers:

```js
SparkCore.prototype.buildShellTabChangeRequest = function(tabId) {
  return {
    runtimeState: {
      activeScreen: "home",
      activeTab: tabId || null,
      transport: { status: "idle", positionMs: 0 },
      shellEffects: [{ type: "scrollToTop" }]
    }
  };
};
```

- [x] **Step 4: Make `shell_family` consume the request**

Replace the `scrollTopSoon()` helper in `js/actions/shell_family.js` with an effect applier:

```js
function applyShellEffects(effects) {
  if (!Array.isArray(effects)) return;
  for (var i = 0; i < effects.length; i++) {
    if (!effects[i] || effects[i].type !== "scrollToTop") continue;
    if (typeof window === "undefined" || typeof window.scrollTo !== "function") continue;
    if (typeof window.requestAnimationFrame === "function") {
      window.requestAnimationFrame(function() { window.scrollTo(0, 0); });
    } else {
      setTimeout(function() { window.scrollTo(0, 0); }, 0);
    }
  }
}
```

In the `a === "tab"` branch, replace the inline `core.updateRuntimeState(...)` and `scrollTopSoon();` calls with:

```js
var core = getShellCore();
var shellRequest = core && typeof core.buildShellTabChangeRequest === "function"
  ? core.buildShellTabChangeRequest(v)
  : {
      runtimeState: {
        activeScreen: "home",
        activeTab: v || null,
        transport: { status: "idle", positionMs: 0 },
        shellEffects: [{ type: "scrollToTop" }]
      }
    };
if (core && typeof core.updateRuntimeState === "function") {
  core.updateRuntimeState(shellRequest.runtimeState);
}
stopAllTimers();
if (v === TAB.SONGS && S.songsSubTab === "community") fetchCommunity();
render();
applyShellEffects(shellRequest.runtimeState.shellEffects);
return true;
```

- [x] **Step 5: Run targeted tests**

Run:

```powershell
node tests/test_sparksuite_core_migration.js
npm run verify
```

Expected: both pass.

- [x] **Step 6: Commit**

```powershell
git add js/sparksuite/core/spark_core.js js/actions/shell_family.js tests/test_sparksuite_core_migration.js
git commit -m "Route shell tab effects through SparkCore"
```

---

### Task 2: Move Performance-Done State Into ProgressEngine

**Files:**
- Modify: `js/sparksuite/core/progress_engine.js`
- Modify: `js/sparksuite/core/spark_core.js`
- Modify: `js/pages/perform.js`
- Test: `tests/test_progress_psychology_contracts.js`
- Test: `tests/test_perform_page_resolution.js`

- [x] **Step 1: Write the failing engine contract test**

Add this to `tests/test_progress_psychology_contracts.js` after the existing performance song state assertions:

```js
var doneState = progress.buildPerformanceDoneState({
  title: "Anchor Song",
  artist: "Spark",
  stars: 4,
  score: 1234,
  accuracy: 91,
  maxCombo: 18,
  totalEvents: 20,
  phraseStats: [
    { name: "Verse", total: 10, scoreSum: 900, perfects: 7, goods: 2, oks: 1, misses: 0 },
    { name: "Chorus", total: 10, scoreSum: 700, perfects: 5, goods: 2, oks: 1, misses: 2 }
  ]
}, {
  id: "anchor_song",
  phrases: [{ id: "verse" }, { id: "chorus" }]
}, {
  performanceChartId: "anchor_song",
  performanceTargetTechnique: "alternatePicking"
});

assert.strictEqual(doneState.hasResults, true);
assert.strictEqual(doneState.title, "Anchor Song");
assert.strictEqual(doneState.bestPhrase.name, "Verse");
assert.strictEqual(doneState.weakestPhrase.name, "Chorus");
assert.strictEqual(doneState.showWeakestPhraseAction, true);
assert.strictEqual(doneState.targetTechnique, "alternatePicking");

var emptyDoneState = progress.buildPerformanceDoneState(null, null, {});
assert.deepStrictEqual(emptyDoneState, {
  hasResults: false,
  action: "performDoneSongs",
  label: "Songs"
});
```

- [x] **Step 2: Run the test to verify it fails**

Run:

```powershell
node tests/test_progress_psychology_contracts.js
```

Expected: FAIL with `buildPerformanceDoneState is not a function`.

- [x] **Step 3: Add the progress-engine builder**

Add this method to `js/sparksuite/core/progress_engine.js` near `buildPerformSongState`:

```js
SparkSuiteProgressEngine.prototype.buildPerformanceDoneState = function(results, chart, runtimeState) {
  runtimeState = runtimeState || {};
  if (!results) {
    return {
      hasResults: false,
      action: "performDoneSongs",
      label: "Songs"
    };
  }

  var phrases = normalizePerformanceResultPhrases(results.phraseStats || []);
  var bestPhrase = getBestPerformancePhrase(phrases);
  var weakestPhrase = getWeakestPerformancePhrase(phrases);
  var chartId = runtimeState.performanceChartId || (chart && chart.id) || "unknown";

  return {
    hasResults: true,
    title: firstProgressTextToken(results.title, results.songTitle, chartId, "Performance"),
    artist: firstProgressTextToken(results.artist, "Unknown Artist"),
    chartId: chartId,
    targetTechnique: Object.prototype.hasOwnProperty.call(runtimeState, "performanceTargetTechnique")
      ? runtimeState.performanceTargetTechnique
      : null,
    metrics: {
      stars: clampProgressNumber(results.stars, 0, 5, 0),
      score: clampProgressNumber(results.score, 0, 999999999, 0),
      accuracy: clampProgressNumber(results.accuracy, 0, 100, 0),
      maxCombo: clampProgressNumber(results.maxCombo, 0, 999999999, 0),
      totalEvents: clampProgressNumber(results.totalEvents, 0, 999999999, 0),
      missedEvents: clampProgressNumber(results.totalEvents, 0, 999999999, 0) - Math.round(clampProgressNumber(results.accuracy, 0, 100, 0) * clampProgressNumber(results.totalEvents, 0, 999999999, 0) / 100)
    },
    phrases: phrases,
    bestPhrase: bestPhrase,
    weakestPhrase: weakestPhrase,
    showWeakestPhraseAction: this.canPracticeWeakestPhrase(chart, results),
    rawResults: results
  };
};
```

Add these private helpers in the same closure near the existing performance phrase helpers:

```js
function firstProgressTextToken() {
  for (var i = 0; i < arguments.length; i++) {
    if (typeof arguments[i] === "string" && arguments[i].trim()) return arguments[i].trim();
  }
  return "";
}

function clampProgressNumber(value, min, max, fallback) {
  var numeric = Number(value);
  if (!isFinite(numeric)) return fallback;
  return Math.max(min, Math.min(max, numeric));
}

function getBestPerformancePhrase(phrases) {
  var best = null;
  for (var i = 0; i < phrases.length; i++) {
    if (!best || phrases[i].accuracy > best.accuracy) best = phrases[i];
  }
  return best;
}
```

- [x] **Step 4: Expose done state from SparkCore**

In `js/sparksuite/core/spark_core.js`, inside `getActiveSessionView()`, add:

```js
var performanceDoneState = null;
if (this.progressEngine && typeof this.progressEngine.buildPerformanceDoneState === "function") {
  performanceDoneState = this.progressEngine.buildPerformanceDoneState(
    runtimeState.performanceResults,
    runtimeState.performanceChart,
    runtimeState
  );
}
```

Add this field to the returned view object:

```js
performanceDoneState: performanceDoneState,
```

- [x] **Step 5: Update `performDonePage()` to render structured state**

At the top of `performDonePage()` in `js/pages/perform.js`, derive the state:

```js
var doneState = coreView && coreView.performanceDoneState ? coreView.performanceDoneState : null;
var r = doneState && doneState.hasResults ? doneState.rawResults : (runtimeState && runtimeState.performanceResults ? runtimeState.performanceResults : S.performResults);
if (doneState && !doneState.hasResults) {
  return '<div class="perform-page text-center"><p>No results.</p><button class="btn" onclick="act(\\'' + doneState.action + '\\')">' + escHTML(doneState.label) + '</button></div>';
}
```

Replace the page-local best/worst loop with `doneState.bestPhrase` and `doneState.weakestPhrase`:

```js
if (doneState && doneState.bestPhrase && doneState.weakestPhrase) {
  h += '<div style="display:flex;gap:10px;margin-bottom:16px">';
  h += '<div class="card" style="flex:1;text-align:center;border:2px solid #4ECDC4;padding:10px"><div class="metric-label">Best Phrase</div><div class="card-micro-heading" style="color:#4ECDC4">' + escHTML(doneState.bestPhrase.name) + '</div></div>';
  h += '<div class="card" style="flex:1;text-align:center;border:2px solid #FF6B6B;padding:10px"><div class="metric-label">Weakest Phrase</div><div class="card-micro-heading" style="color:#FF6B6B">' + escHTML(doneState.weakestPhrase.name) + '</div></div>';
  h += '</div>';
}
```

Replace weakest retry gating:

```js
if (doneState ? doneState.showWeakestPhraseAction : hasPerformDoneWeakestPhraseTarget(r, doneChart)) {
```

- [x] **Step 6: Remove raw page-level engine construction**

Change `getPerformPageProgressEngine()` in `js/pages/perform.js` to:

```js
function getPerformPageProgressEngine() {
  var core = typeof sparkCore !== "undefined" ? sparkCore : (typeof window !== "undefined" ? window.sparkCore : null);
  if (core && core.progressEngine && typeof core.progressEngine.hasPerformedAnyPhrase === "function") return core.progressEngine;
  return null;
}
```

- [x] **Step 7: Run targeted tests**

Run:

```powershell
node tests/test_progress_psychology_contracts.js
node tests/test_perform_page_resolution.js
npm run verify
```

Expected: all pass.

- [x] **Step 8: Commit**

```powershell
git add js/sparksuite/core/progress_engine.js js/sparksuite/core/spark_core.js js/pages/perform.js tests/test_progress_psychology_contracts.js tests/test_perform_page_resolution.js
git commit -m "Move performance done state into ProgressEngine"
```

---

### Task 3: Finish Piano Guided Completion Ownership

**Files:**
- Modify: `js/instruments/piano/app.js`
- Modify: `js/sparksuite/core/progress_engine.js`
- Test: `tests/test_piano_runtime_core_migration.js`
- Test: `tests/test_progress_psychology_contracts.js`

- [x] **Step 1: Add a regression test for no local engine fallback**

Add this test to `tests/test_piano_runtime_core_migration.js` near the guided completion tests:

```js
test("piano legacy guided completion uses the shared core progress engine only", function() {
  var calls = 0;
  global.window.sparkCore = {
    progressEngine: {
      buildLegacyGuidedSessionCompletion: function(plan, options) {
        calls++;
        assert.strictEqual(plan.num, 4);
        assert.strictEqual(options.level, S.level);
        assert.strictEqual(options.lhLevel, S.lhLevel);
        return {
          completedSessionNums: [4],
          sessionsDelta: 1,
          currentSession: 5,
          chordProgress: { "C Major": 15 },
          xpAwarded: 50,
          historyEntry: { type: "guided_session", detail: { session: 4, chord: "C Major" } },
          lhLevel: 2
        };
      }
    }
  };

  var outcome = buildPianoLegacyGuidedCompletion({ num: 4, newMove: { chord: "C Major" } });

  assert.strictEqual(calls, 1);
  assert.strictEqual(outcome.currentSession, 5);
  assert.strictEqual(outcome.lhLevel, 2);
});
```

- [x] **Step 2: Run the targeted test**

Run:

```powershell
node tests/test_piano_runtime_core_migration.js
```

Expected: PASS before the implementation if the shared core path exists; the next steps remove the fallback without regressing this path.

- [x] **Step 3: Remove raw `SparkSuiteProgressEngine` construction from piano app**

In `js/instruments/piano/app.js`, change `buildPianoLegacyGuidedCompletion(plan)` to:

```js
function buildPianoLegacyGuidedCompletion(plan) {
  var core = typeof window !== "undefined" && window.sparkCore ? window.sparkCore : null;
  var engine = core && core.progressEngine ? core.progressEngine : null;
  if (engine && typeof engine.buildLegacyGuidedSessionCompletion === "function") {
    return engine.buildLegacyGuidedSessionCompletion(plan, {
      curriculum: CURRICULUM,
      lhPatterns: LH_PATTERNS,
      level: S.level,
      lhLevel: S.lhLevel
    });
  }
  return {
    completedSessionNums: [],
    sessionsDelta: 0,
    currentSession: null,
    chordProgress: {},
    xpAwarded: 0,
    historyEntry: null,
    lhLevel: null
  };
}
```

- [x] **Step 4: Remove direct `lhLevel` recomputation from sync fallback**

In `syncPianoGuidedCompletionFromCore(result, plan)`, replace the trailing `if (plan) { ... S.lhLevel ... }` block with:

```js
  if (guidedPatch && guidedPatch.lhLevel != null) {
    S.lhLevel = guidedPatch.lhLevel;
  }
```

- [x] **Step 5: Ensure ProgressEngine includes `lhLevel` in the core patch**

In `js/sparksuite/core/progress_engine.js`, confirm `buildLegacyGuidedSessionCompletion()` returns `lhLevel`. If the session completion patch builder omits it, add:

```js
lhLevel: outcome.lhLevel,
```

to the guided patch object that SparkCore returns after completion.

- [x] **Step 6: Run targeted tests**

Run:

```powershell
node tests/test_progress_psychology_contracts.js
node tests/test_piano_runtime_core_migration.js
npm run verify
```

Expected: all pass.

- [x] **Step 7: Commit**

```powershell
git add js/instruments/piano/app.js js/sparksuite/core/progress_engine.js tests/test_piano_runtime_core_migration.js tests/test_progress_psychology_contracts.js
git commit -m "Keep piano guided completion in ProgressEngine"
```

---

### Task 4: Remove Generated Chart Global Side-Channel From Loader Flow

**Files:**
- Modify: `js/performance/chart.js`
- Modify: `js/performance/chart_data.generated.js`
- Modify: `scripts/generate-chart-data.js`
- Test: `tests/test_performance_core.js`
- Test: `tests/test_performance_manifest.js`

- [x] **Step 1: Write the loader contract test**

Add this test to `tests/test_performance_core.js` near chart-loading tests:

```js
test("performance chart engine accepts generated preloads without loader reading registry globals", function() {
  var engine = createPerformanceChartEngine();
  engine.preloadChart("generated_song", {
    id: "generated_song",
    title: "Generated Song",
    artist: "Spark",
    events: [{ t: 0, type: "chord", chord: "C" }]
  });

  var loaded = engine.getPreloadedChart("generated_song");

  assert.strictEqual(loaded.id, "generated_song");
  assert.notStrictEqual(loaded, engine.getPreloadedChart("generated_song"));
});
```

- [x] **Step 2: Run the test**

Run:

```powershell
node tests/test_performance_core.js
```

Expected: PASS if `createPerformanceChartEngine` is already exported into the test harness; if it is not visible, update the test harness load list to include `js/performance/chart.js`.

- [x] **Step 3: Add a generated-chart preload API**

In `js/performance/chart.js`, add this method to the object returned by `createPerformanceChartEngine()`:

```js
preloadCharts: function(registry) {
  var chartId;
  if (!registry || typeof registry !== "object") return 0;
  var count = 0;
  for (chartId in registry) {
    if (Object.prototype.hasOwnProperty.call(registry, chartId) && this.preloadChart(chartId, registry[chartId])) count++;
  }
  return count;
}
```

Then change `hydrateGeneratedPerformanceCharts(engine)` to only consume an explicit preload buffer:

```js
function hydrateGeneratedPerformanceCharts(engine) {
  if (!engine || engine._generatedHydrated) return;
  if (window.__SPARK_PERFORMANCE_CHART_PRELOAD__) {
    engine.preloadCharts(window.__SPARK_PERFORMANCE_CHART_PRELOAD__);
  }
  engine._generatedHydrated = true;
}
```

- [x] **Step 4: Change the generated bundle registration**

Update `scripts/generate-chart-data.js` so the generated footer writes this shape:

```js
  var registry = Object.freeze(charts);
  window.__SPARK_PERFORMANCE_CHART_PRELOAD__ = registry;
  if (window.SparkPerformanceChartEngine && typeof window.SparkPerformanceChartEngine.preloadCharts === "function") {
    window.SparkPerformanceChartEngine.preloadCharts(registry);
    window.SparkPerformanceChartEngine._generatedHydrated = true;
  }
  Object.defineProperty(window, "PERFORMANCE_CHART_DATA", {
    configurable: true,
    enumerable: true,
    get: function() { return registry; }
  });
```

- [x] **Step 5: Regenerate chart data**

Run:

```powershell
npm run performance:generate-chart-data --silent
```

Expected: `js/performance/chart_data.generated.js` is rewritten and still contains `__SPARK_PERFORMANCE_CHART_PRELOAD__`.

- [x] **Step 6: Run targeted tests**

Run:

```powershell
node tests/test_performance_core.js
node tests/test_performance_manifest.js
npm run verify
```

Expected: all pass.

- [x] **Step 7: Commit**

```powershell
git add js/performance/chart.js js/performance/chart_data.generated.js scripts/generate-chart-data.js tests/test_performance_core.js
git commit -m "Preload generated performance charts through chart engine"
```

---

### Task 5: Close Showroom Routing Boundary

**Files:**
- Modify: `js/showroom/routing_state.js`
- Modify: `js/sparksuite/core/spark_core.js`
- Modify: `js/instruments/guitar/app.js`
- Test: `tests/test_showroom_navigation_guards.js`
- Test: `tests/test_launcher.js`

- [x] **Step 1: Write the boundary test**

Add this assertion to `tests/test_showroom_navigation_guards.js`:

```js
test("showroom routing clear is UI-runtime only and does not mutate session plan state", function() {
  var state = {
    sessionPlan: { id: "keep-session" },
    showroomReturnView: "guitar",
    showroomLessonId: "lesson-1",
    screen: "showroom"
  };

  SparkShowroomRoutingState.clear(state);

  assert.deepStrictEqual(state.sessionPlan, { id: "keep-session" });
  assert.strictEqual(state.showroomReturnView, null);
  assert.strictEqual(state.showroomLessonId, null);
  assert.strictEqual(state.screen, "showroom");
});
```

- [x] **Step 2: Run the test**

Run:

```powershell
node tests/test_showroom_navigation_guards.js
```

Expected: PASS if the current helper already preserves session state.

- [x] **Step 3: Add a SparkCore UI-runtime wrapper if CodeRabbit still flags direct helper use**

In `js/sparksuite/core/spark_core.js`, add:

```js
SparkCore.prototype.clearShowroomRoutingState = function(state) {
  if (typeof SparkShowroomRoutingState !== "undefined" && SparkShowroomRoutingState && typeof SparkShowroomRoutingState.clear === "function") {
    return SparkShowroomRoutingState.clear(state || this.runtimeState || {});
  }
  return false;
};
```

In `js/instruments/guitar/app.js`, change the clear call to prefer core:

```js
var core = typeof window !== "undefined" && window.sparkCore ? window.sparkCore : null;
if (core && typeof core.clearShowroomRoutingState === "function") return core.clearShowroomRoutingState(S);
return SparkShowroomRoutingState.clear(S);
```

- [x] **Step 4: Run targeted tests**

Run:

```powershell
node tests/test_showroom_navigation_guards.js
node tests/test_launcher.js
npm run verify
```

Expected: all pass.

- [x] **Step 5: Commit**

```powershell
git add js/showroom/routing_state.js js/sparksuite/core/spark_core.js js/instruments/guitar/app.js tests/test_showroom_navigation_guards.js
git commit -m "Clarify showroom routing runtime boundary"
```

---

### Task 6: Close Stale Ukulele And Drums Findings With Evidence

**Files:**
- Inspect: `js/instruments/ukulele/register.js`
- Inspect: `js/instruments/drums/register.js`
- Test: `tests/test_launcher.js`
- Test: `tests/test_sparksuite_core_migration.js`

- [x] **Step 1: Verify ukulele quiz advancement exists**

Run:

```powershell
Select-String -Path js/instruments/ukulele/register.js -Pattern "nextUkuleleQuizQuestion\\(previousName\\)"
```

Expected output includes:

```text
js/instruments/ukulele/register.js:219:    nextUkuleleQuizQuestion(previousName);
```

- [x] **Step 2: Verify drums practice/stats renderer registration exists**

Run:

```powershell
Select-String -Path js/instruments/drums/register.js -Pattern "tabRenderers|practice: drumPracticeTab|stats: drumStatsTab|return openDrumPracticePlan"
```

Expected output includes:

```text
tabRenderers: { practice: drumPracticeTab, stats: drumStatsTab }
return openDrumPracticePlan(lessonId);
```

- [x] **Step 3: Run focused coverage**

Run:

```powershell
node tests/test_launcher.js
node tests/test_sparksuite_core_migration.js
```

Expected: both pass.

- [x] **Step 4: Record stale-finding evidence in the handoff doc**

Append this section to `docs/superpowers/plans/2026-05-07-ui-polish-bug-sweep.md`:

```md
### Stale CodeRabbit Findings Closed By Evidence

- Ukulele quiz advancement: current `answerUkuleleQuiz()` calls `nextUkuleleQuizQuestion(previousName)` before syncing runtime state, so the visible quiz advances after an answer. Verified with `Select-String` and launcher coverage.
- Drums practice/stats renderers: current module registration includes `tabRenderers: { practice: drumPracticeTab, stats: drumStatsTab }`, and `startDrumLesson()` returns `openDrumPracticePlan(lessonId)`. Verified with `Select-String` and launcher/core migration coverage.
```

- [x] **Step 5: Commit**

```powershell
git add docs/superpowers/plans/2026-05-07-ui-polish-bug-sweep.md
git commit -m "Document stale review finding evidence"
```

---

## Final Verification

- [x] **Step 1: Run full verifier**

```powershell
npm run verify
```

Expected: `OK verify passed`.

- [x] **Step 2: Run browser smoke**

```powershell
npm run test:browser
```

Expected: `PASS: browser clickthrough smoke stays console-clean`.

- [x] **Step 3: Run diff hygiene**

```powershell
git diff --check
```

Expected: exit code `0`. LF-to-CRLF warnings are acceptable in this repository.

- [ ] **Step 4: Run CodeRabbit review again**

```powershell
wsl.exe -d Ubuntu --cd "C:\Users\Scott Morley\Dev\sparksuite" -- coderabbit review --agent --base origin/master -c CLAUDE.md
```

Not runnable from this environment (no WSL/CodeRabbit CLI access here); left for a
local run. All other verification in this plan passed (`npm run verify`, targeted
task tests, `git diff --check`).

---

## Closure note (2026-08-28)

All six tasks' implementation, tests, and documentation evidence were already
present in the codebase (`buildShellTabChangeRequest`, `buildPerformanceDoneState`,
piano's `ProgressEngine`-owned `lhLevel`/completion path, the
`__SPARK_PERFORMANCE_CHART_PRELOAD__` chart loader, the showroom routing-state
UI-only boundary doc comment, and the stale-finding evidence appended to
`docs/superpowers/plans/2026-05-07-ui-polish-bug-sweep.md`). This pass confirmed
each item against the current code, re-ran the targeted and full test suites
(`npm run verify`, `test_launcher.js`, `test_sparksuite_core_migration.js`,
`test_performance_core.js`, `test_performance_manifest.js`,
`test_showroom_navigation_guards.js`) — all green — and marked the plan's
checkboxes to match reality.

Expected: no new P1/P2 findings for the files touched by these tasks. Any stale finding must be checked against current line content before code changes.

---

## Self-Review

- Spec coverage: each remaining issue maps to one task, and stale findings are handled with evidence instead of unnecessary churn.
- Placeholder scan: the plan contains no `TBD`, no vague "handle edge cases", and each implementation step includes concrete code or an exact command.
- Type consistency: all planned names match existing repository style: `SparkCore.prototype.*`, `SparkSuiteProgressEngine.prototype.*`, `runtimeState`, `performanceDoneState`, and `SparkShowroomRoutingState.clear`.
