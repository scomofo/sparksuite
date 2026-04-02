// js/instruments/piano/pages.js
// Piano instrument page adapter
// Uses _PianoPageNS.piano captured references to avoid function name conflicts.
// Wraps piano page renderers with context swapping (piano data globals).
(function() {

  // Piano rendering context — temporarily swap in piano-specific data AND function globals
  function _enterPianoContext() {
    if (window._pctx) return; // already in piano context
    window._pctx = {};

    // Swap data globals
    var d = typeof PIANO_DATA !== "undefined" ? PIANO_DATA : null;
    if (d) {
      var keys = ["CHORDS","SONGS","LC","LN","CHORD_COLORS","CHORD_NOTES","CURRICULUM",
                  "LH_PATTERNS","SESSION_PLANS","BADGES","SCALES","FINGER_EXERCISES",
                  "FINGER_BADGES","INJURY_TIPS","DAILY_TYPES","PLAY_STYLES",
                  "TRANSITION_TIPS","REWARD_PHASES"];
      for (var i = 0; i < keys.length; i++) {
        var k = keys[i];
        window._pctx[k] = window[k];
        if (d[k] !== undefined) window[k] = d[k];
      }
    }

    // Swap UI/page functions to piano versions
    var ns = window._PianoPageNS && window._PianoPageNS.piano ? window._PianoPageNS.piano : {};
    var fnKeys = ["clickableDiv","escHTML","ifThenCard","fireMicro","checkBadges",
                  "tierBadgeHTML","pianoSVG","showConfetti","levelColor","tabNavHTML","headerHTML"];
    for (var j = 0; j < fnKeys.length; j++) {
      var fk = fnKeys[j];
      if (ns[fk]) {
        window._pctx["_fn_" + fk] = window[fk];
        window[fk] = ns[fk];
      }
    }
  }

  function _exitPianoContext() {
    if (!window._pctx) return;
    for (var k in window._pctx) {
      window[k] = window._pctx[k];
    }
    delete window._pctx;
  }

  // Expose context swap for use by act() dispatcher
  window._enterPianoCtx = _enterPianoContext;
  window._exitPianoCtx = _exitPianoContext;

  function _pianoPage(fn) {
    return function() {
      _enterPianoContext();
      try { return fn(); }
      finally { _exitPianoContext(); }
    };
  }

  window.PIANO_PAGES = {};

  window._registerPianoPages = function() {
    var ns = window._PianoPageNS && window._PianoPageNS.piano ? window._PianoPageNS.piano : {};
    var pages = {};

    // Piano home: renders piano header + tab nav + active tab content
    pages[SCR.HOME] = _pianoPage(function() {
      var html = '';
      // Use piano's own header and tab nav
      if (ns.headerHTML) html += ns.headerHTML();
      if (ns.tabNavHTML) html += ns.tabNavHTML();
      // Route to active tab
      var tab = S.tab;
      if (tab === 0 || tab === TAB.PRACTICE || tab === "practice") {
        html += ns.practiceTab ? ns.practiceTab() : "";
      } else if (tab === 1 || tab === "games") {
        html += ns.gamesTab ? ns.gamesTab() : "";
      } else if (tab === 2 || tab === TAB.SONGS || tab === "songs") {
        html += ns.songsTab ? ns.songsTab() : "";
      } else if (tab === 3 || tab === "tools") {
        html += ns.toolsTab ? ns.toolsTab() : "";
      } else {
        html += ns.practiceTab ? ns.practiceTab() : "";
      }
      return html;
    });

    if (ns.sessionPage) pages[SCR.SESSION] = _pianoPage(ns.sessionPage);
    if (ns.performPage) pages[SCR.PERFORM] = _pianoPage(ns.performPage);
    if (ns.performDonePage) pages[SCR.PERFORM_DONE] = _pianoPage(ns.performDonePage);
    if (ns.performSongPage) pages[SCR.PERFORM_SONG] = _pianoPage(ns.performSongPage);
    if (ns.planPage) pages[SCR.PLAN] = _pianoPage(ns.planPage);
    if (ns.analyticsPage) pages[SCR.INSIGHTS] = _pianoPage(ns.analyticsPage);
    if (ns.editorPage) pages[SCR.PERF_EDITOR] = _pianoPage(ns.editorPage);
    if (ns.stemsPlayerPage) pages[SCR.STEMS] = _pianoPage(ns.stemsPlayerPage);

    window.PIANO_PAGES = pages;

    // Update the registered instrument's pages reference
    var all = SparkInstruments.getAll();
    for (var i = 0; i < all.length; i++) {
      if (all[i].id === "pianospark") {
        all[i].pages = pages;
        break;
      }
    }
  };

})();
