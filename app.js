(function(){
"use strict";
var A = AOV;

/* ---------- shell ---------- */
var SHELL = '<header class="top"><div class="top-in"><div class="brand"><span class="eyebrow">Age of Vikings · лист героя</span><div class="name-row"><b id="hdr-name">Герой</b><button type="button" class="lock-btn" id="btn-lock" aria-pressed="false"></button></div></div>'+
  '<div class="vitals" id="vitals"></div>'+
  '<div class="actions"><span id="save-status" class="status" role="status" aria-live="polite"></span>'+
  '<div class="mode-tg" role="group" aria-label="Режим листа"><button type="button" data-mode="book">Книга</button><button type="button" data-mode="full">Полный</button><button type="button" data-mode="combat">Боевой</button></div>'+
  '<button type="button" class="btn small" id="btn-chars">Герои</button>'+
  '<button type="button" class="btn ghost small" id="btn-theme">Тема</button>'+
  '<button type="button" class="btn ghost small" id="btn-end">Конец сессии</button>'+
  '<button type="button" class="btn ghost small" id="btn-export">Экспорт<i class="due-dot" aria-hidden="true"></i></button>'+
  '<label class="btn ghost small file" for="imp-in">Импорт<input type="file" id="imp-in" accept=".json,application/json" hidden></label>'+
  '<button type="button" class="btn ghost small" id="btn-install" hidden>Установить</button></div></div>'+
  '</header><nav class="qnav" id="qnav" aria-label="Разделы"></nav>'+
  '<main id="app" class="wrap"></main><main id="combat"></main><main id="book"></main>'+
  '<div id="sheet" class="sheet" hidden><div class="sheet-card" role="dialog" aria-modal="true" aria-label="Бросок"><button type="button" class="m-x" data-sclose="1" aria-label="Закрыть">×</button><div id="s-body"></div></div></div>'+
  '<div id="modal" class="modal" hidden><div class="m-card" role="dialog" aria-modal="true"><button type="button" class="m-x" data-close="1" aria-label="Закрыть">×</button><div id="m-body"></div></div></div>'+
  '<div id="toast" class="toast" role="status" aria-live="polite" hidden></div>'+
  '<div id="galdur" class="gal-ov" hidden role="dialog" aria-modal="true" aria-label="Гальдур"></div>';
document.getElementById("page-shell").innerHTML = SHELL;
(function(){ var st='<div class="stars" aria-hidden="true">'; for (var i=0;i<28;i++){ st+='<i style="left:'+(Math.random()*100).toFixed(1)+'%;top:'+(Math.random()*100).toFixed(1)+'%;animation-delay:'+(Math.random()*3.4).toFixed(2)+'s"></i>'; } document.body.insertAdjacentHTML("afterbegin", st+'</div>'); })();

var PALETTES = [
  {k:"silver", n:"Серебряная книга", d:"Индиго, золото и звёзды — ночь Иггдрасиля", c:["#0b121c","#1f2b5a","#d8b25a","#e4e7ea"]},
  {k:"vellum", n:"Пергамент", d:"Светлая страница саги, синие чернила и киноварь", c:["#d9c79f","#f8eedb","#1b2a4a","#2a1d12"]},
  {k:"ash", n:"Пепел и серебро", d:"Холодная сталь, серебро без золота", c:["#0d1012","#20262c","#c9d3dc","#e6e9ec"]},
  {k:"hearth", n:"У очага", d:"Тёплое дерево и янтарь, как в «Кузнице Героя»", c:["#17110c","#2a1f15","#e0a046","#f1e6d2"]}
];
function applyPalette(k){ if (!PALETTES.some(function(p){return p.k===k;})) k="silver"; if (k==="silver") document.documentElement.removeAttribute("data-palette"); else document.documentElement.setAttribute("data-palette",k); var m=document.querySelector('meta[name="theme-color"]'); var P=PALETTES.filter(function(p){return p.k===k;})[0]; if (m) m.setAttribute("content", P.c[0]); return k; }
var palette = "silver"; try { palette = localStorage.getItem("aov-palette") || "silver"; } catch(e){}
palette = applyPalette(palette);
function paletteHtml(){ return '<h2>Цветовая тема</h2><div class="pal-list">'+PALETTES.map(function(p){ return '<button type="button" class="pal'+(p.k===palette?' on':'')+'" data-pal="'+p.k+'" style="background:'+p.c[1]+';color:'+p.c[3]+';border-color:'+p.c[2]+'"><span class="sw">'+p.c.map(function(c){return '<i style="background:'+c+'"></i>';}).join('')+'</span><b>'+p.n+'</b><small>'+p.d+'</small></button>'; }).join('')+'</div><p class="hint">Тема запоминается на этом устройстве.</p>'+wakeHtml(); }

/* ---------- helpers ---------- */
function esc(v){ return String(v==null?"":v).replace(/[&<>"']/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c];}); }
function getPath(o,p){ return p.split(".").reduce(function(a,k){ return a==null?undefined:a[k]; }, o); }
function setPath(o,p,v){ var ks=p.split("."), last=ks.pop(); var t=ks.reduce(function(a,k){ if(a[k]==null) a[k]={}; return a[k]; }, o); t[last]=v; }
function num(v){ v=+v; return isFinite(v)?v:0; }
function uid(){ return "c" + Date.now().toString(36) + Math.random().toString(36).slice(2,7); }
function rnd(n){ return 1+Math.floor(Math.random()*n); }
function sgn(n){ return n>0?"+"+n:n<0?"−"+(-n):"0"; }
function pct(n){ return (n>0?"+":n<0?"−":"")+Math.abs(n)+"%"; }
function nameOfChar(k){ return A.CHARS.filter(function(c){return c[0]===k;})[0][1]; }
var CATN = {}; A.CATS.forEach(function(c){ CATN[c[0]]=c[1]; });
var LOCN = {}; A.LOCS.forEach(function(l){ LOCN[l[0]]=l; });
var RUNE = {}; A.RUNES.forEach(function(r){ RUNE[r.k]=r; });

/* ---------- rules ---------- */
function C(k){ return num(state.chars[k]); }
function primary(v){ return v<=4?-10:v<=8?-5:v<=12?0:v<=16?5:v<=20?10:10+5*Math.ceil((v-20)/4); }
function minor(v){ return v<=4?-5:v<=16?0:v<=20?5:5+5*Math.ceil((v-20)/4); }
function catAuto(c){
  var S=C("str"),Z=C("siz"),D=C("dex"),I=C("int"),P=C("pow"),H=C("cha");
  switch(c){
    case "agi": return minor(S)-minor(Z)+primary(D)+minor(P);
    case "com": return minor(I)+minor(P)+primary(H);
    case "kno": return primary(I)+minor(P);
    case "man": case "wpn": return minor(S)+primary(D)+primary(I)+minor(P);
    case "myt": return primary(P)+minor(H);
    case "per": return primary(I)+minor(P);
    case "ste": return minor(S)+primary(D)+primary(I)+minor(P);
  } return 0;
}
function catSpirit(c){ var p=A.PERSONALITY[state.info.personality]; if(!p) return 0; var cc=c==="wpn"?"man":c; return p.cats.indexOf(cc)>=0?20:0; }
function catAdj(c){ return num((state.catAdj||{})[c==="wpn"?"man":c]); }
function catMod(c){ return catAuto(c)+catSpirit(c)+catAdj(c); }
function hpMods(){ var Z=C("siz"),P=C("pow"); var sm=Math.ceil((Z-12)/4); if (Z<=4) sm=-2; var pm=P<=4?-1:P<=16?0:Math.ceil((P-16)/4); return {siz:sm,pow:pm}; }
function hpMax(){ var m=hpMods(); return Math.max(1, C("con")+m.siz+m.pow+num(state.hp.bonus)); }
function hpCur(){ return hpMax()-num(state.hp.lost); }
function locMax(k){ var b=Math.max(0,Math.ceil((hpMax()-6)/3)); return LOCN[k][3]+b+num((state.hp.locAdj||{})[k]); }
function locCur(k){ return locMax(k)-num(state.hp.loc[k]); }
function healRate(){ return Math.max(1,Math.ceil(C("con")/6)); }
function dmString(){ var x=C("str")+C("siz"); if (x<=12) return "−1D4"; if (x<=24) return "0"; if (x<=32) return "+1D4"; if (x<=40) return "+1D6"; if (x<=56) return "+2D6"; return "+"+(2+Math.ceil((x-56)/16))+"D6"; }
function encMax(){ return Math.ceil((C("str")+C("con"))/2); }
function mpMax(){ return Math.max(0, C("pow")+num(state.mp.bonus)); }
function mpLockedRunes(){ return (state.runes.scripts||[]).reduce(function(a,s){ return a+(s.state==="ready"?2*s.r.length:0); },0); }
function mpLockedSeid(){ return (state.seidr.spells||[]).reduce(function(a,s){ return a+(s.active?num(s.lock):0); },0); }
function mpLocked(){ return mpLockedRunes()+mpLockedSeid()+num(state.mp.lock); }
function mpAvail(){ return Math.max(0, mpMax()-num(state.mp.spent)-mpLocked()); }
function maxDP(v){ v=num(v); return v>=60?3:v>=30?2:v>=10?1:0; }
function skillBase(s){ if (s.b==="dex2") return C("dex")*2; if (s.b==="dex3") return C("dex")*3; return num(s.b); }
function skillByKey(k){ for (var i=0;i<state.skills.length;i++) if (state.skills[i].k===k) return state.skills[i]; return null; }
function locAP(k){ var ap=0; (state.armour||[]).forEach(function(a){ if (a.worn && (a.locs||[]).indexOf(k)>=0) ap+=num(a.ap); }); return ap+num((state.hp.apAdj||{})[k]); }
function encTotal(){ var e=0; state.weapons.forEach(function(w){ e+=num(w.enc); }); state.armour.forEach(function(a){ if(a.worn) e+=num(a.enc); }); state.gear.forEach(function(g){ e+=num(g.enc)*(g.q===""||g.q==null?1:num(g.q)); }); return Math.round(e*10)/10; }

/* success levels per the Ability Results table (p. 62) */
function critOf(t){ if (t<=12) return 1; if (t<=49) return 2; if (t<=69) return 3; if (t<=89) return 4; if (t<=109) return 5; return Math.floor(t/20+0.5); }
function specOf(t){ return Math.max(1, Math.floor(t/5+0.5)); }
function fumbleFrom(t){ if (t>=100) return 100; var n=Math.max(1, Math.floor((100-t)*0.05+0.5)); return 101-n; }
function resolve(t,r){
  var crit=critOf(t), spec=specOf(t), fum=fumbleFrom(t);
  if (r===1 || r<=crit && r<=Math.max(t,5)) return "crit";
  if (r>=fum) return "fumb";
  if (r>=96) return "fail";
  if (r<=spec && r<=Math.max(t,5)) return "spec";
  if (r<=t || r<=5) return "succ";
  return "fail";
}
var LEVELS = {crit:["Критический успех","crit"], spec:["Особый успех","spec"], succ:["Успех","succ"], fail:["Неудача","fail"], fumb:["Провал","fumb"]};
function isSuccess(l){ return l==="crit"||l==="spec"||l==="succ"; }
function thrLine(t){ var f=fumbleFrom(t); return 'Крит ≤'+critOf(t)+' · Особый ≤'+specOf(t)+' · Успех ≤'+Math.max(Math.min(t,95),5)+' · Провал '+(f>=100?'00':f+'–00'); }

/* dice */
function parseDice(s){ s=String(s||"").replace(/\s/g,"").replace(/[Дд]/g,"D").replace(/d/g,"D").replace(/−/g,"-"); if (!/^[+-]?(\d*D\d+|\d+)([+-](\d*D\d+|\d+))*$/.test(s)) return null; var parts=s.match(/[+-]?[^+-]+/g)||[], out={dice:[],k:0}; parts.forEach(function(p){ var sign=p[0]==="-"?-1:1; p=p.replace(/^[+-]/,""); if (p.indexOf("D")>=0){ var a=p.split("D"); out.dice.push({n:+(a[0]||1), s:+a[1], sign:sign}); } else out.k+=sign*(+p); }); return out; }
function rollDice(d,mult){ mult=mult||1; var total=d.k*mult, faces=[]; d.dice.forEach(function(x){ for (var i=0;i<x.n*mult;i++){ var v=rnd(x.s); faces.push((x.sign<0?"−":"")+v+"<sub>d"+x.s+"</sub>"); total+=x.sign*v; } }); return {total:total, faces:faces}; }
function maxDice(d,mult){ mult=mult||1; var t=d.k*mult; d.dice.forEach(function(x){ t+=x.sign*x.n*x.s*mult; }); return t; }

/* ---------- state ---------- */
var STORE="aov-chars-v1", CUR="aov-current-v1";
function readStore(){ try { return JSON.parse(localStorage.getItem(STORE)||"{}")||{}; } catch(e){ return {}; } }
function blank(){
  var s = {v:1, info:{name:"",nick:"",meaning:"",player:"",gender:"",age:"",personality:"",animal:"",home:"",godi:"",features:"",runes:false,seidr:false},
    portrait:"", chars:{str:10,con:10,siz:13,dex:10,int:13,pow:10,cha:10}, catAdj:{}, rep:5, status:25,
    skills:[], passions:[{n:"Честь",v:60,x:false},{n:"Верность (годи)",v:60,x:false},{n:"Любовь (семья)",v:60,x:false}], devotions:[],
    hp:{bonus:0,lost:0,loc:{},locAdj:{},apAdj:{}}, mp:{bonus:0,spent:0,lock:0},
    weapons:[], armour:[], gear:[], wealth:"",
    runes:{known:[],scripts:[],binds:[]}, seidr:{focus:"",spells:[]},
    family:{spouse:"",children:"",kin:"",ancestry:"",farm:"",cattle:"",sheep:"",horses:"",thralls:"",farmnotes:""},
    notes:{saga:"",npc:"",misc:"",xplog:""}, saved:0, locked:false};
  return s;
}
function normalize(s){
  var b=blank();
  Object.keys(b).forEach(function(k){ if (s[k]===undefined) s[k]=b[k]; });
  ["info","chars","hp","mp","runes","seidr","family","notes"].forEach(function(g){ Object.keys(b[g]).forEach(function(k){ if (s[g][k]===undefined) s[g][k]=b[g][k]; }); });
  ["loc","locAdj","apAdj"].forEach(function(k){ if (!s.hp[k]) s.hp[k]={}; });
  if (!s.combat) s.combat={art:"",bg:"#fcfcfa",pos:{}}; if (!s.combat.pos) s.combat.pos={};
  if (!s.catAdj) s.catAdj={};
  (s.weapons||[]).forEach(function(w){ if ((w.sk==="bow"||w.sk==="sling") && w.ammoMax==null){ w.ammoMax=w.sk==="bow"?20:10; w.ammo=w.ammoMax; } });
  var have={}; s.skills.forEach(function(x){ have[x.k]=1; });
  A.SKILLS.forEach(function(d,ix){ if (!have[d[0]]) s.skills.push({k:d[0], n:d[1], c:d[2], b:d[3], v:null, x:false, o:ix}); });
  s.skills.forEach(function(x){ var d=A.SKILLS.filter(function(z){return z[0]===x.k;})[0]; if (d){ x.c=d[2]; x.b=d[3]; x.o=A.SKILLS.indexOf(d); } else if (x.o==null) x.o=1000; });
  s.skills.forEach(function(x){ if (x.v===null || x.v===undefined){ x.v = x.b==="dex2"?num(s.chars.dex)*2 : x.b==="dex3"?num(s.chars.dex)*3 : num(x.b); } });
}
function fromSeed(seed){
  var s=blank(); s.info=Object.assign(s.info, seed.info); s.chars=Object.assign({}, seed.chars); s.catAdj=Object.assign({}, seed.catAdj||{});
  s.rep=seed.rep; s.status=seed.status; normalize(s);
  var keep=state; state=s;
  s.skills.forEach(function(x){ if (x.k==="craft" && seed.craftName) x.n=seed.craftName;
    if (seed.skillVals[x.k]!==undefined) x.v=seed.skillVals[x.k];
    else { var b=skillBase(x); x.v = b>0 ? Math.max(0, b+catMod(x.c)) : 0; } });
  state=keep;
  s.passions = seed.passions.map(function(p){ return {n:p.n,v:p.v,x:false}; });
  s.devotions = seed.devotions.map(function(d){ var g=A.GODS.filter(function(z){return z[0]===d.god;})[0]; return {god:d.god, ideals:g?g[1]:"", v:d.v, dp:Math.min(d.dp,maxDP(d.v)), x:false}; });
  s.weapons = seed.weapons.map(function(n){ return weaponFromCat(A.WEAPONS.filter(function(w){return w.n===n;})[0]); });
  s.armour = A.STARTER_ARMOUR.map(function(n){ return armourFromCat(A.ARMOUR.filter(function(a){return a.n===n;})[0], true); });
  s.family = Object.assign(s.family, seed.family); s.notes=Object.assign(s.notes, seed.notes);
  s.gear=[{n:"Одежда, плащ, сапоги",q:1,enc:0,notes:""},{n:"Рыболовные снасти",q:1,enc:0,notes:"держит дома, на хуторе"}];
  return s;
}
function weaponFromCat(w){ return {n:w.n, sk:w.sk, dmg:w.dmg, dm:w.dm, t:w.t, hp:w.hp, enc:w.enc, len:w.len, notes:w.req&&w.req!=="—"?"СИЛ/ЛОВ "+w.req:"", shield:!!w.shield}; }
function armourFromCat(a,worn){ return {n:a.n, locs:a.locs.slice(), ap:a.ap, enc:a.enc, worn:!!worn}; }

var chars = readStore(), curId=null, state;
try { curId = localStorage.getItem(CUR); } catch(e){}
if (!Object.keys(chars).length){ var seed=A.ASKEL?JSON.parse(JSON.stringify(A.ASKEL)):fromSeed(A.SEED); seed.id=uid(); seed.saved=Date.now(); chars[seed.id]=seed; curId=seed.id; }
if (!curId || !chars[curId]) curId = Object.keys(chars)[0];
state = chars[curId]; normalize(state);

/* ---------- render pieces ---------- */
var app = document.getElementById("app");
var noteTab = "saga", collapsed = {}, hiLoc = null, openW = {};
app.addEventListener("toggle", function(e){ var t=e.target; if (t.classList && t.classList.contains("w-edit-d")) openW[t.getAttribute("data-wi")]=t.open; }, true);
try { collapsed = JSON.parse(localStorage.getItem("aov-collapsed")||"{}"); } catch(e){}
function section(id,title,body,extra){ var c=collapsed[id]; return '<section class="sec'+(c?' closed':'')+'" id="sec-'+id+'"><header class="sec-h"><button type="button" class="sec-t" data-toggle="'+id+'" aria-expanded="'+(!c)+'">'+title+'</button>'+(extra||'')+'</header><div class="sec-b">'+body+'</div></section>'; }
function field(label,path,opts){ opts=opts||{}; var v=getPath(state,path); var id="f-"+path.replace(/\./g,"-");
  if (opts.area) return '<label class="fld wide area" for="'+id+'"><span>'+label+'</span><textarea id="'+id+'" data-bind="'+path+'" rows="'+(opts.rows||3)+'">'+esc(v)+'</textarea></label>';
  return '<label class="fld'+(opts.wide?' wide':'')+'" for="'+id+'"><span>'+label+'</span><input id="'+id+'" data-bind="'+path+'" value="'+esc(v)+'" autocomplete="off"'+(opts.num?' inputmode="numeric" data-num="1"':'')+'></label>'; }
function numIn(path,val,label,cls){ return '<input class="'+(cls||'num')+'" type="number" inputmode="numeric" data-bind="'+path+'" data-num="1" data-rerender="1" value="'+esc(val)+'" aria-label="'+esc(label)+'">'; }
function pips(path,cur,max,cap){ cap=cap||max; var h='<span class="pips">'; for (var i=1;i<=cap;i++){ h+='<button type="button" class="pip'+(i<=cur?' on':'')+(i>max?' off':'')+'" data-pip="'+path+'" data-v="'+i+'" data-max="'+max+'" aria-label="'+i+'"'+(i>max?' disabled':'')+'></button>'; } return h+'</span>'; }

var QGLYPH = {hero:'ᛗ',combat:'ᛏ',skills:'ᚲ',pass:'ᚹ',faith:'ᚨ',runes:'ᚱ',seidr:'ᛉ',gear:'ᚠ',family:'ᛟ',notes:'ᛈ'};
var SECS = [["hero","Герой"],["combat","Бой"],["skills","Умения"],["pass","Страсти"],["faith","Вера"],["runes","Руны"],["seidr","Сейд"],["gear","Добро"],["family","Род"],["notes","Записи"]];

function renderHero(){
  var i=state.info, P=A.PERSONALITY[i.personality];
  var h='<div class="id-grid"><div class="portrait">'+(state.portrait?'<img src="'+esc(state.portrait)+'" alt="Портрет героя">':'<div class="ph"><span>ᚨ</span>Нет портрета</div>')+
    '<label class="btn ghost small file" for="portrait-in">Портрет<input type="file" id="portrait-in" accept="image/*" hidden></label></div><div class="fields">'+
    field("Имя","info.name")+field("Прозвище","info.nick")+field("Значение имени","info.meaning")+field("Игрок","info.player")+
    field("Пол","info.gender")+field("Возраст","info.age")+
    '<label class="fld" for="f-pers"><span>Тип личности <button type="button" class="i" data-info="personality" aria-label="Справка">?</button></span><select id="f-pers" data-bind="info.personality" data-rerender="1"><option value="">— не выбран —</option>'+Object.keys(A.PERSONALITY).map(function(k){ return '<option value="'+k+'"'+(k===i.personality?' selected':'')+'>'+A.PERSONALITY[k].n+' (+20% '+A.PERSONALITY[k].cats.map(function(c){return CATN[c];}).join(", ")+')</option>'; }).join('')+'</select></label>'+
    '<label class="fld" for="f-anim"><span>Дух-зверь (фюльгья)</span><input id="f-anim" data-bind="info.animal" value="'+esc(i.animal)+'" list="anim-list" autocomplete="off"><datalist id="anim-list">'+(P?P.animals:[].concat.apply([],Object.keys(A.PERSONALITY).map(function(k){return A.PERSONALITY[k].animals;}))).map(function(a){return '<option value="'+a+'">';}).join('')+'</datalist></label>'+
    field("Хутор, четверть","info.home")+field("Годи","info.godi")+field("Приметы","info.features",{area:1,rows:2})+
    '<div class="fld wide magic-tg"><span>Магия</span><div class="row-btns"><button type="button" class="tg'+(i.runes?' on':'')+'" data-flag="runes" aria-pressed="'+(!!i.runes)+'">ᚱ Мастер рун</button><button type="button" class="tg'+(i.seidr?' on':'')+'" data-flag="seidr" aria-pressed="'+(!!i.seidr)+'">✦ Сейд</button></div></div>'+
    '</div></div>';
  h+='<h3 class="mt">Характеристики <small>нажми — бросок ×5, ×3…</small></h3><div class="chars">';
  A.CHARS.forEach(function(c){ h+='<div class="ch"><button type="button" class="ch-n" data-rollchar="'+c[0]+'" title="'+esc(c[2]+": "+A.CHAR_HINT[c[0]])+'">'+c[1]+'</button>'+numIn("chars."+c[0],state.chars[c[0]],c[2],"ch-v")+'<span class="ch-x">×5 = '+C(c[0])*5+'%</span></div>'; });
  h+='</div>';
  var m=hpMods();
  h+='<div class="derived">'+
    der("Очки здоровья", hpMax(), "ВЫН "+C("con")+" · РАЗ "+sgn(m.siz)+" · ВОЛ "+sgn(m.pow)+(num(state.hp.bonus)?" · прочее "+sgn(num(state.hp.bonus)):""), "hp.bonus")+
    der("Очки магии", mpMax(), "= ВОЛ"+(num(state.mp.bonus)?" "+sgn(num(state.mp.bonus)):""), "mp.bonus")+
    der("Скорость лечения", healRate(), "ОЗ в неделю в каждой зоне")+
    der("Мод. урона", dmString(), "СИЛ+РАЗ = "+(C("str")+C("siz")))+
    der("Перемещение", 10, "10 м шагом, 30 бегом за раунд")+
    der("Макс. нагрузка", encMax(), "(СИЛ+ВЫН)/2, вверх")+
    '<div class="der"><span class="lbl">Репутация</span><div class="der-v">'+numIn("rep",state.rep,"Репутация","num big-in")+'<button type="button" class="rbtn" data-rollraw="rep" aria-label="Бросок Репутации">d100</button></div><small>старт 5% + семья</small></div>'+
    '<div class="der"><span class="lbl">Статус</span><div class="der-v">'+numIn("status",state.status,"Статус","num big-in")+'<button type="button" class="rbtn" data-rollraw="status" aria-label="Бросок Статуса">d100</button></div><small>старт 25%</small></div>'+
    '</div>';
  return section("hero","Герой",h);
}
function der(label,val,sub,bonusPath){ return '<div class="der"><span class="lbl">'+label+'</span><b class="der-b">'+esc(val)+'</b><small>'+esc(sub)+'</small>'+(bonusPath?'<span class="bonus">поправка <button type="button" class="pm" data-bonus="'+bonusPath+'" data-d="-1" aria-label="Меньше">−</button><button type="button" class="pm" data-bonus="'+bonusPath+'" data-d="1" aria-label="Больше">+</button></span>':'')+'</div>'; }

function vitalsHtml(){
  var hc=hpCur(), hm=hpMax();
  var st = hc<=0?'<span class="vchip bad">При смерти</span>':hc<=2?'<span class="vchip bad">Без сознания</span>':'';
  return '<button type="button" class="vital'+(hc<=2?' bad':'')+'" data-go="combat"><span>ОЗ</span><b>'+hc+'</b><i>/'+hm+'</i></button>'+
    '<button type="button" class="vital" data-go="combat"><span>ОМ</span><b>'+mpAvail()+'</b><i>/'+mpMax()+'</i></button>'+
    '<button type="button" class="vital" data-go="hero" title="Воля — запас Вирда"><span>ВОЛ</span><b>'+C("pow")+'</b></button>'+st;
}

function renderCombat(){
  var hc=hpCur(), hm=hpMax(), lockedMP=mpLocked();
  var h='<div class="trackers">';
  h+='<div class="trk'+(hc<=2?' bad':'')+'"><div class="trk-h"><span class="lbl">Очки здоровья</span><b class="big">'+hc+'</b><span class="of">из '+hm+'</span></div><div class="row-btns"><button type="button" class="btn ghost small" data-hp="-1">−1 ОЗ</button><button type="button" class="btn ghost small" data-hp="1">+1 ОЗ</button><button type="button" class="btn ghost small" data-hpdlg="1">Общий урон…</button></div>'+
    '<div class="bar"><i style="width:'+Math.max(0,Math.min(100,hc/hm*100))+'%"></i></div>'+
    (hc<=0?'<p class="warnline">ОЗ на нуле: герой умрёт в конце раунда, если его не вернуть к положительным ОЗ.</p>':hc<=2?'<p class="warnline">1–2 ОЗ: герой без сознания.</p>':'')+'</div>';
  h+='<div class="trk"><div class="trk-h"><span class="lbl">Очки магии</span><b class="big">'+mpAvail()+'</b><span class="of">из '+mpMax()+(lockedMP?' · в залоге '+lockedMP:'')+'</span></div><div class="row-btns"><button type="button" class="btn ghost small" data-mp="1">−1 ОМ</button><button type="button" class="btn ghost small" data-mp="-1">+1 ОМ</button><button type="button" class="btn ghost small" data-mprest="1">Отдых 6 ч (+'+Math.ceil(C("pow")/4)+')</button><button type="button" class="btn ghost small" data-mpfull="1">Сутки</button></div>'+
    '<div class="bar mp"><i style="width:'+(mpMax()?Math.max(0,mpAvail()/mpMax()*100):0)+'%"></i><i class="lk" style="width:'+(mpMax()?Math.min(100,lockedMP/mpMax()*100):0)+'%"></i></div>'+
    (mpMax()&&mpAvail()===0?'<p class="warnline">0 ОМ — герой теряет сознание.</p>':'')+'<p class="hint sm">Залог: руны '+mpLockedRunes()+', сейд '+mpLockedSeid()+', прочее <button type="button" class="pm" data-bonus="mp.lock" data-d="-1" aria-label="Меньше">−</button> '+num(state.mp.lock)+' <button type="button" class="pm" data-bonus="mp.lock" data-d="1" aria-label="Больше">+</button></p></div>';
  h+='</div>';
  /* paper doll */
  h+='<div class="doll-wrap"><div class="doll">';
  A.LOCS.forEach(function(l){ var k=l[0], mx=locMax(k), cur=locCur(k), ap=locAP(k), dmg=num(state.hp.loc[k]);
    var stt = cur<=-2*mx?'x3':cur<=-mx?'x2':cur<=0?'down':dmg>0?'hurt':'';
    var cells=''; for (var q=0;q<mx;q++) cells+='<i class="'+(q<cur?'ok':'')+'"></i>';
    h+='<button type="button" class="loc loc-'+k+(stt?' '+stt:'')+(hiLoc===k?' hi':'')+'" data-loc="'+k+'"><span class="loc-n">'+l[1]+'</span><span class="loc-d">'+l[2]+'</span><span class="loc-hp"><b>'+cur+'</b>/'+mx+'</span><span class="loc-ap" title="Очки брони">ОБ '+ap+'</span><span class="loc-cells">'+cells+'</span></button>';
  });
  h+='</div><div class="doll-side"><button type="button" class="btn" data-rollloc="1">d20 — куда попали</button><div id="loc-out" class="loc-out">'+(hiLoc?'Попадание: <b>'+LOCN[hiLoc][1]+'</b>':'Нажми на зону, чтобы записать урон или лечение.')+'</div>'+
    '<div class="row-btns"><button type="button" class="btn ghost small" data-healweek="1">Неделя отдыха (+'+healRate()+' в зоне)</button><button type="button" class="btn ghost small" data-healall="1">Полностью здоров</button></div>'+
    '<p class="hint sm">Урон вычитается и из зоны, и из общих ОЗ. По конечности одним ударом в общие ОЗ идёт не больше удвоенных ОЗ зоны.</p>';
  var downs = A.LOCS.filter(function(l){ return locCur(l[0])<=0; });
  if (downs.length) h+='<div class="downs">'+downs.map(function(l){ return '<p><b>'+l[1]+':</b> '+esc(A.LOC_DOWN[l[0]])+'</p>'; }).join('')+'</div>';
  h+='</div></div>';
  /* weapons */
  var dm=dmString();
  h+='<h3 class="mt">Оружие <small>Мод. урона '+dm+'</small></h3><div class="wtab">';
  state.weapons.forEach(function(w,ix){ var s=skillByKey(w.sk), pv=s?num(s.v):null;
    var dmgTxt = esc(w.dmg)+(dm!=="0" && parseDice(w.dmg) ? (w.dm==="half"?' '+dm[0]+'½('+dm.slice(1)+')':w.dm==="none"?'':' '+dm):'');
    h+='<div class="wrow'+(w.shield?' shield':'')+'"><div class="w-main">'+
      '<b class="w-nv">'+esc(w.n||"Оружие")+'</b>'+
      (w.ammoMax!=null?ammoCtl(ix,w):'')+'<span class="w-meta">'+esc(A.WTYPES[w.t]||"")+(w.hp!==""&&w.hp!=null?' · ОЗ '+esc(w.hp):'')+(w.len&&w.len!=="—"&&w.len!=="0"?' · '+esc(w.len):'')+(num(w.enc)?' · НГР '+esc(w.enc):'')+(w.notes?' · '+esc(w.notes):'')+'</span>'+
      '<details class="w-edit-d" data-wi="'+ix+'"'+(openW[ix]?' open':'')+'><summary>настроить</summary><div class="w-edit"><input class="w-name" data-bind="weapons.'+ix+'.n" data-rerender="1" value="'+esc(w.n)+'" aria-label="Название оружия" placeholder="название"><select data-bind="weapons.'+ix+'.sk" data-rerender="1" aria-label="Умение">'+'<option value="">— умение —</option>'+state.skills.filter(function(x){return x.c==="wpn";}).map(function(x){return '<option value="'+x.k+'"'+(x.k===w.sk?' selected':'')+'>'+esc(x.n)+'</option>';}).join('')+'</select>'+
      '<input data-bind="weapons.'+ix+'.dmg" data-rerender="1" value="'+esc(w.dmg)+'" aria-label="Урон" class="w-dmg">'+
      '<select data-bind="weapons.'+ix+'.t" data-rerender="1" aria-label="Тип">'+Object.keys(A.WTYPES).map(function(k){ return '<option value="'+k+'"'+(k===w.t?' selected':'')+'>'+A.WTYPES[k]+'</option>'; }).join('')+'</select>'+
      '<select data-bind="weapons.'+ix+'.dm" data-rerender="1" aria-label="Мод. урона"><option value="full"'+(w.dm==="full"?' selected':'')+'>+МУ</option><option value="half"'+(w.dm==="half"?' selected':'')+'>+½МУ</option><option value="none"'+(w.dm==="none"?' selected':'')+'>без МУ</option></select>'+
      '<input data-bind="weapons.'+ix+'.hp" value="'+esc(w.hp)+'" aria-label="ОЗ оружия" class="w-sm" placeholder="ОЗ">'+
      '<input data-bind="weapons.'+ix+'.enc" data-num="1" data-rerender="1" value="'+esc(w.enc)+'" aria-label="НГР" class="w-sm" placeholder="НГР">'+
      '<input data-bind="weapons.'+ix+'.notes" value="'+esc(w.notes)+'" aria-label="Заметка" placeholder="заметка">'+
      '<input data-bind="weapons.'+ix+'.ammoMax" data-num="1" data-rerender="1" value="'+esc(w.ammoMax==null?"":w.ammoMax)+'" aria-label="Боезапас: сколько помещается" class="w-sm" placeholder="колчан" title="Сколько стрел или камней помещается. Пусто — не считать">'+
      '<button type="button" class="x" data-del="weapons" data-i="'+ix+'" aria-label="Убрать">×</button></div></details></div>'+
      '<div class="w-num"><b>'+(pv===null?'—':pv+'%')+'</b><small>'+esc(s?s.n:'нет умения')+'</small></div><div class="w-dmgv">'+dmgTxt+'</div>'+
      '<div class="w-act"><button type="button" class="btn small" data-attack="'+ix+'">'+(w.shield?'Парировать':'Атака')+'</button><button type="button" class="btn ghost small" data-dmg="'+ix+'">Урон</button></div></div>';
  });
  h+='</div><div class="row-btns edit-only"><button type="button" class="btn ghost small" data-addweapon="1">+ Из каталога</button><button type="button" class="btn ghost small" data-addrow="weapons">+ Своё оружие</button></div>';
  h+='<p class="hint sm">Особый успех: колющее и рубящее — двойные кости оружия; дробящее — плюс максимум МУ. Критический — максимум особого урона и броня не считается. Метательное и стрелковое — половина МУ.</p>';
  /* armour */
  h+='<h3 class="mt">Броня</h3><div class="armour">';
  state.armour.forEach(function(a,ix){ h+='<div class="arow"><button type="button" class="tg sm'+(a.worn?' on':'')+'" data-worn="'+ix+'" aria-pressed="'+(!!a.worn)+'">'+(a.worn?'надето':'снято')+'</button><input data-bind="armour.'+ix+'.n" value="'+esc(a.n)+'" aria-label="Броня"><span class="a-locs">'+(a.locs||[]).map(function(k){return LOCN[k]?LOCN[k][1]:k;}).join(", ")+'</span><span class="a-ap">ОБ '+esc(a.ap)+'</span><span class="a-enc">НГР '+esc(a.enc)+'</span><button type="button" class="x" data-del="armour" data-i="'+ix+'" aria-label="Убрать">×</button></div>'; });
  h+='</div><div class="row-btns edit-only"><button type="button" class="btn ghost small" data-addarmour="1">+ Из каталога</button><button type="button" class="btn ghost small" data-starter="1">Стартовый набор</button></div>';
  return section("combat","Бой",h,'<span class="count">НГР '+encTotal()+' / '+encMax()+'</span>');
}

function renderSkills(){
  var h='<div class="cats">';
  A.CATS.forEach(function(c){ var k=c[0], m=catMod(k);
    var list = state.skills.filter(function(s){return s.c===k;}).sort(function(a,b){ return a.o-b.o; });
    h+='<div class="cat"><div class="cat-h"><h3>'+c[1]+'</h3><button type="button" class="cmod'+(m<0?' neg':'')+'" data-catinfo="'+k+'" title="Модификатор категории">'+pct(m)+'</button></div><ul class="sk-list">';
    list.forEach(function(s){ var ix=state.skills.indexOf(s), custom=!A.SKILLS.some(function(d){return d[0]===s.k;}), ed=custom||s.k==="craft"||/…/.test(s.n);
      h+='<li class="sk'+(num(s.v)===0?' zero':'')+'"><button type="button" class="xchk'+(s.x?' on':'')+'" data-xchk="skills.'+ix+'" aria-pressed="'+(!!s.x)+'" aria-label="Проверка опыта: '+esc(s.n)+'" title="Проверка опыта"></button>'+
        '<button type="button" class="sk-n'+(ed?' has-edit':'')+'" data-rollskill="'+ix+'">'+esc(s.n)+'</button>'+
        (ed?'<input class="sk-name" data-bind="skills.'+ix+'.n" value="'+esc(s.n)+'" aria-label="Название умения">':'')+
        '<button type="button" class="qstar edit-only'+(s.q?' on':'')+'" data-qstar="'+ix+'" aria-pressed="'+(!!s.q)+'" title="В быстрые броски боевого листа" aria-label="В быстрые броски: '+esc(s.n)+'">'+(s.q?'★':'☆')+'</button>'+
        '<span class="sk-b">'+(s.b==="dex2"?'ЛОВ×2':s.b==="dex3"?'ЛОВ×3':String(s.b).padStart(2,"0"))+'</span>'+
        '<input class="sk-v" type="number" inputmode="numeric" data-bind="skills.'+ix+'.v" data-num="1" data-rerender="1" value="'+esc(s.v)+'" aria-label="'+esc(s.n)+', %"><span class="sk-vv">'+num(s.v)+'</span>'+
        (custom?'<button type="button" class="x" data-del="skills" data-i="'+ix+'" aria-label="Убрать">×</button>':'')+'</li>'; });
    if (k==="myt") state.devotions.forEach(function(d,di){ h+='<li class="sk"><button type="button" class="xchk'+(d.x?' on':'')+'" data-xchk="devotions.'+di+'" aria-pressed="'+(!!d.x)+'" aria-label="Проверка опыта" title="Проверка опыта"></button><button type="button" class="sk-n" data-rollworship="'+di+'">Поклонение ('+esc(d.god||"…")+')</button><span class="sk-b">00</span><span class="sk-vv always">'+num(d.v)+'</span></li>'; });
    h+='</ul><button type="button" class="add-sk edit-only" data-addskill="'+k+'">+ умение</button></div>';
  });
  h+='</div>';
  var nx = state.skills.filter(function(s){return s.x;}).length + state.passions.filter(function(p){return p.x;}).length + state.devotions.filter(function(d){return d.x;}).length;
  h+='<div class="row-btns mt"><button type="button" class="btn" data-xp="1">Проверки опыта'+(nx?' ('+nx+')':'')+'</button><button type="button" class="btn ghost small edit-only" data-fillbase="1">Подставить базы + модификаторы</button></div>';
  h+='<p class="hint sm">Нажми на умение — откроется бросок. Квадратик слева — проверка опыта: на празднике бросок d100 + модификатор категории выше текущего значения даёт +1D6% (или +3%).</p>';
  return section("skills","Умения",h);
}

function renderPassions(){
  var h='<ul class="plist">';
  state.passions.forEach(function(p,ix){ h+='<li class="prow"><button type="button" class="xchk'+(p.x?' on':'')+'" data-xchk="passions.'+ix+'" aria-pressed="'+(!!p.x)+'" aria-label="Проверка опыта" title="Проверка опыта"></button><button type="button" class="sk-n has-edit" data-rollpassion="'+ix+'">'+esc(p.n||"Страсть")+'</button><input class="sk-name" data-bind="passions.'+ix+'.n" value="'+esc(p.n)+'" aria-label="Страсть" list="pass-list"><input class="sk-v" type="number" inputmode="numeric" data-bind="passions.'+ix+'.v" data-num="1" value="'+esc(p.v)+'" aria-label="%"><span class="sk-vv">'+num(p.v)+'</span><button type="button" class="x" data-del="passions" data-i="'+ix+'" aria-label="Убрать">×</button></li>'; });
  h+='</ul><datalist id="pass-list">'+A.PASSIONS.map(function(p){return '<option value="'+p+'">';}).join('')+'</datalist><div class="row-btns edit-only"><button type="button" class="btn ghost small" data-addrow="passions">+ Страсть</button></div>';
  h+='<p class="hint sm">Страсть усиливает другое действие: успех +20%, особый +30%, крит +50%, неудача −20%, провал −50%. Усилить бросок можно прямо в окне броска.</p>';
  return section("pass","Страсти",h);
}

function renderFaith(){
  var h='<div class="devs">';
  state.devotions.forEach(function(d,ix){ var mx=maxDP(d.v);
    h+='<div class="dev"><div class="dev-h"><select data-bind="devotions.'+ix+'.god" data-rerender="1" data-godsel="'+ix+'" aria-label="Бог"><option value="">— бог —</option>'+A.GODS.map(function(g){ return '<option'+(g[0]===d.god?' selected':'')+'>'+g[0]+'</option>'; }).join('')+(d.god&&!A.GODS.some(function(g){return g[0]===d.god;})?'<option selected>'+esc(d.god)+'</option>':'')+'</select><b class="dev-god">'+esc(d.god||"Бог")+'</b><button type="button" class="x" data-del="devotions" data-i="'+ix+'" aria-label="Убрать">×</button></div>'+
      '<p class="dev-id">'+esc(d.ideals||"")+'</p><div class="dev-row"><button type="button" class="xchk'+(d.x?' on':'')+'" data-xchk="devotions.'+ix+'" aria-pressed="'+(!!d.x)+'" aria-label="Проверка опыта" title="Проверка опыта"></button><button type="button" class="sk-n" data-rollworship="'+ix+'">Поклонение</button><input class="sk-v" type="number" inputmode="numeric" data-bind="devotions.'+ix+'.v" data-num="1" data-rerender="1" value="'+esc(d.v)+'" aria-label="Поклонение, %"><span class="sk-vv">'+num(d.v)+'%</span></div>'+
      '<div class="dev-dp"><span class="lbl">Очки поклонения</span>'+pips("devotions."+ix+".dp",num(d.dp),mx,3)+'<span class="dp-of">'+num(d.dp)+'/'+mx+'</span></div></div>'; });
  h+='</div><div class="row-btns edit-only"><button type="button" class="btn ghost small" data-adddev="1">+ Поклонение</button></div>';
  h+='<p class="hint sm">ОП тратятся в окне броска: 1 ОП — +20%, 2 — +30%, 3 — +50%, если дело угодно богу. Восстанавливаются броском Поклонения на жертвоприношении или празднике: успех +1, особый +2, крит +3. Максимум ОП: Поклонение 10–29% — 1, 30–59% — 2, 60%+ — 3.</p>';
  return section("faith","Вера",h);
}

function renderRunes(){
  var R=state.runes, rm=skillByKey("runes");
  var h='<p class="hint sm top0">Магия рун '+(rm?num(rm.v):0)+'%'+(rm&&num(rm.v)<25?' — нужно не меньше 25%, чтобы творить надписи.':'')+' Надпись: 3, 5, 7 или 9 рун, по 2 ОМ за руну; эффектов — 1, 2, 3 или 4. Вырезанная надпись держит ОМ в залоге до гальдура или рассвета.</p>';
  h+='<div class="aetts">';
  A.AETTS.forEach(function(a,ai){ h+='<div class="aett"><h3>'+a[0]+' <small>'+a[1]+'</small></h3><div class="rgrid">';
    A.RUNES.filter(function(r){return r.a===ai;}).forEach(function(r){ var kn=R.known.indexOf(r.k)>=0; h+='<button type="button" class="rune'+(kn?' kn':'')+'" data-rune="'+r.k+'"><span class="glyph">'+r.g+'</span><span class="rn">'+r.n+'</span></button>'; });
    h+='</div></div>'; });
  h+='</div><p class="hint sm">Известно рун: '+R.known.length+' из 24. Нажми на руну — значения, применения и эффекты.</p>';
  h+='<div class="h3row mt"><h3>Рунические надписи</h3><div class="row-btns"><button type="button" class="btn small" data-newscript="1">+ Надпись</button><button type="button" class="btn ghost small" data-dawn="1">Рассвет</button></div></div><div class="scripts">';
  if (!R.scripts.length) h+='<p class="hint sm">Пока нет надписей. Заготовь несколько заранее — в бою это сэкономит раунд.</p>';
  R.scripts.forEach(function(s,ix){ var cost=2*s.r.length, eff=(s.eff||[]).filter(function(e){return e>=0;}).length;
    h+='<article class="scr'+(s.state==="ready"?' ready':'')+'"><div class="scr-h"><b>'+esc(s.n||"Надпись")+'</b><span class="tag">'+(s.state==="ready"?'вырезана · '+cost+' ОМ в залоге':'не вырезана')+'</span><button type="button" class="x" data-del="runes.scripts" data-i="'+ix+'" aria-label="Удалить">×</button></div>'+
      '<div class="scr-g">'+s.r.map(function(k,ri){ var e=(s.eff||[])[ri]; return '<span class="sg'+(e>=0?' fx':'')+'" title="'+esc(RUNE[k].n+(e>=0?': '+RUNE[k].e[e]:''))+'">'+RUNE[k].g+'</span>'; }).join('')+'</div>'+
      '<p class="scr-m">'+s.r.length+' рун · '+cost+' ОМ · эффектов '+eff+' из '+((s.r.length-1)/2)+'</p>'+
      ((s.eff||[]).some(function(e){return e>=0;})?'<ul class="scr-fx">'+s.r.map(function(k,ri){ var e=(s.eff||[])[ri]; return e>=0?'<li><b>'+RUNE[k].n+':</b> '+esc(RUNE[k].e[e])+'</li>':''; }).join('')+'</ul>':'')+
      (s.galdur?'<p class="galdur">«'+esc(s.galdur)+'» <button type="button" class="chip sm" data-bigg="'+ix+'">крупно</button></p>':'')+
      '<div class="row-btns">'+(s.state==="ready"?'<button type="button" class="btn small" data-galdur="'+ix+'">Пропеть гальдур</button><button type="button" class="btn ghost small" data-unscript="'+ix+'">Уничтожить</button>':'<button type="button" class="btn small" data-carve="'+ix+'">Вырезать и окрасить ('+cost+' ОМ)</button>')+'<button type="button" class="btn ghost small" data-editscript="'+ix+'">Изменить</button></div></article>'; });
  h+='</div>';
  h+='<div class="h3row mt"><h3>Связующие руны</h3><button type="button" class="btn small edit-only" data-newbind="1">+ Связующая руна</button></div><div class="scripts">';
  if (!R.binds.length) h+='<p class="hint sm">Связующая руна вечна, пока цел предмет. Создание стоит постоянной ВОЛ: 1 за 3 руны, 2 за 5, 3 за 7, 4 за 9. Активация — 3 ОМ, действует до начала следующего хода.</p>';
  R.binds.forEach(function(b,ix){ h+='<article class="scr bind"><div class="scr-h"><b>'+esc(b.n||"Связующая руна")+'</b>'+(b.obj?'<span class="tag">'+esc(b.obj)+'</span>':'')+'<button type="button" class="x" data-del="runes.binds" data-i="'+ix+'" aria-label="Удалить">×</button></div>'+
    '<div class="scr-g">'+(b.r||[]).map(function(k){ return '<span class="sg'+((b.act||[]).indexOf(k)>=0?' fx':'')+'">'+RUNE[k].g+'</span>'; }).join('')+'</div>'+
    (b.eff?'<p class="scr-m">'+esc(b.eff)+'</p>':'')+'<div class="row-btns"><button type="button" class="btn small" data-bindact="'+ix+'">Активировать (3 ОМ)</button><button type="button" class="btn ghost small edit-only" data-editbind="'+ix+'">Изменить</button></div></article>'; });
  h+='</div>';
  return section("runes","Руны",h,'<span class="count">'+mpLockedRunes()+' ОМ в залоге</span>');
}

function seidUnit(){ var s=skillByKey("seidr"); return Math.floor((s?num(s.v):0)/10); }
function renderSeidr(){
  var S=state.seidr, sk=skillByKey("seidr");
  var h='<div class="seid-top"><label class="fld" for="f-focus"><span>Фокусная сфера</span><select id="f-focus" data-bind="seidr.focus" data-rerender="1"><option value="">— не выбрана —</option>'+Object.keys(A.REALMS).map(function(k){ return '<option value="'+k+'"'+(k===S.focus?' selected':'')+'>'+A.REALMS[k].n+'</option>'; }).join('')+'</select></label>'+
    '<p class="hint sm">Магия Сейд '+(sk?num(sk.v):0)+'%'+(sk&&num(sk.v)<25?' (нужно 25%+)':'')+' · единица Длительности = '+seidUnit()+' · вне фокуса −20% · ритуал 10 мин за каждое ОМ. В залоге остаётся ОМ по наивысшему уровню заклинания, пока оно действует.</p></div>';
  h+='<div class="realms">'+Object.keys(A.REALMS).map(function(k){ var R=A.REALMS[k]; return '<div class="realm'+(k===S.focus?' on':'')+'"><b>'+R.n+'</b><small>'+R.rite+'</small><small>Умения: '+R.skills+'</small></div>'; }).join('')+'</div>';
  h+='<div class="h3row mt"><h3>Заклинания</h3><div class="row-btns"><button type="button" class="btn small" data-newspell="1">+ Заклинание</button></div></div><div class="spells">';
  if (!S.spells.length) h+='<p class="hint sm">Добавь заклинание из примеров книги или своё.</p>';
  S.spells.forEach(function(sp,ix){ var cost=A.SEID_COST[num(sp.dur)]+A.SEID_COST[num(sp.dist)]+A.SEID_COST[num(sp.dim)], hi=Math.max(num(sp.dur),num(sp.dist),num(sp.dim)), off=S.focus&&sp.r&&sp.r!==S.focus;
    h+='<article class="scr spell'+(sp.active?' ready':'')+'"><div class="scr-h"><input class="sp-n" data-bind="seidr.spells.'+ix+'.n" value="'+esc(sp.n)+'" aria-label="Название"><b class="sp-nv">'+esc(sp.n||"Заклинание")+'</b><span class="tag">'+(A.REALMS[sp.r]?A.REALMS[sp.r].n:"—")+(off?' · −20%':'')+'</span>'+(sp.active?'<span class="tag on">действует · '+num(sp.lock)+' ОМ в залоге</span>':'')+'<button type="button" class="x" data-del="seidr.spells" data-i="'+ix+'" aria-label="Удалить">×</button></div>'+
      '<div class="sp-grid">'+spSel(ix,"r","Сфера",Object.keys(A.REALMS).map(function(k){return [k,A.REALMS[k].n];}),sp.r)+
      spSel(ix,"dur","Длительность",A.SEID_DUR.map(function(n,l){return [l,l+" · "+n+" ("+A.SEID_COST[l]+")"];}),sp.dur)+
      spSel(ix,"dist","Дистанция",A.SEID_DIST.map(function(n,l){return [l,l+" · "+n+" ("+A.SEID_COST[l]+")"];}),sp.dist)+
      spSel(ix,"dim","Измерение",A.SEID_DIM.map(function(n,l){return [l,l+" · "+n+" ("+A.SEID_COST[l]+")"];}),sp.dim)+'</div>'+
      '<p class="scr-m"><b>'+cost+' ОМ</b> · ритуал '+(cost*10)+' мин · длится '+(num(sp.dur)===0?'мгновенно':seidUnit()+' × '+A.SEID_DUR[num(sp.dur)].toLowerCase())+' · залог '+hi+' ОМ</p>'+
      (sp.t?'<p class="sp-t">'+esc(sp.t)+'</p>':'')+'<textarea class="sp-notes" data-bind="seidr.spells.'+ix+'.notes" rows="2" placeholder="Цель, детали ритуала…" aria-label="Заметки">'+esc(sp.notes||"")+'</textarea>'+
      '<div class="row-btns">'+(sp.active?'<button type="button" class="btn ghost small" data-dispel="'+ix+'">Развеять / истекло</button>':'<button type="button" class="btn small" data-cast="'+ix+'">Провести ритуал ('+cost+' ОМ)</button>')+'</div></article>'; });
  h+='</div>';
  return section("seidr","Сейд",h,'<span class="count">'+mpLockedSeid()+' ОМ в залоге</span>');
}
function spSel(ix,key,label,opts,val){ return '<label class="fld"><span>'+label+'</span><select data-bind="seidr.spells.'+ix+'.'+key+'" data-rerender="1"'+(key!=="r"?' data-num="1"':'')+'>'+opts.map(function(o){ return '<option value="'+o[0]+'"'+(String(o[0])===String(val)?' selected':'')+'>'+esc(o[1])+'</option>'; }).join('')+'</select></label>'; }

function renderGear(){
  var h='<div class="gtab"><div class="grow head"><span>Предмет</span><span>Кол.</span><span>НГР</span><span>Заметки</span><span></span></div>';
  state.gear.forEach(function(g,ix){ h+='<div class="grow"><input data-bind="gear.'+ix+'.n" value="'+esc(g.n)+'" aria-label="Предмет"><input data-bind="gear.'+ix+'.q" data-num="1" data-rerender="1" type="number" inputmode="numeric" value="'+esc(g.q)+'" aria-label="Количество"><input data-bind="gear.'+ix+'.enc" data-num="1" data-rerender="1" inputmode="decimal" value="'+esc(g.enc)+'" aria-label="НГР"><input data-bind="gear.'+ix+'.notes" value="'+esc(g.notes)+'" aria-label="Заметки"><button type="button" class="x" data-del="gear" data-i="'+ix+'" aria-label="Убрать">×</button></div>'; });
  h+='</div><div class="row-btns edit-only"><button type="button" class="btn ghost small" data-addrow="gear">+ Предмет</button></div>';
  var et=encTotal(), em=encMax();
  h+='<p class="enc'+(et>em?' over':'')+'">Нагрузка: <b>'+et+'</b> из '+em+' (оружие, надетая броня и вещи)'+(et>em?' — перегруз, договорись с ведущим о штрафах':'')+'</p>';
  h+=field("Богатство: серебро, вадмаль, скот на продажу, сокровища","wealth",{area:1,rows:3});
  return section("gear","Снаряжение и богатство",h);
}
function renderFamily(){
  var h='<div class="fields wide2">'+field("Супруг(а)","family.spouse")+field("Дети","family.children")+field("Братья, сёстры, родня","family.kin",{wide:1})+
    field("Предки и история рода","family.ancestry",{area:1,rows:4})+'</div><h3 class="mt">Хутор</h3><div class="fields wide2">'+
    field("Хутор","family.farm",{wide:1})+field("Коровы","family.cattle")+field("Овцы","family.sheep")+field("Лошади","family.horses")+field("Рабы","family.thralls")+
    field("Хозяйство: постройки, люди, урожай","family.farmnotes",{area:1,rows:3})+'</div>';
  return section("family","Род и хутор",h);
}
function renderNotes(){
  var tabs={saga:"Сага героя", npc:"Люди", misc:"Прочее", xplog:"Журнал опыта"};
  var h='<div class="tabs" role="tablist">'; Object.keys(tabs).forEach(function(k){ h+='<button type="button" role="tab" aria-selected="'+(k===noteTab)+'" class="tab'+(k===noteTab?' on':'')+'" data-tab="'+k+'">'+tabs[k]+'</button>'; });
  h+='</div><textarea id="note-'+noteTab+'" class="notes" data-bind="notes.'+noteTab+'" rows="10" aria-label="Записи">'+esc(state.notes[noteTab])+'</textarea>';
  return section("notes","Записи",h);
}

var LOCK_OK = {ammo:1,bigg:1,free:1,artzoom:1,toggle:1,info:1,go:1,rollchar:1,rollskill:1,rollpassion:1,rollworship:1,rollraw:1,attack:1,dmg:1,loc:1,rollloc:1,hp:1,hpdlg:1,mp:1,mprest:1,mpfull:1,pip:1,xchk:1,xp:1,tab:1,rune:1,galdur:1,carve:1,unscript:1,dawn:1,bindact:1,cast:1,dispel:1,catinfo:1,healweek:1,healall:1,newscript:1,editscript:1,newspell:1};
function applyLock(){
  var L=!!state.locked, btn=document.getElementById("btn-lock");
  document.body.classList.toggle("locked", L);
  if (btn){ btn.textContent = L?"Игра":"Правка"; btn.setAttribute("aria-pressed",String(L)); btn.title = L?"Лист закрыт от случайных правок. Нажми, чтобы редактировать":"Закрыть лист для игры: останутся броски, урон, ОМ, ОП и проверки опыта"; }
  app.querySelectorAll("input,select,textarea").forEach(function(el){ if (el.closest(".always-on")) return; if (el.tagName==="TEXTAREA" && /^note-/.test(el.id)) { el.readOnly=false; return; } if (el.tagName==="TEXTAREA") el.readOnly=L; else el.disabled=L; });
}
function render(){
  var y = window.scrollY;
  var h = renderHero()+renderCombat()+renderSkills()+renderPassions()+renderFaith();
  if (state.info.runes) h+=renderRunes();
  if (state.info.seidr) h+=renderSeidr();
  h += renderGear()+renderFamily()+renderNotes();
  app.innerHTML = h;
  document.getElementById("hdr-name").textContent = state.info.name || "Новый герой";
  document.getElementById("vitals").innerHTML = vitalsHtml();
  document.getElementById("qnav").innerHTML = SECS.filter(function(s){ return (s[0]!=="runes"||state.info.runes)&&(s[0]!=="seidr"||state.info.seidr); }).map(function(s){ return '<button type="button" data-go="'+s[0]+'"><i aria-hidden="true">'+(QGLYPH[s[0]]||'ᛜ')+'</i><span>'+s[1]+'</span></button>'; }).join('');
  applyLock();
  renderCombatView();
  renderBookView();
  applyMode();
  window.scrollTo(0,y);
  topH(); spy();
}
function refreshVitals(){ document.getElementById("vitals").innerHTML = vitalsHtml(); }

/* ---------- toast ---------- */
var toastEl=document.getElementById("toast"), toastT=null;
function toast(html){ toastEl.innerHTML=html; toastEl.hidden=false; clearTimeout(toastT); toastT=setTimeout(function(){ toastEl.hidden=true; }, 3200); }

/* ---------- modal ---------- */
var modal=document.getElementById("modal"), mBody=document.getElementById("m-body");
function openModal(html){ mBody.innerHTML=html; modal.hidden=false; var f=mBody.querySelector("input:not([type=checkbox]),select"); if (f && !/^(m-search)$/.test(f.id)) {} }
function closeModal(){ modal.hidden=true; mBody.innerHTML=""; if (endRun){ endRun=null; xpRun=null; } }
function pickerHtml(title,items,attr){ return '<h2>'+title+'</h2><input class="search" id="m-search" placeholder="Поиск…" aria-label="Поиск"><ul class="pick-list">'+items.map(function(it){ return '<li data-name="'+esc(it.label.toLowerCase())+'"><button type="button" '+attr+'="'+esc(it.val)+'"><b>'+esc(it.label)+'</b><small>'+esc(it.sub||'')+'</small>'+(it.text?'<span>'+esc(it.text)+'</span>':'')+'</button></li>'; }).join('')+'</ul>'; }

function infoHtml(key){
  if (key==="personality"){ return '<h2>Тип личности и дух-зверь</h2>'+Object.keys(A.PERSONALITY).map(function(k){ var p=A.PERSONALITY[k]; return '<p><b>'+p.n+'</b> — +20% к модификатору: '+p.cats.map(function(c){return CATN[c];}).join(", ")+'<br>'+esc(p.t)+'<br><small>'+p.animals.join(", ")+'</small></p>'; }).join('')+'<p class="hint">Дух-зверя видно броском Ясновидения. Модификатор Манипуляции действует и на Оружие.</p>'; }
  return "";
}
function catInfoHtml(c){
  var cc=c==="wpn"?"man":c, a=catAuto(c), s=catSpirit(c), j=catAdj(c);
  return '<h2>'+CATN[c]+' <small>модификатор категории '+pct(catMod(c))+'</small></h2>'+
    '<div class="brk"><div><span>По характеристикам</span><b>'+pct(a)+'</b></div><div><span>Дух-зверь</span><b>'+pct(s)+'</b></div><div><span>Ручная поправка</span><b>'+pct(j)+'</b></div></div>'+
    '<p>'+esc(A.CAT_HINT[c])+'</p>'+
    (c==="wpn"?'<p class="hint">Оружие берёт модификатор Манипуляции — поправка задаётся там.</p>':'<div class="row-btns"><button type="button" class="btn ghost small" data-catadj="'+cc+'" data-d="-5">−5%</button><button type="button" class="btn ghost small" data-catadj="'+cc+'" data-d="5">+5%</button><button type="button" class="btn ghost small" data-catadj="'+cc+'" data-d="0">Сбросить</button></div><p class="hint">Поправка нужна, если у героя в книге или у ведущего модификатор посчитан иначе (у готовых героев корбука встречаются расхождения с таблицей).</p>');
}
function runeHtml(k){
  var r=RUNE[k], kn=state.runes.known.indexOf(k)>=0;
  return '<h2><span class="glyph big">'+r.g+'</span> '+r.n+' <small>'+r.o+' · '+A.AETTS[r.a][0]+'</small></h2><p><b>Значение:</b> '+esc(r.m)+'</p><p><b>Сферы силы:</b> '+esc(r.p)+'</p>'+
    '<h3>Применения</h3><ul class="dash">'+r.u.map(function(x){return '<li>'+esc(x)+'</li>';}).join('')+'</ul><h3>Эффекты</h3><ul class="dash">'+r.e.map(function(x){return '<li>'+esc(x)+'</li>';}).join('')+'</ul>'+
    '<p class="hint">'+esc(A.RUNE_LIMITS)+'</p><div class="row-btns edit-only-m"><button type="button" class="btn'+(kn?' ghost':'')+' small" data-knowrune="'+k+'">'+(kn?'Забыть руну':'Герой знает эту руну')+'</button></div>';
}

/* script builder */
var draft=null;
function scriptHtml(){
  var d=draft, known=state.runes.known.slice().sort(function(a,b){ return A.RUNES.indexOf(RUNE[a])-A.RUNES.indexOf(RUNE[b]); });
  var n=d.r.length, ok=n>=3&&n<=9&&n%2===1, maxE=ok?(n-1)/2:Math.max(0,Math.floor((n-1)/2)), eff=d.eff.filter(function(e){return e>=0;}).length;
  var h='<h2>'+(d.bind?'Связующая руна':'Руническая надпись')+'</h2><label class="fld"><span>Название</span><input id="d-n" value="'+esc(d.n)+'" placeholder="'+(d.bind?'Кольцо меткости':'Оберег в дорогу')+'"></label>'+
    (d.bind?'<label class="fld"><span>Предмет</span><input id="d-obj" value="'+esc(d.obj||"")+'" placeholder="железное кольцо, амулет, меч…"></label>':'<label class="fld"><span>Гальдур</span><textarea id="d-g" rows="2" placeholder="Кого, что и на какую сцену — с именами, не местоимениями">'+esc(d.galdur||"")+'</textarea></label>')+
    '<h3 class="mt">Руны надписи <small>'+n+' · '+(ok?(d.bind?(n-1)/2+' ВОЛ навсегда':(2*n)+' ОМ'):'нужно 3, 5, 7 или 9')+'</small></h3>';
  h+='<div class="seq">'+(n?d.r.map(function(k,i){ var r=RUNE[k]; return '<div class="seq-i"><button type="button" class="sg big" data-drm="'+i+'" title="Убрать">'+r.g+'</button><span>'+r.n+'</span>'+
    (d.bind?'<label class="chk"><input type="checkbox" data-dact="'+i+'"'+(d.eff[i]>=0?' checked':'')+'> активна</label>':
    '<select data-deff="'+i+'" aria-label="Эффект руны"><option value="-1">применение</option>'+r.e.map(function(e,ei){ return '<option value="'+ei+'"'+(d.eff[i]===ei?' selected':'')+'>'+esc(e)+'</option>'; }).join('')+'</select>')+'</div>'; }).join(''):'<p class="hint sm">Нажимай на руны ниже, чтобы добавить. Одну руну можно взять несколько раз.</p>')+'</div>';
  h+='<p class="'+(eff>maxE?'warnline':'hint sm')+'">'+(d.bind?'Активных':'Эффектов')+' '+eff+' из '+maxE+'</p>';
  h+='<div class="rgrid pick">'+(known.length?known:A.RUNES.map(function(r){return r.k;})).map(function(k){ var r=RUNE[k]; return '<button type="button" class="rune'+(state.runes.known.indexOf(k)>=0?' kn':'')+'" data-dadd="'+k+'"><span class="glyph">'+r.g+'</span><span class="rn">'+r.n+'</span></button>'; }).join('')+'</div>'+
    (known.length?'':'<p class="hint sm">Герой пока не знает ни одной руны — показан весь футарк. Отметь известные руны в разделе.</p>');
  if (d.bind) h+='<label class="fld"><span>Эффект</span><input id="d-eff" value="'+esc(d.effTxt||"")+'" list="bind-list" placeholder="+20% к Луку"></label><datalist id="bind-list">'+A.BIND_EFFECTS.map(function(e){return '<option value="'+esc(e)+'">';}).join('')+'</datalist><p class="hint sm">Эффекты активной руны: '+A.BIND_EFFECTS.join("; ")+'. Создание: «Выйти за завесу» на столько дней, сколько рун, затем бросок Магии рун и Ремесла.</p>';
  h+='<div class="row-btns mt"><button type="button" class="btn" data-dsave="1"'+(ok&&eff<=maxE?'':' disabled')+'>Сохранить</button><button type="button" class="btn ghost" data-close="1">Отмена</button></div>';
  return h;
}
function readDraftInputs(){ var n=document.getElementById("d-n"); if(n) draft.n=n.value; var g=document.getElementById("d-g"); if(g) draft.galdur=g.value; var o=document.getElementById("d-obj"); if(o) draft.obj=o.value; var e=document.getElementById("d-eff"); if(e) draft.effTxt=e.value; }

/* experience */
var xpRun=null;
function xpList(){
  var L=[];
  state.skills.forEach(function(s,ix){ if (s.x) L.push({kind:"skills",i:ix,n:s.n,v:num(s.v),mod:catMod(s.c)}); });
  state.devotions.forEach(function(d,ix){ if (d.x) L.push({kind:"devotions",i:ix,n:"Поклонение ("+(d.god||"…")+")",v:num(d.v),mod:catMod("myt")}); });
  state.passions.forEach(function(p,ix){ if (p.x) L.push({kind:"passions",i:ix,n:p.n,v:num(p.v),mod:0}); });
  return L;
}
function xpHtml(){
  var L=xpRun?xpRun.list:xpList();
  if (!L.length) return '<h2>Проверки опыта</h2><p>Отметок пока нет. Квадратик рядом с умением, страстью или Поклонением ставится, когда ведущий разрешает проверку после успеха в напряжённой ситуации.</p><p class="hint">Раз в сезон, на празднике, можно добавить ещё до трёх проверок умениям родины.</p>';
  var h='<h2>Проверки опыта <small>d100 + модификатор категории &gt; текущее значение (100+ — всегда успех)</small></h2><div class="xpl">';
  L.forEach(function(x,j){ h+='<div class="xpr'+(x.res?(x.res.ok?' ok':' no'):'')+'"><span class="xpn">'+esc(x.n)+' <small>'+x.v+'%'+(x.mod?' · мод. '+pct(x.mod):'')+'</small></span>'+
    (x.res?'<span class="xpres">'+x.res.roll+(x.mod?' '+sgn(x.mod)+' = '+(x.res.roll+x.mod):'')+' → '+(x.res.ok?'<b>+'+x.res.gain+'%</b>':'без роста')+'</span>':
    '<span class="xpm"><button type="button" class="tg sm'+(x.safe?'':' on')+'" data-xpmode="'+j+'" data-m="d6">+1D6</button><button type="button" class="tg sm'+(x.safe?' on':'')+'" data-xpmode="'+j+'" data-m="3">+3</button></span>')+'</div>'; });
  h+='</div><div class="row-btns mt">'+(xpRun&&xpRun.done?'<button type="button" class="btn" data-xpapply="1">Записать и снять отметки</button>':'<button type="button" class="btn" data-xproll="1">Бросить все</button>')+'<button type="button" class="btn ghost" data-close="1">Закрыть</button></div><p class="hint">+3 выбирается до броска, если не хочется рисковать на 1D6.</p>';
  return h;
}

/* ---------- roll sheet ---------- */
var sheet=document.getElementById("sheet"), sBody=document.getElementById("s-body");
var rs=null;
function openRoll(o){
  rs = Object.assign({mods:0, half:false, mult:5, resist:"", dpDev:-1, dpN:0, aug:0, augN:"", res:null, extra:"", ct:"cut", own:""}, o);
  renderRoll(); sheet.hidden=false; document.body.classList.add("sheet-open");
}
function closeRoll(){ sheet.hidden=true; rs=null; document.body.classList.remove("sheet-open"); if (mode==="combat") renderCombatView(); if (mode==="book") renderBookView(); }
function baseTarget(){
  if (rs.kind==="char"){ var v=C(rs.ref); if (rs.resist!=="" && rs.resist!=null) return Math.max(0, 50+5*(v-num(rs.resist))); return Math.floor(v*rs.mult); }
  return num(rs.base());
}
function dpBonus(){ return rs.dpN===1?20:rs.dpN===2?30:rs.dpN===3?50:0; }
function target(){ var t=baseTarget(); if (rs.half) t=Math.ceil(t/2); return Math.max(0, t+num(rs.mods)+dpBonus()+num(rs.aug)); }
function renderRoll(){
  if (rs.direct){ sBody.innerHTML='<div class="rs-h"><div><span class="eyebrow">'+esc(rs.sub)+'</span><h2>'+esc(rs.title)+'</h2></div></div><div class="rs-out" id="rs-out">'+resultHtml()+'</div>'; return; }
  var t=target(), h='<div class="rs-h"><div><span class="eyebrow">'+esc(rs.sub||"Бросок d100")+'</span><h2>'+esc(rs.title)+'</h2></div><div class="rs-t"><b>'+t+'%</b><small>'+thrLine(t)+'</small></div></div>';
  if (rs.kind==="free"){ h+='<label class="inl">Шанс успеха <input id="rs-base" type="number" inputmode="numeric" value="'+esc(rs.freeBase)+'"> %</label>'; }
  if (rs.kind==="char"){ h+='<div class="chips">'+A.MULTS.map(function(m){ return '<button type="button" class="chip'+(rs.mult===m[0]&&(rs.resist===""||rs.resist==null)?' on':'')+'" data-rmult="'+m[0]+'">'+m[1]+'</button>'; }).join('')+'</div>'+
    '<label class="inl">Сопротивление: против <input id="rs-resist" type="number" inputmode="numeric" value="'+esc(rs.resist)+'" placeholder="—"> <small>50% + (мой − его)×5</small></label>'; }
  h+='<div class="chips mods">'+[-40,-20,-10,10,20,30,50].map(function(m){ return '<button type="button" class="chip" data-rmod="'+m+'">'+(m>0?'+':'−')+Math.abs(m)+'</button>'; }).join('')+'<button type="button" class="chip'+(rs.half?' on':'')+'" data-rhalf="1">½</button><span class="modv">поправка <b>'+pct(num(rs.mods))+'</b>'+(num(rs.mods)?' <button type="button" class="chip sm" data-rmod="0">сброс</button>':'')+'</span></div>';
  /* gods and passions */
  var devs=state.devotions.map(function(d,i){return {d:d,i:i};}).filter(function(x){return num(x.d.dp)>0;});
  if (devs.length || state.passions.length){
    h+='<details class="aid"'+(rs.aidOpen||rs.dpN||rs.augN?' open':'')+'><summary>Помощь богов и страсти</summary>';
    if (devs.length) h+='<div class="aid-row"><span class="lbl">Очки поклонения</span><select id="rs-dev" aria-label="Бог">'+devs.map(function(x){ return '<option value="'+x.i+'"'+(rs.dpDev===x.i?' selected':'')+'>'+esc(x.d.god)+' — '+num(x.d.dp)+' ОП</option>'; }).join('')+'</select>'+[1,2,3].map(function(n){ return '<button type="button" class="chip'+(rs.dpN===n?' on':'')+'" data-rdp="'+n+'">'+n+' ОП +'+(n===1?20:n===2?30:50)+'%</button>'; }).join('')+'</div>';
    h+='<div class="aid-row"><span class="lbl">Усиление</span><select id="rs-aug" aria-label="Чем усилить"><optgroup label="Страсти">'+state.passions.map(function(p,i){ return '<option value="p'+i+'">'+esc(p.n)+' '+num(p.v)+'%</option>'; }).join('')+'</optgroup><optgroup label="Умения">'+state.skills.filter(function(s){return num(s.v)>0;}).map(function(s){ return '<option value="s'+state.skills.indexOf(s)+'">'+esc(s.n)+' '+num(s.v)+'%</option>'; }).join('')+'</optgroup></select><button type="button" class="chip" data-raug="1">Бросить усиление</button>'+(rs.augN?'<span class="modv">'+esc(rs.augN)+': <b>'+pct(rs.aug)+'</b></span>':'')+'</div>';
    h+='</details>';
  }
  if (rs.kind==="script"){ var gsc=state.runes.scripts[rs.ref]; if (gsc && gsc.galdur) h+='<button type="button" class="gal-btn" data-bigg="'+rs.ref+'"><span class="glyph">'+gsc.r.map(function(k){return RUNE[k].g;}).join('')+'</span><span class="gal-q">«'+esc(gsc.galdur.length>90?gsc.galdur.slice(0,88)+'…':gsc.galdur)+'»</span><b>читать крупно</b></button>'; }
  if (rs.kind==="weapon"){ var rw=state.weapons[rs.ref]; if (rw && rw.ammoMax!=null) h+='<p class="ammo-line'+(num(rw.ammo)===0?' empty':'')+'">'+(num(rw.ammo)===0?'Колчан пуст — ':'')+ammoWord(rw,true)+': <b>'+num(rw.ammo)+'</b> из '+rw.ammoMax+' · каждый бросок атаки тратит одну</p>'; }
  h+='<div class="rs-go"><button type="button" class="btn big" data-rgo="1">Бросить d100</button><label class="inl own">или свой бросок <input id="rs-own" type="number" inputmode="numeric" min="1" max="100" value="'+esc(rs.own)+'" placeholder="1–100"></label><button type="button" class="btn ghost" data-rown="1">Оценить</button></div>';
  h+='<div class="rs-out" id="rs-out">'+resultHtml()+'</div>';
  sBody.innerHTML=h;
}
function resultHtml(){
  if (!rs.res) return '';
  var r=rs.res, L=LEVELS[r.level];
  var h = r.direct ? '<div class="chips">'+["succ","spec","crit"].map(function(l){ return '<button type="button" class="chip'+(r.level===l?' on':'')+'" data-dlev="'+l+'">'+LEVELS[l][0]+'</button>'; }).join('')+'</div>' :
    '<div class="res '+L[1]+'"><span class="die100">'+(r.roll===100?'00':r.roll)+'</span><div><b>'+L[0]+'</b><small>против '+r.t+'%'+(r.note?' · '+esc(r.note):'')+'</small></div></div>';
  var acts='';
  if (isSuccess(r.level) && rs.xpPath){ var on=!!getPath(state, rs.xpPath+".x"); acts+='<button type="button" class="btn small'+(on?'':' ghost')+'" data-rxp="1">'+(on?'✓ Опыт отмечен':'Отметить опыт')+'</button>'; }
  if (!isSuccess(r.level) && C("pow")>0 && !r.wyrd){ acts+='<button type="button" class="btn small ghost" data-wyrd="succ" title="Тратит 1 ВОЛ навсегда">Вирд: успех (−1 ВОЛ)</button><button type="button" class="btn small ghost" data-wyrd="reroll" title="В бою, раз в день, тратит 1 ВОЛ навсегда">Вирд в бою: переброс</button>'; }
  if (rs.kind==="weapon" && isSuccess(r.level)){ var w=state.weapons[rs.ref]; if (w && w.t==="CT") acts+='<span class="seg"><button type="button" class="chip'+(rs.ct==="cut"?' on':'')+'" data-ct="cut">рубит</button><button type="button" class="chip'+(rs.ct==="thrust"?' on':'')+'" data-ct="thrust">колет</button></span>'; acts+='<button type="button" class="btn small" data-rdmg="1">Урон'+(r.level!=="succ"?' ('+(r.level==="crit"?'крит':'особый')+')':'')+'</button><button type="button" class="btn small ghost" data-rloc="1">Зона d20</button>'; }
  if (rs.kind==="worship" && isSuccess(r.level) && !r.applied){ var gain=r.level==="crit"?3:r.level==="spec"?2:1; acts+='<button type="button" class="btn small" data-rrestore="'+gain+'">Обряд: +'+gain+' ОП</button>'; }
  if (acts) h+='<div class="row-btns">'+acts+'</div>';
  if (rs.extra) h+='<div class="extra">'+rs.extra+'</div>';
  return h;
}
function doRoll(own){
  var t=target(), roll = own || rnd(100), lvl=resolve(t,roll);
  if (rs.dpN && rs.dpDev>=0){ var dv=state.devotions[rs.dpDev]; if (dv){ dv.dp=Math.max(0,num(dv.dp)-rs.dpN); } }
  rs.res={roll:roll, t:t, level:lvl, note:(rs.dpN?rs.dpN+' ОП потрачено':'')}; rs.extra=""; rs.own="";
  if (rs.kind==="weapon"){ var aw=state.weapons[rs.ref]; if (aw && aw.ammoMax!=null){ var was=num(aw.ammo); aw.ammo=Math.max(0,was-1); rs.res.note=(rs.res.note?rs.res.note+' · ':'')+(was>0?ammoWord(aw)+' −1, осталось '+aw.ammo:'колчан был пуст!'); if (aw.ammo===0 && was>0) toast('Последн'+(aw.sk==="sling"?'ий камень':'яя стрела')+' — колчан пуст'); } }
  state.lastRoll={title:rs.title, roll:roll, t:t, level:lvl, dmg:"", dmgNote:""};
  var used=rs.dpN; rs.dpN=0;
  afterRoll();
  renderRoll(); changed(false); if (used) render();
}
function afterRoll(){
  var r=rs.res;
  if (rs.kind==="script"){ var s=state.runes.scripts[rs.ref]; if (!s) return;
    var cost=2*s.r.length;
    if (isSuccess(r.level) || r.level==="fumb"){ s.state="plan"; state.mp.spent=num(state.mp.spent)+cost; rs.extra = r.level==="crit"?'Надпись действует вдвое сильнее (урон удваивается, длительность можно продлить). '+cost+' ОМ потрачено.':r.level==="spec"?'Надпись действует в 1,5 раза сильнее. '+cost+' ОМ потрачено.':r.level==="succ"?'Надпись действует как задумано. '+cost+' ОМ потрачено.':'Магия проявилась, но извращённо: ведущий обращает значение одной из рун. '+cost+' ОМ потрачено.'; }
    else rs.extra='Ошибка в гальдуре: магия не проявилась. ОМ остаются в залоге в вырезанных рунах — можно петь снова в следующем раунде.';
    render();
  }
  if (rs.kind==="seidr"){ var sp=state.seidr.spells[rs.ref]; if (!sp) return; var hi=Math.max(num(sp.dur),num(sp.dist),num(sp.dim));
    if (isSuccess(r.level)){ sp.active=true; sp.lock=hi; rs.extra = r.level==="crit"?'Можно поднять любой элемент на 3 уровня (до 6). Залог считается по итоговому наивысшему уровню — поправь его в заклинании.':r.level==="spec"?'Измерение можно поднять на 1 уровень (до 6).':'Заклинание действует как задумано. В залоге '+hi+' ОМ, пока оно длится.'; }
    else if (r.level==="fumb") rs.extra='Силы вырвались из-под контроля и действуют наоборот. ОМ потрачены.';
    else rs.extra='Ритуал не удался. ОМ потрачены, повторить можно завтра.';
    render();
  }
}
function rollDamage(){
  var w=state.weapons[rs.ref], lvl=rs.res?rs.res.level:"succ"; if (!w) return;
  var d=parseDice(w.dmg); if (!d){ rs.extra='Урон «'+esc(w.dmg)+'» не бросается автоматически — смотри правила (захват и т. п.).'; renderRoll(); return; }
  var dmS=dmString(), dmd=dmS==="0"?null:parseDice(dmS), useDm=w.dm!=="none"&&dmd, half=w.dm==="half";
  var type=w.t==="CT"?(rs.ct==="thrust"?"I":"S"):w.t, crushing=(type==="C"||type==="H");
  var parts=[], total=0, wr, note="";
  if (lvl==="crit"){ if (crushing){ total+=maxDice(d); parts.push('макс. оружие '+maxDice(d)); } else { total+=maxDice(d,2); parts.push('макс. ×2 оружие '+maxDice(d,2)); } note='Броня не считается.'; }
  else if (lvl==="spec" && !crushing){ wr=rollDice(d,2); total+=wr.total; parts.push('оружие ×2: '+wr.faces.join(" ")+(d.k?' '+sgn(d.k*2):'')+' = '+wr.total); note=type==="I"?'Колющее: оружие застряло в теле, вытащить — бросок ½ умения.':'Рубящее: если ОЗ зоны превышены, цель бросает (ВЫН − урон)×5, чтобы не потерять сознание.'; }
  else { wr=rollDice(d); total+=wr.total; parts.push('оружие: '+wr.faces.join(" ")+(d.k?' '+sgn(d.k):'')+' = '+wr.total); }
  if (useDm){ var dr=rollDice(dmd), dv=dr.total; if (half) dv = dv<0?-Math.ceil(-dv/2):Math.ceil(dv/2); total+=dv; parts.push((half?'½':'')+'МУ '+dmS+': '+dr.faces.join(" ")+' → '+sgn(dv));
    if ((lvl==="spec"||lvl==="crit") && crushing && maxDice(dmd)>0){ var mx=maxDice(dmd); if (half) mx=Math.ceil(mx/2); total+=mx; parts.push('макс. МУ +'+mx); if (lvl==="spec") note='Дробящее: добавлен максимум МУ.'; } }
  total=Math.max(0,total);
  if (state.lastRoll && !(rs.res&&rs.res.direct)) { state.lastRoll.dmg=total; state.lastRoll.dmgNote=(lvl!=="succ"?LEVELS[lvl][0].toLowerCase()+' · ':'')+(A.WTYPES[type]||""); } else state.lastRoll={title:w.n, roll:0, t:0, level:lvl, dmg:total, dmgNote:"урон без броска"};
  changed(false);
  rs.extra='<div class="dmg"><b>'+total+'</b><span>урона'+(lvl!=="succ"?' · '+LEVELS[lvl][0].toLowerCase():'')+'</span></div><p class="hint sm">'+parts.join(' · ')+'</p>'+(note?'<p class="hint sm">'+note+'</p>':'');
  renderRoll();
}
function rollLocation(){ var r=rnd(20), k=A.LOCS.filter(function(l){ return r>=l[5][0]&&r<=l[5][1]; })[0][0]; hiLoc=k; return {r:r,k:k}; }

/* damage dialog */
function dmgDlg(k){
  var l=LOCN[k], mx=locMax(k), cur=locCur(k), ap=locAP(k);
  return '<h2>'+l[1]+' <small>d20 '+l[2]+' · ОЗ '+cur+' из '+mx+' · ОБ '+ap+'</small></h2>'+
    '<div class="dlg-row"><label class="fld"><span>Урон</span><input id="dd-v" type="number" inputmode="numeric" min="0" placeholder="0"></label><label class="chk"><input type="checkbox" id="dd-ap" checked> вычесть броню ('+ap+')</label><button type="button" class="btn warn" data-dodmg="'+k+'">Получить урон</button></div>'+
    '<div class="dlg-row"><label class="fld"><span>Лечение</span><input id="dd-h" type="number" inputmode="numeric" min="0" placeholder="0"></label><button type="button" class="btn" data-doheal="'+k+'">Вылечить</button></div>'+
    '<div class="dlg-row edit-only-m"><span class="lbl">Поправки зоны</span><span class="bonus">ОЗ <button type="button" class="pm" data-locadj="'+k+'" data-what="locAdj" data-d="-1">−</button> '+num(state.hp.locAdj[k])+' <button type="button" class="pm" data-locadj="'+k+'" data-what="locAdj" data-d="1">+</button></span><span class="bonus">ОБ <button type="button" class="pm" data-locadj="'+k+'" data-what="apAdj" data-d="-1">−</button> '+num(state.hp.apAdj[k])+' <button type="button" class="pm" data-locadj="'+k+'" data-what="apAdj" data-d="1">+</button></span></div>'+
    (cur<=0?'<p class="warnline">'+esc(A.LOC_DOWN[k])+'</p>':'')+'<div id="dd-out"></div>';
}
function applyDamage(k,raw,useAP){
  var l=LOCN[k], mx=locMax(k), ap=useAP?locAP(k):0, eff=Math.max(0,raw-ap), msgs=[];
  if (!eff){ return '<p>Броня ('+ap+') поглотила весь урон.</p>'; }
  var toTotal = l[4]==="limb" ? Math.min(eff, 2*mx) : eff;
  state.hp.loc[k]=num(state.hp.loc[k])+eff; state.hp.lost=num(state.hp.lost)+toTotal;
  msgs.push('<b>'+eff+'</b> урона в зону «'+l[1]+'»'+(ap?' (броня поглотила '+ap+')':'')+(toTotal<eff?', в общие ОЗ — '+toTotal+' (предел конечности)':'')+'.');
  if (eff>=3*mx) msgs.push(l[4]==="limb"?'<b>Конечность отсечена или искалечена навсегда.</b> Герой выведен из боя.':'<b>Мгновенная смерть.</b> Тройной урон по зоне за один удар.');
  else if (eff>=2*mx) msgs.push(l[4]==="limb"?'Двойной урон по конечности: герой в шоке и не может сражаться, пока не вылечат. Лечить себя может.':'Двойной урон: герой без сознания, падает и теряет 1 ОЗ за раунд, пока не помогут.');
  else if (locCur(k)<=0) msgs.push(esc(A.LOC_DOWN[k]));
  var hc=hpCur(); if (hc<=0) msgs.push('<b>ОЗ '+hc+':</b> смерть в конце раунда, если не вернуть к положительным ОЗ.'); else if (hc<=2) msgs.push('<b>ОЗ '+hc+':</b> без сознания.');
  return msgs.map(function(m){ return '<p>'+m+'</p>'; }).join('');
}

/* ---------- saving ---------- */
var statusEl=document.getElementById("save-status"), saveTimer=null;
function setStatus(t,cls){ statusEl.textContent=t; statusEl.className="status "+(cls||""); }
function persist(){ state.saved=Date.now(); chars[curId]=state; try { localStorage.setItem(STORE, JSON.stringify(chars)); localStorage.setItem(CUR, curId); setStatus("Сохранено","ok"); } catch(e){ setStatus("Память заполнена — сделай экспорт","err"); } if (typeof backupDot==="function") backupDot(); }
function changed(rerender){ if (rerender) render(); else refreshVitals(); setStatus("Сохраняю…","pending"); clearTimeout(saveTimer); saveTimer=setTimeout(persist,400); }

/* ---------- events: sheet ---------- */
app.addEventListener("input", function(e){
  var t=e.target, p=t.getAttribute("data-bind"); if (!p) return;
  if (state.locked && !/^notes\./.test(p)) return;
  var v = t.getAttribute("data-num") ? (t.value===""?"":num(t.value)) : t.value;
  setPath(state,p,v);
  if (p==="info.name") document.getElementById("hdr-name").textContent = v || "Новый герой";
  if (t.tagName==="SELECT"){
    var gs=t.getAttribute("data-godsel"); if (gs!==null){ var g=A.GODS.filter(function(z){return z[0]===v;})[0]; state.devotions[+gs].ideals = g?g[1]:""; }
    changed(true); return;
  }
  changed(false);
});
/* inputs that change derived numbers re-render on commit (blur / Enter), keeping focus where the finger went next */
var nextBind=null;
app.addEventListener("pointerdown", function(e){ var t=e.target.closest("[data-bind]"); nextBind = t ? t.getAttribute("data-bind") : null; }, true);
app.addEventListener("change", function(e){ var t=e.target; if (t.id==="portrait-in" && t.files && t.files[0]) loadPortrait(t.files[0]);
  if (t.hasAttribute("data-rerender") && t.tagName==="INPUT"){ var go=nextBind; render(); if (go){ var n=app.querySelector('[data-bind="'+go+'"]'); if (n && !n.disabled) n.focus(); } nextBind=null; } });
function scrollToSec(id){ var s=document.getElementById("sec-"+id); if (!s) return; if (collapsed[id]){ collapsed[id]=false; s.classList.remove("closed"); } var top=s.getBoundingClientRect().top+window.scrollY-document.querySelector(".top").offsetHeight-8; window.scrollTo({top:top, behavior:"smooth"}); }
document.getElementById("qnav").addEventListener("click", function(e){ var b=e.target.closest("[data-go]"); if (b && mode==="full"){ var id=b.getAttribute("data-go"); spyLock=Date.now(); setSpy(id); scrollToSec(id); } });
var spyLock=0;
function setSpy(id){ document.querySelectorAll("#qnav [data-go]").forEach(function(x){ var on=x.getAttribute("data-go")===id; x.classList.toggle("on",on); if (on){ x.setAttribute("aria-current","true"); var nv=x.parentNode; if (window.innerWidth<700) nv.scrollLeft=x.offsetLeft-nv.clientWidth/2+x.offsetWidth/2; } else x.removeAttribute("aria-current"); }); }
function spy(){ if (mode!=="full" || Date.now()-spyLock<900) return; var lim=document.querySelector(".top").offsetHeight+60, cur=null; document.querySelectorAll("#app .sec").forEach(function(s){ if (s.getBoundingClientRect().top<=lim) cur=s.id.slice(4); }); if (!cur){ var f=document.querySelector("#app .sec"); cur=f?f.id.slice(4):null; } if (window.innerHeight+window.scrollY>=document.documentElement.scrollHeight-4){ var all=document.querySelectorAll("#app .sec"); if (all.length) cur=all[all.length-1].id.slice(4); } if (cur) setSpy(cur); }
function topH(){ document.documentElement.style.setProperty("--top-h", document.querySelector(".top").offsetHeight+"px"); }
window.addEventListener("scroll", spy, {passive:true});
window.addEventListener("resize", function(){ topH(); spy(); });
document.querySelector(".top").addEventListener("click", function(e){ var m=e.target.closest("[data-mode]"); if (m){ setMode(m.getAttribute("data-mode")); return; } var b=e.target.closest("[data-go]"); if (b){ if (mode!=="full") return; scrollToSec(b.getAttribute("data-go")); } });

app.addEventListener("click", appClick);
function appClick(e){
  var b=e.target.closest("button"); if (!b || b.disabled) return; var d=b.dataset;
  if (d.free){ openRoll({kind:"free", title:"Свободный бросок", sub:"Бросок d100 против своего шанса", freeBase:50, base:function(){ return rs.freeBase; }}); return; }
  if (d.qstar!==undefined){ var qs=state.skills[+d.qstar]; qs.q=!qs.q; changed(true); return; }
  if (d.ammo!==undefined){ var aw2=state.weapons[+d.ammo]; if (!aw2) return; aw2.ammo = d.d==="fill"?num(aw2.ammoMax):Math.max(0,Math.min(num(aw2.ammoMax),num(aw2.ammo)+(+d.d))); changed(true); if (d.d==="fill") toast(ammoWord(aw2,true)+" собраны: "+aw2.ammo+" из "+aw2.ammoMax); return; }
  if (d.bigg!==undefined){ showGaldur(+d.bigg); return; }
  if (d.edit){ setMode("full"); setTimeout(function(){ scrollToSec(d.edit); },30); return; }
  if (d.artup){ document.getElementById("art-in").click(); return; }
  if (d.artdel){ state.combat.art=""; changed(true); return; }
  if (d.artreset){ state.combat.pos={}; changed(true); toast("Таблички зон вернулись на места по умолчанию"); return; }
  if (state.locked && d.bonus!=="mp.lock" && !Object.keys(d).some(function(k){ return LOCK_OK[k]; })) return;
  if (d.toggle){ collapsed[d.toggle]=!collapsed[d.toggle]; try{localStorage.setItem("aov-collapsed",JSON.stringify(collapsed));}catch(x){} var s=document.getElementById("sec-"+d.toggle); s.classList.toggle("closed"); b.setAttribute("aria-expanded",String(!collapsed[d.toggle])); return; }
  if (d.info){ openModal(infoHtml(d.info)); return; }
  if (d.flag){ state.info[d.flag]=!state.info[d.flag]; if (state.info[d.flag]) collapsed[d.flag]=false; changed(true); return; }
  if (d.bonus){ var cur=num(getPath(state,d.bonus)); setPath(state,d.bonus,(d.bonus==="mp.lock"?Math.max(0,cur+(+d.d)):cur+(+d.d))); changed(true); return; }
  if (d.rollchar){ var ck=d.rollchar; openRoll({kind:"char", ref:ck, title:A.CHARS.filter(function(c){return c[0]===ck;})[0][2]+" ("+nameOfChar(ck)+" "+C(ck)+")", sub:"Бросок характеристики"}); return; }
  if (d.rollskill!==undefined){ var si=+d.rollskill, sk=state.skills[si]; openRoll({kind:"skill", ref:si, title:sk.n, sub:CATN[sk.c]+" · модификатор "+pct(catMod(sk.c)), base:function(){ return state.skills[si].v; }, xpPath:"skills."+si}); return; }
  if (d.rollpassion!==undefined){ var pi=+d.rollpassion; openRoll({kind:"passion", ref:pi, title:state.passions[pi].n, sub:"Страсть", base:function(){ return state.passions[pi].v; }, xpPath:"passions."+pi}); return; }
  if (d.rollworship!==undefined){ var wi=+d.rollworship; openRoll({kind:"worship", ref:wi, title:"Поклонение ("+(state.devotions[wi].god||"…")+")", sub:"Мистика · "+(state.devotions[wi].ideals||""), base:function(){ return state.devotions[wi].v; }, xpPath:"devotions."+wi}); return; }
  if (d.rollraw){ var rk=d.rollraw; openRoll({kind:"raw", ref:rk, title:rk==="rep"?"Репутация":"Статус", sub:"Бросок d100", base:function(){ return state[rk]; }}); return; }
  if (d.attack!==undefined){ var ai=+d.attack, w=state.weapons[ai], s=skillByKey(w.sk); openRoll({kind:"weapon", ref:ai, title:w.n, sub:(s?s.n:"Без умения")+" · "+(A.WTYPES[w.t]||""), base:function(){ var q=skillByKey(state.weapons[ai].sk); return q?q.v:0; }, xpPath:s?"skills."+state.skills.indexOf(s):null}); return; }
  if (d.dmg!==undefined){ var di=+d.dmg; openRoll({kind:"weapon", ref:di, title:state.weapons[di].n, sub:"Урон по итогу атаки", direct:true, base:function(){ var q=skillByKey(state.weapons[di].sk); return q?q.v:0; }}); rs.res={direct:true,roll:0,t:0,level:"succ"}; rollDamage(); return; }
  if (d.hp){ state.hp.lost=Math.max(-9, num(state.hp.lost)-(+d.hp)); changed(true); return; }
  if (d.hpdlg){ openModal('<h2>Урон по общим ОЗ</h2><p class="hint">Яд, огонь по всему телу, холод — всё, что не бьёт в одну зону.</p><div class="dlg-row"><label class="fld"><span>Урон</span><input id="gd-v" type="number" inputmode="numeric"></label><button type="button" class="btn warn" data-gdmg="1">Получить</button><button type="button" class="btn" data-gheal="1">Вылечить</button></div>'); return; }
  if (d.mp){ state.mp.spent=Math.max(0, Math.min(mpMax(), num(state.mp.spent)+(+d.mp))); changed(true); return; }
  if (d.mprest){ state.mp.spent=Math.max(0,num(state.mp.spent)-Math.ceil(C("pow")/4)); changed(true); toast("Отдых 6 часов: +"+Math.ceil(C("pow")/4)+" ОМ"); return; }
  if (d.mpfull){ state.mp.spent=0; changed(true); toast("Сутки отдыха: ОМ восстановлены (залог остаётся)"); return; }
  if (d.loc){ hiLoc=d.loc; openModal(dmgDlg(d.loc)); var dv=document.getElementById("dd-v"); if (dv) dv.focus(); return; }
  if (d.rollloc){ var lr=rollLocation(); render(); toast("d20 = "+lr.r+": <b>"+LOCN[lr.k][1]+"</b>"); return; }
  if (d.healweek){ var hr=healRate(), healed=0; A.LOCS.forEach(function(l){ var k=l[0], dmg=num(state.hp.loc[k]); if (dmg>0){ var h=Math.min(hr,dmg); state.hp.loc[k]=dmg-h; healed+=h; } }); state.hp.lost=Math.max(0,num(state.hp.lost)-healed); changed(true); toast(healed?"Неделя отдыха: вылечено "+healed+" ОЗ":"Ран нет"); return; }
  if (d.healall){ state.hp.lost=0; state.hp.loc={}; hiLoc=null; changed(true); return; }
  if (d.pip){ var pv=+d.v, pc=num(getPath(state,d.pip)); setPath(state,d.pip, pc===pv?pv-1:pv); changed(true); return; }
  if (d.xchk){ var o=getPath(state,d.xchk); o.x=!o.x; changed(true); return; }
  if (d.xp){ xpRun=null; openModal(xpHtml()); return; }
  if (d.catinfo){ openModal(catInfoHtml(d.catinfo)); return; }
  if (d.del){ var arr=getPath(state,d.del); arr.splice(+d.i,1); if (d.del==="weapons") openW={}; changed(true); return; }
  if (d.addrow){ var nr = d.addrow==="weapons"?{n:"",sk:"",dmg:"1D6",dm:"full",t:"C",hp:"",enc:0,len:"",notes:""}:d.addrow==="passions"?{n:"",v:60,x:false}:{n:"",q:1,enc:0,notes:""}; state[d.addrow].push(nr); changed(true); return; }
  if (d.addweapon){ openModal(pickerHtml("Каталог оружия", A.WEAPONS.map(function(w,i){ return {val:i,label:w.n,sub:w.g+" · "+w.dmg+" · "+(A.WTYPES[w.t]||"")+" · ОЗ "+w.hp+" · НГР "+w.enc,text:(w.req!=="—"?"СИЛ/ЛОВ "+w.req+" · ":"")+(w.len||"")+(w.cost?" · "+w.cost:"")}; }), "data-pickweapon")); return; }
  if (d.addarmour){ openModal(pickerHtml("Каталог брони", A.ARMOUR.map(function(a,i){ return {val:i,label:a.n,sub:"ОБ "+a.ap+" · НГР "+a.enc+" · "+a.cost,text:a.locs.map(function(k){return LOCN[k][1];}).join(", ")}; }), "data-pickarmour")); return; }
  if (d.starter){ A.STARTER_ARMOUR.forEach(function(n){ state.armour.push(armourFromCat(A.ARMOUR.filter(function(a){return a.n===n;})[0], true)); }); changed(true); toast("Добавлен стартовый набор: шерстяная одежда, кожаная рубаха, шлем"); return; }
  if (d.worn!==undefined){ var ar=state.armour[+d.worn]; ar.worn=!ar.worn; changed(true); return; }
  if (d.addskill){ var cat=d.addskill, ex=A.EXTRA_SKILLS.filter(function(x){return x[1]===cat;}); var items=ex.map(function(x){ return {val:cat+"|"+x[0]+"|"+x[2], label:x[0], sub:"база "+String(x[2]).padStart(2,"0")}; }); items.push({val:cat+"|__custom|0", label:"Своё умение…", sub:"Название впишешь сам"}); openModal(pickerHtml("Новое умение: "+CATN[cat], items, "data-pickskill")); return; }
  if (d.fillbase){ var cnt=0; state.skills.forEach(function(s){ var b=skillBase(s); if (b>0 && num(s.v)===b){ var nv=Math.max(0,b+catMod(s.c)); if (nv!==num(s.v)){ s.v=nv; cnt++; } } }); changed(true); toast(cnt?"Обновлено умений: "+cnt+" (только нетронутые, с базой выше 00)":"Нечего обновлять: все умения уже изменены вручную"); return; }
  if (d.adddev){ state.devotions.push({god:"",ideals:"",v:10,dp:1,x:false}); changed(true); return; }
  if (d.tab){ noteTab=d.tab; render(); return; }
  /* runes */
  if (d.rune){ openModal(runeHtml(d.rune)); return; }
  if (d.newscript){ draft={n:"",galdur:"",r:[],eff:[],bind:false,ix:-1}; openModal(scriptHtml()); return; }
  if (d.editscript!==undefined){ var sc=state.runes.scripts[+d.editscript]; draft={n:sc.n,galdur:sc.galdur,r:sc.r.slice(),eff:(sc.eff||[]).slice(),bind:false,ix:+d.editscript}; openModal(scriptHtml()); return; }
  if (d.newbind){ draft={n:"",obj:"",r:[],eff:[],effTxt:"",bind:true,ix:-1}; openModal(scriptHtml()); return; }
  if (d.editbind!==undefined){ var bb=state.runes.binds[+d.editbind]; draft={n:bb.n,obj:bb.obj,r:bb.r.slice(),eff:bb.r.map(function(k,i){ return (bb.actIdx||[]).indexOf(i)>=0?0:-1; }),effTxt:bb.eff,bind:true,ix:+d.editbind}; openModal(scriptHtml()); return; }
  if (d.carve!==undefined){ var cs=state.runes.scripts[+d.carve], cost=2*cs.r.length; if (mpAvail()<cost){ toast("Не хватает ОМ: нужно "+cost+", доступно "+mpAvail()); return; } cs.state="ready"; changed(true); toast("Надпись вырезана: "+cost+" ОМ в залоге до гальдура или рассвета"); return; }
  if (d.galdur!==undefined){ var gi=+d.galdur, gs=state.runes.scripts[gi], rm=skillByKey("runes"); openRoll({kind:"script", ref:gi, title:gs.n||"Рунная надпись", sub:"Магия рун · гальдур", base:function(){ var q=skillByKey("runes"); return q?q.v:0; }, xpPath:rm?"skills."+state.skills.indexOf(rm):null}); return; }
  if (d.unscript!==undefined){ state.runes.scripts[+d.unscript].state="plan"; changed(true); toast("Надпись уничтожена, ОМ свободны"); return; }
  if (d.dawn){ var n=0; state.runes.scripts.forEach(function(s){ if (s.state==="ready"){ s.state="plan"; n++; } }); changed(true); toast(n?"Рассвет: "+n+" надпис"+(n===1?"ь":"и")+" угасли, ОМ вернулись":"Вырезанных надписей нет"); return; }
  if (d.bindact!==undefined){ if (mpAvail()<3){ toast("Нужно 3 ОМ, доступно "+mpAvail()); return; } state.mp.spent=num(state.mp.spent)+3; changed(true); toast("«"+esc(state.runes.binds[+d.bindact].n||"Связующая руна")+"» активна до начала следующего хода (−3 ОМ)"); return; }
  /* seidr */
  if (d.newspell){ openModal(pickerHtml("Заклинание сейда", [{val:"-1",label:"Своё заклинание",sub:"Пустая карточка"}].concat(A.SEID_EX.map(function(x,i){ return {val:i,label:x.n,sub:A.REALMS[x.r].n,text:x.t}; })), "data-pickspell")); return; }
  if (d.cast!==undefined){ var ci=+d.cast, sp=state.seidr.spells[ci], scost=A.SEID_COST[num(sp.dur)]+A.SEID_COST[num(sp.dist)]+A.SEID_COST[num(sp.dim)];
    if (mpAvail()<scost){ toast("Не хватает ОМ: нужно "+scost+", доступно "+mpAvail()); return; }
    state.mp.spent=num(state.mp.spent)+scost; var sk2=skillByKey("seidr"), off=state.seidr.focus&&sp.r&&sp.r!==state.seidr.focus;
    openRoll({kind:"seidr", ref:ci, title:sp.n||"Ритуал сейда", sub:"Магия Сейд · "+(A.REALMS[sp.r]?A.REALMS[sp.r].n:"")+" · "+scost+" ОМ потрачено", base:function(){ var q=skillByKey("seidr"); return q?q.v:0; }, xpPath:sk2?"skills."+state.skills.indexOf(sk2):null});
    if (off) { rs.mods=-20; renderRoll(); }
    changed(true); return; }
  if (d.dispel!==undefined){ var ds=state.seidr.spells[+d.dispel]; ds.active=false; ds.lock=0; changed(true); toast("Заклинание снято, ОМ из залога свободны"); return; }
}

/* ---------- боевой режим «Небесный круг» ---------- */
var combatEl=document.getElementById("combat");
var mode="full"; try { mode=localStorage.getItem("aov-mode")||"book"; } catch(e){}
function applyMode(){ document.body.classList.toggle("combat", mode==="combat"); document.body.classList.toggle("book", mode==="book"); document.querySelectorAll("[data-mode]").forEach(function(b){ b.setAttribute("aria-pressed", String(b.getAttribute("data-mode")===mode)); }); }
function setMode(m){ mode=m; try{ localStorage.setItem("aov-mode",m); }catch(x){} renderCombatView(); renderBookView(); applyMode(); window.scrollTo(0,0); topH(); spy(); }
var DEF_POS={hd:[49.2,20.3], ra:[27.8,50], la:[72.9,50], ch:[50.8,41.7], ab:[50.8,53.8], rl:[33.1,72.6], ll:[70.3,72.6]};
var ZSHORT={hd:"Голова",ra:"Пр. рука",la:"Лев. рука",ch:"Грудь",ab:"Живот",rl:"Пр. нога",ll:"Лев. нога"};
function arcPath(r,a0,a1){ var x0=320+r*Math.cos(a0), y0=320+r*Math.sin(a0), x1=320+r*Math.cos(a1), y1=320+r*Math.sin(a1); return "M"+x0.toFixed(1)+" "+y0.toFixed(1)+" A"+r+" "+r+" 0 "+((a1-a0)>Math.PI?1:0)+" 1 "+x1.toFixed(1)+" "+y1.toFixed(1); }
function segRing(r,w,n,colorAt,gapDeg){ var h="", step=2*Math.PI/Math.max(1,n), gap=Math.min(step*0.35,(gapDeg||3)*Math.PI/180); for (var i=0;i<n;i++){ var a0=-Math.PI/2+i*step+gap/2, a1=a0+step-gap, c=colorAt(i); h+='<path d="'+arcPath(r,a0,a1)+'" stroke="'+c[0]+'" stroke-width="'+w+'" fill="none"'+(c[1]?' class="'+c[1]+'"':'')+'></path>'; } return h; }
function quickSkills(){ var q=state.skills.filter(function(s){ return s.q; }); if (!q.length) q=state.skills.filter(function(s){ return s.c!=="wpn" && num(s.v)>0; }).sort(function(a,b){ return num(b.v)-num(a.v); }).slice(0,8); return q; }
function renderCombatView(){
  if (!combatEl) return;
  if (mode!=="combat"){ combatEl.innerHTML=""; return; }
  var i=state.info, hm=hpMax(), hc=hpCur(), mm=mpMax(), ma=mpAvail(), ml=mpLocked(), cb=state.combat||{};
  var h='<div class="cb">';
  /* left */
  h+='<div class="cb-col"><div><span class="eyebrow">боевой лист</span><h1 class="cb-name gold">'+esc(i.name||"Герой")+'</h1><span class="cb-sub">'+(i.nick?'«'+esc(i.nick)+'» · ':'')+'МУ '+dmString()+' · Перемещение 10 · Лечение '+healRate()+'</span></div>';
  h+='<div class="cb-chars">'+A.CHARS.map(function(c){ return '<button type="button" class="cb-ch'+(c[0]==="pow"?' pow':'')+'" data-rollchar="'+c[0]+'"><span>'+c[1]+'</span><b>'+C(c[0])+'</b></button>'; }).join('')+'<div class="cb-ch" style="cursor:default;border-style:dashed"><span>Вирд</span><b style="font-size:13px;color:var(--acc)">−1 ВОЛ</b></div></div>';
  h+='<div class="cb-card"><h2 class="cb-h">Оружие</h2><div class="cb-w">';
  state.weapons.forEach(function(w,ix){ var s=skillByKey(w.sk); h+='<button type="button" class="cb-chip" data-attack="'+ix+'"><span>'+esc(w.n)+' · '+esc(w.dmg)+'</span><b>'+(s?num(s.v):'—')+'</b></button><button type="button" class="cb-chip sm" data-dmg="'+ix+'">Урон</button>'; if (w.ammoMax!=null) h+='<div class="cb-ammo'+(num(w.ammo)===0?' empty':'')+'">'+ammoCtl(ix,w)+'</div>'; });
  if (!state.weapons.length) h+='<span class="cb-sub">Оружие добавляется в полном листе</span>';
  h+='</div></div>';
  var worn=state.armour.filter(function(a){return a.worn;}).map(function(a){return a.n;});
  if (worn.length) h+='<div class="cb-card"><h2 class="cb-h">Броня</h2><span class="cb-sub" style="font-style:normal">'+esc(worn.join(", "))+'</span></div>';
  h+='</div>';
  /* centre */
  h+='<div class="cb-col cb-mid"><div class="cb-ring"><svg viewBox="0 0 640 640" role="img" aria-label="Здоровье '+hc+' из '+hm+', магия '+ma+' из '+mm+(ml?', '+ml+' в залоге':'')+'">'+
    '<circle cx="320" cy="320" r="316" fill="none" stroke="var(--acc)" stroke-width="1.5"></circle>'+
    segRing(300,20,hm,function(k){ return k<hc?["#e2735a"]:["#3a1f1b"]; },2.5)+
    segRing(272,9,Math.max(1,mm),function(k){ return k<ma?["#9fc9ec"]:k<ma+ml?["#d8b25a","lockpulse"]:["#24334a"]; },2)+
    '</svg><div class="cb-disc" style="background:'+esc(cb.art?cb.bg||"#fcfcfa":"color-mix(in srgb,var(--panel) 70%,var(--bg))")+'">'+
    (cb.art?'<img src="'+esc(cb.art)+'" alt="'+esc(i.name||"Герой")+'" draggable="false">':'<div class="noart"><span>ᚨ</span>Добавь боевой арт героя — на нём появятся зоны поражения</div>')+
    A.LOCS.map(function(l){ var k=l[0], p=(cb.pos&&cb.pos[k])||DEF_POS[k]; return '<div class="cb-zone" data-zone="'+k+'" style="left:'+p[0]+'%;top:'+p[1]+'%"><span>'+ZSHORT[k]+' · '+l[2]+'</span><b>'+locMax(k)+' ОЗ · ОБ '+locAP(k)+'</b></div>'; }).join('')+
    '</div>'+
    '<div class="cb-ctr top cb-hp"><button type="button" class="pmb" data-hp="-1" aria-label="Минус одно очко здоровья">−</button><div class="val"><small>здоровье</small><b>'+hc+'<i> / '+hm+'</i></b></div><button type="button" class="pmb" data-hp="1" aria-label="Плюс одно очко здоровья">+</button></div>'+
    '<div class="cb-ctr bot cb-mp"><button type="button" class="pmb" data-mp="1" aria-label="Потратить очко магии">−</button><div class="val"><b>'+ma+'<i> / '+mm+' ОМ</i></b>'+(ml?'<small style="color:var(--acc)">'+ml+' в залоге</small>':'')+'</div><button type="button" class="pmb" data-mp="-1" aria-label="Вернуть очко магии">+</button></div>'+
    '</div>'+
    (hc<=0?'<p class="cb-status">ОЗ на нуле — смерть в конце раунда без помощи</p>':hc<=2?'<p class="cb-status">1–2 ОЗ — герой без сознания</p>':'')+
    '<div class="cb-art-tools"><button type="button" class="btn ghost small" data-artup="1">'+(cb.art?'Сменить арт':'Добавить арт')+'</button>'+(cb.art?'<button type="button" class="btn ghost small" data-artreset="1">Зоны по умолчанию</button><button type="button" class="btn ghost small" data-artdel="1">Убрать арт</button>':'')+'<input type="file" id="art-in" accept="image/*" hidden></div>'+
    '<p class="hint sm" style="text-align:center;margin:4px auto 0">'+(state.locked?'':'В режиме «Правка» таблички зон можно перетаскивать пальцем. ')+'Попадания по зонам ведёт мастер.</p></div>';
  /* right */
  h+='<div class="cb-col"><div class="cb-card" style="background:none;border:0;padding:0"><h2 class="cb-h">Быстрые броски</h2><div class="cb-g2">'+
    quickSkills().map(function(s){ return '<button type="button" class="cb-chip" data-rollskill="'+state.skills.indexOf(s)+'"><span>'+esc(s.n.replace(/\s*\(.*\)$/,""))+'</span><b>'+num(s.v)+'</b></button>'; }).join('')+'</div></div>';
  if (state.devotions.length){ h+='<div class="cb-card"><h2 class="cb-h">Боги</h2>'+state.devotions.map(function(d,di){ var mx=maxDP(d.v), dots=""; for (var q=1;q<=mx;q++) dots+='<button type="button" class="pipmini'+(q<=num(d.dp)?' on':'')+'" data-pip="devotions.'+di+'.dp" data-v="'+q+'" aria-label="'+q+' ОП"></button>'; return '<div class="cb-dev"><button type="button" class="cb-chip" style="flex:1;min-height:40px" data-rollworship="'+di+'"><span>'+esc(d.god||"Бог")+'</span><b style="font-size:16px">'+num(d.v)+'</b></button><span class="cb-pips">'+(dots||'<small>нет ОП</small>')+'</span></div>'; }).join('')+'<span class="cb-sub">ОП тратятся в окне броска: +20 / +30 / +50</span></div>'; }
  if (i.runes && (state.runes.scripts.length||state.runes.binds.length)){
    h+='<div class="cb-card" style="background:none;border:0;padding:0"><h2 class="cb-h">Руны наготове</h2><div style="display:flex;flex-direction:column;gap:6px">';
    state.runes.scripts.forEach(function(sc,ix){ var g=sc.r.map(function(k){return RUNE[k].g;}).join(''); h+=sc.state==="ready"?'<button type="button" class="cb-chip hot" data-galdur="'+ix+'"><span><span class="cb-rune">'+g+'</span> '+esc(sc.n)+'</span><b style="font-size:14px">петь</b></button>':'<button type="button" class="cb-chip" data-carve="'+ix+'"><span><span class="cb-rune">'+g+'</span> '+esc(sc.n)+' · '+(2*sc.r.length)+' ОМ</span><b style="font-size:14px">резать</b></button>'; });
    state.runes.binds.forEach(function(bd,ix){ h+='<button type="button" class="cb-chip" data-bindact="'+ix+'"><span><span class="cb-rune">'+(bd.act||[]).map(function(k){return RUNE[k].g;}).join('')+'</span> '+esc(bd.n)+'</span><b style="font-size:14px">3 ОМ</b></button>'; });
    h+='<button type="button" class="cb-chip sm" data-dawn="1">Рассвет — снять залог</button></div></div>';
  }
  if (i.seidr && state.seidr.spells.length){ h+='<div class="cb-card" style="background:none;border:0;padding:0"><h2 class="cb-h">Сейд</h2><div style="display:flex;flex-direction:column;gap:6px">'+state.seidr.spells.map(function(sp,ix){ var cost=A.SEID_COST[num(sp.dur)]+A.SEID_COST[num(sp.dist)]+A.SEID_COST[num(sp.dim)]; return sp.active?'<button type="button" class="cb-chip hot" data-dispel="'+ix+'"><span>'+esc(sp.n)+' · действует</span><b style="font-size:14px">снять</b></button>':'<button type="button" class="cb-chip" data-cast="'+ix+'"><span>'+esc(sp.n)+' · '+cost+' ОМ</span><b style="font-size:14px">ритуал</b></button>'; }).join('')+'</div></div>'; }
  h+='</div>';
  /* bottom strip */
  var L=state.lastRoll;
  h+='<div class="cb-last">'+(L?(L.roll?'<span class="num lv-'+L.level+'">'+(L.roll===100?'00':String(L.roll).padStart(2,"0"))+'</span><div style="display:flex;flex-direction:column"><b class="lv lv-'+L.level+'">'+LEVELS[L.level][0]+'</b><span class="cb-sub" style="font-style:normal">'+esc(L.title)+' · '+L.t+'% · '+thrLine(L.t)+'</span></div>':'<div style="display:flex;flex-direction:column"><b class="lv">'+esc(L.title)+'</b></div>')+
    (L.dmg!==""&&L.dmg!=null?'<span class="sep"></span><div style="display:flex;flex-direction:column"><b class="lv" style="color:var(--gold-hi)">'+L.dmg+' урона</b><span class="cb-sub" style="font-style:normal">'+esc(L.dmgNote||"")+'</span></div>':''):'<span class="cb-sub">Здесь появится последний бросок</span>')+
    '<div class="go"><button type="button" class="btn" data-free="1">Бросить d100</button></div></div>';
  h+='</div>';
  combatEl.innerHTML=h;
}
combatEl.addEventListener("click", appClick);
combatEl.addEventListener("change", function(e){ var t=e.target; if (t.id!=="art-in"||!t.files||!t.files[0]) return; var r=new FileReader(); r.onload=function(){ var img=new Image(); img.onload=function(){ var H=900, sc=Math.min(1,H/img.height), c=document.createElement("canvas"); c.width=Math.round(img.width*sc); c.height=Math.round(img.height*sc); var g=c.getContext("2d"); g.drawImage(img,0,0,c.width,c.height); var px=g.getImageData(2,2,1,1).data; state.combat.bg="rgb("+px[0]+","+px[1]+","+px[2]+")"; state.combat.art=c.toDataURL("image/jpeg",0.85); changed(true); toast("Арт добавлен. В режиме «Правка» таблички зон можно перетащить"); }; img.src=r.result; }; r.readAsDataURL(t.files[0]); });
/* перетаскивание табличек зон */
var drag=null;
combatEl.addEventListener("pointerdown", function(e){ var z=e.target.closest(".cb-zone"); if (!z || state.locked) return; var disc=z.parentNode.getBoundingClientRect(); drag={z:z, k:z.getAttribute("data-zone"), r:disc}; z.setPointerCapture(e.pointerId); e.preventDefault(); });
combatEl.addEventListener("pointermove", function(e){ if (!drag) return; var x=Math.max(4,Math.min(96,(e.clientX-drag.r.left)/drag.r.width*100)), y=Math.max(4,Math.min(96,(e.clientY-drag.r.top)/drag.r.height*100)); drag.z.style.left=x+"%"; drag.z.style.top=y+"%"; drag.x=x; drag.y=y; });
["pointerup","pointercancel"].forEach(function(ev){ combatEl.addEventListener(ev, function(){ if (!drag) return; if (drag.x!=null){ state.combat.pos[drag.k]=[+drag.x.toFixed(1),+drag.y.toFixed(1)]; changed(false); } drag=null; }); });

/* ---------- режим «Книга» — Серебряная книга ---------- */
var bookEl=document.getElementById("book");
var BOOK_COLS=[["agi","per","ste"],["com","man"],["kno"],["myt","wpn"]];
var bkInked=false;
function bkEdit(sec){ return state.locked?'':'<button type="button" class="bk-ed" data-edit="'+sec+'" aria-label="Править в полном листе" title="Править в полном листе">✎</button>'; }
function bkRow(xpath,on,rollAttr,name,val,cls){ return '<div class="bk-row'+(cls?' '+cls:'')+'"><button type="button" class="bk-x'+(on?' on':'')+'" data-xchk="'+xpath+'" aria-pressed="'+(!!on)+'" aria-label="Отметка опыта: '+esc(name)+'"></button><button type="button" class="bk-rb" '+rollAttr+'><span>'+esc(name)+'</span><b'+(num(val)>=80?' class="glow"':'')+'>'+(num(val)===0?'00':num(val))+'</b></button></div>'; }
function fxText(sc){ return (sc.eff||[]).map(function(e,ri){ return e>=0&&RUNE[sc.r[ri]]?RUNE[sc.r[ri]].e[e]:null; }).filter(Boolean).join(' · '); }
function renderBookView(){
  if (!bookEl) return;
  if (mode!=="book"){ bookEl.innerHTML=""; return; }
  var i=state.info, P=A.PERSONALITY[i.personality], hm=hpMax(), hc=hpCur(), mm=mpMax(), ma=mpAvail();
  var h='<div class="bk">';
  /* ===== Книга первая ===== */
  h+='<article class="bk-page"><header class="bk-id">'+
    '<div class="bk-por">'+(state.portrait?'<img src="'+esc(state.portrait)+'" alt="'+esc(i.name||"Герой")+'">':'<span class="bk-noimg">ᚨ</span>')+'</div>'+
    '<div class="bk-idt"><span class="bk-eye">Книга первая · о человеке'+bkEdit("hero")+'</span><h1 class="bk-gold bk-name">'+esc(i.name||"Новый герой")+'</h1>'+
    ((i.nick||i.meaning)?'<span class="bk-nick">'+[i.nick?'«'+esc(i.nick)+'»':'', i.meaning?'«'+esc(i.meaning)+'»':''].filter(Boolean).join(' · ')+'</span>':'')+
    '<div class="bk-meta">'+[["Пол",String(i.gender||"").toLowerCase()],["Возраст",i.age],["Тип",P?P.n:""],["Фюльгья",i.animal],["Хутор",i.home],["Годи",i.godi],["Игрок",i.player]].filter(function(x){return x[1];}).map(function(x){ return '<span><span class="dim">'+x[0]+'</span> '+esc(x[1])+'</span>'; }).join('')+'</div></div>'+
    '</header>';
  if (i.features) h+='<p class="bk-ink'+(bkInked?' done':'')+'"><span class="bk-gold bk-lbl">Приметы:</span> '+esc(i.features)+'</p>';
  h+='<div class="bk-rule"></div><div class="bk-chars">'+A.CHARS.map(function(c){ var pow=c[0]==="pow"; return '<button type="button" class="bk-ch'+(pow?' pow':'')+'" data-rollchar="'+c[0]+'"><span>'+c[1]+(pow?' · Вирд':'')+'</span><b'+(pow?' class="bk-gold"':'')+'>'+C(c[0])+'</b><small>×5 = '+C(c[0])*5+'%</small></button>'; }).join('')+'</div>';
  var et=encTotal(), em=encMax();
  h+='<div class="bk-der">'+
    '<div><span class="dim">Здоровье</span><b'+(hc<hm?' class="hurt"':'')+'>'+(hc<hm?hc+'<i>/'+hm+'</i>':hm)+'</b></div>'+
    '<div><span class="dim">Магия</span><b>'+(ma<mm?ma+'<i>/'+mm+'</i>':mm)+'</b></div>'+
    '<div><span class="dim">Лечение</span><b>'+healRate()+'</b></div>'+
    '<div><span class="dim">Мод. урона</span><b>'+dmString()+'</b></div>'+
    '<div><span class="dim">Перемещение</span><b>10</b></div>'+
    '<div><span class="dim">Нагрузка</span><b'+(et>em?' class="hurt"':'')+'>'+String(et).replace(".",",")+'<i>/'+em+'</i></b></div>'+
    '<button type="button" data-rollraw="rep"><span class="dim">Репутация</span><b>'+num(state.rep)+'%</b></button>'+
    '<button type="button" data-rollraw="status"><span class="dim">Статус</span><b>'+num(state.status)+'%</b></button></div>';
  h+='<div class="bk-rule"></div><div class="bk-three">';
  h+='<section><h2 class="bk-h bk-gold">Страсти'+bkEdit("pass")+'</h2>'+state.passions.map(function(p,ix){ return bkRow("passions."+ix,p.x,'data-rollpassion="'+ix+'"',p.n||"Страсть",p.v); }).join('')+'<span class="bk-hand">усиление: +20 / +30 / +50</span></section>';
  h+='<section class="bk-gods"><h2 class="bk-h bk-gold">Боги'+bkEdit("faith")+'</h2>'+state.devotions.map(function(d,di){ var mx=maxDP(d.v), st=''; for (var q=1;q<=3;q++){ st+=q<=mx?'<button type="button" class="bk-star'+(q<=num(d.dp)?' on':'')+'" data-pip="devotions.'+di+'.dp" data-v="'+q+'" aria-label="'+q+' ОП">'+(q<=num(d.dp)?'✦':'✧')+'</button>':''; }
      return '<div class="bk-god"><div class="bk-god-h"><button type="button" class="bk-god-n" data-rollworship="'+di+'">'+esc(d.god||"Бог")+'</button><span class="bk-stars">'+(st||'<small class="dim">нет ОП</small>')+'</span></div><span class="dim sm">'+esc(d.ideals||"")+(d.ideals?' · ':'')+'Поклонение '+num(d.v)+'%</span></div>'; }).join('')+(state.devotions.length?'':'<span class="dim">Пока ни одного поклонения</span>')+'</section>';
  var F=state.family, mate=/жен/i.test(i.gender||"")?"Муж":"Жена";
  var stock=[["коней",F.horses],["коров",F.cattle],["овец",F.sheep],["рабов",F.thralls]].filter(function(x){return x[1];}).map(function(x){ return esc(x[1])+' '+x[0]; }).join(' · ');
  h+='<section class="bk-kin"><h2 class="bk-h bk-gold">Род и хутор'+bkEdit("family")+'</h2>'+
    (F.spouse?'<span>'+mate+' — '+esc(F.spouse)+'</span>':'')+(F.children?'<span>'+esc(F.children)+'</span>':'')+(F.kin?'<span>'+esc(F.kin)+'</span>':'')+
    (F.farm?'<span>'+esc(F.farm)+'</span>':'')+(stock?'<span class="dim">'+stock+'</span>':'')+(F.farmnotes?'<span class="bk-hand">'+esc(F.farmnotes)+'</span>':'')+
    (!F.spouse&&!F.children&&!F.kin&&!F.farm?'<span class="dim">Род ещё не записан</span>':'')+'</section></div>';
  h+='<div class="bk-rule"></div><div class="bk-two">';
  var items=[]; state.weapons.forEach(function(w){ if (!num(w.enc)) return; items.push([w.n+(w.dmg?' · '+w.dmg:'')+(w.ammoMax!=null?' · '+ammoGen(w)+' '+num(w.ammo)+'/'+w.ammoMax:''), w.enc]); }); state.armour.forEach(function(a){ if (a.worn) items.push([a.n+' · ОБ '+a.ap, a.enc]); }); state.gear.forEach(function(g){ items.push([g.n+(num(g.q)>1?' ×'+g.q:''), num(g.enc)*(g.q===""||g.q==null?1:num(g.q))]); });
  h+='<section><h2 class="bk-h bk-gold">Снаряжение'+bkEdit("gear")+'</h2><div class="bk-gear">'+items.map(function(it){ return '<div class="bk-row plain"><span>'+esc(it[0])+'</span><b>'+String(Math.round(num(it[1])*10)/10).replace(".",",")+'</b></div>'; }).join('')+'</div></section>';
  var notes=state.gear.filter(function(g){return g.notes;}).map(function(g){return g.notes;});
  h+='<section class="bk-wealth"><h2 class="bk-h bk-gold">Богатство</h2>'+(state.wealth?'<span>'+esc(state.wealth)+'</span>':'<span class="dim">не записано</span>')+
    '<span>Нагрузка <b class="gold">'+String(et).replace(".",",")+'</b> из '+em+(et>em?' — <span class="hurt">перегруз</span>':'')+'</span><div class="bk-bar"><i style="width:'+Math.min(100,em?et/em*100:0)+'%"></i></div>'+
    notes.map(function(n){ return '<span class="bk-hand">'+esc(n)+'</span>'; }).join('')+'</section></div>';
  h+='</article>';
  /* ===== Книга вторая ===== */
  h+='<article class="bk-page"><div class="bk-ph"><h2 class="bk-gold bk-title">Книга вторая · искусства и руны'+bkEdit("skills")+'</h2><span class="bk-hand">□ — отметка опыта · нажми умение — бросок</span></div><div class="bk-skills">';
  BOOK_COLS.forEach(function(col){ h+='<div class="bk-col">';
    col.forEach(function(k){ var m=catMod(k), list=state.skills.filter(function(s){return s.c===k;}).sort(function(a,b){return a.o-b.o;});
      h+='<div class="bk-cat"><h3 class="bk-h sm">'+CATN[k]+'</h3><button type="button" class="bk-mod" data-catinfo="'+k+'">'+sgn(m)+'</button></div>';
      list.forEach(function(s){ var ix=state.skills.indexOf(s); h+=bkRow("skills."+ix,s.x,'data-rollskill="'+ix+'"',s.n,s.v,num(s.v)===0?'zero':''); });
      if (k==="myt") state.devotions.forEach(function(d,di){ h+=bkRow("devotions."+di,d.x,'data-rollworship="'+di+'"','Поклонение ('+(d.god||"…")+')',d.v); });
    });
    h+='</div>'; });
  h+='</div>';
  var nx=state.skills.filter(function(s){return s.x;}).length+state.passions.filter(function(p){return p.x;}).length+state.devotions.filter(function(d){return d.x;}).length;
  if (nx) h+='<div class="bk-xp"><button type="button" class="btn small" data-xp="1">Проверки опыта ('+nx+')</button></div>';
  if (i.runes){
    var R=state.runes;
    h+='<div class="bk-rule"></div><div class="bk-ph"><h2 class="bk-h bk-gold big">Руны и надписи'+bkEdit("runes")+'</h2><span class="bk-futh">'+A.AETTS.map(function(a,ai){ return A.RUNES.filter(function(r){return r.a===ai;}).map(function(r){ var kn=R.known.indexOf(r.k)>=0; return '<button type="button" class="'+(kn?'kn':'')+'" data-rune="'+r.k+'" aria-label="'+r.n+'">'+r.g+'</button>'; }).join(''); }).join('<i></i>')+'</span></div>';
    h+='<div class="bk-runes">';
    R.scripts.forEach(function(sc,ix){ var ready=sc.state==="ready", cost=2*sc.r.length;
      h+='<button type="button" class="bk-scr'+(ready?' ready':'')+'" '+(ready?'data-galdur':'data-carve')+'="'+ix+'"><b>'+esc(sc.n||"Надпись")+'</b><span class="bk-glyphs">'+sc.r.map(function(k,ri){ var e=(sc.eff||[])[ri]; return '<i'+(e>=0?' class="fx"':'')+'>'+RUNE[k].g+'</i>'; }).join('')+'</span><small>'+sc.r.length+' рун · '+cost+' ОМ'+(fxText(sc)?' · '+esc(fxText(sc)):'')+'</small><em>'+(ready?'вырезана · петь гальдур':'резать')+'</em></button>'; });
    R.binds.forEach(function(bd,ix){ h+='<button type="button" class="bk-bind" data-bindact="'+ix+'"><span class="bk-ring">'+((bd.act||[]).map(function(k){return RUNE[k]?RUNE[k].g:"";}).join('')||'ᛟ')+'</span><span class="bk-bt"><b>'+esc(bd.n||"Связующая руна")+' · связующая руна</b><small>'+(bd.r||[]).map(function(k){return RUNE[k]?RUNE[k].g:"";}).join('')+(bd.obj?' · '+esc(bd.obj):'')+(bd.eff?' · '+esc(bd.eff):'')+'</small><em>активировать · 3 ОМ</em></span></button>'; });
    if (!R.scripts.length && !R.binds.length) h+='<p class="dim">Надписей пока нет — их создают в полном листе.</p>';
    h+='</div>';
    if (R.scripts.some(function(s){return s.state==="ready";})) h+='<div class="bk-xp"><button type="button" class="btn ghost small" data-dawn="1">Рассвет — снять залог ('+mpLockedRunes()+' ОМ)</button></div>';
  }
  if (i.seidr){
    var S=state.seidr;
    h+='<div class="bk-rule"></div><div class="bk-ph"><h2 class="bk-h bk-gold big">Сейд'+bkEdit("seidr")+'</h2><span class="bk-hand">'+(A.REALMS[S.focus]?'фокус — '+A.REALMS[S.focus].n:'фокус не выбран')+'</span></div><div class="bk-runes">'+
      S.spells.map(function(sp,ix){ var cost=A.SEID_COST[num(sp.dur)]+A.SEID_COST[num(sp.dist)]+A.SEID_COST[num(sp.dim)]; return '<button type="button" class="bk-scr'+(sp.active?' ready':'')+'" '+(sp.active?'data-dispel':'data-cast')+'="'+ix+'"><b>'+esc(sp.n||"Заклинание")+'</b><small>'+(A.REALMS[sp.r]?A.REALMS[sp.r].n+' · ':'')+cost+' ОМ'+(sp.t?' · '+esc(sp.t):'')+'</small><em>'+(sp.active?'действует · снять':'провести ритуал')+'</em></button>'; }).join('')+(S.spells.length?'':'<p class="dim">Заклинаний пока нет.</p>')+'</div>';
  }
  h+='</article>';
  /* ===== Книга третья ===== */
  var N=state.notes;
  if (N.saga||F.ancestry||N.npc||N.misc){
    h+='<article class="bk-page"><div class="bk-ph"><h2 class="bk-gold bk-title">Книга третья · сага'+bkEdit("notes")+'</h2></div><div class="bk-saga">';
    if (F.ancestry) h+='<section><h3 class="bk-h sm gold">Предки</h3>'+bkText(F.ancestry)+'</section>';
    if (N.saga) h+='<section><h3 class="bk-h sm gold">Сага героя</h3>'+bkText(N.saga)+'</section>';
    if (N.npc) h+='<section><h3 class="bk-h sm gold">Люди</h3>'+bkText(N.npc)+'</section>';
    if (N.misc) h+='<section><h3 class="bk-h sm gold">Прочее</h3>'+bkText(N.misc)+'</section>';
    h+='</div></article>';
  }
  h+='</div>';
  bookEl.innerHTML=h; bkInked=true;
}
function bkText(t){ return String(t).split(/\n+/).filter(function(l){return l.trim();}).map(function(l){ var m=l.match(/^(\d{3,4}(?:[–-]\d{2,4})?)\s*[—–-]\s*(.*)$/); return m?'<p><b class="yr">'+esc(m[1])+'</b> '+esc(m[2])+'</p>':'<p>'+esc(l)+'</p>'; }).join(''); }
bookEl.addEventListener("click", appClick);

/* long press on skill → name editing hint not needed; prevent context menu on roll buttons */
app.addEventListener("contextmenu", function(e){ if (e.target.closest(".sk-n,.ch-n")) e.preventDefault(); });

/* ---------- events: modal ---------- */
modal.addEventListener("click", function(e){
  if (e.target===modal || e.target.closest("[data-close]")){ closeModal(); return; }
  var b=e.target.closest("button"); if (!b || b.disabled) return; var d=b.dataset;
  if (d.snap!==undefined){ restoreSnap(+d.snap); return; }
  if (d.wake){ setWake(!wakeOn); mBody.innerHTML=paletteHtml(); return; }
  if (d.pal){ palette=applyPalette(d.pal); try{ localStorage.setItem("aov-palette",palette); }catch(x){} mBody.innerHTML=paletteHtml(); return; }
  if (d.pickweapon!==undefined){ state.weapons.push(weaponFromCat(A.WEAPONS[+d.pickweapon])); closeModal(); changed(true); return; }
  if (d.pickarmour!==undefined){ state.armour.push(armourFromCat(A.ARMOUR[+d.pickarmour], true)); closeModal(); changed(true); return; }
  if (d.pickskill){ var p=d.pickskill.split("|"); state.skills.push({k:"u"+Date.now().toString(36), n:p[1]==="__custom"?"Новое умение":p[1], c:p[0], b:+p[2], v:+p[2]>0?Math.max(0,+p[2]+catMod(p[0])):0, x:false, o:1000+state.skills.length}); closeModal(); changed(true); return; }
  if (d.pickspell!==undefined){ var ix=+d.pickspell, ex=ix>=0?A.SEID_EX[ix]:null; state.seidr.spells.push({n:ex?ex.n:"Заклинание", r:ex?ex.r:(state.seidr.focus||"mind"), t:ex?ex.t:"", dur:1, dist:0, dim:1, notes:"", active:false, lock:0}); closeModal(); changed(true); return; }
  if (d.catadj){ var cc=d.catadj; state.catAdj[cc] = (+d.d===0)?0:num(state.catAdj[cc])+(+d.d); mBody.innerHTML=catInfoHtml(cc); changed(true); return; }
  if (d.knowrune){ if (state.locked){ toast("Сними «Игра», чтобы менять известные руны"); return; } var k=d.knowrune, kn=state.runes.known, at=kn.indexOf(k); if (at>=0) kn.splice(at,1); else kn.push(k); mBody.innerHTML=runeHtml(k); changed(true); return; }
  /* damage dialog */
  if (d.dodmg){ var raw=num(document.getElementById("dd-v").value); if (!raw) return; var out=applyDamage(d.dodmg, raw, document.getElementById("dd-ap").checked); changed(true); mBody.innerHTML=dmgDlg(d.dodmg); document.getElementById("dd-out").innerHTML='<div class="dmg-res">'+out+'</div>'; return; }
  if (d.doheal){ var hv=num(document.getElementById("dd-h").value), k2=d.doheal; if (!hv) return; var before=num(state.hp.loc[k2]), h=Math.min(hv,before); state.hp.loc[k2]=before-h; state.hp.lost=Math.max(0,num(state.hp.lost)-h); changed(true); mBody.innerHTML=dmgDlg(k2); document.getElementById("dd-out").innerHTML='<div class="dmg-res"><p>Вылечено '+h+' ОЗ'+(h<hv?' (в зоне больше не было урона)':'')+'.</p></div>'; return; }
  if (d.locadj){ if (state.locked) return; var obj=state.hp[d.what]; obj[d.locadj]=num(obj[d.locadj])+(+d.d); changed(true); mBody.innerHTML=dmgDlg(d.locadj); return; }
  if (d.gdmg){ var gv=num(document.getElementById("gd-v").value); if (!gv) return; state.hp.lost=num(state.hp.lost)+gv; changed(true); closeModal(); toast("−"+gv+" ОЗ, осталось "+hpCur()); return; }
  if (d.gheal){ var gh=num(document.getElementById("gd-v").value); if (!gh) return; state.hp.lost=Math.max(0,num(state.hp.lost)-gh); changed(true); closeModal(); toast("+"+gh+" ОЗ, теперь "+hpCur()); return; }
  /* experience */
  if (endRun && endClick(d)) return;
  if (d.xpmode!==undefined){ if (!xpRun) xpRun={list:xpList(),done:false}; xpRun.list[+d.xpmode].safe = d.m==="3"; mBody.innerHTML=endRun?endHtml():xpHtml(); return; }
  if (d.xproll){ if (!xpRun) xpRun={list:xpList(),done:false}; xpRun.list.forEach(function(x){ var r=rnd(100), tot=r+x.mod, ok=tot>x.v || tot>=100; if (x.v>=100) ok = tot>=100; x.res={roll:r, ok:ok, gain: ok?(x.safe?3:rnd(6)):0}; }); xpRun.done=true; mBody.innerHTML=endRun?endHtml():xpHtml(); return; }
  if (d.xpapply){ var log=[], date=new Date().toLocaleDateString("ru-RU"); xpRun.list.forEach(function(x){ var o=state[x.kind][x.i]; if (x.res.ok){ o.v=num(o.v)+x.res.gain; } o.x=false; log.push("• "+x.n+": "+(x.res.ok?x.v+" → "+(x.v+x.res.gain)+"%":"без роста ("+x.res.roll+(x.mod?sgn(x.mod):"")+")")); }); state.notes.xplog = date+" — проверки опыта\n"+log.join("\n")+(state.notes.xplog?"\n\n"+state.notes.xplog:""); xpRun=null; if (endRun){ endRun.step=1; changed(true); mBody.innerHTML=endHtml(); return; } closeModal(); changed(true); toast("Опыт записан в журнал"); return; }
  /* script builder */
  if (d.dadd){ readDraftInputs(); if (draft.r.length>=9){ toast("Не больше 9 рун"); return; } draft.r.push(d.dadd); draft.eff.push(-1); mBody.innerHTML=scriptHtml(); return; }
  if (d.drm!==undefined){ readDraftInputs(); draft.r.splice(+d.drm,1); draft.eff.splice(+d.drm,1); mBody.innerHTML=scriptHtml(); return; }
  if (d.dsave){ readDraftInputs();
    if (draft.bind){ var bo={n:draft.n,obj:draft.obj,r:draft.r.slice(),actIdx:draft.eff.map(function(e,i){return e>=0?i:-1;}).filter(function(i){return i>=0;}),eff:draft.effTxt}; bo.act=bo.actIdx.map(function(i){return draft.r[i];}); if (draft.ix>=0) state.runes.binds[draft.ix]=bo; else state.runes.binds.push(bo); }
    else { var so={n:draft.n,galdur:draft.galdur,r:draft.r.slice(),eff:draft.eff.slice(),state:"plan"}; if (draft.ix>=0){ so.state=state.runes.scripts[draft.ix].state; state.runes.scripts[draft.ix]=so; } else state.runes.scripts.push(so); }
    draft=null; closeModal(); changed(true); return; }
  /* characters */
  if (d.open){ switchTo(d.open); closeModal(); return; }
  if (d.copy){ var c=JSON.parse(JSON.stringify(chars[d.copy])); c.id=uid(); c.info.name=(c.info.name||"Без имени")+" (копия)"; chars[c.id]=c; persist(); openModal(charsHtml()); return; }
  if (d.newchar){ var nc=blank(); normalize(nc); nc.id=uid(); nc.info.player=state.info.player||""; chars[nc.id]=nc; switchTo(nc.id); closeModal(); return; }
  if (d.newdemo){ var dm=fromSeed(A.SEED); dm.id=uid(); chars[dm.id]=dm; switchTo(dm.id); closeModal(); return; }
  if (d.askdel){ var nm=(chars[d.askdel].info||{}).name||"Без имени"; openModal('<h2>Удалить «'+esc(nm)+'»?</h2><p>Герой исчезнет с этого устройства. Вернуть можно только из экспорта.</p><div class="row-btns"><button type="button" class="btn warn" data-dodel="'+d.askdel+'">Удалить</button><button type="button" class="btn ghost" data-backchars="1">Отмена</button></div>'); return; }
  if (d.backchars){ openModal(charsHtml()); return; }
  if (d.dodel){ delete chars[d.dodel]; if (d.dodel===curId){ var rest=Object.keys(chars); if (!rest.length){ var n2=blank(); normalize(n2); n2.id=uid(); chars[n2.id]=n2; rest=[n2.id]; } curId=rest[0]; state=chars[curId]; normalize(state); render(); } persist(); openModal(charsHtml()); return; }
});
modal.addEventListener("change", function(e){
  var t=e.target;
  if (t.hasAttribute("data-deff")){ readDraftInputs(); draft.eff[+t.getAttribute("data-deff")] = +t.value; mBody.innerHTML=scriptHtml(); return; }
  if (t.hasAttribute("data-dact")){ readDraftInputs(); draft.eff[+t.getAttribute("data-dact")] = t.checked?0:-1; mBody.innerHTML=scriptHtml(); return; }
});
modal.addEventListener("input", function(e){ if (e.target.id!=="m-search") return; var q=e.target.value.trim().toLowerCase(); mBody.querySelectorAll(".pick-list li").forEach(function(li){ li.hidden = q && li.getAttribute("data-name").indexOf(q)<0; }); });
modal.addEventListener("keydown", function(e){ if (e.key!=="Enter") return; if (e.target.id==="dd-v"){ var b=mBody.querySelector("[data-dodmg]"); if (b) b.click(); } if (e.target.id==="dd-h"){ var b2=mBody.querySelector("[data-doheal]"); if (b2) b2.click(); } });

/* ---------- events: roll sheet ---------- */
sheet.addEventListener("click", function(e){
  if (e.target===sheet || e.target.closest("[data-sclose]")){ closeRoll(); return; }
  var b=e.target.closest("button"); if (!b) return; var d=b.dataset;
  if (d.rmult){ rs.mult=+d.rmult; rs.resist=""; renderRoll(); return; }
  if (d.rmod!==undefined){ rs.mods = +d.rmod===0?0:num(rs.mods)+(+d.rmod); renderRoll(); return; }
  if (d.rhalf){ rs.half=!rs.half; renderRoll(); return; }
  if (d.rdp){ var sel=document.getElementById("rs-dev"); rs.dpDev=+sel.value; var dv=state.devotions[rs.dpDev]; var n=+d.rdp; if (rs.dpN===n){ rs.dpN=0; } else if (num(dv.dp)<n){ toast("У "+esc(dv.god)+" только "+num(dv.dp)+" ОП"); return; } else rs.dpN=n; renderRoll(); return; }
  if (d.raug){ var v=document.getElementById("rs-aug").value, ab, nm, isP=v[0]==="p"; if (isP){ ab=state.passions[+v.slice(1)]; nm=ab.n; } else { ab=state.skills[+v.slice(1)]; nm=ab.n; } var r=rnd(100), lv=resolve(num(ab.v),r); rs.aug = lv==="crit"?50:lv==="spec"?30:lv==="succ"?20:lv==="fail"?-20:-50; rs.augN=nm+" ("+(r===100?"00":r)+", "+LEVELS[lv][0].toLowerCase()+")"; if (isSuccess(lv)) toast("Усиление удалось — "+esc(nm)+" можно отметить на опыт, если основной бросок успешен"); renderRoll(); return; }
  if (d.bigg!==undefined){ showGaldur(+d.bigg); return; }
  if (d.rgo){ doRoll(); return; }
  if (d.rown){ var ov=num(document.getElementById("rs-own").value); if (ov<1||ov>100){ toast("Введи число 1–100 (00 = 100)"); return; } doRoll(ov); return; }
  if (d.rxp){ var o=getPath(state,rs.xpPath); o.x=!o.x; changed(true); render(); renderRoll(); return; }
  if (d.wyrd){ if (C("pow")<1) return; state.chars.pow=C("pow")-1; if (d.wyrd==="succ"){ rs.res.level="succ"; rs.res.wyrd=true; rs.res.note="Вирд: −1 ВОЛ навсегда"; afterRoll(); } else { var nr=rnd(100); rs.res={roll:nr, t:rs.res.t, level:resolve(rs.res.t,nr), wyrd:true, note:"переброс Вирдом, −1 ВОЛ навсегда"}; afterRoll(); } changed(true); render(); renderRoll(); return; }
  if (d.ct){ rs.ct=d.ct; renderRoll(); return; }
  if (d.dlev){ rs.res.level=d.dlev; rollDamage(); return; }
  if (d.rdmg){ rollDamage(); return; }
  if (d.rloc){ var lr=rollLocation(); render(); var t=document.getElementById("rs-out"); var p=document.createElement("p"); p.className="locres"; p.innerHTML="d20 = "+lr.r+": <b>"+LOCN[lr.k][1]+"</b>"; t.appendChild(p); return; }
  if (d.rrestore){ var dv2=state.devotions[rs.ref], g=+d.rrestore; var mx=maxDP(dv2.v), before=num(dv2.dp); dv2.dp=Math.min(mx, before+g); rs.res.applied=true; rs.extra="ОП: "+before+" → "+dv2.dp+(before+g>mx?" (выше максимума "+mx+" не бывает)":""); changed(true); render(); renderRoll(); return; }
});
sheet.addEventListener("toggle", function(e){ if (rs && e.target.classList && e.target.classList.contains("aid")) rs.aidOpen=e.target.open; }, true);
sheet.addEventListener("input", function(e){ if (e.target.id==="rs-base"){ rs.freeBase=num(e.target.value); var tb=target(); var hb2=sBody.querySelector(".rs-t"); if (hb2) hb2.innerHTML='<b>'+tb+'%</b><small>'+thrLine(tb)+'</small>'; return; } if (e.target.id==="rs-resist"){ rs.resist=e.target.value; var t=target(); var hb=sBody.querySelector(".rs-t"); if (hb) hb.innerHTML='<b>'+t+'%</b><small>'+thrLine(t)+'</small>'; sBody.querySelectorAll("[data-rmult]").forEach(function(x){ x.classList.toggle("on", rs.resist===""&&+x.dataset.rmult===rs.mult); }); } if (e.target.id==="rs-own") rs.own=e.target.value; if (e.target.id==="rs-dev") rs.dpDev=+e.target.value; });
sheet.addEventListener("keydown", function(e){ if (e.key==="Enter" && e.target.id==="rs-own"){ var b=sBody.querySelector("[data-rown]"); if (b) b.click(); } });
document.addEventListener("keydown", function(e){ if (e.key==="Escape"){ if (!modal.hidden) closeModal(); else if (!sheet.hidden) closeRoll(); } });

/* ---------- portrait ---------- */
function loadPortrait(file){ var r=new FileReader(); r.onload=function(){ var img=new Image(); img.onload=function(){ var W=420, sc=Math.min(1,W/img.width), c=document.createElement("canvas"); c.width=Math.round(img.width*sc); c.height=Math.round(img.height*sc); c.getContext("2d").drawImage(img,0,0,c.width,c.height); state.portrait=c.toDataURL("image/jpeg",0.82); changed(true); }; img.src=r.result; }; r.readAsDataURL(file); }

/* ---------- header ---------- */
document.getElementById("btn-lock").addEventListener("click", function(){ state.locked=!state.locked; changed(true); });
document.getElementById("btn-theme").addEventListener("click", function(){ openModal(paletteHtml()); });
function switchTo(id){ persist(); curId=id; state=chars[id]; normalize(state); hiLoc=null; render(); persist(); window.scrollTo(0,0); }
function charsHtml(){
  var ids=Object.keys(chars).sort(function(a,b){ return (chars[b].saved||0)-(chars[a].saved||0); });
  return '<h2>Герои на этом устройстве</h2><ul class="char-list">'+ids.map(function(id){ var c=chars[id], i=c.info||{}, P=A.PERSONALITY[i.personality];
    return '<li class="'+(id===curId?'cur':'')+'"><div class="cl-main">'+(c.portrait?'<img src="'+esc(c.portrait)+'" alt="">':'<span class="cl-ph">ᚨ</span>')+'<div><b>'+esc(i.name||'Без имени')+(i.nick?' «'+esc(i.nick)+'»':'')+'</b><small>'+esc([P?P.n:"",i.animal].filter(Boolean).join(' · ')||'—')+'</small><small>'+(c.saved?new Date(c.saved).toLocaleString('ru-RU'):'')+'</small></div></div>'+
      '<div class="row-btns">'+(id===curId?'<span class="tag">Открыт</span>':'<button type="button" class="btn small" data-open="'+id+'">Открыть</button>')+'<button type="button" class="btn ghost small" data-copy="'+id+'">Копия</button><button type="button" class="btn ghost small" data-askdel="'+id+'">Удалить</button></div></li>'; }).join('')+
    '</ul><div class="row-btns"><button type="button" class="btn" data-newchar="1">+ Новый герой</button><button type="button" class="btn ghost" data-newdemo="1">+ Пример: Ньяль из корбука</button></div><p class="hint">Герои хранятся в памяти этого устройства. Для переноса и резервной копии — «Экспорт» (файл .aov.json) и «Импорт».</p>'+snapsHtml();
}
document.getElementById("btn-chars").addEventListener("click", function(){ openModal(charsHtml()); });
document.getElementById("btn-export").addEventListener("click", function(){ doExport(); });
function doExport(){
  var name=(state.info.name||"hero").replace(/[^\wА-Яа-яЁё-]+/g,"_")+".aov.json", data=JSON.stringify(state,null,2);
  try { var file=new File([data],name,{type:"application/json"}); if (navigator.canShare && navigator.canShare({files:[file]})){ navigator.share({files:[file],title:name}).then(function(){ markExported(); }).catch(function(){}); return; } } catch(x){}
  markExported();
  var a=document.createElement("a"); a.href=URL.createObjectURL(new Blob([data],{type:"application/json"})); a.download=name; document.body.appendChild(a); a.click(); setTimeout(function(){ URL.revokeObjectURL(a.href); a.remove(); },1000);
}
document.getElementById("imp-in").addEventListener("change", function(e){ var f=e.target.files&&e.target.files[0]; if (!f) return; var r=new FileReader(); r.onload=function(){ try { var s=JSON.parse(r.result); if (!s.chars||!s.info) throw 0; normalize(s); s.id=uid(); chars[s.id]=s; switchTo(s.id); setStatus("Импортирован как новый герой","ok"); } catch(x){ setStatus("Это не файл листа викинга","err"); } e.target.value=""; }; r.readAsText(f); });
var deferredInstall=null, instBtn=document.getElementById("btn-install");
var standalone=(window.matchMedia && window.matchMedia("(display-mode: standalone)").matches) || window.navigator.standalone;
window.addEventListener("beforeinstallprompt", function(e){ e.preventDefault(); deferredInstall=e; instBtn.hidden=false; });
if (!standalone && /iphone|ipad|ipod|macintosh/i.test(navigator.userAgent) && "ontouchend" in document) instBtn.hidden=false;
instBtn.addEventListener("click", function(){ if (deferredInstall){ deferredInstall.prompt(); deferredInstall.userChoice.then(function(){ deferredInstall=null; instBtn.hidden=true; }); return; } openModal('<h2>Установка на iPad / iPhone</h2><p>1. Открой эту страницу в Safari.</p><p>2. Нажми «Поделиться» (квадрат со стрелкой).</p><p>3. Выбери «На экран „Домой“».</p><p class="hint">После установки лист открывается как приложение и работает без интернета.</p>'); });
window.addEventListener("appinstalled", function(){ instBtn.hidden=true; });

/* ---------- стрелы и камни ---------- */
function ammoWord(w,cap){ var sl=w&&w.sk==="sling"; return cap?(sl?"Камни":"Стрелы"):(sl?"камень":"стрела"); }
function ammoGen(w){ return w&&w.sk==="sling"?"камней":"стрел"; }
function ammoCtl(ix,w){ return '<span class="ammo'+(num(w.ammo)===0?' empty':'')+'"><span class="ammo-n">'+ammoWord(w,true)+' <b>'+num(w.ammo)+'</b>/'+num(w.ammoMax)+'</span><button type="button" class="pm" data-ammo="'+ix+'" data-d="-1" aria-label="Минус одна">−</button><button type="button" class="pm" data-ammo="'+ix+'" data-d="1" aria-label="Плюс одна">+</button><button type="button" class="chip sm" data-ammo="'+ix+'" data-d="fill">собрать</button></span>'; }

/* ---------- гальдур крупно ---------- */
var galEl=document.getElementById("galdur");
function showGaldur(ix){ var sc=state.runes.scripts[ix]; if (!sc) return;
  galEl.innerHTML='<div class="gal-in"><span class="eyebrow">Гальдур · '+sc.r.length+' рун · '+(2*sc.r.length)+' ОМ</span><h2>'+esc(sc.n||"Надпись")+'</h2>'+
    '<div class="gal-runes">'+sc.r.map(function(k,ri){ var e=(sc.eff||[])[ri]; return '<span class="'+(e>=0?'fx':'')+'"><b>'+RUNE[k].g+'</b><small>'+RUNE[k].n+'</small></span>'; }).join('')+'</div>'+
    '<p class="gal-text">'+(sc.galdur?'«'+esc(sc.galdur)+'»':'Слова гальдура не записаны — добавь их в надписи.')+'</p>'+
    (fxText(sc)?'<p class="gal-fx">'+esc(fxText(sc))+'</p>':'')+'<span class="gal-hint">нажми в любом месте, чтобы закрыть</span></div>';
  galEl.hidden=false; document.body.classList.add("gal-open"); reqWake(); }
galEl.addEventListener("click", function(){ galEl.hidden=true; galEl.innerHTML=""; document.body.classList.remove("gal-open"); });
document.addEventListener("keydown", function(e){ if (e.key==="Escape" && !galEl.hidden){ galEl.click(); } });

/* ---------- экран не гаснет ---------- */
var wakeOn=true, wl=null; try { wakeOn = localStorage.getItem("aov-wake")!=="0"; } catch(e){}
function reqWake(){ if (!wakeOn || wl || !("wakeLock" in navigator) || document.visibilityState!=="visible") return; navigator.wakeLock.request("screen").then(function(l){ wl=l; l.addEventListener("release", function(){ wl=null; }); }).catch(function(){}); }
function setWake(v){ wakeOn=v; try{ localStorage.setItem("aov-wake", v?"1":"0"); }catch(x){} if (v) reqWake(); else if (wl){ wl.release().catch(function(){}); wl=null; } toast(v?"Экран не будет гаснуть, пока лист открыт":"Экран гаснет как обычно"); }
function wakeHtml(){ var ok="wakeLock" in navigator; return '<h2 class="mt">Экран</h2><button type="button" class="tg'+(wakeOn?' on':'')+'" data-wake="1" aria-pressed="'+wakeOn+'">'+(wakeOn?'✓ ':'')+'Не гасить экран, пока лист открыт</button><p class="hint">'+(ok?(wl?'Сейчас экран удерживается включённым.':'Включится при следующем касании листа.'):'Этот браузер не умеет держать экран включённым: на iPad нужна iPadOS 16.4 или новее.')+'</p>'; }
document.addEventListener("visibilitychange", reqWake);
document.addEventListener("pointerdown", reqWake, {passive:true});

/* ---------- резервные копии ---------- */
var EXP="aov-exported", SNAP="aov-snaps";
function readJ(k){ try { return JSON.parse(localStorage.getItem(k)||"{}")||{}; } catch(e){ return {}; } }
function writeJ(k,v){ try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch(e){ return false; } }
function lastExport(){ return readJ(EXP)[curId]||0; }
function markExported(){ var m=readJ(EXP); m[curId]=Date.now(); writeJ(EXP,m); backupDot(); hideNote(); }
function backupDue(){ var t=lastExport(); if (!t) return true; return (state.saved||0)>t+60000 && Date.now()-t>3*864e5; }
function daysAgo(t){ var d=Math.floor((Date.now()-t)/864e5); return d<=0?"сегодня":d===1?"вчера":d+" "+(d%10===1&&d%100!==11?"день":(d%10>=2&&d%10<=4&&(d%100<10||d%100>=20))?"дня":"дней")+" назад"; }
function backupDot(){ var b=document.getElementById("btn-export"); if (!b) return; var due=backupDue(), t=lastExport(); b.classList.toggle("due", due); b.title = t?"Последняя копия: "+daysAgo(t)+(due?" — пора сделать новую":""):"Резервной копии ещё не было"; }
function snapshot(why){ var all=readJ(SNAP), list=all[curId]||[], c=JSON.parse(JSON.stringify(state)); c.portrait=""; if (c.combat) c.combat.art=""; list.unshift({at:Date.now(), why:why||"", data:c}); all[curId]=list.slice(0,3); if (!writeJ(SNAP,all)){ all[curId]=list.slice(0,1); writeJ(SNAP,all); } }
function snapsHtml(){ var list=readJ(SNAP)[curId]||[]; if (!list.length) return '<p class="hint">Снимков пока нет — они сохраняются в конце каждой сессии (последние три).</p>';
  return '<h3 class="mt">Снимки этого героя</h3><ul class="snap-list">'+list.map(function(x,i){ return '<li><span>'+new Date(x.at).toLocaleString("ru-RU",{day:"2-digit",month:"2-digit",hour:"2-digit",minute:"2-digit"})+(x.why?' · '+esc(x.why):'')+'</span><button type="button" class="btn ghost small" data-snap="'+i+'">Вернуть</button></li>'; }).join('')+'</ul><p class="hint">Перед возвратом текущее состояние тоже сохраняется снимком, так что откат можно отменить. Портрет и боевой арт не меняются.</p>'; }
function restoreSnap(i){ var list=readJ(SNAP)[curId]||[], x=list[i]; if (!x) return; var keepP=state.portrait, keepA=state.combat&&state.combat.art, keepBg=state.combat&&state.combat.bg; snapshot("до отката"); var c=JSON.parse(JSON.stringify(x.data)); c.id=curId; c.portrait=keepP; normalize(c); c.combat.art=keepA||""; if (keepBg) c.combat.bg=keepBg; chars[curId]=c; state=c; closeModal(); render(); persist(); toast("Лист возвращён к снимку от "+new Date(x.at).toLocaleString("ru-RU")); }
var noteEl=document.createElement("div"); noteEl.className="bk-note"; noteEl.hidden=true; document.body.appendChild(noteEl);
function hideNote(){ noteEl.hidden=true; }
noteEl.addEventListener("click", function(e){ var b=e.target.closest("button"); if (!b) return; if (b.dataset.nexp){ doExport(); } if (b.dataset.nlater){ try{ localStorage.setItem("aov-note-day", new Date().toDateString()); }catch(x){} hideNote(); } if (b.dataset.ninst){ hideNote(); instBtn.click(); } });
function bootNote(){ var day=""; try{ day=localStorage.getItem("aov-note-day")||""; }catch(x){} if (day===new Date().toDateString()) return;
  var ios=/iphone|ipad|ipod|macintosh/i.test(navigator.userAgent) && "ontouchend" in document, t=lastExport(), msg="";
  if (ios && !standalone && location.protocol!=="file:") msg='Лист открыт во вкладке Safari — без использования Safari может стереть его память через неделю. Установи лист на экран «Домой» и делай копии.';
  else if (backupDue()) msg=t?'Последняя резервная копия героя — '+daysAgo(t)+'. Сохрани свежую в «Файлы».':'У героя ещё нет резервной копии. Сохрани её в «Файлы» — пригодится, если планшет потеряет данные.';
  if (!msg) return;
  noteEl.innerHTML='<p>'+msg+'</p><div class="row-btns">'+(ios&&!standalone&&location.protocol!=="file:"?'<button type="button" class="btn small" data-ninst="1">Как установить</button>':'')+'<button type="button" class="btn small" data-nexp="1">Сделать копию</button><button type="button" class="btn ghost small" data-nlater="1">Позже</button></div>';
  noteEl.hidden=false; }

/* ---------- конец сессии ---------- */
var endRun=null, END_STEPS=["Опыт","Боги","Отдых","Сага и копия"];
function endOptList(){
  var ready=state.runes.scripts.filter(function(x){return x.state==="ready";}), seid=state.seidr.spells.filter(function(x){return x.active;}), hurt=num(state.hp.lost)>0||A.LOCS.some(function(l){return num(state.hp.loc[l[0]])>0;}), am=state.weapons.filter(function(w){ return w.ammoMax!=null && num(w.ammo)<num(w.ammoMax); });
  var L=[];
  L.push(["mp","ОМ восстановлены — ночь отдыха", "сейчас "+mpAvail()+" из "+mpMax()+(num(state.mp.spent)?", потрачено "+num(state.mp.spent):"")]);
  if (ready.length) L.push(["dawn","Рассвет — вырезанные надписи угасли", ready.map(function(x){return x.n;}).join(", ")+" · вернётся "+mpLockedRunes()+" ОМ залога"]);
  if (seid.length) L.push(["seid","Заклинания сейда закончились", seid.map(function(x){return x.n;}).join(", ")]);
  if (hurt) L.push(["heal","Прошла неделя — лечение", "+"+healRate()+" ОЗ в каждой раненой зоне"]);
  if (am.length) L.push(["ammo","Пополнить колчан", am.map(function(w){ return w.n+": "+num(w.ammo)+" → "+w.ammoMax; }).join(", ")]);
  return L;
}
function endHtml(){
  var st=endRun.step, h='<h2>Конец сессии</h2><ol class="end-steps">'+END_STEPS.map(function(n,i){ return '<li><button type="button" class="'+(i===st?'on':i<st?'done':'')+'" data-endgo="'+i+'">'+(i<st?'✓ ':(i+1)+' · ')+n+'</button></li>'; }).join('')+'</ol><div class="end-body">';
  if (st===0){
    var any = xpRun || xpList().length;
    if (!any) h+='<p>Отметок опыта нет. Квадратики ставятся рядом с умением, страстью или Поклонением после успеха в напряжённой ситуации.</p>';
    else h+=xpHtml().replace(/<h2>/,'<h3>').replace(/<\/h2>/,'</h3>').replace('<button type="button" class="btn ghost" data-close="1">Закрыть</button>','');
  }
  if (st===1){
    if (!state.devotions.length) h+='<p>Поклонений нет.</p>';
    else { h+='<p class="hint">Очки поклонения возвращаются броском Поклонения на жертвоприношении или празднике: успех +1, особый +2, крит +3, не выше максимума. Бросай только за тех богов, кому был обряд.</p><div class="end-wor">';
      state.devotions.forEach(function(d,i){ var mx=maxDP(d.v), r=endRun.wor[i];
        h+='<div class="end-row"><span><b>'+esc(d.god||"Бог")+'</b> <small>Поклонение '+num(d.v)+'% · ОП '+num(d.dp)+' из '+mx+'</small></span>'+
          (r?'<span class="end-res lv-'+r.level+'">'+(r.roll===100?'00':r.roll)+' — '+LEVELS[r.level][0]+(r.gain?' · +'+r.gain+' ОП':'')+'</span>':(num(d.dp)>=mx?'<span class="dim">ОП полны</span>':'<button type="button" class="btn small" data-endwor="'+i+'">Обряд — бросок</button>'))+'</div>'; });
      h+='</div>'; }
  }
  if (st===2){
    var L=endOptList();
    if (endRun.applied) h+='<div class="end-done">'+endRun.applied.map(function(x){ return '<p>✓ '+esc(x)+'</p>'; }).join('')+'</div>';
    else { h+='<p class="hint">Отметь, что произошло между сессиями, и нажми «Применить».</p><div class="end-opts">'+L.map(function(o){ var on=endRun.opt[o[0]]; return '<button type="button" class="end-opt'+(on?' on':'')+'" data-endopt="'+o[0]+'" aria-pressed="'+!!on+'"><i>'+(on?'✓':'')+'</i><span><b>'+o[1]+'</b><small>'+esc(o[2])+'</small></span></button>'; }).join('')+'</div><div class="row-btns"><button type="button" class="btn" data-endapply="1">Применить</button></div>'; }
  }
  if (st===3){
    var t=lastExport();
    h+='<label class="fld"><span>Что было на сессии — строка в сагу (можно оставить пустым)</span><textarea id="end-note" rows="3" placeholder="Например: поход за камнем для капища — тролль убит одним выстрелом">'+esc(endRun.note||"")+'</textarea></label>'+
      '<p class="hint">Лист сохранит снимок (последние три — в «Герои») и предложит сохранить файл копии. На iPad выбери «Сохранить в Файлы».'+(t?' Прошлая копия — '+daysAgo(t)+'.':'')+'</p>'+
      '<div class="row-btns"><button type="button" class="btn" data-endfinish="1">Записать и сохранить копию</button><button type="button" class="btn ghost" data-endfinish="nocopy">Без файла</button></div>';
  }
  h+='</div><div class="end-nav">'+(st>0?'<button type="button" class="btn ghost small" data-endgo="'+(st-1)+'">← Назад</button>':'<span></span>')+(st<3?'<button type="button" class="btn small" data-endgo="'+(st+1)+'">Далее →</button>':'')+'</div>';
  return h;
}
function endClick(d){
  if (d.endgo!==undefined){ var n=document.getElementById("end-note"); if (n) endRun.note=n.value; endRun.step=+d.endgo; mBody.innerHTML=endHtml(); return true; }
  if (d.endwor!==undefined){ var i=+d.endwor, dv=state.devotions[i], r=rnd(100), lvl=resolve(num(dv.v),r), gain=lvl==="crit"?3:lvl==="spec"?2:lvl==="succ"?1:0, before=num(dv.dp); dv.dp=Math.min(maxDP(dv.v), before+gain); endRun.wor[i]={roll:r, level:lvl, gain:dv.dp-before}; endRun.log.push((dv.god||"Бог")+": обряд "+r+" — "+LEVELS[lvl][0].toLowerCase()+(dv.dp-before?", +"+(dv.dp-before)+" ОП":"")); changed(false); mBody.innerHTML=endHtml(); return true; }
  if (d.endopt){ endRun.opt[d.endopt]=!endRun.opt[d.endopt]; mBody.innerHTML=endHtml(); return true; }
  if (d.endapply){ var o=endRun.opt, done=[];
    if (o.dawn){ var n2=0; state.runes.scripts.forEach(function(x){ if (x.state==="ready"){ x.state="plan"; n2++; } }); done.push("Рассвет: угасло надписей — "+n2); }
    if (o.seid){ state.seidr.spells.forEach(function(x){ x.active=false; x.lock=0; }); done.push("Сейд: заклинания закончились"); }
    if (o.mp){ state.mp.spent=0; done.push("ОМ восстановлены: "+mpAvail()+" из "+mpMax()); }
    if (o.heal){ var hr=healRate(), healed=0; A.LOCS.forEach(function(l){ var k=l[0], dmg=num(state.hp.loc[k]); if (dmg>0){ var x=Math.min(hr,dmg); state.hp.loc[k]=dmg-x; healed+=x; } }); state.hp.lost=Math.max(0,num(state.hp.lost)-Math.max(healed,Math.min(hr,num(state.hp.lost)))); done.push("Лечение: +"+healed+" ОЗ, теперь "+hpCur()+" из "+hpMax()); }
    if (o.ammo){ state.weapons.forEach(function(w){ if (w.ammoMax!=null) w.ammo=num(w.ammoMax); }); done.push("Колчан пополнен"); }
    if (!done.length) done.push("Ничего не менялось");
    endRun.applied=done; endRun.log=endRun.log.concat(done); changed(true); mBody.innerHTML=endHtml(); return true; }
  if (d.endfinish){ var note=(document.getElementById("end-note")||{}).value||"", date=new Date().toLocaleDateString("ru-RU");
    if (note.trim()) state.notes.saga=(state.notes.saga?state.notes.saga.replace(/\s+$/,"")+"\n":"")+date+" — "+note.trim();
    if (endRun.log.length) state.notes.xplog=date+" — конец сессии\n"+endRun.log.map(function(x){return "• "+x;}).join("\n")+(state.notes.xplog?"\n\n"+state.notes.xplog:"");
    var copy=d.endfinish!=="nocopy"; endRun=null; xpRun=null; closeModal(); changed(true); persist(); snapshot("конец сессии "+date);
    if (copy) doExport(); toast("Сессия закрыта"+(copy?" — сохрани файл копии":" — снимок сохранён")); return true; }
  return false;
}
document.getElementById("btn-end").addEventListener("click", function(){ var L=endOptList(), opt={}; L.forEach(function(o){ opt[o[0]] = o[0]==="mp"||o[0]==="dawn"||o[0]==="seid"; }); endRun={step:0, wor:{}, opt:opt, applied:null, log:[], note:""}; xpRun=null; openModal(endHtml()); });

/* ---------- boot ---------- */
render(); persist(); backupDot(); setTimeout(bootNote, 1200); reqWake();
if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(function(){});
if ("serviceWorker" in navigator && location.protocol!=="file:") navigator.serviceWorker.register("sw.js").catch(function(){});
window.__aov = {resolve:resolve, critOf:critOf, specOf:specOf, fumbleFrom:fumbleFrom, catMod:catMod, catAuto:catAuto, hpMax:hpMax, locMax:locMax, dmString:dmString, state:function(){return state;}, parseDice:parseDice, maxDice:maxDice};
})();
