const fs = require("fs");
const path = require("path");
const loader = require("../js/sparksuite/content/load_instrument_content.js");
const validator = require("../js/sparksuite/content/validate_content.js");
const factory = require("../js/sparksuite/content/create_instrument_module.js");
const moduleValidator = require("../js/sparksuite/content/validate_instrument_module.js");

const instrumentId = process.argv[2];

if (!instrumentId) {
  console.error("Usage: node scripts/preview_content.js <instrument-id>");
  process.exit(1);
}

const content = loader.loadInstrumentContentSync(instrumentId, {
  fs: fs,
  baseDir: path.join(process.cwd(), "content", "instruments")
});
const validation = validator.validateInstrumentContent(content);

if (!validation.ok) {
  console.error("Content validation failed for " + instrumentId);
  console.error(validation.errors.join("\n"));
  process.exit(1);
}

moduleValidator.validateInstrumentModule(factory.createInstrumentModule(content), instrumentId);

console.log(content.instrument.name + " content preview");
console.log("- version: " + content.instrument.version);
console.log("- skills: " + validation.counts.skills);
console.log("- lessons: " + validation.counts.lessons);
console.log("- exercises: " + validation.counts.exercises);
console.log("- songs: " + validation.counts.songs);
console.log("- duplicate IDs: 0");
console.log("- missing prerequisites: 0");
console.log("- invalid chord references: 0");
console.log("- invalid chart lanes: 0");
