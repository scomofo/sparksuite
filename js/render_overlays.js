// js/render_overlays.js
// Overlay helpers extracted from js/render.js.

function _renderOverlays(){
  var h = "";
  var now = Date.now();

  if (S.showConfetti) {
    if (!S._confettiFired) {
      S._confettiFired = true;
      if (typeof SparkConfetti !== "undefined") {
        SparkConfetti.burst();
        S._confettiHtml = "";
      } else {
        var cols = ["#FF6B6B","#4ECDC4","#45B7D1","#FFE66D","#96CEB4","#FF8A5C"];
        var ch = '<div style="position:fixed;inset:0;pointer-events:none;z-index:999">';
        for (var i = 0; i < 40; i++) {
          ch += '<div style="position:absolute;left:'+Math.random()*100+'%;top:-20px;width:10px;height:10px;border-radius:'+(Math.random()>0.5?"50%":"2px")+';background:'+cols[i%6]+';animation:cF '+(1.5+Math.random())+'s ease-in forwards;animation-delay:'+Math.random()*0.5+'s"></div>';
        }
        ch += '</div>';
        S._confettiHtml = ch;
      }
      setTimeout(function() { S._confettiFired = false; S._confettiHtml = ""; }, 2600);
    }
    if (S._confettiHtml) h += S._confettiHtml;
  }

  if (S.newBadge) {
    h += '<div style="position:fixed;top:20px;left:50%;transform:translateX(-50%);z-index:1000;background:linear-gradient(135deg,#FFE66D,#FF8A5C);border-radius:20px;padding:16px 32px;box-shadow:0 8px 30px rgba(255,138,92,.4);animation:sD .5s ease;text-align:center"><div style="font-size:32px">'+S.newBadge.icon+'</div><div style="font-weight:800;font-size:16px;color:#333">'+S.newBadge.label+'</div><div style="font-size:12px;color:#555">'+S.newBadge.desc+'</div></div>';
  }

  if (S.showUndoToast) {
    h += '<div class="undo-toast"><span>Progress reset.</span><button onclick="act(\'undoReset\')">Undo</button><span class="countdown">'+S.undoTimer+'</span></div>';
  }

  if (S.xpToast && now - S.xpToast.time < 1500) {
    if (S.xpToast.jackpot) {
      h += '<div style="position:fixed;bottom:80px;left:50%;transform:translateX(-50%);z-index:1000;background:linear-gradient(135deg,#FFE66D,#FF8A5C);border-radius:20px;padding:12px 28px;box-shadow:0 6px 24px rgba(255,138,92,.6);animation:sD .3s ease;font-weight:900;color:#fff;font-size:20px;text-align:center">&#127873; JACKPOT! +'+S.xpToast.amount+' XP!</div>';
    } else {
      h += '<div style="position:fixed;bottom:80px;left:50%;transform:translateX(-50%);z-index:1000;background:linear-gradient(135deg,#4ECDC4,#45B7D1);border-radius:16px;padding:8px 20px;box-shadow:0 4px 15px rgba(78,205,196,.4);animation:sD .3s ease;font-weight:800;color:#fff;font-size:16px">+'+S.xpToast.amount+' XP!</div>';
    }
  }

  if (S.microToast && now - S.microToast.time < 2000) {
    h += '<div style="position:fixed;top:70px;left:50%;transform:translateX(-50%);z-index:1000;background:linear-gradient(135deg,#FFE66D,#FF8A5C);border-radius:16px;padding:10px 24px;box-shadow:0 4px 15px rgba(255,138,92,.4);animation:sD .3s ease;text-align:center"><span style="font-size:20px;margin-right:6px">'+S.microToast.icon+'</span><span style="font-weight:800;color:#333;font-size:15px">'+S.microToast.msg+'</span></div>';
  }

  var contMin = (now - S.sessionStartTime) / 60000;
  if (S.sessionStartTime > 0 && contMin >= 20 && !S.breakDismissed) {
    h += '<div style="position:fixed;bottom:20px;left:50%;transform:translateX(-50%);z-index:1000;background:linear-gradient(135deg,#45B7D1,#4ECDC4);border-radius:16px;padding:12px 24px;box-shadow:0 4px 20px rgba(69,183,209,.4);animation:sD .5s ease;text-align:center;max-width:320px"><div style="font-size:20px;margin-bottom:4px">&#9749;</div><div style="font-weight:800;color:#fff;font-size:14px">Nice focus! Take a quick break?</div><div style="font-size:11px;color:rgba(255,255,255,.8);margin:4px 0">You\'ve been practicing for '+Math.floor(contMin)+' min straight</div><button onclick="act(\'dismissBreak\')" style="margin-top:6px;background:rgba(255,255,255,.2);border:1px solid rgba(255,255,255,.4);border-radius:10px;padding:6px 16px;color:#fff;font-weight:700;font-size:12px;cursor:pointer">Got it!</button></div>';
  }

  if (S.showShortcuts) h += shortcutOverlay();
  return h;
}
