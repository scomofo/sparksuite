# SparkSuite Stability Audit — 2026-04-04

## Completed

### Round 1-5: Crash/Stability Audit (47 files)
- All instrument state initializations, null guards, timer cleanup, CSS, accessibility, error boundaries
- See git log for full details

### Round 6: Content Expansion + P3 Polish (10 files)
- **Ukulele**: 8 -> 16 chords, 4 -> 12 songs, 8 -> 12 lessons
- **Bass**: 19 -> 25 songs, 10 -> 20 guided sessions
- **Performance charts**: 9 -> 13 (added 2 bass, 2 piano)
- **MIDI import**: File size limit, magic byte validation, try-catch
- **Song submission**: BPM/length validation, XSS protection
- **Piano normalizer**: fromPianoSparkSessions replacing TODO
- **Highway adapter**: Instrument param for piano skin selection
- **Tab stubs**: gamesTab/toolsTab defined

---

## TODO — Remaining

### P1 — Content (still gaps vs guitar)
- [ ] More rhythm highway authored charts (guitar has 4, bass 4, ukulele 3, piano 2)
- [ ] Bass exercises expansion (only 8 vs guitar/piano depth)
- [ ] Ukulele performance chart depth (3 charts, could use more)

### P2 — Architectural (Phase 2)
- [ ] Reduce S.* dependence — flows should read core state first
- [ ] Move live loops into engine — timer/transport ownership still shell-owned
- [ ] Thin bridge layers — some bridges still contain compatibility logic
- [ ] Pages core-first — utility/tool screens still mostly shell-owned

### P3 — Polish (remaining)
- [ ] Cloud sync UX — no progress indicator, no conflict resolution
- [ ] Imported chart edge cases in shared rendering
