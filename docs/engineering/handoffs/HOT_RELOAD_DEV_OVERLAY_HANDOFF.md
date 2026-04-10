# Hot Reload + Dev Mode Overlay Handoff

## Goal

Add developer-experience tooling so newly generated instruments can be
previewed, iterated, and debugged without manual refresh or console inspection.

Target loop:

    generate -> validate -> apply -> discover -> launch -> auto-select -> hot reload -> debug overlay

## Files

| File | Purpose |
|------|---------|
| scripts/generate_watch_preview.js | Watches instrument files, re-applies on change, signals reload |
| js/dev/dev_overlay.js | In-app debug panel showing instrument/screen/manifest state |
| js/dev/dev_reload_client.js | Polls for reload signal file and refreshes browser |
| _dev_reload_signal.txt | Timestamp file written by watch script, read by reload client |

## Quick Start

    # Terminal 1: start app
    npm start

    # Terminal 2: start watch loop
    node scripts/generate_watch_preview.js --instrument mandolin --template stringed

    # In browser: add ?dev=1 to URL to enable overlay + auto-reload

## How It Works

### Watch Script

1. If instrument does not exist, generates scaffold via pipeline
2. Runs apply_generated_instrument_final.js (manifest + index.html + tests)
3. Writes timestamp to _dev_reload_signal.txt
4. Watches js/instruments/<name>/ and js/sparksuite/instruments/<name>/
5. On file change (debounced 800ms), re-runs apply and writes signal

### Reload Client

1. Only activates with ?dev=1 or localStorage spark_dev_overlay=true
2. Polls _dev_reload_signal.txt every 1.5 seconds
3. Compares timestamp to last known value
4. On mismatch, triggers window.location.reload()

### Dev Overlay

Fixed-position panel (bottom-right) showing:
- Active instrument (name + id)
- Current screen and tab
- Manifest instrument count
- Loaded instrument/sparksuite script count
- Registered instruments list
- Last reload timestamp

Updates every 2 seconds. Read-only; does not own app logic.

## Activation

Overlay and reload are opt-in only:

| Trigger | Scope |
|---------|-------|
| ?dev=1 query param | Current page load |
| localStorage spark_dev_overlay=true | Persistent across reloads |

No dev code runs in production unless explicitly enabled.

## Integration

Add to index.html (after all instrument scripts, before app.js):

    <script src="js/dev/dev_overlay.js"></script>
    <script src="js/dev/dev_reload_client.js"></script>

These scripts self-gate on the activation check and are safe to include in all builds.

## Gitignore

Add to .gitignore:

    _dev_reload_signal.txt

## Non-Goals

- No bundler or HMR system
- No WebSocket server
- No mutation of core runtime architecture
- No always-on overlay in production

## Definition of Done

- Dev runs one watch command
- Preview auto-refreshes after successful regenerate/apply
- Instrument remains auto-selected across reloads
- Overlay appears only in dev preview mode
- Overlay gives enough runtime visibility to debug instrument wiring

## Related Docs

- docs/engineering/handoffs/INSTRUMENT_GENERATOR_PIPELINE_HANDOFF.md
- docs/engineering/handoffs/AUTO_INTEGRATION_HANDOFF.md
- docs/engineering/handoffs/MANIFEST_AUTO_UPDATE_HANDOFF.md
