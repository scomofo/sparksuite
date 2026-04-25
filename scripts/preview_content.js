const fs = require("fs");
const path = require("path");
const loader = require("../js/sparksuite/content/load_instrument_content.js");
const validator = require("../js/sparksuite/content/validate_content.js");
const factory = require("../js/sparksuite/content/create_instrument_module.js");
const moduleValidator = require("../js/sparksuite/content/validate_instrument_module.js");

function resolveContentBaseDir(options) {
  const opts = options || {};
  return opts.baseDir || path.join(process.cwd(), "content", "instruments");
}

function buildPreviewLines(instrumentId, options) {
  const opts = options || {};
  const content = loader.loadInstrumentContentSync(instrumentId, {
    fs: opts.fs || fs,
    baseDir: resolveContentBaseDir(opts)
  });
  const validation = validator.validateInstrumentContent(content);

  if (!validation.ok) {
    const error = new Error("Content validation failed for " + instrumentId);
    error.validationErrors = validation.errors.slice();
    throw error;
  }

  moduleValidator.validateInstrumentModule(factory.createInstrumentModule(content), instrumentId);

  return [
    content.instrument.name + " content preview",
    "- version: " + content.instrument.version,
    "- skills: " + validation.counts.skills,
    "- lessons: " + validation.counts.lessons,
    "- exercises: " + validation.counts.exercises,
    "- songs: " + validation.counts.songs,
    "- duplicate IDs: 0",
    "- missing prerequisites: 0",
    "- invalid chord references: 0",
    "- invalid chart lanes: 0"
  ];
}

function previewInstrumentContent(instrumentId, options) {
  return buildPreviewLines(instrumentId, options).join("\n");
}

function runCli(argv) {
  const instrumentId = argv[2];
  if (!instrumentId) {
    console.error("Usage: node scripts/preview_content.js <instrument-id>");
    return 1;
  }

  try {
    console.log(previewInstrumentContent(instrumentId));
    return 0;
  } catch (error) {
    console.error(error.message || String(error));
    if (Array.isArray(error.validationErrors) && error.validationErrors.length) {
      console.error(error.validationErrors.join("\n"));
    }
    return 1;
  }
}

if (require.main === module) {
  process.exit(runCli(process.argv));
}

module.exports = {
  buildPreviewLines,
  previewInstrumentContent,
  runCli
};
