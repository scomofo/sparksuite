(function(){

  function feedbackPage(){
    var h = '<div class="card">';
    h += '<div><b>Send Feedback</b></div>';
    h += '<textarea oninput="S.feedbackDraft.text=this.value" placeholder="What worked? What broke?" style="width:100%;min-height:80px">' + escHTML(S.feedbackDraft.text || "") + '</textarea>';
    h += '<button onclick="act(\'exportFeedback\')">Export Feedback</button>';
    h += '</div>';
    return h;
  }

  async function exportFeedbackDesktopAware(){
    var payload = {
      exportedAt: Date.now(),
      version: typeof getReleaseVersion === "function" ? getReleaseVersion() : "dev",
      channel: typeof getReleaseChannel === "function" ? getReleaseChannel() : "dev",
      feedback: S.feedbackDraft || {}
    };
    if(typeof isDesktopBuild === "function" && isDesktopBuild()){
      return await window.sparkDesktop.saveJson(payload);
    }
    return false;
  }

  async function loadReleaseNotes(){
    try{
      var res = await fetch("release/changelog.json");
      S.releaseNotes = await res.json();
    }catch(e){
      S.releaseNotes = [];
    }
  }

  window.feedbackPage = feedbackPage;
  window.exportFeedbackDesktopAware = exportFeedbackDesktopAware;
  window.loadReleaseNotes = loadReleaseNotes;

})();
