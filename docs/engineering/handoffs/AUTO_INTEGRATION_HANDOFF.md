# Auto-Integration Handoff

## What This Is

After the instrument generator creates scaffold files, auto-integration wires
them into the running app. This document covers the integration points that
must be updated when adding a new instrument to SparkSuite.

## Integration Points

### 1. index.html Script Tags

All runtime instrument files must be loaded via deferred script tags in index.html.
Order matters: dependencies must load before dependents.

Required load order for a new instrument:

    <!-- SparkSuite module layer (loads first) -->
    <script data-deferred-src="js/sparksuite/instruments/NAME/NAME_skill_tree.js"></script>
    <script data-deferred-src="js/sparksuite/instruments/NAME/NAME_lessons.js"></script>
    <script data-deferred-src="js/sparksuite/instruments/NAME/NAME_exercises.js"></script>
    <script data-deferred-src="js/sparksuite/instruments/NAME/NAME_chords.js"></script>
    <script data-deferred-src="js/sparksuite/instruments/NAME/NAME_module.js"></script>
    <script data-deferred-src="js/sparksuite/instruments/NAME/NAME_adapter.js"></script>
    <script data-deferred-src="js/sparksuite/instruments/NAME/index.js"></script>

    <!-- Runtime layer (loads after module layer) -->
    <script data-deferred-src="js/instruments/NAME/register.js"></script>
    <script data-deferred-src="js/instruments/NAME/app.js"></script>

### 2. Launcher Registration

The instrument becomes available when register.js calls
SparkInstruments.register() with available: true.

No changes needed to js/launcher.js. It discovers instruments dynamically.

### 3. Electron

The desktop target loads index.html directly.
Script tags in index.html are the only integration point.

### 4. Test Suite

The curriculum guardrails test auto-discovers registered instruments.
New instruments are tested automatically if their data files are loaded.

To add explicit loading in the test:

    safeEval("js/sparksuite/instruments/NAME/NAME_lessons.js");
    safeEval("js/sparksuite/instruments/NAME/NAME_skill_tree.js");
    safeEval("js/instruments/NAME/register.js");

### 5. Content Manifests

If the instrument has content packs, add entries to:
- content/manifests/default.json
- content/packs/index.json

### 6. Performance Charts

If the instrument supports performance mode, add chart JSON files to:
- data/performance_charts/

Charts must match the contract in js/performance-core/chart-contract.js.

## Integration Verification

| Check | How |
|-------|-----|
| Scripts load without errors | Open browser console, check for 404s or syntax errors |
| Instrument appears in launcher | Start app, check launcher screen |
| Curriculum loads | Select instrument, check session/lesson availability |
| Guardrails pass | node tests/test_curriculum_guardrails.js |
| Full test suite passes | npm test |
| Electron target works | npm start |

## Common Integration Failures

1. Script tag order wrong: module files must load before register.js
2. Global name collision: ensure window.SparkNAME* names are unique
3. Missing data dependency: register.js getData() returns undefined for fields
4. Adapter not wired: index.js does not export adapter to SparkSuite bridge
5. Test not updated: guardrails test does not safeEval the new data files

## Automated vs Manual Steps

| Step | Automated | Manual |
|------|-----------|--------|
| Create scaffold files | Yes | -- |
| Add script tags to index.html | Yes | Verify order |
| Update test file with safeEval | Yes | Verify passes |
| Add real chord/scale data | -- | Yes |
| Write curriculum content | -- | Yes |
| Implement SVG rendering | -- | Yes |
| Add performance charts | -- | Yes |
| Test across all platforms | -- | Yes |

## Related Docs

- docs/engineering/handoffs/INSTRUMENT_GENERATOR_PIPELINE_HANDOFF.md
- docs/engineering/instrument-module-contract.md
- docs/engineering/INSTRUMENT_DEBUG_GUIDE.md
- docs/engineering/CURRICULUM_CONTRACT.md
