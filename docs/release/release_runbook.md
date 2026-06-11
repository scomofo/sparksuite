# SparkSuite Release Runbook

## Goal
Ship a packaged local-first SparkSuite build without regressing session correctness, saves, recovery, or offline use.

## Before Building
1. Run `npm run verify`.
2. Review [desktop_release_checklist.md](desktop_release_checklist.md).
3. Confirm the working tree is clean.
4. Confirm no social, leaderboard, store, or marketplace scope was added.

## Build Packaged App
1. Run `npm run build` to build the packaged Windows installer (`npm run build:mac` and `npm run build:portable` cover the other Electron targets).
2. Launch the packaged app, not only the dev server build.
3. Run `npm run smoke:desktop` for the packaged Electron flow. This verifies a packaged build can import migrated user data, complete a real session, export canonical user data, and build a debug bundle before exiting.

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
