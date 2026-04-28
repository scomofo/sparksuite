const assert = require("assert");
const fs = require("fs");

const html = fs.readFileSync("index.html", "utf8");
const scripts = [
  'data-deferred-src="js/dev/curriculum_validator.js"',
  'data-deferred-src="js/dev/dev_curriculum_highlighter.js"',
  'data-deferred-src="js/dev/dev_overlay.js"',
  'data-deferred-src="js/dev/dev_reload_client.js"',
  'data-deferred-src="js/dev/dev_panel.js"',
  'src="js/app.js"'
];

let previous = -1;
for (const script of scripts) {
  const index = html.indexOf(script);
  assert(index >= 0, `index.html must load ${script}`);
  assert(index > previous, `${script} must load after the previous dev/app script`);
  previous = index;
}

const panel = fs.readFileSync("js/dev/dev_panel.js", "utf8");
[
  "spark_dev_panel_open",
  "spark_dev_dock_position",
  "spark_dev_filter_type",
  "spark_dev_filter_severity",
  "spark_dev_active_tab"
].forEach((key) => {
  assert(panel.includes(key), `dev panel must persist ${key}`);
});

assert(panel.includes("SparkCurriculumValidator.validateCurriculum"), "dev panel must consume structured validator issues");
assert(panel.includes("spark-dev-error-nav"), "dev panel must hide the legacy curriculum issue nav");

const highlighter = fs.readFileSync("js/dev/dev_curriculum_highlighter.js", "utf8");
assert(highlighter.includes("SparkCurriculumValidator.groupIssues"), "highlighter must consume grouped structured issues");

const gitignore = fs.readFileSync(".gitignore", "utf8");
assert(gitignore.includes("_dev_reload_signal.txt"), "hot reload signal file must be ignored");

console.log("test_dev_tooling_wiring passed");
