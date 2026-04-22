#!/usr/bin/env node
// Lists available instrument templates.
var templates = {
  stringed: { name: "Stringed", examples: ["guitar","ukulele","bass","mandolin"], defaults: { strings:6, noteLaneType:"string" } },
  keys: { name: "Keyboard", examples: ["piano","organ","synth"], defaults: { strings:null, noteLaneType:"key" } },
  pads: { name: "Percussion", examples: ["drums","djembe","cajon"], defaults: { strings:null, noteLaneType:"pad" } }
};
var cmd = process.argv[2] || "--list";
if (cmd === "--list") {
  console.log("Available templates:");
  Object.keys(templates).forEach(function(k) { var t=templates[k]; console.log("  "+k+" - "+t.name+" ("+t.examples.join(", ")+")"); });
} else if (cmd === "--describe" && process.argv[3]) {
  var t = templates[process.argv[3]];
  if (!t) { console.error("Unknown: " + process.argv[3]); process.exit(1); }
  console.log(JSON.stringify(t, null, 2));
} else {
  console.log("Usage: node scripts/instrument_generator_templates.js [--list | --describe <name>]");
}
