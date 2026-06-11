# 🎸 SparkSuite

An engine-driven music learning platform.
Guitar, bass, piano, ukulele — one core, every instrument.
Desktop • Mobile • Web — one codebase, every platform.

---

## ✨ What it is

SparkSuite is a modular practice platform built **engine-first, not UI-first**. A shared core handles lesson flow, exercise generation, adaptive difficulty, progression, and rewards. Instrument modules plug into that core — guitar (ChordSpark), bass (BassSpark), piano (PianoSpark), and ukulele — each contributing its own curriculum, audio, and visuals while reusing the same session lifecycle.

## 🧠 Architecture

```
SparkCore
  ├── SessionEngine       session lifecycle & results processing
  ├── CurriculumEngine    lessons, progression paths
  ├── PsychologyEngine    adaptive difficulty & reward scheduling
  ├── PracticeEngine      exercise generation
  ├── ProgressEngine      XP, mastery, badges, streaks
  ├── InstrumentManager   pluggable instrument modules
  ├── Storage             persistence
  └── AIEngine            recommendations
        ↓
Instrument Modules  (guitar, bass, piano, ukulele)
        ↓
SessionPlan
        ↓
UI Rendering Layer  (PixiJS highway, React components)
```

The UI is a **dumb renderer of session state** — all logic lives in the engines. See `CLAUDE.md` for the full architectural contract and `docs/engineering/migration-checklist.md` for migration status.

Core architecture references:

- [Architecture Map](./docs/engineering/architecture-map.md)
- [ADR index](./docs/adr/README.md)
- [Session Contracts](./docs/engineering/session-contracts.md)
- [Instrument Module Contract](./docs/engineering/instrument-module-contract.md)

## 🎵 Features

**Learn**
- Chord & note libraries with diagrams and real-instrument audio
- Guided lessons, beginner to advanced
- Song library with real chord progressions and playable charts

**Practice**
- Drill mode — rapid-fire recognition
- Timed sessions with streak tracking
- Dual mode — side-by-side comparison
- NoteHighway — PixiJS-rendered scrolling note chart with ms-level timing accuracy

**Play**
- Mic-based pitch & chord detection (autocorrelation / YIN-style)
- Chord games and ear training
- Unified progression: XP, badges, unlocks, streaks

**Audio**
- Real instrument samples (WAV)
- Web Audio API — low-latency playback
- Freesound integration for extended sample library

## 🚀 Quick start

```bash
npm install
npm start              # 🖥️  Electron desktop
```

Or just open `index.html` in any browser.

## 🌐 Platforms

| Platform                    | Command              | Engine        |
| --------------------------- | -------------------- | ------------- |
| 🖥️  Windows / Mac / Linux   | `npm start`          | Electron      |
| 🌐  Web browser             | open `index.html`    | —             |

Electron is the only packaging target — Tauri and Capacitor were removed
when the project committed to a single Windows desktop install. Releases
are built by CI on `v*` tags (NSIS + `latest.yml` to GitHub Releases) and
the app self-updates with a restart prompt.

> **Code signing is intentionally deferred.** The installer is unsigned, so
> electron-updater's only integrity check is the sha512 in `latest.yml`,
> fetched over HTTPS from the same GitHub Releases channel — the GitHub
> account that publishes releases *is* the trust root, and its security
> (2FA, protected releases) is the compensating control. Revisit signing
> before distributing to anyone else, or if that channel can no longer be
> trusted.

## 📁 Structure

```
sparksuite/
├── js/
│   ├── sparksuite/          Primary engine tree: core/ (session, curriculum,
│   │                        psychology, practice, progress, AI), instruments/,
│   │                        domain/, audio/, music/, input/, bridges/, ui/
│   ├── core/, spark-core/   Earlier core layers, still loaded during migration
│   ├── instruments/         Legacy per-instrument page code (pre-engine)
│   ├── pages/               UI pages (practice, songs, games, tools…)
│   ├── performance/         Session runtime & scoring
│   ├── spark-highway.js     PixiJS note-highway renderer (vendored bundle)
│   └── app.js               Thin bootstrap (logic split into actions/render/timers)
├── engine/                  Standalone TypeScript engine (audio, gameplay, timing)
├── engine/
│   ├── audio/               Mic input, analyser, pitch detection
│   ├── gameplay/            Runtime loop, scoring, event logging
│   ├── runtime/             Session runtime orchestration
│   └── timing/              Timeline → notes, bar/beat conversion
├── guitar_chords/           Real WAV chord samples
├── desktop/                 Electron/desktop config
├── tests/                   ~30 test suites across core, runtime, curriculum
├── index.html               Web entry point
├── main.js                  Electron main process
└── server/server.js         Express dev server
```

## 🧪 Testing

```bash
npm test
```

Test suites cover the core engines, instrument runtime migrations (piano, bass), curriculum guardrails, timing, payload validation, launcher integrity, and the full SparkSuite migration. Browser-based smoke tests live in `tests/smoke_test.html` and `tests/ukulele_chord_gallery.html`.

## 📄 Documentation

- `CLAUDE.md` — architecture rules for AI coding agents (the non-negotiables)
- `docs/engineering/architecture-map.md` — current engine/module map
- `CHANGELOG.md` — release notes
- `docs/archive/REFACTOR_PLAN.md` — engine-first migration plan (archived)
- `docs/archive/IMPROVEMENTS.md` — roadmap and follow-ups (archived)
- `docs/archive/chordspark-addendum.md`, `docs/archive/fingering-mastery-module.md`, `docs/archive/stickiness-layer.md` — design docs (archived)

## 🎹 Companion project

`harmony_knight/` is an experimental Flutter-based companion app exploring a different UI approach to the same curriculum model. It is maintained separately and is **not included on this branch**.

## 📜 License

MIT — see [LICENSE](./LICENSE).

Built by Scott Morley.
