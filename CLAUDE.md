# SparkSuite – Repository Guide for Claude / Codex / AI Coding Agents

## Purpose
SparkSuite is a multi-instrument music learning platform in active migration.

This repo currently contains both:
- legacy runtime systems that still power parts of the app
- newer SparkSuite core systems that are becoming the long-term architecture

Work in this repository must reflect current reality first, and target architecture second.

---

## Core Rule

Prefer:
- engine-owned logic
- instrument-owned behavior
- structured contracts
- existing adapters, bridges, and registries

Avoid:
- UI-driven business logic
- hardcoded lesson flow in pages
- duplicate parallel systems
- docs that describe an idealized repo instead of the real one

---

## Current Repo Structure (Real)

Important directories and systems include:

- `js/spark-core/`
  - legacy/core runtime services
  - includes session, psychology, progress orchestration, storage/profile/content services
  - `instrument-adapter.js` is a key active abstraction

- `js/sparksuite/core/`
  - newer constructor-based SparkSuite core and engine migration layer

- `js/instruments/`
  - active runtime instruments and registration/integration
  - current directories include guitar, piano, bass, drums
  - do not assume every instrument has parity here

- `js/sparksuite/instruments/`
  - newer SparkSuite instrument content/modules
  - separate from the active runtime instrument registration layer

- `js/performance-core/`
  - chart, transport, timing, gameplay, and related performance contracts/core support

- `js/performance/`
  - performance runtime system, pages, adapters, scoring, calibration, recommendations, session flow

- `js/core/`
  - contracts, persistence, analytics, practice, performance-related shared utilities

- `js/midi/`
  - MIDI support

- `js/meta/`
  - gamification and meta progression systems

- `js/progression/`
  - skill trees, mastery, unlocks, progress UI

- `js/audio.js` and `js/audio/`
  - audio system

- `content/`
  - content bundles and schemas

- `data/`
  - structured data, including performance charts

- `desktop/`
  - desktop wrapper/integration assets

- `server/`
  - backend/server code

- `sparkgame/`
  - game module

- `harmony_knight/`
  - Flutter sub-app currently housed inside this repository

- `tests/`
  - regression and migration tests

This is a layered system, not a clean-slate repo.

---

## Architecture Reality

Two architecture styles currently coexist.

### 1. Legacy active runtime
- centered around `window.SparkCore`
- service-style globals and orchestration
- launcher/instrument registry driven
- `instrument-adapter.js` is part of the real runtime boundary

### 2. Newer SparkSuite core direction
- centered around `js/sparksuite/core/spark_core.js`
- constructor-based engine composition
- more explicit engine/module separation

Do not assume the migration is complete.
Do not delete or bypass legacy layers casually.

Reference source of truth:
- `docs/engineering/architecture-map.md`

---

## Engines and Systems Already Present

This repo already contains far more than the five-engine simplified story.

Existing systems include, among others:
- session engine
- curriculum engine
- psychology engine
- practice engine
- progress engine
- analytics engine
- career engine
- challenge engine
- home engine
- onboarding engine
- recommend engine
- editor engine
- performance/timing/scoring/input/replay/calibration systems
- progression and meta systems

Before creating a new service or engine, verify one does not already exist.

---

## Instrument Architecture

Instrument behavior currently spans multiple layers.

### Active runtime instrument layer
Located under `js/instruments/`

This is tied to:
- launcher registration
- UI/runtime integration
- active app behavior

Actual instrument registration follows the `SparkInstruments.register(...)` pattern.

Do not invent a fake interface for these modules.

### SparkSuite instrument content/module layer
Located under `js/sparksuite/instruments/`

This is the newer module/content direction and may include:
- curriculum content
- skills
- lessons
- exercises
- progression data
- instrument-specific engine-facing structures

### Important rule
When fixing or adding an instrument, check all relevant layers:
- runtime registration
- adapter/bridge layer
- SparkSuite module/content layer
- progression/curriculum alignment
- renderer/data compatibility

Do not fix only one layer and assume the instrument is complete.

---

## UI Rule

The desired direction is engine-first, but the current app is not yet purely engine-driven.

So the practical rule is:
- do not add new business/progression/curriculum logic to UI if an engine or service boundary already exists
- keep page/render code thin where possible
- move logic toward engines incrementally when touching related systems

`js/app.js` is a coordinator and final initialization point.
Do not turn it into a dumping ground for new logic.

---

## Gameplay Rule

SparkSuite is building toward a rhythm/gameplay-heavy learning loop.

Gameplay code must stay separated from rendering where possible.

Prefer:
- existing chart contracts
- transport/timing abstractions
- scoring/input abstractions
- engine-generated or adapter-generated gameplay payloads

Avoid:
- hardcoding gameplay generation directly in page renderers
- mixing note generation, UI rendering, and scoring in the same file

---

## Build / Run / Test Commands

Use the real commands from `package.json`.

### Run
- `npm start`
- `npm run tauri:dev`

### Build
- `npm run build`
- `npm run build:mac`
- `npm run build:portable`
- `npm run tauri:build`
- `npm run build:mobile`

### Mobile / Capacitor
- `npm run cap:sync`
- `npm run cap:android`
- `npm run cap:ios`

### Test
- `npm test`

Do not claim a refactor is safe without considering test impact.

---

## Platform Targets Present

This repo targets multiple shells/platforms:
- Electron
- Tauri
- Capacitor/mobile
- browser runtime
- desktop wrapper assets
- Flutter sub-app content in-repo

Do not assume there is only one runtime target.

---

## Testing Expectations

For meaningful changes, verify at least these questions:

1. Does the app still boot?
2. Does the affected instrument/system still register correctly?
3. Does the relevant runtime path still work?
4. Does the change affect existing node tests?
5. Should tests be updated or extended?

For instrument changes, also verify:
- lesson list matches supported skills
- skills match exercise inventory
- charts/chords/note data match renderer expectations
- progress state is consistent across old and new paths

---

## Common Failure Modes

1. Updating curriculum content without updating exercises, charts, or progression rules
2. Fixing only the SparkSuite module layer while the active runtime layer still breaks
3. Patching a UI symptom while leaving the underlying adapter/registry mismatch
4. Using the wrong string order or guitar assumptions for ukulele/bass/piano
5. Creating a parallel abstraction instead of using an existing engine, bridge, or adapter
6. Writing docs for a target architecture as if it already fully exists

---

## Documentation Rule

When writing plans, handoffs, or AI instructions:
- distinguish current reality from target architecture
- use real current paths
- call out migration assumptions explicitly
- do not describe nonexistent directories or interfaces as if they already exist

---

## Change Strategy

When implementing a feature or fix:

1. identify the real active runtime path involved
2. identify any newer SparkSuite engine/module path involved
3. patch the smallest correct boundary
4. preserve compatibility where needed
5. update or add tests when behavior changes
6. document migration debt rather than hiding it

---

## Definition of a Good Change

A good change in SparkSuite:
- uses real repo paths
- respects active adapters, registries, and bridges
- improves architecture instead of bypassing it
- reduces duplication where practical
- keeps UI thinner over time
- does not silently break Electron, Tauri, mobile, or tests

---

## Guidance for AI Coding Agents

Before coding:
- inspect the actual file path in this repo
- verify whether there is both a legacy and newer SparkSuite implementation
- check for an existing bridge, adapter, registry, or engine
- prefer extending an existing system over inventing a parallel one

If uncertain:
- align with the real codebase first
- then move it toward the engine-first target
- avoid broad rewrites unless explicitly requested

---

## Final Principle

Do not pretend the migration is complete.

Your job is to move the real SparkSuite codebase forward without increasing architectural drift.
