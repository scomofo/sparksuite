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

function trackConsoleProblems(page, consoleProblems) {
  page.on("pageerror", function(err) {
    consoleProblems.push("pageerror: " + err.message);
  });
  page.on("console", function(msg) {
    if (msg.type() === "error" || msg.type() === "warning") {
      consoleProblems.push(summarizeConsoleMessage(msg));
    }
  });
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

async function openLauncherView(page, view) {
  await page.evaluate(function(nextView) {
    if (!window.act) return;
    if (nextView === "home") window.act("showLauncher");
    else window.act("openLauncherView", nextView);
  }, view);
  await settle(page, 350);
}

async function coveredTargetsAtViewportBottom(page) {
  return page.evaluate(function() {
    function isVisible(el) {
      var s = window.getComputedStyle(el);
      var r = el.getBoundingClientRect();
      return s.display !== "none"
        && s.visibility !== "hidden"
        && r.width > 0
        && r.height > 0
        && r.bottom > 0
        && r.top < window.innerHeight
        && r.right > 0
        && r.left < window.innerWidth;
    }
    var nav = document.querySelector(".showroom-bottomnav");
    if (!nav) return [];
    var nr = nav.getBoundingClientRect();
    var targets = Array.prototype.slice.call(document.querySelectorAll("button,[role=\"button\"],a,input,select,.showroom-card,.showroom-drill,.showroom-row"))
      .filter(isVisible)
      .filter(function(el) { return !el.closest(".showroom-bottomnav"); });
    return targets.filter(function(el) {
      var r = el.getBoundingClientRect();
      var x = Math.max(0, Math.min(r.right, nr.right) - Math.max(r.left, nr.left));
      var y = Math.max(0, Math.min(r.bottom, nr.bottom) - Math.max(r.top, nr.top));
      return x * y > 20;
    }).map(function(el) {
      return (el.innerText || el.value || el.getAttribute("aria-label") || "").trim().slice(0, 80);
    });
  });
}

async function assertLauncherViewScrollsCleanly(page, view) {
  await openLauncherView(page, view);
  await assertAppHasContent(page, "Launcher " + view + " view");
  await page.evaluate(function() {
    window.scrollTo(0, document.documentElement.scrollHeight);
  });
  await settle(page, 100);
  assert.deepStrictEqual(await coveredTargetsAtViewportBottom(page), [], "bottom nav covers content in launcher " + view + " view");
  await page.evaluate(function() { window.scrollTo(0, 0); });
}

async function main() {
  var browser = await chromium.launch({ headless: true });
  var page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  var consoleProblems = [];

  trackConsoleProblems(page, consoleProblems);

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

  var mobilePage = await browser.newPage({ viewport: { width: 390, height: 844 } });
  trackConsoleProblems(mobilePage, consoleProblems);
  await mobilePage.goto(appUrl("browserMobileSmoke"));
  await mobilePage.waitForLoadState("domcontentloaded");
  await settle(mobilePage, 500);
  await dismissFirstRun(mobilePage);
  var launcherViews = ["home", "library", "learn", "settings", "profile", "instruments", "tools", "practice", "lesson", "performance"];
  for (var j = 0; j < launcherViews.length; j++) {
    await assertLauncherViewScrollsCleanly(mobilePage, launcherViews[j]);
  }

  await browser.close();

  assert.deepStrictEqual(consoleProblems, []);
  console.log("PASS: browser clickthrough smoke stays console-clean");
}

main().catch(function(err) {
  console.error(err && err.stack ? err.stack : err);
  process.exit(1);
});
