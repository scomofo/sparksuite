# CLAUDE.md — SparkSuite

Multi-instrument music learning suite. Guitar, piano, bass, ukulele, drums (stub). Vanilla JS, no bundler — 100+ `<script>` tags loaded in dependency order via `index.html`.

## Commands

| Command | Purpose |
|---------|---------|
| `npm start` | Launch Electron desktop app |
| `npm test` | Run 12 Node.js test files (custom assert harness, no framework) |
| `npm run build` | Electron NSIS installer (Windows) |
| `npm run build:mac` | Electron macOS zip |
| `npm run build:portable` | Electron portable exe |
| `npm run tauri:dev` | Tauri dev mode |
| `npm run tauri:build` | Tauri production build |
| `npm run build:mobile` | Copy assets to `www/` for Capacitor |
| `npm run cap:sync` | Capacitor sync |
| `npm run cap:android` | Open Android Studio |
| `npm run cap:ios` | Open Xcode |

Browser-based smoke tests: `tests/smoke_test.html`, `tests/ukulele_chord_gallery.html`, `tests/ukulele_unit_tests.html`

## Architecture

Four-layer stack (loaded bottom-up):

```
js/core/              Contracts + pure utilities (no DOM)
js/spark-core/        SparkCore v0.3 engines (profile, storage, progress, psychology, sessions)
js/sparksuite/        SparkCore OOP engine (window.sparkCore), domain types, bridges, per-instrument modules
js/instruments/       Instrument plugins (guitar, piano, bass, ukulele, drums)
js/pages/             Shared page renderers (guided, practice, session, games, songs, tools, etc.)
js/app.js             Action dispatcher (window.act) + render() + bootstrap
```

### Instrument IDs (historical, don't match display names)

| Display | ID | Files |
|---------|-----|-------|
| Guitar | `chordspark` | app.js, pages.js, capo.js, register.js |
| Piano | `pianospark` | app.js, audio.js, data.js, ui.js, register.js, pages/ (12 files) |
| Bass | `bassspark` | app.js, data.js, ui.js, register.js |
| Ukulele | `ukulespark` | chord_normalizer.js, validator.js, ukulele_svg.js, register.js |
| Drums | `drumsspark` | register.js only (stub) |

### Key Files

- `index.html` — script load order IS the dependency graph
- `js/app.js` — `window.act(a, v)` dispatcher + `render()` + bootstrap
- `js/state.js` — `S` global state object, `PERSIST_FIELDS`, `saveState()`/`loadState()`
- `js/launcher.js` — `SparkInstruments` registry (register, activate, deactivate, getActive)
- `js/data.js` — `SCR`/`TAB` constants, `PIANO_CHORDS`, `ChordEngine`
- `js/sparksuite/core/spark_core.js` — `SparkCore` class (instantiated as `window.sparkCore`)
- `js/spark-highway.js` — bundled PixiJS v8 highway renderer (~50k lines minified)
- `data/performance_charts/` — 55 JSON chart files for rhythm highway

## Key Patterns

### Action Dispatch

```js
window.act = function(a, v) {
  // 1. Delegate to active instrument's handler first
  var _inst = SparkInstruments.getActive();
  if (_inst && _inst.act && _inst.act(a, v)) return;  // returns true = handled
  // 2. Fall through to shared handlers
  if (a === "start_guided_session") { ... }
  // etc.
};
```

Multi-value params use `|` as separator: `act("planStartPerformanceSong", songId + "|" + type + "|" + diff)`

### State Management

- **`S`** — single global mutable object. Every `render()` reads it, every action mutates it.
- **`PERSIST_FIELDS`** — 80+ field names saved to `localStorage` key `chordspark_state`. `saveState()` is debounced 300ms; `saveState(true)` flushes immediately. Caps history at 500 entries.
- **`spark_suite_profile`** — separate `localStorage` key for cross-instrument SparkStorage profile.
- **`sparkCore.persistedState`** — Proxy that writes through to `S[key]` on set.
- **`sc.p(key)`** reads `persistedState`, falls back to `S[key]`. **`sc.r(key)`** reads `runtimeState`, falls back to `S[key]`.

### Instrument Plugin System

Each instrument calls `SparkInstruments.register(config)` from its `register.js`. Config includes: `id`, `instrument`, `name`, `icon`, `skin`, `capabilities`, `getData()`, `act()`, `ui`, `pages`, `tabs`, `init()`, and InstrumentModule methods (`getSkillTree`, `getCurriculumMap`, `getExercises`, `getSongs`, etc.).

`SparkInstruments.activate(id)` sets the active instrument and calls `init()`. `getPage(screenId)` returns the page renderer from the active instrument's `pages` map.

### Guided Session Flow

1. `act("start_guided_session", num)` — tries `sparkCore.startSession()` first
2. Fallback: reads `inst.getData().SESSIONS[n-1]`, wraps lightweight sessions into 5-phase format (`spark`, `review`, `newMove`, `songSlice`, `victoryLap`)
3. Sets `S.screen = SCR.GUIDED` then `render()` calls `guidedSessionPage()`
4. NewMove sub-phases: `watch` then `shadow` then `try` then `refine`

## Build Targets

- **Electron**: `main.js` (contextIsolation=true, nodeIntegration=false, 500x850). `preload.js` exposes `window.electron.stems.*` and `window.electron.sparkgame.*` IPC channels.
- **Tauri 2**: `src-tauri/tauri.conf.json` (productName still "ChordSpark")
- **Capacitor**: `capacitor.config.ts` (appId `com.chordspark.app`, webDir `www`)

## Testing

Node.js tests in `tests/` use `eval(loadJS(...))` to load source files and strip DOM references with regex. No test framework — custom `test(name, fn)` + `assert`. Run `npm test` for all 12.

## Gotchas

1. **No bundler** — all code is browser globals. Adding a new file means inserting a `<script>` tag in the right position in `index.html`. Load order = dependency order.

2. **`var sc = window.sparkCore` at file top** — declared in page files loaded before `spark_core.js` instantiates it. Safe inside functions (called at runtime), but `sc` is `undefined` at module eval time.

3. **Double storage** — `chordspark_state` (main `S` snapshot) and `spark_suite_profile` (cross-instrument profile) are independent localStorage keys.

4. **`T` is dead** — `var T = {}` in state.js is a placeholder. All timer handles live in `sparkCore.timerManager._handles`. Code writing to `T.session` etc. has no effect.

5. **Piano pages load after `app.js`** — `js/instruments/piano/pages/*.js` are loaded after `js/app.js` via `<script>` tags at the bottom of `index.html`. Piano page functions don't exist when `app.js` evaluates. They're registered to the instrument via an inline `<script>` block before the final `render()` call.

6. **SparkHighway is PixiJS** — `js/spark-highway.js` is a self-contained PixiJS v8 bundle. Only has `GUITAR_SKIN` and `PIANO_SKIN` — no bass/ukulele skins.

7. **SparkGame is a separate Python process** — launched via IPC: `python -m spark_game`, cwd `../../sparkgame`. Requires Python on the system.

8. **Tauri/Capacitor configs use old name "ChordSpark"** — not yet updated to SparkSuite.

## Style

- **Fonts**: Syne (display), Outfit (body), Plus Jakarta Sans, Space Grotesk, JetBrains Mono
- **Theme**: Warm Ember dark default (`--bg: #12100e`, `--accent: #ff7b3a`), light mode via `body.light`
- **CSS variables**: defined in `:root` in `styles.css`, instrument skins override via `body[data-skin]`
