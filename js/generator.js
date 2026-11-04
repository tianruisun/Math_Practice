/* Built-in question generator (works offline, used when no AI is set up or the AI fails).
   Every question carries both languages so the language toggle never loses it:
   { topic, year, diff, q:{en,zh}, value, answer, unit, sol:{en,zh}, source:'local' } */
(function (root) {
  'use strict';

  /* topic -> first year it appears */
  const TOPICS = {
    place: 4, addsub: 4, muldiv: 4, frac: 4, dec: 4, meas: 4,
    angle: 5, stats: 5, pct: 5,
    prob: 6,
    int: 7, index: 7, alg: 7, ratio: 7,
    linear: 8,
    pyth: 9
  };
  const topicsFor = y => Object.keys(TOPICS).filter(k => TOPICS[k] <= y);

  const R = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a;
  const pick = a => a[R(0, a.length - 1)];
  const gcd = (a, b) => { a = Math.abs(a); b = Math.abs(b); while (b) [a, b] = [b, a % b]; return a; };
  const round = (n, dp = 6) => Number(Math.round(Number(n + 'e' + dp)) + 'e-' + dp);
  const MINUS = '−';
  const num = n => (n < 0 ? MINUS + fmt(-n) : fmt(n));
  function fmt(n) { return String(round(n, 6)); }
  const paren = n => (n < 0 ? '(' + num(n) + ')' : num(n));
  function fracStr(n, d) {
    if (d < 0) { n = -n; d = -d; }
    const g = gcd(n, d) || 1; n /= g; d /= g;
    if (d === 1) return num(n);
    return (n < 0 ? MINUS : '') + Math.abs(n) + '/' + d;
  }
  function mk(o) {
    return {
      topic: o.topic, q: { en: o.en, zh: o.zh }, value: round(o.value, 9),
      answer: o.answer !== undefined ? o.answer : o.unit === '$' ? '$' + num(o.value) : num(o.value) + (o.unit === '°' || o.unit === '%' ? o.unit : o.unit ? ' ' + o.unit : ''),
      unit: o.unit || '', tol: o.tol, sol: { en: o.solEn || '', zh: o.solZh || o.solEn || '' }, source: 'local'
    };
  }
  /* level 1..9 combining year and difficulty, used to scale numbers */
  const lvl = (y, d) => Math.max(1, Math.min(9, Math.round((y - 4) * 1.2) + d));

  const G = {
    place(y, d) {
      if (y >= 7 && Math.random() < 0.5) {
        const dp = d; let xi = R(10001, 999999); if (xi % 10 === 0) xi += 3; const x = round(xi / 10000 + R(0, 50), 4);
        const r = round(x, dp);
        return mk({ topic: 'place', value: r, answer: r.toFixed(dp), tol: 1e-9,
          en: `Round ${x} to ${dp} decimal place${dp > 1 ? 's' : ''}.`,
          zh: `把 ${x} 四舍五入保留 ${dp} 位小数。`,
          solEn: `Look at decimal place ${dp + 1}: ${x} ≈ ${r.toFixed(dp)}`,
          solZh: `看第 ${dp + 1} 位小数：${x} ≈ ${r.toFixed(dp)}` });
      }
      const to = pick(d === 1 ? [10, 100] : d === 2 ? [100, 1000] : [1000, 10000]);
      const x = R(to + 1, to * (y >= 6 ? 999 : 99)) + R(1, 9);
      const r = Math.round(x / to) * to;
      const zhTo = { 10: '十', 100: '百', 1000: '千', 10000: '万' }[to];
      return mk({ topic: 'place', value: r,
        en: `Round ${x} to the nearest ${to}.`, zh: `把 ${x} 四舍五入到${zhTo}位。`,
        solEn: `${x} is closer to ${r} than to ${r === Math.floor(x / to) * to ? r + to : r - to}, so ${x} ≈ ${r}.`,
        solZh: `${x} 更接近 ${r}，所以 ${x} ≈ ${r}。` });
    },

    addsub(y, d) {
      const L = lvl(y, d); const digits = Math.min(2 + Math.floor(L / 2), 6);
      let a = R(10 ** (digits - 1), 10 ** digits - 1), b = R(10 ** (digits - 1), 10 ** digits - 1);
      if (Math.random() < 0.5) {
        return mk({ topic: 'addsub', value: a + b, en: `Work out ${a} + ${b}`, zh: `计算：${a} + ${b}`,
          solEn: `Add column by column: ${a} + ${b} = ${a + b}`, solZh: `按数位相加：${a} + ${b} = ${a + b}` });
      }
      if (b > a) [a, b] = [b, a];
      if (y >= 6 && d === 3 && Math.random() < 0.5) {
        const c = R(10, 10 ** (digits - 1)); const v = a - b + c;
        return mk({ topic: 'addsub', value: v, en: `Work out ${a} ${MINUS} ${b} + ${c}`, zh: `计算：${a} ${MINUS} ${b} + ${c}`,
          solEn: `Left to right: ${a} ${MINUS} ${b} = ${a - b}, then + ${c} = ${v}`, solZh: `从左往右：${a} ${MINUS} ${b} = ${a - b}，再 + ${c} = ${v}` });
      }
      return mk({ topic: 'addsub', value: a - b, en: `Work out ${a} ${MINUS} ${b}`, zh: `计算：${a} ${MINUS} ${b}`,
        solEn: `Subtract column by column (regroup where needed): ${a} ${MINUS} ${b} = ${a - b}`,
        solZh: `按数位相减（不够减时退位）：${a} ${MINUS} ${b} = ${a - b}` });
    },

    muldiv(y, d) {
      const L = lvl(y, d);
      const b = R(2, L < 3 ? 9 : 12 + (L > 5 ? 13 : 0));
      const a = R(2, L < 3 ? 10 : L < 6 ? 99 : 999);
      if (Math.random() < 0.4) {
        return mk({ topic: 'muldiv', value: a, en: `Work out ${a * b} ÷ ${b}`, zh: `计算：${a * b} ÷ ${b}`,
          solEn: `${b} × ${a} = ${a * b}, so ${a * b} ÷ ${b} = ${a}`, solZh: `因为 ${b} × ${a} = ${a * b}，所以 ${a * b} ÷ ${b} = ${a}` });
      }
      if (y >= 6 && d >= 2 && Math.random() < 0.3) {
        const c = R(2, 9), v = a + b * c;
        return mk({ topic: 'muldiv', value: v, en: `Work out ${a} + ${b} × ${c}`, zh: `计算：${a} + ${b} × ${c}`,
          solEn: `Multiply first: ${b} × ${c} = ${b * c}; then ${a} + ${b * c} = ${v}`, solZh: `先算乘法：${b} × ${c} = ${b * c}；再算 ${a} + ${b * c} = ${v}` });
      }
      return mk({ topic: 'muldiv', value: a * b, en: `Work out ${a} × ${b}`, zh: `计算：${a} × ${b}`,
        solEn: `${a} × ${b} = ${a * b}`, solZh: `${a} × ${b} = ${a * b}` });
    },

    frac(y, d) {
      const dens = [2, 3, 4, 5, 6, 8, 10, 12];
      const kind = y <= 4 ? pick(['of', 'same']) : y <= 6 ? pick(['of', 'same', 'diff']) : pick(['diff', 'mul', 'div', 'of']);
      if (kind === 'of') {
        const den = pick(d === 1 ? [2, 3, 4, 5, 10] : dens), n = d === 1 ? 1 : R(1, den - 1), k = R(2, d === 3 ? 30 : 12), amt = den * k;
        const v = n * k;
        return mk({ topic: 'frac', value: v, en: `What is ${n}/${den} of ${amt}?`, zh: `${amt} 的 ${n}/${den} 是多少？`,
          solEn: `${amt} ÷ ${den} = ${k}, then × ${n} = ${v}`, solZh: `${amt} ÷ ${den} = ${k}，再 × ${n} = ${v}` });
      }
      let d1 = pick(dens), d2 = kind === 'same' ? d1 : pick(dens);
      if (kind === 'diff' && d === 1) d2 = d1 * 2 <= 12 ? d1 * 2 : d1;
      let n1 = R(1, d1 - 1), n2 = R(1, d2 - 1);
      let op, nn, dd;
      if (kind === 'mul') { op = '×'; nn = n1 * n2; dd = d1 * d2; }
      else if (kind === 'div') { op = '÷'; nn = n1 * d2; dd = d1 * n2; }
      else {
        op = Math.random() < 0.5 ? '+' : MINUS;
        if (op === MINUS && n1 * d2 < n2 * d1) { [n1, d1, n2, d2] = [n2, d2, n1, d1]; }
        nn = op === '+' ? n1 * d2 + n2 * d1 : n1 * d2 - n2 * d1; dd = d1 * d2;
        if (nn === 0) return G.frac(y, d);
      }
      const ans = fracStr(nn, dd);
      const tail = (n, d) => (fracStr(n, d) === n + '/' + d && ans === n + '/' + d ? '' : ' = ' + ans);
      const lcd = d1 * d2 / gcd(d1, d2);
      let solEn, solZh;
      if (op === '×') { solEn = `Multiply tops and bottoms: ${n1}×${n2} / ${d1}×${d2} = ${nn}/${dd}${tail(nn, dd)}`; solZh = `分子乘分子、分母乘分母：${nn}/${dd}${tail(nn, dd)}`; }
      else if (op === '÷') { solEn = `Flip the second fraction and multiply: ${n1}/${d1} × ${d2}/${n2} = ${nn}/${dd}${tail(nn, dd)}`; solZh = `除以一个分数等于乘它的倒数：${n1}/${d1} × ${d2}/${n2} = ${nn}/${dd}${tail(nn, dd)}`; }
      else {
        const a1 = n1 * lcd / d1, a2 = n2 * lcd / d2, r = op === '+' ? a1 + a2 : a1 - a2;
        solEn = `Common denominator ${lcd}: ${a1}/${lcd} ${op} ${a2}/${lcd} = ${r}/${lcd}${tail(r, lcd)}`;
        solZh = `通分，公分母为 ${lcd}：${a1}/${lcd} ${op} ${a2}/${lcd} = ${r}/${lcd}${tail(r, lcd)}`;
      }
      return mk({ topic: 'frac', value: nn / dd, answer: ans,
        en: `Work out ${n1}/${d1} ${op} ${n2}/${d2}. Give your answer as a fraction.`,
        zh: `计算 ${n1}/${d1} ${op} ${n2}/${d2}，用分数表示答案。`, solEn, solZh });
    },

    dec(y, d) {
      const dp = d === 1 ? 1 : 2, sc = 10 ** dp;
      if (y >= 6 && Math.random() < 0.4) {
        const a = R(11, d === 3 ? 999 : 99) / 10, b = d === 3 ? R(11, 99) / 10 : R(2, 9), v = round(a * b, 4);
        return mk({ topic: 'dec', value: v, en: `Work out ${a} × ${b}`, zh: `计算：${a} × ${b}`,
          solEn: `Multiply without the decimal points, then count decimal places: ${a} × ${b} = ${v}`,
          solZh: `先不看小数点相乘，再数小数位数：${a} × ${b} = ${v}` });
      }
      if (y >= 5 && Math.random() < 0.25) {
        const a = R(11, 999) / sc, p = pick([10, 100, 1000]), mul = Math.random() < 0.5;
        const v = round(mul ? a * p : a / p, 6);
        return mk({ topic: 'dec', value: v, en: `Work out ${a} ${mul ? '×' : '÷'} ${p}`, zh: `计算：${a} ${mul ? '×' : '÷'} ${p}`,
          solEn: `Move the digits ${String(p).length - 1} place(s) ${mul ? 'left (number gets bigger)' : 'right (number gets smaller)'}: ${v}`,
          solZh: `数字${mul ? '向左' : '向右'}移动 ${String(p).length - 1} 位：${v}` });
      }
      let ai = R(10, d === 3 ? 9999 : 999), bi = R(10, d === 3 ? 9999 : 999);
      const add = Math.random() < 0.5; if (!add && bi > ai) [ai, bi] = [bi, ai];
      const a = ai / sc, b = bi / sc, v = round((add ? ai + bi : ai - bi) / sc, dp);
      return mk({ topic: 'dec', value: v, en: `Work out ${a.toFixed(dp)} ${add ? '+' : MINUS} ${b.toFixed(dp)}`,
        zh: `计算：${a.toFixed(dp)} ${add ? '+' : MINUS} ${b.toFixed(dp)}`,
        solEn: `Line up the decimal points: ${v}`, solZh: `小数点对齐后计算：${v}` });
    },

    pct(y, d) {
      if (y >= 8 && Math.random() < 0.45) {
        const p = pick([5, 10, 15, 20, 25, 30, 40]), base = R(2, 40) * 20, up = Math.random() < 0.5;
        const v = round(base * (up ? 100 + p : 100 - p) / 100, 2);
        return mk({ topic: 'pct', value: v, unit: '$', answer: '$' + v,
          en: `A price of $${base} is ${up ? 'increased' : 'decreased'} by ${p}%. What is the new price?`,
          zh: `一件商品原价 ${base} 元，${up ? '涨价' : '降价'} ${p}%，现价是多少元？`,
          solEn: `${p}% of ${base} = ${round(base * p / 100, 2)}; ${base} ${up ? '+' : MINUS} ${round(base * p / 100, 2)} = ${v}`,
          solZh: `${base} 的 ${p}% 是 ${round(base * p / 100, 2)}；${base} ${up ? '+' : MINUS} ${round(base * p / 100, 2)} = ${v}` });
      }
      if (y >= 7 && Math.random() < 0.35) {
        const whole = pick([20, 25, 40, 50, 80, 200]), part = R(1, whole - 1), pc = round(part / whole * 100, 2);
        return mk({ topic: 'pct', value: pc, unit: '%', answer: pc + '%',
          en: `What percentage is ${part} out of ${whole}?`, zh: `${part} 占 ${whole} 的百分之几？`,
          solEn: `${part} ÷ ${whole} × 100 = ${pc}%`, solZh: `${part} ÷ ${whole} × 100 = ${pc}%` });
      }
      const p = pick(d === 1 ? [10, 50, 25, 20] : d === 2 ? [5, 15, 30, 40, 75] : [12, 35, 45, 60, 8, 2.5]);
      const n = (100 / gcd(p * 2, 200) * 2) * R(1, d * 6), v = round(p * n / 100, 4);
      return mk({ topic: 'pct', value: v, en: `What is ${p}% of ${n}?`, zh: `${n} 的 ${p}% 是多少？`,
        solEn: `${p}% = ${p}/100, so ${p}/100 × ${n} = ${v}`, solZh: `${p}% = ${p}/100，所以 ${p}/100 × ${n} = ${v}` });
    },

    ratio(y, d) {
      if (Math.random() < 0.4) {
        const speed = R(4, 12) * 5 * (d === 3 ? 2 : 1), t = pick([2, 3, 4, 1.5, 2.5]);
        const v = round(speed * t, 2);
        return mk({ topic: 'ratio', value: v, unit: 'km',
          en: `A car travels at ${speed} km/h for ${t} hours. How far does it travel (km)?`,
          zh: `一辆汽车以每小时 ${speed} 千米的速度行驶了 ${t} 小时，一共行驶了多少千米？`,
          solEn: `distance = speed × time = ${speed} × ${t} = ${v} km`, solZh: `路程 = 速度 × 时间 = ${speed} × ${t} = ${v} 千米` });
      }
      let a = R(1, d + 3), b = R(1, d + 4); if (a === b) b++;
      const g = gcd(a, b); a /= g; b /= g;
      const n = (a + b) * R(2, d === 3 ? 25 : 10), share = n / (a + b), v = Math.max(a, b) * share;
      return mk({ topic: 'ratio', value: v,
        en: `Share ${n} in the ratio ${a}:${b}. How much is the larger share?`,
        zh: `把 ${n} 按 ${a}:${b} 分配，较大的一份是多少？`,
        solEn: `${a} + ${b} = ${a + b} parts; one part = ${n} ÷ ${a + b} = ${share}; larger share = ${Math.max(a, b)} × ${share} = ${v}`,
        solZh: `共 ${a} + ${b} = ${a + b} 份；每份 = ${n} ÷ ${a + b} = ${share}；较大的一份 = ${Math.max(a, b)} × ${share} = ${v}` });
    },

    int(y, d) {
      const m = d === 1 ? 10 : d === 2 ? 20 : 50;
      const a = R(-m, m) || -3, b = R(-m, m) || 4;
      const op = pick(d === 1 ? ['+', MINUS] : ['+', MINUS, '×', '÷']);
      let v, e;
      if (op === '÷') { const c = R(-9, 9) || 3; v = R(-12, 12) || -2; e = `${num(v * c)} ÷ ${paren(c)}`; }
      else { v = op === '+' ? a + b : op === MINUS ? a - b : a * b; e = `${num(a)} ${op} ${paren(b)}`; }
      const md = op === '×' || op === '÷', subNeg = op === MINUS && b < 0;
      const rule = { en: md ? 'Same signs give a positive answer; different signs give a negative answer. ' : subNeg ? 'Subtracting a negative is the same as adding. ' : 'Use a number line. ',
        zh: md ? '同号得正，异号得负。' : subNeg ? '减去一个负数等于加上它的相反数。' : '借助数轴计算：' };
      return mk({ topic: 'int', value: v, en: `Work out ${e}`, zh: `计算：${e}`, solEn: `${rule.en}${e} = ${num(v)}`, solZh: `${rule.zh}${e} = ${num(v)}` });
    },

    index(y, d) {
      const k = pick(y >= 9 ? ['pow', 'root', 'law', 'law'] : ['pow', 'root', y >= 8 ? 'law' : 'pow']);
      if (k === 'pow') {
        const b = R(2, d === 1 ? 5 : 10), e = d === 1 ? 2 : R(2, b > 5 ? 3 : 5), v = b ** e;
        return mk({ topic: 'index', value: v, en: `Work out ${b}^${e}`, zh: `计算：${b}^${e}`,
          solEn: `${b}^${e} = ${Array(e).fill(b).join(' × ')} = ${v}`, solZh: `${b}^${e} = ${Array(e).fill(b).join(' × ')} = ${v}` });
      }
      if (k === 'root') {
        const cube = d === 3 && Math.random() < 0.5, r = R(2, cube ? 10 : d === 1 ? 12 : 25), n = cube ? r ** 3 : r * r;
        return mk({ topic: 'index', value: r, en: cube ? `Work out the cube root of ${n}` : `Work out √${n}`,
          zh: cube ? `求 ${n} 的立方根。` : `计算：√${n}`,
          solEn: `${r}${cube ? '³' : '²'} = ${n}, so the answer is ${r}`, solZh: `因为 ${r}${cube ? '³' : '²'} = ${n}，所以答案是 ${r}` });
      }
      const a = R(2, 9), b = R(2, 9), op = pick(['×', '÷', 'pow']);
      if (op === 'pow') {
        return mk({ topic: 'index', value: a * b, en: `Simplify (x^${a})^${b} = x^n. What is n?`, zh: `化简 (x^${a})^${b} = x^n，n 是多少？`,
          solEn: `Power of a power: multiply the indices, ${a} × ${b} = ${a * b}`, solZh: `幂的乘方，指数相乘：${a} × ${b} = ${a * b}` });
      }
      const hi = Math.max(a, b) + (op === '÷' ? R(1, 5) : 0), lo = op === '÷' ? Math.min(a, b) : b;
      const v = op === '×' ? a + b : hi - lo;
      return mk({ topic: 'index', value: v,
        en: op === '×' ? `Simplify x^${a} × x^${b} = x^n. What is n?` : `Simplify x^${hi} ÷ x^${lo} = x^n. What is n?`,
        zh: op === '×' ? `化简 x^${a} × x^${b} = x^n，n 是多少？` : `化简 x^${hi} ÷ x^${lo} = x^n，n 是多少？`,
        solEn: op === '×' ? `Same base, multiply: add the indices ${a} + ${b} = ${v}` : `Same base, divide: subtract the indices ${hi} ${MINUS} ${lo} = ${v}`,
        solZh: op === '×' ? `同底数幂相乘，指数相加：${a} + ${b} = ${v}` : `同底数幂相除，指数相减：${hi} ${MINUS} ${lo} = ${v}` });
    },

    alg(y, d) {
      const x = R(y >= 8 ? -6 : 1, 12) || 2;
      if (d === 1 && Math.random() < 0.5) {
        const a = R(2, 9), b = R(1, 20), v = a * x + b;
        return mk({ topic: 'alg', value: v, en: `If x = ${num(x)}, find the value of ${a}x + ${b}.`, zh: `当 x = ${num(x)} 时，求 ${a}x + ${b} 的值。`,
          solEn: `${a} × ${paren(x)} + ${b} = ${a * x} + ${b} = ${num(v)}`, solZh: `${a} × ${paren(x)} + ${b} = ${a * x} + ${b} = ${num(v)}` });
      }
      const sg = n => (n < 0 ? ` ${MINUS} ${-n}` : ` + ${n}`);
      let e, steps;
      if (d === 1) { const b = R(1, 20); e = `x + ${b} = ${num(x + b)}`; steps = [`x = ${num(x + b)} ${MINUS} ${b} = ${num(x)}`, `x = ${num(x + b)} ${MINUS} ${b} = ${num(x)}`]; }
      else if (d === 2 || y < 9) {
        const a = R(2, 9), b = R(-15, 15) || 5, c = a * x + b; e = `${a}x${sg(b)} = ${num(c)}`;
        steps = [`${a}x = ${num(c)}${sg(-b)} = ${num(c - b)}, so x = ${num(c - b)} ÷ ${a} = ${num(x)}`, `${a}x = ${num(c)}${sg(-b)} = ${num(c - b)}，所以 x = ${num(c - b)} ÷ ${a} = ${num(x)}`];
      } else {
        const a = R(4, 9), c = R(1, a - 2), b = R(-9, 9), dd = (a - c) * x + b; e = `${a}x${sg(b)} = ${c === 1 ? '' : c}x${sg(dd)}`;
        steps = [`Subtract ${c === 1 ? '' : c}x from both sides: ${a - c}x${sg(b)} = ${num(dd)}; so ${a - c}x = ${num(dd - b)}; x = ${num(x)}`,
          `两边同时减去 ${c === 1 ? '' : c}x：${a - c}x${sg(b)} = ${num(dd)}；所以 ${a - c}x = ${num(dd - b)}；x = ${num(x)}`];
      }
      return mk({ topic: 'alg', value: x, en: `Solve for x: ${e}`, zh: `解方程，求 x：${e}`, solEn: steps[0], solZh: steps[1] });
    },

    linear(y, d) {
      const m = d === 1 ? R(1, 5) : R(-6, 6) || 2, c = R(-9, 9);
      if (Math.random() < 0.5) {
        const x1 = R(-5, 3), x2 = x1 + (d === 3 ? R(2, 4) : 1) * R(1, 3);
        const mm = d === 3 ? R(-3, 3) * 0.5 || 1.5 : m;
        const y1 = round(mm * x1 + c, 2), y2 = round(mm * x2 + c, 2);
        return mk({ topic: 'linear', value: round((y2 - y1) / (x2 - x1), 6), answer: fracStr(Math.round((y2 - y1) * 2), (x2 - x1) * 2),
          en: `Find the gradient of the line through (${num(x1)}, ${num(y1)}) and (${num(x2)}, ${num(y2)}).`,
          zh: `求经过点 (${num(x1)}, ${num(y1)}) 和 (${num(x2)}, ${num(y2)}) 的直线的斜率。`,
          solEn: `gradient = rise ÷ run = (${num(y2)} ${MINUS} ${paren(y1)}) ÷ (${num(x2)} ${MINUS} ${paren(x1)}) = ${num(round(y2 - y1, 4))} ÷ ${x2 - x1} = ${fracStr(Math.round((y2 - y1) * 2), (x2 - x1) * 2)}`,
          solZh: `斜率 = (y₂ ${MINUS} y₁) ÷ (x₂ ${MINUS} x₁) = ${num(round(y2 - y1, 4))} ÷ ${x2 - x1} = ${fracStr(Math.round((y2 - y1) * 2), (x2 - x1) * 2)}` });
      }
      const xv = R(-5, 6), v = m * xv + c, eq = `y = ${m === 1 ? '' : m === -1 ? MINUS : num(m)}x${c < 0 ? ' ' + MINUS + ' ' + -c : c ? ' + ' + c : ''}`;
      return mk({ topic: 'linear', value: v, en: `For the line ${eq}, find y when x = ${num(xv)}.`, zh: `对于直线 ${eq}，当 x = ${num(xv)} 时，求 y 的值。`,
        solEn: `y = ${num(m)} × ${paren(xv)} + ${paren(c)} = ${num(v)}`, solZh: `y = ${num(m)} × ${paren(xv)} + ${paren(c)} = ${num(v)}` });
    },

    meas(y, d) {
      const s = d === 1 ? 12 : d === 2 ? 25 : 60;
      const kinds = ['perim', 'area', 'conv'];
      if (y >= 6) kinds.push('tri');
      if (y >= 7) kinds.push('vol');
      if (y >= 8) kinds.push('circle');
      const k = pick(kinds);
      if (k === 'conv') {
        const c = pick(y <= 5 ? [['m', 'cm', 100, '米', '厘米'], ['kg', 'g', 1000, '千克', '克'], ['h', 'min', 60, '小时', '分钟']]
          : [['km', 'm', 1000, '千米', '米'], ['l', 'ml', 1000, '升', '毫升'], ['m', 'cm', 100, '米', '厘米'], ['h', 'min', 60, '小时', '分钟']]);
        const a = d === 1 ? R(2, 9) : R(11, 95) / (c[2] === 60 ? 2 : 10), v = round(a * c[2], 4);
        const unitEn = { m: 'm', cm: 'cm', kg: 'kg', g: 'g', h: 'hours', min: 'minutes', km: 'km', l: 'L', ml: 'mL' };
        return mk({ topic: 'meas', value: v, unit: c[1],
          en: `Convert ${a} ${unitEn[c[0]]} to ${unitEn[c[1]]}.`, zh: `${a} ${c[3]} = ? ${c[4]}`,
          solEn: `1 ${unitEn[c[0]]} = ${c[2]} ${unitEn[c[1]]}, so ${a} × ${c[2]} = ${v} ${unitEn[c[1]]}`,
          solZh: `1 ${c[3]} = ${c[2]} ${c[4]}，所以 ${a} × ${c[2]} = ${v} ${c[4]}` });
      }
      if (k === 'perim' || k === 'area') {
        const a = R(3, s), b = R(2, s), v = k === 'perim' ? 2 * (a + b) : a * b, u = k === 'perim' ? 'cm' : 'cm²';
        return mk({ topic: 'meas', value: v, unit: u,
          en: `A rectangle is ${a} cm long and ${b} cm wide. Find its ${k === 'perim' ? 'perimeter' : 'area'} (${u}).`,
          zh: `一个长方形长 ${a} 厘米，宽 ${b} 厘米，求它的${k === 'perim' ? '周长（厘米）' : '面积（平方厘米）'}。`,
          solEn: k === 'perim' ? `2 × (${a} + ${b}) = ${v} cm` : `${a} × ${b} = ${v} cm²`,
          solZh: k === 'perim' ? `2 × (${a} + ${b}) = ${v} 厘米` : `${a} × ${b} = ${v} 平方厘米` });
      }
      if (k === 'tri') {
        const a = R(3, s), h = 2 * R(2, Math.ceil(s / 2)), v = a * h / 2;
        return mk({ topic: 'meas', value: v, unit: 'cm²', en: `A triangle has base ${a} cm and height ${h} cm. Find its area (cm²).`,
          zh: `一个三角形底 ${a} 厘米，高 ${h} 厘米，求它的面积（平方厘米）。`,
          solEn: `½ × base × height = ½ × ${a} × ${h} = ${v} cm²`, solZh: `面积 = 底 × 高 ÷ 2 = ${a} × ${h} ÷ 2 = ${v} 平方厘米` });
      }
      if (k === 'vol') {
        const a = R(2, s / 2 + 2), b = R(2, s / 2 + 2), c = R(2, 12), v = a * b * c;
        return mk({ topic: 'meas', value: v, unit: 'cm³', en: `A rectangular prism measures ${a} cm × ${b} cm × ${c} cm. Find its volume (cm³).`,
          zh: `一个长方体长 ${a} 厘米、宽 ${b} 厘米、高 ${c} 厘米，求它的体积（立方厘米）。`,
          solEn: `${a} × ${b} × ${c} = ${v} cm³`, solZh: `${a} × ${b} × ${c} = ${v} 立方厘米` });
      }
      const r = R(2, d === 1 ? 10 : 20), area = Math.random() < 0.5, v = round(area ? Math.PI * r * r : 2 * Math.PI * r, 2);
      return mk({ topic: 'meas', value: v, unit: area ? 'cm²' : 'cm', tol: Math.max(0.6, v * 0.005), answer: v.toFixed(2) + (area ? ' cm²' : ' cm'),
        en: `A circle has radius ${r} cm. Find its ${area ? 'area (cm²)' : 'circumference (cm)'}, to 2 decimal places.`,
        zh: `一个圆的半径是 ${r} 厘米，求它的${area ? '面积（平方厘米）' : '周长（厘米）'}，保留两位小数。`,
        solEn: area ? `πr² = π × ${r}² ≈ ${v.toFixed(2)} cm²` : `2πr = 2 × π × ${r} ≈ ${v.toFixed(2)} cm`,
        solZh: area ? `S = πr² = π × ${r}² ≈ ${v.toFixed(2)} 平方厘米` : `C = 2πr = 2 × π × ${r} ≈ ${v.toFixed(2)} 厘米` });
    },

    angle(y, d) {
      const kinds = ['line', 'point'];
      if (y >= 6) kinds.push('tri');
      if (y >= 8) kinds.push('poly');
      const k = pick(kinds);
      if (k === 'line') {
        const a = R(15, 165), v = 180 - a;
        return mk({ topic: 'angle', value: v, unit: '°', en: `Two angles lie on a straight line. One is ${a}°. Find the other (°).`,
          zh: `两个角组成一个平角，其中一个角是 ${a}°，求另一个角（度）。`, solEn: `Angles on a straight line add to 180°: 180 ${MINUS} ${a} = ${v}°`, solZh: `平角是 180°：180 ${MINUS} ${a} = ${v}°` });
      }
      if (k === 'point') {
        const a = R(40, 150), b = R(40, 150), v = 360 - a - b;
        return mk({ topic: 'angle', value: v, unit: '°', en: `Three angles meet at a point. Two of them are ${a}° and ${b}°. Find the third (°).`,
          zh: `三个角组成一个周角，其中两个角是 ${a}° 和 ${b}°，求第三个角（度）。`, solEn: `Angles at a point add to 360°: 360 ${MINUS} ${a} ${MINUS} ${b} = ${v}°`, solZh: `周角是 360°：360 ${MINUS} ${a} ${MINUS} ${b} = ${v}°` });
      }
      if (k === 'tri') {
        const a = R(20, 100), b = R(20, 160 - a - 0), v = 180 - a - b;
        if (v <= 0) return G.angle(y, d);
        return mk({ topic: 'angle', value: v, unit: '°', en: `A triangle has angles ${a}° and ${b}°. Find the third angle (°).`,
          zh: `一个三角形的两个角是 ${a}° 和 ${b}°，求第三个角（度）。`, solEn: `Angles in a triangle add to 180°: 180 ${MINUS} ${a} ${MINUS} ${b} = ${v}°`, solZh: `三角形内角和是 180°：180 ${MINUS} ${a} ${MINUS} ${b} = ${v}°` });
      }
      const n = R(5, d === 3 ? 12 : 8), sum = (n - 2) * 180, each = d === 3 ? round(sum / n, 2) : null;
      const zhN = { 5: '五', 6: '六', 7: '七', 8: '八', 9: '九', 10: '十', 11: '十一', 12: '十二' }[n];
      if (each !== null) {
        return mk({ topic: 'angle', value: each, unit: '°', en: `Find each interior angle of a regular polygon with ${n} sides (°).`,
          zh: `求正${zhN}边形每个内角的度数。`, solEn: `Sum = (${n} ${MINUS} 2) × 180 = ${sum}°; each = ${sum} ÷ ${n} = ${each}°`, solZh: `内角和 = (${n} ${MINUS} 2) × 180 = ${sum}°；每个角 = ${sum} ÷ ${n} = ${each}°` });
      }
      return mk({ topic: 'angle', value: sum, unit: '°', en: `Find the sum of the interior angles of a polygon with ${n} sides (°).`,
        zh: `求${zhN}边形的内角和（度）。`, solEn: `(n ${MINUS} 2) × 180 = (${n} ${MINUS} 2) × 180 = ${sum}°`, solZh: `(n ${MINUS} 2) × 180 = (${n} ${MINUS} 2) × 180 = ${sum}°` });
    },

    pyth(y, d) {
      const T = pick([[3, 4, 5], [5, 12, 13], [8, 15, 17], [7, 24, 25], [6, 8, 10], [9, 12, 15]]), m = R(1, d + 1);
      const [a, b, c] = T.map(v => v * m);
      if (d === 3 && Math.random() < 0.5) {
        const p = R(2, 12), q = R(2, 12), v = round(Math.sqrt(p * p + q * q), 2);
        return mk({ topic: 'pyth', value: v, unit: 'cm', tol: 0.011, answer: v.toFixed(2) + ' cm',
          en: `A right-angled triangle has shorter sides ${p} cm and ${q} cm. Find the hypotenuse to 2 decimal places (cm).`,
          zh: `一个直角三角形的两条直角边分别为 ${p} 厘米和 ${q} 厘米，求斜边长（保留两位小数，厘米）。`,
          solEn: `c = √(${p}² + ${q}²) = √${p * p + q * q} ≈ ${v.toFixed(2)} cm`, solZh: `c = √(${p}² + ${q}²) = √${p * p + q * q} ≈ ${v.toFixed(2)} 厘米` });
      }
      if (Math.random() < 0.5) {
        return mk({ topic: 'pyth', value: c, unit: 'cm', en: `A right-angled triangle has shorter sides ${a} cm and ${b} cm. Find the hypotenuse (cm).`,
          zh: `一个直角三角形的两条直角边分别为 ${a} 厘米和 ${b} 厘米，求斜边长（厘米）。`,
          solEn: `c² = ${a}² + ${b}² = ${a * a + b * b}, so c = ${c} cm`, solZh: `c² = ${a}² + ${b}² = ${a * a + b * b}，所以 c = ${c} 厘米` });
      }
      return mk({ topic: 'pyth', value: b, unit: 'cm', en: `A right-angled triangle has hypotenuse ${c} cm and one shorter side ${a} cm. Find the other shorter side (cm).`,
        zh: `一个直角三角形的斜边为 ${c} 厘米，一条直角边为 ${a} 厘米，求另一条直角边（厘米）。`,
        solEn: `b² = ${c}² ${MINUS} ${a}² = ${c * c - a * a}, so b = ${b} cm`, solZh: `b² = ${c}² ${MINUS} ${a}² = ${c * c - a * a}，所以 b = ${b} 厘米` });
    },

    stats(y, d) {
      const n = d === 1 ? 5 : d === 2 ? 6 : 7, max = d === 3 ? 60 : 20;
      const data = Array.from({ length: n }, () => R(1, max));
      const list = data.join(', '), sorted = [...data].sort((a, b) => a - b);
      const k = pick(y >= 6 ? ['mean', 'median', 'range'] : ['mean', 'range']);
      if (k === 'range') {
        const v = sorted[n - 1] - sorted[0];
        return mk({ topic: 'stats', value: v, en: `Find the range of: ${list}`, zh: `求这组数据的极差：${list}`,
          solEn: `largest ${MINUS} smallest = ${sorted[n - 1]} ${MINUS} ${sorted[0]} = ${v}`, solZh: `最大值 ${MINUS} 最小值 = ${sorted[n - 1]} ${MINUS} ${sorted[0]} = ${v}` });
      }
      if (k === 'median') {
        const v = n % 2 ? sorted[(n - 1) / 2] : (sorted[n / 2 - 1] + sorted[n / 2]) / 2;
        return mk({ topic: 'stats', value: v, en: `Find the median of: ${list}`, zh: `求这组数据的中位数：${list}`,
          solEn: `In order: ${sorted.join(', ')}. Middle value = ${v}`, solZh: `从小到大排列：${sorted.join(', ')}，中间的数 = ${v}` });
      }
      // make the mean a whole number on easy/medium, allow decimals on hard
      if (d < 3) { const s = data.reduce((a, b) => a + b, 0); data[0] += (n - (s % n)) % n; }
      const sum = data.reduce((a, b) => a + b, 0), v = round(sum / n, 2), list2 = data.join(', ');
      return mk({ topic: 'stats', value: v, en: `Find the mean of: ${list2}${Number.isInteger(v) ? '' : ' (2 decimal places)'}`,
        zh: `求这组数据的平均数：${list2}${Number.isInteger(v) ? '' : '（保留两位小数）'}`,
        solEn: `sum = ${sum}; ${sum} ÷ ${n} = ${v}`, solZh: `总和 = ${sum}；${sum} ÷ ${n} = ${v}` });
    },

    prob(y, d) {
      const r = R(1, 6 + d * 2), b = R(1, 6 + d * 2), g = d >= 2 ? R(1, 8) : 0, total = r + b + g;
      const c = pick(g ? ['red', 'blue', 'green', 'notred'] : ['red', 'blue']);
      const cnt = { red: r, blue: b, green: g, notred: total - r }[c];
      const en = { red: 'red', blue: 'blue', green: 'green', notred: 'not red' }[c];
      const zh = { red: '红球', blue: '蓝球', green: '绿球', notred: '不是红球' }[c];
      const ans = fracStr(cnt, total);
      const bagEn = `A bag has ${r} red, ${b} blue${g ? ` and ${g} green` : ''} balls.`;
      const bagZh = `袋子里有 ${r} 个红球、${b} 个蓝球${g ? `和 ${g} 个绿球` : ''}。`;
      return mk({ topic: 'prob', value: cnt / total, answer: ans,
        en: `${bagEn} One ball is picked at random. What is the probability it is ${en}? (fraction)`,
        zh: `${bagZh}随机摸出一个球，摸到${zh}的概率是多少？（用分数表示）`,
        solEn: `${cnt} favourable out of ${total} balls = ${cnt}/${total}${ans !== cnt + '/' + total ? ' = ' + ans : ''}`,
        solZh: `${total} 个球中有 ${cnt} 个符合，概率 = ${cnt}/${total}${ans !== cnt + '/' + total ? ' = ' + ans : ''}` });
    }
  };

  function generate(year, topic, diff) {
    const list = topicsFor(year);
    const t = topic !== 'mixed' && TOPICS[topic] && TOPICS[topic] <= year ? topic : pick(list);
    const q = G[t](year, diff);
    q.year = year; q.diff = diff;
    return q;
  }

  /* n distinct questions; in Mixed mode, rotate through topics so they're spread out */
  function generateSet(year, topic, diff, n) {
    const out = [], seen = new Set();
    let order = topic === 'mixed' ? shuffle(topicsFor(year)) : [topic];
    for (let tries = 0; out.length < n && tries < n * 50; tries++) {
      const tp = order[out.length % order.length];
      const q = generate(year, tp, diff);
      if (seen.has(q.q.en)) continue;
      seen.add(q.q.en); out.push(q);
      if (topic === 'mixed' && out.length % order.length === 0) order = shuffle(order);
    }
    return out;
  }
  function shuffle(a) { a = [...a]; for (let i = a.length - 1; i > 0; i--) { const j = R(0, i); [a[i], a[j]] = [a[j], a[i]]; } return a; }

  const api = { TOPICS, topicsFor, generate, generateSet, fracStr };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.Generator = api;
})(typeof window !== 'undefined' ? window : globalThis);
