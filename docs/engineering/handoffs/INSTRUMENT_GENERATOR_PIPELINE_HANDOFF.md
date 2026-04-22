# Instrument Generator Pipeline Handoff

## What This Is

A scaffold generator that creates all required files for a new SparkSuite instrument.
It produces the minimum viable set of files across all architectural layers, following
the ukulele reference implementation as the gold standard template.

## Entry Point

    node scripts/generate_instrument_pipeline.js <instrument-name> [options]

Example:

    node scripts/generate_instrument_pipeline.js mandolin --strings 8 --type stringed

## What Gets Generated

### Tier 1: Runtime Registration (always)

| File | Purpose |
|------|---------|
| js/instruments/NAME/register.js | SparkInstruments.register() with capabilities |
| js/instruments/NAME/app.js | act() handler for quickStart, resumeSession, startSession |

### Tier 2: SparkSuite Adapter (always)

| File | Purpose |
|------|---------|
| js/sparksuite/instruments/NAME/index.js | Adapter factory and exports |
| js/sparksuite/instruments/NAME/NAME_adapter.js | Bridge to module layer |

### Tier 3: SparkSuite Module (always)

| File | Purpose |
|------|---------|
| js/sparksuite/instruments/NAME/NAME_module.js | Main module with rhythm library |
| js/sparksuite/instruments/NAME/NAME_lessons.js | Lesson definitions |
| js/sparksuite/instruments/NAME/NAME_exercises.js | Exercise generation |
| js/sparksuite/instruments/NAME/NAME_skill_tree.js | Skill tree for progression |

### Tier 4: Data Layer (conditional)

| File | Condition | Purpose |
|------|-----------|---------|
| NAME_chords.js | stringed instruments | Chord shapes |
| NAME_scales.js | if scales apply | Scale patterns |
| NAME_tuning.js | stringed instruments | Tuning data |

## Architecture Layers Covered

From INSTRUMENT_DEBUG_GUIDE.md, a working instrument needs all 8 layers aligned:

1. Runtime registration (register.js)
2. Adapter/bridge layer (adapter.js + index.js)
3. SparkSuite module layer (module.js)
4. Curriculum + lessons (lessons.js)
5. Exercises + gameplay (exercises.js)
6. Charts/chord data (chords.js if applicable)
7. UI rendering (register.js ui overrides)
8. Progress tracking (skill_tree.js + LC/LN in register.js)

## Contract Compliance

Generated instruments satisfy instrument-module-contract.md.
All required methods are stubbed with working defaults.

## Validation

After generation, the new instrument should pass:

1. node tests/test_launcher.js
2. node tests/test_curriculum_guardrails.js
3. Manual: instrument appears in launcher
4. Manual: at least one session can start

## Options

| Flag | Default | Description |
|------|---------|-------------|
| --type | stringed | stringed, keys, pads |
| --strings | 6 | Number of strings (stringed only) |
| --id | NAMEspark | App ID for registration |
| --levels | 4 | Number of curriculum levels to scaffold |
| --dry-run | false | Print file list without writing |

## Post-Generation Checklist

1. Add real instrument data (chords, scales, tuning) to stubs
2. Add script tags to index.html for all generated files
3. Populate lesson content with real curriculum
4. Add exercises for each skill in the skill tree
5. Implement ui.chord() with real rendering
6. Run test suite to verify contract compliance
7. Test in Electron, Tauri, and browser targets

## Reference Implementations

| Instrument | Best For |
|------------|----------|
| Ukulele | Full curriculum pipeline (lessons + exercises + skill tree) |
| Bass | Rhythm-focused module with embedded library |
| Guitar | Rich runtime with capo/performance features |
| Piano | Multi-page UI with voice leading |

## Related Docs

- docs/engineering/instrument-module-contract.md
- docs/engineering/INSTRUMENT_DEBUG_GUIDE.md
- docs/engineering/CURRICULUM_CONTRACT.md
- docs/engineering/handoffs/AUTO_INTEGRATION_HANDOFF.md
