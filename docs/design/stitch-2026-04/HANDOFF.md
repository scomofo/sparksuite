# Warm Ember Design Sync — Handoff

Starting point for the next session continuing the 2026-04 Stitch screen ports.

## Status

- **Branch**: `feat/warm-ember-design-sync`
- **PR**: #32 (open, targets `feature/convergence`)
- **Tests**: 317 / 317 (must stay green)
- **Commits already landed on branch**:
  1. `7cddb23` — Stitch export archived at `docs/design/stitch-2026-04/`
  2. `a050d46` — Design tokens expanded in `spark-showroom.css` `:root`
  3. `408394d` — `SparkOnboardingWelcome` renderer + CSS (the quality-bar reference — read this port first to match style/scope)

## Scope rule (non-negotiable)

Every port is **visual design only**. Previous bot PRs repeatedly shipped behavioral wiring alongside design and were fix-forwarded before merge. Do not:

- Modify `js/render.js` (no new `if (S._showroomOverride) { ... }` dispatcher blocks)
- Add new routes to `SparkShowroomNavigate` (the route table around `js/showroom/spark-showroom.js:42`)
- Change existing route handlers from `S.screen = SCR_.X` to `S._showroomOverride = "..."` — that puts mock Showroom pages on the live render path and reintroduces the "every instrument lands on identical mock content" regression
- Add `SCR.*` constants or `_sharedPages` registry entries for a Showroom module
- Insert external image URLs — `lh3.googleusercontent.com` and `images.unsplash.com` appear in the Stitch sources; replace them with inline gradients, Material Symbols glyphs, or same-origin `resources/` assets. The app CSP is `img-src 'self' data:` in `index.html`.

The Showroom modules are **design references**. They are currently unreachable from the live render path. Future activation is a separate concern.

## Remaining screens (in suggested order)

| Order | Stitch folder | Target renderer | Why this order |
|---|---|---|---|
| 1 | `tuner_tools/` | `SparkTuner` (update) | Distinctive visual (tuner dial + metronome). Second-most different from its existing renderer. |
| 2 | `song_library/` | `SparkSongLibrary` (update) | New search/filter/Trending layout. Replaces hardcoded mock content. |
| 3 | `course_syllabus/` | `SparkCurriculumDashboard` (update) | Already refined in PR #31; this is polish. |
| 4 | `profile/` | `SparkProfileScreen` (update) | Already refined in PR #28; this is polish. |
| 5 | `learning_path/` | `SparkPath` (update) | Already refined in PR #24; this is polish. |
| 6 | `session_summary/` | `SparkSessionSummary` (update) | Already refined in PR #26; this is polish. |
| 7 | `lesson_view/` | `SparkLesson` (update) | Matches practice-session look. |
| 8 | `performance_mode/` | `SparkPerformance` (update) | Matches the Rhythm Highway V3 redesign (PR #25). |

## Porting recipe (per screen)

1. **Read the source**: `docs/design/stitch-2026-04/<screen>/code.html`. Skip the `<script id="tailwind-config">` prelude (lines ~11–130); the meaningful layout starts inside `<body>`.
2. **Locate the existing renderer**: `grep -n "function <existing>Render" js/showroom/spark-showroom.js`. Existing exports are listed at lines ~1128–1144 + 1277 of `spark-showroom.js`.
3. **Update the renderer body**:
   - Keep the function signature `function xRender(opts) { opts = opts || {}; ... }`
   - Use `escHtml(...)` (note: lowercase `H`, not `escHTML` — that's a different file) for any user-facing text
   - Return a single root element: `'<div class="showroom-root with-bg">...</div>'` (or `.with-woodgrain` for the onboarding-style canvas)
   - Material Symbols are already loaded by `index.html` — use `<span class="material-symbols-outlined">iconname</span>` (add `fill` class for filled variant)
4. **Replace external URLs** with CSP-safe alternatives:
   - `lh3.googleusercontent.com/...` (avatars, lesson art) → initial-letter bubble, instrument artwork from `resources/instruments/<id>/card.png`, or inline SVG
   - `images.unsplash.com/...` (page backgrounds, textures) → inline gradient composition (see `.showroom-root.with-woodgrain` at the end of `spark-showroom.css` for the pattern)
5. **Add CSS**:
   - Append a new section to `spark-showroom.css` with a `/* ═════ Screen Name ═════ */` header
   - Prefix classes `.showroom-<screen>-<element>` (see onboarding CSS for pattern)
   - Consume design tokens from `:root` — `--surface-container-low`, `--primary-container`, `--on-primary-container`, `--outline-variant`, `--accent-deep`, `--brand-peach`, etc. Full list in `spark-showroom.css:21–116`.
   - Do NOT rewrite existing `.showroom-*` styles used by live renderers unrelated to the screen being ported — only add new classes scoped to this screen
6. **Verify**:
   - `npm test` — must stay at 317/0
   - `git diff feature/convergence..HEAD -- js/render.js` — must be empty (no render.js changes ever)
   - `grep -E "googleusercontent|unsplash" js/showroom/spark-showroom.js` — must be empty
7. **Commit format**:
   - Title: `Port Stitch <screen_name> into Spark<ExportName>`
   - Body: structure mirror + replaced-external-URLs note + scope reiteration (see `408394d` / onboarding commit message for template)

## Common pitfalls

- **Tailwind config indirection**: the Stitch files define custom tokens like `bg-bg`, `text-text-primary`, `font-body-md` via their inline Tailwind config. Translate to our CSS vars: `bg-bg` → `background: var(--bg)`, `text-text-primary` → `color: var(--text-primary)`, `font-body-md` → `font-family: 'Plus Jakarta Sans', var(--font-body)`.
- **Arbitrary-value utilities**: Stitch uses `text-[64px]`, `shadow-[0_0_12px_rgba(...)]` etc. Port straight to inline `style="..."` or a named CSS rule.
- **`font-variation-settings: 'FILL' 1`**: add `fill` class to `.material-symbols-outlined` spans. Already defined in the base Showroom CSS.
- **Emoji hallucination**: some Stitch HTML contains raw emoji `🎵` (the musical-note glyph). The source file in the repo encodes these as `🎵` in some renderers and literal UTF-8 in others. If an Edit matches fail, check the byte-level encoding with `od -c`.
- **CSS `>` combinator vs. spaces**: don't over-qualify selectors. The Showroom root structure is shallow; `.showroom-foo-bar` as a standalone class beats `.showroom-root .showroom-foo .bar`.

## Quality bar reference

See commit `408394d` (`SparkOnboardingWelcome`). It's ~40 lines of JS + ~110 lines of CSS. If your port is much larger, you're probably duplicating styles already provided by the design tokens; much smaller, you're probably missing the distinctive visual treatment that makes the screen recognisable in the screenshot.

## What a "done" signal looks like

- All 8 remaining screens ported as described
- Tests: 317/0
- `git diff feature/convergence..HEAD -- js/render.js` empty
- `grep -E "googleusercontent|unsplash" js/showroom/spark-showroom.js` empty
- `grep -E "S\._showroomOverride\s*=\s*\"" js/showroom/spark-showroom.js` yields only `"profile"` and `"lesson"` (the two pre-existing exceptions)
- PR #32 ready to merge, or a fresh PR if the eight screens are shipped as a follow-up
