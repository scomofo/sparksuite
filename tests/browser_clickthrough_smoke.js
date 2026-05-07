var assert = require("assert");
var path = require("path");
var playwright = require("@playwright/test");

var chromium = playwright.chromium;

function appUrl(label) {
  return "file:///" + path.resolve(__dirname, "..", "index.html").replace(/\\/g, "/") + "?" + label + "=" + Date.now();
}

function summarizeConsoleMessage(msg) {
  var location = msg.location && msg.location();
  var source = location && location.url ? " (" + location.url + ")" : "";
  return msg.type() + ": " + msg.text() + source;
}

function isIgnorableConsoleMessage(msg) {
  var text = msg.text();
  var location = msg.location && msg.location();
  var url = location && location.url ? location.url : "";
  if (
    msg.type() === "error"
    && text.indexOf("Failed to load resource: net::ERR_CONNECTION_TIMED_OUT") >= 0
    && url.indexOf("https://fonts.gstatic.com/") === 0
  ) return true;
  return msg.type() === "warning" && text.indexOf("GL Driver Message") >= 0 && text.indexOf("ReadPixels") >= 0;
}

function trackConsoleProblems(page, consoleProblems) {
  page.on("pageerror", function(err) {
    consoleProblems.push("pageerror: " + err.message);
  });
  page.on("console", function(msg) {
    if (isIgnorableConsoleMessage(msg)) return;
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

async function assertNoRawUiTokens(page, context) {
  var text = (await page.locator("#app").innerText()).trim();
  assert.strictEqual(text.indexOf("undefined"), -1, context + " rendered raw undefined text");
  assert.strictEqual(text.indexOf("NaN"), -1, context + " rendered raw NaN text");
  assert.strictEqual(text.indexOf("0/0 chords"), -1, context + " rendered an empty chord counter");
}

async function openTab(page, tab) {
  await page.evaluate(function(nextTab) {
    if (window.act) window.act("tab", nextTab);
  }, tab);
  await settle(page, 300);
}

async function scanInstrumentTabs(page, label, tabs) {
  await launchInstrument(page, label);
  await assertAppHasContent(page, label + " home");
  await assertNoRawUiTokens(page, label + " home");
  for (var i = 0; i < tabs.length; i++) {
    await openTab(page, tabs[i]);
    await assertAppHasContent(page, label + " " + tabs[i] + " tab");
    await assertNoRawUiTokens(page, label + " " + tabs[i] + " tab");
  }
  await page.getByLabel("Back to launcher").click();
  await settle(page, 500);
}

async function assertVocalsLessonLaunch(page) {
  await launchInstrument(page, "Vocals");
  await page.getByText("START VOCAL LESSON", { exact: false }).first().click();
  await settle(page, 900);
  var text = (await page.locator("#app").innerText()).trim();
  assert.ok(text.indexOf("Voice Setup Without Judgment") >= 0 || text.indexOf("Voice Setup Practice") >= 0, "vocal lesson launch did not include the selected lesson");
  assert.ok(text.indexOf("Quick warmup") >= 0, "vocal lesson plan did not keep the supporting warmup");
  await page.getByLabel("Back to launcher").click();
  await settle(page, 500);
}

async function assertInstrumentPerformanceLaunch(page, label) {
  await page.goto(appUrl("browserPerformanceSmoke" + label));
  await page.waitForLoadState("domcontentloaded");
  await settle(page, 500);
  await dismissFirstRun(page);
  await launchInstrument(page, label);
  await openTab(page, "songs");
  var performButtons = page.locator("#app button").filter({ hasText: "PERFORM" });
  assert.ok(await performButtons.count() >= 1, label + " songs tab did not expose performance buttons");
  await performButtons.first().click();
  await settle(page, 900);
  var text = (await page.locator("#app").innerText()).trim();
  assert.ok(/performance|pause|stop|combo|accuracy/i.test(text), label + " performance button did not open a performance session");
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

async function assertMobileInstrumentScrollResets(page) {
  var cases = [
    { instrument: "Ukulele", tab: "practice" },
    { instrument: "Piano", tab: "tools" }
  ];
  for (var i = 0; i < cases.length; i++) {
    await openLauncherView(page, "instruments");
    await page.evaluate(function() { window.scrollTo(0, document.documentElement.scrollHeight); });
    await settle(page, 100);
    await launchInstrument(page, cases[i].instrument);
    await settle(page, 100);
    assert.ok(await page.evaluate(function() { return window.scrollY <= 2; }), cases[i].instrument + " launch did not reset mobile scroll");
    await page.evaluate(function() { window.scrollTo(0, document.documentElement.scrollHeight); });
    await settle(page, 100);
    await openTab(page, cases[i].tab);
    assert.ok(await page.evaluate(function() { return window.scrollY <= 2; }), cases[i].instrument + " tab switch did not reset mobile scroll");
    await page.getByLabel("Back to launcher").click();
    await settle(page, 500);
  }
}

async function visibleControlLayoutIssues(page) {
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
    var controls = Array.prototype.slice.call(document.querySelectorAll("#app button,#app a,#app input,#app select"))
      .filter(isVisible)
      .filter(function(el) { return !el.closest(".showroom-bottomnav"); });
    return controls.reduce(function(issues, el) {
      var r = el.getBoundingClientRect();
      var label = (el.innerText || el.value || el.getAttribute("aria-label") || "").trim().replace(/\s+/g, " ").slice(0, 80);
      if (!label) return issues;
      if (r.width < 28 || r.height < 24) issues.push("tiny control: " + label);
      if (el.scrollWidth > el.clientWidth + 2) issues.push("clipped control text: " + label);
      return issues;
    }, []);
  });
}

async function assertMobileActionControlsFit(page) {
  var cases = [
    { instrument: "Guitar", tab: "dual" },
    { instrument: "Bass", tab: "songs" },
    { instrument: "Ukulele", tab: "songs" }
  ];
  for (var i = 0; i < cases.length; i++) {
    await openLauncherView(page, "instruments");
    await launchInstrument(page, cases[i].instrument);
    await openTab(page, cases[i].tab);
    await page.evaluate(function() { window.scrollTo(0, 0); });
    await settle(page, 100);
    assert.deepStrictEqual(await visibleControlLayoutIssues(page), [], cases[i].instrument + " " + cases[i].tab + " has crowded visible controls");
    await page.getByLabel("Back to launcher").click();
    await settle(page, 500);
  }
}

async function assertNoMobilePageHorizontalOverflow(page) {
  var cases = [
    { instrument: "Piano", tabs: ["practice", "games"] },
    { instrument: "Guitar", tabs: ["practice", "songs"] },
    { instrument: "Bass", tabs: ["practice", "songs"] },
    { instrument: "Drums", tabs: ["practice"] },
    { instrument: "Ukulele", tabs: ["practice", "songs"] },
    { instrument: "Vocals", tabs: ["practice"] }
  ];
  for (var i = 0; i < cases.length; i++) {
    await openLauncherView(page, "instruments");
    await launchInstrument(page, cases[i].instrument);
    await assertViewportHasNoHorizontalOverflow(page, cases[i].instrument + " home");
    for (var t = 0; t < cases[i].tabs.length; t++) {
      await openTab(page, cases[i].tabs[t]);
      await assertViewportHasNoHorizontalOverflow(page, cases[i].instrument + " " + cases[i].tabs[t]);
    }
    await page.getByLabel("Back to launcher").click();
    await settle(page, 500);
  }
}

async function assertViewportHasNoHorizontalOverflow(page, context) {
  var overflow = await page.evaluate(function() {
    var doc = document.documentElement;
    var body = document.body;
    var scrollWidth = Math.max(doc.scrollWidth, body ? body.scrollWidth : 0);
    var clientWidth = doc.clientWidth;
    return { scrollWidth: scrollWidth, clientWidth: clientWidth };
  });
  assert.ok(
    overflow.scrollWidth <= overflow.clientWidth + 2,
    context + " creates horizontal page overflow: " + overflow.scrollWidth + " > " + overflow.clientWidth
  );
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
  await assertNoRawUiTokens(page, "Piano home");
  await openTab(page, "games");
  await assertAppHasContent(page, "Piano games tab");
  await assertNoRawUiTokens(page, "Piano games tab");
  await openTab(page, "songs");
  await assertAppHasContent(page, "Piano songs tab");
  await assertNoRawUiTokens(page, "Piano songs tab");
  await openTab(page, "tools");
  await assertAppHasContent(page, "Piano tools tab");
  await assertNoRawUiTokens(page, "Piano tools tab");
  await openTab(page, "practice");

  var cMajorCard = page.locator(".chord-card").filter({ hasText: "C" });
  assert.ok(await cMajorCard.count() >= 1, "expected C chord card on piano practice tab");
  await cMajorCard.first().click();
  await settle(page, 1200);
  assert.ok((await page.locator("#app").innerText()).indexOf("C Major") >= 0, "C major lesson did not open");

  await page.getByLabel("Back to launcher").click();
  await settle(page, 500);

  var guitarTabs = ["practice", "drill", "daily", "quiz", "ear", "strum", "songs", "rhythm", "runner", "build", "tuner", "dual", "stats", "guide"];
  await scanInstrumentTabs(page, "Guitar", guitarTabs);
  await scanInstrumentTabs(page, "Bass", ["practice", "drill", "songs", "stats", "guide"]);
  await scanInstrumentTabs(page, "Drums", ["practice", "stats"]);
  await scanInstrumentTabs(page, "Ukulele", ["practice", "drill", "daily", "quiz", "ear", "strum", "songs", "rhythm", "runner", "build", "tuner", "stats", "guide"]);
  await scanInstrumentTabs(page, "Vocals", ["practice", "stats"]);
  await assertVocalsLessonLaunch(page);
  await assertInstrumentPerformanceLaunch(page, "Bass");
  await assertInstrumentPerformanceLaunch(page, "Ukulele");

  var mobilePage = await browser.newPage({ viewport: { width: 390, height: 844 } });
  trackConsoleProblems(mobilePage, consoleProblems);
  await mobilePage.goto(appUrl("browserMobileSmoke"));
  await mobilePage.waitForLoadState("domcontentloaded");
  await settle(mobilePage, 500);
  await dismissFirstRun(mobilePage);
  await assertMobileInstrumentScrollResets(mobilePage);
  await assertMobileActionControlsFit(mobilePage);
  await assertNoMobilePageHorizontalOverflow(mobilePage);
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
