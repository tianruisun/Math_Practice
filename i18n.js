const I18N={
en:{'app.title':'Maths Practice','nav.home':'Home','nav.progress':'Progress','year':'Year {n}',
'home.year':'Year level','home.topic':'Topic','home.diff':'Difficulty','home.count':'Number of questions','home.start':'Start practice',
'topic.mixed':'Mixed','topic.add':'Add & subtract','topic.mul':'Multiply & divide','topic.frac':'Fractions','topic.dec':'Decimals','topic.geo':'Geometry & measurement','topic.pct':'Percentages & ratio','topic.alg':'Algebra',
'diff.1':'Easy','diff.2':'Medium','diff.3':'Hard',
'quiz.of':'Question {i} of {n}','quiz.ph':'Type your answer','quiz.check':'Check','quiz.next':'Next question','quiz.finish':'See results','quiz.right':'Correct! Well done.','quiz.wrong':'Not quite.','quiz.hint':'Fractions can be written like 3/4. Units are optional.','quiz.quit':'Quit',
'res.title':'Results','res.score':'You got {c} out of {n}','res.yours':'Your answer: {a}','res.blank':'(no answer)','res.parent':'Parent view: show answers','res.lock':'Hide answers','res.answer':'Answer: {a}','res.again':'Practise again','res.home':'Home',
'pin.create':'Create a 4-digit parent PIN','pin.enter':'Enter parent PIN','pin.ok':'OK','pin.cancel':'Cancel','pin.bad':'Wrong PIN.','pin.short':'Please use exactly 4 digits.',
'prog.title':'Progress','prog.sessions':'Sessions','prog.acc':'Overall accuracy','prog.bytopic':'By topic','prog.recent':'Recent sessions','prog.none':'No practice yet. Start a quiz!','prog.reset':'Reset all data','prog.confirm':'Delete all saved progress on this device?',
'q.calc':'Work out: {e}','q.frac':'Work out {e}. Give your answer as a fraction in simplest form.','q.pct':'What is {p}% of {n}?','q.ratio':'Share {n} in the ratio {a}:{b}. How much is the larger share?','q.alg':'Solve for x: {e}',
'q.perim':'A rectangle is {a} cm long and {b} cm wide. Find its perimeter (cm).','q.area':'A rectangle is {a} cm long and {b} cm wide. Find its area (cm²).','q.tri':'A triangle has base {a} cm and height {b} cm. Find its area (cm²).','q.hyp':'A right-angled triangle has shorter sides {a} cm and {b} cm. Find the longest side (cm).','q.leg':'A right-angled triangle has hypotenuse {c} cm and one other side {a} cm. Find the third side (cm).'},
zh:{'app.title':'数学练习','nav.home':'首页','nav.progress':'学习进度','year':'{n}年级',
'home.year':'年级','home.topic':'题型','home.diff':'难度','home.count':'题目数量','home.start':'开始练习',
'topic.mixed':'综合','topic.add':'加减法','topic.mul':'乘除法','topic.frac':'分数','topic.dec':'小数','topic.geo':'几何与测量','topic.pct':'百分数与比','topic.alg':'代数',
'diff.1':'容易','diff.2':'中等','diff.3':'困难',
'quiz.of':'第 {i} 题，共 {n} 题','quiz.ph':'请输入答案','quiz.check':'提交','quiz.next':'下一题','quiz.finish':'查看结果','quiz.right':'回答正确！做得好。','quiz.wrong':'不太对。','quiz.hint':'分数可以写成 3/4，单位可写可不写。','quiz.quit':'退出',
'res.title':'练习结果','res.score':'你答对了 {c} 题，共 {n} 题','res.yours':'你的答案：{a}','res.blank':'（未作答）','res.parent':'家长查看：显示答案','res.lock':'隐藏答案','res.answer':'正确答案：{a}','res.again':'再练一次','res.home':'返回首页',
'pin.create':'设置4位数家长密码','pin.enter':'请输入家长密码','pin.ok':'确定','pin.cancel':'取消','pin.bad':'密码错误。','pin.short':'请输入4位数字。',
'prog.title':'学习进度','prog.sessions':'练习次数','prog.acc':'总正确率','prog.bytopic':'各题型正确率','prog.recent':'最近练习','prog.none':'还没有练习记录，开始做题吧！','prog.reset':'清除所有数据','prog.confirm':'确定删除本设备上的所有学习记录吗？',
'q.calc':'计算：{e}','q.frac':'计算 {e}，答案用最简分数表示。','q.pct':'{n} 的 {p}% 是多少？','q.ratio':'把 {n} 按 {a}:{b} 的比例分配，较大的一份是多少？','q.alg':'解方程，求 x：{e}',
'q.perim':'一个长方形长 {a} 厘米，宽 {b} 厘米，求周长（厘米）。','q.area':'一个长方形长 {a} 厘米，宽 {b} 厘米，求面积（平方厘米）。','q.tri':'一个三角形底边 {a} 厘米，高 {b} 厘米，求面积（平方厘米）。','q.hyp':'一个直角三角形的两条直角边分别为 {a} 厘米和 {b} 厘米，求斜边（厘米）。','q.leg':'一个直角三角形的斜边为 {c} 厘米，一条直角边为 {a} 厘米，求另一条直角边（厘米）。'}};
let LANG=(()=>{try{const s=localStorage.getItem('mp-lang');if(s)return s;}catch(e){}return (typeof navigator!=='undefined'&&(navigator.language||'').startsWith('zh'))?'zh':'en';})();
function t(k,v){let s=I18N[LANG][k]??I18N.en[k]??k;if(v)s=s.replace(/\{(\w+)\}/g,(_,n)=>v[n]??'');return s;}
function setLang(l){LANG=l;try{localStorage.setItem('mp-lang',l);}catch(e){}applyI18n();}
function applyI18n(){document.documentElement.lang=LANG==='zh'?'zh-CN':'en';document.title=t('app.title');
 document.querySelectorAll('[data-i18n]').forEach(e=>e.textContent=t(e.dataset.i18n));
 document.querySelectorAll('[data-i18n-ph]').forEach(e=>e.placeholder=t(e.dataset.i18nPh));
 const b=document.getElementById('lang');if(b)b.textContent=LANG==='zh'?'EN':'中文';}
if(typeof module!=='undefined')module.exports={I18N};
