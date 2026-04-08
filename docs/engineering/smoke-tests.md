# SparkSuite Smoke Test Checklist

## App Boot
- [ ] index.html loads without console errors
- [ ] Home dashboard renders
- [ ] Instrument tiles appear

## Instrument Activation
- [ ] Guitar: activates, shows practice tab
- [ ] Ukulele: activates, shows practice tab with 4-string chord diagrams
- [ ] Piano: activates, shows keyboard-style chord display
- [ ] Bass: activates, shows 4-string fretboard

## Practice Flow
- [ ] Quick Start launches a session with random chord
- [ ] Timer counts down
- [ ] Session completes, XP awarded
- [ ] Streak increments on first daily session

## Performance Flow
- [ ] Open a performance chart
- [ ] Highway renders with correct lane count
- [ ] Scoring produces results
- [ ] Results save and appear in stats

## Save/Load
- [ ] State persists across page refresh
- [ ] Profile data loads correctly
- [ ] No data corruption on repeated saves

## Chord Rendering
- [ ] Guitar chords: 6-string diagrams, correct finger positions
- [ ] Ukulele chords: 4-string diagrams (G-C-E-A), correct finger positions
- [ ] Bass chords: 4-string fretboard notation
- [ ] Piano chords: keyboard visualization
- [ ] Barre chords render correctly for guitar
