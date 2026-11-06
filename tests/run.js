/* Run with: node tests/run.js */
const assert = require('assert');
const C = require('../js/checker.js');
let pass = 0, fail = 0;
function t(name, fn) { try { fn(); pass++; } catch (e) { fail++; console.log('FAIL', name, '-', e.message); } }
const ok = (q, s) => t(`accept ${JSON.stringify(s)} for ${q.value}${q.unit || ''}`, () => assert.ok(C.check(q, s).ok, JSON.stringify(C.check(q, s))));
const no = (q, s) => t(`reject ${JSON.stringify(s)} for ${q.value}${q.unit || ''}`, () => assert.ok(!C.check(q, s).ok));

const threeQ = { value: 0.75 };
['3/4', '6/8', ' 3 / 4 ', '0.75', '.75', '75/100', '３／４', '0.75 ', '4分之3'].forEach(s => ok(threeQ, s));
['4/3', '0.7', '3/5', '', 'abc', '3/0'].forEach(s => no(threeQ, s));
ok({ value: 1.5 }, '1 1/2'); ok({ value: 1.5 }, '3/2'); ok({ value: -1.5 }, '-1 1/2'); ok({ value: -1.5 }, '−3/2');
ok({ value: 2 / 3 }, '0.67'); ok({ value: 2 / 3 }, '0.667'); no({ value: 2 / 3 }, '0.6'); no({ value: 2 / 3 }, '0.7');
ok({ value: 12.35 }, '12.35'); ok({ value: 12.35 }, '12.354'); no({ value: 12.35 }, '12.4');
ok({ value: 1000 }, '1 000'); ok({ value: 1000 }, '1,000'); ok({ value: 12345 }, '12,345'); ok({ value: 3.5 }, '3,5');
ok({ value: 5 }, 'x = 5'); ok({ value: 5 }, 'x=5'); ok({ value: -4 }, '-4'); ok({ value: -4 }, '－４'); no({ value: 5 }, '50');
no({ value: 12 }, '12.4'); ok({ value: 12 }, '12.0');
const cm2 = { value: 24, unit: 'cm²' };
['24', '24cm²', '24 cm2', '24 cm^2', '24平方厘米', '24 sq cm'].forEach(s => ok(cm2, s));
['24cm', '24 m²', '24 bananas'].forEach(s => no(cm2, s));
const cm = { value: 13, unit: 'cm' };
['13', '13cm', '13 厘米', '13 CM', '13.0 cm'].forEach(s => ok(cm, s)); no(cm, '13 cm²'); no(cm, '13km');
const deg = { value: 72, unit: '°' }; ['72', '72°', '72 degrees', '72度', '72 °'].forEach(s => ok(deg, s));
const money = { value: 46.5, unit: '$' }; ['46.5', '$46.50', '46.50 dollars', '46.5元', '¥46.5'].forEach(s => ok(money, s));
const pct = { value: 35, unit: '%' }; ['35', '35%', '35 %', '35 percent'].forEach(s => ok(pct, s)); no({ value: 35 }, '35%');
ok({ value: 4, unit: '' }, '4个'); ok({ value: 4, unit: '' }, '4.'); ok({ value: 4 }, '答案：4');
ok({ value: 7.33, tol: 1e-9 }, '7.33'); no({ value: 7.33, tol: 1e-9 }, '7.3349');

/* every generated question: clean text; typed answers accept their own displayed answer; MC well-formed */
require('../js/gen-core.js'); require('../js/gen-maths.js'); require('../js/gen-word.js'); require('../js/gen-junior.js');
require('../js/gen-senior.js'); require('../js/gen-charts.js'); require('../js/gen-olympiad.js'); require('../js/gen-amo.js'); require('../js/gen-ga.js');
const G = globalThis.Gen;
const FIGR = require('../js/figures.js');
let gen = 0;
const BAD = /undefined|NaN|Infinity|null|\[object|function\s*\(/;
for (const subject of ['maths', 'ga']) for (const y of G.YEARS) for (const d of [1, 2, 3, 4]) for (const topic of ['mixed', ...G.topicsFor(subject, y)]) {
  const set = G.generateSet(subject, y, topic, d, 15);
  t(`set size ${subject} y${y} d${d} ${topic}`, () => assert.ok(set.length >= 8, 'got ' + set.length));
  if (subject === 'maths' && topic === 'mixed' && y >= 4 && y <= 10 && d <= 2) t(`mixed has word problems y${y} d${d}`, () => assert.ok(set.filter(q => q.topic === 'word').length >= 3));
  if (subject === 'maths' && topic === 'mixed' && d === 4) t(`challenge mixes in competition problems y${y}`, () => assert.ok(set.filter(q => q.olympiad).length >= 5, 'only ' + set.filter(q => q.olympiad).length));
  for (const q of set) {
    gen++;
    const id = `${subject} y${y} d${d} ${q.topic}: ${q.q.en}`;
    t(id + ' clean', () => {
      const texts = [q.q.en, q.q.zh, q.sol.en, q.sol.zh, ...(q.type === 'mc' ? q.choices.flatMap(c => [c.en, c.zh]) : [q.answer])];
      for (const s of texts) assert.ok(typeof s === 'string' && s.length && !BAD.test(s), JSON.stringify(s));
      assert.strictEqual(q.subject, subject);
      const reg = G.SUBJECTS[subject][q.topic];
      assert.ok(reg && reg.minYear <= y && y <= reg.maxYear, 'topic outside its years');
      if (q.fig) for (const l of ['en', 'zh']) { const h = FIGR.render(q.fig, l); assert.ok(h.startsWith('<figure') && !/NaN|undefined/.test(h), 'figure ' + q.fig.type); }
      // v1.6.4 (F.3): a topic with too few distinct questions is topped up from the year's other topics, after its own
      if (topic !== 'mixed' && q.topic !== topic) assert.ok(set.slice(set.indexOf(q)).every(x => x.topic !== topic), 'top-up before the topic ran out');
    });
    if (q.type === 'mc') {
      t(id + ' mc', () => {
        assert.ok(q.choices.length >= 3 && q.choices.length <= 5, 'options ' + q.choices.length);
        assert.ok(Number.isInteger(q.correct) && q.correct >= 0 && q.correct < q.choices.length);
        assert.strictEqual(new Set(q.choices.map(c => c.en)).size, q.choices.length, 'duplicate options');
      });
    } else {
      t(id + ' self-check ' + q.answer, () => {
        assert.ok(Number.isFinite(q.value));
        assert.ok(C.check(q, q.answer).ok, JSON.stringify(C.check(q, q.answer)));
      });
    }
  }
}


/* Year coverage, school split and olympiad bank */
t('years 1–14 all have maths topics', () => { for (const y of G.YEARS) assert.ok(G.topicsFor('maths', y).length >= 6, 'year ' + y); });
t('ga available every year', () => { for (const y of G.YEARS) assert.ok(G.topicsFor('ga', y).length >= 5, 'year ' + y); });
t('primary/high split', () => { assert.deepStrictEqual(G.PRIMARY, [1, 2, 3, 4, 5, 6]); assert.deepStrictEqual(G.HIGH, [7, 8, 9, 10, 11, 12, 13, 14]); });
t('extension topics only in 3U/4U', () => {
  assert.ok(!G.topicsFor('maths', 12).includes('comb') && G.topicsFor('maths', 13).includes('comb'));
  assert.ok(!G.topicsFor('maths', 13).includes('complex') && G.topicsFor('maths', 14).includes('complex'));
});
{
  const O = globalThis.Olympiad;
  O.T.forEach((tpl, i) => {
    for (let k = 0; k < 60; k++) {
      const q = tpl.fn(); if (!q) continue;
      t(`olympiad #${i} ${q.q.en.slice(0, 40)}`, () => {
        assert.ok(Number.isFinite(q.value), 'value');
        assert.ok(C.check(q, q.answer).ok, 'self-check ' + q.answer);
        assert.ok(!/NaN|undefined|null/.test(q.q.en + q.q.zh + q.sol.en + q.sol.zh), 'text');
      });
    }
  });
  /* spot-check brute-force answers against known values */
  t('olympiad known answers', () => {
    let z = 0; for (let p = 5; p <= 100; p *= 5) z += Math.floor(100 / p);
    assert.strictEqual(z, 24);
  });
  t('challenge sets are mostly competition problems', () => {
    let oly = 0, tot = 0;
    for (const y of [2, 5, 8, 12]) for (let k = 0; k < 10; k++) { const s2 = G.generateSet('maths', y, 'mixed', 4, 10); tot += s2.length; oly += s2.filter(q => q.olympiad).length; }
    assert.ok(oly / tot > 0.5, 'share ' + (oly / tot));
  });
  t('core sets never use competition problems', () => {
    for (const y of [2, 5, 8, 12]) { const s2 = G.generateSet('maths', y, 'mixed', 1, 15); assert.ok(!s2.some(q => q.olympiad)); }
  });
}
/* Selective test: right length and shape, 5 distinct options, valid answers, easy → hard */
const SEL = require('../js/gen-selective.js');
for (let k = 0; k < 40; k++) {
  for (const len of ['full', 'short']) {
    const test = SEL.generateTest(len), n = len === 'full' ? 35 : 18;
    t(`selective ${len} #${k} length`, () => assert.strictEqual(test.length, n));
    t(`selective ${len} #${k} order`, () => { for (let i = 1; i < test.length; i++) assert.ok(test[i].tier >= test[i - 1].tier); });
    t(`selective ${len} #${k} distinct questions`, () => assert.strictEqual(new Set(test.map(q => q.q.en)).size, n));
    for (const q of test) {
      gen++;
      t(`selective q ${q.q.en.slice(0, 50)}`, () => {
        assert.strictEqual(q.choices.length, 5);
        assert.strictEqual(new Set(q.choices.map(c => c.en)).size, 5, 'duplicate options');
        assert.strictEqual(new Set(q.choices.map(c => c.zh)).size, 5, 'duplicate zh options');
        assert.ok(Number.isInteger(q.correct) && q.correct >= 0 && q.correct < 5);
        assert.ok(['snum', 'smeas', 'sspace', 'sstat', 'slogic'].includes(q.topic));
        for (const s of [q.q.en, q.q.zh, q.sol.en, q.sol.zh, ...q.choices.flatMap(c => [c.en, c.zh])]) assert.ok(s && !BAD.test(s), JSON.stringify(s));
      });
    }
  }
}

/* Figures: every figure in generated selective questions renders in both languages */
const FIG = require('../js/figures.js');
{
  let figs = 0;
  for (let k = 0; k < 30; k++) for (const q of SEL.generateTest('full')) {
    if (!q.fig) continue;
    figs++;
    for (const l of ['en', 'zh']) t(`figure ${q.fig.type} ${l}`, () => {
      const h = FIG.render(q.fig, l);
      assert.ok(h.startsWith('<figure'), 'no figure markup');
      assert.ok(!/NaN|undefined|null|\[object/.test(h), h.slice(0, 120));
    });
  }
  t('tests include charts/diagrams', () => assert.ok(figs > 30, 'only ' + figs));
}
t('figure escapes text', () => assert.ok(!FIG.render({ type: 'table', rows: [['<b>x</b>']] }, 'en').includes('<b>x')));
t('selective timing', () => { assert.strictEqual(SEL.FULL.n, 35); assert.strictEqual(SEL.FULL.minutes, 40); assert.strictEqual(SEL.SHORT.n, 18); assert.strictEqual(SEL.SHORT.minutes, 20); });
/* GA option count is normally 4 */
t('ga mostly 4 options', () => {
  const qs = G.generateSet('ga', 8, 'mixed', 3, 200);
  assert.ok(qs.filter(q => q.choices.length === 4).length / qs.length > 0.95);
});

/* AI item validation */
global.window = undefined; global.Checker = C;
const AI = require('../js/ai.js');
globalThis.Checker = C;
t('ai mc item', () => {
  const q = AI.toMcQuestion({ topic: 'gseries', question_en: 'Next? 2, 4, 8, ?', question_zh: '下一个？2，4，8，？', choices_en: ['10', '12', '16', '14'], choices_zh: ['10', '12', '16', '14'], correct_index: 2, solution_en: 'x2', solution_zh: '乘2' }, 6, 2, ['gseries'], 'mixed');
  assert.ok(q && q.type === 'mc' && q.correct === 2 && q.choices[2].zh === '16');
  assert.strictEqual(AI.toMcQuestion({ question_en: 'a', question_zh: 'b', choices_en: ['1', '2'], choices_zh: ['1', '2'], correct_index: 0 }, 6, 2, ['gseries'], 'mixed'), null);
  assert.strictEqual(AI.toMcQuestion({ question_en: 'a', question_zh: 'b', choices_en: ['1', '2', '3', '4'], choices_zh: ['1', '2', '3', '4'], correct_index: 7 }, 6, 2, ['gseries'], 'mixed'), null);
});
const good = AI.toQuestion({ topic: 'frac', question_en: 'What is 1/2 + 1/4?', question_zh: '1/2 + 1/4 等于多少？', answer: '3/4', unit: '', solution_en: 's', solution_zh: 's' }, 6, 1, ['frac'], 'mixed');
t('ai good item', () => { assert.ok(good); assert.strictEqual(good.value, 0.75); assert.ok(C.check(good, '6/8').ok); });
t('ai rejects word answer', () => assert.strictEqual(AI.toQuestion({ topic: 'frac', question_en: 'a', question_zh: 'b', answer: 'three', unit: '' }, 6, 1, ['frac'], 'frac'), null));
t('ai money unit', () => { const q = AI.toQuestion({ topic: 'pct', question_en: 'a', question_zh: 'b', answer: '12.5', unit: '$', solution_en: '', solution_zh: '' }, 8, 1, ['pct'], 'pct'); assert.strictEqual(q.answer, '$12.5'); assert.ok(C.check(q, '$12.50').ok); });

/* AMO-level bank and competition papers */
{
  const O = globalThis.Olympiad;
  t('amo templates exist', () => assert.ok(O.T.filter(x => x.amo).length >= 20));
  t('tiling counts match known values', () => {
    const D = [[0, 0], [0, 1]], SQ = [[0, 0], [0, 1], [1, 0], [1, 1]];
    assert.strictEqual(O.tilings(2, 8, [D]), 34); assert.strictEqual(O.tilings(3, 8, [D]), 153);
    assert.strictEqual(O.tilings(4, 4, [D]), 36); assert.strictEqual(O.tilings(2, 10, [D, SQ]), 683);
  });
  t('amo answers are whole numbers 0-999', () => {
    O.T.filter(x => x.amo).forEach(tpl => { for (let k = 0; k < 20; k++) { const q = tpl.fn(); if (q) assert.ok(Number.isInteger(q.value) && q.value >= 0 && q.value <= 999, q.q.en); } });
  });
  t('challenge high school sets use AMO problems', () => {
    let a = 0; for (let k = 0; k < 200; k++) { const q = O.generate(9, 4); if (q && /power of 2|f\(f\(n\)\)|tiled|second player|ordered pairs|consecutive positive|subsets|chairs|strictly inside|perimeter|cannot be bought|digit sums|divisible by n \+|written in a row|exactly \d+ positive divisors|ordered triples|a₁, a₂|right-angled|different numbers appear/.test(q.q.en)) a++; }
    assert.ok(a > 80, 'amo share ' + a);
  });
  const CP = require('../js/gen-comp.js');
  for (const paper of Object.keys(CP.PAPERS)) for (const len of ['full', 'short']) {
    t(`competition ${paper} ${len}`, () => {
      for (let k = 0; k < 5; k++) {
        const qs = CP.buildPaper(paper, len), lay = CP.layout(paper, len);
        assert.strictEqual(qs.length, lay.length);
        assert.strictEqual(CP.totalMarks(qs), lay.reduce((m, x) => m + x[1], 0));
        qs.forEach((q, i) => {
          assert.ok(!BAD.test(q.q.en + q.q.zh), 'text');
          if (lay[i][0][0] === 'N') { assert.ok(q.intAnswer && Number.isInteger(q.value) && q.value >= 0 && q.value <= 999); assert.ok(C.check(q, String(q.value)).ok); }
          else { assert.strictEqual(q.type, 'mc'); assert.strictEqual(new Set(q.choices.map(c => c.en)).size, 5); assert.ok(q.correct >= 0 && q.correct < 5); }
        });
      }
    });
  }
  t('competition marks', () => {
    assert.strictEqual(CP.totalMarks(CP.buildPaper('amc_j', 'full')), 135);
    assert.strictEqual(CP.totalMarks(CP.buildPaper('aimo', 'full')), 35);
    assert.strictEqual(CP.minutes('amc_mp', 'full'), 60); assert.strictEqual(CP.minutes('amc_s', 'full'), 75); assert.strictEqual(CP.minutes('aimo', 'full'), 240);
  });
}

/* v1.6.4 full-review fixes */
t('F.3 thin topics still give the number asked for', () => {
  for (const [y, tp] of [[1, 'frac1'], [1, 'shape1']]) for (let k = 0; k < 5; k++) {
    const s = G.generateSet('maths', y, tp, 1, 20);
    assert.strictEqual(s.length, 20, `y${y} ${tp}: ${s.length}`);
    assert.ok(s.filter(q => q.topic === tp).length >= 10, `y${y} ${tp}: too few from the topic`);
  }
});
t('F.4 Year 1-3 fraction multiple choice has 4 options, all different values', () => {
  for (const y of [1, 2, 3]) for (const d of [1, 2, 3, 4]) for (let k = 0; k < 100; k++) {
    const q = G.generate('maths', y, 'frac1', d);
    if (q.type !== 'mc') continue;
    assert.strictEqual(q.choices.length, 4, q.choices.map(c => c.en).join(' | '));
    const vals = q.choices.map(c => { const m = c.en.match(/^(\d+)\/(\d+)$/); return m ? +m[1] / +m[2] : c.en; });
    assert.strictEqual(new Set(vals).size, 4, 'equal values: ' + q.choices.map(c => c.en).join(' | '));
  }
});

/* similar questions for the review */
{
  require('../js/gen-selective.js'); const Sim = require('../js/similar.js');
  for (const [sub, y, tp, d] of [['maths', 6, 'frac', 2], ['maths', 9, 'olymp', 4], ['maths', 4, 'word', 1], ['ga', 7, 'mixed', 2], ['maths', 12, 'calc', 3], ['maths', 2, 'mixed', 1]]) {
    t(`similar ${sub} y${y} ${tp}`, () => {
      for (const q of G.generateSet(sub, y, tp, d, 4)) {
        const out = Sim.make(q, 3);
        assert.ok(out.length >= 2, 'only ' + out.length + ' for ' + q.q.en);
        const oly = q.ref && q.ref.oly !== undefined;
        const same = x => oly ? x.ref.oly === q.ref.oly : x.ref.gen === q.ref.gen;
        out.forEach((x, i) => {
          assert.notStrictEqual(x.q.en + JSON.stringify(x.fig || ''), q.q.en + JSON.stringify(q.fig || ''));
          if (x.type !== 'mc') assert.ok(C.check(x, x.answer).ok, 'self-check');
          if (same(x)) return;
          // Another problem type is allowed only after the template ran out of new versions (by design in similar.js).
          assert.ok(oly, 'topic changed: ' + x.ref.gen + ' for ' + q.ref.gen);
          assert.ok(out.slice(0, i).every(same), 'same-template questions must come first');
          const versions = new Set(); const fn = globalThis.Olympiad.T[q.ref.oly].fn;
          for (let k = 0; k < 300; k++) { const v = fn(); if (v) versions.add(v.q.en + '|' + v.answer); }
          versions.delete(q.q.en + '|' + q.answer);
          assert.ok(versions.size < 3, `template ${q.ref.oly} has ${versions.size} other versions but only ${i} were used`);
        });
      }
    });
  }
  t('similar selective uses the same template', () => {
    const q = globalThis.Selective.generateTest('short')[5], out = Sim.make(q, 2);
    assert.ok(out.length >= 1); out.forEach(x => assert.deepStrictEqual(x.ref.sel, q.ref.sel));
  });
  t('similar for old history items without ref', () => {
    const out = Sim.make({ topic: 'pct', type: 'input', q: { en: 'What is 20% of 50?', zh: '' } }, 3, { subject: 'maths', year: 7, diff: 2 });
    assert.strictEqual(out.length, 3); out.forEach(x => assert.strictEqual(x.ref.gen, 'pct'));
  });
  t('similar set is capped', () => {
    const qs = G.generateSet('maths', 6, 'mixed', 2, 10).map(q => ({ q, fb: {} }));
    assert.strictEqual(Sim.makeSet(qs, 10, 50).length, 50);
  });
}

/* v1.7.0: badges, suggested year, progress file (js/records.js) */
{
  const Rec = require('../js/records.js');
  const base = { subject: 'maths', year: 4, diff: 2, n: 10, correct: 10, firstTry: 10, seconds: 100 };
  t('badges: all three for a fast, first-try, perfect set', () => assert.deepStrictEqual(Rec.awardsFor(base), ['perfect', 'firstTry', 'speed']));
  t('badges: none below 100%', () => assert.deepStrictEqual(Rec.awardsFor({ ...base, correct: 9 }), []));
  t('badges: a second try loses First try only', () => assert.deepStrictEqual(Rec.awardsFor({ ...base, firstTry: 9 }), ['perfect', 'speed']));
  t('badges: speed limit per difficulty (Standard 30 s a question)', () => {
    assert.ok(Rec.awardsFor({ ...base, seconds: 300 }).includes('speed'));
    assert.ok(!Rec.awardsFor({ ...base, seconds: 301 }).includes('speed'));
    assert.ok(Rec.awardsFor({ ...base, diff: 4, seconds: 900 }).includes('speed'));
  });
  t('badges: fewer than 5 questions earn Perfect only', () => assert.deepStrictEqual(Rec.awardsFor({ ...base, n: 4, correct: 4, firstTry: 4, seconds: 4 }), ['perfect']));
  t('badges: timed papers earn Perfect only', () => assert.deepStrictEqual(Rec.awardsFor({ ...base, paper: 'sel:full' }), ['perfect']));
  t('badges: each year and difficulty is its own level', () => {
    const col = Rec.collection([
      { kind: 'perfect', subject: 'maths', year: 4, diff: 2 }, { kind: 'perfect', subject: 'maths', year: 4, diff: 2 },
      { kind: 'perfect', subject: 'maths', year: 5, diff: 2 }, { kind: 'speed', subject: 'maths', year: 4, diff: 3 },
      { subject: 'maths', topic: 'mixed', n: 5 }   // a v1.6 badge: no level recorded
    ]);
    assert.deepStrictEqual(col, { 'maths:4:2': { perfect: 2 }, 'maths:5:2': { perfect: 1 }, 'maths:4:3': { speed: 1 }, earlier: { perfect: 1 } });
  });

  const nov = new Date(2026, 10, 6);
  t('suggested year: school year entered this year', () => assert.strictEqual(Rec.suggestYear({ schoolYear: 4, schoolYearSet: 2026 }, nov), 4));
  t('suggested year: moves up each new calendar year', () => assert.strictEqual(Rec.suggestYear({ schoolYear: 4, schoolYearSet: 2026 }, new Date(2028, 1, 1)), 6));
  t('suggested year: school year wins over birth month', () => assert.strictEqual(Rec.suggestYear({ schoolYear: 3, schoolYearSet: 2026, dob: '2016-03' }, nov), 3));
  t('suggested year: born Jan-Jul starts Kindergarten the year they turn 5', () => {
    assert.strictEqual(Rec.suggestYear({ dob: '2016-03' }, nov), 5);   // K 2021, Year 5 in 2026
    assert.strictEqual(Rec.suggestYear({ dob: '2016-07' }, nov), 5);
  });
  t('suggested year: born Aug-Dec starts a year later', () => assert.strictEqual(Rec.suggestYear({ dob: '2016-08' }, nov), 4));
  t('suggested year: kept within Years 1-12, null when unknown', () => {
    assert.strictEqual(Rec.suggestYear({ dob: '2022-01' }, nov), 1);
    assert.strictEqual(Rec.suggestYear({ dob: '2000-01' }, nov), 12);
    assert.strictEqual(Rec.suggestYear({}, nov), null);
    assert.strictEqual(Rec.suggestYear({ dob: 'not a date' }, nov), null);
  });

  const student = { name: 'Lily, "Li" 李', schoolYear: 4, schoolYearSet: 2026, dob: '2016-03' };
  const history = [
    { date: 1762400000000, subject: 'maths', year: 4, topic: 'frac', diff: 2, n: 5, correct: 4, stars: 2, time: null, byTopic: { frac: [4, 5] },
      wrong: [{ topic: 'frac', type: 'input', q: { en: 'What is 1/2 + 1/4?\nSay "why", too.', zh: '1/2 + 1/4 等于多少？' }, answer: '3/4', given: ['=1+1'] }] },
    { date: 1762500000000, subject: 'sel', year: 6, topic: 'sel', diff: 2, n: 35, correct: 35, stars: 3, time: 1800000, byTopic: {}, wrong: [] }
  ];
  const badges = [{ date: 1762500000000, kind: 'perfect', subject: 'sel', paper: 'sel:full', n: 35 }, { date: 1762400000000, kind: 'speed', subject: 'maths', year: 4, diff: 2, n: 5 }];
  const csv = Rec.toCSV(student, history, badges);
  t('progress file: one header, one student, every session and badge', () => {
    const rows = Rec.parseCSV(csv);
    assert.strictEqual(rows[0].join(','), Rec.COLUMNS.join(','));
    assert.deepStrictEqual(rows.slice(1).map(r => r[0]), ['student', 'session', 'session', 'badge', 'badge']);
  });
  t('progress file: round trip restores everything exactly', () => {
    const back = Rec.fromCSV(csv);
    assert.deepStrictEqual(back.student, student);
    assert.deepStrictEqual(back.history, history);
    assert.deepStrictEqual(back.badges, badges);
    assert.strictEqual(back.skipped, 0);
  });
  t('progress file: readable columns for a spreadsheet', () => {
    const r = Rec.parseCSV(csv)[2];
    assert.deepStrictEqual(r.slice(0, 14), ['session', '2025-11-06T03:33:20.000Z', '', '', '', 'maths', '4', 'frac', '2', '5', '4', '2', '', '']);
  });
  t('progress file: a cell starting with = is not run as a spreadsheet formula', () => {
    const c = Rec.toCSV({ name: '=HYPERLINK("x")' }, [], []);
    assert.ok(c.includes(`"'=HYPERLINK(""x"")"`), c.split('\r\n')[1]);
    assert.strictEqual(Rec.fromCSV(c).student.name, '=HYPERLINK("x")');
  });
  t('progress file: a file from elsewhere is refused', () => {
    assert.throws(() => Rec.fromCSV('name,score\nA,1\n'), /format/);
    assert.throws(() => Rec.fromCSV(''), /format/);
    assert.throws(() => Rec.fromCSV('x'.repeat(2 * 1024 * 1024 + 1)), /size/);
  });
  t('progress file: impossible rows are skipped, not imported', () => {
    const bad = Rec.COLUMNS.join(',') + '\r\nsession,2026-01-01T00:00:00Z,,,,maths,4,frac,2,5,9,,,,\r\nsession,not a date,,,,maths,4,frac,2,5,4,,,,\r\nmystery,,,,,,,,,,,,,,\r\n';
    const r = Rec.fromCSV(bad);
    assert.strictEqual(r.history.length, 0);
    assert.strictEqual(r.skipped, 3);
  });
  t('progress file: rows typed in a spreadsheet (no data column) still import', () => {
    const typed = Rec.COLUMNS.join(',') + '\r\nsession,2026-03-01T09:00:00Z,,,,maths,5,dec,3,10,8,2,,,\r\nbadge,2026-03-01T09:00:00Z,,,,maths,5,dec,3,10,,,,firstTry,\r\n';
    const r = Rec.fromCSV(typed);
    assert.strictEqual(r.history.length, 1); assert.strictEqual(r.history[0].correct, 8); assert.strictEqual(r.history[0].diff, 3);
    assert.strictEqual(r.badges[0].kind, 'firstTry'); assert.strictEqual(Rec.levelOf(r.badges[0]), 'maths:5:3');
  });
  /* R1.1: a file the app accepts must not break a screen. Each field a screen reads is checked on import. */
  const withData = o => Rec.COLUMNS.join(',') + '\r\nsession,,,,,,,,,,,,,,' + '"' + JSON.stringify(o).replace(/"/g, '""') + '"\r\n';
  const ok = { date: 1762400000000, subject: 'maths', year: 4, topic: 'frac', diff: 2, n: 5, correct: 4 };
  t('import checks inside data: stars kept to 0-3, time and marks in range', () => {
    assert.strictEqual(Rec.fromCSV(withData({ ...ok, stars: 99 })).history[0].stars, undefined);
    assert.strictEqual(Rec.fromCSV(withData({ ...ok, stars: -1 })).history[0].stars, undefined);
    assert.strictEqual(Rec.fromCSV(withData({ ...ok, stars: 2 })).history[0].stars, 2);
    assert.strictEqual(Rec.fromCSV(withData({ ...ok, time: 'x' })).history[0].time, null);
    assert.strictEqual(Rec.fromCSV(withData({ ...ok, time: 5000 })).history[0].time, 5000);
    const m = Rec.fromCSV(withData({ ...ok, marks: 50, maxMarks: 10 })).history[0];
    assert.ok(!('marks' in m) && !('maxMarks' in m));
    assert.strictEqual(Rec.fromCSV(withData({ ...ok, n: 2.5, correct: 1 })).skipped, 1);
  });
  t('import checks inside data: questions the review cannot show are dropped', () => {
    const good = { topic: 'frac', type: 'input', q: { en: '1/2 + 1/4?' }, answer: '3/4', given: ['1'] };
    const mc = { topic: 'pat', type: 'mc', q: { en: 'Pick', zh: '选' }, choices: [{ en: 'a' }, { en: 'b' }], correct: 1, given: [0, 9, 'x'] };
    const wrong = [null, 5, { q: null }, { q: { en: 7 } }, { q: 'text' }, { type: 'mc', q: { en: 'x' }, choices: [{ en: 'a' }], correct: 3 },
      { type: 'input', q: { en: 'no answer' } }, good, mc];
    const s = Rec.fromCSV(withData({ ...ok, wrong })).history[0];
    assert.strictEqual(s.wrong.length, 2);
    assert.deepStrictEqual(s.wrong[0], good);
    assert.deepStrictEqual(s.wrong[1].given, [0]);        // a choice that does not exist is not "given"
  });
  t('import checks inside data: byTopic, refs and figures are well-formed', () => {
    const s = Rec.fromCSV(withData({ ...ok, byTopic: { frac: [4, 5], bad: [9, 5], worse: 'x', '__proto__': [1, 1] },
      wrong: [{ type: 'input', q: { en: 'q' }, answer: 1, ref: { oly: 'constructor', sel: ['__proto__', 'x'], gen: 'frac', year: 99 }, fig: { type: 'x" onload="y' } }] })).history[0];
    assert.deepStrictEqual(s.byTopic, { frac: [4, 5] });
    assert.deepStrictEqual(s.wrong[0].ref, { gen: 'frac' });
    assert.ok(!('fig' in s.wrong[0]));
    assert.deepStrictEqual(Rec.fromCSV(withData({ ...ok, byTopic: 'x' })).history[0].byTopic, { frac: [4, 5] });
  });
  t('similar: a ref naming no real template does not throw', () => {
    const Sim = require('../js/similar.js');
    const item = { topic: 'frac', type: 'input', q: { en: 'q' }, answer: '1', ref: { oly: 'constructor', sel: ['constructor', 'name'] } };
    assert.doesNotThrow(() => Sim.makeSet([{ q: item, fb: { subject: 'maths', year: 4, diff: 2 } }], 2, 10));
  });
  t('import merge: no duplicates, oldest first, capped', () => {
    const a = [{ date: 3, subject: 'm', n: 1, correct: 1 }, { date: 1, subject: 'm', n: 1, correct: 1 }];
    const m = Rec.merge(a, [{ date: 1, subject: 'm', n: 1, correct: 1 }, { date: 2, subject: 'm', n: 1, correct: 0 }], Rec.sessionKey, 2);
    assert.strictEqual(m.added, 1);
    assert.deepStrictEqual(m.list.map(x => x.date), [2, 3]);
  });
}

/* every text key is defined once per language (a second definition silently replaces the first) */
t('i18n: no key defined twice in a language', () => {
  const src = require('fs').readFileSync(require('path').join(__dirname, '../js/i18n.js'), 'utf8');
  const zhAt = src.indexOf('\n    zh: {');
  assert.ok(zhAt > 0, 'zh block not found');
  for (const [name, part] of [['en', src.slice(0, zhAt)], ['zh', src.slice(zhAt)]]) {
    const keys = [...part.matchAll(/^\s*'([\w.]+)':/gm)].map(m => m[1]);
    const dup = keys.filter((k, i) => keys.indexOf(k) !== i);
    assert.deepStrictEqual(dup, [], name + ' duplicates');
  }
});

console.log(`${pass} passed, ${fail} failed (${gen} generated questions checked)`);
process.exit(fail ? 1 : 0);
