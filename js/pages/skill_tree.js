function skillTreePage(){
  var tree = buildSkillTree();
  var h = '';

  h += '<div class="card mb16">';
  h += '<h2>Skill Tree</h2>';
  h += '<div class="muted">See what you have mastered and what comes next.</div>';
  h += '</div>';

  h += '<div class="card mb16">';
  h += buildSkillTreeBranchTabs();
  h += '</div>';

  var focus = S.skillTreeFocus || "overview";

  if(focus==="overview"){
    for(var i=0;i<tree.branches.length;i++){
      h += renderSkillTreeBranch(tree.branches[i], true);
    }
  }else{
    for(var j=0;j<tree.branches.length;j++){
      if(tree.branches[j].id===focus){
        h += renderSkillTreeBranch(tree.branches[j], false);
      }
    }
  }

  h += '<div class="card mb16">';
  h += '<button class="btn" onclick="act(\'back\')">Back</button>';
  h += '</div>';

  return h;
}

function buildSkillTreeBranchTabs(){
  var tabs = [
    ["overview","Overview"],
    ["chords","Chords"],
    ["transitions","Transitions"],
    ["songs","Songs"],
    ["rhythm","Rhythm"],
    ["lead","Lead"]
  ];

  var h = '';
  for(var i=0;i<tabs.length;i++){
    var id = tabs[i][0], label = tabs[i][1];
    h += '<button class="btn'+(S.skillTreeFocus===id?' btn-primary':'')+'" onclick="act(\'skillTreeFocus\',\''+id+'\')">'+label+'</button> ';
  }
  return h;
}

function renderSkillTreeBranch(branch, compact){
  var h = '<div class="card mb16">';
  h += '<div style="font-weight:900;font-size:16px;margin-bottom:10px">'+escHTML(branch.label)+'</div>';

  var nodes = branch.nodes || [];
  var max = compact ? Math.min(4, nodes.length) : nodes.length;

  for(var i=0;i<max;i++){
    h += renderSkillTreeNode(nodes[i], 0);
  }

  if(compact && nodes.length > max){
    h += '<div class="muted" style="font-size:12px">+'+(nodes.length-max)+' more</div>';
  }

  h += '</div>';
  return h;
}

function renderSkillTreeNode(node, depth){
  var h = '';
  var pad = 12 + (depth * 16);
  var color = getSkillTreeStatusColor(node.status);

  h += '<div style="margin-bottom:8px;padding:'+pad+'px;border-radius:var(--radius-sm);background:var(--bg-input);border-left:5px solid '+color+'">';
  h += '<div style="display:flex;justify-content:space-between;gap:12px;align-items:center">';
  h += '<div>';
  h += '<div style="font-weight:800;font-size:13px;color:var(--text-primary)">'+escHTML(node.label)+'</div>';
  h += '<div style="font-size:11px;color:var(--text-muted)">'+escHTML(node.status)+' \u2022 '+(node.progress||0)+'%</div>';
  h += '</div>';
  h += '<div style="font-size:11px;color:'+color+';font-weight:900">'+(node.progress||0)+'%</div>';
  h += '</div>';

  if(Array.isArray(node.children) && node.children.length){
    for(var i=0;i<node.children.length;i++){
      h += renderSkillTreeNode(node.children[i], depth+1);
    }
  }

  h += '</div>';
  return h;
}

function getSkillTreeStatusColor(status){
  if(status==="mastered") return "#22c55e";
  if(status==="developing") return "#3b82f6";
  if(status==="available") return "#f59e0b";
  return "#6b7280";
}
