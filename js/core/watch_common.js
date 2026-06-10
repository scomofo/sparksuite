// js/core/watch_common.js
// Shared Watch & Shadow phase utilities for all instruments.
// Provides: window.WatchCommon

(function() {
  "use strict";

  var FINGER_LABELS = {1:"Index", 2:"Middle", 3:"Ring", 4:"Pinky", 0:"Thumb"};

  function animateSequence(steps, delay, onComplete) {
    var cancelled = false;
    var timer = null;
    var idx = 0;
    function next() {
      if (cancelled || idx >= steps.length) {
        if (!cancelled && typeof onComplete === "function") onComplete();
        return;
      }
      steps[idx]();
      idx++;
      timer = setTimeout(next, delay);
    }
    next();
    return {
      cancel: function() {
        cancelled = true;
        if (timer) clearTimeout(timer);
      }
    };
  }

  function shakeElement(el) {
    if (!el) return;
    el.classList.remove("watch-shake");
    void el.offsetWidth;
    el.classList.add("watch-shake");
  }

  function celebrateIn(container) {
    if (!container) return;
    var div = document.createElement("div");
    div.className = "watch-celebrate";
    div.innerHTML = "<span class=\x27watch-celebrate-check\x27>&#10003;</span> <span>Nice!</span>";
    container.appendChild(div);
  }

  var cssInjected = false;
  function ensureCSS() {
    if (cssInjected) return;
    cssInjected = true;
    var style = document.createElement("style");
    style.textContent = [
      "@keyframes watchShake { 0%,100%{transform:translateX(0)} 20%,60%{transform:translateX(-6px)} 40%,80%{transform:translateX(6px)} }",
      "@keyframes watchCelebrate { 0%{opacity:0;transform:scale(0.5)} 50%{opacity:1;transform:scale(1.15)} 100%{opacity:1;transform:scale(1)} }",
      "@keyframes watchFingerIn { 0%{opacity:0;r:0} 100%{opacity:1} }",
      ".watch-shake { animation: watchShake 0.4s ease; }",
      ".watch-celebrate { text-align:center; font-size:1.5rem; font-weight:bold; color:var(--success,#4caf50); animation:watchCelebrate 0.5s ease both; margin-top:12px; }",
      ".watch-celebrate-check { font-size:2rem; }",
      ".watch-hit-target { cursor:pointer; fill:transparent; stroke:none; }",
      ".watch-hit-target:hover { fill:rgba(255,255,255,0.08); }",
      ".watch-narration { text-align:center; font-size:1rem; color:var(--text-secondary,#aaa); min-height:2em; margin:10px 0; transition:opacity 0.3s; }",
      ".watch-btn-row { display:flex; gap:10px; justify-content:center; margin-top:14px; }",
      ".watch-btn { padding:8px 22px; border-radius:8px; border:none; font-size:0.95rem; cursor:pointer; font-weight:600; }",
      ".watch-btn-primary { background:var(--accent,#ff7b3a); color:#fff; }",
      ".watch-btn-secondary { background:var(--bg-card,#1e1c1a); color:var(--text-primary,#eee); border:1px solid var(--border,#333); }",
      ".watch-prompt { text-align:center; font-size:1.05rem; color:var(--text-primary,#eee); font-weight:600; min-height:2em; margin:10px 0; }"
    ].join("\n");
    document.head.appendChild(style);
  }

  function normFinger(f) {
    if (Array.isArray(f)) {
      return { stringIdx: f[0], fret: f[1], finger: f[2] !== undefined ? f[2] : 1, color: f[3] || "#FF6B6B" };
    }
    return {
      stringIdx: f.stringIndex !== undefined ? f.stringIndex : (f.string || 0),
      fret: f.fret || 0,
      finger: f.finger !== undefined ? f.finger : 1,
      color: f.color || "#FF6B6B"
    };
  }

  function stringedWatch(container, chart, options) {
    if (!container || !chart) return { cleanup: function() {} };
    options = options || {};
    ensureCSS();

    var emptyChart = {
      name: chart.name || "",
      instrument: chart.instrument || "",
      stringCount: chart.stringCount || 6,
      stringLabels: chart.stringLabels || [],
      fretCountVisible: chart.fretCountVisible || 4,
      startFret: chart.startFret || 0,
      open: [], muted: [], fingers: [], barre: null
    };

    var svgWrap = document.createElement("div");
    svgWrap.style.textAlign = "center";
    svgWrap.innerHTML = (typeof stringedChordSVG === "function") ? stringedChordSVG(emptyChart, { width: 200 }) : "";
    container.appendChild(svgWrap);

    var narration = document.createElement("div");
    narration.className = "watch-narration";
    narration.textContent = "Watch the fingering...";
    container.appendChild(narration);

    var svgEl = svgWrap.querySelector("svg");
    if (!svgEl) return { cleanup: function() { container.innerHTML = ""; } };

    var rawFingers = (chart.fingers || []).map(normFinger);
    rawFingers.sort(function(a, b) { return a.finger - b.finger; });

    var sz = 200;
    var pL = 35, pR = 20, pT = 30, pB = 20;
    var h = Math.round(sz * 1.3);
    var sC = chart.stringCount || 6;
    var fC = chart.fretCountVisible || 4;
    var fH = (h - pT - pB) / fC;
    var sW = (sz - pL - pR) / (sC - 1);
    var startFret = chart.startFret || 0;

    var allSteps = [];
    if (chart.barre && chart.barre.fret !== undefined) {
      allSteps.push(function() {
        narration.textContent = "Barre at fret " + chart.barre.fret;
      });
    }

    rawFingers.forEach(function(f) {
      allSteps.push(function() {
        var cx = pL + f.stringIdx * sW;
        var displayFret = f.fret - startFret;
        var cy = pT + (displayFret - 0.5) * fH;
        var r = Math.min(fH, sW) * 0.32;
        var ns = "http://www.w3.org/2000/svg";
        var circle = document.createElementNS(ns, "circle");
        circle.setAttribute("cx", cx);
        circle.setAttribute("cy", cy);
        circle.setAttribute("r", r);
        circle.setAttribute("fill", f.color);
        circle.style.animation = "watchFingerIn 0.4s ease both";
        svgEl.appendChild(circle);
        var text = document.createElementNS(ns, "text");
        text.setAttribute("x", cx);
        text.setAttribute("y", cy + r * 0.35);
        text.setAttribute("text-anchor", "middle");
        text.setAttribute("font-size", r * 1.1);
        text.setAttribute("fill", "#fff");
        text.setAttribute("font-weight", "bold");
        text.textContent = f.finger;
        text.style.animation = "watchFingerIn 0.4s ease both";
        svgEl.appendChild(text);
        var fingerName = FINGER_LABELS[f.finger] || ("Finger " + f.finger);
        narration.textContent = fingerName + " on string " + (f.stringIdx + 1) + ", fret " + f.fret;
      });
    });

    allSteps.push(function() {
      if (typeof options.strumFn === "function") options.strumFn();
      narration.textContent = "";
      var btnRow = document.createElement("div");
      btnRow.className = "watch-btn-row";
      var againBtn = document.createElement("button");
      againBtn.className = "watch-btn watch-btn-secondary";
      againBtn.textContent = "Watch Again";
      againBtn.addEventListener("click", function() {
        var added = svgEl.querySelectorAll("circle, text");
        for (var i = added.length - 1; i >= 0; i--) {
          var node = added[i];
          if (node.style.animation && node.style.animation.indexOf("watchFingerIn") >= 0) {
            svgEl.removeChild(node);
          }
        }
        btnRow.remove();
        seq = animateSequence(allSteps, 1000);
      });
      btnRow.appendChild(againBtn);
      var gotItBtn = document.createElement("button");
      gotItBtn.className = "watch-btn watch-btn-primary";
      gotItBtn.textContent = "Got It";
      gotItBtn.addEventListener("click", function() {
        if (typeof options.onComplete === "function") options.onComplete();
      });
      btnRow.appendChild(gotItBtn);
      container.appendChild(btnRow);
    });

    var seq = animateSequence(allSteps, 1000);
    return {
      cleanup: function() {
        seq.cancel();
        container.innerHTML = "";
      }
    };
  }

  function stringedShadow(container, chart, options) {
    if (!container || !chart) return { cleanup: function() {} };
    options = options || {};
    ensureCSS();

    var emptyChart = {
      name: chart.name || "",
      instrument: chart.instrument || "",
      stringCount: chart.stringCount || 6,
      stringLabels: chart.stringLabels || [],
      fretCountVisible: chart.fretCountVisible || 4,
      startFret: chart.startFret || 0,
      open: [], muted: [], fingers: [], barre: null
    };

    var svgWrap = document.createElement("div");
    svgWrap.style.textAlign = "center";
    svgWrap.innerHTML = (typeof stringedChordSVG === "function") ? stringedChordSVG(emptyChart, { width: 220 }) : "";
    container.appendChild(svgWrap);

    var prompt = document.createElement("div");
    prompt.className = "watch-prompt";
    container.appendChild(prompt);

    var svgEl = svgWrap.querySelector("svg");
    if (!svgEl) return { cleanup: function() { container.innerHTML = ""; } };

    var sz = 220, scale = sz / 200;
    var pL = Math.round(35 * scale);
    var pR = Math.round(20 * scale);
    var pT = Math.round(30 * scale);
    var pB = Math.round(20 * scale);
    var h = Math.round(sz * 1.3);
    var sC = chart.stringCount || 6;
    var fC = chart.fretCountVisible || 4;
    var fH = (h - pT - pB) / fC;
    var sW = (sz - pL - pR) / (sC - 1);
    var startFret = chart.startFret || 0;

    var fretted = (chart.fingers || []).map(normFinger).filter(function(f) { return f.fret > 0; });
    fretted.sort(function(a, b) { return a.finger - b.finger; });

    if (fretted.length === 0) {
      prompt.textContent = "No fretted notes to practice.";
      return { cleanup: function() { container.innerHTML = ""; } };
    }

    var ns = "http://www.w3.org/2000/svg";
    for (var si = 0; si < sC; si++) {
      for (var fi = 1; fi <= fC; fi++) {
        var rx = pL + si * sW - sW * 0.4;
        var ry = pT + (fi - 1) * fH;
        var rw = sW * 0.8;
        var rh = fH;
        var rect = document.createElementNS(ns, "rect");
        rect.setAttribute("x", rx);
        rect.setAttribute("y", ry);
        rect.setAttribute("width", rw);
        rect.setAttribute("height", rh);
        rect.setAttribute("class", "watch-hit-target");
        rect.setAttribute("data-string", si);
        rect.setAttribute("data-fret", fi + startFret);
        svgEl.appendChild(rect);
      }
    }

    var currentIdx = 0;
    var cancelled = false;

    function showPrompt() {
      if (currentIdx >= fretted.length) return;
      var f = fretted[currentIdx];
      var fingerName = FINGER_LABELS[f.finger] || ("finger " + f.finger);
      prompt.textContent = "Tap where " + fingerName.toLowerCase() + " (finger " + f.finger + ") goes";
    }

    function handleClick(e) {
      if (cancelled || currentIdx >= fretted.length) return;
      var target = e.target;
      if (!target.classList.contains("watch-hit-target")) return;
      var clickedString = parseInt(target.getAttribute("data-string"), 10);
      var clickedFret = parseInt(target.getAttribute("data-fret"), 10);
      var expected = fretted[currentIdx];

      if (clickedString === expected.stringIdx && clickedFret === expected.fret) {
        var cx = pL + expected.stringIdx * sW;
        var displayFret = expected.fret - startFret;
        var cy = pT + (displayFret - 0.5) * fH;
        var r = Math.min(fH, sW) * 0.32;
        var circle = document.createElementNS(ns, "circle");
        circle.setAttribute("cx", cx);
        circle.setAttribute("cy", cy);
        circle.setAttribute("r", r);
        circle.setAttribute("fill", expected.color);
        circle.style.animation = "watchFingerIn 0.3s ease both";
        svgEl.appendChild(circle);
        var text = document.createElementNS(ns, "text");
        text.setAttribute("x", cx);
        text.setAttribute("y", cy + r * 0.35);
        text.setAttribute("text-anchor", "middle");
        text.setAttribute("font-size", r * 1.1);
        text.setAttribute("fill", "#fff");
        text.setAttribute("font-weight", "bold");
        text.textContent = expected.finger;
        text.style.animation = "watchFingerIn 0.3s ease both";
        svgEl.appendChild(text);
        if (typeof options.notePlayFn === "function") options.notePlayFn(expected);
        currentIdx++;
        if (currentIdx >= fretted.length) {
          prompt.textContent = "";
          celebrateIn(container);
          var btnRow = document.createElement("div");
          btnRow.className = "watch-btn-row";
          var continueBtn = document.createElement("button");
          continueBtn.className = "watch-btn watch-btn-primary";
          continueBtn.textContent = "Continue";
          continueBtn.addEventListener("click", function() {
            if (typeof options.onComplete === "function") options.onComplete();
          });
          btnRow.appendChild(continueBtn);
          container.appendChild(btnRow);
        } else {
          showPrompt();
        }
      } else {
        shakeElement(svgWrap);
      }
    }

    svgEl.addEventListener("click", handleClick);
    showPrompt();

    return {
      cleanup: function() {
        cancelled = true;
        svgEl.removeEventListener("click", handleClick);
        container.innerHTML = "";
      }
    };
  }

  window.WatchCommon = {
    FINGER_LABELS: FINGER_LABELS,
    animateSequence: animateSequence,
    shakeElement: shakeElement,
    celebrateIn: celebrateIn,
    ensureCSS: ensureCSS,
    stringedWatch: stringedWatch,
    stringedShadow: stringedShadow
  };

})();
