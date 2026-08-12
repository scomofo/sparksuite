# MIDI transcriptions — personal use only, not licensed

The `.mid` files in this directory are transcriptions of commercial songs.
A MIDI transcription embodies the underlying musical composition, whose
rights belong to the songs' publishers/rights holders — none of which have
licensed this material.

- These files are here solely for the repository owner's **personal
  practice use** (backing playback and chart-timing generation via
  `npm run charts:generate-midi`).
- They are **excluded from the repository's MIT license** (see the
  third-party content exclusion at the bottom of `LICENSE`).
- They must **not** be reused, redistributed, or bundled into anything
  distributed to others. Packaged builds already enforce this: the
  electron-builder `files` list excludes `content/songs/midi/**`, so the
  tag-triggered release installers published to GitHub Releases do NOT
  contain this directory (MIDI backing audio is unavailable in packaged
  builds; running from source keeps it). If broader distribution is ever
  intended, this directory must be removed or replaced with licensed /
  original / public-domain material first — the generated chord charts in
  `data/performance_charts/` can remain, as chord-per-bar progressions
  carry none of the transcriptions' expressive content.

Provenance: sequencer files of unrecorded origin, collected for personal
practice. No attribution data is available.

Two files are generated in-repo rather than collected, but sit under the
same personal-use posture because their compositions are still
copyrighted: `mad_world.mid` and `you_are_my_sunshine.mid`
(`scripts/songs/generate_personal_use_backings.js`). They are
deliberately chords-only — block triads over root notes, no melody — so
they carry only the songs' harmonic skeleton for backing playback and
chart-timing generation.

## Public-domain exceptions (MIT-licensed)

Two files in this directory are NOT personal-use transcriptions and are
covered by the repository's MIT license:

- `ode_to_joy.mid` — original arrangement of the "Ode to Joy" theme from
  Beethoven's Symphony No. 9 (1824). Composition in the public domain.
- `amazing_grace.mid` — original arrangement of "Amazing Grace" to the
  traditional NEW BRITAIN tune (first published 1829). Composition in the
  public domain.

Both are generated deterministically by
`scripts/songs/generate_public_domain_midis.js` (regenerate with
`node scripts/songs/generate_public_domain_midis.js`) and pinned by
`tests/test_public_domain_midis.js`. They may be freely redistributed;
note however that packaged builds currently exclude this entire directory
(`content/songs/midi/**`), so shipping them in installers would require
narrowing that packaging exclusion first.
