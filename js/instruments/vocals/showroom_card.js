(function () {
  "use strict";

  var W = typeof window !== "undefined" ? window : globalThis;
  var ID = "vocals";
  var CARD_ID = "vocalspark-showroom-card";

  function getState() {
    if (!W.S || typeof W.S !== "object") W.S = {};
    return W.S;
  }

  function setVocalsSelected() {
    var S = getState();

    var request = {
      instrument: ID,
      instrumentId: ID,
      lessonId: null,
      forceRebuild: true,
      source: "vocals-showroom-card"
    };

    W.currentInstrument = ID;
    W.selectedInstrument = ID;
    W.__activeInstrument = ID;
    W.__sparkInstrumentId = ID;
    W.__sparkSelectedInstrument = ID;
    W.__sparkCurrentInstrument = ID;
    W.__sparkForcedLessonRequest = request;

    S.currentInstrument = ID;
    S.selectedInstrument = ID;
    S.instrument = ID;
    S.instrumentId = ID;
    S.__activeInstrument = ID;
    S.__sparkInstrumentId = ID;
    S.__sparkSelectedInstrument = ID;
    S.__sparkCurrentInstrument = ID;
    S.__sparkForcedLessonRequest = request;

    try {
      sessionStorage.setItem("spark.currentInstrument", ID);
      sessionStorage.setItem("spark.selectedInstrument", ID);
      sessionStorage.setItem("spark.instrumentId", ID);
    } catch (err) {}

    try {
      localStorage.setItem("spark.currentInstrument", ID);
      localStorage.setItem("spark.selectedInstrument", ID);
      localStorage.setItem("spark.instrumentId", ID);
    } catch (err) {}

    try {
      if (W.sparkCore && typeof W.sparkCore.setInstrument === "function") {
        W.sparkCore.setInstrument(ID);
      }
    } catch (err) {}

    return request;
  }

  function openVocalsFromCard() {
    var request = setVocalsSelected();

    try {
      if (typeof W.openVocalsSpark === "function") {
        W.openVocalsSpark();
      }
    } catch (err) {
      console.warn("[VocalSpark Card] openVocalsSpark failed", err);
    }

    try {
      if (typeof W.openPracticePlanScreenRequest === "function") {
        W.openPracticePlanScreenRequest(request);
      }
    } catch (err) {
      console.warn("[VocalSpark Card] openPracticePlanScreenRequest failed", err);
    }

    try {
      if (W.sparkCore && typeof W.sparkCore.openPracticePlanScreen === "function") {
        W.sparkCore.openPracticePlanScreen(request);
      }
    } catch (err) {
      console.warn("[VocalSpark Card] sparkCore.openPracticePlanScreen failed", err);
    }

    try {
      if (typeof W.act === "function") {
        W.act("openPracticePlan");
      }
    } catch (err) {
      console.warn("[VocalSpark Card] act(openPracticePlan) failed", err);
    }

    setTimeout(function () {
      try {
        if (typeof W.act === "function") W.act("openPracticePlan");
      } catch (err) {}
    }, 100);

    setTimeout(function () {
      try {
        if (typeof W.render === "function") W.render();
      } catch (err) {}
    }, 200);

    return false;
  }

  function ensureCard() {
    if (typeof document === "undefined" || !document.body) return;

    if (!W.SparkVocalsModule && !W.SparkVocalsShowroomInstrument) return;

    var existing = document.getElementById(CARD_ID);
    if (existing) return;

    var card = document.createElement("button");

    card.id = CARD_ID;
    card.type = "button";
    card.setAttribute("data-instrument", ID);
    card.setAttribute("data-instrument-id", ID);
    card.setAttribute("data-spark-instrument", ID);

    card.style.position = "fixed";
    card.style.right = "24px";
    card.style.bottom = "24px";
    card.style.zIndex = "2147483647";
    card.style.width = "260px";
    card.style.padding = "18px";
    card.style.borderRadius = "18px";
    card.style.border = "1px solid rgba(255,255,255,0.24)";
    card.style.background = "rgba(18,18,28,0.96)";
    card.style.color = "#ffffff";
    card.style.boxShadow = "0 16px 40px rgba(0,0,0,0.35)";
    card.style.cursor = "pointer";
    card.style.textAlign = "left";
    card.style.fontFamily = "inherit";

    card.innerHTML =
      '<div style="font-size:13px;opacity:.7;margin-bottom:4px;">Instrument</div>' +
      '<div style="font-size:22px;font-weight:800;margin-bottom:6px;">VocalSpark</div>' +
      '<div style="font-size:14px;line-height:1.35;opacity:.85;">Pitch, breath, rhythm, and ear training.</div>' +
      '<div style="font-size:13px;font-weight:700;margin-top:12px;">Open vocals</div>';

    card.addEventListener("click", function (event) {
      event.preventDefault();
      event.stopPropagation();
      return openVocalsFromCard();
    });

    document.body.appendChild(card);
  }

  W.openVocalsFromShowroomCard = openVocalsFromCard;
  W.ensureVocalSparkShowroomCard = ensureCard;

  ensureCard();

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", ensureCard, { once: true });
  }

  W.addEventListener("load", ensureCard, { once: true });

  setTimeout(ensureCard, 0);
  setTimeout(ensureCard, 250);
  setTimeout(ensureCard, 1000);
  setTimeout(ensureCard, 2000);

  setInterval(ensureCard, 1000);

  console.info("[VocalSpark Card] persistent showroom card active");
})();
