# Error Overlay + Validation UI Handoff

## Goal
Surface pipeline validation status directly in the browser preview experience so instrument errors do not require checking terminal output.

Target workflow:

```text
watch → regenerate/apply → validation result file updates → browser shell shows pass/fail + output → iframe refreshes only on success
```

## Current Status Review
The current branch already has broad pipeline coverage in PR #5, which is now at 29 commits and 29 changed files, so the branch is substantial rather than documentation-only. Current additions include generator, validator, apply scripts, discovery files, preview pages, and dev tooling fileciteturn131file0.

Two important gaps remain in the current dev loop:
- `generate_watch_preview_final.js` still contains a browser-only `localStorage` reference inside a Node script, which is not a valid Node runtime primitive fileciteturn133file0
- `preview_instrument_dev.html` loads overlay/reload scripts and then immediately redirects to `index.html?dev=1`, so those preview-page scripts do not persist as the actual runtime surface after redirect fileciteturn134file0

Because of that, the correct next move is a shell-based preview surface rather than more redirect-based injection.

## Required Deliverables

### 1. Shell-based dev preview page
Create a page that remains loaded and embeds the real app in an iframe.

Recommended file:
- `preview_instrument_dev_shell.html`

Responsibilities:
- set `activeInstrument` in persisted state before load
- render an iframe pointing to `index.html`
- poll reload signal and refresh iframe on successful build
- render validation + runtime overlay outside the iframe

### 2. Validation status file
Create a watch script that writes a machine-readable validation status file.

Recommended file:
- `.preview_validation.json`

Shape example:
```json
{
  "ok": false,
  "updatedAt": 1712550000000,
  "summary": "Validation failed",
  "output": "...full validator/generator output..."
}
```

### 3. Final watch script with validation surface support
Create a watch script that:
- runs the final pipeline
- captures stdout/stderr
- writes `.preview_validation.json`
- writes `.preview_reload` only on success
- does not try to use `localStorage` from Node

Recommended file:
- `scripts/generate_watch_preview_ui.js`

### 4. Browser-side error overlay
Create a browser script that reads `.preview_validation.json` and renders:
- pass/fail status
- timestamp
- last successful reload token
- validation output excerpt

Recommended file:
- `js/dev/dev_error_overlay.js`

## Constraints
Do not:
- patch core runtime only for dev tooling
- rely on redirect-time script injection for persistent overlay behavior
- reload the real app iframe when validation fails

Do:
- keep shell page as the persistent dev surface
- keep app runtime inside iframe
- keep validation overlay read-only
- refresh iframe only after successful rebuild

## Definition of Done
Complete when:
- one watch command updates preview continuously
- browser shell remains open
- validation failures appear in-browser
- successful rebuilds refresh the app iframe automatically
- selected instrument remains active across refreshes
