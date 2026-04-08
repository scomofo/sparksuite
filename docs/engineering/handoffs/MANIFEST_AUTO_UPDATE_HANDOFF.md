# Manifest Auto-Update Handoff

Implement manifest updates after applying a generated instrument.

## Goal
Update `js/instruments/instrument_manifest.generated.js` automatically after integration.

## Required behavior
- add or replace entry by `id`
- no duplicates
- include `sparkSuiteFiles` and `runtimeFiles`
- keep manifest as `window.SparkInstrumentDiscoveryManifest = [...]`
