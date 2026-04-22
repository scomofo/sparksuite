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
(function() {

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

  // Wrap an inner SVG element with a square viewBox and a soft radial-glow
  // background tinted to the instrument's accent color. Used by the
  // collection-card silhouettes which are rendered into a fixed-aspect tile.
  function cardWrap(type, inner) {
    var color = accentFor(type);
    var safeId = type.replace(/[^a-z0-9_-]/g, "x") + "-grad";
    return ''
      + '<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet" style="width:100%;height:100%;display:block">'
      +   '<defs>'
      +     '<radialGradient id="' + safeId + '" cx="50%" cy="40%" r="55%">'
      +       '<stop offset="0%" stop-color="' + color + '" stop-opacity=".35"/>'
      +       '<stop offset="60%" stop-color="' + color + '" stop-opacity=".08"/>'
      +       '<stop offset="100%" stop-color="' + color + '" stop-opacity="0"/>'
      +     '</radialGradient>'
      +   '</defs>'
      +   '<rect width="100" height="100" fill="url(#' + safeId + ')"/>'
      +   '<g fill="' + color + '" stroke="' + color + '" stroke-linejoin="round" stroke-linecap="round">'
      +     inner
      +   '</g>'
      + '</svg>';
  }

  // Stylized guitar — 6-string electric body, headstock, neck.
  function guitarSvg() {
    return cardWrap("guitar",
      // Body (offset double-cut shape)
      '<path d="M30 70 C20 70 18 60 22 50 C26 40 36 38 44 42 L62 42 C70 38 80 40 84 50 C88 60 86 70 76 70 C72 76 64 78 58 76 L48 76 C42 78 34 76 30 70 Z" fill-opacity=".85" stroke-width="0"/>'
      // Sound hole / pickup
      + '<circle cx="53" cy="58" r="4" fill="#12100E" stroke-width="0"/>'
      // Neck
      + '<rect x="62" y="51" width="14" height="3" fill="#12100E" stroke-width="0"/>'
      // Strings hint
      + '<line x1="22" y1="56" x2="84" y2="56" stroke="#12100E" stroke-opacity=".3" stroke-width=".4"/>'
      + '<line x1="22" y1="59" x2="84" y2="59" stroke="#12100E" stroke-opacity=".3" stroke-width=".4"/>'
    );
  }

  // Stylized piano — three-key keyboard fragment with one black key on top.
  function pianoSvg() {
    return cardWrap("piano",
      '<rect x="20" y="40" width="60" height="30" rx="2" fill="#EDE6DA" stroke-width="1"/>'
      + '<line x1="40" y1="40" x2="40" y2="70" stroke="#12100E" stroke-width="1"/>'
      + '<line x1="60" y1="40" x2="60" y2="70" stroke="#12100E" stroke-width="1"/>'
      + '<rect x="34" y="40" width="12" height="18" fill="#12100E" stroke-width="0"/>'
      + '<rect x="54" y="40" width="12" height="18" fill="#12100E" stroke-width="0"/>'
    );
  }

  // Stylized 4-string bass — long-scale body, slightly more elongated than guitar.
  function bassSvg() {
    return cardWrap("bass",
      '<path d="M28 70 C20 70 18 58 24 50 C30 42 40 42 48 46 L66 46 C74 42 82 44 84 52 C86 60 84 68 76 68 C72 74 64 76 58 74 L48 76 C40 78 32 76 28 70 Z" fill-opacity=".85" stroke-width="0"/>'
      + '<rect x="64" y="55" width="18" height="3" fill="#12100E" stroke-width="0"/>'
      + '<line x1="22" y1="56" x2="84" y2="56" stroke="#12100E" stroke-opacity=".4" stroke-width=".5"/>'
      + '<line x1="22" y1="61" x2="84" y2="61" stroke="#12100E" stroke-opacity=".4" stroke-width=".5"/>'
    );
  }

  // Stylized ukulele — small soprano body, short neck, 4 strings.
  function ukuleleSvg() {
    return cardWrap("ukulele",
      // Figure-8 body
      '<path d="M40 64 C32 64 28 56 32 50 C36 44 44 44 48 48 L52 48 C56 44 64 44 68 50 C72 56 68 64 60 64 C56 70 50 72 48 70 C46 72 42 70 40 64 Z" fill-opacity=".85" stroke-width="0"/>'
      + '<circle cx="50" cy="56" r="3" fill="#12100E" stroke-width="0"/>'
      // Short neck
      + '<rect x="68" y="54" width="14" height="3" fill="#12100E" stroke-width="0"/>'
      // Strings
      + '<line x1="34" y1="55" x2="80" y2="55" stroke="#12100E" stroke-opacity=".3" stroke-width=".3"/>'
      + '<line x1="34" y1="57" x2="80" y2="57" stroke="#12100E" stroke-opacity=".3" stroke-width=".3"/>'
    );
  }

  // Stylized drum kit — kick + snare from above.
  function drumsSvg() {
    return cardWrap("drums",
      '<ellipse cx="50" cy="62" rx="22" ry="10" fill-opacity=".85" stroke-width="0"/>'
      + '<ellipse cx="50" cy="62" rx="14" ry="6" fill="#12100E" stroke-width="0"/>'
      + '<rect x="30" y="40" width="10" height="8" rx="1" fill-opacity=".75" stroke-width="0"/>'
      + '<rect x="60" y="40" width="10" height="8" rx="1" fill-opacity=".75" stroke-width="0"/>'
      + '<line x1="32" y1="38" x2="36" y2="34" stroke-width="1.5" stroke-opacity=".7"/>'
      + '<line x1="68" y1="38" x2="64" y2="34" stroke-width="1.5" stroke-opacity=".7"/>'
    );
  }

  function genericSvg() {
    return cardWrap("guitar",
      '<path d="M50 30 L50 60 M40 60 a10 8 0 1 0 20 0 a10 8 0 1 0 -20 0 Z" fill-opacity=".85" stroke-width="2"/>'
    );
  }

  // Build a hero-card SVG (16:10 wide, instrument silhouette centered with
  // strong soft-glow background) for the launcher featured-instrument hero.
  function heroSvg(type) {
    var color = accentFor(type);
    var inner = ({
      guitar:  guitarSvg,
      bass:    bassSvg,
      ukulele: ukuleleSvg,
      piano:   pianoSvg,
      drums:   drumsSvg
    }[type] || genericSvg)();
    // Wrap the existing 100x100 SVG inside a 160x100 hero so it stays
    // centered while filling the wider aspect ratio.
    var safeId = type.replace(/[^a-z0-9_-]/g, "x") + "-hero-grad";
    return ''
      + '<svg viewBox="0 0 160 100" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice" style="width:100%;height:100%;display:block">'
      +   '<defs>'
      +     '<radialGradient id="' + safeId + '" cx="50%" cy="50%" r="60%">'
      +       '<stop offset="0%" stop-color="' + color + '" stop-opacity=".4"/>'
      +       '<stop offset="60%" stop-color="' + color + '" stop-opacity=".1"/>'
      +       '<stop offset="100%" stop-color="#1A0F08" stop-opacity="1"/>'
      +     '</radialGradient>'
      +   '</defs>'
      +   '<rect width="160" height="100" fill="url(#' + safeId + ')"/>'
      +   '<g transform="translate(30 0) scale(1)">'
      +     inner
      +   '</g>'
      + '</svg>';
  }

  function cardSvg(type) {
    return ({
      guitar:  guitarSvg,
      bass:    bassSvg,
      ukulele: ukuleleSvg,
      piano:   pianoSvg,
      drums:   drumsSvg
    }[type] || genericSvg)();
  }

  window.SparkShowroomSVG = {
    card: cardSvg,
    hero: heroSvg,
    accent: accentFor
  };
})();
