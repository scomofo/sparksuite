(function(){

  function desktopFeedbackRoot(){
    if(typeof SparkState !== "undefined" && typeof SparkState.getRoot === "function"){
      var sparkRoot = SparkState.getRoot();
      if(sparkRoot) return sparkRoot;
    }
    return typeof globalThis !== "undefined" ? (globalThis.__sparkState || globalThis.S || null) : null;
  }

  function desktopFeedbackRead(path, fallback){
    if(typeof SparkState !== "undefined" && typeof SparkState.read === "function"){
      return SparkState.read(path, fallback);
    }
    var root = desktopFeedbackRoot();
    var parts = Array.isArray(path) ? path.slice() : [path];
    var cursor = root;
    var i;
    if(!cursor) return fallback;
    for(i=0;i<parts.length;i++){
      if(cursor == null || !Object.prototype.hasOwnProperty.call(cursor, parts[i])) return fallback;
      cursor = cursor[parts[i]];
    }
    return cursor == null ? fallback : cursor;
  }

  function desktopFeedbackWrite(path, value){
    if(typeof SparkState !== "undefined" && typeof SparkState.write === "function"){
      return SparkState.write(path, value);
    }
    var root = desktopFeedbackRoot();
    var parts = Array.isArray(path) ? path.slice() : [path];
    var cursor = root;
    var i;
    if(!cursor || !parts.length) return value;
    for(i=0;i<parts.length-1;i++){
      if(!cursor[parts[i]] || typeof cursor[parts[i]] !== "object") cursor[parts[i]] = {};
      cursor = cursor[parts[i]];
    }
    cursor[parts[parts.length-1]] = value;
    return value;
  }

  function feedbackPage(){
    var feedbackDraft = desktopFeedbackRead("feedbackDraft", {}) || {};
    var feedbackExportMsg = desktopFeedbackRead("feedbackExportMsg", null);
    var h = '<div class="card">';
    h += '<div><b>Send Feedback</b></div>';
    h += '<textarea oninput="act(\'feedbackDraftText\',this.value)" placeholder="What worked? What broke?" style="width:100%;min-height:80px">' + escHTML(feedbackDraft.text || "") + '</textarea>';
    h += '<button onclick="act(\'exportFeedback\')">Export Feedback</button>';
    if(feedbackExportMsg){
      h += '<div style="margin-top:8px;color:' + (feedbackExportMsg.ok ? '#4ECDC4' : '#FF6B6B') + '">' + escHTML(feedbackExportMsg.text || '') + '</div>';
    }
    h += '</div>';
    return h;
  }

  function setFeedbackExportMsg(ok, text){
    desktopFeedbackWrite("feedbackExportMsg", { ok: !!ok, text: text || "" });
    if(typeof render === "function") render();
  }

  async function exportFeedbackDesktopAware(){
    var payload = {
      exportedAt: Date.now(),
      version: typeof getReleaseVersion === "function" ? getReleaseVersion() : "dev",
      channel: typeof getReleaseChannel === "function" ? getReleaseChannel() : "dev",
      feedback: desktopFeedbackRead("feedbackDraft", {}) || {}
    };
    try{
      if(typeof isDesktopBuild === "function" && isDesktopBuild()){
        await window.sparkDesktop.saveJson(payload);
        setFeedbackExportMsg(true, "Feedback exported.");
        return true;
      }
      var blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
      var url = URL.createObjectURL(blob);
      var a = document.createElement("a");
      a.href = url;
      a.download = "sparksuite-feedback.json";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setFeedbackExportMsg(true, "Feedback downloaded.");
      return true;
    }catch(e){
      setFeedbackExportMsg(false, String((e && e.message) || e || "Feedback export failed."));
      return false;
    }
  }

  async function loadReleaseNotes(){
    try{
      var res = await fetch("release/changelog.json");
      desktopFeedbackWrite("releaseNotes", await res.json());
    }catch(e){
      desktopFeedbackWrite("releaseNotes", []);
    }
  }

  window.feedbackPage = feedbackPage;
  window.exportFeedbackDesktopAware = exportFeedbackDesktopAware;
  window.loadReleaseNotes = loadReleaseNotes;

})();
