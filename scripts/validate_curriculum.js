#!/usr/bin/env node
// Validates curriculum contracts. Delegates to test_curriculum_guardrails.js.
var path = require("path");
try { require(path.join(__dirname, "..", "tests", "test_curriculum_guardrails.js")); }
catch (e) { console.error("Validation failed: " + e.message); process.exit(1); }
