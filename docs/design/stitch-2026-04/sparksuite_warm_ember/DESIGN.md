---
name: SparkSuite — Warm Ember
colors:
  surface: '#1c110c'
  surface-dim: '#1c110c'
  surface-bright: '#443630'
  surface-container-lowest: '#160c07'
  surface-container-low: '#251914'
  surface-container: '#291d18'
  surface-container-high: '#342722'
  surface-container-highest: '#40322c'
  on-surface: '#f5ded5'
  on-surface-variant: '#dfc0b4'
  inverse-surface: '#f5ded5'
  inverse-on-surface: '#3b2d28'
  outline: '#a78b80'
  outline-variant: '#584239'
  surface-tint: '#ffb596'
  primary: '#ffb596'
  on-primary: '#581e00'
  primary-container: '#ff7b3a'
  on-primary-container: '#642300'
  inverse-primary: '#a33e00'
  secondary: '#ffb691'
  on-secondary: '#552000'
  secondary-container: '#753814'
  on-secondary-container: '#faa477'
  tertiary: '#51d6f8'
  on-tertiary: '#003641'
  tertiary-container: '#00b0d1'
  on-tertiary-container: '#003e4b'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#ffdbcd'
  primary-fixed-dim: '#ffb596'
  on-primary-fixed: '#360f00'
  on-primary-fixed-variant: '#7c2e00'
  secondary-fixed: '#ffdbcb'
  secondary-fixed-dim: '#ffb691'
  on-secondary-fixed: '#341100'
  on-secondary-fixed-variant: '#723612'
  tertiary-fixed: '#b0ecff'
  tertiary-fixed-dim: '#51d6f8'
  on-tertiary-fixed: '#001f27'
  on-tertiary-fixed-variant: '#004e5e'
  background: '#1c110c'
  on-background: '#f5ded5'
  surface-variant: '#40322c'
  bg: '#12100E'
  bg-subtle: '#1A1714'
  card-bg: '#1E1B17'
  raised-bg: '#252119'
  border: '#2E2820'
  border-light: '#3A3228'
  text-primary: '#EDE6DA'
  text-secondary: '#C8BFB0'
  text-dim: '#9A8E7E'
  text-muted: '#7A7060'
  accent-light: '#FFAA6A'
  accent-deep: '#FF6030'
  brand-peach: '#E8A87A'
  brand-clay: '#C07040'
  success: '#4CD964'
  danger: '#C45040'
  warning: '#C89040'
  guitar-neon: '#FF2D55'
  piano-midnight: '#0EA5E9'
  bass-violet: '#7C3AED'
  ukulele-teal: '#14B8A6'
  perform-yellow: '#FFE66D'
  perform-cyan: '#4ECDC4'
  perform-coral: '#FF6B6B'
typography:
  display-hero:
    fontFamily: Syne
    fontSize: 28px
    fontWeight: '900'
    lineHeight: '1.1'
    letterSpacing: -0.02em
  display-lg:
    fontFamily: Syne
    fontSize: 20px
    fontWeight: '800'
    lineHeight: '1.2'
    letterSpacing: -0.01em
  display-md:
    fontFamily: Syne
    fontSize: 17px
    fontWeight: '700'
    lineHeight: '1.2'
  heading-md:
    fontFamily: plusJakartaSans
    fontSize: 18px
    fontWeight: '800'
    lineHeight: '1.3'
    letterSpacing: -0.01em
  heading-sm:
    fontFamily: plusJakartaSans
    fontSize: 15px
    fontWeight: '800'
    lineHeight: '1.3'
  body-md:
    fontFamily: plusJakartaSans
    fontSize: 13px
    fontWeight: '400'
    lineHeight: '1.5'
  body-sm:
    fontFamily: plusJakartaSans
    fontSize: 12px
    fontWeight: '600'
    lineHeight: '1.4'
    letterSpacing: 0.3px
  label:
    fontFamily: plusJakartaSans
    fontSize: 11px
    fontWeight: '700'
    lineHeight: '1'
    letterSpacing: 0.3px
  stat-lg:
    fontFamily: JetBrains Mono
    fontSize: 32px
    fontWeight: '900'
    lineHeight: '1'
  button:
    fontFamily: Syne
    fontSize: 12px
    fontWeight: '700'
    lineHeight: '1'
    letterSpacing: 0.03em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 4px
  sp-1: 4px
  sp-2: 8px
  sp-3: 12px
  sp-4: 16px
  sp-5: 24px
  sp-6: 32px
  sp-8: 48px
  container-padding: 14px
  card-padding: 18px
  app-max-width: 480px
---

version: alpha name: SparkSuite — Warm Ember description: > An engine-driven, gamified, ADHD-friendly music learning platform. The visual identity is "Warm Ember": a cozy, lamp-lit dark canvas of warm browns and creams, lifted by a bright copper-orange accent that behaves like a real ember — it glows, it pulses, it casts soft warm light into the surrounding surfaces. Mobile-first, animation-rich, instrument-themed. colors:
── Surface (dark default) ──
bg: "#12100E" bg-subtle: "#1A1714" card-bg: "#1E1B17" raised-bg: "#252119" border: "#2E2820" border-light: "#3A3228" input-bg: "#252119" chip-bg: "#252119" prog-bg: "#2E2820"
── Text (dark default) ──
text-primary: "#EDE6DA" text-secondary: "#C8BFB0" text-dim: "#9A8E7E" text-muted: "#7A7060" text-label: "#9A8E7E"
── Brand / Accent (Ember) ──
primary: "#FF7B3A" accent: "#FF7B3A" accent-light: "#FFAA6A" accent-deep: "#FF6030" brand-copper: "#D4845A" brand-peach: "#E8A87A" brand-clay: "#C07040"
── Semantic ──
success: "#4CD964" danger: "#C45040" warning: "#C89040"
── Light mode mirror ──
light-bg: "#F5F0EA" light-bg-subtle: "#EDE6DC" light-card-bg: "#FAF7F2" light-text-primary: "#2A2420" light-text-secondary: "#5A5048" light-accent: "#C07040" light-border: "#DDD4C8"
── Per-instrument identities ──
Each instrument has its own brand color used for headers, primary actions,
progress fills, and badge tints when that instrument is active.
guitar-warm-ember: "#FF7B3A" # default — copper ember guitar-neon: "#FF2D55" # V2 overlay — hot magenta guitar-tint: "#1A0015" # V2 overlay — dark wine surface tint piano-cool-midnight: "#0EA5E9" # placeholder — cool blue (planned) bass-deep-violet: "#7C3AED" # placeholder — deep violet (planned) ukulele-tropical: "#14B8A6" # placeholder — tropical teal (planned)
── Performance Mode (rhythm-game palette) ──
Used ONLY inside the falling-note rhythm highway. Visually distinct from
the rest of the app to signal "you are now in a game."
perform-cyan: "#4ECDC4" perform-blue: "#45B7D1" perform-mint: "#96CEB4" perform-coral: "#FF6B6B" perform-peach: "#FF8A5C" perform-yellow: "#FFE66D"
── Translucent overlays (8-digit sRGB+alpha; not strict colors per spec) ──
These are alpha-bearing surface treatments — focus rings, glow auras,
the woodgrain page wash. Live here rather than under colors because
the design.md spec restricts that section to opaque hex values.
effects: accent-glow: "#FF7B3A40" # ember at 25% — focus rings, soft glows accent-glow-strong: "#FF7B3A66" # ember at 40% — active button drop-shadows surface-tint-warm: "#D4845A0A" # copper at ~4% — page background wash card-overlay-light: "#FFFFFF08" # white at ~3% — glass card top-down highlight card-glass-fill: "#FFFFFF08" # base fill for glassmorphic cards (dark mode) card-glass-border: "#FFFFFF0F" # 1px hairline border on glass cards press-shadow-inset: "#00000033" # inset pressure shadow on tabs/inputs
typography:
Display — used for product name, hero numbers, level titles, modal headings.
Negative letter-spacing tightens the futuristic feel.
display-hero: fontFamily: Syne fontSize: 28px fontWeight: 900 lineHeight: 1.1 letterSpacing: "-0.02em" display-lg: fontFamily: Syne fontSize: 20px fontWeight: 800 letterSpacing: "-0.01em" display-md: fontFamily: Syne fontSize: 17px fontWeight: 700
Headings — body voice, slightly taller weight scale.
heading-md: fontFamily: Outfit fontSize: 18px fontWeight: 800 letterSpacing: "-0.01em" heading-sm: fontFamily: Outfit fontSize: 15px fontWeight: 800
Body
body-md: fontFamily: Outfit fontSize: 13px fontWeight: 400 lineHeight: 1.5 body-sm: fontFamily: Outfit fontSize: 12px fontWeight: 600 letterSpacing: "0.3px"
Labels & captions — small, bold, slightly tracked.
label: fontFamily: Outfit fontSize: 11px fontWeight: 700 letterSpacing: "0.3px" caption: fontFamily: Outfit fontSize: 10px fontWeight: 700 letterSpacing: "0.5px" micro: fontFamily: Outfit fontSize: 9px fontWeight: 700 letterSpacing: "0.5px"
Numerics — BPM, timers, XP, score. Always mono for tabular alignment.
stat-lg: fontFamily: JetBrains Mono fontSize: 32px fontWeight: 900 lineHeight: 1 stat-md: fontFamily: JetBrains Mono fontSize: 24px fontWeight: 700 lineHeight: 1
Buttons — Syne in uppercase. The display face does the heavy lifting.
button: fontFamily: Syne fontSize: 12px fontWeight: 700 letterSpacing: "0.03em"
spacing:
4px-base scale (the V2 system, retroactively applied as the canonical scale).
sp-1: 4px sp-2: 8px sp-3: 12px sp-4: 16px sp-5: 24px sp-6: 32px sp-8: 48px
Layout-level
app-max-width: 480px app-max-width-tablet: 600px app-max-width-desktop: 1000px container-padding: 14px card-padding: 18px header-padding-y: 14px header-padding-x: 16px bottom-safe-area: 80px touch-target-min: 44px
rounded: none: 0 xs: 4px # tiny chips, kbd keys sm: 6px # tabs, segmented controls DEFAULT: 8px # standard radius (buttons, inputs) lg: 12px # cards, level tabs, larger inputs xl: 16px # rhythm lanes, performance highway, V2 cards 2xl: 20px # modals, hero panels, undo toast pill: 9999px # badges, chips, fully-rounded controls
elevation:
Soft, warm-tinted shadows. Never pure black at full opacity.
flat: "none" card-rest: "0 4px 24px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.04)" card-hover: "0 8px 32px rgba(0,0,0,0.20), inset 0 1px 0 rgba(255,255,255,0.06)" card-light-rest: "0 2px 16px rgba(0,0,0,0.04), inset 0 1px 0 rgba(255,255,255,0.80)" button-rest: "0 4px 12px rgba(255,123,58,0.20), inset 0 1px 0 rgba(255,255,255,0.15)" button-hover: "0 6px 20px rgba(255,123,58,0.30), inset 0 1px 0 rgba(255,255,255,0.20)" button-press: "0 2px 8px rgba(255,123,58,0.15)" modal: "0 24px 80px rgba(0,0,0,0.40)" toast: "0 8px 30px rgba(0,0,0,0.50)" highway: "0 8px 40px rgba(0,0,0,0.30), inset 0 0 60px rgba(0,0,0,0.20)" pressed-inset: "inset 0 2px 8px rgba(0,0,0,0.20)" glow-ember: "0 0 16px rgba(255,123,58,0.40), 0 0 32px rgba(255,123,58,0.20)" glow-ember-soft: "0 0 12px rgba(255,123,58,0.08)"
blur: card: "blur(8px)" header: "blur(16px) saturate(1.5)" modal-backdrop: "blur(8px)" toast: "blur(16px)"
motion: ease-standard: "cubic-bezier(0.4, 0, 0.2, 1)" duration-quick: 150ms duration-base: 200ms duration-page: 250ms duration-slow: 300ms duration-celebration: 400ms hover-lift: "translateY(-2px)" hover-lift-soft: "translateY(-1px)" press-shrink: "scale(0.97)" active-grow: "scale(1.05)" stagger-step: 50ms
gradients:
The brand mark is a tri-stop horizontal gradient — copper through peach
back to clay. Read left-to-right it suggests a flame curling up.
brand-text: "linear-gradient(135deg, #D4845A, #E8A87A, #C07040)" brand-text-glow: "linear-gradient(135deg, #FF7B3A, #FFAA6A, #FF6030)"
The button gradient is a tighter, hotter version of the brand mark.
button-primary: "linear-gradient(135deg, #FF7B3A, #FFAA6A)"
Card surfaces in glass mode get a near-invisible top-down gradient.
card-glass: "linear-gradient(145deg, rgba(255,255,255,0.03), rgba(255,255,255,0.01))"
Page background — two ember-tinted radial pools plus woodgrain stripes.
page-warm: > radial-gradient(ellipse 120% 60% at 20% -10%, rgba(255,123,58,0.06), transparent 50%), radial-gradient(ellipse 80% 80% at 80% 110%, rgba(255,123,58,0.04), transparent 50%)
components: card: backgroundColor: "{colors.card-bg}" textColor: "{colors.text-primary}" rounded: "{rounded.lg}" padding: 18px card-glass: backgroundColor: "rgba(255,255,255,0.03)" textColor: "{colors.text-primary}" rounded: "{rounded.lg}" padding: 18px
header: backgroundColor: "rgba(18,16,14,0.85)" textColor: "{colors.text-primary}" padding: 14px
button-primary: backgroundColor: "{colors.accent}" textColor: "#FFFFFF" typography: "{typography.button}" rounded: "{rounded.DEFAULT}" height: 44px padding: 12px 24px button-primary-hover: backgroundColor: "{colors.accent-light}" button-ghost: backgroundColor: "transparent" textColor: "{colors.text-secondary}" typography: "{typography.button}" rounded: "{rounded.DEFAULT}" height: 44px padding: 12px 24px
tabs-container: backgroundColor: "{colors.raised-bg}" rounded: "{rounded.DEFAULT}" padding: 3px tab: backgroundColor: "transparent" textColor: "{colors.text-muted}" rounded: "{rounded.sm}" height: 48px padding: 8px 10px tab-active: backgroundColor: "{colors.accent}" textColor: "{colors.bg}"
input: backgroundColor: "{colors.input-bg}" textColor: "{colors.text-primary}" typography: "{typography.body-md}" rounded: "{rounded.lg}" height: 44px padding: 10px 14px
badge-xp: backgroundColor: "rgba(255,123,58,0.10)" textColor: "{colors.accent}" typography: "{typography.label}" rounded: "{rounded.sm}" padding: 4px 10px badge-streak: backgroundColor: "rgba(196,80,64,0.10)" textColor: "{colors.danger}" typography: "{typography.label}" rounded: "{rounded.sm}" padding: 4px 10px
chip: backgroundColor: "{colors.chip-bg}" textColor: "{colors.text-muted}" typography: "{typography.body-sm}" rounded: "{rounded.DEFAULT}" padding: 6px 14px chip-selected: backgroundColor: "rgba(76,217,100,0.10)" textColor: "{colors.success}"
progress-bar: backgroundColor: "{colors.prog-bg}" height: 6px rounded: "{rounded.xs}" progress-fill: backgroundColor: "{colors.accent}" rounded: "{rounded.xs}"
toast-undo: backgroundColor: "{colors.card-bg}" textColor: "{colors.text-primary}" typography: "{typography.body-sm}" rounded: "{rounded.xl}" padding: 14px 24px
modal: backgroundColor: "{colors.card-bg}" textColor: "{colors.text-primary}" rounded: "{rounded.2xl}" padding: 24px
rhythm-highway: backgroundColor: "{colors.input-bg}" rounded: "{rounded.xl}" height: 130px rhythm-event-perfect: backgroundColor: "{colors.perform-yellow}" textColor: "#333333" rhythm-event-good: backgroundColor: "{colors.perform-cyan}" textColor: "#FFFFFF" rhythm-event-miss: backgroundColor: "{colors.perform-coral}" textColor: "#FFFFFF"
launcher-card: backgroundColor: "{colors.card-bg}" textColor: "{colors.text-primary}" rounded: "{rounded.lg}" padding: 24px 16px width: 200px