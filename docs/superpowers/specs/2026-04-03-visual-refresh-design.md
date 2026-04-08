# SparkSuite Visual Refresh — Design Spec

## Aesthetic Direction

**Vibrant Playground (Neon Edition)** — Dark base with bold neon instrument colors. Each instrument owns its own color world. Gamified energy with Duolingo-meets-Spotify feel. Bouncy animations, gradient accents, rounded shapes.

## Instrument Color System

| Instrument | Primary | Glow | Background Tint | Gradient |
|---|---|---|---|---|
| Guitar | `#ff2d55` | `rgba(255,45,85,0.3)` | `#1a0015` | `linear-gradient(135deg,#ff2d55,#ff6666)` |
| Ukulele | `#ff0080` | `rgba(255,0,128,0.3)` | `#1a0020` | `linear-gradient(135deg,#ff0080,#ff66aa)` |
| Piano | `#0088ff` | `rgba(0,136,255,0.3)` | `#001a30` | `linear-gradient(135deg,#0088ff,#44aaff)` |
| Bass | `#00ff64` | `rgba(0,255,100,0.3)` | `#001a0a` | `linear-gradient(135deg,#00ff64,#66ffaa)` |
| Drums | `#aa44ff` | `rgba(170,68,255,0.3)` | `#150030` | `linear-gradient(135deg,#aa44ff,#cc88ff)` |

### CSS Variable Contract

When an instrument activates, these CSS variables update on `#app` or `:root`:

```css
--inst-primary: #ff2d55;     /* primary neon color */
--inst-glow: rgba(255,45,85,0.3); /* glow/shadow color */
--inst-tint: #1a0015;        /* subtle background tint */
--inst-gradient: linear-gradient(135deg,#ff2d55,#ff6666); /* hero gradient */
--inst-primary-rgb: 255,45,85; /* for rgba() usage */
```

All components inherit from these variables. Buttons, progress rings, borders, active states, and backgrounds all respond to the active instrument.

## Typography

Replace current Syne/Outfit with a bolder pairing:

- **Display:** A geometric, high-personality font for headings and hero text (e.g., Clash Display, Cabinet Grotesk, or Satoshi — something with weight and character but not overused)
- **Body:** Clean, legible sans-serif for UI text (e.g., General Sans, Plus Jakarta Sans, or Switzer)
- **Mono:** JetBrains Mono or similar for BPM counters, timers, stat numbers

Specific font choice will be finalized during implementation based on Google Fonts availability and rendering quality.

### Type Scale

| Token | Size | Weight | Usage |
|---|---|---|---|
| `--text-hero` | 28px | 900 | Hero card headings |
| `--text-heading` | 18px | 800 | Section headings |
| `--text-subheading` | 14px | 700 | Card titles, labels |
| `--text-body` | 13px | 400 | Body text |
| `--text-caption` | 11px | 600 | Captions, metadata |
| `--text-micro` | 9px | 700 | Badges, tiny labels |
| `--text-stat` | 24px | 900 | XP counts, timer numbers |

## Spacing Scale

Formalized 4px base unit:

| Token | Value | Usage |
|---|---|---|
| `--sp-1` | 4px | Tight gaps, badge padding |
| `--sp-2` | 8px | Component internal gaps |
| `--sp-3` | 12px | Card padding, between items |
| `--sp-4` | 16px | Section spacing |
| `--sp-5` | 24px | Major section gaps |
| `--sp-6` | 32px | Page section dividers |
| `--sp-8` | 48px | Hero card padding |

## Area 1: Home Dashboard — Instrument-First Hub

### Layout Structure

```
┌─────────────────────────────────┐
│  Header (SparkSuite logo + XP)  │
├─────────────────────────────────┤
│                                 │
│   ┌─────────────────────────┐   │
│   │   ACTIVE INSTRUMENT     │   │
│   │   Hero Card             │   │
│   │                         │   │
│   │   Icon  Name  Level     │   │
│   │   [XP] [Streak] [Chords]│   │
│   │                         │   │
│   │  [Practice] [Songs] [Play]  │
│   └─────────────────────────┘   │
│                                 │
│  ┌──────┐ ┌──────┐ ┌──────┐    │
│  │ Uke  │ │Piano │ │ Bass │    │
│  │ Lv.1 │ │ Lv.2 │ │ New  │    │
│  └──────┘ └──────┘ └──────┘    │
│                                 │
│  ┌─────────────────────────┐    │
│  │  Daily Goal Ring  65%   │    │
│  │  6.5 / 10 min today    │    │
│  └─────────────────────────┘    │
│                                 │
└─────────────────────────────────┘
```

### Hero Card

- Full-width rounded card (`border-radius: 20px`)
- Background: `var(--inst-gradient)` faded to dark, or dark card with `var(--inst-tint)` and a radial glow
- Border: `1px solid rgba(var(--inst-primary-rgb), 0.15)`
- Instrument icon in a 56px rounded-square with `var(--inst-gradient)` fill and `box-shadow: 0 4px 16px var(--inst-glow)`
- Instrument name in `--text-hero` weight
- Level name in `--text-caption` with muted color
- Stat badges: small rounded pills with `rgba(var(--inst-primary-rgb), 0.15)` background, showing XP, streak, chord count in `--text-micro`
- Three action buttons embedded at bottom of card: Practice (instrument color fill), Songs (ghost), Play (ghost)
- Entry animation: card slides up with 0.3s ease-out, stat badges stagger in 0.1s each

### Inactive Instrument Row

- Horizontal flex row of compact cards
- Each shows: emoji icon + name + level in `--text-micro`
- Neutral background (`#151520`), border `1px solid #222`
- On tap: switch instrument, hero card morphs to new color
- Active instrument not shown in this row (it's the hero)

### Daily Goal

- Compact card with circular progress ring (36px) using `var(--inst-primary)` stroke
- Percentage inside ring in bold
- "Daily Goal: N min" label and progress text
- Ring fills with animation on page load

### Background

- Page background: `#0a0a12` base with subtle radial gradient of `var(--inst-tint)` at 20% opacity, centered behind the hero card

## Area 2: Session/Practice — Animated + Gamified

### Default Mode (Gamified)

**Chord Diagram:**
- Wrapped in a card with `border: 2px solid rgba(var(--inst-primary-rgb), 0.3)` and `box-shadow: 0 0 30px var(--inst-glow)`
- Finger dots: pulse animation on first appearance (scale 0→1.1→1 over 0.3s)
- Chord morph: when switching chords, old dots fade/shrink while new dots pop in
- Background glow behind the SVG: radial gradient of instrument color at low opacity

**Timer Ring:**
- Large circular progress ring (90px) with instrument color stroke
- Particle trail effect: small dots travel along the ring edge as time passes (CSS animation on a pseudo-element following the stroke)
- Time display inside ring: monospace font, large weight
- At 30-second intervals when XP is awarded: "+5 XP" text floats up from the ring and fades (CSS animation, 1s duration)

**Combo Counter (Drills):**
- Badge in top-right of chord card: "3x" with bounce animation on increment
- Color intensifies with combo: 1-2x neutral, 3-5x instrument color, 6+x gold with glow
- Reset animation: badge shrinks and fades to neutral

**Metronome:**
- Beat dots use instrument glow: active beat dot has `background: var(--inst-primary)` with `box-shadow: 0 0 8px var(--inst-glow)`
- Inactive dots: `#333`

**XP Popups:**
- When `shouldReward` fires mid-session: "+5 XP" appears near the timer, floats up 30px, fades over 1s
- Uses CSS `@keyframes xpFloat { from { opacity:1; transform:translateY(0) } to { opacity:0; transform:translateY(-30px) } }`

### Focus Mode

- Toggle button: top-right corner, icon-only (eye icon or "zen" icon)
- When active:
  - Strip all glow effects, particle trails, XP popups
  - Chord card loses colored border, becomes plain `var(--card-bg)`
  - Timer becomes simple text countdown, no ring
  - Metronome stays (it's functional, not decorative)
  - Background becomes flat `#0a0a12`
  - Transition: 0.5s fade to stripped state
- State saved in `S.focusMode` boolean, persists across sessions

## Area 3: Completion Screen — Explosion then Summary

### Phase 1: Burst (0–1.5s)

- Screen starts dark (0.2s)
- Confetti burst: 40-60 particles in instrument color variants, ejected from center, gravity-affected fall
- XP number counts up from 0 to earned amount (center screen, `--text-hero` size, instrument color, glow shadow)
- "Awesome!" text scales in with bounce (0→1.15→1 over 0.4s), positioned above XP
- Sound: `snd("complete")` fires at burst moment
- Jackpot variant: starburst SVG behind XP number, particles are gold, XP text is gold with stronger glow, `snd("levelup")` plays

### Phase 2: Summary (1.5–4s)

Confetti settles and fades. Stat cards stagger in from below:

- **Card 1 (0.2s delay):** Mastery ring — chord name, circular progress ring fills from previous value to new value over 0.8s. Percentage in center.
- **Card 2 (0.4s delay):** Streak — flame icon, streak number pulses once (scale 1→1.2→1), "day streak" label
- **Card 3 (0.6s delay):** Level progress — horizontal bar fills to current progress toward next level

Achievement badges (if earned): fly in from left/right sides with 0.8s delay, land in a row below stats. Each badge has instrument-colored glow.

### Phase 3: Actions (3.5s+)

- Buttons fade in at bottom:
  - "One More" — `var(--inst-gradient)` fill, white text
  - "Home" — ghost/neutral style
- Level-up overlay: if leveled up, full-screen gold gradient fades in at 2s mark, new level number reveals with scale animation, confetti is gold-colored

## Area 4: Component System

### New CSS File: `spark-visual-v2.css`

Added alongside existing `styles.css` and `spark-visual.css`. Non-destructive — new classes coexist with old ones. Migration is gradual.

### Component Classes

**`.sv2-card`** — Standard card
```css
.sv2-card {
  background: var(--card-bg);
  border: 1px solid var(--border);
  border-radius: 16px;
  padding: var(--sp-4);
}
```

**`.sv2-card--inst`** — Instrument-themed card (hero cards, active states)
```css
.sv2-card--inst {
  border-color: rgba(var(--inst-primary-rgb), 0.15);
  background: var(--inst-tint);
  box-shadow: 0 4px 24px var(--inst-glow);
}
```

**`.sv2-btn`** — Button base
```css
.sv2-btn {
  height: 44px;
  border-radius: 12px;
  font-weight: 700;
  font-size: var(--text-subheading);
  transition: all 0.2s ease;
}
.sv2-btn--primary {
  background: var(--inst-gradient);
  color: #fff;
  box-shadow: 0 4px 16px var(--inst-glow);
}
.sv2-btn--ghost {
  background: rgba(255,255,255,0.05);
  color: var(--text-muted);
}
```

**`.sv2-ring`** — Progress ring container
- Instrument-colored stroke
- Configurable size via CSS custom property

**`.sv2-badge`** — Stat badge pill
- `background: rgba(var(--inst-primary-rgb), 0.15)`
- `color: var(--inst-primary)`
- Small rounded pill shape

**`.sv2-icon`** — Icon container (replaces raw emoji)
- Fixed-size container with rounded corners
- Optional gradient background using instrument color
- Emoji or SVG inside, centered

### Confetti System

- Pure CSS/JS — no library dependency
- `SparkConfetti.burst(options)` function
- Options: `{ count, colors, origin, gravity, spread }`
- Default colors derived from `var(--inst-primary)` variants
- Particles are small rounded rects, randomly rotated, gravity-affected
- Self-cleaning: particles remove from DOM after animation completes (2s)

### XP Float Animation

- Reusable `SparkXPFloat.show(amount, element)` function
- Creates absolutely-positioned "+N XP" text near the given element
- CSS animation: float up 30px and fade over 1s
- Self-cleaning

## Area 5: Instrument-Aware Theming

### Activation Flow

When `SparkInstruments.activate(id)` runs, the theming system updates CSS variables:

```javascript
function applyInstrumentTheme(instrument) {
  var themes = {
    guitar:  { primary: "#ff2d55", glow: "rgba(255,45,85,0.3)", tint: "#1a0015", rgb: "255,45,85" },
    ukulele: { primary: "#ff0080", glow: "rgba(255,0,128,0.3)", tint: "#1a0020", rgb: "255,0,128" },
    piano:   { primary: "#0088ff", glow: "rgba(0,136,255,0.3)", tint: "#001a30", rgb: "0,136,255" },
    bass:    { primary: "#00ff64", glow: "rgba(0,255,100,0.3)", tint: "#001a0a", rgb: "0,255,100" },
    drums:   { primary: "#aa44ff", glow: "rgba(170,68,255,0.3)", tint: "#150030", rgb: "170,68,255" }
  };
  var t = themes[instrument] || themes.guitar;
  var root = document.documentElement;
  root.style.setProperty("--inst-primary", t.primary);
  root.style.setProperty("--inst-glow", t.glow);
  root.style.setProperty("--inst-tint", t.tint);
  root.style.setProperty("--inst-primary-rgb", t.rgb);
  root.style.setProperty("--inst-gradient", "linear-gradient(135deg," + t.primary + "," + t.primary + "88)");
}
```

### What Responds to Instrument Theme

- Hero card background/border
- All `.sv2-btn--primary` buttons
- Progress rings (timer, daily goal, mastery)
- Tab bar active state (replaces fixed orange)
- Chord diagram border glow
- XP popup text color
- Confetti particle colors
- Completion screen burst colors
- Page background radial gradient tint
- Stat badge pill backgrounds
- Active metronome beat dot

### What Does NOT Change

- Text colors (stay `--text-primary`, `--text-muted`, etc.)
- Card base background (stays `--card-bg`)
- Neutral borders (stay `--border`)
- Font choices
- Spacing values
- Layout structure

## Migration Strategy

1. Add `spark-visual-v2.css` with new component classes and instrument theme variables
2. Add `js/ui/theme.js` with `applyInstrumentTheme()` function
3. Add `js/ui/confetti.js` with confetti burst system
4. Add `js/ui/xp-float.js` with XP popup system
5. Update `render()` in `app.js` to call `applyInstrumentTheme` on instrument change
6. Rebuild home dashboard using new component classes
7. Rebuild session page with animated chord + gamified timer
8. Rebuild completion page with burst + summary phases
9. Gradually migrate other pages from inline styles to `sv2-*` classes

Each step is independently shippable. The app works after every commit.

## What's Explicitly Out of Scope

- Custom SVG icon set (emoji containers with glow for now, proper icon set is a future pass)
- Redesigning the performance/highway gameplay UI
- Redesigning the editor
- Changing the app architecture or navigation model
- Mobile responsiveness overhaul (existing responsive approach preserved)
- Light mode updates (dark-first, light mode follow-up later)
