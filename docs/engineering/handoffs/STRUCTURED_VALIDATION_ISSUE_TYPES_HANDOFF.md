# Structured Validation Parsing + Issue Types Handoff

## Goal
Upgrade the current heuristic validation UX into a structured Problems-style panel with typed issues, better labels, and more precise filtering/navigation.

Target workflow:

```text
watch → pipeline runs → structured validation file updates → overlay groups issues by type → filter by type/text → click issue → navigate iframe target
```

## Current State
The branch already has:
- generator / validator / apply pipeline
- validation status file
- shell-based preview pages
- clickable overlay
- dockable/filterable console
- heuristic inline highlighting

Current limitation:
- issue extraction is token-based from raw validator output
- overlay cannot distinguish missing exercises vs missing skills vs chart issues
- filtering is plain text only

## Required Deliverables

### 1. Structured parser
Create a parser that converts validator output into typed issues.

Recommended file:
- `js/dev/dev_validation_issue_parser.js`

Expected output shape:
```json
{
  "ok": false,
  "updatedAt": 1712550000000,
  "issues": [
    {
      "type": "missing_exercise",
      "severity": "error",
      "label": "Skill barre_chords has no exercises",
      "instrument": "ukulele",
      "skillId": "barre_chords",
      "lessonId": null,
      "keyword": "barre_chords"
    }
  ]
}
```

### 2. Structured overlay
Create an overlay that:
- reads structured issues
- shows counts by type
- filters by type and text
- still supports click-to-navigate

Recommended file:
- `js/dev/dev_issue_console.js`

### 3. Structured preview page
Create a preview page wired to the structured console.

Recommended file:
- `preview_instrument_dev_problems.html`

### 4. Optional watch output enhancement
If practical, update the watch script to also emit `issues: []` directly when possible. If not, parsing in the browser is acceptable as an intermediate step.

## Recommended Issue Types
At minimum:
- `missing_exercise`
- `missing_skill`
- `missing_prerequisite`
- `duplicate_lesson`
- `invalid_exercise`
- `chart_missing_notes`
- `chart_missing_skill`
- `orphan_skill` (warning)
- `validator_crash`

## Constraints
Do not:
- change production runtime behavior
- depend on framework-specific internals
- block preview entirely when parsing fails

Do:
- preserve raw output fallback
- keep click navigation working
- support same-origin shell + iframe workflow

## Definition of Done
Complete when:
- validation issues are typed and grouped
- overlay filters by issue type and text
- click navigation still works
- raw output remains available as fallback
