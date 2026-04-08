# Dockable + Filterable Overlay Handoff

## Goal
Upgrade the dev overlay from a fixed debug panel into a small dockable console that can be filtered by issue type or keyword while preserving the current shell + iframe debug workflow.

Target workflow:

```text
watch → validation updates → overlay shows filterable issues → dock left/right or collapse → click issue → navigate iframe node
```

## Current State
The branch already has:
- shell-based preview pages
- validation overlay
- clickable error navigation
- heuristic inline validation highlighting
- iframe reload loop

What is missing is better usability for the overlay itself:
- too much visual noise when many issues appear
- no filtering by keyword/status
- fixed placement
- no collapse/dock controls

## Required Deliverables

### 1. Dockable overlay script
Create a new dev overlay implementation that supports:
- dock left
- dock right
- collapse / expand
- persistent position in localStorage

Recommended file:
- `js/dev/dev_clickable_error_overlay_dockable.js`

### 2. Filter controls
Overlay should support at minimum:
- free-text filter
- show only failing items
- show all extracted tokens / issues

If issue parsing is heuristic, filtering should still apply to rendered issue labels.

### 3. Dedicated preview page
Create a preview page that uses the new overlay stack.

Recommended file:
- `preview_instrument_dev_console.html`

### 4. Safe persistence
Use localStorage keys such as:
- `spark_dev_overlay_dock`
- `spark_dev_overlay_collapsed`
- `spark_dev_overlay_filter`

### 5. Non-goals
Do not rewrite app runtime.
Do not require framework-specific state.
Do not mutate application state when changing overlay settings.

## Interaction Requirements
- clicking an issue still calls `window.SparkDevNavigateTo(...)`
- filter updates list instantly
- dock changes apply instantly
- collapsed mode still shows status summary

## Definition of Done
Complete when:
- overlay can dock left/right
- overlay can collapse/expand
- overlay filters issue list by text
- clicked filtered items still navigate the iframe
- settings persist across refreshes
