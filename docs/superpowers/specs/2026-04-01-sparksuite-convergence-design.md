# SparkSuite Convergence Design

**Date:** 2026-04-01
**Goal:** Eliminate the piano shim layer and unify piano + guitar into a single instrument-generic architecture. One `act()`, one `render()`, no context swap, no parallel dispatchers.

## Approach: Bottom-Up (A)

Build the abstraction layer, rewrite consumers, then delete the shim. Each step is testable — the app stays functional throughout.

## 1. Instrument Data Bag — `getData()`

Each instrument's `SparkInstruments.register()` provides a `getData()` method returning a **common shape**:

```javascript
{
  CHORDS: { 1: [...], 2: [...], ... },  // level-indexed chord arrays
  ALL_CHORDS: [...],                      // flat list of all chords
  SESSIONS: [...],                        // guided session definitions
  SONGS: [...],                           // song library
  LC: { 1: "#color", ... },              // level colors
  LN: { 1: "Level Name", ... },          // level names
  CHORD_NOTES: { "C Major": [...] },     // pitch classes for detection
  STRINGS: [...],                         // instrument strings (guitar only)
  // instrument-specific extras allowed
}
```

- **Guitar** `getData()` wraps existing globals (`CHORDS`, `ALL_CHORDS`, `SONGS`, `GUITAR_SESSIONS`, `LC`, `LN`, `GUITAR_STRINGS`, `CHORD_NOTES`).
- **Piano** `getData()` wraps `PIANO_DATA` properties into the same common shape. Piano's `CURRICULUM`, `LH_PATTERNS`, etc. are extras.
- The raw data files (`js/data.js`, `js/instruments/piano/data.js`) stay unchanged — `getData()` is the access layer.

## 2. Instrument UI Bag — `ui`

Each registration includes a `ui` object with rendering functions:

```javascript
ui: {
  chord: function(chordObj, opts) { ... },  // chordSVG (guitar) or pianoSVG (piano)
  header: function() { ... },               // instrument-specific header
  tabNav: function() { ... },               // tab navigation
  // additional instrument-specific renderers allowed
}
```

Shared pages call `SparkInstruments.getActive().ui.chord(...)` instead of instrument-specific function names.

## 3. Unified `act()` Dispatcher

The shared `act()` in `app.js` becomes a thin router:

```javascript
window.act = function(a, v) {
  // 1. Try instrument-specific handler first
  var inst = SparkInstruments.getActive();
  if (inst && inst.act && inst.act(a, v)) return;

  // 2. Shared actions (tab, toggle_dark, navigate, etc.)
  if (a === "tab") { ... }
  if (a === "toggle_dark") { ... }
  // ...
};
```

### Instrument `act()` handlers

- Return `true` if they handled the action, `undefined`/`false` to fall through to shared.
- **Guitar** gets a new `js/instruments/guitar/app.js` with all current inline guitar actions (`quickStart`, `startDrill`, `resumeSession`, `startSession`, `drillSwitch`, etc.) extracted from shared `app.js`, rewritten to use `getData()`.
- **Piano**'s existing `pianoAct()` becomes the piano instrument's `act()` handler, rewritten to use `getData()`.

### Actions that stay shared in `app.js`

`tab`, `toggle_dark`, `selLevel`, `toggleTimer`, `navigate`, `doneSession` — anything that doesn't touch instrument-specific data.

### Actions that move to instrument handlers

`quickStart`, `startDrill`, `resumeSession`, `startSession`, `drillSwitch` — anything referencing `CHORDS[S.level]`, `ALL_CHORDS`, or instrument-specific session logic.

## 4. Shared Pages Made Instrument-Generic

Pages in `js/pages/` (practice.js, session.js, songs.js, etc.) replace hardcoded references:

| Before | After |
|--------|-------|
| `CHORDS[S.level]` | `D.CHORDS[S.level]` |
| `ALL_CHORDS` | `D.ALL_CHORDS` |
| `GUITAR_SESSIONS[i]` | `D.SESSIONS[i]` |
| `GUITAR_STRINGS` | `D.STRINGS` |
| `SONGS` | `D.SONGS` |
| `LC[level]` | `D.LC[level]` |
| `LN[level]` | `D.LN[level]` |
| `chordSVG(chord, ...)` | `UI.chord(chord, ...)` |

Each page renderer starts with:
```javascript
var D = SparkInstruments.getActive().getData();
var UI = SparkInstruments.getActive().ui;
```

Piano-only pages (stem player, onboarding, keyboard settings) remain in piano's `pages` registry. The shared `render()` already checks `SparkInstruments.getPage(S.screen)` first, so instrument-specific pages override shared ones automatically.

Piano variants of shared pages (practice tab, session, songs) go away — the shared versions handle both instruments via `getData()` and `ui`.

## 5. Shim Removal

### Files deleted entirely

| File | Reason |
|------|--------|
| `js/instruments/piano/pages.js` | Context swap (`_enterPianoCtx`, `_exitPianoCtx`, `_pianoPage`, `_PianoPageNS`) — no longer needed |
| `js/instruments/piano/helpers.js` | Functions move into piano's `ui` bag or `getData()` utilities |
| `js/instruments/piano/state.js` | Persistence fields merge into shared `state.js` PERSIST_FIELDS; init logic already in `register.js` `init()` |

### Files heavily rewritten

| File | Change |
|------|--------|
| `js/instruments/piano/app.js` | 1762 → piano's `act()` handler only. No standalone `pianoAct` global. |
| `js/instruments/piano/ui.js` | Becomes source for piano's `ui` bag functions. Exported on registration, not as window globals. |
| `js/instruments/piano/register.js` | Gains `act` handler, `ui` bag, expanded `getData()` with normalized shape. |
| `js/instruments/piano/data.js` | Stays as-is (raw data). `getData()` wraps it. |

### Removed from shared `app.js`

- Lines 321-328: `if (activeInstrument === "pianospark")` context-swap delegation
- All inline guitar actions (move to `js/instruments/guitar/app.js`)

### New file

- `js/instruments/guitar/app.js` — guitar's `act()` handler with actions extracted from shared `app.js`

## 6. Execution Order

1. Flesh out `getData()` on both instrument registrations (common shape)
2. Add `ui` bags to both registrations
3. Add `act()` handler to both registrations
4. Rewrite shared `act()` as thin router → instrument handler → shared fallback
5. Rewrite shared pages to use `D = getData()` and `UI = getActive().ui`
6. Move guitar's inline actions from shared `app.js` into `instruments/guitar/app.js`
7. Move piano's persistence fields into shared `state.js`
8. Delete `piano/pages.js`, `piano/helpers.js`, `piano/state.js`
9. Verify both instruments work end-to-end

## 7. Success Criteria

- Both instruments launch from SparkSuite launcher and function correctly
- No `_enterPianoCtx`, `_exitPianoCtx`, `_pianoPage`, `_PianoPageNS`, or `window._pctx` anywhere
- No `if (activeInstrument === "pianospark")` in shared `act()`
- No bare `CHORDS[S.level]`, `ALL_CHORDS`, `GUITAR_SESSIONS` in shared pages
- Single `act()` entry point with instrument handler delegation
- Adding a third instrument requires only: registration with `getData()`, `ui`, `act()`, and `pages`
