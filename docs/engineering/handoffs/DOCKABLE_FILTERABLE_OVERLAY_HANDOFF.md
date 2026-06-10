# Dockable Filterable Overlay Handoff

## Status

Implemented. `js/dev/dev_panel.js` now provides the unified gated dev surface, and `index.html` loads it with the validator, highlighter, overlay, and reload client before `app.js`.

The panel includes:

- Status, Issues, and Reload tabs
- left/right docking persisted in `spark_dev_dock_position`
- collapsed badge state persisted in `spark_dev_panel_open`
- issue type/severity filters persisted in `spark_dev_filter_type` and `spark_dev_filter_severity`
- click-to-navigate issue rows using structured validator nav hints

The older overlay and curriculum issue nav remain in place for compatibility, but the unified panel hides their DOM when active.

## Goal

Upgrade dev overlay and error navigation into a single dockable,
filterable debug surface.

## Current State

| Panel | Position | File |
|-------|----------|------|
| Dev Overlay | bottom-right | js/dev/dev_overlay.js |
| Error Navigation | bottom-left | js/dev/dev_curriculum_highlighter.js |
| Reload Client | invisible | js/dev/dev_reload_client.js |

Problems:
- Two panels compete for screen space
- No filtering by type or instrument
- No docking or repositioning
- Collapsed state lost on render

## Deliverables

### 1. Unified Panel (js/dev/dev_panel.js)

Merge overlay info and error nav into one panel with tabs:
- **Status** -- instrument, screen, tab, manifest count, script count
- **Issues** -- curriculum errors with click-to-navigate
- **Reload** -- last reload timestamp, manual reload button

### 2. Docking

Two dock positions: bottom-right (default), bottom-left.
Toggle via header button. Persist in localStorage (spark_dev_dock_position).

### 3. Filtering

Issue list filters:

| Filter | Values |
|--------|--------|
| Type | skills, lessons, levels, all |
| Severity | missing (hard break), warning (no exercises), all |

Toggleable buttons. Persist in localStorage.

### 4. Collapse/Expand

Panel collapses to a floating badge showing issue count.
Click badge to expand. Persist in localStorage (spark_dev_panel_open).

Badge format: red if issues > 0, green if clean.

## DOM Structure

    #spark-dev-panel
      .spark-dev-header     (title, dock toggle, collapse toggle)
      .spark-dev-tabs       (Status | Issues | Reload)
      .spark-dev-filters    (type, severity -- Issues tab only)
      .spark-dev-content    (active tab content)
      .spark-dev-badge      (collapsed state -- issue count)

## State (all localStorage)

| Key | Values | Default |
|-----|--------|---------|
| spark_dev_panel_open | true/false | true |
| spark_dev_dock_position | right/left | right |
| spark_dev_filter_type | skills/lessons/levels/all | all |
| spark_dev_filter_severity | missing/warning/all | all |
| spark_dev_active_tab | status/issues/reload | issues |

## Navigation

| Issue Type | Navigation |
|------------|------------|
| Broken skill | S.screen = skillTree |
| Broken lesson | S.screen = home, S.tab = practice, S.selectedLevel = N |
| Missing level data | S.screen = home, S.tab = practice, S.selectedLevel = N |

## Inline Highlighting

Keep existing inline highlighting from dev_curriculum_highlighter.js:
- Red dashed borders on broken skill tree nodes
- Red outlines on broken level tabs and chord cards

Unified panel replaces the bottom-left error list, not inline markers.

## Non-Goals

- No resizable panel
- No keyboard shortcuts
- No WebSocket or server component

## Activation

Same gate: ?dev=1 or localStorage spark_dev_overlay=true

## Definition of Done

- Single panel replaces two separate overlays
- Dock toggle moves panel left/right
- Issues filterable by type and severity
- Collapsed badge shows issue count
- State persists across reloads
- Click-to-navigate works on all issue types
- No regressions in inline highlighting

## Migration Path

1. Build js/dev/dev_panel.js alongside existing files
2. Add to index.html after existing dev scripts
3. dev_panel.js hides old panels if present
4. Once validated, remove old panel DOM from dev_overlay.js and highlighter

## Related Docs

- docs/engineering/handoffs/HOT_RELOAD_DEV_OVERLAY_HANDOFF.md
- js/dev/dev_overlay.js
- js/dev/dev_curriculum_highlighter.js
- js/dev/dev_reload_client.js
