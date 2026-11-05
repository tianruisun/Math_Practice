/* Selective test (NSW Selective High School Placement Test – Mathematical Reasoning style).
   Real papers: 35 questions, 40 minutes, 5 options (A–E), no calculator, easier → harder.
   Each template below is modelled on a question type from the published practice tests and
   randomises its numbers. Tier 1 = easier, 2 = medium, 3 = harder.
   Question: { subject:'sel', type:'mc', topic, tier, q:{en,zh}, choices:[{en,zh}×5], correct, sol } */
(function (root) {
  'use strict';
  const G = root.Gen || require('./gen-core.js');
  const { R, pick, shuffle, gcd, lcm, round, MINUS } = G;

  const FULL = { n: 35, minutes: 40 };
  const SHORT = { n: 18, minutes: 20 };
  const MIX = { 35: [12, 13, 10], 18: [6, 7, 5] };      // easy / medium / hard per test length

  const NAMES = [['Sandy', '小珊'], ['Jack', '小杰'], ['Rana', '小兰'], ['Kim', '小金'], ['Jamie', '小米'], ['Nicola', '小诺'], ['Alan', '小安'], ['Kiana', '小琪'], ['Jason', '小森'], ['Lenny', '小林'], ['Chen', '小陈'], ['Emily', '小艾'], ['Mia', '小雅'], ['Noah', '小诺亚'], ['Ravi', '小维'], ['Zoe', '小佐'], ['Omar', '小欧'], ['Lily', '小莉']];
  const people = n => shuffle(NAMES).slice(0, n);
  const num = n => String(round(n, 2));
  const fmtN = n => (Math.abs(n) >= 10000 ? String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' ') : String(n));
  const money = v => '$' + v.toFixed(2);
  // language-neutral option text; the few English words used in options get a Chinese form
  const both = s => ({ en: String(s), zh: String(s).replace(/ times$/, ' 倍').replace(/ min$/, ' 分钟') });
  const DAYS = [['Monday', '星期一'], ['Tuesday', '星期二'], ['Wednesday', '星期三'], ['Thursday', '星期四'], ['Friday', '星期五'], ['Saturday', '星期六'], ['Sunday', '星期日']];
  const DIR8 = [['north', '北'], ['north-east', '东北'], ['east', '东'], ['south-east', '东南'], ['south', '南'], ['south-west', '西南'], ['west', '西'], ['north-west', '西北']];
  const hhmm = m => { m = ((m % 1440) + 1440) % 1440; return String(Math.floor(m / 60)).padStart(2, '0') + String(m % 60).padStart(2, '0'); };
  const ampm = m => { m = ((m % 1440) + 1440) % 1440; const h = Math.floor(m / 60), mm = String(m % 60).padStart(2, '0'), h12 = h % 12 === 0 ? 12 : h % 12;
    return { en: `${h12}:${mm} ${h < 12 ? 'am' : 'pm'}`, zh: `${h < 12 ? '上午' : '下午'} ${h12}:${mm}` }; };

  /* numeric value of an option string, for sorting A–E in increasing order like the real papers */
  function optValue(s) {
    let t = String(s).replace(/[$,]/g, '').replace(/\u2212/g, '-').trim();
    let m = t.match(/^(-?\d+)\s+(\d+)\/(\d+)/); if (m) return +m[1] + m[2] / m[3];
    m = t.match(/^(-?\d+)\/(\d+)/); if (m) return m[1] / m[2];
    m = t.match(/^(-?\d+(?:\.\d+)?)\s*(km|kg|g|mL|L|cm²|cm|m|°|min|minutes|hours|%)?$/); if (m) return +m[1];
    m = t.match(/^(\d+) (?:km|L|kg) (\d+) (?:m|mL|g)$/); if (m) return +m[1] * 1000 + +m[2];
    m = t.match(/^([\d ]+) times$/); if (m) return +m[1].replace(/\s/g, '');
    m = t.match(/^(\d+) hours (\d+) minutes$/); if (m) return +m[1] * 60 + +m[2];
    t = t.replace(/\s/g, ''); m = t.match(/^-?\d+(?:\.\d+)?$/); if (m) return +t;
    return NaN;
  }

  /* build a 5-option question. correct/wrong: string or {en,zh}. fixed: options already in display order */
  function sel(tier, topic, o) {
    const norm = c => (typeof c === 'object' ? c : both(c));
    let choices, correct;
    if (o.fixed) {
      choices = o.fixed.map(norm); correct = o.answerIndex;
    } else {
      const right = norm(o.correct), seen = new Set([right.en]), wrong = [];
      const rv = optValue(right.en), negOk = Number.isFinite(rv) && rv < 0;
      for (const w of (o.wrong || []).map(norm)) {
        if (!w.en || seen.has(w.en) || wrong.length >= 4) continue;
        const wv = optValue(w.en);
        if (!negOk && (wv < 0 || /^-|\$-/.test(w.en))) continue;      // no negative distractors for a positive answer
        seen.add(w.en); wrong.push(w);
      }
      // top up numeric answers (keeps prefix/suffix such as $ and units)
      const m = right.en.match(/^(\$?)(-?\d+(?:\.\d+)?)(.*)$/);
      if (m) {
        const v = +m[2], dp = (m[2].split('.')[1] || '').length, step = o.step || (dp ? 10 ** -dp * (v > 10 ? 10 : 1) : Math.max(1, Math.round(Math.abs(v) / 10)));
        for (let k = 1; wrong.length < 4 && k < 40; k++) {
          const cand = v + (k % 2 ? 1 : -1) * Math.ceil(k / 2) * step;
          if (cand < 0 && v >= 0) continue;
          const s = m[1] + (dp ? cand.toFixed(dp) : String(round(cand, 6))) + m[3];
          if (!seen.has(s)) { seen.add(s); wrong.push(both(s)); }
        }
      }
      if (wrong.length < 4) return null;
      choices = shuffle([right, ...wrong]);
      const vals = choices.map(c => optValue(c.en));
      if (vals.every(v => Number.isFinite(v))) choices = choices.map((c, i) => [c, vals[i]]).sort((a, b) => a[1] - b[1]).map(x => x[0]);
      correct = choices.indexOf(right);
    }
    const q = { subject: 'sel', type: 'mc', topic, tier, q: { en: o.en, zh: o.zh }, choices, correct,
      sol: { en: o.solEn || '', zh: o.solZh || o.solEn || '' }, source: 'local' };
    if (o.fig) q.fig = o.fig;
    return q;
  }

  /* "Which of these statements is/are correct?" — stmts: [{en, zh, ok}] numbered 1.. */
  function statementsQ(tier, topic, introEn, introZh, stmts, solEn, solZh, askWrong, fig) {
    const n = stmts.length, truth = stmts.map(s => (askWrong ? !s.ok : s.ok));
    const subsets = [];
    for (let mask = 0; mask < 1 << n; mask++) subsets.push(mask);
    const bits = m => [...Array(n).keys()].filter(i => m & (1 << i));
    const label = m => {
      const b = bits(m).map(i => i + 1);
      if (!b.length) return { en: 'none of them', zh: '都不是' };
      if (b.length === n && n > 1) return { en: `statements ${b.slice(0, -1).join(', ')} and ${b[n - 1]}`, zh: `说法 ${b.join('、')} 都是` };
      if (b.length === 1) return { en: `statement ${b[0]} only`, zh: `只有说法 ${b[0]}` };
      return { en: `statements ${b.slice(0, -1).join(', ')} and ${b[b.length - 1]} only`, zh: `只有说法 ${b.join(' 和 ')}` };
    };
    const right = truth.reduce((m, t, i) => (t ? m | (1 << i) : m), 0);
    const pool = shuffle(subsets.filter(m => m !== right)).slice(0, 4).concat(right);
    pool.sort((a, b) => bits(a).length - bits(b).length || a - b);
    const qEn = `${introEn}\n${stmts.map((s, i) => `${i + 1}. ${s.en}`).join('\n')}\n${askWrong ? 'Which of these statements cannot be correct?' : 'Which of these statements is/are correct?'}`;
    const qZh = `${introZh}\n${stmts.map((s, i) => `${i + 1}. ${s.zh}`).join('\n')}\n${askWrong ? '哪些说法不可能正确？' : '哪些说法是正确的？'}`;
    return sel(tier, topic, { en: qEn, zh: qZh, fixed: pool.map(label), answerIndex: pool.indexOf(right), solEn, solZh, fig });
  }

  const T = { 1: [], 2: [], 3: [] };
  const add = (tier, topic, fn) => {
    const i = T[tier].length;
    T[tier].push({ topic, fn: () => { const q = fn(); if (q) q.ref = { sel: [tier, i] }; return q; } });
  };

  /* ======================= Tier 1 – easier ======================= */
  add(1, 'smeas', () => {   // 24-hour time → 12-hour
    const [P] = people(1), start = R(13, 22) * 60 + 5 * R(0, 11), plus = pick([15, 20, 25, 35, 45]), end = start + plus;
    return sel(1, 'smeas', { en: `${P[0]}'s watch reads ${hhmm(start)}.\nWhat is the time ${plus === 15 ? 'one quarter of an hour' : plus === 45 ? 'three quarters of an hour' : plus + ' minutes'} later, in 12-hour format?`,
      zh: `${P[1]}的手表显示 ${hhmm(start)}（24 时计时法）。\n${plus === 15 ? '一刻钟' : plus === 45 ? '三刻钟' : plus + ' 分钟'}后是几点？（用 12 时计时法表示）`,
      correct: ampm(end), wrong: [ampm(end - 720), ampm(end - 10), ampm(end + 10), ampm(start + 720 - 60), ampm(end - 60)],
      solEn: `${hhmm(start)} + ${plus} min = ${hhmm(end)} = ${ampm(end).en}`, solZh: `${hhmm(start)} + ${plus} 分 = ${hhmm(end)}，即${ampm(end).zh}` });
  });
  add(1, 'snum', () => {   // smallest/largest n-digit products
    const v = pick([[1000, 99, 'smallest four-digit', 'largest two-digit', '最小的四位数', '最大的两位数'], [999, 10, 'largest three-digit', 'smallest two-digit', '最大的三位数', '最小的两位数'], [100, 999, 'smallest three-digit', 'largest three-digit', '最小的三位数', '最大的三位数'], [10000, 99, 'smallest five-digit', 'largest two-digit', '最小的五位数', '最大的两位数']]);
    const [P] = people(1), ans = v[0] * v[1];
    return sel(1, 'snum', { en: `${P[0]} multiplies the ${v[2]} whole number by the ${v[3]} whole number.\nWhat is the answer?`, zh: `${P[1]}把${v[4]}乘以${v[5]}。\n结果是多少？`,
      correct: fmtN(ans), wrong: [fmtN(v[0] * (v[1] + 1)), fmtN(v[0] * 10 * v[1]), fmtN((v[0] - 1) * v[1]), fmtN(v[0] * v[1] / 10), fmtN(ans + v[0] * 9)],
      solEn: `${fmtN(v[0])} × ${v[1]} = ${fmtN(ans)}`, solZh: `${fmtN(v[0])} × ${v[1]} = ${fmtN(ans)}` });
  });
  add(1, 'smeas', () => {   // jar on scale
    const [P] = people(1), need = R(5, 9) * 100 + pick([0, 50]), empty = R(20, 40) * 10, sauce = R(15, need / 10 - 10) * 10, reading = empty + sauce, ans = need - sauce;
    return sel(1, 'smeas', { en: `${P[0]} needs ${need} grams of cooking sauce.\nA glass jar of sauce on a scale reads ${reading} g. The jar weighs ${empty} g when empty.\nHow much more cooking sauce does ${P[0]} need?`,
      zh: `${P[1]}需要 ${need} 克酱汁。\n一罐酱汁放在秤上显示 ${reading} 克，空罐重 ${empty} 克。\n${P[1]}还需要多少克酱汁？`,
      correct: ans + ' g', wrong: [need - reading + ' g', sauce + ' g', reading - need > 0 ? reading - need + ' g' : ans + 100 + ' g', ans - 100 + ' g', empty + ' g'],
      solEn: `Sauce in jar = ${reading} − ${empty} = ${sauce} g; ${need} − ${sauce} = ${ans} g`, solZh: `罐中酱汁 = ${reading} − ${empty} = ${sauce} 克；${need} − ${sauce} = ${ans} 克` });
  });
  add(1, 'snum', () => {   // largest multiple vs smallest even multiple
    const [A, B] = people(2), a = pick([5, 6, 7, 9]), b = pick([3, 7, 9, 11]), lim = pick([50, 60, 80, 100]), L = Math.floor((lim - 1) / a) * a, S = 2 * b, ans = L - S;
    return sel(1, 'snum', { en: `${A[0]} and ${B[0]} each think of a whole number greater than 0 and less than ${lim}.\n${A[0]}'s number is a multiple of ${a}.\n${B[0]}'s number is an even number which is a multiple of ${b}.\nWhat is the difference between the largest possible value of ${A[0]}'s number and the smallest possible value of ${B[0]}'s number?`,
      zh: `${A[1]}和${B[1]}各想了一个大于 0 且小于 ${lim} 的整数。\n${A[1]}的数是 ${a} 的倍数。\n${B[1]}的数是 ${b} 的倍数，而且是偶数。\n${A[1]}的数最大可能值与${B[1]}的数最小可能值相差多少？`,
      correct: String(ans), wrong: [String(L - b), String(L - a - S), String(lim - S), String(L + a - S), String(ans + 2)],
      solEn: `Largest multiple of ${a} below ${lim} is ${L}; smallest even multiple of ${b} is ${S}; ${L} − ${S} = ${ans}`, solZh: `小于 ${lim} 的 ${a} 的最大倍数是 ${L}；${b} 的最小偶数倍是 ${S}；${L} − ${S} = ${ans}` });
  });
  add(1, 'sspace', () => {   // rectangles same area
    const a = R(4, 12), b = R(3, 10), c = pick([2, 3, 4, 5, 6].filter(x => (a * b) % x === 0 && x !== b && x !== a));
    if (!c || a === b) return null;
    const ans = a * b / c;
    return sel(1, 'sspace', { en: `Rectangles P and Q have the same area.\nP is ${a} cm long and ${b} cm wide. Q is ${c} cm wide.\nWhat is the length of rectangle Q?`, zh: `长方形 P 和 Q 面积相等。\nP 长 ${a} 厘米，宽 ${b} 厘米；Q 宽 ${c} 厘米。\n长方形 Q 的长是多少？`,
      correct: ans + ' cm', wrong: [a + b - c + ' cm', a * b - c + ' cm', 2 * (a + b) - 2 * c > 0 ? (a + b) - c + 1 + ' cm' : '1 cm', a * b + ' cm', ans * 2 + ' cm'],
      solEn: `Area of P = ${a} × ${b} = ${a * b} cm²; ${a * b} ÷ ${c} = ${ans} cm`, solZh: `P 的面积 = ${a} × ${b} = ${a * b} 平方厘米；${a * b} ÷ ${c} = ${ans} 厘米` });
  });
  add(1, 'smeas', () => {   // glass & bottle capacity
    const [P] = people(1), g = pick([200, 250, 300]), d = pick([10, 20, 30, 50]), mark = pick([500, 600]), poured = mark - (g - d), left = 1000 - poured;
    return sel(1, 'smeas', { en: `${P[0]} has a glass containing ${g} mL of cordial, and a bottle containing 1 litre of water.\n${P[0]} drinks ${d} mL of the cordial, then pours water from the bottle into the glass until it reaches the ${mark} mL mark.\nHow much water is left in the bottle?`,
      zh: `${P[1]}有一杯 ${g} 毫升的果汁浓浆和一瓶 1 升的水。\n${P[1]}喝了 ${d} 毫升浓浆，然后把瓶里的水倒进杯中，直到液面到达 ${mark} 毫升刻度。\n瓶里还剩多少毫升水？`,
      correct: left + ' mL', wrong: [1000 - (mark - g) + ' mL', poured + ' mL', mark - g + ' mL', 1000 - mark + ' mL', left + d + ' mL'],
      solEn: `Glass had ${g - d} mL; water added = ${mark} − ${g - d} = ${poured} mL; 1000 − ${poured} = ${left} mL`, solZh: `杯中还有 ${g - d} 毫升；加水 ${mark} − ${g - d} = ${poured} 毫升；1000 − ${poured} = ${left} 毫升` });
  });
  add(1, 'slogic', () => {   // symbol equations
    const a = R(4, 12), sq = R(6, 15), tot = R(sq + 5, sq + 40), ci = tot - sq;
    return sel(1, 'slogic', { en: `□ always represents the same number. ○ represents a different number.\n${a} × □ = ${a * sq}\n○ + □ = ${tot}\nWhat is ○?`, zh: `□ 总是代表同一个数，○ 代表另一个数。\n${a} × □ = ${a * sq}\n○ + □ = ${tot}\n○ 是多少？`,
      correct: String(ci), wrong: [String(sq), String(tot - a), String(a * sq - tot), String(ci + a), String(tot + sq)],
      solEn: `□ = ${a * sq} ÷ ${a} = ${sq}; ○ = ${tot} − ${sq} = ${ci}`, solZh: `□ = ${a * sq} ÷ ${a} = ${sq}；○ = ${tot} − ${sq} = ${ci}` });
  });
  add(1, 'snum', () => {   // division with remainder → number sentence
    const p = R(9, 16), q = R(5, 9), r = R(2, Math.min(p - 1, 8)), N = p * q + r;
    if (r === q) return null;
    const opts = [`${p} + ${q} × ${r} = ${N}`, `${p} × ${r} − ${q} = ${N}`, `${p} × ${r} + ${q} = ${N}`, `${p} × ${q} − ${r} = ${N}`, `${p} × ${q} + ${r} = ${N}`];
    return sel(1, 'snum', { en: `When ${N} chocolates are shared between ${p} people, each person gets ${q} chocolates and there are ${r} left over.\nWhich number sentence shows this information?`,
      zh: `把 ${N} 块巧克力分给 ${p} 个人，每人分到 ${q} 块，还剩 ${r} 块。\n下面哪个算式表示这个信息？`, fixed: opts.map(both), answerIndex: 4,
      solEn: `${p} people × ${q} each + ${r} left = ${N}`, solZh: `${p} 人 × 每人 ${q} 块 + 剩下 ${r} 块 = ${N}` });
  });
  add(1, 'snum', () => {   // rounding two ways
    const [A, B] = people(2), m = R(1, 9), h = R(1, 9), t = R(0, 9), n = m * 1e6 + h * 1e5 + t * 1e4, r1 = Math.round(n / 1e6) * 1e6, r2 = Math.round(n / 1e5) * 1e5, ans = Math.abs(r1 - r2);
    return sel(1, 'snum', { en: `${A[0]} and ${B[0]} both round the number ${fmtN(n)}.\n${A[0]} rounds it to the nearest million. ${B[0]} rounds it to the nearest hundred thousand.\nWhat is the difference between their answers?`,
      zh: `${A[1]}和${B[1]}都对 ${fmtN(n)} 取近似数。\n${A[1]}精确到百万位，${B[1]}精确到十万位。\n两人的结果相差多少？`,
      correct: fmtN(ans), wrong: ['0', '50 000', '100 000', '150 000', '200 000', '250 000', '300 000', '400 000', '500 000'].filter(x => x !== fmtN(ans)),
      solEn: `${fmtN(n)} → ${fmtN(r1)} and ${fmtN(r2)}; difference ${fmtN(ans)}`, solZh: `${fmtN(n)} ≈ ${fmtN(r1)}，≈ ${fmtN(r2)}；相差 ${fmtN(ans)}` });
  });
  add(1, 'snum', () => {   // place value: how many times larger
    const a = pick([2, 3, 4, 6, 8]), b = pick([1, 2, 3, 4, 5, 6].filter(x => x !== a)), p = R(3, 4), q = R(1, p - 1);
    const digits = Array(p + 1).fill(0); digits[p] = a; digits[q] = b;
    const n = Number(digits.slice().reverse().join('')), ratio = a * 10 ** p / (b * 10 ** q);
    if (!Number.isInteger(ratio)) return null;
    return sel(1, 'snum', { en: `In our number system the value of a digit depends on its position. For example, in 273 the digit 7 represents 70.\nIn the number ${fmtN(n)}, how many times larger is the value represented by the digit ${a} than the value represented by the digit ${b}?`,
      zh: `数字的值取决于它所在的数位，例如 273 中的 7 表示 70。\n在 ${fmtN(n)} 中，数字 ${a} 表示的值是数字 ${b} 表示的值的多少倍？`,
      correct: `${fmtN(ratio)} times`.replace(/^/, ''), wrong: [10 ** (p - q), ratio / 10, ratio * 10, a * b * 10 ** (p - q), 10 ** (p - q) * 2].filter(x => Number.isInteger(x) && x !== ratio).map(x => `${fmtN(x)} times`),
      solEn: `${a} is worth ${fmtN(a * 10 ** p)}; ${b} is worth ${fmtN(b * 10 ** q)}; ${fmtN(a * 10 ** p)} ÷ ${fmtN(b * 10 ** q)} = ${fmtN(ratio)}`, solZh: `${a} 表示 ${fmtN(a * 10 ** p)}，${b} 表示 ${fmtN(b * 10 ** q)}，${fmtN(a * 10 ** p)} ÷ ${fmtN(b * 10 ** q)} = ${fmtN(ratio)}` });
  });
  add(1, 'smeas', () => {   // juice k times as much
    const [P] = people(1), x = pick([150, 200, 250, 300, 350, 400]), k = R(2, 6), ans = x * (k + 1);
    return sel(1, 'smeas', { en: `${P[0]} pours ${x} mL of orange juice into a jug.\n${P[0]} then adds ${k} times as much apple juice.\nHow many millilitres of fruit drink does ${P[0]} make?`, zh: `${P[1]}往壶里倒了 ${x} 毫升橙汁，\n又加入了橙汁 ${k} 倍的苹果汁。\n一共做了多少毫升果汁？`,
      correct: ans + ' mL', wrong: [x * k + ' mL', x + k + ' mL', x * (k - 1) + ' mL', x * (k + 2) + ' mL', x * 2 * k + ' mL'],
      solEn: `${x} + ${k} × ${x} = ${ans} mL`, solZh: `${x} + ${x} × ${k} = ${ans} 毫升` });
  });
  add(1, 'snum', () => {   // different remainder
    const d = pick([4, 5, 6, 7, 8, 9]), r = R(1, d - 1), nums = new Set();
    while (nums.size < 4) nums.add(d * R(3, 18) + r);
    let odd; do { odd = d * R(3, 18) + R(0, d - 1); } while (odd % d === r || nums.has(odd));
    const all = [...nums, odd].sort((a, b) => a - b);
    return sel(1, 'snum', { en: `Each of these numbers is divided by ${d}:\n${all.join('   ')}\nWhich number has a different remainder?`, zh: `把下面每个数都除以 ${d}：\n${all.join('   ')}\n哪个数的余数与众不同？`,
      fixed: all.map(String).map(both), answerIndex: all.indexOf(odd), solEn: `The others leave remainder ${r}; ${odd} ÷ ${d} leaves ${odd % d}`, solZh: `其余各数除以 ${d} 都余 ${r}；${odd} ÷ ${d} 余 ${odd % d}` });
  });
  add(1, 'snum', () => {   // geometric missing term
    const r = R(2, 4), s = R(1, 5), seq = [0, 1, 2, 3, 4].map(i => s * r ** i), miss = R(1, 3), ans = seq[miss];
    const shown = seq.map((v, i) => (i === miss ? '▲' : String(v))).join(', ') + ', …';
    return sel(1, 'snum', { en: `What is the value of the missing number ▲ in this number pattern?\n${shown}`, zh: `数列中缺少的数 ▲ 是多少？\n${shown}`,
      correct: String(ans), wrong: [String((seq[miss - 1] + seq[miss + 1]) / 2), String(seq[miss - 1] + r), String(seq[miss - 1] * (r + 1)), String(ans + r), String(ans - s)],
      solEn: `Each number is ${r} times the one before: ${seq[miss - 1]} × ${r} = ${ans}`, solZh: `每个数是前一个数的 ${r} 倍：${seq[miss - 1]} × ${r} = ${ans}` });
  });
  add(1, 'slogic', () => {   // outfits
    const [A, B] = people(2), a = R(2, 5), b = R(2, 6), c = R(2, 5), d = R(2, 6), x = a * b, y = c * d;
    if (x === y) return null;
    const win = x > y ? A : B, diff = Math.abs(x - y);
    const opt = (p, k) => ({ en: `${p[0]}, by ${k}`, zh: `${p[1]}，多 ${k} 种` });
    return sel(1, 'slogic', { en: `${A[0]} has ${a} different pairs of trousers and ${b} different shirts.\n${B[0]} has ${c} different pairs of trousers and ${d} different shirts.\nEach person makes an outfit from 1 pair of trousers and 1 shirt.\nWho has more possible outfits, and by how many?`,
      zh: `${A[1]}有 ${a} 条不同的裤子和 ${b} 件不同的衬衫。\n${B[1]}有 ${c} 条不同的裤子和 ${d} 件不同的衬衫。\n每人用 1 条裤子和 1 件衬衫搭配一套衣服。\n谁能搭配的套数更多？多几种？`,
      correct: opt(win, diff), wrong: [opt(win === A ? B : A, diff), opt(win, Math.abs(a + b - c - d) || diff + 1), opt(win === A ? B : A, Math.abs(a + b - c - d) || diff + 2), opt(win, diff + 2), opt(win, diff * 2)],
      solEn: `${A[0]}: ${a} × ${b} = ${x}; ${B[0]}: ${c} × ${d} = ${y}`, solZh: `${A[1]}：${a} × ${b} = ${x}；${B[1]}：${c} × ${d} = ${y}` });
  });
  add(1, 'smeas', () => {   // litres + millilitres
    const x = [R(1, 3), R(10, 95)], y = [R(1, 4), R(5, 95)], z = R(11, 19) * 100 + pick([0, 50]), tot = x[0] * 1000 + x[1] + y[0] * 1000 + y[1] + z;
    const f = v => `${Math.floor(v / 1000)} L ${v % 1000} mL`;
    const bad = x[0] * 1000 + x[1] * 10 + y[0] * 1000 + y[1] * 10 + z;
    return sel(1, 'smeas', { en: `Container X has ${x[0]} litre${x[0] > 1 ? 's' : ''} ${x[1]} millilitres of water.\nContainer Y has ${y[0]} litres ${y[1]} millilitres.\nContainer Z has ${z} millilitres.\nIf all the water is combined, what is its volume?`,
      zh: `容器 X 有 ${x[0]} 升 ${x[1]} 毫升水，\n容器 Y 有 ${y[0]} 升 ${y[1]} 毫升水，\n容器 Z 有 ${z} 毫升水。\n把三个容器的水倒在一起，一共是多少？`,
      correct: f(tot), wrong: [f(bad), f(tot - 1000), f(tot + 1000), f(tot + 100), f(tot - 100)],
      solEn: `${x[0] * 1000 + x[1]} + ${y[0] * 1000 + y[1]} + ${z} = ${tot} mL = ${f(tot)}`, solZh: `${x[0] * 1000 + x[1]} + ${y[0] * 1000 + y[1]} + ${z} = ${tot} 毫升 = ${f(tot).replace('L', '升').replace('mL', '毫升')}` });
  });
  add(1, 'snum', () => {   // middle card of ordered decimals
    const base = R(3, 7), pool = [];   // tenths like 0.5 and hundredths like 0.56, 0.65 that are easy to confuse
    for (let t = base - 1; t <= base + 1; t++) { pool.push(t / 10); for (let h = 1; h <= 9; h++) pool.push(round(t / 10 + h / 100, 2)); }
    const cards = new Set(shuffle(pool).slice(0, 9));
    const arr = [...cards].filter(v => v > 0);
    if (arr.length < 9) return null;
    const sorted = [...arr].sort((a, b) => a - b), mid = sorted[4], shown = shuffle(arr);
    const opts = shuffle(arr.filter(v => v !== mid)).slice(0, 4).concat(mid).sort((a, b) => a - b);
    return sel(1, 'snum', { en: `Here are some number cards:\n${shown.join('   ')}\nThe cards are put in a line so that the numbers increase from left to right.\nWhich number is on the middle card?`,
      zh: `有这样一些数字卡片：\n${shown.join('   ')}\n把它们从左到右按从小到大排成一行。\n正中间的卡片是哪个数？`, fixed: opts.map(String).map(both), answerIndex: opts.indexOf(mid),
      solEn: `In order: ${sorted.join(', ')}; the 5th card is ${mid}`, solZh: `从小到大：${sorted.join('，')}；第 5 张是 ${mid}` });
  });
  add(1, 'smeas', () => {   // packages on scale
    const tot = pick([2, 2.5, 3, 1.5, 3.5]), p1 = R(30, 95) * 10 + pick([0, 5]), p2 = R(10, 40) * 5, p3 = tot * 1000 - p1 - p2;
    if (p3 <= 50) return null;
    return sel(1, 'smeas', { en: `Three packages weighed together have a total mass of ${tot} kg.\nPackage 1 has a mass of ${p1} g.\nPackage 2 has a mass of ${p2} g.\nWhat is the mass of package 3?`, zh: `三个包裹一起称，总质量是 ${tot} 千克。\n包裹 1 重 ${p1} 克，包裹 2 重 ${p2} 克。\n包裹 3 重多少克？`,
      correct: p3 + ' g', wrong: [p3 + 100 + ' g', p3 - 100 + ' g', tot * 100 - p1 - p2 > 0 ? tot * 100 - p1 - p2 + ' g' : p3 + 1000 + ' g', p1 + p2 + ' g', p3 + 10 + ' g'],
      solEn: `${tot} kg = ${tot * 1000} g; ${tot * 1000} − ${p1} − ${p2} = ${p3} g`, solZh: `${tot} 千克 = ${tot * 1000} 克；${tot * 1000} − ${p1} − ${p2} = ${p3} 克` });
  });
  add(1, 'snum', () => {   // plants into boxes
    const [P] = people(1), per = pick([4, 6, 8, 9]), boxes = R(15, 35), have = per * boxes - R(5, 25), ans = per * boxes - have;
    return sel(1, 'snum', { en: `${P[0]} is packing plants into boxes. Each box holds ${per} plants.\n${P[0]} has ${have} plants and wants to fill ${boxes} boxes.\nHow many more plants are needed?`, zh: `${P[1]}把花苗装进盒子，每盒装 ${per} 棵。\n${P[1]}有 ${have} 棵花苗，想装满 ${boxes} 盒。\n还需要多少棵？`,
      correct: String(ans), wrong: [String(ans + per), String(Math.abs(ans - per)), String(have % per), String(boxes - Math.floor(have / per)), String(ans + 10)],
      solEn: `${boxes} × ${per} = ${per * boxes}; ${per * boxes} − ${have} = ${ans}`, solZh: `${boxes} × ${per} = ${per * boxes}；${per * boxes} − ${have} = ${ans}` });
  });
  add(1, 'smeas', () => {   // seconds in D days expression
    const D = R(2, 30), opts = [`${D} × 24 × 60`, `${D} × 60 × 60`, `${D} × 24 × 60 × 60`, `${D} × 24 × 24 × 60`, `${D} × 24 × 60 × 100`];
    return sel(1, 'smeas', { en: `Which of the following calculations shows how to work out the number of seconds in ${D} days?`, zh: `下面哪个算式可以算出 ${D} 天有多少秒？`, fixed: opts.map(both), answerIndex: 2,
      solEn: `days × 24 hours × 60 minutes × 60 seconds`, solZh: `天数 × 24 小时 × 60 分 × 60 秒` });
  });
  add(1, 'snum', () => {   // racing times order
    const ns = people(5), base = R(55, 61), ts = new Set();
    while (ts.size < 5) ts.add(round(base + pick([0.046, 0.117, 0.2, 0.208, 0.31, 0.09, 0.15, 0.019, 0.302, 0.12, 0.0, 0.25]), 3));
    const times = [...ts], rows = ns.map((p, i) => [p, times[i]]), order = [...rows].sort((a, b) => a[1] - b[1]).slice(0, 3).map(r => r[0]);
    const fmt3 = arr => ({ en: arr.map(p => p[0]).join(', '), zh: arr.map(p => p[1]).join('、') });
    const wrong = [fmt3([order[1], order[0], order[2]]), fmt3([order[0], order[2], order[1]]), fmt3([...rows].sort((a, b) => String(a[1]).length - String(b[1]).length || a[1] - b[1]).slice(0, 3).map(r => r[0])), fmt3([...rows].sort((a, b) => b[1] - a[1]).slice(0, 3).map(r => r[0])), fmt3([order[2], order[1], order[0]])];
    return sel(1, 'snum', { en: `The table shows the times (in seconds) taken by five drivers to complete one lap:\n${rows.map(r => `${r[0][0]}: ${r[1]}`).join('\n')}\nWho were the fastest three drivers, in order, starting with the fastest?`,
      zh: `下表是五名赛车手跑一圈所用的时间（秒）：\n${rows.map(r => `${r[0][1]}：${r[1]}`).join('\n')}\n最快的三名车手依次是谁（从最快开始）？`,
      correct: fmt3(order), wrong, solEn: `Compare place by place: ${[...rows].sort((a, b) => a[1] - b[1]).map(r => `${r[0][0]} ${r[1]}`).join(' < ')}`, solZh: `逐位比较：${[...rows].sort((a, b) => a[1] - b[1]).map(r => `${r[0][1]} ${r[1]}`).join(' < ')}` });
  });
  add(1, 'smeas', () => {   // faulty scale offset
    const off = R(3, 9), m = R(8, 22), reading = off + 2 * m;
    return sel(1, 'smeas', { en: `A set of scales shows ${off} kg when there is nothing on it. Apart from this, it works normally.\nTwo identical blocks are placed on the scales and it shows ${reading} kg.\nWhat is the mass of one block?`,
      zh: `一台秤上什么都不放时显示 ${off} 千克，除此之外称量正常。\n把两个相同的木块放上去，秤显示 ${reading} 千克。\n一个木块重多少千克？`,
      correct: m + ' kg', wrong: [reading / 2 + ' kg', (reading + off) / 2 + ' kg', reading - off + ' kg', m + off + ' kg', m - 1 + ' kg'].filter(s => !/\.\d/.test(s) || true),
      solEn: `(${reading} − ${off}) ÷ 2 = ${m} kg`, solZh: `(${reading} − ${off}) ÷ 2 = ${m} 千克` });
  });
  add(1, 'sstat', () => {   // class sizes table, find missing
    const n = 6, sizes = Array.from({ length: n }, () => R(18, 32)), tot = sizes.reduce((a, b) => a + b, 0);
    return sel(1, 'sstat', { en: `There are ${tot} children in six classes at a school.\n${sizes.slice(0, 5).map((s, i) => `Class ${i + 1}: ${s}`).join('\n')}\nHow many children are in Class 6?`, zh: `某校六个班共有 ${tot} 名学生。\n${sizes.slice(0, 5).map((s, i) => `${i + 1} 班：${s} 人`).join('\n')}\n6 班有多少人？`,
      correct: String(sizes[5]), wrong: [String(sizes[5] + 10), String(sizes[5] - 10), String(Math.round(tot / 6)), String(sizes[5] + 2), String(sizes[5] - 3)],
      solEn: `${tot} − (${sizes.slice(0, 5).join(' + ')}) = ${sizes[5]}`, solZh: `${tot} − (${sizes.slice(0, 5).join(' + ')}) = ${sizes[5]}` });
  });

  /* ======================= Tier 2 – medium ======================= */
  add(2, 'sstat', () => {   // probability with ratio
    const [P] = people(1), b = pick([0.1, 0.15, 0.2]), g = pick([0.1, 0.2, 0.3, 0.25]), k = pick([2, 3]), r = round(k * b, 2), y = round(1 - b - g - r, 2);
    if (y <= 0) return null;
    return sel(2, 'sstat', { en: `${P[0]} has blue, green, red and yellow buttons in a bag.\nThere are ${k === 2 ? 'twice' : 'three times'} as many red buttons as blue buttons.\nIf one button is taken out without looking:\n• the probability that it is blue is ${b}\n• the probability that it is green is ${g}\nWhat is the probability that it is yellow?`,
      zh: `${P[1]}的袋子里有蓝、绿、红、黄四种颜色的纽扣。\n红纽扣的数量是蓝纽扣的 ${k} 倍。\n不看袋子随机摸出一颗：\n• 摸到蓝色的概率是 ${b}\n• 摸到绿色的概率是 ${g}\n摸到黄色的概率是多少？`,
      correct: String(y), wrong: [String(round(1 - b - g, 2)), String(round(1 - g - r, 2)), String(round(b, 2)), String(round(y + 0.1, 2)), String(round(Math.abs(y - 0.1), 2) || 0.05)],
      solEn: `Red = ${k} × ${b} = ${r}; yellow = 1 − ${b} − ${g} − ${r} = ${y}`, solZh: `红色 = ${k} × ${b} = ${r}；黄色 = 1 − ${b} − ${g} − ${r} = ${y}` });
  });
  add(2, 'slogic', () => {   // money chain backwards
    const [A, K, J, L] = people(4), start = pick([10, 20, 30, 40, 50]), l = pick([1.6, 1.2, 2.4, 3.5, 2.25, 4.5]), rest = l * 4, gave = round(start - rest, 2);
    if (gave <= 0) return null;
    return sel(2, 'slogic', { en: `${A[0]} had $${start}. ${A[0]} gave some of this money to ${K[0]}.\n${A[0]} then gave half of what was left to ${J[0]}.\n${J[0]} gave half of this money to ${L[0]}.\n${L[0]} received ${money(l)}.\nHow much did ${A[0]} give to ${K[0]}?`,
      zh: `${A[1]}有 ${start} 元，先给了${K[1]}一些钱，\n又把剩下的一半给了${J[1]}。\n${J[1]}把得到的钱的一半给了${L[1]}。\n${L[1]}得到 ${l} 元。\n${A[1]}给了${K[1]}多少元？`,
      correct: money(gave), wrong: [money(round(start - l * 2, 2)), money(round(l * 4, 2)), money(round(start - l * 8, 2) > 0 ? round(start - l * 8, 2) : gave + 1), money(round(l * 2, 2)), money(round(gave + 0.4, 2))],
      solEn: `${J[0]} got 2 × ${money(l)} = ${money(l * 2)}; ${A[0]} had 2 × ${money(l * 2)} = ${money(rest)} left; gave ${K[0]} ${start} − ${rest} = ${money(gave)}`,
      solZh: `${J[1]}得到 ${l} × 2 = ${l * 2} 元；${A[1]}当时剩 ${l * 2} × 2 = ${rest} 元；给${K[1]} ${start} − ${rest} = ${gave} 元` });
  });
  add(2, 'snum', () => {   // fraction statements
    const [A, B, C] = people(3), n = pick([5, 6, 8, 10, 12]), a = R(1, n - 2), b = R(1, n - a - 1), c = n - a - b;
    const st = [
      { en: `${C[0]} ate less than half of the bar.`, zh: `${C[1]}吃了不到一半。`, ok: c / n < 0.5 },
      { en: `${A[0]} ate more than one quarter of the bar.`, zh: `${A[1]}吃了超过四分之一。`, ok: a / n > 0.25 },
      { en: `${A[0]} and ${B[0]} ate less than three quarters of the bar altogether.`, zh: `${A[1]}和${B[1]}一共吃了不到四分之三。`, ok: (a + b) / n < 0.75 }
    ];
    if ([c / n, a / n, (a + b) / n].some(v => v === 0.5 || v === 0.25 || v === 0.75)) return null;
    return statementsQ(2, 'snum', `${A[0]}, ${B[0]} and ${C[0]} shared a chocolate bar. ${A[0]} ate ${G.fracStr(a, n)} of the bar, ${B[0]} ate ${G.fracStr(b, n)} and ${C[0]} ate the rest.`,
      `${A[1]}、${B[1]}、${C[1]}分一块巧克力。${A[1]}吃了 ${G.fracStr(a, n)}，${B[1]}吃了 ${G.fracStr(b, n)}，${C[1]}吃了剩下的。`, st,
      `${C[0]} ate ${G.fracStr(c, n)}; compare each with 1/2, 1/4 and 3/4.`, `${C[1]}吃了 ${G.fracStr(c, n)}；分别与 1/2、1/4、3/4 比较。`);
  });
  add(2, 'sspace', () => {   // faces + edges + vertices
    const n = R(4, 9), pyr = Math.random() < 0.5, nm = { 4: ['square', '四边形'], 5: ['pentagonal', '五边形'], 6: ['hexagonal', '六边形'], 7: ['heptagonal', '七边形'], 8: ['octagonal', '八边形'], 9: ['nonagonal', '九边形'] }[n];
    const F = pyr ? n + 1 : n + 2, E = pyr ? 2 * n : 3 * n, V = pyr ? n + 1 : 2 * n, ans = F + E + V, other = pyr ? 6 * n + 2 : 4 * n + 2;
    return sel(2, 'sspace', { en: `What is the sum of the number of faces, edges and vertices of a ${pyr ? 'pyramid' : 'prism'} with a ${nm[0]} base?`, zh: `底面是${nm[1]}的${pyr ? '棱锥' : '棱柱'}，面数、棱数、顶点数之和是多少？`,
      correct: String(ans), wrong: [String(other), String(ans - 2), String(ans + 2), String(3 * n), String(ans + n)],
      solEn: `faces ${F} + edges ${E} + vertices ${V} = ${ans}`, solZh: `面 ${F} + 棱 ${E} + 顶点 ${V} = ${ans}` });
  });
  add(2, 'slogic', () => {   // three boxes weighed in pairs
    const a = R(8, 25), b = R(8, 25), c = R(8, 25), p = [a + b, b + c, a + c], tot = a + b + c;
    return sel(2, 'slogic', { en: `Three different boxes are weighed in pairs. The pairs weigh ${p[0]} kg, ${p[1]} kg and ${p[2]} kg.\nWhen all three boxes are weighed together, what is their combined weight?`, zh: `把三个不同的箱子两两称重，分别重 ${p[0]} 千克、${p[1]} 千克、${p[2]} 千克。\n三个箱子一起重多少千克？`,
      correct: tot + ' kg', wrong: [p[0] + p[1] + p[2] + ' kg', Math.max(...p) * 2 + ' kg', p[0] + p[1] + ' kg', tot + 6 + ' kg', Math.round((p[0] + p[1] + p[2]) / 3) + ' kg'],
      solEn: `Adding the pairs counts every box twice: (${p.join(' + ')}) ÷ 2 = ${tot} kg`, solZh: `三组相加，每个箱子都算了两次：(${p.join(' + ')}) ÷ 2 = ${tot} 千克` });
  });
  add(2, 'smeas', () => {   // old units chain
    const a = R(2, 5), b = 2, c = R(4, 9), ans = a * b * c;
    return sel(2, 'smeas', { en: `Four old units for capacity are gill, pint, quart and peck.\n• ${a} gills equal 1 pint.\n• 1 pint equals half a quart.\n• ${c} quarts equal 1 peck.\nHow many gills equal 1 peck?`, zh: `及耳、品脱、夸脱、配克是四个古老的容量单位。\n• ${a} 及耳 = 1 品脱\n• 1 品脱 = 半夸脱\n• ${c} 夸脱 = 1 配克\n1 配克等于多少及耳？`,
      correct: String(ans), wrong: [String(a * c), String(a * c / 2), String(a + b + c), String(ans * 2), String(a * b + c)],
      solEn: `1 quart = 2 pints = ${a * 2} gills; 1 peck = ${c} × ${a * 2} = ${ans} gills`, solZh: `1 夸脱 = 2 品脱 = ${a * 2} 及耳；1 配克 = ${c} × ${a * 2} = ${ans} 及耳` });
  });
  add(2, 'snum', () => {   // greatest difference with hidden digits
    const t1 = R(6, 9), t2 = R(2, t1 - 1), d1 = R(1, 8), d2 = R(1, 8), hi = round(t1 * 10 + 9 + d1 / 10 + 0.09, 2), lo = round(t2 * 10 + d2 / 10, 2), ans = round(hi - lo, 2);
    return sel(2, 'snum', { en: `In the prices below, each shape stands for a missing digit (0–9).\n$${t1}■.${d1}●     $${t2}▲.${d2}◆\nWhat is the greatest possible difference between the prices?`, zh: `下面的价格中，每个图形代表一个缺失的数字（0–9）。\n$${t1}■.${d1}●     $${t2}▲.${d2}◆\n两个价格最大可能相差多少？`,
      correct: money(ans), wrong: [money(round(ans - 0.09, 2)), money(round(ans - 9, 2)), money(round(ans - 9.09, 2)), money(round(ans + 0.09, 2)), money(round(ans - 0.9, 2))],
      solEn: `Largest first price ${money(hi)}, smallest second price ${money(lo)}: ${money(ans)}`, solZh: `第一个价格最大为 ${hi} 元，第二个最小为 ${lo} 元：相差 ${ans} 元` });
  });
  add(2, 'snum', () => {   // times as many chain
    const [F, Ga, H] = people(3), k = pick([5, 6, 8, 10]), m = pick([2, 3, 4]), ans = k * m;
    return sel(2, 'snum', { en: `${F[0]} has ${k} times as many stickers as ${Ga[0]}.\n${H[0]} has 1/${m} as many stickers as ${Ga[0]}.\n${F[0]} has ☐ times as many stickers as ${H[0]}.\nWhat is the missing number?`, zh: `${F[1]}的贴纸数是${Ga[1]}的 ${k} 倍。\n${H[1]}的贴纸数是${Ga[1]}的 1/${m}。\n${F[1]}的贴纸数是${H[1]}的 ☐ 倍。\n☐ 里应填几？`,
      correct: String(ans), wrong: [G.fracStr(k, m), G.fracStr(m, k), String(k + m), String(k - m), String(1 / ans).length < 6 ? `1/${ans}` : String(ans + m)],
      solEn: `If ${H[0]} has 1, ${Ga[0]} has ${m} and ${F[0]} has ${k * m}`, solZh: `设${H[1]}有 1 份，${Ga[1]}有 ${m} 份，${F[1]}有 ${k * m} 份` });
  });
  add(2, 'snum', () => {   // biscuit packets chain
    const s = R(4, 12) * 2, mdm = s * 3 / 2, lrg = mdm * 3 / 2;
    if (!Number.isInteger(lrg)) return null;
    return sel(2, 'snum', { en: `A large packet holds ${lrg} biscuits.\nTwo large packets hold the same number of biscuits as three medium packets.\nTwo medium packets hold the same number as three small packets.\nHow many biscuits does a small packet hold?`, zh: `一大包饼干有 ${lrg} 块。\n2 大包的块数等于 3 中包的块数，\n2 中包的块数等于 3 小包的块数。\n一小包有多少块？`,
      correct: String(s), wrong: [String(mdm), String(lrg / 3), String(s + 2), String(lrg - 2 * s > 0 ? lrg - 2 * s : s - 2), String(Math.round(lrg / 2))],
      solEn: `Medium = ${lrg} × 2 ÷ 3 = ${mdm}; small = ${mdm} × 2 ÷ 3 = ${s}`, solZh: `中包 = ${lrg} × 2 ÷ 3 = ${mdm}；小包 = ${mdm} × 2 ÷ 3 = ${s}` });
  });
  add(2, 'slogic', () => {   // movie tickets halving
    const [P] = people(1), mon = 4 * R(30, 90), thu = R(4, 12) * 10, tot = mon + mon / 2 + mon / 4 + thu;
    return sel(2, 'slogic', { en: `A cinema sold ${tot} tickets on Monday, Tuesday, Wednesday and Thursday.\nOn Tuesday it sold half as many as on Monday.\nOn Wednesday it sold half as many as on Tuesday.\nOn Thursday it sold ${thu} tickets.\nHow many tickets were sold on Monday?`, zh: `电影院周一到周四共卖出 ${tot} 张票。\n周二卖出的是周一的一半，周三卖出的是周二的一半，周四卖出 ${thu} 张。\n周一卖出多少张？`,
      correct: String(mon), wrong: [String((tot - thu) / 2), String(Math.round((tot - thu) / 3)), String(mon / 2), String(mon + 20), String(tot - thu)],
      solEn: `Mon + Tue + Wed = ${tot - thu} = 4 + 2 + 1 = 7 parts; 1 part = ${mon / 4}; Monday = 4 parts = ${mon}`, solZh: `前三天共 ${tot - thu} 张 = 4 + 2 + 1 = 7 份；1 份 = ${mon / 4}；周一 = 4 份 = ${mon}` });
  });
  add(2, 'snum', () => {   // closest to a fraction
    const [n, d] = pick([[7, 10], [3, 4], [2, 3], [5, 8], [3, 8], [4, 5]]), v = n / d, c = new Set();
    while (c.size < 5) c.add(round(v + R(-12, 12) / 100, 2));
    const arr = [...c].filter(x => x > 0 && x < 1).sort((a, b) => a - b);
    if (arr.length < 5) return null;
    const dist = arr.map(x => Math.abs(x - v)), best = Math.min(...dist);
    if (dist.filter(x => Math.abs(x - best) < 1e-9).length > 1) return null;
    const ans = arr[dist.indexOf(best)];
    return sel(2, 'snum', { en: `Which of these numbers is closest to ${n}/${d}?`, zh: `下面哪个数最接近 ${n}/${d}？`, fixed: arr.map(String).map(both), answerIndex: arr.indexOf(ans),
      solEn: `${n}/${d} = ${round(v, 4)}; closest is ${ans}`, solZh: `${n}/${d} = ${round(v, 4)}，最接近的是 ${ans}` });
  });
  add(2, 'snum', () => {   // laps LCM
    const ns = people(3), t = shuffle([4, 6, 8, 9, 10, 12, 15]).slice(0, 3), L = t.reduce(lcm);
    if (L > 360) return null;
    return sel(2, 'snum', { en: `${ns.map(p => p[0]).join(', ')} run laps of a track, all starting on the start line together.\n${ns.map((p, i) => `${p[0]} runs a lap every ${t[i]} minutes.`).join('\n')}\nAfter how many minutes are all three next on the start line at the same time?`,
      zh: `${ns.map(p => p[1]).join('、')}同时从起跑线出发绕跑道跑步。\n${ns.map((p, i) => `${p[1]}每 ${t[i]} 分钟跑一圈。`).join('\n')}\n至少多少分钟后三人再次同时到达起跑线？`,
      correct: L + ' min', wrong: [t[0] * t[1] * t[2] + ' min', t[0] + t[1] + t[2] + ' min', L / 2 + ' min', L * 2 + ' min', Math.max(...t) * 2 + ' min'],
      solEn: `Lowest common multiple of ${t.join(', ')} = ${L}`, solZh: `${t.join('、')} 的最小公倍数是 ${L}` });
  });
  add(2, 'smeas', () => {   // can half / quarter full
    const can = R(10, 40), full = 4 * R(30, 80), half = can + full / 2, qtr = can + full / 4, ask = pick(['three', 'empty']);
    const ans = ask === 'three' ? can + 3 * full / 4 : can;
    return sel(2, 'smeas', { en: `When a can of sweetcorn is half full, the can and sweetcorn together have a mass of ${half} g.\nWhen it is one-quarter full, the mass is ${qtr} g.\n${ask === 'three' ? 'What is the mass when the can is three-quarters full?' : 'What is the mass of the empty can?'}`,
      zh: `一罐玉米粒装了一半时，连罐共重 ${half} 克；\n装了四分之一时，共重 ${qtr} 克。\n${ask === 'three' ? '装了四分之三时，共重多少克？' : '空罐重多少克？'}`,
      correct: ans + ' g', wrong: ask === 'three' ? [half + qtr + ' g', half * 1.5 + ' g', half + 2 * (half - qtr) + ' g', 3 * qtr + ' g', ans + 10 + ' g'] : [qtr / 2 + ' g', half - qtr + ' g', 2 * qtr - half + 10 + ' g', ans + 5 + ' g', ans - 5 + ' g'],
      solEn: `A quarter of the sweetcorn = ${half} − ${qtr} = ${half - qtr} g. ${ask === 'three' ? `${half} + ${half - qtr} = ${ans} g` : `${qtr} − ${half - qtr} = ${ans} g`}`, solZh: `四分之一罐玉米粒重 ${half} − ${qtr} = ${half - qtr} 克。${ask === 'three' ? `${half} + ${half - qtr} = ${ans} 克` : `${qtr} − ${half - qtr} = ${ans} 克`}` });
  });
  add(2, 'slogic', () => {   // menu prices
    const b = R(30, 70) / 10 * 1, c = R(15, 40) / 10, d = R(10, 30) / 10, bd = round(b + d, 2), cd = round(c + d, 2), all = round(b + c + d, 2), ans = round(b + c, 2);
    return sel(2, 'slogic', { en: `The prices on a café menu have been torn off.\nA burger and a drink cost ${money(bd)}.\nChips and a drink cost ${money(cd)}.\nA burger, chips and a drink cost ${money(all)}.\nHow much do a burger and chips cost?`, zh: `咖啡馆菜单上的价格被撕掉了。\n汉堡加饮料 ${bd.toFixed(2)} 元，\n薯条加饮料 ${cd.toFixed(2)} 元，\n汉堡、薯条加饮料 ${all.toFixed(2)} 元。\n汉堡加薯条多少元？`,
      correct: money(ans), wrong: [money(round(bd + cd, 2)), money(round(all - d + 0.5, 2)), money(round(bd + cd - all + 1, 2)), money(round(all - 1, 2)), money(round(ans + 0.25, 2))],
      solEn: `Drink = ${money(bd)} + ${money(cd)} − ${money(all)} = ${money(d)}; burger + chips = ${money(all)} − ${money(d)} = ${money(ans)}`, solZh: `饮料 = ${bd} + ${cd} − ${all} = ${round(d, 2)} 元；汉堡 + 薯条 = ${all} − ${round(d, 2)} = ${ans} 元` });
  });
  add(2, 'smeas', () => {   // coins equal number
    const n = R(8, 30), w1 = R(6, 10), w2 = R(5, 9), tot = 3 * n, ans = n * (w1 + w2);
    return sel(2, 'smeas', { en: `I have an equal number of $1 and $2 coins. Their total value is $${tot}.\n$1 coins weigh ${w1} g and $2 coins weigh ${w2} g.\nWhat is the total weight of all my coins?`, zh: `我有同样多的 1 元和 2 元硬币，总值 ${tot} 元。\n1 元硬币每枚重 ${w1} 克，2 元硬币每枚重 ${w2} 克。\n所有硬币共重多少克？`,
      correct: ans + ' g', wrong: [tot * (w1 + w2) + ' g', tot / 2 * (w1 + w2) + ' g', n * w1 + ' g', 2 * n * (w1 + w2) + ' g', ans + w1 + ' g'],
      solEn: `Each $1 + $2 pair = $3, so ${tot} ÷ 3 = ${n} pairs; ${n} × (${w1} + ${w2}) = ${ans} g`, solZh: `一对硬币 3 元，${tot} ÷ 3 = ${n} 对；${n} × (${w1} + ${w2}) = ${ans} 克` });
  });
  add(2, 'sstat', () => {   // Venn areas
    const both2 = R(20, 60), h = both2 + R(30, 90), b = both2 + R(10, 50), tot = h + b - both2;
    return sel(2, 'sstat', { en: `A map of an island shows areas with only hills, only bush, or both. These areas cover the whole island.\nThe island's total area is ${tot} km².\nThe area with hills is ${h} km².\nThe area with bush is ${b} km².\nWhat area has both hills and bush?`, zh: `一座岛上的区域分为只有山、只有灌木、两者都有三种，覆盖整座岛。\n岛的总面积是 ${tot} 平方千米，\n有山的面积是 ${h} 平方千米，\n有灌木的面积是 ${b} 平方千米。\n既有山又有灌木的面积是多少？`,
      correct: both2 + ' km²', wrong: [tot - h + ' km²', tot - b + ' km²', h - b + ' km²', Math.round((h + b) / 2) + ' km²', both2 + 10 + ' km²'],
      solEn: `${h} + ${b} − ${tot} = ${both2} km² (the overlap is counted twice)`, solZh: `${h} + ${b} − ${tot} = ${both2} 平方千米（重叠部分被算了两次）` });
  });
  add(2, 'snum', () => {   // fractions of remainder backwards
    const a = pick([3, 4, 5]), b = pick([2, 3, 4]), left = R(3, 12) * (a - 1) * (b - 1) / gcd((a - 1) * (b - 1), 1), unit = left / ((a - 1) * (b - 1)), tot = unit * a * b;
    if (!Number.isInteger(tot)) return null;
    return sel(2, 'snum', { en: `A gardener plants 1/${a} of a box of bulbs in the first section of a garden.\nThe gardener then plants 1/${b} of the remaining bulbs in the second section.\nThere are ${left} bulbs left, which go in the third section.\nHow many bulbs were in the box at the start?`, zh: `园丁把一盒球根的 1/${a} 种在第一块地，\n再把剩下的 1/${b} 种在第二块地，\n还剩 ${left} 个种在第三块地。\n盒里原来有多少个球根？`,
      correct: String(tot), wrong: [String(left * a), String(left * b), String(left * (a + b)), String(tot + unit * a), String(left + a + b)],
      solEn: `Left = ${a - 1}/${a} × ${b - 1}/${b} = ${G.fracStr((a - 1) * (b - 1), a * b)} of the box = ${left}, so the box had ${tot}`, solZh: `剩下的是 ${a - 1}/${a} × ${b - 1}/${b} = ${G.fracStr((a - 1) * (b - 1), a * b)}，对应 ${left} 个，所以原有 ${tot} 个` });
  });
  add(2, 'sstat', () => {   // disc probability ratio
    const k = R(2, 4), y = 1, bl = k, rd = bl, tot = y + bl + rd;
    return sel(2, 'sstat', { en: `A bag contains red, blue and yellow discs.\nThere are equal numbers of red and blue discs.\nThere are ${k === 2 ? 'twice' : k + ' times'} as many blue discs as yellow discs.\nOne disc is chosen without looking. What is the probability that it is blue?`, zh: `袋中有红、蓝、黄三种颜色的圆片。\n红片和蓝片一样多，\n蓝片是黄片的 ${k} 倍。\n随机摸出一片，是蓝片的概率是多少？`,
      correct: G.fracStr(bl, tot), wrong: [G.fracStr(1, 3), G.fracStr(bl, bl + y), G.fracStr(1, tot), G.fracStr(bl * 2, tot), G.fracStr(1, 2)],
      solEn: `yellow : blue : red = 1 : ${k} : ${k}; P(blue) = ${k}/${tot}`, solZh: `黄 : 蓝 : 红 = 1 : ${k} : ${k}；P(蓝) = ${k}/${tot}` });
  });
  add(2, 'sspace', () => {   // perimeter with corner cut / notch
    const L = R(8, 16), W = R(6, 12), a = R(2, Math.floor(L / 2)), b = R(2, W - 2), notch = Math.random() < 0.5, ans = 2 * (L + W) + (notch ? 2 * b : 0);
    return sel(2, 'sspace', { en: `A rectangle is ${L} cm long and ${W} cm wide.\nA smaller rectangle ${a} cm by ${b} cm is cut out ${notch ? `from the middle of one ${L} cm side (so it makes a notch ${b} cm deep)` : 'from one corner'}.\nWhat is the perimeter of the shape that is left?`,
      zh: `一个长方形长 ${L} 厘米，宽 ${W} 厘米。\n从${notch ? `一条 ${L} 厘米长边的中间剪去一个 ${a} 厘米 × ${b} 厘米的小长方形（形成 ${b} 厘米深的缺口）` : `一个角上剪去一个 ${a} 厘米 × ${b} 厘米的小长方形`}。\n剩下图形的周长是多少？`,
      correct: ans + ' cm', wrong: [2 * (L + W) - 2 * (a + b) + ' cm', 2 * (L + W) + (notch ? 0 : 2 * b) + ' cm', 2 * (L + W) + 2 * (a + b) + ' cm', 2 * (L + W) - a + ' cm', ans + 2 + ' cm'],
      solEn: notch ? `The notch adds its two ${b} cm sides: ${2 * (L + W)} + 2 × ${b} = ${ans} cm` : `Cutting a corner does not change the perimeter: 2 × (${L} + ${W}) = ${ans} cm`, solZh: notch ? `缺口多出两条 ${b} 厘米的边：${2 * (L + W)} + 2 × ${b} = ${ans} 厘米` : `剪去一个角，周长不变：(${L} + ${W}) × 2 = ${ans} 厘米` });
  });
  add(2, 'smeas', () => {   // km m difference
    const a = R(3, 30), b = R(10, 99), c = b, d = a, x = a * 1000 + b, y = c * 1000 + d, diff = Math.abs(y - x);
    if (b < 10 || a >= b) return null;
    const f = v => `${Math.floor(v / 1000)} km ${v % 1000} m`;
    return sel(2, 'smeas', { en: `Two statues are ${a} km ${b} m apart.\nA map-maker incorrectly labels the distance as ${c} km ${d} m.\nWhat is the difference between the correct and incorrect distances?`, zh: `两座雕像相距 ${a} 千米 ${b} 米。\n地图上错误地标成了 ${c} 千米 ${d} 米。\n正确距离与错误距离相差多少？`,
      correct: f(diff), wrong: [f(diff + 10), f(Math.abs((c - a) * 1000 - (b - d))), f(diff - 1000 > 0 ? diff - 1000 : diff + 2000), f(Math.abs((c - a) * 1000 + Math.abs(b - d))), f(diff + 100)],
      solEn: `${fmtN(y)} m − ${fmtN(x)} m = ${fmtN(diff)} m = ${f(diff)}`, solZh: `${fmtN(y)} 米 − ${fmtN(x)} 米 = ${fmtN(diff)} 米` });
  });
  add(2, 'sstat', () => {   // picture-graph keys
    const keys = [4, 8, 12, 6, 10], vals = Array.from({ length: 3 }, () => 4 * R(4, 12)), kx = shuffle(keys).slice(0, 3);
    const okK = k => vals.every(v => v % (k / 2) === 0);
    const st = kx.map(k => ({ en: `one whole flower represents ${k} bunches`, zh: `一朵完整的花代表 ${k} 束`, ok: okK(k) }));
    return statementsQ(2, 'sstat', `A picture graph will show bunches of flowers sold: Monday ${vals[0]}, Tuesday ${vals[1]}, Wednesday ${vals[2]}.\nOnly whole flowers and half flowers may be drawn.\nWhich keys could be used?`,
      `要用象形统计图表示卖出的花束：周一 ${vals[0]} 束，周二 ${vals[1]} 束，周三 ${vals[2]} 束。\n只能画整朵花或半朵花。\n可以用哪些图例？`, st,
      'A key works if every value is a multiple of half the key.', '每个数据都必须是图例数量一半的倍数。');
  });
  add(2, 'sstat', () => {   // cumulative rainfall
    const w = Array.from({ length: 5 }, () => R(2, 9) * 10), i = R(0, 3), j = R(i + 1, 4);
    w[j] = w[i];
    for (let k = 0; k < 5; k++) if (k !== i && k !== j && w.filter(v => v === w[k]).length > 1) return null;
    const cum = w.reduce((acc, v) => acc.concat((acc[acc.length - 1] || 0) + v), []);
    const opt = (a, b) => ({ en: `weeks ${a + 1} and ${b + 1}`, zh: `第 ${a + 1} 周和第 ${b + 1} 周` });
    const pairs = []; for (let a = 0; a < 5; a++) for (let b = a + 1; b < 5; b++) pairs.push([a, b]);
    const choices = shuffle(pairs.filter(p => !(p[0] === i && p[1] === j))).slice(0, 4).concat([[i, j]]).sort((a, b) => a[0] - b[0] || a[1] - b[1]);
    return sel(2, 'sstat', { en: `Rain is collected in a container that starts empty. No water is lost.\nThe amount in the container at the end of each week:\n${cum.map((c, k) => `end of week ${k + 1}: ${c} mL`).join('\n')}\nDuring which two weeks was there exactly the same amount of rainfall?`,
      zh: `用一个空容器收集雨水，雨水不会流失。\n每周末容器中的水量：\n${cum.map((c, k) => `第 ${k + 1} 周末：${c} 毫升`).join('\n')}\n哪两周的降雨量完全相同？`,
      fixed: choices.map(p => opt(p[0], p[1])), answerIndex: choices.findIndex(p => p[0] === i && p[1] === j),
      solEn: `Weekly rain: ${w.join(', ')} mL`, solZh: `每周降雨：${w.join('、')} 毫升` });
  });

  /* ======================= Tier 3 – harder ======================= */
  add(3, 'slogic', () => {   // magic square
    const LO = [[2, 7, 6], [9, 5, 1], [4, 3, 8]], a = R(0, 10), d = R(1, 3);
    let sq = LO.map(r => r.map(v => a + d * v));
    if (Math.random() < 0.5) sq = sq.map(r => [...r].reverse());
    if (Math.random() < 0.5) sq = [...sq].reverse();
    const S = sq[0].reduce((x, y) => x + y, 0), ans = sq[1][2];
    const cells = sq.map((r, ri) => r.map((v, ci) => (ri === 0 || (ri === 1 && ci === 0) ? String(v) : ri === 1 && ci === 2 ? '♦' : '')));
    return sel(3, 'slogic', { fig: { type: 'table', grid: true, rows: cells },
      en: `In a magic square, each row, each column and each diagonal add up to the same total.\nSome of the numbers in the magic square below are missing.\nWhat is the missing number at ♦?`, zh: `幻方中每行、每列、每条对角线上的数之和都相等。\n下面幻方中有些数缺失了。\n♦ 处的数是多少？`,
      correct: String(ans), wrong: [String(S - sq[1][0] - sq[0][1]), String(sq[1][1]), String(S / 3 + d), String(ans + d * 2), String(Math.abs(ans - d * 3))],
      solEn: `Total = ${S}. Column 1 gives the bottom-left ${sq[2][0]}; the diagonal gives the centre ${sq[1][1]}; ♦ = ${S} − ${sq[1][0]} − ${sq[1][1]} = ${ans}`, solZh: `每行和为 ${S}。由第一列得左下角 ${sq[2][0]}；由对角线得中心 ${sq[1][1]}；♦ = ${S} − ${sq[1][0]} − ${sq[1][1]} = ${ans}` });
  });
  add(3, 'sstat', () => {   // spinner statements
    const nums = shuffle([R(1, 3), R(4, 5), R(6, 7), R(8, 9)]), [C, E] = people(2), chen = pick(nums);
    const lessP = nums.filter(n => n < chen).length / 4, sumT = R(chen + 2, chen + 9), sumP = nums.filter(n => n + chen > sumT).length / 4, evenP = nums.filter(n => n % 2 === 0).length / 4;
    const fr = p => G.fracStr(Math.round(p * 4), 4);
    const claims = [
      { en: `The probability that ${E[0]} gets an even number is ${fr(pick([evenP, (evenP + 0.25) % 1.25]))}.`, zh: `${E[1]}转到偶数的概率是 ${fr(pick([evenP, (evenP + 0.25) % 1.25]))}。` },
      { en: `The probability that ${E[0]}'s number is less than ${C[0]}'s is ${fr(pick([lessP, Math.min(1, lessP + 0.25)]))}.`, zh: `${E[1]}的数比${C[1]}小的概率是 ${fr(pick([lessP, Math.min(1, lessP + 0.25)]))}。` },
      { en: `The probability that the two numbers add up to more than ${sumT} is ${fr(pick([sumP, Math.min(1, sumP + 0.25)]))}.`, zh: `两人的数之和大于 ${sumT} 的概率是 ${fr(pick([sumP, Math.min(1, sumP + 0.25)]))}。` }
    ];
    const truths = [evenP, lessP, sumP];
    claims.forEach((c, i) => { c.ok = c.en.endsWith(fr(truths[i]) + '.'); });
    return statementsQ(3, 'sstat', `A spinner has four equal sections numbered ${nums.join(', ')}. ${C[0]} spins it and gets ${chen}. Now ${E[0]} spins it once.`,
      `一个转盘平均分成四格，分别是 ${nums.join('、')}。${C[1]}转到了 ${chen}，现在${E[1]}转一次。`, claims,
      `Even: ${fr(evenP)}; less than ${chen}: ${fr(lessP)}; sum > ${sumT}: ${fr(sumP)}`, `偶数：${fr(evenP)}；小于 ${chen}：${fr(lessP)}；和大于 ${sumT}：${fr(sumP)}`, false,
      { type: 'spinner', labels: nums });
  });
  add(3, 'smeas', () => {   // time zones + flights
    const [P] = people(1), dep = R(6, 20) * 60, day = R(0, 6), f1 = R(4, 8), stay = pick([12, 18, 24, 30]), f2 = R(10, 20), behind = pick([15, 16, 17, 18, 19]);
    const totalH = f1 + stay + f2, arriveHome = day * 1440 + dep + totalH * 60, arriveSyd = arriveHome + behind * 60;
    const fmt = m => ({ en: `${DAYS[Math.floor(m / 1440) % 7][0]} at ${hhmm(m)}`, zh: `${DAYS[Math.floor(m / 1440) % 7][1]} ${hhmm(m)}` });
    return sel(3, 'smeas', { en: `${P[0]} lives in Las Vegas and leaves on ${DAYS[day][0]} at ${hhmm(dep)} local time on a ${f1}-hour flight to New York.\n${P[0]} spends ${stay} hours in New York, then catches a ${f2}-hour flight to Sydney.\nThe time in Las Vegas is ${behind} hours behind the time in Sydney.\nWhat time is it in Sydney when ${P[0]} arrives?`,
      zh: `${P[1]}住在拉斯维加斯，于当地时间${DAYS[day][1]} ${hhmm(dep)} 乘坐 ${f1} 小时的航班飞往纽约，\n在纽约停留 ${stay} 小时后，乘坐 ${f2} 小时的航班飞往悉尼。\n拉斯维加斯时间比悉尼时间晚 ${behind} 小时。\n她到达时悉尼是什么时间？`,
      correct: fmt(arriveSyd), wrong: [fmt(arriveHome), fmt(arriveHome - behind * 60), fmt(arriveSyd + 1440), fmt(arriveSyd - 1440), fmt(arriveSyd + 120)],
      solEn: `Journey = ${f1} + ${stay} + ${f2} = ${totalH} h → arrives ${fmt(arriveHome).en} Las Vegas time; + ${behind} h = ${fmt(arriveSyd).en} Sydney time`, solZh: `全程 ${totalH} 小时，到达时拉斯维加斯为${fmt(arriveHome).zh}；加 ${behind} 小时 = 悉尼${fmt(arriveSyd).zh}` });
  });
  add(3, 'snum', () => {   // each number = sum of previous three
    const a = R(1, 5), b = R(0, 4), c = R(0, 3), s = [a, b, c]; for (let i = 3; i < 6; i++) s.push(s[i - 1] + s[i - 2] + s[i - 3]);
    const [P] = people(1);
    return sel(3, 'snum', { en: `${P[0]} makes a number pattern:\n• Choose the first three numbers.\n• After this, each number is the sum of the three numbers before it.\nHere is the pattern with three missing numbers X, Y and Z:\n${a}, X, ${c}, Y, ${s[4]}, Z\nAll the numbers are whole numbers. What number does Z represent?`,
      zh: `${P[1]}编了一个数列：\n• 先任选前三个数；\n• 之后每个数都等于它前面三个数的和。\n下面的数列中 X、Y、Z 缺失：\n${a}，X，${c}，Y，${s[4]}，Z\n所有数都是整数。Z 是多少？`,
      correct: String(s[5]), wrong: [String(s[5] - 1), String(s[5] + 1), String(s[4] + c + a), String(s[4] * 2), String(s[5] + 2)],
      solEn: `Y = ${a} + X + ${c}; ${s[4]} = X + ${c} + Y = ${a} + 2X + ${2 * c} → X = ${b}, Y = ${s[3]}; Z = ${c} + ${s[3]} + ${s[4]} = ${s[5]}`, solZh: `Y = ${a} + X + ${c}；${s[4]} = X + ${c} + Y = ${a} + 2X + ${2 * c}，得 X = ${b}，Y = ${s[3]}；Z = ${c} + ${s[3]} + ${s[4]} = ${s[5]}` });
  });
  add(3, 'slogic', () => {   // stars and hearts
    const s = R(2, 7), h = R(2, 7), a = R(2, 4), b = R(3, 6), k = R(1, 3);
    if (s === h) return null;
    const p1 = a * s + b * h, p2 = (a + k) * s + (b + k) * h;
    return sel(3, 'slogic', { en: `In a game I collect stars and hearts. Each star is always worth the same number of points, and each heart is always worth a (different) number of points.\n${a} stars and ${b} hearts score ${p1} points.\n${a + k} stars and ${b + k} hearts score ${p2} points.\nHow many points do I get for 1 star and 1 heart?`,
      zh: `游戏中收集星星和爱心。每颗星星的分数相同，每颗爱心的分数也相同（与星星不同）。\n${a} 颗星星和 ${b} 颗爱心得 ${p1} 分。\n${a + k} 颗星星和 ${b + k} 颗爱心得 ${p2} 分。\n1 颗星星和 1 颗爱心共得多少分？`,
      correct: String(s + h), wrong: [String(p2 - p1), String(Math.round((p1 + p2) / (a + b + a + b + 2 * k))), String(s + h + k), String(p1 + p2), String(Math.abs(s - h) + s + h + 1)],
      solEn: `The second has ${k} more of each: ${k} × (star + heart) = ${p2} − ${p1} = ${p2 - p1}, so star + heart = ${s + h}`, solZh: `第二次比第一次每种多 ${k} 个：${k} ×（星 + 心）= ${p2} − ${p1} = ${p2 - p1}，所以星 + 心 = ${s + h}` });
  });
  add(3, 'snum', () => {   // multiples of a not of b
    const a = pick([3, 4, 6, 7]), b = pick([4, 5, 8, 9, 10].filter(x => x !== a)), N = pick([100, 120, 150, 200]);
    if (a === b) return null;
    const ans = Math.floor(N / a) - Math.floor(N / lcm(a, b));
    return sel(3, 'snum', { en: `How many whole numbers between 1 and ${N} are multiples of ${a}, but are not multiples of ${b}? (Include ${a} itself.)`, zh: `1 到 ${N} 之间，有多少个整数是 ${a} 的倍数但不是 ${b} 的倍数？（包括 ${a} 本身）`,
      correct: String(ans), wrong: [String(Math.floor(N / a)), String(Math.floor(N / a) - Math.floor(N / (a * b))), String(Math.floor(N / a) - Math.floor(N / b)), String(ans + 1), String(ans - 2)],
      solEn: `Multiples of ${a}: ${Math.floor(N / a)}; of these, multiples of ${b} are multiples of ${lcm(a, b)}: ${Math.floor(N / lcm(a, b))}; ${Math.floor(N / a)} − ${Math.floor(N / lcm(a, b))} = ${ans}`, solZh: `${a} 的倍数有 ${Math.floor(N / a)} 个，其中同时是 ${b} 的倍数的即 ${lcm(a, b)} 的倍数，有 ${Math.floor(N / lcm(a, b))} 个；${ans}` });
  });
  add(3, 'slogic', () => {   // best buy mandarins
    const p1 = pick([0.5, 0.6, 0.4]), p10 = round(p1 * 10 - pick([0.5, 1]), 2), p30 = round(p10 * 3 - pick([0.5, 1, 1.5]), 2), B = pick([25, 20, 30, 18]);
    let best = 0;
    for (let x = 0; x * p30 <= B; x++) for (let y = 0; x * p30 + y * p10 <= B + 1e-9; y++) { const rem = B - x * p30 - y * p10; best = Math.max(best, 30 * x + 10 * y + Math.floor(rem / p1 + 1e-9)); }
    const greedySingles = Math.floor(B / p1);
    return sel(3, 'slogic', { en: `A shop sells mandarins three ways:\n1 mandarin for ${money(p1)}\na bag of 10 for ${money(p10)}\na bag of 30 for ${money(p30)}\n${people(1)[0][0]} has $${B}. What is the largest number of mandarins that can be bought?`,
      zh: `商店卖橘子有三种方式：\n1 个 ${p1.toFixed(2)} 元\n10 个一袋 ${p10.toFixed(2)} 元\n30 个一袋 ${p30.toFixed(2)} 元\n用 ${B} 元最多能买多少个橘子？`,
      correct: String(best), wrong: [String(greedySingles), String(best - 1), String(best - 2), String(best + 1), String(Math.floor(B / p30) * 30)],
      solEn: `Try the combinations: the most is ${best} mandarins`, solZh: `比较各种组合，最多能买 ${best} 个` });
  });
  add(3, 'sspace', () => {   // clock angle clockwise from hour hand to minute hand
    const h = R(1, 11), m = pick([15, 30, 45, 20, 40]), hourA = (h % 12) * 30 + m * 0.5, minA = m * 6, ans = ((minA - hourA) % 360 + 360) % 360;
    return sel(3, 'sspace', { en: `At ${h}:00 the angle measured clockwise from the minute hand to the hour hand is ${h * 30}°.\nWhat is the angle, measured clockwise, from the hour hand to the minute hand at ${h}:${String(m).padStart(2, '0')}?`,
      zh: `${h}:00 时，从分针顺时针量到时针的角度是 ${h * 30}°。\n${h}:${String(m).padStart(2, '0')} 时，从时针顺时针量到分针的角度是多少度？`,
      correct: num(ans) + '°', wrong: [num(360 - ans) + '°', num(Math.abs(minA - h * 30)) + '°', num(ans + 15) + '°', num(Math.abs(ans - 15)) + '°', num((ans + 180) % 360) + '°'],
      solEn: `Hour hand at ${num(hourA)}°, minute hand at ${minA}°; clockwise from hour to minute: ${num(ans)}°`, solZh: `时针在 ${num(hourA)}°，分针在 ${minA}°；从时针顺时针到分针为 ${num(ans)}°` });
  });
  add(3, 'sspace', () => {   // robot quarter turns
    const st = R(0, 7), cw = R(20, 99), acw = R(20, 99), end = ((st + 2 * (cw - acw)) % 8 + 8) % 8;
    const d = i => ({ en: DIR8[i][0], zh: DIR8[i][1] });
    return sel(3, 'sspace', { en: `A robot is facing ${DIR8[st][0]}.\nIt makes ${cw} quarter-turns clockwise, then ${acw} quarter-turns anti-clockwise.\nWhich direction is the robot now facing?`, zh: `一个机器人面向${DIR8[st][1]}方。\n它先顺时针转 ${cw} 个直角，再逆时针转 ${acw} 个直角。\n现在它面向哪个方向？`,
      correct: d(end), wrong: [d((end + 4) % 8), d((end + 2) % 8), d((end + 6) % 8), d((end + 1) % 8), d((st + 2 * (acw - cw) % 8 + 16) % 8)],
      solEn: `Net turn = ${cw} − ${acw} = ${cw - acw} quarter-turns ${cw >= acw ? 'clockwise' : 'anti-clockwise'}; every 4 is a full turn → ${Math.abs(cw - acw) % 4} quarter-turn(s) → ${DIR8[end][0]}`, solZh: `相当于${cw >= acw ? '顺' : '逆'}时针转 ${Math.abs(cw - acw)} 个直角，4 个直角为一整圈，余 ${Math.abs(cw - acw) % 4} 个 → ${DIR8[end][1]}` });
  });
  add(3, 'snum', () => {   // reversed digits
    const k = R(5, 8), diff = 9 * k, starts = []; for (let a = 1; a + k <= 9; a++) starts.push(10 * a + a + k);
    const ask = k === 8 ? 'last' : 'sum', ans = ask === 'last' ? 9 : starts.reduce((x, y) => x + y, 0);
    return sel(3, 'snum', { en: `24 reversed is 42, which is 18 more than 24.\n${people(1)[0][0]} writes a whole number between 10 and 99 and reverses its digits. The new number is ${diff} more than the starting number.\n${ask === 'last' ? 'What was the last digit of the starting number?' : 'What is the sum of all the possible starting numbers?'}`,
      zh: `24 的数字倒过来是 42，比 24 大 18。\n某人写了一个 10 到 99 之间的整数，把它的数字倒过来，得到的数比原数大 ${diff}。\n${ask === 'last' ? '原数的个位数字是几？' : '所有可能的原数之和是多少？'}`,
      correct: String(ans), wrong: ask === 'last' ? ['1', '7', '8', '2', '6'] : [String(starts[0]), String(ans + 11), String(ans - 11), String(ans + 9), String(starts.length * 10)],
      solEn: `Reversing changes the number by 9 × (difference of digits), so the digits differ by ${k}: ${starts.join(', ')}`, solZh: `倒过来后相差 9 ×（两数字之差），所以两数字相差 ${k}：${starts.join('、')}` });
  });
  add(3, 'slogic', () => {   // drinks parity – which cannot be correct
    const N = R(25, 45), opts = [], [V] = people(1);
    const mk = (en, zh, o, l) => ({ en, zh, ok: Number.isInteger(o) && Number.isInteger(l) && o >= 0 && l >= 0 });
    const d1 = R(2, 12), m = R(2, 4), d2 = R(2, 12);
    opts.push(mk(`${V[0]} sold ${d1} more orange drinks than lemon drinks.`, `橙汁比柠檬汁多卖了 ${d1} 杯。`, (N + d1) / 2, (N - d1) / 2));
    opts.push(mk(`${V[0]} sold ${m === 2 ? 'twice' : m + ' times'} as many orange drinks as lemon drinks.`, `橙汁的杯数是柠檬汁的 ${m} 倍。`, N * m / (m + 1), N / (m + 1)));
    opts.push(mk(`${V[0]} sold ${d2} more lemon drinks than orange drinks.`, `柠檬汁比橙汁多卖了 ${d2} 杯。`, (N - d2) / 2, (N + d2) / 2));
    return statementsQ(3, 'slogic', `${V[0]} sold ${N} drinks at a barbecue. Each drink was orange or lemon.`, `${V[1]}在烧烤会上卖了 ${N} 杯饮料，每杯是橙汁或柠檬汁。`, opts,
      'Check whether each statement gives whole numbers of drinks.', '检验每种说法能否得到整数杯。', true);
  });
  add(3, 'smeas', () => {   // lights flashing
    const [r, g, b] = pick([[2, 3, 5], [2, 3, 4], [3, 4, 5], [2, 5, 7], [4, 6, 9]]), hours = R(2, 4);
    let cnt = 0; for (let t = 1; t <= hours * 60 - 1; t++) if (t % g === 0 && t % b === 0 && t % r !== 0) cnt++;
    return sel(3, 'smeas', { en: `Three lights flash: red every ${r} minutes, green every ${g} minutes, blue every ${b} minutes.\nThey all flash together at 7:00 am.\nHow many times between 7:01 am and ${7 + hours - 1}:59 am do the green and blue lights flash together without the red light also flashing?`,
      zh: `三盏灯闪烁：红灯每 ${r} 分钟一次，绿灯每 ${g} 分钟一次，蓝灯每 ${b} 分钟一次。\n上午 7:00 三盏灯同时闪。\n从上午 7:01 到 ${7 + hours - 1}:59，绿灯和蓝灯同时闪而红灯不闪的情况有几次？`,
      correct: String(cnt), wrong: [String(Math.floor((hours * 60 - 1) / lcm(g, b))), String(cnt + 1), String(Math.max(0, cnt - 1)), String(cnt * 2), String(Math.floor((hours * 60 - 1) / lcm(lcm(r, g), b)))],
      solEn: `Green and blue together every ${lcm(g, b)} min; remove the times that are also multiples of ${r} → ${cnt}`, solZh: `绿蓝每 ${lcm(g, b)} 分钟同时闪；去掉同时是 ${r} 的倍数的时刻 → ${cnt} 次` });
  });
  add(3, 'snum', () => {   // alternating sequence backwards
    const s = R(50, 99) * 100 + R(10, 99), a = pick([100, 50, 200]), b = pick([10, 20, 5]), n = R(5, 9), seq = [s];
    for (let i = 1; i < n; i++) seq.push(seq[i - 1] + (i % 2 ? -a : b));
    return sel(3, 'snum', { en: `A sequence starts with a chosen number. Then these two rules are used one after the other, again and again:\n• subtract ${a}\n• add ${b}\nThe ${n}th number in the sequence is ${seq[n - 1]}.\nWhat is the 1st number?`,
      zh: `一个数列先任选第 1 个数，然后交替使用下面两条规则：\n• 减去 ${a}\n• 加上 ${b}\n第 ${n} 个数是 ${seq[n - 1]}。\n第 1 个数是多少？`,
      correct: String(s), wrong: [String(s + (a - b)), String(s - (a - b)), String(seq[n - 1] + (n - 1) * (a - b)), String(seq[n - 1] + Math.ceil((n - 1) / 2) * a), String(s + b)],
      solEn: `Undo ${n - 1} steps: ${Math.ceil((n - 1) / 2)} × (−${a}) and ${Math.floor((n - 1) / 2)} × (+${b}); first = ${s}`, solZh: `倒推 ${n - 1} 步：${Math.ceil((n - 1) / 2)} 次减 ${a}，${Math.floor((n - 1) / 2)} 次加 ${b}；第 1 个数是 ${s}` });
  });
  add(3, 'snum', () => {   // three chosen numbers – statements
    const set = shuffle([3, 5, 6, 8, 4, 7, 9, 2]).slice(0, 4).sort((a, b) => a - b), totals = [];
    for (let i = 0; i < 4; i++) for (let j = i + 1; j < 4; j++) for (let k = j + 1; k < 4; k++) totals.push(set[i] + set[j] + set[k]);
    const m1 = pick([4, 5, 7, 8]), m2 = pick([3, 6, 9]);
    const st = [
      { en: `The total cannot be a multiple of ${m1}.`, zh: `和不可能是 ${m1} 的倍数。`, ok: totals.every(t => t % m1 !== 0) },
      { en: `The total can be a multiple of ${m2}.`, zh: `和可能是 ${m2} 的倍数。`, ok: totals.some(t => t % m2 === 0) },
      { en: 'The total is always odd.', zh: '和总是奇数。', ok: totals.every(t => t % 2 === 1) }
    ];
    return statementsQ(3, 'snum', `Three different numbers are chosen from ${set.join(', ')} and added together.`, `从 ${set.join('、')} 中选出三个不同的数相加。`, st,
      `Possible totals: ${[...new Set(totals)].sort((a, b) => a - b).join(', ')}`, `所有可能的和：${[...new Set(totals)].sort((a, b) => a - b).join('、')}`);
  });
  add(3, 'snum', () => {   // HCF & LCM second pair
    const h = R(2, 6), q = pick([6, 10, 14, 15, 21, 22]), L = h * q, f = []; for (let a = 1; a * a < q; a++) if (q % a === 0 && gcd(a, q / a) === 1) f.push([a, q / a]);
    if (f.length !== 2) return null;
    const second = f.find(p => p[0] !== 1), ans = h * (second[0] + second[1]);
    return sel(3, 'snum', { en: `The numbers ${h} and ${L} have highest common factor ${h} and lowest common multiple ${L}.\nA second pair of numbers also has highest common factor ${h} and lowest common multiple ${L}.\nWhat is the sum of the second pair?`,
      zh: `${h} 和 ${L} 的最大公因数是 ${h}，最小公倍数是 ${L}。\n另一对数的最大公因数也是 ${h}，最小公倍数也是 ${L}。\n这对数的和是多少？`,
      correct: String(ans), wrong: [String(h + L), String(ans + h), String(ans - h), String(h * second[0] + second[1]), String(2 * h * second[1])],
      solEn: `The pair is ${h} × a and ${h} × b with a × b = ${q} and no common factor: ${second[0]} and ${second[1]} → ${h * second[0]} and ${h * second[1]}; sum ${ans}`, solZh: `两数为 ${h}a 和 ${h}b，a × b = ${q} 且互质：a = ${second[0]}，b = ${second[1]} → ${h * second[0]} 和 ${h * second[1]}，和为 ${ans}` });
  });
  add(3, 'sspace', () => {   // hidden cubes
    const n = R(3, 6), ans = (n - 2) ** 3;
    return sel(3, 'sspace', { en: `${people(1)[0][0]} makes a large cube out of ${n ** 3} identical small cubes (${n} × ${n} × ${n}).\nThe large cube can be picked up and looked at from any direction.\nHow many of the small cubes cannot be seen?`, zh: `用 ${n ** 3} 个相同的小正方体拼成一个 ${n} × ${n} × ${n} 的大正方体。\n可以拿起来从任何方向看。\n有多少个小正方体是看不到的？`,
      correct: String(ans), wrong: [String((n - 1) ** 3), String(n ** 3 - 6 * n * n), String(6 * (n - 2) ** 2), String(n * n), String(ans + 1)].map(s => (+s < 0 ? String(ans + 4) : s)),
      solEn: `Only the inside ${n - 2} × ${n - 2} × ${n - 2} block is hidden: ${ans}`, solZh: `只有内部 ${n - 2} × ${n - 2} × ${n - 2} 的部分看不到：${ans} 个` });
  });
  add(3, 'smeas', () => {   // bus timetable
    const ab = [], ba = []; let t = 7 * 60 + R(0, 50);
    for (let i = 0; i < 4; i++) { const dur = R(55, 75); ab.push([t, t + dur]); t += R(140, 200); }
    t = 7 * 60 + R(0, 40); for (let i = 0; i < 4; i++) { const dur = R(55, 75); ba.push([t, t + dur]); t += R(140, 200); }
    const [P] = people(1), leave = ba[1][0], arrive = ba[1][1], back = ab.find(x => x[0] >= arrive);
    if (!back) return null;
    const away = back[1] - leave, f = m => ({ en: `${Math.floor(m / 60)} hours ${m % 60} minutes`, zh: `${Math.floor(m / 60)} 小时 ${m % 60} 分` });
    const fmtT = x => `${hhmm(x[0]).replace(/(\d\d)(\d\d)/, '$1:$2')} → ${hhmm(x[1]).replace(/(\d\d)(\d\d)/, '$1:$2')}`;
    return sel(3, 'smeas', { en: `Bus timetable (depart → arrive):\nOldville to Newtown: ${ab.map(fmtT).join(';  ')}\nNewtown to Oldville: ${ba.map(fmtT).join(';  ')}\n${P[0]} catches the second bus of the day from Newtown to Oldville and returns to Newtown on the next bus.\nHow long is ${P[0]} away from Newtown?`,
      zh: `公交时刻表（出发 → 到达）：\n旧城 → 新城：${ab.map(fmtT).join('；')}\n新城 → 旧城：${ba.map(fmtT).join('；')}\n${P[1]}乘当天第二班车从新城去旧城，再乘下一班车回新城。\n${P[1]}离开新城多长时间？`,
      correct: f(away), wrong: [f(back[0] - arrive), f(back[1] - arrive), f(back[0] - leave), f(away + 60), f(away - 30)],
      solEn: `Leaves ${fmtT([leave, back[1]]).replace(' → ', ', returns ')}: ${f(away).en}`, solZh: `${fmtT([leave, back[1]]).replace(' → ', ' 出发，')} 回到：${f(away).zh}` });
  });
  add(3, 'slogic', () => {   // houses on a road
    const u = R(2, 9) * 25, FH = 4 * u, extra = R(4, 12) * 25, FK = FH + u + extra, ns = people(5);
    return sel(3, 'slogic', { en: `Five friends live in this order along a straight road: ${ns.map(p => p[0]).join(', ')}.\n${ns[0][0]} lives ${FH} m from ${ns[2][0]} and ${FK} m from ${ns[4][0]}.\n${ns[1][0]} lives three times as far from ${ns[0][0]} as from ${ns[2][0]}.\n${ns[1][0]} and ${ns[3][0]} live the same distance from ${ns[2][0]}.\nHow far does ${ns[3][0]} live from ${ns[4][0]}?`,
      zh: `五个朋友按顺序住在一条直路边：${ns.map(p => p[1]).join('、')}。\n${ns[0][1]}离${ns[2][1]} ${FH} 米，离${ns[4][1]} ${FK} 米。\n${ns[1][1]}到${ns[0][1]}的距离是到${ns[2][1]}的 3 倍。\n${ns[1][1]}和${ns[3][1]}到${ns[2][1]}的距离相等。\n${ns[3][1]}离${ns[4][1]}多远？`,
      correct: extra + ' m', wrong: [extra + u + ' m', FK - FH + ' m', extra - u > 0 ? extra - u + ' m' : extra + 2 * u + ' m', FK - 3 * u - FH + u > 0 && FK - 3 * u - FH + u !== extra ? FK - 3 * u - FH + u + ' m' : extra + 50 + ' m', extra + 25 + ' m'],
      solEn: `${ns[1][0]} splits ${FH} m in the ratio 3 : 1, so it is ${u} m from ${ns[2][0]}; ${ns[3][0]} is ${u} m past ${ns[2][0]}; ${FK} − ${FH} − ${u} = ${extra} m`, solZh: `${ns[1][1]}把 ${FH} 米分成 3 : 1，离${ns[2][1]} ${u} 米；${ns[3][1]}在${ns[2][1]}之后 ${u} 米；${FK} − ${FH} − ${u} = ${extra} 米` });
  });
  add(3, 'snum', () => {   // inequality whole numbers
    const p = R(2, 4), P1 = p * R(8, 12), q = p * 2, Q = R(P1 / p * q - 4 * q, P1 / p * q - q - 1);
    const vals = []; for (let n = 1; n < 100; n++) if (p * n < P1 && q * n > Q) vals.push(n);
    if (vals.length < 2) return null;
    const ans = vals.reduce((a, b) => a + b, 0);
    return sel(3, 'snum', { en: `${people(1)[0][0]} is thinking of a whole number.\nMultiplying it by ${p} gives an answer less than ${P1}.\nMultiplying it by ${q} gives an answer greater than ${Q}.\nThere is more than one possible number. What is the sum of all the possible numbers?`,
      zh: `某人想了一个整数。\n把它乘以 ${p}，结果小于 ${P1}；\n把它乘以 ${q}，结果大于 ${Q}。\n可能的数不止一个，所有可能的数之和是多少？`,
      correct: String(ans), wrong: [String(ans + vals[vals.length - 1] + 1), String(ans - vals[0]), String(vals[0] + vals[vals.length - 1]), String(ans + vals[0] - 1), String(ans - vals[vals.length - 1])],
      solEn: `n < ${P1 / p} and n > ${round(Q / q, 2)}: ${vals.join(', ')}; sum ${ans}`, solZh: `n < ${P1 / p} 且 n > ${round(Q / q, 2)}：${vals.join('、')}；和为 ${ans}` });
  });
  add(3, 'smeas', () => {   // clock running double speed
    const drop = R(6, 9) * 60 + 5 * R(0, 11), now = R(13, 17) * 60 + 5 * R(0, 11), shown = drop + 2 * (now - drop);
    const f = m => { m = ((m % 720) + 720) % 720; const h = Math.floor(m / 60) || 12; return `${h}:${String(m % 60).padStart(2, '0')}`; };
    return sel(3, 'smeas', { en: `A clock worked normally until ${f(drop)} am, when it was dropped. For the rest of the day its hands turned twice as fast as normal.\nAt ${f(now)} pm that day, what time did the clock show?`,
      zh: `一个钟在上午 ${f(drop)} 之前走时正常，那时摔了一下，之后一整天指针都以正常速度的两倍转动。\n当天下午 ${f(now)} 时，钟上显示几点？`,
      correct: f(shown), wrong: [f(now * 2), f(shown + 60), f(shown - 60), f(drop + (now - drop) / 2), f(shown + 30)],
      solEn: `${now - drop} minutes passed; the clock moved ${2 * (now - drop)} minutes from ${f(drop)} → ${f(shown)}`, solZh: `实际过了 ${now - drop} 分钟，钟走了 ${2 * (now - drop)} 分钟，从 ${f(drop)} 走到 ${f(shown)}` });
  });


  /* ======================= Questions with charts and diagrams ======================= */
  const MONTHS = [['Jan', '1月'], ['Feb', '2月'], ['Mar', '3月'], ['Apr', '4月'], ['May', '5月'], ['Jun', '6月'], ['Jul', '7月'], ['Aug', '8月'], ['Sep', '9月'], ['Oct', '10月'], ['Nov', '11月'], ['Dec', '12月']].map(([en, zh]) => ({ en, zh }));
  const WEEK = [['Mon', '周一'], ['Tue', '周二'], ['Wed', '周三'], ['Thu', '周四'], ['Fri', '周五']].map(([en, zh]) => ({ en, zh }));
  const NOT_TO_SCALE = { en: '[diagram not to scale]', zh: '［图形不按比例］' };

  add(1, 'smeas', () => {   // kitchen scale dial
    const [P] = people(1), empty = R(15, 40) * 10, reading = R(Math.ceil((empty + 100) / 50), 18) * 50, sauce = reading - empty, need = sauce + R(2, 9) * 50 + pick([0, 20, 30]);
    if (need > 990) return null;
    const ans = need - sauce;
    return sel(1, 'smeas', { fig: { type: 'dial', max: 1000, minor: 50, labelStep: 100, value: reading, unit: 'g' },
      en: `${P[0]} needs ${need} grams of cooking sauce.\nA glass jar of cooking sauce is placed on a scale, as shown.\nThe glass jar weighs ${empty} g when empty.\nHow much more cooking sauce does ${P[0]} need?`,
      zh: `${P[1]}需要 ${need} 克酱汁。\n把一罐酱汁放在秤上，如图所示。\n空玻璃罐重 ${empty} 克。\n${P[1]}还需要多少克酱汁？`,
      correct: ans + ' g', wrong: [need - reading > 0 ? need - reading + ' g' : ans + 200 + ' g', sauce + ' g', ans + 100 + ' g', ans - 100 > 0 ? ans - 100 + ' g' : ans + 300 + ' g', need - empty + ' g'],
      solEn: `The scale reads ${reading} g, so the sauce is ${reading} − ${empty} = ${sauce} g; ${need} − ${sauce} = ${ans} g`, solZh: `秤的读数是 ${reading} 克，酱汁重 ${reading} − ${empty} = ${sauce} 克；${need} − ${sauce} = ${ans} 克` });
  });
  add(1, 'smeas', () => {   // measuring jug
    const [P] = people(1), v = R(1, 5) * 100, k = R(2, 5), ans = v * (k + 1);
    return sel(1, 'smeas', { fig: { type: 'jug', max: 1200, minor: 100, labelStep: 200, value: v, unit: 'mL' },
      en: `${P[0]} is making a fruit drink. ${P[0]} puts some orange juice into the jug, as shown.\nThen ${P[0]} adds ${k} times as much apple juice.\nHow many millilitres of fruit drink does ${P[0]} make?`,
      zh: `${P[1]}在做果汁。先往量杯里倒了一些橙汁，如图所示。\n然后加入橙汁 ${k} 倍的苹果汁。\n一共做了多少毫升果汁？`,
      correct: ans + ' mL', wrong: [v * k + ' mL', v + 100 * k + ' mL', (v + 100) * (k + 1) + ' mL', (v - 100 || 50) * (k + 1) + ' mL', v * (k + 2) + ' mL'],
      solEn: `The jug shows ${v} mL. ${v} + ${k} × ${v} = ${ans} mL`, solZh: `量杯中有 ${v} 毫升。${v} + ${v} × ${k} = ${ans} 毫升` });
  });
  add(1, 'sstat', () => {   // column graph: missing column
    const vals = Array.from({ length: 6 }, () => R(3, 7) * 5), tot = vals.reduce((a, b) => a + b, 0);
    const cats = vals.map((_, i) => ({ en: `Class ${i + 1}`, zh: `${i + 1}班` }));
    return sel(1, 'sstat', { fig: { type: 'bar', max: 40, step: 5, values: [...vals.slice(0, 5), null], cats: cats.map((c, i) => ({ en: String(i + 1), zh: String(i + 1) })), xLabel: { en: 'class', zh: '班级' }, yLabel: { en: 'number of children', zh: '人数' } },
      en: `There are ${tot} children altogether in six classes.\nThe column graph shows the number of children in classes 1 to 5. The column for class 6 has not been drawn.\nHow many children are in class 6?`,
      zh: `六个班一共有 ${tot} 名学生。\n条形统计图表示 1–5 班的人数，6 班的直条还没有画。\n6 班有多少人？`,
      correct: String(vals[5]), wrong: [String(vals[5] + 5), String(vals[5] - 5), String(vals[5] + 10), String(Math.round(tot / 6)), String(vals[5] - 10)],
      solEn: `Classes 1–5: ${vals.slice(0, 5).join(' + ')} = ${tot - vals[5]}; ${tot} − ${tot - vals[5]} = ${vals[5]}`, solZh: `1–5 班共 ${vals.slice(0, 5).join(' + ')} = ${tot - vals[5]} 人；${tot} − ${tot - vals[5]} = ${vals[5]}` });
  });
  add(1, 'smeas', () => {   // analogue clock
    const [P] = people(1), h = R(1, 11), m = 5 * R(0, 11), pm = Math.random() < 0.5, plus = pick([25, 35, 40, 50, 55, 70, 85]);
    const start = (h + (pm ? 12 : 0)) * 60 + m, end = start + plus;
    return sel(1, 'smeas', { fig: { type: 'clock', h, m },
      en: `${P[0]}'s clock shows the time in the ${pm ? 'afternoon' : 'morning'}.\nWhat time will it be ${plus} minutes later?`,
      zh: `${P[1]}的钟显示的是${pm ? '下午' : '上午'}的时间。\n${plus} 分钟后是几点？`,
      correct: ampm(end), wrong: [ampm(end + 60), ampm(end - 60), ampm(end + 720), ampm(start + plus - 10), ampm(end + 10)],
      solEn: `The clock shows ${ampm(start).en}; ${plus} minutes later is ${ampm(end).en}`, solZh: `钟面显示${ampm(start).zh}，${plus} 分钟后是${ampm(end).zh}` });
  });
  add(2, 'sstat', () => {   // rainfall column graph statements
    const st0 = R(0, 6), months = MONTHS.slice(st0, st0 + 6), vals = Array.from({ length: 6 }, () => R(1, 8) * 50);
    const [a, b, c, d] = shuffle([0, 1, 2, 3, 4, 5]);
    const diffCm = (vals[c] - vals[d]) / 10, claimCm = Math.abs(diffCm) + pick([0, 0, 5, -5].filter(x => Math.abs(diffCm) + x > 0));
    const sum3 = vals[3] + vals[4] + vals[5];
    const M = i => months[i];
    const st = [
      { en: `${M(a).en} had more than twice as much rainfall as ${M(b).en}.`, zh: `${M(a).zh}的降雨量是${M(b).zh}的两倍多。`, ok: vals[a] > 2 * vals[b] },
      { en: `${M(diffCm >= 0 ? c : d).en} had ${claimCm} cm more rainfall than ${M(diffCm >= 0 ? d : c).en}.`, zh: `${M(diffCm >= 0 ? c : d).zh}比${M(diffCm >= 0 ? d : c).zh}多 ${claimCm} 厘米降雨。`, ok: claimCm === Math.abs(diffCm) },
      { en: `The rainfall in ${M(3).en}, ${M(4).en} and ${M(5).en} combined was more than 1 metre.`, zh: `${M(3).zh}、${M(4).zh}、${M(5).zh}三个月的降雨量合计超过 1 米。`, ok: sum3 > 1000 }
    ];
    if (vals[a] === 2 * vals[b] || sum3 === 1000 || diffCm === 0) return null;
    return statementsQ(2, 'sstat', 'The column graph shows the rainfall each month for six months.', '条形统计图表示六个月中每月的降雨量。', st,
      `Read the columns: ${months.map((m, i) => `${m.en} ${vals[i]} mm`).join(', ')}. Remember 10 mm = 1 cm and 1000 mm = 1 m.`, `读图：${months.map((m, i) => `${m.zh} ${vals[i]} 毫米`).join('，')}。10 毫米 = 1 厘米，1000 毫米 = 1 米。`, false,
      { type: 'bar', max: 400, step: 50, values: vals, cats: months, yLabel: { en: 'rainfall (mm)', zh: '降雨量（毫米）' }, xLabel: { en: 'month', zh: '月份' } });
  });
  add(2, 'sstat', () => {   // temperature line graph statements
    const ys = [R(1, 3)]; for (let i = 1; i <= 8; i++) ys.push(Math.max(0, Math.min(5, ys[i - 1] + pick([-2, -1, 0, 1, 1, 2])))); const temps = ys.map(v => v * 5);
    const hi = Math.max(...temps), lo = Math.min(...temps), hiAt = temps.indexOf(hi);
    if (temps.filter(v => v === hi).length > 1 || hi === lo) return null;
    const [a, b] = [R(0, 3), R(4, 7)], ch1 = Math.abs(temps[a + 1] - temps[a]), ch2 = Math.abs(temps[b + 1] - temps[b]);
    if (ch1 === ch2) return null;
    const claimLo = pick([lo, lo + 5]);
    const st = [
      { en: `The highest temperature was at ${hiAt} hours.`, zh: `最高气温出现在第 ${hiAt} 小时。`, ok: true },
      { en: `The temperature change between ${a} and ${a + 1} hours was greater than the change between ${b} and ${b + 1} hours.`, zh: `第 ${a} 到 ${a + 1} 小时的气温变化比第 ${b} 到 ${b + 1} 小时的大。`, ok: ch1 > ch2 },
      { en: `The lowest temperature was ${claimLo}°C.`, zh: `最低气温是 ${claimLo}°C。`, ok: claimLo === lo }
    ];
    if (Math.random() < 0.5) { const wrongAt = (hiAt + R(1, 7)) % 9; st[0] = { en: `The highest temperature was at ${wrongAt} hours.`, zh: `最高气温出现在第 ${wrongAt} 小时。`, ok: false }; }
    return statementsQ(2, 'sstat', 'The graph shows the outdoor temperature during a period of 8 hours.', '折线统计图表示 8 小时内室外气温的变化。', st,
      `Temperatures: ${temps.join(', ')} °C at 0–8 hours.`, `0–8 小时的气温：${temps.join('、')} °C。`, false,
      { type: 'line', max: 25, step: 5, xs: [0, 1, 2, 3, 4, 5, 6, 7, 8], ys: temps, xLabel: { en: 'time (hours)', zh: '时间（小时）' }, yLabel: { en: 'temperature (°C)', zh: '气温（°C）' } });
  });
  add(2, 'sstat', () => {   // pictograph with half pictures
    const k = pick([4, 6, 8, 10]), counts = WEEK.map(() => R(2, 12) / 2), i = R(0, 4); let j = R(0, 4);
    if (i === j || counts[i] <= counts[j]) return null;
    const ans = (counts[i] - counts[j]) * k;
    return sel(2, 'sstat', { fig: { type: 'picto', icon: '🌸', rows: WEEK.map((d, x) => ({ label: d, count: counts[x] })), key: { en: `🌸 = ${k} bunches of flowers`, zh: `🌸 = ${k} 束花` } },
      en: `The picture graph shows the bunches of flowers a shop sold each day.\nHow many more bunches were sold on ${WEEK[i].en} than on ${WEEK[j].en}?`,
      zh: `象形统计图表示花店每天卖出的花束数量。\n${WEEK[i].zh}比${WEEK[j].zh}多卖出多少束？`,
      correct: String(ans), wrong: [String(counts[i] - counts[j]), String(Math.round(counts[i] - counts[j]) * k + k), String(Math.floor(counts[i] - counts[j]) * k), String(counts[i] * k), String(ans + k / 2)],
      solEn: `${WEEK[i].en}: ${counts[i]} × ${k} = ${counts[i] * k}; ${WEEK[j].en}: ${counts[j]} × ${k} = ${counts[j] * k}; difference ${ans}. (Half a flower = ${k / 2}.)`,
      solZh: `${WEEK[i].zh}：${counts[i]} × ${k} = ${counts[i] * k}；${WEEK[j].zh}：${counts[j]} × ${k} = ${counts[j] * k}；相差 ${ans}。（半朵花代表 ${k / 2} 束）` });
  });
  add(2, 'sspace', () => {   // L-shape: perimeter or area from a labelled diagram
    const W = R(8, 16), H = R(7, 14), a = R(3, W - 3), b = R(2, H - 3), askArea = Math.random() < 0.5;
    const pts = [[0, 0], [W, 0], [W, H - b], [W - a, H - b], [W - a, H], [0, H]];
    const labels = askArea ? [{ edge: 0, text: `${W} cm` }, { edge: 1, text: `${H - b} cm` }, { edge: 4, text: `${W - a} cm` }, { edge: 5, text: `${H} cm` }]
      : [{ edge: 0, text: `${W} cm` }, { edge: 5, text: `${H} cm` }, { edge: 2, text: `${a} cm` }];
    const ans = askArea ? W * H - a * b : 2 * (W + H);
    return sel(2, 'sspace', { fig: { type: 'shape', pts, labels, shaded: true, note: NOT_TO_SCALE },
      en: `What is the ${askArea ? 'area' : 'perimeter'} of the shaded shape?`, zh: `求阴影图形的${askArea ? '面积' : '周长'}。`,
      correct: ans + (askArea ? ' cm²' : ' cm'),
      wrong: askArea ? [W * H + ' cm²', W * H - a * (H - b) + ' cm²', (W - a) * H + ' cm²', ans + W + ' cm²', ans - b + ' cm²'] : [2 * (W + H) - 2 * a + ' cm', W + H + a + ' cm', 2 * (W + H) + 2 * a + ' cm', ans - b + ' cm', W + H + ' cm'],
      solEn: askArea ? `Missing parts: ${W} − ${W - a} = ${a} cm and ${H} − ${H - b} = ${b} cm. Area = ${W} × ${H} − ${a} × ${b} = ${ans} cm²` : `The steps add up to the full width and height, so the perimeter is 2 × (${W} + ${H}) = ${ans} cm`,
      solZh: askArea ? `缺掉的部分：${W} − ${W - a} = ${a} 厘米，${H} − ${H - b} = ${b} 厘米。面积 = ${W} × ${H} − ${a} × ${b} = ${ans} 平方厘米` : `把台阶的边平移，周长等于大长方形的周长：(${W} + ${H}) × 2 = ${ans} 厘米` });
  });
  /* random connected shape of n cells inside a w×h box */
  function polyomino(n, w, h) {
    const cells = [[R(0, w - 1), R(0, h - 1)]], key = c => c[0] + ',' + c[1], has = new Set(cells.map(key));
    for (let tries = 0; cells.length < n && tries < 400; tries++) {
      const [x, y] = pick(cells), [dx, dy] = pick([[1, 0], [-1, 0], [0, 1], [0, -1]]), c = [x + dx, y + dy];
      if (c[0] < 0 || c[1] < 0 || c[0] >= w || c[1] >= h || has.has(key(c))) continue;
      has.add(key(c)); cells.push(c);
    }
    let per = 0; cells.forEach(([x, y]) => [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([dx, dy]) => { if (!has.has(key([x + dx, y + dy]))) per++; }));
    return { cells, per, area: cells.length };
  }
  add(3, 'sspace', () => {   // two shapes on a grid: compare perimeter and area
    const X = polyomino(R(5, 9), 5, 5), Y = polyomino(R(5, 9), 5, 5);
    const st = [
      { en: 'Shape X has a larger perimeter than shape Y.', zh: '图形 X 的周长比图形 Y 大。', ok: X.per > Y.per },
      { en: 'Shapes X and Y have the same perimeter.', zh: '图形 X 和 Y 的周长相等。', ok: X.per === Y.per },
      { en: 'Shape X has a larger area than shape Y.', zh: '图形 X 的面积比图形 Y 大。', ok: X.area > Y.area }
    ];
    const shift = c => [c[0] + 7, c[1]];
    return statementsQ(3, 'sspace', 'Shapes X and Y are drawn on a square grid.', '图形 X 和 Y 画在方格纸上。', st,
      `X: perimeter ${X.per}, area ${X.area} squares. Y: perimeter ${Y.per}, area ${Y.area} squares.`, `X：周长 ${X.per}，面积 ${X.area} 格；Y：周长 ${Y.per}，面积 ${Y.area} 格。`, false,
      { type: 'grid', w: 12, h: 5, shapes: [{ cells: X.cells, label: 'X' }, { cells: Y.cells.map(shift), label: 'Y' }] });
  });
  add(3, 'sstat', () => {   // pets column graph with two missing columns
    const vals = [R(4, 10), R(5, 14), null, null, R(1, 5), R(0, 3)], three = R(2, 5), two = 2 * three, tot = vals.reduce((a, b) => a + (b || 0), 0) + two + three;
    const ask3 = Math.random() < 0.5;
    return sel(3, 'sstat', { fig: { type: 'bar', max: 15, step: 5, values: vals, cats: ['0', '1', '2', '3', '4', '5'], xLabel: { en: 'number of pets', zh: '宠物数量' }, yLabel: { en: 'number of children', zh: '人数' } },
      en: `${tot} children were asked how many pets they have.\nMost of the results are shown in the column graph, but the columns for two and three pets are missing.\nThe number of children with two pets is twice the number with three pets.\nHow many children have ${ask3 ? 'three' : 'two'} pets?`,
      zh: `调查了 ${tot} 名学生各养了几只宠物。\n大部分结果画在条形统计图中，但养 2 只和 3 只的直条缺失了。\n养 2 只宠物的人数是养 3 只的 2 倍。\n养 ${ask3 ? '3' : '2'} 只宠物的有多少人？`,
      correct: String(ask3 ? three : two), wrong: [String(ask3 ? two : three), String(two + three), String(ask3 ? three + 1 : two + 2), String(ask3 ? three + 2 : two - 2), String(Math.round((two + three) / 2))],
      solEn: `Shown columns total ${tot - two - three}, so 2 and 3 pets together = ${two + three} = 3 parts; 1 part = ${three}. Three pets: ${three}; two pets: ${two}`,
      solZh: `图中已画出的共 ${tot - two - three} 人，养 2 只和 3 只的共 ${two + three} 人，即 3 份，每份 ${three} 人。养 3 只：${three} 人；养 2 只：${two} 人` });
  });


  add(2, 'sstat', () => {   // pie chart: how students travel to school
    const modes = [['walk', '步行'], ['bus', '公交车'], ['car', '汽车'], ['bike', '自行车'], ['train', '火车']].map(([en, zh]) => ({ en, zh }));
    const parts = pick([[40, 25, 20, 15], [35, 30, 25, 10], [45, 20, 20, 15], [30, 30, 25, 15], [50, 25, 15, 10]]), sel4 = shuffle(modes).slice(0, 4);
    const N = pick([120, 160, 200, 240, 300, 360, 400, 600]), i = R(0, 3); let j = R(0, 3); if (i === j) j = (i + 1) % 4;
    const hi = parts[i] >= parts[j] ? i : j, lo = hi === i ? j : i, v = N * (parts[hi] - parts[lo]) / 100;
    if (!Number.isInteger(v) || v === 0) return null;
    return sel(2, 'sstat', { fig: { type: 'pie', values: parts, labels: sel4, showValues: parts.map(p => p + '%') },
      en: `The pie chart shows how the ${N} students at a school travel to school.\nHow many more students ${sel4[hi].en === 'walk' ? 'walk' : 'travel by ' + sel4[hi].en} than ${sel4[lo].en === 'walk' ? 'walk' : 'travel by ' + sel4[lo].en}?`,
      zh: `扇形统计图表示某校 ${N} 名学生上学的方式。\n${sel4[hi].zh}上学的比${sel4[lo].zh}上学的多多少人？`,
      correct: String(v), wrong: [String(parts[hi] - parts[lo]), String(N * parts[hi] / 100), String(v + N / 20), String(Math.max(1, v - N / 20)), String(v * 2)],
      solEn: `${parts[hi]}% − ${parts[lo]}% = ${parts[hi] - parts[lo]}% of ${N} = ${v}`, solZh: `${parts[hi]}% − ${parts[lo]}% = ${parts[hi] - parts[lo]}%，${N} × ${parts[hi] - parts[lo]}% = ${v}` });
  });
  add(2, 'sspace', () => {   // reflect and translate a point on a grid
    const x = R(1, 4) * (Math.random() < 0.5 ? -1 : 1), y = R(1, 4) * (Math.random() < 0.5 ? -1 : 1), axis = pick(['x', 'y']), down = R(1, 3), right = R(0, 2);
    const rx = axis === 'y' ? -x : x, ry = axis === 'x' ? -y : y, fx = rx + right, fy = ry - down;
    const P = (a, b) => `(${a}, ${b})`.replace(/-/g, MINUS);
    const cands = [P(fx, fy), P(-fx, fy), P(fx, -fy), P(axis === 'y' ? x + right : -x + right, fy), P(rx + right, ry + down), P(fx + 1, fy), P(fx, fy + 1), P(fx - 1, fy)];
    const opts = shuffle(cands.filter((v, k) => cands.indexOf(v) === k).slice(0, 5));
    if (opts.length < 5) return null;
    return sel(2, 'sspace', { fig: { type: 'coord', xmin: -5, xmax: 5, ymin: -5, ymax: 5, points: [[x, y, 'P']] },
      en: `Point P is reflected in the ${axis}-axis. The image is then moved ${down} unit${down > 1 ? 's' : ''} down${right ? ` and ${right} unit${right > 1 ? 's' : ''} right` : ''}.\nWhat are the coordinates of the final point?`,
      zh: `点 P 先关于 ${axis} 轴作轴对称，再向下平移 ${down} 个单位${right ? `，向右平移 ${right} 个单位` : ''}。\n最后得到的点的坐标是多少？`,
      fixed: opts.map(both), answerIndex: opts.indexOf(P(fx, fy)), solEn: `Reflect: ${P(rx, ry)}; move: ${P(fx, fy)}`, solZh: `对称后 ${P(rx, ry)}；平移后 ${P(fx, fy)}` });
  });
  add(3, 'smeas', () => {   // travel graph
    const legs = [], xs = [0], ys = [0]; let t = 0, dist = 0;
    for (let k = 0; k < 4; k++) { const dt = 1, dd = k === 1 ? 0 : pick([20, 40, 60, 80]); t += dt; dist += dd; xs.push(t); ys.push(dist); legs.push(dd); }
    const fastest = Math.max(...legs), stopAt = legs.indexOf(0), ask = pick(['fast', 'avg']);
    const v = ask === 'fast' ? fastest : dist / 4;
    if (dist > 200) return null;
    return sel(3, 'smeas', { fig: { type: 'line', max: 200, step: 40, xs, ys, xLabel: { en: 'time (hours)', zh: '时间（小时）' }, yLabel: { en: 'distance (km)', zh: '路程（千米）' } },
      en: `The travel graph shows a car journey.\n${ask === 'fast' ? 'What was the greatest speed during the journey, in km/h?' : 'What was the average speed for the whole journey (including the stop), in km/h?'}`,
      zh: `行程图表示一次汽车旅行。\n${ask === 'fast' ? '旅途中最快的速度是每小时多少千米？' : '整个旅程（包括停留）的平均速度是每小时多少千米？'}`,
      correct: v + ' km/h', wrong: [dist + ' km/h', (ask === 'fast' ? dist / 4 : fastest) + ' km/h', v + 10 + ' km/h', Math.max(5, v - 10) + ' km/h', Math.round(dist / 3) + ' km/h'],
      solEn: ask === 'fast' ? `Steepest section: ${fastest} km in 1 hour = ${fastest} km/h (the flat section from ${stopAt + 1} to ${stopAt + 2} h is a stop)` : `Total ${dist} km in 4 hours = ${dist / 4} km/h`,
      solZh: ask === 'fast' ? `最陡的一段 1 小时行 ${fastest} 千米，速度 ${fastest} 千米/时（水平段为停留）` : `总路程 ${dist} 千米，用时 4 小时，平均 ${dist / 4} 千米/时` });
  });

  /* ---------- building a test ---------- */
  function pickFrom(tier, count) {
    const out = [], used = new Set(), pool = shuffle(T[tier]);
    for (let i = 0, tries = 0; out.length < count && tries < count * 30; tries++, i++) {
      const tpl = pool[i % pool.length];
      if (used.has(tpl) && used.size < pool.length) continue;
      const q = tpl.fn();
      if (!q) continue;
      used.add(tpl); out.push(q);
    }
    return out;
  }
  /* full test: 35 questions / 40 minutes; short: 18 / 20 */
  function generateTest(len) {
    const n = len === 'short' ? SHORT.n : FULL.n, mix = MIX[n];
    return [...pickFrom(1, mix[0]), ...pickFrom(2, mix[1]), ...pickFrom(3, mix[2])];
  }
  const api = { FULL, SHORT, MIX, generateTest, T, sel, optValue };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.Selective = api;
})(typeof window !== 'undefined' ? window : globalThis);
