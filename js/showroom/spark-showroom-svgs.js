// js/showroom/spark-showroom-svgs.js
// Inline SVG instrument silhouettes used as fallbacks when an instrument
// registration doesn't provide `iconImage` / `heroImage`. Looks intentional
// (matches the warm-ember palette) rather than the previous emoji+gradient
// fallback, and ships zero binary assets so CSP `img-src 'self' data:`
// continues to work without modification.
//
// Future real-photo overrides: set `iconImage` and/or `heroImage` on the
// instrument registration in js/instruments/<id>/register.js — the
// Showroom modules will prefer those over these silhouettes.
//
// Design notes:
// - Each SHAPE function returns ONLY the inner XML (paths, lines, etc.).
//   cardSvg() and heroSvg() each wrap the inner shape in their own <svg>
//   with their own background gradient, so we never get nested <svg>
//   elements with redundant background layers (an earlier draft had
//   heroSvg call cardSvg internally, producing two stacked backgrounds).
// - Each gradient gets a process-unique id (counter-suffixed) so the
//   same instrument card rendered N times in the DOM doesn't produce
//   N elements with the same id (invalid HTML; some browsers misrender
//   the second occurrence's gradient fill).
(function() {

  var _idCounter = 0;
  function uniqueGradId(prefix, type) {
    return "spark-" + prefix + "-" + type.replace(/[^a-z0-9_-]/gi, "x") + "-" + (++_idCounter);
  }

  // Map instrument type → primary accent (matches per-instrument colors
  // already defined in launcher.js INSTRUMENT_ACCENT and in DESIGN.md).
  var ACCENT = {
    guitar:  "#FF2D55",
    bass:    "#7C3AED",
    ukulele: "#14B8A6",
    piano:   "#0EA5E9",
    drums:   "#FFE66D"
  };

  function accentFor(type) {
    return ACCENT[type] || "#FF7B3A";
  }

  // Inner-XML-only instrument silhouettes. Coordinates assume a 100x100
  // viewBox (the wrappers below set that viewBox). Fill/stroke colors
  // come from the surrounding <g> in the wrapper, so each shape stays
  // accent-color agnostic.
  var SHAPES = {
    // Stylized 6-string electric — offset double-cut body, sound hole, neck.
    guitar: function() {
      return ''
        + '<path d="M30 70 C20 70 18 60 22 50 C26 40 36 38 44 42 L62 42 C70 38 80 40 84 50 C88 60 86 70 76 70 C72 76 64 78 58 76 L48 76 C42 78 34 76 30 70 Z" fill-opacity=".85" stroke-width="0"/>'
        + '<circle cx="53" cy="58" r="4" fill="#12100E" stroke-width="0"/>'
        + '<rect x="62" y="51" width="14" height="3" fill="#12100E" stroke-width="0"/>'
        + '<line x1="22" y1="56" x2="84" y2="56" stroke="#12100E" stroke-opacity=".3" stroke-width=".4"/>'
        + '<line x1="22" y1="59" x2="84" y2="59" stroke="#12100E" stroke-opacity=".3" stroke-width=".4"/>';
    },
    // Three-key keyboard fragment with two black keys above.
    piano: function() {
      return ''
        + '<rect x="20" y="40" width="60" height="30" rx="2" fill="#EDE6DA" stroke-width="1"/>'
        + '<line x1="40" y1="40" x2="40" y2="70" stroke="#12100E" stroke-width="1"/>'
        + '<line x1="60" y1="40" x2="60" y2="70" stroke="#12100E" stroke-width="1"/>'
        + '<rect x="34" y="40" width="12" height="18" fill="#12100E" stroke-width="0"/>'
        + '<rect x="54" y="40" width="12" height="18" fill="#12100E" stroke-width="0"/>';
    },
    // Long-scale 4-string bass — slightly more elongated than the guitar.
    bass: function() {
      return ''
        + '<path d="M28 70 C20 70 18 58 24 50 C30 42 40 42 48 46 L66 46 C74 42 82 44 84 52 C86 60 84 68 76 68 C72 74 64 76 58 74 L48 76 C40 78 32 76 28 70 Z" fill-opacity=".85" stroke-width="0"/>'
        + '<rect x="64" y="55" width="18" height="3" fill="#12100E" stroke-width="0"/>'
        + '<line x1="22" y1="56" x2="84" y2="56" stroke="#12100E" stroke-opacity=".4" stroke-width=".5"/>'
        + '<line x1="22" y1="61" x2="84" y2="61" stroke="#12100E" stroke-opacity=".4" stroke-width=".5"/>';
    },
    // Small soprano body, short neck, 4 strings.
    ukulele: function() {
      return ''
        + '<path d="M40 64 C32 64 28 56 32 50 C36 44 44 44 48 48 L52 48 C56 44 64 44 68 50 C72 56 68 64 60 64 C56 70 50 72 48 70 C46 72 42 70 40 64 Z" fill-opacity=".85" stroke-width="0"/>'
        + '<circle cx="50" cy="56" r="3" fill="#12100E" stroke-width="0"/>'
        + '<rect x="68" y="54" width="14" height="3" fill="#12100E" stroke-width="0"/>'
        + '<line x1="34" y1="55" x2="80" y2="55" stroke="#12100E" stroke-opacity=".3" stroke-width=".3"/>'
        + '<line x1="34" y1="57" x2="80" y2="57" stroke="#12100E" stroke-opacity=".3" stroke-width=".3"/>';
    },
    // Kick drum + two toms from above.
    drums: function() {
      return ''
        + '<ellipse cx="50" cy="62" rx="22" ry="10" fill-opacity=".85" stroke-width="0"/>'
        + '<ellipse cx="50" cy="62" rx="14" ry="6" fill="#12100E" stroke-width="0"/>'
        + '<rect x="30" y="40" width="10" height="8" rx="1" fill-opacity=".75" stroke-width="0"/>'
        + '<rect x="60" y="40" width="10" height="8" rx="1" fill-opacity=".75" stroke-width="0"/>'
        + '<line x1="32" y1="38" x2="36" y2="34" stroke-width="1.5" stroke-opacity=".7"/>'
        + '<line x1="68" y1="38" x2="64" y2="34" stroke-width="1.5" stroke-opacity=".7"/>';
    },
    // Generic music-note fallback.
    generic: function() {
      return '<path d="M50 30 L50 60 M40 60 a10 8 0 1 0 20 0 a10 8 0 1 0 -20 0 Z" fill-opacity=".85" stroke-width="2"/>';
    }
  };

  function shapeFor(type) {
    return (SHAPES[type] || SHAPES.generic)();
  }

  // 1:1 silhouette inside a soft radial-glow tile. Used for collection cards.
  function cardSvg(type) {
    var color = accentFor(type);
    var gradId = uniqueGradId("card-grad", type);
    return ''
      + '<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet" style="width:100%;height:100%;display:block">'
      +   '<defs>'
      +     '<radialGradient id="' + gradId + '" cx="50%" cy="40%" r="55%">'
      +       '<stop offset="0%" stop-color="' + color + '" stop-opacity=".35"/>'
      +       '<stop offset="60%" stop-color="' + color + '" stop-opacity=".08"/>'
      +       '<stop offset="100%" stop-color="' + color + '" stop-opacity="0"/>'
      +     '</radialGradient>'
      +   '</defs>'
      +   '<rect width="100" height="100" fill="url(#' + gradId + ')"/>'
      +   '<g fill="#EDE6DA" stroke="#EDE6DA" stroke-linejoin="round" stroke-linecap="round">'
      +     shapeFor(type)
      +   '</g>'
      + '</svg>';
  }

  // 16:10 hero with a stronger glow falloff. Single SVG layer (no
  // nested wrapper) — silhouette is centered by translating the inner
  // group right within the wider viewBox.
  function heroSvg(type) {
    var color = accentFor(type);
    var gradId = uniqueGradId("hero-grad", type);
    return ''
      + '<svg viewBox="0 0 160 100" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice" style="width:100%;height:100%;display:block">'
      +   '<defs>'
      +     '<radialGradient id="' + gradId + '" cx="50%" cy="50%" r="60%">'
      +       '<stop offset="0%" stop-color="' + color + '" stop-opacity=".4"/>'
      +       '<stop offset="60%" stop-color="' + color + '" stop-opacity=".1"/>'
      +       '<stop offset="100%" stop-color="#1A0F08" stop-opacity="1"/>'
      +     '</radialGradient>'
      +   '</defs>'
      +   '<rect width="160" height="100" fill="url(#' + gradId + ')"/>'
      +   '<g transform="translate(30 0)" fill="#EDE6DA" stroke="#EDE6DA" stroke-linejoin="round" stroke-linecap="round">'
      +     shapeFor(type)
      +   '</g>'
      + '</svg>';
  }

  // onerror handler for <img iconImage>/<img heroImage>. When the file
  // 404s (e.g. the user hasn't dropped a real PNG into
  // resources/instruments/<id>/ yet), swap the <img>'s src to a data URI
  // of the inline SVG silhouette so the user never sees a broken-image
  // icon. The img element stays in place, so layout doesn't shift.
  // Set onerror to null after the swap so a failing data: URI (very
  // unlikely) can't loop forever.
  function svgDataUri(svg) {
    return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
  }
  function onCardImgError(imgEl, type) {
    if (!imgEl) return;
    imgEl.onerror = null;
    imgEl.src = svgDataUri(cardSvg(type));
  }
  function onHeroImgError(imgEl, type) {
    if (!imgEl) return;
    imgEl.onerror = null;
    imgEl.src = svgDataUri(heroSvg(type));
  }

  window.SparkShowroomSVG = {
    card: cardSvg,
    hero: heroSvg,
    accent: accentFor,
    onCardImgError: onCardImgError,
    onHeroImgError: onHeroImgError
  };
})();
