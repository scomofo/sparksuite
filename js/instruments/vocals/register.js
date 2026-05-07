(function () {
  "use strict";

  var W = typeof window !== "undefined" ? window : globalThis;
  var ID = "vocals";
  var APP_ID = "vocalspark";

  function getState() {
    if (!W.S || typeof W.S !== "object") W.S = {};
    return W.S;
  }

  function getLessons() {
    try {
      if (W.SparkVocalsModule && typeof W.SparkVocalsModule.getLessons === "function") {
        return W.SparkVocalsModule.getLessons() || [];
      }
    } catch (err) {
      console.warn("[VocalSpark] getLessons failed", err);
    }
    return [];
  }

  function getSkillTree() {
    try {
      if (W.SparkVocalsModule && typeof W.SparkVocalsModule.getSkillTree === "function") {
        return W.SparkVocalsModule.getSkillTree();
      }
    } catch (err) {
      console.warn("[VocalSpark] getSkillTree failed", err);
    }
    return null;
  }

  function getRhythmAdapter() {
    try {
      if (W.SparkVocalsModule && typeof W.SparkVocalsModule.getRhythmAdapter === "function") {
        return W.SparkVocalsModule.getRhythmAdapter();
      }
    } catch (err) {
      console.warn("[VocalSpark] getRhythmAdapter failed", err);
    }
    return null;
  }

  function getCurriculumMap() {
    try {
      if (W.SparkVocalsModule && typeof W.SparkVocalsModule.getCurriculumMap === "function") {
        return W.SparkVocalsModule.getCurriculumMap() || [];
      }
    } catch (err) {
      console.warn("[VocalSpark] getCurriculumMap failed", err);
    }
    return [];
  }

  function getExercises(skillOrLessonId) {
    try {
      if (W.SparkVocalsModule && typeof W.SparkVocalsModule.getExercises === "function") {
        return W.SparkVocalsModule.getExercises(skillOrLessonId) || [];
      }
    } catch (err) {
      console.warn("[VocalSpark] getExercises failed", err);
    }
    return [];
  }

  function esc(value) {
    if (typeof W.escHTML === "function") return W.escHTML(value == null ? "" : String(value));
    return String(value == null ? "" : value).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }

  function attr(value) {
    return String(value == null ? "" : value).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function lessonButton(label, lessonId, className, style) {
    return '<button class="' + (className || "btn") + '" style="' + (style || "") + '" onclick="return startVocalsLesson(\'' + attr(lessonId) + '\')">' + esc(label) + "</button>";
  }

  function vocalsPracticeTab() {
    var lessons = getLessons();
    var S = getState();
    var completed = Array.isArray(S.completedLessons) ? S.completedLessons : [];
    var next = null;
    var i;

    for (i = 0; i < lessons.length; i += 1) {
      if (completed.indexOf(lessons[i].id) < 0) {
        next = lessons[i];
        break;
      }
    }
    if (!next) next = lessons[0] || null;

    var html = '<div class="card mb12" style="text-align:center">';
    html += "<h2>VocalSpark</h2>";
    if (next) {
      html += "<div>Next: " + esc(next.title || next.id) + "</div>";
      html += lessonButton("Start Vocal Lesson", next.id, "btn", "margin-top:10px");
    }
    html += "</div>";
    html += '<div class="card">';
    for (i = 0; i < lessons.length; i += 1) {
      html += '<div style="margin:6px 0">';
      html += esc(lessons[i].title || lessons[i].id);
      html += lessonButton("Start", lessons[i].id, "btn btn-sm", "margin-left:10px");
      html += "</div>";
    }
    html += "</div>";
    return html;
  }

  function sameInstrument(item) {
    var values;
    var i;
    var value;
    if (!item) return false;
    values = [item.id, item.key, item.slug, item.instrumentId, item.appId, item.instrument];
    for (i = 0; i < values.length; i += 1) {
      value = String(values[i] || "").toLowerCase();
      if (value === ID || value === "vocalspark") return true;
    }
    return false;
  }

  function upsertArray(arr, item) {
    if (!Array.isArray(arr)) return false;

    for (var i = 0; i < arr.length; i += 1) {
      if (sameInstrument(arr[i])) {
        arr[i] = Object.assign({}, arr[i], item);
        return true;
      }
    }

    arr.push(item);
    return true;
  }

  function upsertObject(obj, item) {
    if (!obj || typeof obj !== "object" || Array.isArray(obj)) return false;
    obj[ID] = Object.assign({}, obj[ID] || {}, item);
    return true;
  }

  function buildInstrument() {
    return {
      id: APP_ID,
      key: ID,
      slug: ID,
      instrument: "vocals",
      instrumentId: ID,
      appId: APP_ID,
      name: "Vocals",
      title: "VocalSpark",
      displayName: "VocalSpark",
      shortName: "Vocals",
      moduleName: "SparkVocalsModule",
      adapterName: "SparkVocalsAdapter",
      family: "voice",
      type: "voice",
      category: "voice",
      icon: "V",
      emoji: "V",
      iconImage: "resources/instruments/vocals/card.png",
      heroImage: "resources/instruments/vocals/hero.jpg",
      description: "Pitch, breath, rhythm, and ear training.",
      shortDescription: "Pitch, breath, rhythm, and ear training.",
      enabled: true,
      isEnabled: true,
      visible: true,
      showroom: true,
      selectable: true,
      order: 65,
      available: true,
      getLessons: getLessons,
      lessons: getLessons,
      getData: function () {
        return {
          CHORDS: {},
          ALL_CHORDS: {},
          CURRICULUM: getLessons(),
          SKILL_TREE: getSkillTree() || [],
          SESSIONS: [],
          SONGS: []
        };
      },
      getSkillTree: getSkillTree,
      getExercises: getExercises,
      getRhythmAdapter: getRhythmAdapter,
      getCurriculumMap: getCurriculumMap,
      tabs: [
        { id: "practice", label: "Practice" },
        { id: "stats", label: "Stats" }
      ],
      tabRenderers: { practice: vocalsPracticeTab },
      open: openVocalsSpark,
      launch: openVocalsSpark,
      select: openVocalsSpark,
      startLesson: startVocalsLesson,
      init: function () {
        var S = getState();
        S.tab = "practice";
      }
    };
  }

  function registerFunction(name, item) {
    var fn = W[name];
    if (typeof fn !== "function") return false;

    try {
      fn(item);
      return true;
    } catch (err1) {
      try {
        fn(ID, item);
        return true;
      } catch (err2) {
        return false;
      }
    }
  }

  function registerRegistry(name, item) {
    var registry = W[name];
    if (!registry) return false;

    if (Array.isArray(registry)) return upsertArray(registry, item);

    if (typeof registry === "object") {
      var methods = ["register", "add", "set", "upsert", "registerInstrument", "addInstrument"];

      for (var i = 0; i < methods.length; i += 1) {
        var method = methods[i];

        if (typeof registry[method] === "function") {
          if (method === "set" && typeof registry.has === "function" && typeof registry.get === "function") {
            try {
              registry[method](ID, item);
              return true;
            } catch (err0) {}
          }
          try {
            registry[method](item);
            return true;
          } catch (err1) {
            try {
              registry[method](ID, item);
              return true;
            } catch (err2) {}
          }
        }
      }

      return upsertObject(registry, item);
    }

    return false;
  }

  function upsertSparkInstruments(item) {
    var registry = W.SparkInstruments;
    var all;
    var i;
    if (!registry) return false;

    try {
      if (typeof registry.getAll === "function") {
        all = registry.getAll() || [];
        for (i = 0; i < all.length; i += 1) {
          if (sameInstrument(all[i])) {
            Object.assign(all[i], item);
            return true;
          }
        }
      }
    } catch (err) {}

    try {
      if (typeof registry.register === "function") {
        registry.register(item);
        return true;
      }
    } catch (err) {}

    return false;
  }

  function registerVocals() {
    var item = buildInstrument();

    W.SparkVocalsShowroomInstrument = item;
    W.openVocalsSpark = openVocalsSpark;
    W.selectVocalsSpark = openVocalsSpark;
    W.startVocalsLesson = startVocalsLesson;

    [
      "registerInstrument",
      "registerSparkInstrument",
      "addInstrument",
      "addSparkInstrument",
      "registerInstrumentDefinition"
    ].forEach(function (name) {
      registerFunction(name, item);
    });

    [
      "SparkInstrumentRegistry",
      "InstrumentRegistry",
      "instrumentRegistry",
      "sparkInstrumentRegistry",
      "__sparkInstrumentRegistry",
      "SparkSuiteInstrumentRegistry"
    ].forEach(function (name) {
      registerRegistry(name, item);
    });

    upsertSparkInstruments(item);

    [
      "SPARK_INSTRUMENTS",
      "SparkInstruments",
      "INSTRUMENTS",
      "instruments",
      "instrumentCatalog",
      "INSTRUMENT_CATALOG",
      "sparkInstrumentCatalog",
      "__sparkInstrumentCatalog",
      "__SPARK_INSTRUMENTS",
      "INSTRUMENT_MANIFEST",
      "SparkInstrumentManifest",
      "instrumentManifest",
      "__instrumentManifest",
      "__SPARK_INSTRUMENT_MANIFEST",
      "SPARK_INSTRUMENT_MANIFEST"
    ].forEach(function (name) {
      var value = W[name];

      if (Array.isArray(value)) {
        upsertArray(value, item);
      } else {
        upsertObject(value, item);
      }
    });

    try {
      W.dispatchEvent(new CustomEvent("spark:instrument-registered", { detail: item }));
      W.dispatchEvent(new CustomEvent("sparksuite:instrument-registered", { detail: item }));
    } catch (err) {}

    return item;
  }

  function selectVocals(lessonId) {
    var S = getState();

    var request = {
      instrument: ID,
      instrumentId: APP_ID,
      instrumentType: ID,
      appId: APP_ID,
      lessonId: lessonId || null,
      forceRebuild: true,
      createdAt: Date.now(),
      source: "vocals-register"
    };

    W.currentInstrument = ID;
    W.selectedInstrument = APP_ID;
    W.__activeInstrument = APP_ID;
    W.__sparkInstrumentId = APP_ID;
    W.__sparkSelectedInstrument = APP_ID;
    W.__sparkCurrentInstrument = ID;
    W.__sparkForcedLessonRequest = request;

    S.currentInstrument = ID;
    S.selectedInstrument = APP_ID;
    S.instrument = ID;
    S.instrumentId = APP_ID;
    S.activeInstrument = APP_ID;
    S.__activeInstrument = APP_ID;
    S.__sparkInstrumentId = APP_ID;
    S.__sparkSelectedInstrument = APP_ID;
    S.__sparkCurrentInstrument = ID;
    S.__sparkForcedLessonRequest = request;

    try {
      sessionStorage.setItem("spark.currentInstrument", ID);
      sessionStorage.setItem("spark.selectedInstrument", APP_ID);
      sessionStorage.setItem("spark.instrumentId", APP_ID);
    } catch (err) {}

    try {
      localStorage.setItem("spark.currentInstrument", ID);
      localStorage.setItem("spark.selectedInstrument", APP_ID);
      localStorage.setItem("spark.instrumentId", APP_ID);
    } catch (err) {}

    try {
      if (W.SparkInstruments && typeof W.SparkInstruments.activate === "function") {
        W.SparkInstruments.activate(APP_ID);
      }
    } catch (err) {}

    try {
      if (W.sparkCore && typeof W.sparkCore.setInstrument === "function") {
        W.sparkCore.setInstrument(ID);
      }
    } catch (err) {}

    try {
      if (typeof W.setCurrentInstrument === "function") {
        W.setCurrentInstrument(ID);
      }
    } catch (err) {}

    return request;
  }

  function openVocalsSpark() {
    registerVocals();

    var request = selectVocals(null);

    try {
      if (typeof W.openPracticePlanScreenRequest === "function") {
        W.openPracticePlanScreenRequest(request);
        return false;
      }
    } catch (err) {
      console.warn("[VocalSpark] openPracticePlanScreenRequest failed", err);
    }

    try {
      if (typeof W.act === "function") {
        W.act("openPracticePlan");
        return false;
      }
    } catch (err) {
      console.warn("[VocalSpark] act(openPracticePlan) failed", err);
    }

    try {
      if (typeof W.render === "function") W.render();
    } catch (err) {}

    return false;
  }

  function startVocalsLesson(lessonId) {
    registerVocals();
    selectVocals(lessonId);

    try {
      if (typeof W.openPracticePlanScreenRequest === "function") {
        W.openPracticePlanScreenRequest(W.__sparkForcedLessonRequest);
        if (W.S) W.S.screen = W.SCR && W.SCR.PLAN ? W.SCR.PLAN : "plan";
        if (typeof W.render === "function") W.render();
        return false;
      }
    } catch (err) {}

    try {
      if (typeof W.act === "function") {
        W.act("openPracticePlan");
        return false;
      }
    } catch (err) {}

    return false;
  }

  function findContainer() {
    if (typeof document === "undefined" || !document.body) return null;

    return (
      document.querySelector("[data-instrument-grid]") ||
      document.querySelector("[data-showroom-grid]") ||
      document.querySelector("#instrumentGrid") ||
      document.querySelector("#instrument-grid") ||
      document.querySelector("#showroomGrid") ||
      document.querySelector("#showroom-grid") ||
      document.querySelector(".instrument-grid") ||
      document.querySelector(".showroom-grid") ||
      document.querySelector(".instrument-showroom") ||
      document.querySelector(".spark-showroom") ||
      document.querySelector(".showroom") ||
      document.querySelector("main") ||
      document.body
    );
  }

  function ensureCard() {
    if (typeof document === "undefined" || !document.body) return;

    var existing = document.querySelector(
      '[data-instrument="vocals"], ' +
      '[data-instrument-id="vocals"], ' +
      '[data-spark-instrument="vocals"], ' +
      "#vocalspark-showroom-card"
    );

    if (existing) return;

    var text = String(document.body.innerText || "").toLowerCase();
    var looksLikeSelect = (
      text.indexOf("instrument") !== -1 ||
      text.indexOf("showroom") !== -1 ||
      text.indexOf("choose") !== -1 ||
      text.indexOf("select") !== -1
    );

    if (!looksLikeSelect) return;

    var container = findContainer();
    if (!container) return;

    var card = document.createElement("button");
    card.id = "vocalspark-showroom-card";
    card.type = "button";
    card.setAttribute("data-instrument", ID);
    card.setAttribute("data-instrument-id", ID);
    card.setAttribute("data-spark-instrument", ID);
    card.className = "instrument-card showroom-card spark-card vocals-card";
    card.textContent = "VocalSpark - Pitch, breath, rhythm, and ear training";
    card.style.cursor = "pointer";
    card.style.padding = "18px";
    card.style.margin = "12px";
    card.style.borderRadius = "18px";
    card.style.minWidth = "220px";

    card.addEventListener("click", function (event) {
      event.preventDefault();
      event.stopPropagation();
      return openVocalsSpark();
    });

    container.appendChild(card);
  }

  function boot() {
    registerVocals();
    ensureCard();
  }

  boot();

  if (typeof document !== "undefined" && document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot, { once: true });
  }

  if (W.addEventListener) {
    W.addEventListener("load", boot, { once: true });
  }

  setTimeout(boot, 0);
  setTimeout(boot, 250);
  setTimeout(boot, 1000);
  setTimeout(boot, 2000);

  console.info("[VocalSpark] bridge registered");
})();
