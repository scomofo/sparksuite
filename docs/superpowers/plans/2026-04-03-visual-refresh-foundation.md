# Visual Refresh: Foundation + Home Dashboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace SparkSuite's generic warm-ember aesthetic with a Vibrant Playground neon system where each instrument owns its color identity, starting with the CSS foundation and home dashboard.

**Architecture:** Add `spark-visual-v2.css` alongside existing stylesheets (non-destructive). Add `js/ui/theme.js` for instrument-aware CSS variable switching. Rebuild the home dashboard renderer to use instrument-first hub layout with neon theming. All changes are additive — existing pages continue working.

**Tech Stack:** Vanilla CSS, vanilla JavaScript (IIFE pattern), Google Fonts, CSS custom properties, CSS animations

---

### Task 1: Add new fonts and CSS foundation

**Files:**
- Create: `spark-visual-v2.css`
- Modify: `index.html` (add stylesheet + font links)

- [ ] **Step 1: Add Google Fonts links to index.html**

In `index.html`, find the `<head>` section. Add before the existing `<link rel="stylesheet" href="styles.css">`:

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Space+Grotesk:wght@400;500;600;700&family=JetBrains+Mono:wght@400;700&display=swap" rel="stylesheet">
```

NOTE: If Space Grotesk feels too common during implementation, substitute with another geometric display font from Google Fonts (e.g., Manrope, Urbanist). The key is bold personality for headings.

- [ ] **Step 2: Create `spark-visual-v2.css`**

```css
/* ═══════════════════════════════════════════════════════════════════
   SparkSuite Visual v2 — Vibrant Playground (Neon Edition)
   Non-destructive layer over existing styles.css and spark-visual.css
   ═══════════════════════════════════════════════════════════════════ */

/* ===== Instrument Theme Variables ===== */
:root {
  /* Default to guitar */
  --inst-primary: #ff2d55;
  --inst-glow: rgba(255,45,85,0.3);
  --inst-tint: #1a0015;
  --inst-primary-rgb: 255,45,85;
  --inst-gradient: linear-gradient(135deg, #ff2d55, #ff6666);

  /* Spacing scale (4px base) */
  --sp-1: 4px;
  --sp-2: 8px;
  --sp-3: 12px;
  --sp-4: 16px;
  --sp-5: 24px;
  --sp-6: 32px;
  --sp-8: 48px;

  /* Type scale */
  --text-hero: 28px;
  --text-heading: 18px;
  --text-subheading: 14px;
  --text-body: 13px;
  --text-caption: 11px;
  --text-micro: 9px;
  --text-stat: 24px;

  /* Font families */
  --font-display-v2: 'Space Grotesk', 'Syne', sans-serif;
  --font-body-v2: 'Plus Jakarta Sans', 'Outfit', system-ui, sans-serif;
  --font-mono-v2: 'JetBrains Mono', 'DM Sans', Consolas, monospace;

  /* V2 overrides */
  --radius-v2: 16px;
  --radius-sm-v2: 10px;
  --radius-pill: 20px;
}

/* ===== V2 Dark Base (overrides warm ember when v2 active) ===== */
body.sv2 {
  --bg: #0a0a12;
  --bg-subtle: #10101a;
  --card-bg: #141420;
  --raised-bg: #1a1a28;
  --border: #1e1e30;
  --border-light: #2a2a3e;
  --input-bg: #1a1a28;
  --tab-bg: #141420;
  --tab-inactive: #555;
  --tab-active-bg: var(--inst-primary);
  --tab-active-color: #fff;
  --prog-bg: #1e1e30;
  --chip-bg: #1a1a28;
  --chip-color: #888;
  background-image:
    radial-gradient(ellipse 60% 40% at 50% 0%, rgba(var(--inst-primary-rgb), 0.04), transparent 70%);
}

/* ===== V2 Component Classes ===== */

/* Card */
.sv2-card {
  background: var(--card-bg);
  border: 1px solid var(--border);
  border-radius: var(--radius-v2);
  padding: var(--sp-4);
  transition: all 0.3s ease;
}

/* Instrument-themed card */
.sv2-card--inst {
  border-color: rgba(var(--inst-primary-rgb), 0.15);
  background: linear-gradient(160deg, var(--inst-tint), var(--card-bg));
  box-shadow: 0 4px 24px rgba(var(--inst-primary-rgb), 0.08);
  position: relative;
  overflow: hidden;
}
.sv2-card--inst::before {
  content: '';
  position: absolute;
  top: -50%;
  right: -20%;
  width: 200px;
  height: 200px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(var(--inst-primary-rgb), 0.08), transparent 70%);
  pointer-events: none;
}

/* Buttons */
.sv2-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--sp-2);
  min-height: 44px;
  padding: var(--sp-3) var(--sp-5);
  border: none;
  border-radius: var(--radius-sm-v2);
  font-family: var(--font-body-v2);
  font-size: var(--text-subheading);
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s ease;
}
.sv2-btn:active { transform: scale(0.97); }

.sv2-btn--primary {
  background: var(--inst-gradient);
  color: #fff;
  box-shadow: 0 4px 16px rgba(var(--inst-primary-rgb), 0.3);
}
.sv2-btn--primary:hover {
  box-shadow: 0 6px 24px rgba(var(--inst-primary-rgb), 0.4);
  transform: translateY(-1px);
}

.sv2-btn--ghost {
  background: rgba(255,255,255,0.05);
  color: var(--text-muted);
  border: 1px solid var(--border);
}
.sv2-btn--ghost:hover {
  background: rgba(255,255,255,0.08);
  color: var(--text-secondary);
}

/* Badge pills */
.sv2-badge {
  display: inline-flex;
  align-items: center;
  gap: var(--sp-1);
  padding: 3px var(--sp-2);
  border-radius: 6px;
  font-size: var(--text-micro);
  font-weight: 700;
  font-family: var(--font-body-v2);
  background: rgba(var(--inst-primary-rgb), 0.12);
  color: var(--inst-primary);
}

/* Icon container (replaces raw emoji) */
.sv2-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-v2);
  background: var(--inst-gradient);
  box-shadow: 0 4px 16px rgba(var(--inst-primary-rgb), 0.3);
  flex-shrink: 0;
}
.sv2-icon--sm { width: 32px; height: 32px; font-size: 16px; border-radius: 10px; }
.sv2-icon--md { width: 48px; height: 48px; font-size: 24px; }
.sv2-icon--lg { width: 56px; height: 56px; font-size: 28px; }

/* Progress ring */
.sv2-ring { position: relative; display: inline-flex; align-items: center; justify-content: center; }
.sv2-ring__label {
  position: absolute;
  font-family: var(--font-mono-v2);
  font-weight: 700;
  color: var(--text-primary);
}

/* Stat number */
.sv2-stat {
  font-family: var(--font-mono-v2);
  font-size: var(--text-stat);
  font-weight: 700;
  line-height: 1;
}

/* Section heading */
.sv2-heading {
  font-family: var(--font-display-v2);
  font-weight: 700;
  color: var(--text-primary);
}

/* ===== Home Dashboard V2 ===== */

.sv2-home-hero {
  border-radius: var(--radius-pill);
  padding: var(--sp-5);
  position: relative;
  overflow: hidden;
  border: 1px solid rgba(var(--inst-primary-rgb), 0.15);
  background: linear-gradient(160deg, var(--inst-tint), rgba(var(--inst-primary-rgb), 0.03), var(--card-bg));
  margin-bottom: var(--sp-4);
}
.sv2-home-hero::before {
  content: '';
  position: absolute;
  top: -60px;
  right: -40px;
  width: 180px;
  height: 180px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(var(--inst-primary-rgb), 0.12), transparent 70%);
  pointer-events: none;
}

.sv2-home-hero__header {
  display: flex;
  align-items: center;
  gap: var(--sp-3);
  position: relative;
  z-index: 1;
}

.sv2-home-hero__info { flex: 1; }

.sv2-home-hero__name {
  font-family: var(--font-display-v2);
  font-size: var(--text-hero);
  font-weight: 700;
  color: #fff;
  margin: 0;
  line-height: 1.1;
}

.sv2-home-hero__level {
  font-size: var(--text-caption);
  color: rgba(255,255,255,0.5);
  margin-top: 2px;
}

.sv2-home-hero__badges {
  display: flex;
  gap: var(--sp-1);
  margin-top: var(--sp-2);
  flex-wrap: wrap;
}

.sv2-home-hero__actions {
  display: flex;
  gap: var(--sp-2);
  margin-top: var(--sp-4);
  position: relative;
  z-index: 1;
}
.sv2-home-hero__actions .sv2-btn { flex: 1; font-size: var(--text-caption); padding: var(--sp-3); }
.sv2-home-hero__actions .sv2-btn--primary { border-radius: var(--radius-sm-v2); }

/* Inactive instrument row */
.sv2-inst-row {
  display: flex;
  gap: var(--sp-2);
  margin-bottom: var(--sp-4);
}
.sv2-inst-row__item {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 6px;
  background: var(--card-bg);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm-v2);
  padding: var(--sp-2);
  cursor: pointer;
  transition: all 0.2s ease;
}
.sv2-inst-row__item:hover {
  border-color: rgba(var(--inst-primary-rgb), 0.3);
  background: var(--raised-bg);
}
.sv2-inst-row__item .sv2-icon--sm {
  width: 28px; height: 28px; font-size: 14px; border-radius: 8px;
}

/* Daily goal card */
.sv2-daily-goal {
  display: flex;
  align-items: center;
  gap: var(--sp-3);
  background: var(--card-bg);
  border: 1px solid var(--border);
  border-radius: var(--radius-v2);
  padding: var(--sp-3);
}

/* ===== V2 Animations ===== */
@keyframes sv2-slideUp {
  from { opacity: 0; transform: translateY(16px); }
  to { opacity: 1; transform: translateY(0); }
}
@keyframes sv2-popIn {
  0% { opacity: 0; transform: scale(0.8); }
  70% { transform: scale(1.05); }
  100% { opacity: 1; transform: scale(1); }
}
@keyframes sv2-pulseGlow {
  0%, 100% { box-shadow: 0 4px 16px rgba(var(--inst-primary-rgb), 0.2); }
  50% { box-shadow: 0 4px 24px rgba(var(--inst-primary-rgb), 0.4); }
}
@keyframes sv2-stagger1 { from { opacity:0; transform:translateY(12px) } to { opacity:1; transform:translateY(0) } }
@keyframes sv2-stagger2 { from { opacity:0; transform:translateY(12px) } to { opacity:1; transform:translateY(0) } }
@keyframes sv2-stagger3 { from { opacity:0; transform:translateY(12px) } to { opacity:1; transform:translateY(0) } }

.sv2-anim-hero { animation: sv2-slideUp 0.4s ease-out both; }
.sv2-anim-stagger-1 { animation: sv2-stagger1 0.3s ease-out 0.1s both; }
.sv2-anim-stagger-2 { animation: sv2-stagger2 0.3s ease-out 0.2s both; }
.sv2-anim-stagger-3 { animation: sv2-stagger3 0.3s ease-out 0.3s both; }
.sv2-anim-badge { animation: sv2-popIn 0.3s ease-out both; }
.sv2-anim-glow { animation: sv2-pulseGlow 3s ease-in-out infinite; }
```

- [ ] **Step 3: Add stylesheet link to index.html**

Add after the existing `<link rel="stylesheet" href="spark-visual.css">`:

```html
<link rel="stylesheet" href="spark-visual-v2.css">
```

- [ ] **Step 4: Commit**

```bash
git add spark-visual-v2.css index.html
git commit -m "feat: add spark-visual-v2.css foundation with neon instrument theming"
```

---

### Task 2: Create instrument theme engine

**Files:**
- Create: `js/ui/theme.js`
- Modify: `index.html` (add script tag)

- [ ] **Step 1: Create `js/ui/theme.js`**

```javascript
// js/ui/theme.js
// Instrument-aware CSS theme engine.
// Updates CSS custom properties when the active instrument changes.
(function() {
  'use strict';

  var INSTRUMENT_THEMES = {
    guitar:  { primary: "#ff2d55", glow: "rgba(255,45,85,0.3)",  tint: "#1a0015", rgb: "255,45,85",  icon: "\uD83C\uDFB8" },
    ukulele: { primary: "#ff0080", glow: "rgba(255,0,128,0.3)",  tint: "#1a0020", rgb: "255,0,128",  icon: "\uD83C\uDFB6" },
    piano:   { primary: "#0088ff", glow: "rgba(0,136,255,0.3)",  tint: "#001a30", rgb: "0,136,255",   icon: "\uD83C\uDFB9" },
    bass:    { primary: "#00ff64", glow: "rgba(0,255,100,0.3)",  tint: "#001a0a", rgb: "0,255,100",   icon: "\uD83C\uDFB8" },
    drums:   { primary: "#aa44ff", glow: "rgba(170,68,255,0.3)", tint: "#150030", rgb: "170,68,255",  icon: "\uD83E\uDD41" }
  };

  function applyInstrumentTheme(instrumentType) {
    var t = INSTRUMENT_THEMES[instrumentType] || INSTRUMENT_THEMES.guitar;
    var root = document.documentElement;
    root.style.setProperty("--inst-primary", t.primary);
    root.style.setProperty("--inst-glow", t.glow);
    root.style.setProperty("--inst-tint", t.tint);
    root.style.setProperty("--inst-primary-rgb", t.rgb);
    root.style.setProperty("--inst-gradient", "linear-gradient(135deg," + t.primary + "," + t.primary + "88)");

    // Activate v2 theme class
    document.body.classList.add("sv2");
  }

  function getInstrumentTheme(instrumentType) {
    return INSTRUMENT_THEMES[instrumentType] || INSTRUMENT_THEMES.guitar;
  }

  function getInstrumentColor(instrumentType) {
    var t = INSTRUMENT_THEMES[instrumentType] || INSTRUMENT_THEMES.guitar;
    return t.primary;
  }

  window.SparkTheme = {
    apply: applyInstrumentTheme,
    get: getInstrumentTheme,
    getColor: getInstrumentColor,
    themes: INSTRUMENT_THEMES
  };
})();
```

- [ ] **Step 2: Add script tag to index.html**

Add after `js/ui/stringed_chord_svg.js` and before the instrument modules:

```html
<script src="js/ui/theme.js"></script>
```

- [ ] **Step 3: Commit**

```bash
git add js/ui/theme.js index.html
git commit -m "feat: add instrument theme engine with neon color system"
```

---

### Task 3: Wire theme into render cycle

**Files:**
- Modify: `js/app.js`

- [ ] **Step 1: Add theme application to render function**

In `js/app.js`, find `_renderInner()` (around line 3679). After the block that sets `logoText.textContent` (around line 3695-3696), add:

```javascript
    // Apply instrument theme
    if (typeof SparkTheme !== "undefined" && _inst) {
      SparkTheme.apply(_inst.instrument || "guitar");
    }
```

- [ ] **Step 2: Commit**

```bash
git add js/app.js
git commit -m "feat: wire instrument theme into render cycle"
```

---

### Task 4: Rebuild home dashboard with instrument-first hub

**Files:**
- Modify: `js/pages/practice.js` (replace `homePage` function)

This is the biggest task. The `homePage()` function builds the tab bar and routes to tab renderers. We add a v2 home dashboard that renders above the existing tab content when the sv2 theme is active.

- [ ] **Step 1: Add v2 home dashboard builder function**

In `js/pages/practice.js`, add a new function BEFORE the existing `homePage()` function (before line 3):

```javascript
function sv2HomeDashboard() {
  var inst = SparkInstruments.getActive();
  if (!inst) return "";
  var D = inst.getData ? inst.getData() : {};
  var instrumentType = inst.instrument || "guitar";
  var theme = typeof SparkTheme !== "undefined" ? SparkTheme.get(instrumentType) : null;
  if (!theme) return "";

  var allInstruments = typeof SparkInstruments !== "undefined" ? SparkInstruments.getAll() : [];
  var levelNames = D.LN || {};
  var levelName = levelNames[S.level] || ("Level " + S.level);
  var chordCount = D.ALL_CHORDS ? D.ALL_CHORDS.length : 0;
  var masteredCount = 0;
  if (D.ALL_CHORDS) {
    for (var i = 0; i < D.ALL_CHORDS.length; i++) {
      if ((S.chordProgress[D.ALL_CHORDS[i].name] || 0) >= 100) masteredCount++;
    }
  }

  // Daily goal
  var goalPct = Math.min(100, Math.round((S.todayPracticeSeconds / (S.dailyGoalMinutes * 60)) * 100));
  var goalMins = Math.floor(S.todayPracticeSeconds / 60);

  var h = '';

  // Hero card
  h += '<div class="sv2-home-hero sv2-anim-hero">';
  h += '<div class="sv2-home-hero__header">';
  h += '<div class="sv2-icon sv2-icon--lg sv2-anim-glow">' + (inst.icon || "\uD83C\uDFB8") + '</div>';
  h += '<div class="sv2-home-hero__info">';
  h += '<h2 class="sv2-home-hero__name">' + escHTML(inst.name) + '</h2>';
  h += '<div class="sv2-home-hero__level">' + escHTML(levelName) + ' &mdash; Level ' + S.level + '</div>';
  h += '<div class="sv2-home-hero__badges">';
  h += '<span class="sv2-badge sv2-anim-badge" style="animation-delay:0.1s">' + S.xp + ' XP</span>';
  h += '<span class="sv2-badge sv2-anim-badge" style="animation-delay:0.15s;background:rgba(255,215,61,0.12);color:#ffd93d">\uD83D\uDD25 ' + S.streak + '</span>';
  h += '<span class="sv2-badge sv2-anim-badge" style="animation-delay:0.2s;background:rgba(107,203,119,0.12);color:#6bcb77">' + masteredCount + '/' + chordCount + ' chords</span>';
  h += '</div></div></div>';

  // Action buttons inside hero
  h += '<div class="sv2-home-hero__actions">';
  h += '<button class="sv2-btn sv2-btn--primary" onclick="act(\'quickStart\')">&#9654; Practice</button>';
  h += '<button class="sv2-btn sv2-btn--ghost" onclick="act(\'tab\',\'songs\')">\uD83C\uDFB5 Songs</button>';
  h += '<button class="sv2-btn sv2-btn--ghost" onclick="act(\'tab\',\'games\')">\uD83C\uDFAE Play</button>';
  h += '</div>';
  h += '</div>';

  // Inactive instruments row
  var otherInstruments = [];
  for (var j = 0; j < allInstruments.length; j++) {
    if (allInstruments[j].id !== inst.id && allInstruments[j].available !== false) {
      otherInstruments.push(allInstruments[j]);
    }
  }
  if (otherInstruments.length > 0) {
    h += '<div class="sv2-inst-row sv2-anim-stagger-1">';
    for (var k = 0; k < otherInstruments.length; k++) {
      var oi = otherInstruments[k];
      var oiColor = typeof SparkTheme !== "undefined" ? SparkTheme.getColor(oi.instrument) : "#888";
      h += '<div class="sv2-inst-row__item" onclick="act(\'switchInstrument\',\'' + oi.id + '\')">';
      h += '<div class="sv2-icon sv2-icon--sm" style="background:' + oiColor + '">' + (oi.icon || "\uD83C\uDFB5") + '</div>';
      h += '<div style="font-size:' + 'var(--text-micro)' + ';color:' + oiColor + ';font-weight:700;font-family:var(--font-body-v2)">' + escHTML(oi.name) + '</div>';
      h += '</div>';
    }
    h += '</div>';
  }

  // Daily goal
  h += '<div class="sv2-daily-goal sv2-anim-stagger-2">';
  h += '<div class="sv2-ring" style="width:40px;height:40px">';
  var ringR = 16, ringC = 2 * Math.PI * ringR, ringOff = ringC - (goalPct / 100) * ringC;
  h += '<svg width="40" height="40" style="transform:rotate(-90deg)"><circle cx="20" cy="20" r="' + ringR + '" fill="none" stroke="var(--border)" stroke-width="4"/>';
  h += '<circle cx="20" cy="20" r="' + ringR + '" fill="none" stroke="var(--inst-primary)" stroke-width="4" stroke-dasharray="' + ringC + '" stroke-dashoffset="' + ringOff + '" stroke-linecap="round" style="transition:stroke-dashoffset 0.8s ease"/></svg>';
  h += '<div class="sv2-ring__label" style="font-size:10px">' + goalPct + '%</div>';
  h += '</div>';
  h += '<div style="flex:1">';
  h += '<div style="font-size:var(--text-caption);font-weight:700;color:var(--text-primary);font-family:var(--font-body-v2)">' + (S.goalReachedToday ? "\u2705 Goal reached!" : "Daily Goal: " + S.dailyGoalMinutes + " min") + '</div>';
  h += '<div style="font-size:var(--text-micro);color:var(--text-muted)">' + goalMins + ' / ' + S.dailyGoalMinutes + ' min today' + (S.goalStreak > 0 ? " &middot; \uD83D\uDD25 " + S.goalStreak + " day streak" : "") + '</div>';
  h += '</div></div>';

  return h;
}
```

- [ ] **Step 2: Integrate v2 dashboard into homePage**

In the existing `homePage()` function (line 3 of `js/pages/practice.js`), add the v2 dashboard at the start, before the tab bar. Change the beginning of `homePage()` from:

```javascript
function homePage(){
  // Build tab bar from active instrument's tabs array
  var inst = SparkInstruments.getActive();
```

To:

```javascript
function homePage(){
  // V2 Dashboard
  var v2Home = typeof sv2HomeDashboard === "function" && document.body.classList.contains("sv2") ? sv2HomeDashboard() : "";

  // Build tab bar from active instrument's tabs array
  var inst = SparkInstruments.getActive();
```

Then at the end of the function, before `return h;`, change to:

```javascript
  return v2Home + h;
```

This places the v2 hero dashboard above the existing tab navigation, preserving all existing functionality.

- [ ] **Step 3: Commit**

```bash
git add js/pages/practice.js
git commit -m "feat: add instrument-first home dashboard with neon theming"
```

---

### Task 5: Update header to use instrument theming

**Files:**
- Modify: `styles.css` (add v2 header overrides)

- [ ] **Step 1: Add v2 header styles to end of styles.css**

Append to the end of `styles.css`:

```css
/* ===== V2 Header Overrides ===== */
body.sv2 .header {
  background: rgba(10,10,18,0.95);
  border-bottom-color: var(--border);
  backdrop-filter: blur(12px);
}
body.sv2 .logo-text {
  font-family: var(--font-display-v2);
  background: var(--inst-gradient);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}
body.sv2 .stat-xp {
  background: rgba(var(--inst-primary-rgb), 0.1);
  color: var(--inst-primary);
  border-color: rgba(var(--inst-primary-rgb), 0.2);
}
body.sv2 .tab.active {
  background: var(--inst-primary);
  color: #fff;
}
body.sv2 .tabs {
  background: var(--card-bg);
  border-color: var(--border);
}
```

- [ ] **Step 2: Commit**

```bash
git add styles.css
git commit -m "feat: add v2 header overrides with instrument-colored logo and tabs"
```

---

### Task 6: Add confetti and XP float systems

**Files:**
- Create: `js/ui/confetti.js`
- Create: `js/ui/xp-float.js`
- Modify: `index.html` (add script tags)

- [ ] **Step 1: Create `js/ui/confetti.js`**

```javascript
// js/ui/confetti.js
// Confetti burst system for celebrations.
// SparkConfetti.burst({ count, colors, origin })
(function() {
  'use strict';

  function burst(options) {
    options = options || {};
    var count = options.count || 40;
    var origin = options.origin || { x: 50, y: 40 };
    var instRgb = getComputedStyle(document.documentElement).getPropertyValue("--inst-primary-rgb").trim() || "255,45,85";
    var colors = options.colors || [
      "rgba(" + instRgb + ",1)",
      "rgba(" + instRgb + ",0.7)",
      "#ffd93d",
      "#6bcb77",
      "#fff"
    ];

    var container = document.createElement("div");
    container.style.cssText = "position:fixed;inset:0;pointer-events:none;z-index:9999;overflow:hidden";
    document.body.appendChild(container);

    for (var i = 0; i < count; i++) {
      var p = document.createElement("div");
      var size = 6 + Math.random() * 8;
      var angle = Math.random() * Math.PI * 2;
      var velocity = 200 + Math.random() * 400;
      var dx = Math.cos(angle) * velocity;
      var dy = Math.sin(angle) * velocity - 200;
      var rotation = Math.random() * 720 - 360;
      var color = colors[Math.floor(Math.random() * colors.length)];
      var isRound = Math.random() > 0.5;

      p.style.cssText = "position:absolute;width:" + size + "px;height:" + size + "px;" +
        "left:" + origin.x + "%;top:" + origin.y + "%;" +
        "background:" + color + ";" +
        "border-radius:" + (isRound ? "50%" : "2px") + ";" +
        "opacity:1;" +
        "transform:translate(0,0) rotate(0deg);" +
        "transition:none;";

      container.appendChild(p);

      (function(el, finalX, finalY, rot, delay) {
        setTimeout(function() {
          el.style.transition = "all 1.5s cubic-bezier(0.25,0.46,0.45,0.94)";
          el.style.transform = "translate(" + finalX + "px," + finalY + "px) rotate(" + rot + "deg)";
          el.style.opacity = "0";
        }, delay);
      })(p, dx, dy + 600, rotation, Math.random() * 200);
    }

    setTimeout(function() {
      if (container.parentNode) container.parentNode.removeChild(container);
    }, 2500);
  }

  window.SparkConfetti = { burst: burst };
})();
```

- [ ] **Step 2: Create `js/ui/xp-float.js`**

```javascript
// js/ui/xp-float.js
// Floating XP popup animation.
// SparkXPFloat.show(amount, anchorElement)
(function() {
  'use strict';

  function show(amount, anchorEl) {
    if (!amount) return;
    var rect = anchorEl ? anchorEl.getBoundingClientRect() : { left: window.innerWidth / 2, top: window.innerHeight / 2 };
    var el = document.createElement("div");
    el.textContent = "+" + amount + " XP";
    el.style.cssText =
      "position:fixed;z-index:9999;pointer-events:none;" +
      "left:" + rect.left + "px;top:" + rect.top + "px;" +
      "font-family:var(--font-mono-v2,monospace);font-size:16px;font-weight:700;" +
      "color:var(--inst-primary,#ffd93d);" +
      "text-shadow:0 0 12px var(--inst-glow,rgba(255,215,61,0.5));" +
      "opacity:1;transform:translateY(0);" +
      "transition:all 1s ease-out;";
    document.body.appendChild(el);

    requestAnimationFrame(function() {
      el.style.transform = "translateY(-40px)";
      el.style.opacity = "0";
    });

    setTimeout(function() {
      if (el.parentNode) el.parentNode.removeChild(el);
    }, 1200);
  }

  window.SparkXPFloat = { show: show };
})();
```

- [ ] **Step 3: Add script tags to index.html**

Add after `js/ui/theme.js`:

```html
<script src="js/ui/confetti.js"></script>
<script src="js/ui/xp-float.js"></script>
```

- [ ] **Step 4: Commit**

```bash
git add js/ui/confetti.js js/ui/xp-float.js index.html
git commit -m "feat: add confetti burst and XP float animation systems"
```

---

### Task 7: Wire confetti into completion and render

**Files:**
- Modify: `js/app.js`

- [ ] **Step 1: Replace basic confetti with SparkConfetti in render**

In `js/app.js`, find the confetti rendering block in `_renderInner()` (around line 3704-3710):

```javascript
  if(S.showConfetti){
    var cols=["#FF6B6B","#4ECDC4","#45B7D1","#FFE66D","#96CEB4","#FF8A5C"];
    h+='<div style="position:fixed;inset:0;pointer-events:none;z-index:999">';
    for(var i=0;i<40;i++)
      h+='<div style="position:absolute;left:'+Math.random()*100+'%;top:-20px;width:10px;height:10px;border-radius:'+(Math.random()>0.5?"50%":"2px")+';background:'+cols[i%6]+';animation:cF '+(1.5+Math.random())+'s ease-in forwards;animation-delay:'+Math.random()*0.5+'s"></div>';
    h+='</div>';
  }
```

Replace with:

```javascript
  if(S.showConfetti){
    // Use SparkConfetti if available (v2), else fall back to inline confetti
    if (typeof SparkConfetti !== "undefined") {
      if (!S._confettiFired) {
        S._confettiFired = true;
        SparkConfetti.burst();
        setTimeout(function() { S._confettiFired = false; }, 2600);
      }
    } else {
      var cols=["#FF6B6B","#4ECDC4","#45B7D1","#FFE66D","#96CEB4","#FF8A5C"];
      h+='<div style="position:fixed;inset:0;pointer-events:none;z-index:999">';
      for(var i=0;i<40;i++)
        h+='<div style="position:absolute;left:'+Math.random()*100+'%;top:-20px;width:10px;height:10px;border-radius:'+(Math.random()>0.5?"50%":"2px")+';background:'+cols[i%6]+';animation:cF '+(1.5+Math.random())+'s ease-in forwards;animation-delay:'+Math.random()*0.5+'s"></div>';
      h+='</div>';
    }
  }
```

- [ ] **Step 2: Commit**

```bash
git add js/app.js
git commit -m "feat: wire SparkConfetti into completion celebrations"
```

---

### Task 8: Add escHTML to stringed_chord_svg.js for safety

**Files:**
- Modify: `js/ui/stringed_chord_svg.js`

The code review identified that `escHTML` is defined in `js/ui.js` but used in `stringed_chord_svg.js` which loads earlier. Add a local fallback.

- [ ] **Step 1: Add escHTML guard at top of IIFE**

In `js/ui/stringed_chord_svg.js`, after `(function() {` and `'use strict';`, add:

```javascript
  // Local escHTML fallback — ui.js defines the global version but loads later
  var _escHTML = typeof escHTML === "function" ? escHTML : function(s) {
    return String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
  };
```

Then replace all 5 occurrences of `escHTML(` in the file with `_escHTML(`.

- [ ] **Step 2: Commit**

```bash
git add js/ui/stringed_chord_svg.js
git commit -m "fix: add local escHTML fallback in stringed_chord_svg.js"
```

---

### Task 9: Visual verification and cleanup

**Files:**
- Modify: `docs/engineering/migration-checklist.md` (add visual refresh tracking)

- [ ] **Step 1: Update migration checklist**

Add a new section to `docs/engineering/migration-checklist.md`:

```markdown
## Visual Refresh (Vibrant Playground)

| Component | V2 Styled | Status |
|-----------|----------|--------|
| CSS Foundation | spark-visual-v2.css | Complete |
| Theme Engine | js/ui/theme.js | Complete |
| Home Dashboard | sv2HomeDashboard() | Complete |
| Header/Logo | v2 overrides | Complete |
| Tab Active State | Instrument colored | Complete |
| Confetti System | SparkConfetti.burst() | Complete |
| XP Float | SparkXPFloat.show() | Complete |
| Session Page | Not yet | Pending |
| Completion Page | Not yet | Pending |
| Chord Diagram Glow | Not yet | Pending |
| Focus Toggle | Not yet | Pending |
```

- [ ] **Step 2: Commit all and push**

```bash
git add docs/engineering/migration-checklist.md
git commit -m "docs: track visual refresh progress in migration checklist"
git push origin master
```
