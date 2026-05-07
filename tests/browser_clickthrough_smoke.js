var assert = require("assert");
var path = require("path");
var playwright = require("@playwright/test");

var chromium = playwright.chromium;

function appUrl(label) {
  return "file:///" + path.resolve(__dirname, "..", "index.html").replace(/\\/g, "/") + "?" + label + "=" + Date.now();
}

function summarizeConsoleMessage(msg) {
  return msg.type() + ": " + msg.text();
}

async function settle(page, ms) {
  await page.waitForTimeout(ms || 250);
}

async function dismissFirstRun(page) {
  var cta = page.getByText("LET'S GO!", { exact: false });
  if (await cta.count()) {
    await cta.click();
    await settle(page, 350);
  }
}

async function launchInstrument(page, label) {
  var launcherCard = page.getByLabel("Launch " + label);
  assert.strictEqual(await launcherCard.count(), 1, "expected one launcher card for " + label);
  await launcherCard.click();
  await settle(page, 750);
}

async function assertAppHasContent(page, context) {
  var text = (await page.locator("#app").innerText()).trim();
  assert.ok(text.length > 80, context + " rendered too little content");
}

async function openTab(page, tab) {
  await page.evaluate(function(nextTab) {
    if (window.act) window.act("tab", nextTab);
  }, tab);
  await settle(page, 300);
}

async function main() {
  var browser = await chromium.launch({ headless: true });
  var page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  var consoleProblems = [];

  page.on("pageerror", function(err) {
    consoleProblems.push("pageerror: " + err.message);
  });
  page.on("console", function(msg) {
    if (msg.type() === "error" || msg.type() === "warning") {
      consoleProblems.push(summarizeConsoleMessage(msg));
    }
  });

  await page.goto(appUrl("browserSmoke"));
  await page.waitForLoadState("domcontentloaded");
  await settle(page, 500);
  await dismissFirstRun(page);

  await launchInstrument(page, "Piano");
  await assertAppHasContent(page, "Piano home");
  await openTab(page, "games");
  await assertAppHasContent(page, "Piano games tab");
  await openTab(page, "songs");
  await assertAppHasContent(page, "Piano songs tab");
  await openTab(page, "tools");
  await assertAppHasContent(page, "Piano tools tab");
  await openTab(page, "practice");

  var cMajorCard = page.locator(".chord-card").filter({ hasText: "C" });
  assert.ok(await cMajorCard.count() >= 1, "expected C chord card on piano practice tab");
  await cMajorCard.first().click();
  await settle(page, 1200);
  assert.ok((await page.locator("#app").innerText()).indexOf("C Major") >= 0, "C major lesson did not open");

  await page.getByLabel("Back to launcher").click();
  await settle(page, 500);
  await launchInstrument(page, "Guitar");
  await assertAppHasContent(page, "Guitar home");

  var guitarTabs = ["practice", "drill", "daily", "quiz", "ear", "strum", "songs", "rhythm", "runner", "build", "tuner", "dual", "stats", "guide"];
  for (var i = 0; i < guitarTabs.length; i++) {
    await openTab(page, guitarTabs[i]);
    await assertAppHasContent(page, "Guitar " + guitarTabs[i] + " tab");
  }

  await browser.close();

  assert.deepStrictEqual(consoleProblems, []);
  console.log("PASS: browser clickthrough smoke stays console-clean");
}

main().catch(function(err) {
  console.error(err && err.stack ? err.stack : err);
  process.exit(1);
});
