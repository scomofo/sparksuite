# SparkSuite Unified App Design

## Goal

Combine ChordSpark (guitar) and PianoSpark (piano) into a single SparkSuite app with one repo, one download, and a shared launcher shell. The architecture supports adding future instrument modules (drums, ukulele, bass) without changes to shared code.

## Decisions

- **UX model:** Launcher shell with instrument cards. Selecting an instrument enters its full experience. Back button returns to launcher.
- **Platform:** Electron for downloadable desktop app + browser fallback (open index.html directly).
- **Repo strategy:** Fork from ChordSpark. It already has spark-core, performance-core, spark-highway, the full editor system, and all shared infrastructure. PianoSpark's unique code gets added as a piano instrument module. Old repos become archived.
- **Launcher:** Minimal — instrument cards with per-instrument stats, combined suite XP/streak/level at top. No complex dashboard; individual instruments already have rich dashboards.

## Repo Structure

```
sparksuite/
  index.html                  - unified entry point
  styles.css                  - shared base styles
  spark-visual.css            - shared visual polish
  main.js                     - Electron main process
  package.json                - SparkSuite identity

  js/
    spark-highway.js           - shared Canvas 2D renderer (guitar + piano skins)
    launcher.js                - launcher screen + SparkInstruments registry
    app.js                     - action dispatcher (wraps instrument-specific acts)
    state.js                   - unified state (shared + per-instrument namespaces)
    ui.js                      - shared UI helpers
    data.js                    - shared data loader (delegates to instrument data)
    audio.js                   - shared audio engine

    core/                      - core utilities (contracts, persistence, utils)
    spark-core/                - suite profile, progress, events, achievements
    performance-core/          - chart contract, transport, highway adapter

    instruments/
      guitar/
        data.js                - GUITAR_CHORDS, GUITAR_SESSIONS, GUITAR_SONGS
        pages/                 - guitar-specific page renderers
        audio/                 - guitar samples
        register.js            - registers guitar with SparkInstruments
      piano/
        data.js                - piano songs, voicings, exercises
        pages/                 - piano-specific page renderers
        audio/                 - piano samples
        register.js            - registers piano with SparkInstruments

    performance/               - shared performance systems
    practice/                  - shared practice engine, selectors, adaptive
    analytics/                 - shared analytics engine + dashboard
    progression/               - shared progression, mastery, unlocks
    meta/                      - shared XP, levels, achievements, challenges
    editor/                    - shared chart/exercise editor
    midi/                      - shared MIDI device mapping
    import/                    - shared MIDI import pipeline
    cloud/                     - shared cloud sync
    content/                   - shared content registry/loader
    curriculum/                - shared curriculum system
    recommend/                 - shared recommendation engine
    career/                    - shared career mode
    insights/                  - shared advanced insights
    home/                      - shared home dashboard engine
    settings/                  - shared settings
    onboarding/                - shared onboarding flow
    desktop/                   - shared desktop bridge
    release/                   - shared release info
    audio/                     - shared audio timing, metronome, calibration

  content/                     - content schemas + per-instrument content packs
  data/                        - performance charts
  sounds/                      - audio assets
  tests/
  docs/
```

## Instrument Registration Contract

Each instrument module registers itself via `SparkInstruments.register()`:

```js
SparkInstruments.register({
  id: "chordspark",          // matches spark-core appId
  instrument: "guitar",
  name: "Guitar",
  icon: "\uD83C\uDFB8",
  skin: SparkHighway.GUITAR_SKIN,
  available: true,           // false = "Coming Soon" card

  getData: function() {
    return { chords: GUITAR_CHORDS, sessions: GUITAR_SESSIONS, songs: GUITAR_SONGS };
  },

  pages: {
    home: renderGuitarHome,
    practice: renderGuitarPractice,
    session: renderGuitarSession,
    songs: renderGuitarSongs,
    games: renderGuitarGames,
    tools: renderGuitarTools,
    guided: renderGuitarGuided,
    dual: renderGuitarDual
  },

  tabs: ["practice", "songs", "games", "tools"],

  stemMutePreset: {
    guitar: false, vocals: true, drums: true,
    bass: true, piano: true, other: true
  },

  init: function() { /* load guitar audio samples, etc */ }
});
```

Piano registers identically with piano-specific values:

```js
SparkInstruments.register({
  id: "pianospark",
  instrument: "piano",
  name: "Piano",
  icon: "\uD83C\uDFB9",
  skin: SparkHighway.PIANO_SKIN,
  available: true,
  getData: function() { return { songs: PIANO_SONGS, voicings: PIANO_VOICINGS }; },
  pages: { /* piano-specific renderers */ },
  tabs: ["practice", "songs", "games", "tools"],
  stemMutePreset: { piano: false, vocals: true, drums: true, bass: true, guitar: true, other: true },
  init: function() { /* load piano audio */ }
});
```

### SparkInstruments API

```js
SparkInstruments.register(config)        // register an instrument module
SparkInstruments.activate(appId)         // enter an instrument
SparkInstruments.deactivate()            // return to launcher
SparkInstruments.getActive()             // returns active config or null
SparkInstruments.getAll()                // returns all registered instruments
SparkInstruments.getPage(screenId)       // returns active instrument's page renderer
```

## Routing

1. App starts. `S.activeInstrument` is loaded from persisted state.
2. If `S.activeInstrument` is null, render the launcher.
3. If `S.activeInstrument` is set, call `SparkInstruments.activate(S.activeInstrument)` and render the instrument's home screen.
4. Within an instrument, all existing screen/tab routing works unchanged.
5. Header shows a back/home button that calls `SparkInstruments.deactivate()`, sets `S.activeInstrument = null`, and renders the launcher.
6. Shared systems (performance, editor, analytics) read `SparkInstruments.getActive()` to determine which skin, data, and stem preset to use.

## State & Persistence

The current `S` global stays as a flat object. New fields added:

```js
S.activeInstrument = null;   // null = launcher, "chordspark" or "pianospark"
S.suiteProfile = null;       // loaded from SparkStorage on init
```

Instrument-specific state fields (e.g. `S.selectedChord`, `S.dualChord` for guitar; `S.performArrangementType = "left_hand_patterns"` for piano) remain as flat fields on `S`. They are only read/written when that instrument is active. This avoids refactoring every page renderer.

`saveState()` and `loadState()` continue working. The localStorage key stays the same for backwards compatibility with existing ChordSpark users. `S.activeInstrument` is added to `PERSIST_FIELDS`.

## Launcher Screen

Renders when `S.activeInstrument === null`. Shows:

- **Header:** SparkSuite branding, combined level/XP/streak from `suiteProfile`
- **Instrument cards:** One per registered instrument with `available: true`. Each card shows the instrument icon, name, and per-app stats (level, XP) from `suiteProfile.apps[appId]`.
- **Coming Soon cards:** Instruments registered with `available: false` show as greyed-out cards.
- **Achievements summary:** Badge count linking to cross-instrument achievements view.

Layout: responsive grid, 2 columns on desktop, 1 on mobile.

## Migration from ChordSpark

### Phase 1: Create SparkSuite repo
- Copy `chordspark/` to `sparksuite/`
- Update `package.json`: name, productName, appId to SparkSuite
- Update `main.js`: window title, CSP if needed
- Update `index.html`: title to SparkSuite

### Phase 2: Add launcher and instrument registry
- Create `js/launcher.js` with `SparkInstruments` registry and launcher page renderer
- Add `S.activeInstrument` to state and `PERSIST_FIELDS`
- Modify `render()` in `js/ui.js` to check `S.activeInstrument` and delegate to launcher or instrument
- Add back button to header when inside an instrument

### Phase 3: Extract guitar module
- Move guitar-specific data from `js/data.js` to `js/instruments/guitar/data.js`
- Move guitar-specific page renderers to `js/instruments/guitar/pages/`
- Create `js/instruments/guitar/register.js`
- Keep shared data loading in `js/data.js` but delegate to instrument data
- Verify ChordSpark functionality still works end-to-end

### Phase 4: Add piano module
- Copy piano-specific code from `pianospark/` into `js/instruments/piano/`
- Adapt PianoSpark's `data.js`, page renderers, and audio loading
- Create `js/instruments/piano/register.js`
- Add piano script tags to `index.html`
- Verify piano instrument works end-to-end

### Phase 5: Polish and test
- Test launcher navigation (enter/exit instruments, persistence)
- Test cross-instrument achievements
- Test Electron build
- Test browser fallback
- Clean up any ChordSpark-specific branding in shared code

## What Moves vs What Stays

### Moves to instruments/guitar/
- `js/data.js` guitar-specific content (GUITAR_CHORDS, GUITAR_SESSIONS, songs array, chord diagrams)
- Guitar-specific page logic in `js/pages/` (guided sessions, dual instrument view, strum patterns)
- Guitar audio samples in `sounds/`

### Moves to instruments/piano/
- PianoSpark's `js/data.js` (piano songs, voicings, exercises)
- PianoSpark's page renderers (`js/pages/`)
- Piano audio samples

### Stays shared (no move needed)
- `js/spark-highway.js` (already has both skins)
- `js/core/`, `js/spark-core/`, `js/performance-core/`
- `js/performance/`, `js/practice/`, `js/analytics/`, `js/progression/`
- `js/meta/`, `js/editor/`, `js/midi/`, `js/import/`
- `js/cloud/`, `js/content/`, `js/curriculum/`, `js/recommend/`
- `js/career/`, `js/insights/`, `js/home/`, `js/settings/`, `js/onboarding/`
- `js/audio/` (timing, metronome, calibration)
- `js/desktop/`, `js/release/`
- `js/app.js`, `js/state.js`, `js/ui.js` (modified but not moved)

## Acceptance Criteria

- Single repo at `Dev/sparksuite/`
- `npm start` launches Electron with SparkSuite launcher
- Opening `index.html` in browser shows SparkSuite launcher
- Tapping Guitar card enters full ChordSpark experience
- Tapping Piano card enters full PianoSpark experience
- Back button returns to launcher
- Suite profile shows combined stats across instruments
- Cross-instrument achievements work (e.g. "dual_instrument_starter")
- Existing ChordSpark localStorage data migrates seamlessly
- Adding a new instrument requires only files in `js/instruments/newone/` and script tags

## Non-Goals

- Monorepo tooling (nx, turborepo, lerna)
- Backend/cloud sync changes
- Visual redesign of instrument experiences
- New instruments beyond guitar and piano in this pass
- Module bundler (webpack, vite) — stays vanilla JS with script tags
- Mobile builds (Tauri/Capacitor) — future work
