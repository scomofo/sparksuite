# SparkSuite Release Runbook

## Goal
Ship a packaged local-first SparkSuite build without regressing session correctness, saves, recovery, or offline use.

## Before Building
1. Run `npm run verify`.
2. Review [desktop_release_checklist.md](C:\Users\Scott Morley\Dev\sparksuite\docs\release\desktop_release_checklist.md).
3. Confirm the working tree is clean.
4. Confirm no social, leaderboard, store, or marketplace scope was added.

## Build Packaged App
1. For Electron builds, run the appropriate build command from `package.json`.
2. For Tauri builds, run `npm run tauri:build` to build packaged app artifacts.
3. Launch the packaged app, not only the dev server build.

## Manual Release Checks
1. Create a fresh profile and start a baseline guitar session.
2. Complete a session and verify progress saves.
3. Restart the packaged app and confirm the saved profile reloads.
4. If enabled, smoke-test piano, bass, and ukulele session start and completion.
5. Confirm the app still works offline.
6. Resize the window and confirm runtime rendering still behaves correctly.

## Recovery and Support
1. Enable the debug overlay in a dev build if needed.
2. Export a debug bundle from a recovery state and confirm it includes:
   - app version
   - schema version
   - current session summary
   - recent event stream
   - missing handler report
   - recent errors
   - performance budget warnings
3. Export user data from a known-good profile.
4. Import that user data into a clean profile and verify migration-safe restore.

## Sign-off
Do not mark a release ready until the checklist is complete and the packaged app has passed the manual flow above.
