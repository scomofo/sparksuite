# SparkSuite Normalized Execution Contract

## Core Rule

All normalized runtime launches should follow this path:

`session -> segments -> exerciseIds -> exercises -> SparkExecutionGateway -> gameplay launcher`

Segments may describe ordering and duration, but they should not be treated as the source of gameplay payload truth.

## Approved Launcher Surface

Normalized code should prefer:

- `SparkExecutionGateway.runSessionSegment(...)`
- `SparkExecutionGateway.runDirectExercise(...)`
- `SparkExecutionGateway.runPlayablePayload(...)`
- `SparkExecutionGateway.runRhythmHighwaySegment(...)`

Direct launcher calls are only expected in the approved shell or launcher files that bridge into existing runtime code.

## Play-Along Contract

Play-along sessions should keep these contracts stable:

- `SparkCore.startPlayAlongSession(...)` owns chart creation and active session metadata.
- `SparkCore.processPlayAlongFrame()` returns `timeMs`, `inputTimeMs`, `visibleNotes`, and prediction data.
- `SparkCore.completePlayAlongSession()` returns normalized summary fields:
  - `accuracy`
  - `timing`
  - `consistency`
  - `performance`
  - `feedback`
  - `drills`
- Play-along loop and drill UX state lives in UI state:
  - `S.playAlongLoop`
  - `S.playAlongLoopRange`
  - `S.playAlongLoopTarget`
  - `S.playAlongLoopIteration`
  - `S.playAlongLoopProgress`
  - `S.playAlongSelectedDrill`
  - `S.playAlongCoachHint`
  - `S.playAlongRecent`
  - `S.playAlongCurrentSection`
  - `S.playAlongNowMs`

Recent play-along launches should preserve normalized session params so the UI can replay them through the same `SparkCore.startPlayAlongSession(...)` contract instead of inventing a separate launcher path.

## Play-Along Result And Loop Conventions

- Result screens may enrich `completePlayAlongSession()` output with a UI-owned `drillSummary` object.
- `drillSummary` should include:
  - `label`
  - `completedReps`
  - `targetReps`
  - `metTarget`
  - `loopWindowLabel`
- Loop-target UI should surface whether the session is targeting a `drill` or a `section`.
- Session UI should surface the current playback position and section label from controller telemetry instead of recomputing transport state in multiple places.
- Coach hints may escalate across loop reps, but they should stay advisory and should not bypass the normalized launch path.
- Home/dashboard resume surfaces should use `S.playAlongRecent[0]` as the latest normalized replay source when available.
- If section-based loops are supported, the selected section should be tracked in `S.playAlongSectionIndex` and reused by both section navigation and section loop targeting.
- Recent-history controls may remove or clear replay entries, but they should only mutate normalized `S.playAlongRecent` items that preserve replayable session params.
- Section bookmarks should be stored in `S.playAlongBookmarks` with replayable normalized params plus:
  - `sectionIndex`
  - `sectionLabel`
  - `startMs`
  - `endMs`
- Weak-section resume flows should derive from normalized outcome data like `outcome.sectionSummary`, not by scraping DOM or ad hoc launcher state.

## Recommendation Integration

- Play-along recovery suggestions should enter the existing recommendation pipeline as normalized candidates rather than bypassing recommendations with a custom UI-only list.
- Recommended play-along recovery items may use:
  - source `play_along` for weak-section recovery
  - source `play_along_bookmark` for saved-section replay
- These recommendation candidates should launch back through normalized play-along helpers that resolve replayable params from:
  - active session params
  - recent play-along history
  - saved bookmarks

## Chart Hygiene Rules

- Lane-less notes should stay `null`, not collapse to lane `0`.
- Section data should be normalized to `startMs` / `endMs`.
- Timeline note objects should expose `timeMs` in addition to `time`.
- Audio metadata should preserve offsets as `offset_ms` and `offsetMs` when available.

## Observability

`SparkExecutionGateway` publishes the latest normalized launch trace to:

- `window.__sparkExecutionTrace`
- `sparkCore.runtimeState.lastExecutionTrace`

This trace is intended for debugging gateway source paths and runtime drift.

Home and insights surfaces may display the latest execution trace and transport mode, but they should treat these as read-only observability fields rather than control inputs.

## Demo Content

The current play-along featured-song manifest is intentionally lightweight. It exists to provide:

- stable `trackId`
- display title and artist
- known `audioOffsetMs`
- a predictable launch path for end-to-end testing

If local audio assets are added later, they should align with the same manifest IDs so the UI and runtime contract does not change.

Featured demos and recent launches should share the same normalized parameter shape so metadata hydration stays consistent across demo, Spotify, and replay flows.
