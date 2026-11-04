/* Chart and diagram questions for Years 4–10: reading graphs and solving geometry from a picture. */
(function (root) {
  'use strict';
  const G = root.Gen || require('./gen-core.js');
  const { R, pick, shuffle, fracStr, mk, gcd } = G;
  const reg = (topic, minYear, maxYear, fn) => G.register('maths', topic, minYear, fn, { maxYear });
  const SPORTS = [['soccer', '足球'], ['swimming', '游泳'], ['tennis', '网球'], ['netball', '篮网球'], ['cricket', '板球'], ['basketball', '篮球']].map(([en, zh]) => ({ en, zh }));
  const DAYS = [['Mon', '周一'], ['Tue', '周二'], ['Wed', '周三'], ['Thu', '周四'], ['Fri', '周五'], ['Sat', '周六']].map(([en, zh]) => ({ en, zh }));
  const NOTE = { en: '[diagram not to scale]', zh: '［图形不按比例］' };

  /* ---------- graphs & data ---------- */
  reg('datafig', 4, 10, (y, d) => {
    const k = pick(y <= 5 ? ['barMean', 'barRange', 'picto', 'pie'] : ['barMean', 'line', 'pie', 'barMedian', 'table']);
    if (k === 'barMean' || k === 'barRange' || k === 'barMedian') {
      const n = R(4, 6), step = pick([2, 5, 10]), vals = Array.from({ length: n }, () => step * R(1, 9)), days = DAYS.slice(0, n);
      if (k === 'barMean') { const s = vals.reduce((a, b) => a + b, 0); if (s % n) return null; }
      const sorted = [...vals].sort((a, b) => a - b), mean = vals.reduce((a, b) => a + b, 0) / n;
      const v = k === 'barMean' ? mean : k === 'barRange' ? sorted[n - 1] - sorted[0] : n % 2 ? sorted[(n - 1) / 2] : (sorted[n / 2 - 1] + sorted[n / 2]) / 2;
      const w = { barMean: ['mean (average)', '平均数'], barRange: ['range', '极差'], barMedian: ['median', '中位数'] }[k];
      return mk({ topic: 'datafig', value: v, fig: { type: 'bar', max: step * 10, step: step * (step === 2 ? 2 : 1), values: vals, cats: days, yLabel: { en: 'books read', zh: '读书数量' } },
        en: `The column graph shows how many books a class read each day. ${k === 'barRange' ? 'What is the range of the daily book counts?' : `What is the ${w[0]} number of books read per day?`}`, zh: `条形统计图表示一个班每天读书的数量。每天读书数量的${w[1]}是多少？`,
        solEn: `Values: ${vals.join(', ')} → ${w[0]} = ${v}`, solZh: `数据：${vals.join('、')} → ${w[1]} = ${v}` });
    }
    if (k === 'picto') {
      const key = pick([2, 4, 10]), counts = DAYS.slice(0, 5).map(() => R(2, 12) / 2), i = R(0, 4), tot = counts.reduce((a, b) => a + b, 0) * key, ask = d >= 2 ? 'total' : 'one';
      return mk({ topic: 'datafig', value: ask === 'total' ? tot : counts[i] * key, fig: { type: 'picto', icon: '⚽', rows: DAYS.slice(0, 5).map((dd, x) => ({ label: dd, count: counts[x] })), key: { en: `⚽ = ${key} goals`, zh: `⚽ = ${key} 个进球` } },
        en: ask === 'total' ? 'The picture graph shows goals scored each day. How many goals were scored altogether?' : `The picture graph shows goals scored each day. How many goals were scored on ${DAYS[i].en}?`,
        zh: ask === 'total' ? '象形统计图表示每天的进球数，一共进了多少个球？' : `象形统计图表示每天的进球数，${DAYS[i].zh}进了多少个球？`,
        solEn: `Half a ball = ${key / 2}. ${ask === 'total' ? `Total pictures ${counts.reduce((a, b) => a + b, 0)} × ${key} = ${tot}` : `${counts[i]} × ${key} = ${counts[i] * key}`}`, solZh: `半个球代表 ${key / 2}。${ask === 'total' ? `共 ${counts.reduce((a, b) => a + b, 0)} 个图标 × ${key} = ${tot}` : `${counts[i]} × ${key} = ${counts[i] * key}`}` });
    }
    if (k === 'pie') {
      const parts = pick([[50, 25, 25], [40, 30, 20, 10], [30, 25, 25, 20], [45, 30, 15, 10], [35, 25, 20, 20], [60, 20, 10, 10]]), sp = shuffle(SPORTS).slice(0, parts.length);
      const N = pick([20, 40, 60, 80, 120, 200, 240]), i = R(0, parts.length - 1), j = (i + 1) % parts.length, ask = d >= 2 ? 'diff' : 'one';
      const v = ask === 'one' ? N * parts[i] / 100 : N * Math.abs(parts[i] - parts[j]) / 100;
      if (!Number.isInteger(v)) return null;
      return mk({ topic: 'datafig', value: v, fig: { type: 'pie', values: parts, labels: sp, showValues: parts.map(p => p + '%') },
        en: ask === 'one' ? `The pie chart shows the favourite sport of ${N} students. How many students chose ${sp[i].en}?` : `The pie chart shows the favourite sport of ${N} students. How many more students chose ${parts[i] >= parts[j] ? sp[i].en : sp[j].en} than ${parts[i] >= parts[j] ? sp[j].en : sp[i].en}?`,
        zh: ask === 'one' ? `扇形统计图表示 ${N} 名学生最喜欢的运动。喜欢${sp[i].zh}的有多少人？` : `扇形统计图表示 ${N} 名学生最喜欢的运动。喜欢${parts[i] >= parts[j] ? sp[i].zh : sp[j].zh}的比喜欢${parts[i] >= parts[j] ? sp[j].zh : sp[i].zh}的多多少人？`,
        solEn: ask === 'one' ? `${parts[i]}% of ${N} = ${v}` : `${Math.abs(parts[i] - parts[j])}% of ${N} = ${v}`, solZh: ask === 'one' ? `${N} × ${parts[i]}% = ${v}` : `${N} × ${Math.abs(parts[i] - parts[j])}% = ${v}` });
    }
    if (k === 'line') {
      const ys = [R(2, 6)]; for (let i = 1; i < 7; i++) ys.push(Math.max(0, Math.min(10, ys[i - 1] + pick([-2, -1, 1, 2, 3])))); const vals = ys.map(v => v * 5);
      const inc = vals.slice(1).map((v, i) => v - vals[i]), best = Math.max(...inc);
      if (best <= 0 || inc.filter(x => x === best).length > 1) return null;
      const i = inc.indexOf(best);
      return mk({ topic: 'datafig', value: best, fig: { type: 'line', max: 50, step: 10, xs: [0, 1, 2, 3, 4, 5, 6], ys: vals, xLabel: { en: 'week', zh: '周' }, yLabel: { en: 'height (cm)', zh: '高度（厘米）' } },
        en: 'The line graph shows the height of a plant each week. What was the greatest increase in height in one week (cm)?', zh: '折线统计图表示植物每周的高度。一周内最大的增高是多少厘米？',
        solEn: `Weekly changes: ${inc.join(', ')}; the largest is ${best} cm (week ${i} to ${i + 1})`, solZh: `每周变化：${inc.join('、')}；最大增高 ${best} 厘米（第 ${i} 到 ${i + 1} 周）`, unit: 'cm' });
    }
    const a = R(5, 20), b = R(5, 20), c = R(5, 20), e = R(5, 20), ask = pick(['and', 'given']);
    const tot = a + b + c + e, v = ask === 'and' ? fracStr(a, tot) : fracStr(a, a + c);
    return mk({ topic: 'datafig', value: ask === 'and' ? a / tot : a / (a + c), answer: v, fig: { type: 'table', head: ['', { en: 'Dog', zh: '养狗' }, { en: 'No dog', zh: '不养狗' }], rowHeads: true, rows: [[{ en: 'Cat', zh: '养猫' }, a, b], [{ en: 'No cat', zh: '不养猫' }, c, e]] },
      en: ask === 'and' ? 'The two-way table shows pets owned by a group of students. One student is chosen at random. What is the probability they own both a cat and a dog? (fraction)' : 'One student who owns a dog is chosen at random. What is the probability that they also own a cat? (fraction)',
      zh: ask === 'and' ? '双向表表示一组学生养宠物的情况。随机选一人，他既养猫又养狗的概率是多少？（分数）' : '从养狗的学生中随机选一人，他也养猫的概率是多少？（分数）',
      solEn: ask === 'and' ? `${a} of ${tot} students: ${v}` : `${a} of the ${a + c} dog owners: ${v}`, solZh: ask === 'and' ? `${tot} 人中有 ${a} 人：${v}` : `养狗的 ${a + c} 人中有 ${a} 人：${v}` });
  });

  /* ---------- geometry from a diagram ---------- */
  reg('geofig', 4, 10, (y, d) => {
    const k = pick(y <= 5 ? ['triAngle', 'lshape', 'gridArea'] : y <= 7 ? ['triAngle', 'iso', 'lshape', 'coordMid', 'gridArea'] : ['iso', 'exterior', 'coordDist', 'pyth', 'lshape', 'coordGrad']);
    if (k === 'triAngle') { const A = R(25, 95), B = R(25, 150 - A), x = 180 - A - B;
      return mk({ topic: 'geofig', value: x, unit: '°', fig: { type: 'triangle', angles: [`${A}°`, `${B}°`, 'x'], note: NOTE }, en: 'Find the size of angle x in the triangle.', zh: '求三角形中角 x 的度数。', solEn: `Angles in a triangle add to 180°: 180 − ${A} − ${B} = ${x}°`, solZh: `三角形内角和 180°：180 − ${A} − ${B} = ${x}°` }); }
    if (k === 'iso') { const apex = 2 * R(15, 70), base = (180 - apex) / 2, askApex = Math.random() < 0.5;
      return mk({ topic: 'geofig', value: askApex ? apex : base, unit: '°', fig: { type: 'triangle', apex: 170, angles: askApex ? [`${base}°`, null, 'x'] : ['x', null, `${apex}°`], sides: [null, '|', '|'], note: NOTE },
        en: `The triangle is isosceles: the two sides marked | are equal. Find x.`, zh: '三角形是等腰三角形（标 | 的两边相等）。求 x。', solEn: askApex ? `Base angles are both ${base}°: x = 180 − 2 × ${base} = ${apex}°` : `x = (180 − ${apex}) ÷ 2 = ${base}°`, solZh: askApex ? `两底角都是 ${base}°：x = 180 − 2 × ${base} = ${apex}°` : `x = (180 − ${apex}) ÷ 2 = ${base}°` }); }
    if (k === 'exterior') { const A = R(30, 80), B = R(30, 80);
      return mk({ topic: 'geofig', value: A + B, unit: '°', fig: { type: 'triangle', names: true, angles: [null, `${A}°`, `${B}°`], note: NOTE }, en: `The two marked interior angles are ${A}° and ${B}°. Find the exterior angle at the third corner (A).`, zh: `图中两个内角为 ${A}° 和 ${B}°，求第三个顶点 A 处的外角。`, solEn: `Exterior angle = sum of the opposite interior angles = ${A + B}°`, solZh: `外角等于不相邻两内角之和：${A + B}°` }); }
    if (k === 'lshape') { const W = R(8, 16), H = R(7, 14), a = R(3, W - 3), b = R(2, H - 3), pts = [[0, 0], [W, 0], [W, H - b], [W - a, H - b], [W - a, H], [0, H]], askA = d >= 2 || Math.random() < 0.5;
      return mk({ topic: 'geofig', value: askA ? W * H - a * b : 2 * (W + H), unit: askA ? 'cm²' : 'cm', fig: { type: 'shape', pts, shaded: true, note: NOTE, labels: [{ edge: 0, text: `${W} cm` }, { edge: 1, text: `${H - b} cm` }, { edge: 4, text: `${W - a} cm` }, { edge: 5, text: `${H} cm` }] },
        en: `Find the ${askA ? 'area' : 'perimeter'} of the shape.`, zh: `求图形的${askA ? '面积' : '周长'}。`, solEn: askA ? `${W} × ${H} − ${a} × ${b} = ${W * H - a * b} cm²` : `2 × (${W} + ${H}) = ${2 * (W + H)} cm`, solZh: askA ? `${W} × ${H} − ${a} × ${b} = ${W * H - a * b} 平方厘米` : `(${W} + ${H}) × 2 = ${2 * (W + H)} 厘米` }); }
    if (k === 'gridArea') { const cells = []; const w = R(3, 5), h = R(2, 4); for (let x = 0; x < w; x++) for (let yy = 0; yy < h; yy++) if (!(x === w - 1 && yy === 0) || d === 1) cells.push([x + 1, yy + 1]);
      return mk({ topic: 'geofig', value: cells.length, unit: 'cm²', fig: { type: 'grid', w: w + 2, h: h + 2, shapes: [{ cells }] }, en: 'Each small square is 1 cm². What is the area of the shaded shape?', zh: '每个小方格面积是 1 平方厘米。阴影图形的面积是多少？', solEn: `Count the squares: ${cells.length} cm²`, solZh: `数一数方格：${cells.length} 平方厘米` }); }
    if (k === 'pyth') { const [a, b, c] = pick([[3, 4, 5], [5, 12, 13], [6, 8, 10], [8, 15, 17], [9, 12, 15]]), askHyp = Math.random() < 0.5;
      return mk({ topic: 'geofig', value: askHyp ? c : b, unit: 'cm', fig: { type: 'triangle', right: true, sides: askHyp ? [`${a} cm`, 'x', `${b} cm`] : [`${a} cm`, `${c} cm`, 'x'], note: NOTE }, en: 'Find the length x in the right-angled triangle.', zh: '求直角三角形中 x 的长度。', solEn: askHyp ? `x = √(${a}² + ${b}²) = ${c}` : `x = √(${c}² − ${a}²) = ${b}`, solZh: askHyp ? `x = √(${a}² + ${b}²) = ${c}` : `x = √(${c}² − ${a}²) = ${b}` }); }
    const x1 = R(-4, 1), y1 = R(-4, 1), [dx, dy, dist] = pick([[3, 4, 5], [4, 3, 5], [2, 4, 0], [4, 2, 0], [2, 2, 0]]), x2 = x1 + dx, y2 = y1 + dy;
    const fig = { type: 'coord', xmin: -5, xmax: 5, ymin: -5, ymax: 5, points: [[x1, y1, 'P'], [x2, y2, 'Q']], segments: [[x1, y1, x2, y2]] };
    if (k === 'coordDist' && dist) return mk({ topic: 'geofig', value: dist, fig, en: 'Find the distance between P and Q.', zh: '求 P、Q 两点之间的距离。', solEn: `√(${dx}² + ${dy}²) = ${dist}`, solZh: `√(${dx}² + ${dy}²) = ${dist}` });
    if (k === 'coordGrad') return mk({ topic: 'geofig', value: dy / dx, answer: fracStr(dy, dx), fig, en: 'Find the gradient of the line PQ.', zh: '求直线 PQ 的斜率。', solEn: `rise/run = ${dy}/${dx} = ${fracStr(dy, dx)}`, solZh: `${dy}/${dx} = ${fracStr(dy, dx)}` });
    const ax = Math.random() < 0.5, v = ax ? (x1 + x2) / 2 : (y1 + y2) / 2;
    return mk({ topic: 'geofig', value: v, fig, en: `What is the ${ax ? 'x' : 'y'}-coordinate of the midpoint of PQ?`, zh: `线段 PQ 中点的${ax ? '横' : '纵'}坐标是多少？`, solEn: `(${ax ? x1 : y1} + ${ax ? x2 : y2}) ÷ 2 = ${v}`, solZh: `(${ax ? x1 : y1} + ${ax ? x2 : y2}) ÷ 2 = ${v}` });
  });
})(typeof window !== 'undefined' ? window : globalThis);
