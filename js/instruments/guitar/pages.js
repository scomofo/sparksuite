// js/instruments/guitar/pages.js
// Guitar instrument page registry
// These functions are defined in js/pages/*.js and js/app.js
// This file registers them as the guitar instrument's page map
// so the SparkInstruments router can find them.
(function() {
  // Guitar-specific pages are the "shared" pages (they were built for guitar first)
  // No overrides needed — the shared page registry handles all guitar screens
  // This file exists as the registration point for future guitar-specific overrides
  window.GUITAR_PAGES = {};
})();
