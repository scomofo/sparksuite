(function() {
"use strict";

/* ── Constants (from spark_game/config.py) ── */
var DEFAULTS = {
  HIGHWAY_TOP_WIDTH: 200,
  HIGHWAY_BOTTOM_WIDTH: 700,
  HORIZON_Y_RATIO: 0.11,
  HIT_LINE_Y_RATIO: 0.81,
  PERSPECTIVE_FACTOR: 2.5,
  LOOKAHEAD_SEC: 3.0,
  FRET_BAR_INTERVAL_SEC: 0.5,
  PARTICLE_POOL_SIZE: 64,
  HIT_BURST_MS: 300,
  HIGHWAY_SLICES: 120,
};

/* ── Skin presets ── */
var GUITAR_SKIN = {
  laneCount: 6,
  noteShape: "circle",
  laneColors: [
    [255, 50, 50],
    [255, 180, 0],
    [255, 255, 50],
    [50, 180, 255],
    [50, 255, 50],
    [200, 50, 255],
  ],
  laneIndicatorStyle: "buttons",
  laneSpacing: 80,
  backgroundColors: { top: [10, 10, 20], bottom: [30, 30, 50] },
};

var PIANO_SKIN = {
  laneCount: 24,
  noteShape: "rect",
  laneColors: null,
  laneIndicatorStyle: "keys",
  laneSpacing: 28,
  backgroundColors: { top: [10, 10, 20], bottom: [25, 25, 40] },
  centerNote: 60,
};

/* ── Perspective math (from spark_game/highway.py) ── */

function noteScale(yProgress, perspectiveFactor) {
  var clamped = Math.max(0, Math.min(1, yProgress));
  return 1.0 / (1.0 + (1.0 - clamped) * perspectiveFactor);
}

function projectNote(laneOffset, yProgress, centerX, horizonY, hitLineY, perspectiveFactor) {
  var scale = noteScale(yProgress, perspectiveFactor);
  var yScreen = horizonY + yProgress * (hitLineY - horizonY);
  var xScreen = centerX + laneOffset * scale;
  return [xScreen, yScreen, scale];
}

function highwayWidthAt(yProgress, topWidth, bottomWidth) {
  return topWidth + (bottomWidth - topWidth) * yProgress;
}

function timeToYProgress(eventTime, currentTime, lookaheadSec) {
  if (lookaheadSec <= 0) return 1.0;
  var remaining = eventTime - currentTime;
  return 1.0 - remaining / lookaheadSec;
}

function isVisible(yProgress) {
  return yProgress >= -0.1 && yProgress <= 1.15;
}

/* ── Particles (from spark_game/particles.py) ── */

function ParticlePool(poolSize) {
  this.particles = [];
  for (var i = 0; i < poolSize; i++) {
    this.particles.push({
      x: 0, y: 0, vx: 0, vy: 0,
      life: 0, maxLife: 0,
      color: [255, 255, 255], size: 4, active: false,
    });
  }
}

ParticlePool.prototype.spawnBurst = function(x, y, color, count) {
  count = count || 12;
  var spawned = 0;
  for (var i = 0; i < this.particles.length; i++) {
    var p = this.particles[i];
    if (p.active) continue;
    p.x = x;
    p.y = y;
    p.vx = (Math.random() - 0.5) * 6;
    p.vy = -(Math.random() * 4 + 1);
    p.life = DEFAULTS.HIT_BURST_MS / 1000;
    p.maxLife = p.life;
    p.color = color;
    p.size = 3 + Math.floor(Math.random() * 5);
    p.active = true;
    spawned++;
    if (spawned >= count) break;
  }
};

ParticlePool.prototype.update = function(dt) {
  for (var i = 0; i < this.particles.length; i++) {
    var p = this.particles[i];
    if (!p.active) continue;
    p.x += p.vx;
    p.y += p.vy;
    p.vy += 0.15;
    p.life -= dt;
    if (p.life <= 0) p.active = false;
  }
};

ParticlePool.prototype.draw = function(ctx) {
  for (var i = 0; i < this.particles.length; i++) {
    var p = this.particles[i];
    if (!p.active) continue;
    var alpha = Math.max(0, p.life / p.maxLife);
    var size = Math.max(1, Math.floor(p.size * alpha));
    ctx.globalAlpha = alpha;
    ctx.fillStyle = "rgb(" + p.color[0] + "," + p.color[1] + "," + p.color[2] + ")";
    ctx.beginPath();
    ctx.arc(p.x, p.y, size, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
};

/* ── SparkHighway class ── */

function SparkHighway(canvas, skin) {
  this.canvas = canvas;
  this.ctx = canvas.getContext("2d");
  this.skin = skin || GUITAR_SKIN;
  this.events = [];
  this.phrases = [];
  this.particles = new ParticlePool(DEFAULTS.PARTICLE_POOL_SIZE);
  this._lastTime = 0;
  this._destroyed = false;

  // Computed geometry (updated on resize)
  this._w = 0;
  this._h = 0;
  this._cx = 0;
  this._horizonY = 0;
  this._hitLineY = 0;
  this._topWidth = DEFAULTS.HIGHWAY_TOP_WIDTH;
  this._bottomWidth = DEFAULTS.HIGHWAY_BOTTOM_WIDTH;
  this._pf = DEFAULTS.PERSPECTIVE_FACTOR;
  this._lookahead = DEFAULTS.LOOKAHEAD_SEC;

  // Pre-computed scanline widths
  this._scanWidths = [];
  this._scanYs = [];

  this._resize();
}

SparkHighway.prototype._resize = function() {
  var dpr = window.devicePixelRatio || 1;
  var rect = this.canvas.getBoundingClientRect();
  var w = rect.width;
  var h = rect.height;
  this.canvas.width = w * dpr;
  this.canvas.height = h * dpr;
  this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  this._w = w;
  this._h = h;
  this._cx = w / 2;
  this._horizonY = h * DEFAULTS.HORIZON_Y_RATIO;
  this._hitLineY = h * DEFAULTS.HIT_LINE_Y_RATIO;

  // Scale highway widths to canvas width
  var widthScale = w / 1280;
  this._topWidth = DEFAULTS.HIGHWAY_TOP_WIDTH * widthScale;
  this._bottomWidth = DEFAULTS.HIGHWAY_BOTTOM_WIDTH * widthScale;

  // Pre-compute scanlines
  this._scanWidths = [];
  this._scanYs = [];
  var hwH = this._hitLineY - this._horizonY;
  for (var i = 0; i < DEFAULTS.HIGHWAY_SLICES; i++) {
    var prog = i / (DEFAULTS.HIGHWAY_SLICES - 1);
    this._scanYs.push(this._horizonY + prog * hwH);
    this._scanWidths.push(highwayWidthAt(prog, this._topWidth, this._bottomWidth));
  }
};

SparkHighway.prototype.setChart = function(events, phrases) {
  this.events = events || [];
  this.phrases = phrases || [];
};

SparkHighway.prototype.update = function(currentTimeSec, combo) {
  if (this._destroyed) return;

  // Check for resize
  var rect = this.canvas.getBoundingClientRect();
  if (Math.abs(rect.width - this._w) > 1 || Math.abs(rect.height - this._h) > 1) {
    this._resize();
  }

  var dt = this._lastTime > 0 ? (currentTimeSec - this._lastTime) : 0.016;
  this._lastTime = currentTimeSec;
  dt = Math.max(0, Math.min(0.1, dt));

  var ctx = this.ctx;
  ctx.clearRect(0, 0, this._w, this._h);

  // 1. Highway surface
  this._drawHighwaySurface(ctx, currentTimeSec);
  // 2. Fret bars
  this._drawFretBars(ctx, currentTimeSec);
  // 3. Lane lines
  this._drawLaneLines(ctx);
  // 4. Notes/gems
  this._drawNotes(ctx, currentTimeSec);
  // 5. Strike line
  this._drawStrikeLine(ctx);
  // 6. Lane indicators
  this._drawLaneIndicators(ctx);
  // 7. Combo flame
  if (combo >= 10) this._drawComboFlame(ctx, combo);
  // 8. Particles
  this.particles.update(dt);
  this.particles.draw(ctx);
  // 9. Edge glow
  this._drawEdgeGlow(ctx);
};

SparkHighway.prototype.destroy = function() {
  this._destroyed = true;
  this.events = [];
  this.phrases = [];
};

/* ── Hit notification (call from app when a note is hit) ── */
SparkHighway.prototype.notifyHit = function(x, y, color) {
  this.particles.spawnBurst(x, y, color, 12);
};

/* ── Draw: Highway surface ── */
SparkHighway.prototype._drawHighwaySurface = function(ctx, currentTime) {
  var hwH = this._hitLineY - this._horizonY;
  var sliceH = Math.max(2, Math.ceil(hwH / DEFAULTS.HIGHWAY_SLICES) + 1);
  var topC = this.skin.backgroundColors ? this.skin.backgroundColors.top : [10, 10, 20];
  var botC = this.skin.backgroundColors ? this.skin.backgroundColors.bottom : [30, 30, 50];

  for (var i = 0; i < DEFAULTS.HIGHWAY_SLICES; i++) {
    var prog = i / (DEFAULTS.HIGHWAY_SLICES - 1);
    var y = this._scanYs[i];
    var laneW = this._scanWidths[i];
    var xLeft = this._cx - laneW / 2;

    // Gradient color
    var r = Math.round(topC[0] + (botC[0] - topC[0]) * prog);
    var g = Math.round(topC[1] + (botC[1] - topC[1]) * prog);
    var b = Math.round(topC[2] + (botC[2] - topC[2]) * prog);

    ctx.fillStyle = "rgb(" + r + "," + g + "," + b + ")";
    ctx.fillRect(xLeft, y, laneW, sliceH);
  }
};

/* ── Draw: Fret bars ── */
SparkHighway.prototype._drawFretBars = function(ctx, currentTime) {
  var interval = DEFAULTS.FRET_BAR_INTERVAL_SEC;
  var startBar = Math.floor(currentTime / interval) - 2;
  var endBar = Math.ceil((currentTime + this._lookahead) / interval) + 2;

  for (var b = startBar; b <= endBar; b++) {
    var barTime = b * interval;
    var yProg = timeToYProgress(barTime, currentTime, this._lookahead);
    if (!isVisible(yProg)) continue;

    var clampedProg = Math.max(0, Math.min(1, yProg));
    var y = this._horizonY + yProg * (this._hitLineY - this._horizonY);
    var laneW = highwayWidthAt(clampedProg, this._topWidth, this._bottomWidth);
    var xLeft = this._cx - laneW / 2;
    var xRight = this._cx + laneW / 2;

    var scale = noteScale(yProg, this._pf);
    var thickness = Math.max(1, Math.round(2 * scale));
    var alpha = (40 + 60 * Math.max(0, yProg)) / 255;

    ctx.strokeStyle = "rgba(140,160,180," + alpha.toFixed(2) + ")";
    ctx.lineWidth = thickness;
    ctx.beginPath();
    ctx.moveTo(xLeft, y);
    ctx.lineTo(xRight, y);
    ctx.stroke();
  }
};

/* ── Draw: Lane lines ── */
SparkHighway.prototype._drawLaneLines = function(ctx) {
  var laneCount = this.skin.laneCount;

  for (var i = 0; i <= laneCount; i++) {
    var frac = i / laneCount - 0.5;
    var topX = this._cx + frac * this._topWidth;
    var botX = this._cx + frac * this._bottomWidth;

    // Outer glow
    ctx.strokeStyle = "rgba(20,80,120,0.6)";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(topX, this._horizonY);
    ctx.lineTo(botX, this._hitLineY);
    ctx.stroke();

    // Inner bright
    ctx.strokeStyle = "rgba(40,180,255,0.5)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(topX, this._horizonY);
    ctx.lineTo(botX, this._hitLineY);
    ctx.stroke();
  }
};

/* ── Extract MIDI note from various event formats ── */
function _extractMidi(evt) {
  // Direct top-level midi array (SparkGame format)
  if (evt.midi && evt.midi.length) return evt.midi[0];
  // Direct lane (SparkGame guitar)
  if (evt.lane != null && evt.lane >= 21 && evt.lane <= 108) return evt.lane;
  // PianoSpark: target.midi (array for block_chord, number for lh_note)
  if (evt.target) {
    if (Array.isArray(evt.target.midi) && evt.target.midi.length) return evt.target.midi[0];
    if (typeof evt.target.midi === "number") return evt.target.midi;
  }
  // ChordSpark: notes array like ["A","C","E"] — can't extract MIDI, use default
  return 60;
}

/* ── Draw: Notes/gems ── */
SparkHighway.prototype._drawNotes = function(ctx, currentTime) {
  var skin = this.skin;

  for (var i = 0; i < this.events.length; i++) {
    var evt = this.events[i];
    var yProg = timeToYProgress(evt.t, currentTime, this._lookahead);
    if (!isVisible(yProg)) continue;

    // Skip scored misses
    if (evt._scored && !evt._hit) continue;

    var widthScale = this._w / 1280;

    // Chord/strum events render as labeled bars spanning the highway
    var isChord = (evt.type === "chord" || evt.type === "strum" || evt.type === "block_chord");
    if (isChord && skin.laneIndicatorStyle !== "keys") {
      var proj = projectNote(0, yProg, this._cx, this._horizonY, this._hitLineY, this._pf);
      var x = proj[0], y = proj[1], scale = proj[2];
      var laneW = highwayWidthAt(Math.max(0, Math.min(1, yProg)), this._topWidth, this._bottomWidth);

      // Enlarge near hit line
      var hitBoost = 1.0;
      if (yProg > 0.85) hitBoost = 1.0 + (yProg - 0.85) / 0.15 * 0.25;

      // Pick color based on chord hash for visual variety
      var chordStr = evt.chord || evt.laneLabel || "";
      var hash = 0;
      for (var ci = 0; ci < chordStr.length; ci++) hash = (hash + chordStr.charCodeAt(ci)) % skin.laneColors.length;
      var color = (evt._scored && evt._hit) ? [100, 255, 100] : skin.laneColors[hash];

      this._drawChordBar(ctx, x, y, laneW * 0.85 * scale, scale, color, chordStr, evt.strum, hitBoost);

      evt._screenX = x;
      evt._screenY = y;
      evt._screenColor = color;
      continue;
    }

    // Individual note events (piano keys, lead notes, etc.)
    var midiNote = _extractMidi(evt);

    var laneOff;
    if (skin.laneIndicatorStyle === "keys") {
      var center = skin.centerNote || 60;
      laneOff = (midiNote - center) * skin.laneSpacing * widthScale;
    } else {
      var lane = (evt.lane != null) ? evt.lane : (evt.id != null ? evt.id % skin.laneCount : i % skin.laneCount);
      var laneCenter = (skin.laneCount - 1) / 2;
      laneOff = (lane - laneCenter) * skin.laneSpacing * widthScale;
    }

    var proj2 = projectNote(laneOff, yProg, this._cx, this._horizonY, this._hitLineY, this._pf);
    var x2 = proj2[0], y2 = proj2[1], scale2 = proj2[2];

    var color2;
    if (evt._scored && evt._hit) {
      color2 = [100, 255, 100];
    } else if (skin.laneColors) {
      var laneIdx = (evt.lane != null) ? evt.lane : (evt.id != null ? evt.id % skin.laneColors.length : i % skin.laneColors.length);
      color2 = skin.laneColors[laneIdx % skin.laneColors.length];
    } else {
      var inOctave = midiNote % 12;
      var isBlack = [1, 3, 6, 8, 10].indexOf(inOctave) >= 0;
      color2 = isBlack ? [80, 160, 255] : [100, 200, 255];
    }

    var hitBoost2 = 1.0;
    if (yProg > 0.85) hitBoost2 = 1.0 + (yProg - 0.85) / 0.15 * 0.35;

    if (skin.noteShape === "rect") {
      var nw = Math.max(6, Math.round(skin.laneSpacing * 0.8 * scale2 * widthScale * hitBoost2));
      var nh = Math.max(4, Math.round(20 * scale2 * hitBoost2));
      this._drawRectGem(ctx, x2, y2, nw, nh, color2, scale2);
    } else {
      var radius = Math.max(4, Math.round(18 * scale2 * hitBoost2));
      this._drawCircleGem(ctx, x2, y2, radius, color2, scale2);
    }

    evt._screenX = x2;
    evt._screenY = y2;
    evt._screenColor = color2;
  }
};

/* ── Draw: Chord bar (labeled bar spanning highway) ── */
SparkHighway.prototype._drawChordBar = function(ctx, cx, y, barW, scale, color, label, strum, hitBoost) {
  var r = color[0], g = color[1], b = color[2];
  var barH = Math.max(12, Math.round(22 * scale * hitBoost));
  var rx = cx - barW / 2;
  var ry = y - barH / 2;
  var br = Math.min(barH / 2, 8);

  // Glow
  ctx.shadowColor = "rgb(" + r + "," + g + "," + b + ")";
  ctx.shadowBlur = 16 * scale;
  ctx.fillStyle = "rgba(" + r + "," + g + "," + b + ",0.15)";
  _roundRect(ctx, rx - 6, ry - 4, barW + 12, barH + 8, br + 3);
  ctx.fill();
  ctx.shadowBlur = 0;

  // Main bar with gradient
  var grad = ctx.createLinearGradient(rx, ry, rx, ry + barH);
  grad.addColorStop(0, "rgb(" + Math.min(255, r + 40) + "," + Math.min(255, g + 40) + "," + Math.min(255, b + 40) + ")");
  grad.addColorStop(1, "rgb(" + r + "," + g + "," + b + ")");
  ctx.fillStyle = grad;
  _roundRect(ctx, rx, ry, barW, barH, br);
  ctx.fill();

  // Border
  ctx.strokeStyle = "rgba(255,255,255,0.4)";
  ctx.lineWidth = 1.5;
  _roundRect(ctx, rx, ry, barW, barH, br);
  ctx.stroke();

  // Strum direction arrow (left side)
  if (strum && scale > 0.4) {
    var arrowX = rx + 14 * scale;
    var arrowY = y;
    var arrowSize = 6 * scale * hitBoost;
    ctx.fillStyle = "rgba(255,255,255,0.8)";
    ctx.beginPath();
    if (strum === "U" || strum === "up") {
      ctx.moveTo(arrowX, arrowY - arrowSize);
      ctx.lineTo(arrowX - arrowSize * 0.6, arrowY + arrowSize * 0.5);
      ctx.lineTo(arrowX + arrowSize * 0.6, arrowY + arrowSize * 0.5);
    } else {
      ctx.moveTo(arrowX, arrowY + arrowSize);
      ctx.lineTo(arrowX - arrowSize * 0.6, arrowY - arrowSize * 0.5);
      ctx.lineTo(arrowX + arrowSize * 0.6, arrowY - arrowSize * 0.5);
    }
    ctx.fill();
  }

  // Chord label (centered)
  if (label && scale > 0.3) {
    var fontSize = Math.max(9, Math.round(14 * scale * hitBoost));
    ctx.font = "bold " + fontSize + "px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "rgba(255,255,255,0.95)";
    ctx.fillText(label, cx, y + 1);
  }
};

/* ── Draw: Circle gem (guitar) ── */
SparkHighway.prototype._drawCircleGem = function(ctx, x, y, radius, color, scale) {
  var r = color[0], g = color[1], b = color[2];

  // Glow halo
  var glowR = radius * 1.6;
  var grad = ctx.createRadialGradient(x, y, radius * 0.3, x, y, glowR);
  grad.addColorStop(0, "rgba(" + r + "," + g + "," + b + ",0.3)");
  grad.addColorStop(1, "rgba(" + r + "," + g + "," + b + ",0)");
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(x, y, glowR, 0, Math.PI * 2);
  ctx.fill();

  // Main circle
  ctx.fillStyle = "rgb(" + r + "," + g + "," + b + ")";
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();

  // Highlight (top-left)
  var hr = Math.min(255, r + 80), hg = Math.min(255, g + 80), hb = Math.min(255, b + 80);
  ctx.fillStyle = "rgb(" + hr + "," + hg + "," + hb + ")";
  ctx.beginPath();
  ctx.arc(x - radius * 0.25, y - radius * 0.25, radius * 0.35, 0, Math.PI * 2);
  ctx.fill();

  // Outline
  ctx.strokeStyle = "rgba(255,255,255,0.7)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.stroke();
};

/* ── Draw: Rect gem (piano) ── */
SparkHighway.prototype._drawRectGem = function(ctx, x, y, w, h, color, scale) {
  var r = color[0], g = color[1], b = color[2];
  var rx = x - w / 2, ry = y - h / 2;
  var br = Math.min(w, h) * 0.2;

  // Glow
  ctx.shadowColor = "rgb(" + r + "," + g + "," + b + ")";
  ctx.shadowBlur = 12 * scale;
  ctx.fillStyle = "rgba(" + r + "," + g + "," + b + ",0.3)";
  _roundRect(ctx, rx - 4, ry - 4, w + 8, h + 8, br + 2);
  ctx.fill();
  ctx.shadowBlur = 0;

  // Main bar
  ctx.fillStyle = "rgb(" + r + "," + g + "," + b + ")";
  _roundRect(ctx, rx, ry, w, h, br);
  ctx.fill();

  // Top highlight
  var hr = Math.min(255, r + 60), hg = Math.min(255, g + 60), hb = Math.min(255, b + 60);
  ctx.fillStyle = "rgb(" + hr + "," + hg + "," + hb + ")";
  _roundRect(ctx, rx + 2, ry + 1, w - 4, h / 3, br);
  ctx.fill();

  // Outline
  ctx.strokeStyle = "rgba(255,255,255,0.5)";
  ctx.lineWidth = 1;
  _roundRect(ctx, rx, ry, w, h, br);
  ctx.stroke();
};

/* ── Draw: Strike line ── */
SparkHighway.prototype._drawStrikeLine = function(ctx) {
  var halfW = this._bottomWidth / 2 + 40;
  var y = this._hitLineY;

  // Widest outer glow
  ctx.strokeStyle = "rgba(100,200,255,0.08)";
  ctx.lineWidth = 28;
  ctx.beginPath();
  ctx.moveTo(this._cx - halfW, y);
  ctx.lineTo(this._cx + halfW, y);
  ctx.stroke();

  // Wide glow
  ctx.strokeStyle = "rgba(100,200,255,0.15)";
  ctx.lineWidth = 16;
  ctx.beginPath();
  ctx.moveTo(this._cx - halfW, y);
  ctx.lineTo(this._cx + halfW, y);
  ctx.stroke();

  // Medium glow
  ctx.strokeStyle = "rgba(100,200,255,0.4)";
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.moveTo(this._cx - halfW, y);
  ctx.lineTo(this._cx + halfW, y);
  ctx.stroke();

  // Bright core
  ctx.strokeStyle = "rgba(220,245,255,0.95)";
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(this._cx - halfW, y);
  ctx.lineTo(this._cx + halfW, y);
  ctx.stroke();
};

/* ── Draw: Lane indicators ── */
SparkHighway.prototype._drawLaneIndicators = function(ctx) {
  if (this.skin.laneIndicatorStyle === "keys") {
    this._drawPianoKeys(ctx);
  } else {
    this._drawGuitarButtons(ctx);
  }
};

SparkHighway.prototype._drawGuitarButtons = function(ctx) {
  var laneCount = this.skin.laneCount;
  var laneCenter = (laneCount - 1) / 2;
  var widthScale = this._w / 1280;
  var y = this._hitLineY;

  for (var lane = 0; lane < laneCount; lane++) {
    var laneOff = (lane - laneCenter) * this.skin.laneSpacing * widthScale;
    var x = this._cx + laneOff;
    var color = this.skin.laneColors[lane % this.skin.laneColors.length];
    var r = color[0], g = color[1], b = color[2];

    // Dark filled circle
    ctx.fillStyle = "rgb(" + Math.floor(r / 3) + "," + Math.floor(g / 3) + "," + Math.floor(b / 3) + ")";
    ctx.beginPath();
    ctx.arc(x, y, 18 * widthScale, 0, Math.PI * 2);
    ctx.fill();

    // Bright ring
    ctx.strokeStyle = "rgb(" + r + "," + g + "," + b + ")";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x, y, 18 * widthScale, 0, Math.PI * 2);
    ctx.stroke();

    // Center dot
    ctx.fillStyle = "rgba(255,255,255,0.8)";
    ctx.beginPath();
    ctx.arc(x, y, 4 * widthScale, 0, Math.PI * 2);
    ctx.fill();
  }
};

SparkHighway.prototype._drawPianoKeys = function(ctx) {
  var center = this.skin.centerNote || 60;
  var halfKeys = Math.floor(this.skin.laneCount / 2);
  var low = center - halfKeys;
  var high = center + halfKeys;
  var widthScale = this._w / 1280;
  var keyW = this.skin.laneSpacing * widthScale;
  var keyH = 40 * widthScale;
  var y = this._hitLineY + 2;

  // White keys first
  for (var note = low; note <= high; note++) {
    var inOct = note % 12;
    var isBlack = [1, 3, 6, 8, 10].indexOf(inOct) >= 0;
    if (isBlack) continue;
    var x = this._cx + (note - center) * keyW;
    ctx.fillStyle = "rgb(220,220,240)";
    ctx.strokeStyle = "rgb(150,150,150)";
    ctx.lineWidth = 0.5;
    _roundRect(ctx, x - keyW / 2, y, keyW - 1, keyH, 1);
    ctx.fill();
    ctx.stroke();
  }

  // Black keys on top
  for (var note2 = low; note2 <= high; note2++) {
    var inOct2 = note2 % 12;
    var isBlack2 = [1, 3, 6, 8, 10].indexOf(inOct2) >= 0;
    if (!isBlack2) continue;
    var x2 = this._cx + (note2 - center) * keyW;
    ctx.fillStyle = "rgb(40,40,60)";
    _roundRect(ctx, x2 - keyW * 0.35, y, keyW * 0.7, keyH * 0.65, 1);
    ctx.fill();
  }
};

/* ── Draw: Combo flame ── */
SparkHighway.prototype._drawComboFlame = function(ctx, combo) {
  var flameH = 220 * (this._w / 1280);
  var flameW = 60 * (this._w / 1280);
  var x = this._cx;
  var y = this._hitLineY;

  var intensity = Math.min(1, (combo - 10) / 40);
  var grad = ctx.createLinearGradient(x, y, x, y - flameH);
  grad.addColorStop(0, "rgba(255,100,0," + (0.4 + intensity * 0.3).toFixed(2) + ")");
  grad.addColorStop(0.4, "rgba(255,200,0," + (0.2 + intensity * 0.2).toFixed(2) + ")");
  grad.addColorStop(1, "rgba(255,255,100,0)");

  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.moveTo(x - flameW / 2, y);
  ctx.quadraticCurveTo(x - flameW * 0.3, y - flameH * 0.5, x, y - flameH);
  ctx.quadraticCurveTo(x + flameW * 0.3, y - flameH * 0.5, x + flameW / 2, y);
  ctx.fill();
};

/* ── Draw: Edge glow ── */
SparkHighway.prototype._drawEdgeGlow = function(ctx) {
  var hwH = this._hitLineY - this._horizonY;
  var steps = 40;
  for (var i = 0; i < steps; i++) {
    var prog = i / (steps - 1);
    var y = this._horizonY + prog * hwH;
    var laneW = highwayWidthAt(prog, this._topWidth, this._bottomWidth);
    var alpha = (20 + 40 * prog) / 255;

    ctx.fillStyle = "rgba(0,150,255," + alpha.toFixed(3) + ")";
    ctx.beginPath();
    ctx.arc(this._cx - laneW / 2, y, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(this._cx + laneW / 2, y, 3, 0, Math.PI * 2);
    ctx.fill();
  }
};

/* ── Utility: rounded rect ── */
function _roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

/* ── Export ── */
SparkHighway.DEFAULTS = DEFAULTS;
SparkHighway.GUITAR_SKIN = GUITAR_SKIN;
SparkHighway.PIANO_SKIN = PIANO_SKIN;
window.SparkHighway = SparkHighway;

})();
