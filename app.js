const $=s=>document.querySelector(s);
const S={screen:'home',set:{year:5,topic:'mixed',diff:1,n:10},q:[],i:0,ans:[],fb:null,parent:false};
const ld=(k,d)=>{try{return JSON.parse(localStorage.getItem(k))??d;}catch(e){return d;}};
const sv=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v));}catch(e){}};
const mkEl=(tag,txt,cls)=>{const e=document.createElement(tag);if(txt!==undefined)e.textContent=txt;if(cls)e.className=cls;return e;};
function go(n){S.screen=n;['home','quiz','results','progress'].forEach(s=>$('#'+s).hidden=s!==n);render();}
function render(){applyI18n();({home:renderHome,quiz:renderQuiz,results:renderResults,progress:renderProgress})[S.screen]();}
function fill(sel,opts,val){sel.innerHTML='';opts.forEach(([v,l])=>sel.append(Object.assign(mkEl('option',l),{value:v})));if(opts.some(o=>String(o[0])===String(val)))sel.value=val;}
function renderHome(){const y=+($('#year').value||S.set.year);
 fill($('#year'),[4,5,6,7,8,9,10].map(n=>[n,t('year',{n})]),y);
 fill($('#topic'),[['mixed',t('topic.mixed')],...topicsFor(y).map(k=>[k,t('topic.'+k)])],$('#topic').value||S.set.topic);
 fill($('#diff'),[1,2,3].map(n=>[n,t('diff.'+n)]),$('#diff').value||S.set.diff);
 fill($('#count'),[5,10,15,20].map(n=>[n,n]),$('#count').value||S.set.n);}
function start(){S.set={year:+$('#year').value,topic:$('#topic').value,diff:+$('#diff').value,n:+$('#count').value};newQuiz();}
function newQuiz(){const {year,topic,diff,n}=S.set,seen=new Set();S.q=[];
 for(let k=0;S.q.length<n&&k<n*40;k++){const q=genQuestion(year,topic,diff),key=q.k+JSON.stringify(q.v);if(!seen.has(key)){seen.add(key);S.q.push(q);}}
 S.i=0;S.ans=[];S.fb=null;S.parent=false;$('#ans').value='';$('#ans').disabled=false;go('quiz');$('#ans').focus();}
function renderQuiz(){const q=S.q[S.i];if(!q)return;
 $('#prog').textContent=t('quiz.of',{i:S.i+1,n:S.q.length});$('#qtext').textContent=t(q.k,q.v);
 const fb=$('#fb');fb.textContent=S.fb===null?'':t(S.fb?'quiz.right':'quiz.wrong');fb.className=S.fb===null?'':S.fb?'ok':'bad';
 $('#check').hidden=S.fb!==null;$('#next').hidden=S.fb===null;
 $('#next').textContent=t(S.i+1<S.q.length?'quiz.next':'quiz.finish');}
function submit(){if(S.fb!==null)return;const a=$('#ans').value,ok=checkAnswer(S.q[S.i],a);S.ans.push({a,ok});S.fb=ok;$('#ans').disabled=true;renderQuiz();$('#next').focus();}
function next(){if(S.fb===null)return;if(++S.i>=S.q.length){saveSession();go('results');return;}
 S.fb=null;$('#ans').value='';$('#ans').disabled=false;renderQuiz();$('#ans').focus();}
function saveSession(){const by={};S.q.forEach((q,i)=>{const b=by[q.topic]=by[q.topic]||[0,0];b[1]++;if(S.ans[i].ok)b[0]++;});
 const h=ld('mp-hist',[]);h.push({d:Date.now(),y:S.set.year,t:S.set.topic,f:S.set.diff,n:S.q.length,c:S.ans.filter(a=>a.ok).length,by,
  wrong:S.q.map((q,i)=>S.ans[i].ok?null:{topic:q.topic,year:q.year,diff:q.diff,k:q.k,v:q.v,show:q.show}).filter(Boolean)});sv('mp-hist',h.slice(-200));}
function renderResults(){const c=S.ans.filter(a=>a.ok).length;$('#score').textContent=t('res.score',{c,n:S.q.length});
 $('#parent').textContent=t(S.parent?'res.lock':'res.parent');const ol=$('#list');ol.innerHTML='';
 S.q.forEach((q,i)=>{const a=S.ans[i],li=mkEl('li',undefined,a.ok?'ok':'bad');li.append(mkEl('p',(a.ok?'✓ ':'✗ ')+t(q.k,q.v)),
  mkEl('p',t('res.yours',{a:a.a.trim()||t('res.blank')}),'sub'));if(S.parent)li.append(mkEl('p',t('res.answer',{a:q.show}),'sub key'));ol.append(li);});}
function pin(){return new Promise(res=>{const d=$('#pinDlg'),saved=ld('mp-pin',null);$('#pinTitle').textContent=t(saved?'pin.enter':'pin.create');$('#pinIn').value='';$('#pinMsg').textContent='';
 const done=v=>{d.close();res(v);};$('#pinOk').onclick=()=>{const v=$('#pinIn').value;if(!/^\d{4}$/.test(v)){$('#pinMsg').textContent=t('pin.short');return;}
  if(!saved){sv('mp-pin',v);done(true);}else if(v===saved)done(true);else $('#pinMsg').textContent=t('pin.bad');};
 $('#pinCancel').onclick=()=>done(false);d.showModal();$('#pinIn').focus();});}
function renderProgress(){const h=ld('mp-hist',[]),box=$('#pbody');box.innerHTML='';
 if(!h.length){box.append(mkEl('p',t('prog.none')));return;}
 const n=h.reduce((s,x)=>s+x.n,0),c=h.reduce((s,x)=>s+x.c,0),by={};h.forEach(x=>{for(const k in x.by){const b=by[k]=by[k]||[0,0];b[0]+=x.by[k][0];b[1]+=x.by[k][1];}});
 const st=mkEl('div',undefined,'stats');[[t('prog.sessions'),h.length],[t('prog.acc'),Math.round(100*c/n)+'%']].forEach(([l,v])=>{const d=mkEl('div');d.append(mkEl('b',v),mkEl('span',l));st.append(d);});box.append(st,mkEl('h3',t('prog.bytopic')));
 Object.keys(by).forEach(k=>{const p=Math.round(100*by[k][0]/by[k][1]),r=mkEl('div',undefined,'bar');r.append(mkEl('span',`${t('topic.'+k)} ${p}%`));const tr=mkEl('i');const f=mkEl('u');f.style.width=p+'%';tr.append(f);r.append(tr);box.append(r);});
 box.append(mkEl('h3',t('prog.recent')));const ul=mkEl('ul');h.slice(-5).reverse().forEach(x=>ul.append(mkEl('li',`${new Date(x.d).toLocaleDateString(LANG==='zh'?'zh-CN':'en-GB')}  ·  ${t('year',{n:x.y})}  ·  ${x.c}/${x.n}`)));box.append(ul);}
$('#nHome').onclick=()=>go('home');$('#nProg').onclick=()=>go('progress');$('#lang').onclick=()=>{setLang(LANG==='zh'?'en':'zh');render();};
$('#year').onchange=renderHome;$('#start').onclick=start;$('#check').onclick=submit;$('#next').onclick=next;$('#quit').onclick=()=>go('home');
$('#ans').addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();submit();}});
$('#parent').onclick=async()=>{if(S.parent)S.parent=false;else S.parent=await pin();renderResults();};
$('#again').onclick=newQuiz;$('#toHome').onclick=()=>go('home');
$('#reset').onclick=()=>{if(confirm(t('prog.confirm'))){try{localStorage.removeItem('mp-hist');}catch(e){}renderProgress();}};
if('serviceWorker'in navigator)navigator.serviceWorker.register('./sw.js');
go('home');
