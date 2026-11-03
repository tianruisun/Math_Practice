const R=(a,b)=>Math.floor(Math.random()*(b-a+1))+a,pick=a=>a[R(0,a.length-1)],gcd=(a,b)=>b?gcd(b,a%b):Math.abs(a);
const M='\u2212',fm=n=>n<0?M+(-n):String(n),sg=n=>n<0?` ${M} ${-n}`:` + ${n}`;
const TOPICS={add:4,mul:4,frac:4,dec:4,geo:4,pct:6,alg:7};
const topicsFor=y=>Object.keys(TOPICS).filter(k=>TOPICS[k]<=y);
const mk=(k,v,ans,show,tol=0)=>({k,v,ans,show,tol});
const G={
add(y,d){const hi=10**Math.min(2+Math.floor((y-4)/3)+d,6);let a=R(hi/10,hi-1),b=R(hi/10,hi-1);const op=pick(['+',M]);
 if(op===M&&b>a)[a,b]=[b,a];const r=op==='+'?a+b:a-b;return mk('q.calc',{e:`${a} ${op} ${b}`},r,String(r));},
mul(y,d){const b=R(2,d<3?12:25),a=R(2,10**Math.min(d+(y>6?1:0),3));
 return Math.random()<.4?mk('q.calc',{e:`${a*b} ÷ ${b}`},a,String(a)):mk('q.calc',{e:`${a} × ${b}`},a*b,String(a*b));},
frac(y,d){const op=pick(y>=7?['+',M,'×']:y>=5?['+',M]:['+']);let d1=pick([2,3,4,5,6,8,10]);
 let d2=d===1?d1:d===2?d1*pick([1,2]):pick([3,4,5,6,7]),n1=R(1,d1-1),n2=R(1,d2-1);
 if(op===M&&n1*d2<n2*d1)[n1,d1,n2,d2]=[n2,d2,n1,d1];
 const num=op==='+'?n1*d2+n2*d1:op===M?n1*d2-n2*d1:n1*n2,den=d1*d2;if(num<=0)return G.frac(y,d);
 const g=gcd(num,den),a=num/g,b=den/g;return mk('q.frac',{e:`${n1}/${d1} ${op} ${n2}/${d2}`},num/den,b===1?String(a):`${a}/${b}`,1e-9);},
dec(y,d){if(y>=7&&Math.random()<.4){const ai=R(11,99),b=R(2,9),r=Number((ai*b/10).toFixed(1));return mk('q.calc',{e:`${(ai/10).toFixed(1)} × ${b}`},r,String(r));}
 const dp=d===1?1:2,sc=10**dp,hi=d===3?9999:999;let ai=R(100,hi),bi=R(100,hi);const op=pick(['+',M]);if(op===M&&bi>ai)[ai,bi]=[bi,ai];
 const r=Number(((op==='+'?ai+bi:ai-bi)/sc).toFixed(dp));return mk('q.calc',{e:`${(ai/sc).toFixed(dp)} ${op} ${(bi/sc).toFixed(dp)}`},r,String(r),0.005);},
pct(y,d){if(y>=7&&Math.random()<.35){let a=R(1,5),b=R(1,8);if(a===b)b++;const n=(a+b)*R(2,10),r=Math.max(a,b)*n/(a+b);return mk('q.ratio',{n,a,b},r,String(r));}
 const p=pick(d===1?[10,50,25,20]:d===2?[5,15,30,40,75]:[12,35,45,60,8]),n=(100/gcd(p,100))*R(1,d*10),r=p*n/100;return mk('q.pct',{p,n},r,String(r));},
alg(y,d){const x=R(y<9?1:-5,12);let e;
 if(d===1){const b=R(1,15);e=`x + ${b} = ${x+b}`;}else if(d===2||(d===3&&false)){const a=R(2,9);e=`${a}x = ${fm(a*x)}`;}
 else if(y<9){const a=R(2,9),b=R(-9,9)||5;e=`${a}x${sg(b)} = ${fm(a*x+b)}`;}
 else{const a=R(3,9),c=R(1,a-1),b=R(-9,9),dd=(a-c)*x+b;e=`${a}x${sg(b)} = ${c}x${sg(dd)}`;}
 return mk('q.alg',{e},x,String(x));},
geo(y,d){const ks=['perim','area'];if(y>=6)ks.push('tri');if(y>=9)ks.push('hyp','leg');const k=pick(ks),s=d===1?12:d===2?30:60;
 if(k==='perim'){const a=R(3,s),b=R(2,s),r=2*(a+b);return mk('q.perim',{a,b},r,r+' cm');}
 if(k==='area'){const a=R(3,s),b=R(2,s),r=a*b;return mk('q.area',{a,b},r,r+' cm²');}
 if(k==='tri'){const a=R(3,s),b=2*R(2,Math.ceil(s/2)),r=a*b/2;return mk('q.tri',{a,b},r,r+' cm²');}
 const T=pick([[3,4,5],[5,12,13],[8,15,17],[7,24,25]]),m=R(1,d+1),[a,b,c]=T.map(v=>v*m);
 return k==='hyp'?mk('q.hyp',{a,b},c,c+' cm'):mk('q.leg',{c,a},b,b+' cm');}};
function genQuestion(year,topic,diff){const t=topic==='mixed'||!TOPICS[topic]||TOPICS[topic]>year?pick(topicsFor(year)):topic;return{topic:t,year,diff,...G[t](year,diff)};}
function checkAnswer(q,input){
 let s=String(input).replace(/[０-９]/g,c=>String.fromCharCode(c.charCodeAt(0)-0xFEE0)).replace(/／/g,'/').replace(/．/g,'.').replace(/[−–—]/g,'-').trim();
 const mx=s.match(/^(\d+)\s+(\d+)\/(\d+)$/);if(mx&&+mx[3])return Math.abs(+mx[1]+mx[2]/mx[3]-q.ans)<=Math.max(q.tol,1e-9);
 s=s.replace(/[\s,，]/g,'').replace(/^x=/i,'');
 const m=s.match(/^(-?\d*\.?\d+)(?:\/(\d+))?(.*)$/);if(!m||!/^[A-Za-z\u4e00-\u9fa5²³%°]{0,8}\^?\d?$/.test(m[3]))return false;
 let v=parseFloat(m[1]);if(m[2]!==undefined){const dn=parseInt(m[2],10);if(!dn)return false;v/=dn;}
 return Math.abs(v-q.ans)<=Math.max(q.tol,1e-9);}
if(typeof module!=='undefined')module.exports={genQuestion,checkAnswer,topicsFor,TOPICS};
