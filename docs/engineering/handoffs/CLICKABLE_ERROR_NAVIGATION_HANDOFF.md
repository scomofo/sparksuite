# Clickable Error Navigation Handoff

## Goal
Add clickable navigation from validation errors to likely matching UI nodes inside the live preview iframe.

Target workflow:

```text
watch → validation file updates → overlay shows clickable issues → click issue → iframe scrolls to likely lesson/skill node → node is highlighted
```

## Current State
The branch already has:
- shell-based preview
- validation overlay
- iframe hot reload
- heuristic inline highlighting

What is missing is direct navigation from an error in the overlay to the likely matching UI element.

## Required Deliverables

### 1. Browser-side validation navigator
Create a navigator helper that:
- reads validation output-derived keywords
- searches inside the iframe document
- scrolls to the best match
- applies a stronger temporary focus style

Recommended file:
- `js/dev/dev_validation_navigator.js`

### 2. Clickable overlay
Create an overlay that:
- reads `.preview_validation.json`
- extracts likely skill / lesson / instrument identifiers
- renders clickable issue chips or buttons
- calls the navigator helper on click

Recommended file:
- `js/dev/dev_clickable_error_overlay.js`

### 3. Dedicated preview page
Create a preview page that includes:
- iframe app shell
- clickable error overlay
- validation highlighter
- instrument auto-select
- iframe reload loop

Recommended file:
- `preview_instrument_dev_navigator.html`

## Matching Strategy
Use this order of preference:
1. `data-lesson-id` / `data-skill-id`
2. `id`
3. exact text match
4. contains text match

If multiple matches exist:
- prefer visible nodes
- prefer shorter text nodes
- scroll to the first strongest match

## Highlight Strategy
When a clicked issue is navigated:
- apply a stronger outline
- add a temporary glow/background
- remove focus styling from previous target
- keep passive highlight layer intact when possible

## Constraints
Do not:
- mutate application state
- require framework-specific internals
- fail hard when no match exists

Do:
- degrade gracefully
- keep navigation same-origin within shell + iframe
- keep functionality dev-only

## Definition of Done
Complete when:
- validation overlay entries are clickable
- clicking an entry scrolls the iframe to a likely matching node
- target node receives stronger focus styling
- system keeps working after iframe reloads
