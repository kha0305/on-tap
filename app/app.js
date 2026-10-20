/* ============ ON-TAP APP: logic dung chung cho 5 mon ============
   Du lieu mon hien tai nam trong window.SUBJECT (nap tu data/<mon>.js
   truoc khi script nay chay). Mon duoc chon qua hash: app/#his362 */
"use strict";
const S = window.SUBJECT;
const QUIZ = S.QUIZ, FLASH = S.FLASH, ESSAYS = S.ESSAYS;
const CHAP_NAMES = S.CHAP_NAMES, LETTERS = S.LETTERS, NAV_TITLES = S.NAV_TITLES;
const ROMAN = S.roman || null;
const TL_RAW = S.TL_RAW || null;
const STORE_KEY = S.storeKey;
const MONS = ["his362", "pos361", "pos351", "cs434", "cs420"];
const MON_NAMES = {his362: "HIS362", pos361: "POS361", pos351: "POS351", cs434: "CS434", cs420: "CS420"};
const MON_FULL = {
  his362: "Lịch sử Đảng Cộng sản Việt Nam",
  pos361: "Tư tưởng Hồ Chí Minh",
  pos351: "Chủ nghĩa xã hội khoa học",
  cs434: "Công cụ & Phương pháp Thiết kế - Quản lý (Phần mềm)",
  cs420: "Hệ Phân tán"
};

/* ---- Header: tieu de / mo ta / accent / nav chuyen mon ---- */
document.title = S.title;
document.getElementById("appTitle").textContent = S.title;
document.getElementById("appSub").innerHTML = S.sub;
document.documentElement.style.setProperty("--accent", S.accent);
(function buildSubjNav(){
  const nav = document.getElementById("subjNav");
  nav.innerHTML = "";
  const home = document.createElement("button");
  home.type = "button"; home.className = "subj-pill home"; home.textContent = "← Trang chủ";
  home.addEventListener("click", () => { location.href = "../"; });
  nav.appendChild(home);
  MONS.forEach(m => {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "subj-pill" + (m === S.id ? " cur" : "");
    b.textContent = MON_NAMES[m];
    b.dataset.tip = MON_FULL[m];
    if (m !== S.id) b.addEventListener("click", () => { location.hash = m; location.reload(); });
    nav.appendChild(b);
  });
})();
/* Tabs: chi hien tab mon nay co */
(function buildTabs(){
  const bar = document.getElementById("tabBar");
  const counts = {quiz: QUIZ.length, flash: FLASH.length, essay: ESSAYS.length, timeline: TL_RAW ? TL_RAW.length : 0, keys: 0};
  S.tabs.forEach(([key, label], i) => {
    const b = document.createElement("button");
    b.className = "tab" + (i === 0 ? " active" : "");
    b.dataset.tab = key;
    b.textContent = label + (counts[key] ? " (" + counts[key] + ")" : "");
    bar.appendChild(b);
  });
  const fbTab = document.createElement("button");
  fbTab.className = "tab"; fbTab.dataset.tab = "gopy"; fbTab.textContent = "Góp ý";
  bar.appendChild(fbTab);
  document.querySelectorAll(".panel").forEach(p => {
    const key = p.id.replace("panel-", "");
    if (key !== "gopy" && !S.tabs.some(t => t[0] === key)) p.style.display = "none";
  });
})();
/* Noi dung tinh theo mon */
document.getElementById("panel-keys").innerHTML = S.KEYS_HTML;
(function(){
  const p = document.querySelector("#panel-essay p.sub");
  if (p && S.essayIntro) p.innerHTML = S.essayIntro;
})();

function shuffle(a){for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
function $(id){return document.getElementById(id);}

/* ---- Tabs ---- */
document.querySelectorAll(".tab").forEach(t=>{
  t.addEventListener("click",()=>{
    document.querySelectorAll(".tab").forEach(x=>x.classList.remove("active"));
    t.classList.add("active");
    document.querySelectorAll(".panel").forEach(p=>p.classList.remove("active"));
    $("panel-"+t.dataset.tab).classList.add("active");
    const fab=document.getElementById("qNavFab");
    if(fab)fab.style.display=(t.dataset.tab==="gopy")?"none":"";
    window.scrollTo({top:0,behavior:"smooth"});
  });
});
/* ---- Theme (1 key chung cho ca web) ---- */
$("themeBtn").addEventListener("click",()=>{
  document.body.classList.toggle("dark");
  try{localStorage.setItem("study-theme",document.body.classList.contains("dark")?"d":"l");}catch(e){}
});
try{if(localStorage.getItem("study-theme")==="d")document.body.classList.add("dark");}catch(e){}

/* ---- Quiz ---- */
let qChap=0, qWrongOnly=false, qOrder=[], qDone=new Set(), qRight=new Set(), qWrong=new Set(), qPick=new Map();
function chapLabel(c){ return ROMAN ? ROMAN[c] : c; }
function qLabel(idx){
  const q=QUIZ[idx];
  const n=QUIZ.slice(0,idx).filter(x=>x.c===q.c).length+1;
  return "Chương "+chapLabel(q.c)+" · Câu "+n;
}
function buildChapChips(){
  const box=$("chapChips");box.innerHTML="";
  const mk=(v,label)=>{
    const b=document.createElement("button");
    b.className="chip"+(qChap===v?" active":"");
    b.textContent=label;
    b.addEventListener("click",()=>{qChap=v;qWrongOnly=false;rebuildOrder();buildChapChips();renderQuiz();});
    box.appendChild(b);
  };
  mk(0,"Tất cả ("+QUIZ.length+")");
  [...new Set(QUIZ.map(q=>q.c))].sort((a,b)=>a-b).forEach(c=>mk(c,"Chương "+chapLabel(c)));
}
function rebuildOrder(){qOrder=QUIZ.map((_,i)=>i).filter(i=>qChap===0||QUIZ[i].c===qChap);}
function resetQuiz(){
  qDone=new Set();qRight=new Set();qWrong=new Set();qPick=new Map();
  rebuildOrder();
}
/* Xao dap an ABCD khi an "Lam lai" (chong hoc vet); giu "Tat ca/Ca hai..." o cuoi */
function shuffleOptions(){
  QUIZ.forEach(q=>{
    const pinned=[],rest=[];
    q.o.forEach((opt,i)=>{(/^(t\u1ea5t c\u1ea3|c\u1ea3 hai)/i.test(opt.trim())?pinned:rest).push(i);});
    shuffle(rest);
    const order=rest.concat(pinned);
    q.a=order.indexOf(q.a);
    q.o=order.map(i=>q.o[i]);
  });
}

/* Luu tien do lam bai tren may (key rieng tung mon, giu nguyen tu ban cu) */
function saveProgress(){
  try{localStorage.setItem(STORE_KEY,JSON.stringify({n:QUIZ.length,done:[...qDone],right:[...qRight],wrong:[...qWrong],pick:[...qPick]}));}catch(e){}
}
function loadProgress(){
  try{
    const s=JSON.parse(localStorage.getItem(STORE_KEY)||"null");
    if(!s||s.n!==QUIZ.length)return;
    qDone=new Set(s.done);
    qPick=new Map((s.pick||[]).map(([k,v])=>[+k,v]));
    qRight=new Set();qWrong=new Set();
    qPick.forEach((oi,idx)=>{if(qDone.has(idx)&&QUIZ[idx]){if(oi===QUIZ[idx].a)qRight.add(idx);else qWrong.add(idx);}});
  }catch(e){}
}
function clearProgress(){try{localStorage.removeItem(STORE_KEY);}catch(e){}}
function updateScore(){
  $("scoreLine").innerHTML="Đã làm <b>"+qDone.size+"</b>/"+qOrder.length+" · Đúng <b>"+qRight.size+"</b>";
  $("wrongCount").textContent=qWrong.size;
}
function renderQuiz(){
  const list=$("quizList");list.innerHTML="";
  const show=qWrongOnly?qOrder.filter(i=>qWrong.has(i)):qOrder;
  if(qWrongOnly&&show.length===0){
    list.innerHTML='<div class="card">Chưa có câu sai. Làm bài đi rồi quay lại đây ôn nhé.</div>';
    updateScore();return;
  }
  show.forEach(idx=>{
    const q=QUIZ[idx];
    const card=document.createElement("div");card.className="card";card.id="qcard-"+idx;
    const head=document.createElement("div");head.className="q-head";
    head.innerHTML='<span class="q-tag">'+qLabel(idx)+'</span><span class="q-num">'+CHAP_NAMES[q.c]+"</span>";
    const qt=document.createElement("p");qt.className="q-text";qt.textContent=q.q;
    card.appendChild(head);card.appendChild(qt);
    const tip=document.createElement("div");tip.className="tip";
    tip.innerHTML="<b>Mẹo nhớ:</b> "+q.t;
    const answered=qDone.has(idx);
    q.o.forEach((opt,oi)=>{
      const b=document.createElement("button");b.className="opt";
      b.innerHTML="<b>"+LETTERS[oi]+".</b> "+opt;
      if(answered){
        b.disabled=true;
        if(oi===q.a)b.classList.add("correct");
        else if(qPick.get(idx)===oi)b.classList.add("wrong");
      }
      b.addEventListener("click",()=>{
        if(qDone.has(idx))return;
        qDone.add(idx);qPick.set(idx,oi);
        card.querySelectorAll(".opt").forEach((ob,obi)=>{
          ob.disabled=true;
          if(obi===q.a)ob.classList.add("correct");
        });
        if(oi===q.a){qRight.add(idx);}else{b.classList.add("wrong");qWrong.add(idx);}
        tip.classList.add("show");updateScore();saveProgress();renderQNav();
      });
      card.appendChild(b);
    });
    if(answered)tip.classList.add("show");
    card.appendChild(tip);
    list.appendChild(card);
  });
  updateScore();renderQNav();
}
$("shuffleBtn").addEventListener("click",()=>{shuffle(qOrder);renderQuiz();window.scrollTo({top:0,behavior:"smooth"});});
$("wrongBtn").addEventListener("click",()=>{qWrongOnly=!qWrongOnly;$("wrongBtn").style.borderColor=qWrongOnly?"var(--accent)":"";renderQuiz();window.scrollTo({top:0,behavior:"smooth"});});
$("resetBtn").addEventListener("click",()=>{resetQuiz();clearProgress();shuffleOptions();renderQuiz();window.scrollTo({top:0,behavior:"smooth"});});
/* ---- Muc luc cau hoi: nhan so cau de nhay toi, hien dung/sai ---- */
function activeTab(){const t=document.querySelector(".tab.active");return t&&t.dataset.tab?t.dataset.tab:"quiz";}
function jumpTo(id,openAcc){
  document.getElementById("qNavOverlay").classList.remove("open");
  const el=document.getElementById(id);if(!el)return;
  if(openAcc)el.classList.add("open");
  el.scrollIntoView({behavior:"smooth",block:"center"});
  el.classList.add("flash");setTimeout(()=>el.classList.remove("flash"),1300);
}
function navNumBtn(nav,label,title,target,cls){
  const b=document.createElement("button");
  b.className="qn"+(cls?" "+cls:"");b.textContent=label;if(title)b.title=title;
  b.addEventListener("click",()=>jumpTo(target));nav.appendChild(b);
}
function renderQNav(){
  const nav=document.getElementById("qNav");if(!nav)return;nav.innerHTML="";
  const tab=activeTab();
  document.getElementById("qNavTitle").textContent=NAV_TITLES[tab]||"Mục lục";
  if(tab==="quiz"){
    qOrder.forEach((idx,n)=>{navNumBtn(nav,n+1,"Di toi cau "+(n+1),"qcard-"+idx,qRight.has(idx)?"ok":qWrong.has(idx)?"bad":"");});
  }else if(tab==="flash"){
    fOrder.forEach((idx,n)=>{navNumBtn(nav,n+1,(FLASH[idx].c?"Chuong "+FLASH[idx].c+" - ":"")+"Cau "+(n+1),"fcard-"+n);});
  }else if(tab==="essay"){
    ESSAYS.forEach((e,i)=>{
      const b=document.createElement("button");b.className="qnl";b.textContent=(i+1)+". "+e.t;
      b.addEventListener("click",()=>jumpTo("essay-"+i,true));nav.appendChild(b);
    });
  }else if(tab==="timeline"&&TL_RAW){
    TL_RAW.forEach((it,i)=>{navNumBtn(nav,i+1,String(it[0]),"tl-"+i);});
  }else if(tab==="keys"){
    document.querySelectorAll("#panel-keys h3").forEach(h=>{
      if(!h.id)return;
      const b=document.createElement("button");b.className="qnl";b.textContent=h.textContent;
      b.addEventListener("click",()=>jumpTo(h.id));nav.appendChild(b);
    });
  }
}
const qNavFab=document.getElementById("qNavFab"),qNavOverlay=document.getElementById("qNavOverlay");
qNavFab.addEventListener("click",()=>{renderQNav();qNavOverlay.classList.add("open");});
document.getElementById("qNavClose").addEventListener("click",()=>qNavOverlay.classList.remove("open"));
qNavOverlay.addEventListener("click",e=>{if(e.target===qNavOverlay)qNavOverlay.classList.remove("open");});
/* ---- Nut len dau trang ---- */
const toTopBtn=document.getElementById("toTop");
window.addEventListener("scroll",()=>{toTopBtn.classList.toggle("show",window.scrollY>400);},{passive:true});
toTopBtn.addEventListener("click",()=>{window.scrollTo({top:0,behavior:"smooth"});});

/* ---- Cau hoi ngan: dap an hien ngay ben duoi ---- */
let fOrder=[];
function formatAnswer(a){
  const lines=a.split("\n").map(s=>s.trim()).filter(Boolean);
  if(lines.length<=1) return a;
  const intro=lines[0].replace(/[:：]\s*$/,'');
  const items=lines.slice(1).map(l=>'<li>'+l.replace(/^\s*(?:\(\d+\)|-)\s*/,'')+'</li>').join('');
  return intro+':<ul class="ans-list">'+items+'</ul>';
}
function renderFlashList(){
  const list=$("flashList");list.innerHTML="";
  fOrder.forEach((idx,n)=>{
    const f=FLASH[idx];
    const d=document.createElement("div");d.className="card";d.id="fcard-"+n;
    d.innerHTML='<div class="q-head"><span class="q-tag">Câu '+(n+1)+'</span>'
      +(f.c?'<span class="q-num">Chương '+f.c+'</span>':'')
      +'</div><p class="q-text">'+f.q+'</p>'
      +'<div class="tip show"><b>Trả lời:</b> '+formatAnswer(f.a)+'</div>';
    list.appendChild(d);
  });
}
$("fcShuffle").addEventListener("click",()=>{shuffle(fOrder);renderFlashList();window.scrollTo({top:0,behavior:"smooth"});});

/* ---- Essays / Bai thuc hanh ---- */
function renderEssays(){
  const box=$("essayList");box.innerHTML="";
  ESSAYS.forEach((e,i)=>{
    const d=document.createElement("div");d.className="acc";d.id="essay-"+i;
    d.innerHTML='<div class="acc-head"><span>'+e.t+'</span><span>＋</span></div><div class="acc-body">'+e.h+'</div>';
    d.querySelector(".acc-head").addEventListener("click",()=>{
      d.classList.toggle("open");
      d.querySelector(".acc-head span:last-child").textContent=d.classList.contains("open")?"－":"＋";
    });
    box.appendChild(d);
  });
}
/* ---- Copy code (bai thuc hanh CS420) ---- */
function copyCode(btn){
  const code = btn.closest('.codewrap').querySelector('code').innerText;
  navigator.clipboard.writeText(code).then(()=>{
    const old = btn.textContent;
    btn.textContent = 'Đã copy';
    setTimeout(()=>btn.textContent = old, 1500);
  });
}
/* ---- Timeline (Lich su Dang) ---- */
function renderTimeline(){
  if(!TL_RAW) return;
  const box=$("tlList");if(!box)return;box.innerHTML="";
  TL_RAW.forEach((it,i)=>{
    const d=document.createElement("div");d.className="tl-item";d.id="tl-"+i;
    d.innerHTML='<span class="tl-year">'+it[0]+'</span> – '+it[1];
    box.appendChild(d);
  });
}

/* ---- Gop y: nut tren phai nhay toi tab; form trong tab, gui qua email cua kha ---- */
(function(){
  const openBtn = document.getElementById("fbOpenTop");
  if (openBtn) openBtn.addEventListener("click", () => {
    const tab = document.querySelector('.tab[data-tab="gopy"]');
    if (tab) tab.click();
  });
  const form = document.getElementById("fbForm");
  if (!form) return;
  const monSel = document.getElementById("fbSubj");
  monSel.innerHTML = '<option value="all">Tất cả các môn</option>' + MONS.map(m =>
    '<option value="' + m + '">' + MON_NAMES[m] + " — " + MON_FULL[m] + '</option>').join("");
  const params = window.APP_PARAMS || {};
  monSel.value = params.mon === "all" ? "all" : window.APP_MON;
  if (params.tab === "gopy") {
    setTimeout(() => { const t = document.querySelector('.tab[data-tab="gopy"]'); if (t) t.click(); }, 0);
  }
  const imgInput = document.getElementById("fbImg");
  const imgPrev = document.getElementById("fbImgPrev");
  const imgNote = document.getElementById("fbImgNote");
  let fbFile = null;
  imgInput.addEventListener("change", () => {
    fbFile = (imgInput.files && imgInput.files[0]) || null;
    if (fbFile) {
      try { imgPrev.src = URL.createObjectURL(fbFile); imgPrev.style.display = "block"; }
      catch (err) { imgPrev.style.display = "none"; }
      imgNote.textContent = "Đã chọn ảnh: " + fbFile.name + " — ảnh sẽ đi kèm góp ý khi bấm Gửi.";
      imgNote.style.display = "block";
    } else {
      imgPrev.removeAttribute("src"); imgPrev.style.display = "none";
      imgNote.style.display = "none";
    }
  });
  form.addEventListener("submit", e => {
    e.preventDefault();
    const name = document.getElementById("fbName").value.trim();
    const kind = document.getElementById("fbKind").value;
    const text = document.getElementById("fbBody").value.trim();
    if (!text) return;
    const monVal = monSel.value;
    const monLabel = monVal === "all" ? "Tất cả các môn" : (MON_NAMES[monVal] + " — " + MON_FULL[monVal]);
    const subject = "[Góp ý web ôn tập] " + kind + " — " + (monVal === "all" ? "TẤT CẢ" : MON_NAMES[monVal]);
    const body = "Môn: " + monLabel + "\nLoại: " + kind + "\nTên: " + (name || "(ẩn danh)") + "\n\n" + text;
    const note = document.getElementById("fbNote");
    const picked = fbFile || (imgInput.files && imgInput.files[0]);
    const files = picked ? [picked] : [];
    if (files.length && window.navigator && navigator.canShare && navigator.canShare({ files })) {
      navigator.share({ title: subject, text: body, files }).then(() => {
        note.textContent = "Đã chia sẻ góp ý kèm ảnh. Cảm ơn Bạn!";
      }).catch(() => {
        note.textContent = "Bạn chưa gửi — bấm Gửi góp ý lại khi sẵn sàng nhé.";
      });
      return;
    }
    window.location.href = "mailto:baokha0905@gmail.com?subject=" + encodeURIComponent(subject) + "&body=" + encodeURIComponent(body);
    note.textContent = files.length
      ? "Đã mở ứng dụng email — nhớ đính kèm ảnh Bạn vừa chọn vào email nhé. Cảm ơn Bạn!"
      : "Đã mở ứng dụng email — Bạn bấm Gửi trong đó là xong. Cảm ơn Bạn đã góp ý!";
  });
})();

/* ---- Init ---- */
loadProgress();buildChapChips();rebuildOrder();renderQuiz();
fOrder=FLASH.map((_,i)=>i);renderFlashList();
renderEssays();renderTimeline();
