// ===== UTILITY =====
function escHTML(s){return String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");}

// ===== UI HELPERS =====

function chordSVG(ch,sz,label,animate){
  sz=sz||200;
  var chName=label||ch.name||"chord";
  var w=sz,h=sz*1.3,pL=35,pR=20,pT=30,pB=20,fC=4,sC=6;
  var fH=(h-pT-pB)/fC,sW=(w-pL-pR)/(sC-1);

  // Determine fret offset for higher-position chords
  // Only offset when fingers exceed the visible 4-fret window
  var startFret=0;
  if(ch.fingers&&ch.fingers.length>0){
    var minFret=99,maxFret=0;
    for(var fi=0;fi<ch.fingers.length;fi++){
      if(ch.fingers[fi][1]>0){
        if(ch.fingers[fi][1]<minFret) minFret=ch.fingers[fi][1];
        if(ch.fingers[fi][1]>maxFret) maxFret=ch.fingers[fi][1];
      }
    }
    if(ch.barFret){
      if(ch.barFret<minFret) minFret=ch.barFret;
      if(ch.barFret>maxFret) maxFret=ch.barFret;
    }
    if(maxFret>fC) startFret=minFret-1;
  }

  // Build accessible description of finger positions
  var accDesc='Chord diagram for '+escHTML(chName)+'.';
  if(ch.fingers&&ch.fingers.length>0){
    accDesc+=' Fingers:';
    for(var fi=0;fi<ch.fingers.length;fi++){
      var ff=ch.fingers[fi];
      accDesc+=' finger '+ff[2]+' on string '+(ff[0]+1)+' fret '+ff[1];
      if(fi<ch.fingers.length-1)accDesc+=',';
    }
    accDesc+='.';
  }
  if(ch.barFret)accDesc+=' Barre at fret '+ch.barFret+'.';
  var s='<svg width="'+w+'" height="'+h+'" viewBox="0 0 '+w+' '+h+'" role="img" aria-label="'+escHTML(accDesc)+'"><title>'+escHTML(accDesc)+'</title>';
  // Nut (only draw thick nut if at fret 0)
  if(startFret===0){
    s+='<rect x="'+pL+'" y="'+pT+'" width="'+(w-pL-pR)+'" height="4" fill="var(--svg-nut)" rx="2"/>';
  }else{
    s+='<line x1="'+pL+'" y1="'+pT+'" x2="'+(w-pR)+'" y2="'+pT+'" stroke="var(--svg-fret)" stroke-width="2"/>';
    // Fret number label
    s+='<text x="'+(pL-18)+'" y="'+(pT+fH*0.5+5)+'" text-anchor="middle" font-size="13" fill="var(--text-muted)" font-weight="bold">'+(startFret+1)+'</text>';
  }
  for(var i=0;i<fC;i++)
    s+='<line x1="'+pL+'" y1="'+(pT+fH*(i+1))+'" x2="'+(w-pR)+'" y2="'+(pT+fH*(i+1))+'" stroke="var(--svg-fret)" stroke-width="1.5"/>';
  for(var i=0;i<sC;i++)
    s+='<line x1="'+(pL+i*sW)+'" y1="'+pT+'" x2="'+(pL+i*sW)+'" y2="'+(h-pB)+'" stroke="var(--svg-string)" stroke-width="'+(i<3?2:1.2)+'"/>';
  var m=ch.muted||[];
  for(var i=0;i<m.length;i++)
    s+='<text x="'+(pL+m[i]*sW)+'" y="'+(pT-10)+'" text-anchor="middle" font-size="14" fill="#FF6B6B" font-weight="bold">X</text>';
  var op=ch.open||[];
  if(startFret===0){
    for(var i=0;i<op.length;i++)
      if(op[i])s+='<circle cx="'+(pL+i*sW)+'" cy="'+(pT-12)+'" r="6" fill="none" stroke="#4ECDC4" stroke-width="2"/>';
  }
  // Barre chords: bar expands first (0.8s), then fingers stagger after
  // Standard chords: fingers appear with 0.3s stagger, 0.5s duration
  var isBarre=!!ch.barFret;
  var fDur=isBarre?0.5:0.5;
  var fStagger=isBarre?0.2:0.3;
  var fDelay=isBarre?0.6:0;
  if(ch.barFret){
    var bs=ch.barStrings,mn=Math.min.apply(null,bs),mx=Math.max.apply(null,bs);
    var barX=pL+mn*sW-10,barY=pT+(ch.barFret-startFret-0.5)*fH-8,barW=(mx-mn)*sW+20;
    var barCX=barX+barW/2,barCY=barY+8;
    var barAnim=animate?'style="opacity:0;transform-origin:'+barCX+'px '+barCY+'px;transform:scaleX(0);animation:barreIn 0.8s ease-out 0s forwards"':'style="opacity:0.85"';
    s+='<rect x="'+barX+'" y="'+barY+'" width="'+barW+'" height="16" rx="8" fill="#FF6B6B" '+barAnim+'/>';
  }
  for(var i=0;i<ch.fingers.length;i++){
    var f=ch.fingers[i],cx=pL+f[0]*sW,cy=pT+(f[1]-startFret-0.5)*fH,r=Math.min(12,sz/16);
    var animStyle=animate?'style="opacity:0;animation:fingerIn '+fDur+'s ease-out '+(fDelay+i*fStagger)+'s forwards"':'';
    s+='<circle cx="'+cx+'" cy="'+cy+'" r="'+r+'" fill="'+f[3]+'" stroke="#fff" stroke-width="2" '+animStyle+'/>';
    s+='<text x="'+cx+'" y="'+(cy+4)+'" text-anchor="middle" font-size="'+Math.min(11,sz/18)+'" fill="#fff" font-weight="bold" '+animStyle+'>'+f[2]+'</text>';
  }
  for(var i=0;i<STRING_NAMES.length;i++)
    s+='<text x="'+(pL+i*sW)+'" y="'+(h-4)+'" text-anchor="middle" font-size="10" fill="var(--text-muted)">'+STRING_NAMES[i]+'</text>';
  return s+'</svg>';
}

function ringHTML(pct,sz,str,clr,inner,ariaLabel){
  sz=sz||80;str=str||6;clr=clr||"#FF6B6B";
  var r=(sz-str)/2,c=2*Math.PI*r,off=c-(pct/100)*c;
  var aria=ariaLabel?' role="progressbar" aria-valuenow="'+Math.round(pct)+'" aria-valuemin="0" aria-valuemax="100" aria-label="'+escHTML(ariaLabel)+'"':'';
  return '<div style="position:relative;width:'+sz+'px;height:'+sz+'px"'+aria+'><svg width="'+sz+'" height="'+sz+'" style="transform:rotate(-90deg)"><circle cx="'+(sz/2)+'" cy="'+(sz/2)+'" r="'+r+'" fill="none" stroke="var(--border)" stroke-width="'+str+'"/><circle cx="'+(sz/2)+'" cy="'+(sz/2)+'" r="'+r+'" fill="none" stroke="'+clr+'" stroke-width="'+str+'" stroke-dasharray="'+c+'" stroke-dashoffset="'+off+'" stroke-linecap="round" style="transition:stroke-dashoffset .5s ease"/></svg><div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center">'+inner+'</div></div>';
}

function strumHTML(pat,beat){
  var h='';
  for(var i=0;i<pat.length;i++){
    var p=pat[i],isA=i===beat,isD=p==="D",isU=p==="U",isR=!isD&&!isU;
    var bg=isA?(isD?"#FF6B6B":isU?"#4ECDC4":"var(--border)"):(isR?"var(--chip-bg)":"var(--card-bg)");
    h+='<div style="width:40px;height:56px;border-radius:12px;display:flex;flex-direction:column;align-items:center;justify-content:center;background:'+bg+';border:2px solid '+(isA?"var(--text-primary)":"var(--border)")+';transition:all .1s;transform:'+(isA?"scale(1.15)":"scale(1)")+'" aria-label="Beat '+(i+1)+': '+(isD?"Down":isU?"Up":"Rest")+'">';
    h+='<span style="font-size:'+(isR?14:20)+'px;font-weight:800;color:'+(isA?"#fff":(isR?"var(--text-muted)":"var(--text-label)"))+'">'+(isD?"\u2193":isU?"\u2191":"\u00B7")+'</span>';
    h+='<span style="font-size:9px;color:'+(isA?"#fff":"var(--text-muted)")+';font-weight:600">'+(isD?"Down":isU?"Up":"Rest")+'</span></div>';
  }
  return h;
}

function checkBadges(){
  var nb=[];
  for(var i=0;i<BADGES.length;i++){
    var b=BADGES[i];
    if(b.check&&b.check()&&S.earnedBadges.indexOf(b.id)===-1)nb.push(b);
  }
  if(nb.length){
    for(var i=0;i<nb.length;i++)S.earnedBadges.push(nb[i].id);
    S.newBadge=nb[0];
    snd("badge");saveState();
    setTimeout(function(){S.newBadge=null;render();},3000);
  }
}

function trigC(){
  S.showConfetti=true;render();
  setTimeout(function(){S.showConfetti=false;render();},2500);
}

// Fisher-Yates shuffle
function shuffle(arr){
  var a=arr.slice();
  for(var i=a.length-1;i>0;i--){
    var j=Math.floor(Math.random()*(i+1));
    var t=a[i];a[i]=a[j];a[j]=t;
  }
  return a;
}

// Helper for accessible clickable divs
function clickableDiv(onclick,extra){
  return ' tabindex="0" role="button" onclick="'+onclick+'" onkeydown="if(event.key===\'Enter\'){'+onclick+'}"'+(extra?' '+extra:'');
}

// ===== CHORD MASTERY TIERS =====
function getChordTier(chordName){
  var p=S.chordProgress[chordName]||0;
  if(p>=75)return{tier:"gold",label:"Gold",icon:"&#129351;",color:"#FFD700"};
  if(p>=50)return{tier:"silver",label:"Silver",icon:"&#129352;",color:"#C0C0C0"};
  if(p>=25)return{tier:"bronze",label:"Bronze",icon:"&#129353;",color:"#CD7F32"};
  return{tier:"none",label:"",icon:"",color:""};
}

function tierBadgeHTML(chordName,size){
  var t=getChordTier(chordName);
  if(t.tier==="none")return "";
  size=size||16;
  return '<span style="font-size:'+size+'px;margin-left:4px" title="'+t.label+' Tier">'+t.icon+'</span>';
}

// ===== MICRO-ACHIEVEMENT TOAST =====
function fireMicro(id,msg,icon){
  if(S.sessionMicros.indexOf(id)!==-1)return;
  S.sessionMicros.push(id);
  S.microToast={msg:msg,icon:icon,time:Date.now()};
  snd("badge");
  render();
}

// ===== SCALE FRETBOARD SVG =====
function scaleSVG(positions,keyName,scaleName){
  var w=320,h=160,pL=35,pR=20,pT=24,pB=16;
  var maxFret=12,sC=6;
  var fW=(w-pL-pR)/maxFret;
  var sH=(h-pT-pB)/(sC-1);
  var s='<svg width="'+w+'" height="'+h+'" viewBox="0 0 '+w+' '+h+'" role="img" aria-label="Scale diagram for '+escHTML(keyName+" "+scaleName)+'">';
  s+='<rect x="'+pL+'" y="'+pT+'" width="3" height="'+(h-pT-pB)+'" fill="var(--svg-nut)"/>';
  for(var f=1;f<=maxFret;f++)
    s+='<line x1="'+(pL+f*fW)+'" y1="'+pT+'" x2="'+(pL+f*fW)+'" y2="'+(h-pB)+'" stroke="var(--svg-fret)" stroke-width="1"/>';
  for(var i=0;i<sC;i++)
    s+='<line x1="'+pL+'" y1="'+(pT+i*sH)+'" x2="'+(w-pR)+'" y2="'+(pT+i*sH)+'" stroke="var(--svg-string)" stroke-width="'+(i<3?2:1.2)+'"/>';
  var markers=[3,5,7,9];
  for(var i=0;i<markers.length;i++){
    s+='<circle cx="'+(pL+(markers[i]-0.5)*fW)+'" cy="'+(pT+2.5*sH)+'" r="3" fill="var(--svg-fret)" opacity="0.3"/>';
  }
  s+='<circle cx="'+(pL+11.5*fW)+'" cy="'+(pT+1.5*sH)+'" r="3" fill="var(--svg-fret)" opacity="0.3"/>';
  s+='<circle cx="'+(pL+11.5*fW)+'" cy="'+(pT+3.5*sH)+'" r="3" fill="var(--svg-fret)" opacity="0.3"/>';
  for(var i=0;i<positions.length;i++){
    var p=positions[i];
    var cx=p.fret===0?pL-12:pL+(p.fret-0.5)*fW;
    var cy=pT+p.string*sH;
    var fill=p.isRoot?"#FF6B6B":"#4ECDC4";
    s+='<circle cx="'+cx+'" cy="'+cy+'" r="7" fill="'+fill+'" opacity="0.85"/>';
    s+='<text x="'+cx+'" y="'+(cy+3.5)+'" text-anchor="middle" font-size="8" fill="#fff" font-weight="bold">'+p.note+'</text>';
  }
  for(var f=2;f<=maxFret;f+=2)
    s+='<text x="'+(pL+(f-0.5)*fW)+'" y="'+(h-2)+'" text-anchor="middle" font-size="8" fill="var(--text-muted)">'+f+'</text>';
  return s+'</svg>';
}

// ===== ANIMATED STRUM HAND =====
function strumHandSVG(direction,active){
  var w=60,h=80;
  var rotation=direction==="D"?15:direction==="U"?-15:0;
  var translateY=direction==="D"?10:direction==="U"?-10:0;
  var opacity=direction==="x"?0.3:1;
  var color=direction==="D"?"#FF6B6B":direction==="U"?"#4ECDC4":"var(--text-muted)";
  var cls="strum-hand"+(active?" strum-hand-active":"");
  var s='<svg width="'+w+'" height="'+h+'" viewBox="0 0 60 80" class="'+cls+'" style="transition:transform 0.15s ease;transform:rotate('+rotation+'deg) translateY('+translateY+'px);opacity:'+opacity+'">';
  s+='<path d="M30 10 L20 45 L40 45 Z" fill="'+color+'" stroke="'+color+'" stroke-width="2" stroke-linejoin="round"/>';
  s+='<rect x="24" y="42" width="12" height="25" rx="3" fill="'+color+'" opacity="0.6"/>';
  if(direction==="D")s+='<path d="M30 72 L24 64 L36 64 Z" fill="'+color+'" opacity="0.8"/>';
  else if(direction==="U")s+='<path d="M30 4 L24 12 L36 12 Z" fill="'+color+'" opacity="0.8"/>';
  return s+'</svg>';
}
