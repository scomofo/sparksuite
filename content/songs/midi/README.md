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
