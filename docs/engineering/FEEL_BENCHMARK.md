# SparkSuite Feel Benchmark Reference

Reference targets for gameplay feel, compared against Guitar Hero / Clone Hero / Yousician.

## Timing Windows

| Judgment | SparkSuite | Guitar Hero | Yousician |
|----------|-----------|-------------|-----------|
| Perfect  | +/-30ms   | +/-25-35ms  | +/-40ms   |
| Good     | +/-70ms   | +/-60-80ms  | +/-80ms   |
| Miss     | >70ms     | >80ms       | >80ms     |

## Input Offset

- SparkSuite: -15ms (compensates for natural late hits)
- Guitar Hero: -10 to -25ms (user calibrated)

## Note Travel Time

- SparkSuite: 2000ms
- Guitar Hero: 1800-2200ms (speed-dependent)

## Visual Offset

- SparkSuite: 0ms (configurable via S.visualOffsetMs)
- Target: -5 to +5ms

## Audio Priority Rule

Audio is the source of truth. Gameplay syncs to audio clock, never the reverse.

## Calibration

Manual calibration flow:
1. Play metronome at fixed tempo
2. User taps along
3. Measure average delta
4. Set audioOffsetMs = averageDelta * -1

## Tuning Process

Adjust ONE variable at a time:
1. Input offset (feel of timing judgment)
2. Visual offset (note-to-hit-line alignment)
3. Audio offset (device latency)

## Constants Location

All feel constants are in `js/sparksuite/core/feel_system.js` (SparkFeelSystem).
