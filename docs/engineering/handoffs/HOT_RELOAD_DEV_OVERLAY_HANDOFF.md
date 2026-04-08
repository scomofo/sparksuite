# Hot Reload + Dev Overlay Handoff

## Goal
Make SparkSuite instrument preview feel closer to a lightweight dev server without changing core runtime architecture.

Target workflow:

```text
generate → validate → apply → launch once → auto-refresh on change → inspect runtime via overlay
```

## Current State
Already present:
- instrument generator pipeline
- validator + fix suggestions
- apply script with manifest update
- preview launcher that auto-selects instrument
- initial watch script
- initial dev overlay

Gaps still to close:
- reliable browser-side reload polling
- richer runtime overlay
- one clear watch-and-preview entry point

## Required Deliverables

### 1. Browser reload client
Add a lightweight client that polls a reload signal file and refreshes the page when it changes.

Recommended file:
- `js/dev/dev_reload_client.js`

Expected behavior:
- active only in preview/dev mode
- polls `.preview_reload` with cache-busting query param
- stores last-seen token
- calls `location.reload()` when token changes

### 2. Enhanced dev overlay
Add a richer overlay that shows runtime/debug context.

Recommended file:
- `js/dev/dev_overlay_final.js`

Overlay should show at minimum:
- active instrument id
- active screen
- active tab
- manifest entry count
- current instrument manifest presence
- lessons/skills/exercises counts when available
- reload token
- last apply report presence if available

### 3. Dedicated dev preview entry point
Provide a preview page that:
- auto-selects the instrument
- enables dev mode
- loads overlay and reload client
- redirects to the main app cleanly

Recommended file:
- `preview_instrument_dev.html`

### 4. Final watch command
Provide one watch script that:
- runs the final pipeline with `--apply`
- launches preview once
- writes `.preview_reload` on successful regeneration
- does not relaunch browser every cycle

Recommended file:
- `scripts/generate_watch_preview_final.js`

## Constraints
Do not:
- build a full bundler/HMR system
- mutate core architecture just for dev tooling
- rely on browser filesystem scanning

Do:
- keep dev mode opt-in
- keep reload signal file-based
- keep overlay read-only
- reuse current state system

## Definition of Done
Complete when:
- preview can be launched once in dev mode
- file changes rerun generation/apply successfully
- browser auto-refreshes after successful regenerate/apply
- instrument remains auto-selected after reload
- overlay gives enough information to debug wiring quickly
