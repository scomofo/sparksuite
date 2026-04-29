# SparkSuite Desktop Release Checklist

## Build
- [ ] App builds cleanly.
- [ ] `npm run verify` passes.
- [ ] `npm run smoke:desktop -- --skip-verify` passes for the packaged Electron build.
- [ ] Desktop/Tauri build completes.
- [ ] App launches from packaged build, not just dev server.

## Storage and Saves
- [ ] New profile can be created.
- [ ] Existing profile loads.
- [ ] Save schema migration runs.
- [ ] Progress saves after session completion.
- [ ] Failed save shows recovery state.
- [ ] User data export works.
- [ ] User data import works on a clean profile.

## Audio and Input
- [ ] Audio context starts after user gesture.
- [ ] App works if audio fails.
- [ ] Keyboard input works.
- [ ] Mouse input works where expected.
- [ ] MIDI/input permissions work if supported.
- [ ] Input calibration persists.

## Gameplay
- [ ] One guitar session starts and completes.
- [ ] One piano session starts and completes, if piano is enabled.
- [ ] One bass session starts and completes, if bass is enabled.
- [ ] One ukulele session starts and completes, if ukulele is enabled.
- [ ] Restart session works.
- [ ] Fail/retry flow works.
- [ ] Timing config is applied.

## Window and Platform
- [ ] Window resizing does not break runtime rendering.
- [ ] High-DPI scaling works.
- [ ] Keyboard shortcuts do not conflict with OS shortcuts.
- [ ] App works offline.
- [ ] App restarts and reloads saved profile.

## Debug and Recovery
- [ ] Debug overlay can be enabled in dev builds.
- [ ] Debug bundle export works.
- [ ] Recent events are included in debug bundle.
- [ ] Missing handler report is included in debug bundle.
- [ ] Structured errors render recovery actions.

## Scope Guard
- [ ] No social features added.
- [ ] No leaderboard features added.
- [ ] No store or marketplace features added.
