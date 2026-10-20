
(function(){
"use strict";
var EXKEY=(typeof STORE_KEY!=="undefined"?STORE_KEY:"quiz").replace("quiz","exam");
var $=function(id){return document.getElementById(id);};
var root=$("examRoot"),quizList=$("quizList");
var exQs=[],exAns={},exIdx=0,exTimer=null,exLeft=0,exTotal=0;
function shuffle(a){for(var i=a.length-1;i>0;i--){var j=Math.floor(Math.random()*(i+1));var t=a[i];a[i]=a[j];a[j]=t;}return a;}
function fmt(s){var m=Math.floor(s/60),ss=s%60;return (m<10?"0":"")+m+":"+(ss<10?"0":"")+ss;}
function openExam(){$("exMax").textContent=QUIZ.length;root.style.display="block";quizList.style.display="none";
  $("exSetup").style.display="block";$("exRun").style.display="none";$("exResult").style.display="none";renderHist();
  root.scrollIntoView();}
function closeExam(){stopTimer();root.style.display="none";quizList.style.display="block";}
function stopTimer(){if(exTimer){clearInterval(exTimer);exTimer=null;}}
function renderHist(){var h=[];try{h=JSON.parse(localStorage.getItem(EXKEY)||"[]");}catch(e){}
  var el=$("exHist");if(!h.length){el.innerHTML="";return;}
  var s='<div style="font-weight:700;margin-bottom:4px">Lịch sử thi thử</div>';
  h.slice(-8).reverse().forEach(function(r){var d=new Date(r.d);
    var ds=(d.getDate()<10?"0":"")+d.getDate()+"/"+(d.getMonth()+1<10?"0":"")+(d.getMonth()+1)+" "+(d.getHours()<10?"0":"")+d.getHours()+":"+(d.getMinutes()<10?"0":"")+d.getMinutes();
    s+='<div class="erow"><span>'+ds+'</span><span><b>'+r.ok+'</b>/'+r.n+' ('+Math.round(r.ok/r.n*100)+'%)</span></div>';});
  el.innerHTML=s;}
function startExam(){
  var n=parseInt($("exNum").value,10)||30;var mins=parseInt($("exMin").value,10)||30;
  if(n<1)n=1;if(n>QUIZ.length)n=QUIZ.length;if(mins<1)mins=1;
  exQs=shuffle(QUIZ.map(function(_,i){return i;})).slice(0,n);
  exAns={};exIdx=0;exTotal=n;exLeft=mins*60;
  $("exSetup").style.display="none";$("exResult").style.display="none";$("exRun").style.display="block";
  renderQ();renderGrid();tick();
  stopTimer();exTimer=setInterval(tick,1000);
  window.scrollTo(0,0);}
function tick(){var t=$("exTimer");t.textContent=fmt(exLeft);
  t.classList.toggle("low",exLeft<=300);
  if(exLeft<=0){submitExam();return;}exLeft--;}
function renderQ(){var qi=exQs[exIdx],q=QUIZ[qi];
  var s='<div class="q-head"><span class="q-tag">Câu '+(exIdx+1)+"/"+exTotal+(q.c?" · Chương "+q.c:"")+'</span></div>';
  s+='<p class="q-text">'+q.q+'</p>';
  q.o.forEach(function(opt,oi){
    s+='<button class="opt'+(exAns[exIdx]===oi?" correct":"")+'" data-oi="'+oi+'">'+opt+'</button>';});
  var box=$("exQ");box.innerHTML=s;
  box.querySelectorAll(".opt").forEach(function(b){b.onclick=function(){exAns[exIdx]=+b.getAttribute("data-oi");renderQ();renderGrid();};});}
function renderGrid(){var g=$("exGrid");var s="";
  for(var i=0;i<exTotal;i++){s+='<button class="exg'+(exAns[i]!==undefined?" done":"")+(i===exIdx?" cur":"")+'" data-i="'+i+'">'+(i+1)+'</button>';}
  g.innerHTML=s;
  g.querySelectorAll(".exg").forEach(function(b){b.onclick=function(){exIdx=+b.getAttribute("data-i");renderQ();renderGrid();window.scrollTo(0,0);};});}
function submitExam(){stopTimer();
  var ok=0,wrong=[];
  exQs.forEach(function(qi,i){var q=QUIZ[qi];
    if(exAns[i]===q.a)ok++;else wrong.push({i:i,q:q,pick:exAns[i]});});
  try{var h=JSON.parse(localStorage.getItem(EXKEY)||"[]");h.push({d:Date.now(),n:exTotal,ok:ok});
    localStorage.setItem(EXKEY,JSON.stringify(h.slice(-50)));}catch(e){}
  var pct=Math.round(ok/exTotal*100);
  var s='<div class="card"><h3 class="exh">Kết quả thi thử</h3>'
    +'<div class="exscore">'+ok+"/"+exTotal+'</div>'
    +'<p class="exsub">Đúng '+pct+'% · '+wrong.length+' câu sai</p>'
    +'<div class="toolbar"><button class="btn" id="exAgain">Thi lại</button><button class="btn ghost" id="exBack">Về ôn tập</button></div></div>';
  if(wrong.length){s+='<div class="card"><h3 class="exh">Các câu làm sai ('+wrong.length+')</h3>';
    wrong.forEach(function(w){
      s+='<div class="exwrong" style="margin-bottom:14px"><p class="q-text" style="font-size:.95rem">Câu '+(w.i+1)+": "+w.q.q+'</p>';
      s+='<p style="margin:4px 0">Bạn chọn: <b style="color:var(--bad)">'+(w.pick===undefined?"(bỏ trống)":w.q.o[w.pick])+'</b></p>';
      s+='<p style="margin:4px 0">Đáp án đúng: <b style="color:var(--ok)">'+w.q.o[w.q.a]+'</b></p>';
      if(w.q.t)s+='<div class="tip show">'+w.q.t+'</div>';
      s+='</div>';});
    s+='</div>';}
  var r=$("exResult");r.innerHTML=s;
  $("exRun").style.display="none";r.style.display="block";window.scrollTo(0,0);
  $("exAgain").onclick=function(){r.style.display="none";$("exSetup").style.display="block";renderHist();};
  $("exBack").onclick=closeExam;}
$("examBtn").onclick=openExam;
$("exCancel").onclick=closeExam;
$("exQuit").onclick=function(){if(confirm("Thoát bài thi? Kết quả sẽ không được lưu."))closeExam();};
$("exNum").onchange=function(){var n=parseInt($("exNum").value,10)||30;if(n>QUIZ.length){n=QUIZ.length;$("exNum").value=n;}$("exMin").value=n;};
$("exStart").onclick=startExam;
$("exSubmit").onclick=function(){if(confirm("Nộp bài thi?"))submitExam();};
$("exPrev").onclick=function(){if(exIdx>0){exIdx--;renderQ();renderGrid();window.scrollTo(0,0);}};
$("exNext").onclick=function(){if(exIdx<exTotal-1){exIdx++;renderQ();renderGrid();window.scrollTo(0,0);}};
})();

