const assert = require("assert");
const fs = require("fs");
const childProcess = require("child_process");

childProcess.execFileSync("node", ["scripts/apply_generated_instrument.js", "--skip-validate"], {
  cwd: process.cwd(),
  stdio: "pipe"
});

const scriptPaths = [
  "scripts/apply_generated_instrument.js",
  "scripts/generate_instrument_pipeline.js",
  "scripts/generate_watch_preview.js"
];

for (const scriptPath of scriptPaths) {
  const code = fs.readFileSync(scriptPath, "utf8");
  assert(!code.includes("apply_generated_instrument_final.js"), `${scriptPath} still references apply_generated_instrument_final.js`);
  assert(!code.includes("generate_instrument_pipeline_final.js"), `${scriptPath} still references generate_instrument_pipeline_final.js`);
}

const html = fs.readFileSync("index.html", "utf8");
const start = html.indexOf("<!-- Instrument Modules -->");
const end = html.indexOf('<script src="js/data.js"></script>', start);
assert(start >= 0, "index.html is missing the Instrument Modules block");
assert(end > start, "index.html instrument block must end before js/data.js");

const block = html.slice(start, end);
assert(block.includes('data-deferred-src="js/instruments/bass/data.js"'), "instrument block must keep runtime scripts deferred");
assert(!block.includes('<script src="js/instruments/instrument_manifest.generated.js"'), "instrument manifest must not be eager-loaded in the runtime block");
assert(!block.includes('<script src="js/instruments/discovery_loader.js"'), "discovery loader must not be eager-loaded in the runtime block");
assert(!block.includes('data-deferred-src="js/sparksuite/instruments/'), "runtime block must not duplicate SparkSuite core instrument modules");

const expectedOrder = [
  "js/instruments/bass/data.js",
  "js/instruments/bass/ui.js",
  "js/instruments/bass/register.js",
  "js/instruments/bass/app.js",
  "js/instruments/guitar/pages.js",
  "js/instruments/guitar/capo.js",
  "js/instruments/guitar/register.js",
  "js/instruments/guitar/app.js",
  "js/instruments/piano/data.js",
  "js/instruments/piano/audio.js",
  "js/instruments/piano/ui.js",
  "js/instruments/piano/watch.js",
  "js/instruments/piano/register.js",
  "js/instruments/piano/app.js",
  "js/instruments/ukulele/chord_normalizer.js",
  "js/instruments/ukulele/validator.js",
  "js/instruments/ukulele/ukulele_svg.js",
  "js/instruments/ukulele/register.js"
];

let previous = -1;
for (const src of expectedOrder) {
  const index = block.indexOf(src);
  assert(index >= 0, `instrument block missing ${src}`);
  assert(index > previous, `${src} is out of deterministic runtime order`);
  previous = index;
}

const manifest = fs.readFileSync("js/instruments/instrument_manifest.generated.js", "utf8");
assert(manifest.includes("Regenerate with: node scripts/apply_generated_instrument.js"), "manifest header must reference canonical apply script");
assert(manifest.includes("js/instruments/piano/watch.js"), "manifest must include piano watch runtime module");
assert(manifest.includes('{ id: "vocalspark", instrument: "vocals"'), "manifest must preserve VocalSpark app id when register.js uses constants");
assert(!manifest.includes('{ id: "vocals", instrument: "vocals"'), "manifest must not collapse VocalSpark app id to the generic instrument id");
assert(
  manifest.indexOf("js/sparksuite/instruments/bass/bass_module.js") < manifest.indexOf("js/sparksuite/instruments/bass/bass_curriculum_integration.js"),
  "manifest must load bass module before bass curriculum integration"
);

console.log("test_instrument_pipeline_cleanup passed");
