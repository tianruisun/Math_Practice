/* General ability 综合能力 (multiple choice): number & letter series, codes, logical deduction,
   symbol puzzles, visual patterns, spatial reasoning & counting.
   Questions avoid language-specific wordplay, so the English and Chinese versions are the same puzzle. */
(function (root) {
  'use strict';
  const G = root.Gen || require('./gen-core.js');
  const { R, pick, shuffle, MINUS, num, both, mc, nearNums } = G;
  const reg = (topic, minYear, fn) => G.register('ga', topic, minYear, fn);
  const L = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const letter = i => L[((i % 26) + 26) % 26];

  /* ---------- Number series 数字规律 ---------- */
  reg('gseries', 4, (y, d) => {
    const lv = (y - 4) + d * 2;       // 3 .. 14
    const rules = [
      ['add', 1], ['mul', 2], ['alt', 3], ['grow', 3], ['square', 4], ['fib', 5], ['inter', 6], ['mul2add', 6], ['cube', 7], ['prime', 7], ['diff2', 8], ['tri', 5], ['altsign', 9], ['frac', 10]
    ].filter(([, m]) => m <= lv).map(([k]) => k);
    const k = pick(rules);
    let seq, next, en, zh;
    const a = R(1, 20), s = R(2, 9 + d * 3);
    switch (k) {
      case 'add': seq = [0, 1, 2, 3, 4].map(i => a + i * s); next = a + 5 * s; en = `add ${s} each time`; zh = `每次加 ${s}`; break;
      case 'mul': { const r = R(2, 4), b = R(1, 5); seq = [0, 1, 2, 3, 4].map(i => b * r ** i); next = b * r ** 5; en = `multiply by ${r} each time`; zh = `每次乘 ${r}`; break; }
      case 'alt': { const p = R(3, 12), q = R(1, p - 1); seq = [a]; for (let i = 1; i < 6; i++) seq.push(seq[i - 1] + (i % 2 ? p : -q)); next = seq.pop(); en = `alternately +${p} and ${MINUS}${q}`; zh = `交替 +${p}、${MINUS}${q}`; break; }
      case 'grow': { const st = R(1, 4); seq = [a]; for (let i = 1; i < 6; i++) seq.push(seq[i - 1] + st + i - 1); next = seq.pop(); en = `the gaps go up by 1: +${st}, +${st + 1}, +${st + 2}…`; zh = `差依次加 1：+${st}，+${st + 1}，+${st + 2}……`; break; }
      case 'square': { const b = R(1, 8); seq = [0, 1, 2, 3, 4].map(i => (b + i) ** 2); next = (b + 5) ** 2; en = 'square numbers'; zh = '平方数'; break; }
      case 'tri': { seq = [1, 2, 3, 4, 5].map(i => i * (i + 1) / 2 + a); next = 21 + a; en = 'gaps 2, 3, 4, 5, 6'; zh = '差为 2，3，4，5，6'; break; }
      case 'fib': { const p = R(1, 6), q = R(p, 9); seq = [p, q]; for (let i = 2; i < 7; i++) seq.push(seq[i - 1] + seq[i - 2]); next = seq.pop(); en = 'each term is the sum of the two before it'; zh = '每一项等于前两项之和'; break; }
      case 'inter': { const p = R(1, 9), q = R(20, 40), sp = R(2, 5), sq = R(2, 6); seq = []; for (let i = 0; i < 7; i++) seq.push(i % 2 ? q - sq * ((i - 1) / 2) : p + sp * (i / 2)); next = seq.pop(); en = `two series interleaved: ${p}, ${p + sp}, … (+${sp}) and ${q}, ${q - sq}, … (${MINUS}${sq})`; zh = `两个数列交错：奇数位 +${sp}，偶数位 ${MINUS}${sq}`; break; }
      case 'mul2add': { const m = R(2, 3), c = R(-3, 4) || 1; seq = [R(1, 5)]; for (let i = 1; i < 6; i++) seq.push(seq[i - 1] * m + c); next = seq.pop(); en = `× ${m} then ${c < 0 ? MINUS + -c : '+ ' + c}`; zh = `乘 ${m} 再${c < 0 ? '减 ' + -c : '加 ' + c}`; break; }
      case 'cube': { const b = R(1, 4); seq = [0, 1, 2, 3, 4].map(i => (b + i) ** 3); next = (b + 5) ** 3; en = 'cube numbers'; zh = '立方数'; break; }
      case 'prime': { const P = [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47, 53]; const st = R(0, 8); seq = P.slice(st, st + 5); next = P[st + 5]; en = 'prime numbers'; zh = '质数'; break; }
      case 'diff2': { const c2 = R(2, 4); seq = [a]; let gap = R(1, 5); for (let i = 1; i < 6; i++) { seq.push(seq[i - 1] + gap); gap *= c2; } next = seq.pop(); en = `the gaps are multiplied by ${c2} each time`; zh = `相邻两项的差每次乘 ${c2}`; break; }
      case 'altsign': { const r = -R(2, 3), b = R(1, 4); seq = [0, 1, 2, 3, 4].map(i => b * r ** i); next = b * r ** 5; en = `multiply by ${num(r)} each time`; zh = `每次乘 ${num(r)}`; break; }
      case 'frac': {
        const p = R(1, 3); seq = [0, 1, 2, 3, 4].map(i => `${p + i}/${(p + i) * 2 + 1}`); next = `${p + 5}/${(p + 5) * 2 + 1}`;
        const wrong = [`${p + 5}/${(p + 5) * 2}`, `${p + 6}/${(p + 5) * 2 + 1}`, `${p + 5}/${(p + 5) * 2 + 3}`, `${p + 4}/${(p + 5) * 2 + 1}`];
        return mc({ topic: 'gseries', en: `What comes next? ${seq.join(', ')}, ?`, zh: `下一个是什么？${seq.join('，')}，？`, correct: next, wrong,
          solEn: 'Numerators go up by 1; each denominator is 2 × numerator + 1.', solZh: '分子依次加 1；分母 = 分子 × 2 + 1。' });
      }
    }
    const show = seq.map(num).join(', ');
    return mc({ topic: 'gseries', en: `What number comes next? ${show}, ?`, zh: `按规律，下一个数是多少？${seq.map(num).join('，')}，？`,
      correct: num(next), wrong: nearNums(next, Math.max(2, Math.round(Math.abs(next - seq[seq.length - 1]) / 2)), [next + (next - seq[seq.length - 1]), seq[seq.length - 1] * 2]),
      solEn: `Rule: ${en}. Next: ${num(next)}`, solZh: `规律：${zh}。下一个数是 ${num(next)}` });
  });

  /* ---------- Letter series 字母规律 ---------- */
  reg('gletter', 4, (y, d) => {
    const k = pick(d <= 1 ? ['skip', 'back'] : d === 2 ? ['skip', 'back', 'pairs', 'grow'] : ['pairs', 'grow', 'alt', 'mirror']);
    const st = R(0, 12), s = R(2, 4 + d);
    let seq, next, ruleEn, ruleZh, wrong;
    if (k === 'skip') { seq = [0, 1, 2, 3].map(i => letter(st + i * s)); next = letter(st + 4 * s); ruleEn = `skip forward ${s}`; ruleZh = `每次向后数 ${s} 个字母`; wrong = [letter(st + 4 * s + 1), letter(st + 4 * s - 1), letter(st + 5 * s)]; }
    else if (k === 'back') { const b = 25 - st; seq = [0, 1, 2, 3].map(i => letter(b - i * s)); next = letter(b - 4 * s); ruleEn = `go back ${s} each time`; ruleZh = `每次向前退 ${s} 个字母`; wrong = [letter(b - 4 * s + 1), letter(b - 4 * s - 1), letter(b - 3 * s + 1)]; }
    else if (k === 'pairs') { seq = [0, 1, 2, 3].map(i => letter(st + i * s) + letter(st + i * s + 1)); next = letter(st + 4 * s) + letter(st + 4 * s + 1); ruleEn = `pairs of neighbouring letters, moving on ${s}`; ruleZh = `相邻两个字母一组，每组向后移 ${s} 个`; wrong = [letter(st + 4 * s) + letter(st + 4 * s + 2), letter(st + 4 * s + 1) + letter(st + 4 * s + 2), letter(st + 4 * s - 1) + letter(st + 4 * s)]; }
    else if (k === 'grow') { const p = [0, 1, 3, 6, 10, 15]; seq = p.slice(0, 5).map(v => letter(st + v)); next = letter(st + 15); ruleEn = 'gaps of 1, 2, 3, 4, 5'; ruleZh = '间隔依次为 1，2，3，4，5'; wrong = [letter(st + 14), letter(st + 16), letter(st + 13)]; }
    else if (k === 'alt') { seq = []; for (let i = 0; i < 6; i++) seq.push(i % 2 ? letter(25 - (i - 1) / 2 * s) : letter(st + i / 2 * s)); next = letter(st + 3 * s); ruleEn = `two series: from ${letter(st)} forward by ${s}, and from Z backward by ${s}`; ruleZh = `两组交错：从 ${letter(st)} 起每次向后 ${s}；从 Z 起每次向前 ${s}`; wrong = [letter(25 - 3 * s), letter(st + 3 * s + 1), letter(st + 2 * s)]; }
    else { seq = [0, 1, 2, 3].map(i => letter(st + i) + letter(25 - st - i)); next = letter(st + 4) + letter(25 - st - 4); ruleEn = 'first letter goes forward, second goes backward from Z (mirror pairs)'; ruleZh = '第一个字母向后，第二个字母从 Z 向前（对称字母）'; wrong = [letter(st + 4) + letter(25 - st - 3), letter(st + 5) + letter(25 - st - 4), letter(st + 4) + letter(25 - st - 5)]; }
    return mc({ topic: 'gletter', en: `What comes next? ${seq.join(', ')}, ?`, zh: `按规律，下一个是什么？${seq.join('，')}，？`, correct: next, wrong,
      solEn: `Rule: ${ruleEn}. Answer: ${next}`, solZh: `规律：${ruleZh}。答案：${next}` });
  });

  /* ---------- Codes 密码推理 ---------- */
  const WORDS = ['CAT', 'DOG', 'SUN', 'MAP', 'BOOK', 'FISH', 'TREE', 'STAR', 'MILK', 'BIRD', 'CAKE', 'LAMP', 'RAIN', 'GOLD', 'FROG', 'KITE', 'MOON', 'SHIP', 'PLANT', 'TIGER', 'APPLE', 'CLOUD', 'RIVER', 'HOUSE', 'MOUSE', 'TRAIN'];
  reg('gcode', 4, (y, d) => {
    const k = pick(d <= 1 ? ['shift', 'num'] : d === 2 ? ['shift', 'num', 'sum', 'reverse'] : ['shiftback', 'sum', 'reverse', 'altshift']);
    let w1 = pick(WORDS), w2 = pick(WORDS); while (w2 === w1 || w2.length !== w1.length && k !== 'sum') w2 = pick(WORDS);
    const s = R(1, 2 + d), enc = (w, f) => w.split('').map((c, i) => f(L.indexOf(c), i)).join('');
    let f, sep = '', ruleEn, ruleZh;
    if (k === 'shift') { f = c => letter(c + s); ruleEn = `each letter moves ${s} forward`; ruleZh = `每个字母向后移 ${s} 位`; }
    else if (k === 'shiftback') { f = c => letter(c - s); ruleEn = `each letter moves ${s} back`; ruleZh = `每个字母向前移 ${s} 位`; }
    else if (k === 'altshift') { f = (c, i) => letter(c + (i % 2 ? -1 : 1) * s); ruleEn = `letters alternately move +${s} and ${MINUS}${s}`; ruleZh = `字母交替 +${s}、${MINUS}${s}`; }
    else if (k === 'reverse') { f = null; ruleEn = 'the word is written backwards, then each letter moves 1 forward'; ruleZh = '把单词倒过来写，再把每个字母向后移 1 位'; }
    else if (k === 'num') { f = c => String(c + 1); sep = '-'; ruleEn = 'A = 1, B = 2, …'; ruleZh = 'A = 1，B = 2，……'; }
    if (k === 'sum') {
      const val = w => w.split('').reduce((t, c) => t + L.indexOf(c) + 1, 0), v = val(w2);
      return mc({ topic: 'gcode', en: `In a code, ${w1} = ${val(w1)} (A = 1, B = 2, … add the letters). What is ${w2}?`, zh: `在一种密码中，${w1} = ${val(w1)}（A = 1，B = 2，……把各字母的数相加）。${w2} 等于多少？`,
        correct: String(v), wrong: nearNums(v, 3), solEn: `${w2.split('').map(c => L.indexOf(c) + 1).join(' + ')} = ${v}`, solZh: `${w2.split('').map(c => L.indexOf(c) + 1).join(' + ')} = ${v}` });
    }
    const code = w => (k === 'reverse' ? w.split('').reverse().map(c => letter(L.indexOf(c) + 1)).join('') : w.split('').map((c, i) => f(L.indexOf(c), i)).join(sep));
    const right = code(w2);
    // distractors: shifted the wrong way / by one too many, and the right code with one symbol off by one
    const alt1 = w2.split('').map(c => (k === 'num' ? String(L.indexOf(c) + 2) : letter(L.indexOf(c) + s + 1))).join(sep);
    const parts = right.split(sep);
    const tweak = (i, dd) => parts.map((p, j) => (j === i ? (k === 'num' ? String(Math.max(1, +p + dd)) : letter(L.indexOf(p) + dd)) : p)).join(sep);
    const i1 = R(0, parts.length - 1), i2 = (i1 + 1 + R(0, parts.length - 2)) % parts.length;
    const alt2 = tweak(i1, 1), alt3 = tweak(i2, -1), alt4 = k === 'reverse' ? w2.split('').map(c => letter(L.indexOf(c) + 1)).join('') : tweak(i1, -1);
    return mc({ topic: 'gcode', en: `In a code, ${w1} is written as ${code(w1)}. How is ${w2} written?`, zh: `在一种密码中，${w1} 写作 ${code(w1)}。那么 ${w2} 写作什么？`,
      correct: right, wrong: [alt4, alt1, alt2, alt3], solEn: `Rule: ${ruleEn}. ${w2} → ${right}`, solZh: `规律：${ruleZh}。${w2} → ${right}` });
  });

  /* ---------- Logical deduction 逻辑推理 ---------- */
  const PEOPLE = [['Amy', '小美'], ['Ben', '小斌'], ['Cara', '小佳'], ['Dan', '小丹'], ['Eli', '小毅'], ['Fay', '小菲']];
  const DAYS = [['Monday', '星期一'], ['Tuesday', '星期二'], ['Wednesday', '星期三'], ['Thursday', '星期四'], ['Friday', '星期五'], ['Saturday', '星期六'], ['Sunday', '星期日']];
  const P = p => ({ en: p[0], zh: p[1] });
  reg('glogic', 4, (y, d) => {
    const k = pick(d <= 1 ? ['order', 'days'] : d === 2 ? ['order', 'days', 'row', 'liar'] : ['order', 'row', 'liar', 'days', 'knights']);
    if (k === 'order') {
      const n = Math.min(3 + d, 6), ppl = shuffle(PEOPLE).slice(0, n);       // ppl[0] tallest … ppl[n-1] shortest
      const facts = []; for (let i = 0; i < n - 1; i++) facts.push([ppl[i], ppl[i + 1]]);
      const sh = shuffle(facts), ask = pick(['short', 'tall', 'second']);
      const target = ask === 'short' ? ppl[n - 1] : ask === 'tall' ? ppl[0] : ppl[1];
      return mc({ topic: 'glogic', en: `${sh.map(([a, b]) => `${a[0]} is taller than ${b[0]}.`).join(' ')} Who is ${ask === 'short' ? 'the shortest' : ask === 'tall' ? 'the tallest' : 'the second tallest'}?`,
        zh: `${sh.map(([a, b]) => `${a[1]}比${b[1]}高。`).join('')}谁${ask === 'short' ? '最矮' : ask === 'tall' ? '最高' : '第二高'}？`,
        correct: P(target), wrong: shuffle(ppl.filter(p => p !== target)).map(P),
        solEn: `From tallest: ${ppl.map(p => p[0]).join(' > ')}`, solZh: `从高到矮：${ppl.map(p => p[1]).join(' > ')}` });
    }
    if (k === 'days') {
      const today = R(0, 6), off = pick(d <= 1 ? [1, 2, -1, -2] : [10, 15, 23, 30, 45, 100, -9, -20]), ref = pick([['the day after tomorrow', '后天', 2], ['yesterday', '昨天', -1], ['today', '今天', 0], ['tomorrow', '明天', 1]]);
      const known = (today + ref[2] + 70) % 7, ans = (today + off + 700) % 7;
      const offEn = off === 1 ? 'tomorrow' : off === -1 ? 'yesterday' : off === 2 ? 'the day after tomorrow' : off === -2 ? 'the day before yesterday' : off > 0 ? `${off} days from today` : `${-off} days ago`;
      const offZh = off === 1 ? '明天' : off === -1 ? '昨天' : off === 2 ? '后天' : off === -2 ? '前天' : off > 0 ? `从今天起再过 ${off} 天` : `${-off} 天前`;
      return mc({ topic: 'glogic', en: `If ${ref[0]} ${ref[2] === 0 ? 'is' : ref[2] > 0 ? 'is' : 'was'} ${DAYS[known][0]}, what day ${off < 0 ? 'was' : 'is'} ${offEn}?`,
        zh: `如果${ref[1]}是${DAYS[known][1]}，那么${offZh}是星期几？`,
        correct: P(DAYS[ans]), wrong: shuffle([1, 2, 3, 4, 5, 6].map(i => DAYS[(ans + i) % 7])).map(P),
        solEn: `Today is ${DAYS[today][0]}. ${off} days ${off >= 0 ? 'later' : 'earlier'}${Math.abs(off) >= 7 ? ` (${Math.abs(off)} ÷ 7 leaves ${Math.abs(off) % 7})` : ''}: ${DAYS[ans][0]}`,
        solZh: `今天是${DAYS[today][1]}。${Math.abs(off) >= 7 ? `${Math.abs(off)} ÷ 7 余 ${Math.abs(off) % 7}，` : ''}所以是${DAYS[ans][1]}` });
    }
    if (k === 'row') {
      // 5 people in a row, clues determine the order; ask who is in the middle / at an end
      const ppl = shuffle(PEOPLE).slice(0, 5);
      const clues = [
        [`${ppl[0][0]} is at the left end.`, `${ppl[0][1]}站在最左边。`],
        [`${ppl[4][0]} is at the right end.`, `${ppl[4][1]}站在最右边。`],
        [`${ppl[1][0]} is next to ${ppl[0][0]}.`, `${ppl[1][1]}紧挨着${ppl[0][1]}。`],
        [`${ppl[3][0]} is directly to the left of ${ppl[4][0]}.`, `${ppl[3][1]}在${ppl[4][1]}的左边，紧挨着。`]
      ];
      const ask = pick([[2, 'in the middle', '站在正中间'], [1, 'second from the left', '在左数第二个'], [3, 'second from the right', '在右数第二个']]);
      return mc({ topic: 'glogic', en: `Five friends stand in a row. ${clues.map(c => c[0]).join(' ')} Who is ${ask[1]}?`, zh: `五个朋友站成一排。${clues.map(c => c[1]).join('')}谁${ask[2]}？`,
        correct: P(ppl[ask[0]]), wrong: shuffle(ppl.filter((_, i) => i !== ask[0])).map(P),
        solEn: `Left to right: ${ppl.map(p => p[0]).join(', ')}`, solZh: `从左到右：${ppl.map(p => p[1]).join('、')}` });
    }
    if (k === 'liar') {
      // A: "B did it", B: "I didn't", C: "I didn't". A and B contradict, so exactly one of them is true;
      // with only one true statement, C is lying, so C did it (unique answer).
      const ppl = shuffle(PEOPLE).slice(0, 3), culprit = 2;
      const [A, B, C] = ppl;
      return mc({ topic: 'glogic', en: `One of three children broke a vase. ${A[0]} says: "${B[0]} did it." ${B[0]} says: "I didn't do it." ${C[0]} says: "I didn't do it." Only ONE of them tells the truth. Who broke the vase?`,
        zh: `三个孩子中有一个打碎了花瓶。${A[1]}说：“是${B[1]}打碎的。”${B[1]}说：“不是我打碎的。”${C[1]}说：“不是我打碎的。”三人中只有一人说了真话。是谁打碎的？`,
        correct: P(ppl[culprit]), wrong: [...ppl.filter((_, i) => i !== culprit).map(P), { en: 'Cannot tell', zh: '无法确定' }],
        solEn: `${A[0]} and ${B[0]} contradict each other, so one of them is the truth-teller; then ${C[0]} lies and did it.`, solZh: `${A[1]}和${B[1]}的话互相矛盾，必有一真，所以${C[1]}说的是假话，是${C[1]}打碎的。` });
    }
    // knights (always truthful) and knaves (always lie)
    const [A, B] = shuffle(PEOPLE).slice(0, 2);
    return mc({ topic: 'glogic', en: `On an island, knights always tell the truth and knaves always lie. ${A[0]} says: "We are both knaves." What are ${A[0]} and ${B[0]}?`,
      zh: `在一个岛上，骑士总说真话，无赖总说假话。${A[1]}说：“我们两个都是无赖。”${A[1]}和${B[1]}分别是什么？`,
      correct: { en: `${A[0]} knave, ${B[0]} knight`, zh: `${A[1]}是无赖，${B[1]}是骑士` },
      wrong: [{ en: `${A[0]} knight, ${B[0]} knave`, zh: `${A[1]}是骑士，${B[1]}是无赖` }, { en: 'Both knaves', zh: '都是无赖' }, { en: 'Both knights', zh: '都是骑士' }],
      solEn: `A knight can't say it (it would be a lie). So ${A[0]} is a knave and the statement is false, so ${B[0]} is a knight.`, solZh: `骑士不会说这句话（否则就是假话），所以${A[1]}是无赖；这句话是假的，所以${B[1]}是骑士。` });
  });

  /* ---------- Symbol puzzles 符号运算 ---------- */
  const SYM = ['★', '▲', '●', '■', '♦', '♥'];
  reg('gsymbol', 4, (y, d) => {
    const k = pick(d <= 1 ? ['two', 'op'] : d === 2 ? ['two', 'three', 'op'] : ['three', 'op2', 'balance']);
    const [s1, s2, s3] = shuffle(SYM);
    if (k === 'two') {
      const a = R(2, 15), b = R(2, 15), n = R(2, 4);
      return mc({ topic: 'gsymbol', en: `${Array(n).fill(s1).join(' + ')} = ${a * n} and ${s1} + ${s2} = ${a + b}. What is ${s2}?`, zh: `${Array(n).fill(s1).join(' + ')} = ${a * n}，${s1} + ${s2} = ${a + b}。${s2} 等于多少？`,
        correct: String(b), wrong: nearNums(b, 2, [a, a + b]), solEn: `${s1} = ${a * n} ÷ ${n} = ${a}; ${s2} = ${a + b} ${MINUS} ${a} = ${b}`, solZh: `${s1} = ${a * n} ÷ ${n} = ${a}；${s2} = ${a + b} ${MINUS} ${a} = ${b}` });
    }
    if (k === 'three') {
      const a = R(2, 12), b = R(2, 12), c = R(2, 12);
      return mc({ topic: 'gsymbol', en: `${s1} + ${s2} = ${a + b}, ${s2} + ${s3} = ${b + c}, ${s1} + ${s3} = ${a + c}. What is ${s1} + ${s2} + ${s3}?`,
        zh: `${s1} + ${s2} = ${a + b}，${s2} + ${s3} = ${b + c}，${s1} + ${s3} = ${a + c}。${s1} + ${s2} + ${s3} = ？`,
        correct: String(a + b + c), wrong: nearNums(a + b + c, 3, [2 * (a + b + c), a + b + c + a]), solEn: `Add all three: 2 × (sum) = ${2 * (a + b + c)}, so the sum is ${a + b + c}`, solZh: `三式相加：2 × (和) = ${2 * (a + b + c)}，所以和为 ${a + b + c}` });
    }
    if (k === 'op') {
      const p = R(2, 4), q = R(1, 3), x = R(2, 9), z = R(2, 9), v = p * x + q * z;
      return mc({ topic: 'gsymbol', en: `A new operation is defined as a ${s1} b = ${p}a + ${q === 1 ? '' : q}b. Work out ${x} ${s1} ${z}.`, zh: `规定一种新运算：a ${s1} b = ${p}a + ${q === 1 ? '' : q}b。求 ${x} ${s1} ${z}。`,
        correct: String(v), wrong: nearNums(v, 3, [p * z + q * x]), solEn: `${p} × ${x} + ${q} × ${z} = ${v}`, solZh: `${p} × ${x} + ${q} × ${z} = ${v}` });
    }
    if (k === 'op2') {
      const x = R(2, 6), z = R(2, 6), w = R(2, 5), op = (a, b) => a * b - a, inner = op(x, z), v = op(inner, w);
      return mc({ topic: 'gsymbol', en: `If a ${s1} b = a × b ${MINUS} a, find (${x} ${s1} ${z}) ${s1} ${w}.`, zh: `规定 a ${s1} b = a × b ${MINUS} a，求 (${x} ${s1} ${z}) ${s1} ${w}。`,
        correct: String(v), wrong: nearNums(v, inner, [op(x, op(z, w))]), solEn: `${x} ${s1} ${z} = ${inner}; ${inner} ${s1} ${w} = ${inner} × ${w} ${MINUS} ${inner} = ${v}`, solZh: `${x} ${s1} ${z} = ${inner}；${inner} ${s1} ${w} = ${inner} × ${w} ${MINUS} ${inner} = ${v}` });
    }
    // balance scales
    const p = R(2, 4), q = R(2, 4), rr = p * q;   // 1 s1 = p s2 ; 1 s2 = q s3 → 1 s1 = pq s3
    const n = R(2, 4);
    return mc({ topic: 'gsymbol', en: `On a balance, 1 ${s1} weighs the same as ${p} ${s2}, and 1 ${s2} weighs the same as ${q} ${s3}. How many ${s3} balance ${n} ${s1}?`,
      zh: `天平上，1 个 ${s1} 和 ${p} 个 ${s2} 一样重，1 个 ${s2} 和 ${q} 个 ${s3} 一样重。${n} 个 ${s1} 和多少个 ${s3} 一样重？`,
      correct: String(n * rr), wrong: nearNums(n * rr, n, [n * (p + q), rr]), solEn: `1 ${s1} = ${p} × ${q} = ${rr} ${s3}; ${n} ${s1} = ${n * rr} ${s3}`, solZh: `1 个 ${s1} = ${p} × ${q} = ${rr} 个 ${s3}；${n} 个 ${s1} = ${n * rr} 个 ${s3}` });
  });

  /* ---------- Visual patterns 图形规律 ---------- */
  const SH = ['🔴', '🔵', '🟢', '🟡', '🔺', '⬛', '⭐', '🔷'];
  reg('gpattern', 4, (y, d) => {
    const k = pick(d <= 1 ? ['repeat', 'match'] : ['repeat', 'nth', 'match', 'grow']);
    if (k === 'repeat' || k === 'nth') {
      const len = R(3, d >= 3 ? 5 : 4), unit = shuffle(SH).slice(0, len - (Math.random() < 0.5 ? 1 : 0)), pat = [];
      while (unit.length < len) unit.splice(R(0, unit.length), 0, unit[R(0, unit.length - 1)]);
      for (let i = 0; i < len * 2 + 1; i++) pat.push(unit[i % len]);
      const pos = k === 'repeat' ? pat.length + 1 : R(20, 99), ans = unit[(pos - 1) % len];
      const opts = [...new Set(unit)].filter(s => s !== ans).concat(SH.filter(s => !unit.includes(s)));
      return mc({ topic: 'gpattern', en: k === 'repeat' ? `What comes next? ${pat.join(' ')} ?` : `The pattern ${pat.join(' ')} … keeps repeating. What is shape number ${pos}?`,
        zh: k === 'repeat' ? `下一个是什么？${pat.join(' ')} ？` : `图案 ${pat.join(' ')} …… 不断重复，第 ${pos} 个是什么？`,
        correct: ans, wrong: opts, solEn: `The pattern repeats every ${len}: ${unit.join(' ')}. ${pos} ÷ ${len} leaves ${(pos - 1) % len + 1} → ${ans}`, solZh: `每 ${len} 个一组重复：${unit.join(' ')}。${pos} ÷ ${len} 余 ${pos % len === 0 ? 0 : pos % len}${pos % len === 0 ? '（组的最后一个）' : ''} → ${ans}` });
    }
    if (k === 'match') {
      const shapes = pick([['triangle', '三角形', 3, 2], ['square', '正方形', 4, 3], ['pentagon', '五边形', 5, 4], ['hexagon', '六边形', 6, 5]]), n = R(4, d >= 2 ? 30 : 10), v = shapes[2] + shapes[3] * (n - 1);
      return mc({ topic: 'gpattern', en: `Matchsticks make a row of ${shapes[0]}s joined side by side: 1 ${shapes[0]} uses ${shapes[2]}, 2 use ${shapes[2] + shapes[3]}, 3 use ${shapes[2] + 2 * shapes[3]}. How many matchsticks for ${n} ${shapes[0]}s?`,
        zh: `用火柴棒摆一排连在一起的${shapes[1]}：1 个用 ${shapes[2]} 根，2 个用 ${shapes[2] + shapes[3]} 根，3 个用 ${shapes[2] + 2 * shapes[3]} 根。摆 ${n} 个需要多少根？`,
        correct: String(v), wrong: nearNums(v, shapes[3], [shapes[2] * n, v + shapes[3]]), solEn: `${shapes[2]} + ${shapes[3]} × (${n} ${MINUS} 1) = ${v}`, solZh: `${shapes[2]} + ${shapes[3]} × (${n} ${MINUS} 1) = ${v}` });
    }
    const n = R(5, 15), v = n * n, sq = n * (n + 1) / 2;
    const tri = Math.random() < 0.5;
    return mc({ topic: 'gpattern', en: tri ? `Dots form triangles: 1, 3, 6, 10, … dots. How many dots in triangle number ${n}?` : `Tiles form squares: 1, 4, 9, 16, … tiles. How many tiles in square number ${n}?`,
      zh: tri ? `用点摆三角形：1，3，6，10，……个点。第 ${n} 个三角形有多少个点？` : `用瓷砖拼正方形：1，4，9，16，……块。第 ${n} 个正方形有多少块？`,
      correct: String(tri ? sq : v), wrong: nearNums(tri ? sq : v, n, [tri ? n * n : sq, tri ? sq + n + 1 : v + 2 * n + 1]),
      solEn: tri ? `1 + 2 + … + ${n} = ${sq}` : `${n} × ${n} = ${v}`, solZh: tri ? `1 + 2 + …… + ${n} = ${sq}` : `${n} × ${n} = ${v}` });
  });

  /* ---------- Spatial reasoning & counting 空间与计数 ---------- */
  const DIR = [['north', '北'], ['east', '东'], ['south', '南'], ['west', '西']];
  reg('gspatial', 4, (y, d) => {
    const k = pick(d <= 1 ? ['turn', 'grid', 'hand'] : d === 2 ? ['turn', 'grid', 'hand', 'cube', 'route'] : ['cube', 'grid', 'route', 'rect', 'hand']);
    if (k === 'turn') {
      const st = R(0, 3), moves = Array.from({ length: R(2, 2 + d) }, () => pick([[1, 'right 90°', '向右转 90°'], [-1, 'left 90°', '向左转 90°'], [2, 'around (180°)', '向后转（180°）']]));
      const end = ((st + moves.reduce((s, m) => s + m[0], 0)) % 4 + 4) % 4;
      return mc({ topic: 'gspatial', en: `You face ${DIR[st][0]}. You turn ${moves.map(m => m[1]).join(', then ')}. Which way are you facing now?`, zh: `你面向${DIR[st][1]}方，先${moves.map(m => m[2]).join('，再')}。现在面向哪个方向？`,
        correct: { en: DIR[end][0], zh: DIR[end][1] }, wrong: DIR.filter((_, i) => i !== end).map(x => ({ en: x[0], zh: x[1] })),
        solEn: `Track each turn: ${DIR[end][0]}`, solZh: `逐步转动，最后面向${DIR[end][1]}方` });
    }
    if (k === 'grid') {
      const n = R(2, d >= 3 ? 6 : 4); let v = 0; for (let i = 1; i <= n; i++) v += i * i;
      return mc({ topic: 'gspatial', en: `How many squares of any size are there in a ${n} × ${n} grid?`, zh: `一个 ${n} × ${n} 的方格图中，一共有多少个正方形（大小都算）？`,
        correct: String(v), wrong: nearNums(v, n, [n * n, v - 1, (n + 1) * (n + 1)]), solEn: `${Array.from({ length: n }, (_, i) => `${n - i}²`).join(' + ')} = ${v}`, solZh: `${Array.from({ length: n }, (_, i) => `${n - i}²`).join(' + ')} = ${v}` });
    }
    if (k === 'rect') {
      const m = R(2, 4), n = R(2, 5), v = (m * (m + 1) / 2) * (n * (n + 1) / 2);
      return mc({ topic: 'gspatial', en: `How many rectangles (including squares) are there in a grid ${m} squares high and ${n} squares wide?`, zh: `一个 ${m} 行 ${n} 列的方格图中，共有多少个长方形（包括正方形）？`,
        correct: String(v), wrong: nearNums(v, m * n, [m * n, v - m * n]), solEn: `Choose 2 of ${m + 1} horizontal lines and 2 of ${n + 1} vertical lines: ${m * (m + 1) / 2} × ${n * (n + 1) / 2} = ${v}`, solZh: `从 ${m + 1} 条横线中选 2 条，从 ${n + 1} 条竖线中选 2 条：${m * (m + 1) / 2} × ${n * (n + 1) / 2} = ${v}` });
    }
    if (k === 'cube') {
      const n = R(3, 6), which = pick([['3', 8, '三面'], ['2', 12 * (n - 2), '两面'], ['1', 6 * (n - 2) ** 2, '一面'], ['0', (n - 2) ** 3, '没有一面']]);
      return mc({ topic: 'gspatial', en: `A ${n} × ${n} × ${n} cube is painted on the outside, then cut into ${n ** 3} small cubes. How many small cubes have ${which[0] === '0' ? 'no' : 'exactly ' + which[0]} painted face${which[0] === '1' ? '' : 's'}?`,
        zh: `把一个 ${n} × ${n} × ${n} 的大正方体表面涂色，再切成 ${n ** 3} 个小正方体。${which[2]}涂色的小正方体有多少个？`,
        correct: String(which[1]), wrong: [8, 12 * (n - 2), 6 * (n - 2) ** 2, (n - 2) ** 3, which[1] + 4, which[1] + n].map(String),
        solEn: `Corners: 8 (3 faces); edges: 12 × (${n} ${MINUS} 2) (2 faces); faces: 6 × (${n} ${MINUS} 2)² (1 face); inside: (${n} ${MINUS} 2)³ (none) → ${which[1]}`,
        solZh: `顶点 8 个（三面）；棱上 12 × (${n} ${MINUS} 2) 个（两面）；面上 6 × (${n} ${MINUS} 2)² 个（一面）；内部 (${n} ${MINUS} 2)³ 个（无） → ${which[1]}` });
    }
    if (k === 'route') {
      const m = R(2, 4), n = R(2, 4); let c = 1; for (let i = 1; i <= m; i++) c = c * (n + i) / i;
      return mc({ topic: 'gspatial', en: `On a grid of streets, you walk from the bottom-left corner to a point ${n} blocks right and ${m} blocks up, moving only right or up. How many different shortest routes are there?`,
        zh: `在方格街道上，从左下角走到向右 ${n} 格、向上 ${m} 格的地方，只能向右或向上走。最短路线有多少条？`,
        correct: String(c), wrong: nearNums(c, m + n, [m * n, m + n, 2 ** (m + n - 1)]), solEn: `Choose which ${m} of the ${m + n} steps go up: ${c}`, solZh: `用标数法（或从 ${m + n} 步中选 ${m} 步向上）：${c} 条` });
    }
    // clock hands angle
    const h = R(1, 12), mm = d >= 2 ? pick([0, 30, 15, 45]) : 0, raw = Math.abs(30 * (h % 12) + 0.5 * mm - 6 * mm), v = Math.min(raw, 360 - raw);
    return mc({ topic: 'gspatial', en: `What is the smaller angle between the hands of a clock at ${h}:${String(mm).padStart(2, '0')}?`, zh: `${h} 点 ${mm} 分时，钟面上时针和分针所成的较小角是多少度？`,
      correct: num(v) + '°', wrong: [v + 30, Math.abs(v - 30), v + 15, 360 - v, v + 7.5].filter(x => x > 0 && x <= 180).map(x => num(x) + '°'),
      solEn: `Hour hand at ${30 * (h % 12) + 0.5 * mm}°, minute hand at ${6 * mm}° → ${num(v)}°`, solZh: `时针在 ${30 * (h % 12) + 0.5 * mm}°，分针在 ${6 * mm}° → ${num(v)}°` });
  });
})(typeof window !== 'undefined' ? window : globalThis);
