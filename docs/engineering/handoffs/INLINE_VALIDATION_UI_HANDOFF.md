# Inline Validation Highlight UI Handoff

## Goal
Surface validator failures inside the live preview itself by visually highlighting likely broken lessons and skills in the UI.

Target workflow:

```text
watch → regenerate/apply → validation json updates → shell overlay shows status → iframe UI highlights affected lesson/skill nodes
```

## Current Status
The branch already has:
- generator / validator / apply pipeline
- validation overlay in the dev shell
- shell-based preview with iframe refresh

What is still missing is a visual bridge from validator output to the actual instrument UI.

## Required Deliverables

### 1. Browser-side validation highlighter
Create a dev script that runs in the shell page and inspects the iframe document.

Recommended file:
- `js/dev/dev_validation_highlight.js`

Responsibilities:
- read `.preview_validation.json`
- parse validator output for lesson ids and skill ids
- find likely matching nodes inside the iframe
- apply non-destructive highlight styling
- clear stale highlights before reapplying

### 2. Dedicated IDE preview page
Create a shell page that includes:
- validation overlay
- iframe app preview
- validation highlighter
- instrument auto-select before load

Recommended file:
- `preview_instrument_dev_ide.html`

### 3. Matching strategy
Use lightweight heuristics rather than assuming perfect DOM contracts.

Preferred order:
1. data attributes if present (`data-lesson-id`, `data-skill-id`)
2. id matches
3. text content exact/contains matches

### 4. Highlight rules
- lesson matches: red/orange outline and badge
- skill matches: yellow outline and badge
- only active in dev shell mode
- never mutate application state

## Constraints
Do not:
- patch production runtime logic only for highlighting
- depend on specific framework abstractions
- break when no matching DOM nodes exist

Do:
- fail silently when nothing can be matched
- keep highlighting read-only
- keep shell as the persistent debug surface

## Definition of Done
Complete when:
- validation errors still show in overlay
- affected lesson/skill items are visually marked in the iframe UI when detectable
- highlights refresh after each successful iframe reload
- no production behavior changes outside dev shell mode
