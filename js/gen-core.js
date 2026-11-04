/* Shared helpers + topic registry for the built-in question generators.
   Two subjects: 'maths' (typed answers) and 'ga' (General ability, multiple choice).
   Every question carries both languages, so the language toggle never loses it.

   Typed question:  { subject, topic, type:'input', q:{en,zh}, value, answer, unit, tol, sol:{en,zh} }
   Multiple choice: { subject, topic, type:'mc', q:{en,zh}, choices:[{en,zh}], correct, sol:{en,zh} }

   Levels are calibrated so Year N matches what a student in Grade N in China (人教版) or
   Primary/Secondary N in Singapore (MOE) is expected to handle. Difficulty 1–4:
   1 Core 基础 · 2 Standard 提高 · 3 Advanced 拓展 · 4 Challenge 挑战 (competition style). */
(function (root) {
  'use strict';

  const R = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a;
  const pick = a => a[R(0, a.length - 1)];
  const gcd = (a, b) => { a = Math.abs(a); b = Math.abs(b); while (b) [a, b] = [b, a % b]; return a; };
  const lcm = (a, b) => a / gcd(a, b) * b;
  const round = (n, dp = 6) => {
    if (/e/i.test(String(n))) return Number(n.toFixed(Math.min(dp, 20)));   // exponent form, e.g. 1.1e-7
    return Number(Math.round(Number(n + 'e' + dp)) + 'e-' + dp);
  };
  const MINUS = '−';
  const fmt = n => String(round(n, 6));
  const num = n => (n < 0 ? MINUS + fmt(-n) : fmt(n));
  const paren = n => (n < 0 ? '(' + num(n) + ')' : num(n));
  const sg = n => (n < 0 ? ` ${MINUS} ${fmt(-n)}` : ` + ${fmt(n)}`);       // " + 3" / " − 3"
  const coef = (a, v = 'x') => (a === 1 ? v : a === -1 ? MINUS + v : num(a) + v);
  function fracStr(n, d) {
    if (d < 0) { n = -n; d = -d; }
    const g = gcd(n, d) || 1; n /= g; d /= g;
    if (d === 1) return num(n);
    return (n < 0 ? MINUS : '') + Math.abs(n) + '/' + d;
  }
  function shuffle(a) { a = [...a]; for (let i = a.length - 1; i > 0; i--) { const j = R(0, i); [a[i], a[j]] = [a[j], a[i]]; } return a; }
  const both = s => ({ en: String(s), zh: String(s) });

  /* typed-answer question */
  function mk(o) {
    const unitSuffix = o.unit === '°' || o.unit === '%' ? o.unit : o.unit && o.unit !== '$' ? ' ' + o.unit : '';
    return {
      type: 'input', topic: o.topic, q: { en: o.en, zh: o.zh }, value: round(o.value, 9),
      answer: o.answer !== undefined ? o.answer : (o.unit === '$' ? '$' : '') + num(o.value) + unitSuffix,
      unit: o.unit || '', tol: o.tol, sol: { en: o.solEn || '', zh: o.solZh || o.solEn || '' }, source: 'local'
    };
  }

  /* multiple-choice question.
     correct: {en,zh} or string; wrong: array of {en,zh} or strings (duplicates/blank removed). 4 options. */
  function mc(o) {
    const norm = c => (typeof c === 'object' ? c : both(c));
    const right = norm(o.correct);
    const seen = new Set([right.en]);
    const wrong = [];
    for (const w of o.wrong.map(norm)) {
      if (!w.en || seen.has(w.en)) continue;
      seen.add(w.en); wrong.push(w);
      if (wrong.length === (o.options || 4) - 1) break;
    }
    // top up with near values when the answer is a number (optionally with a unit) or a single letter
    const want = (o.options || 4) - 1, m = right.en.match(/^(\u2212?-?\d+(?:\.\d+)?)(\D*)$/);
    for (let step = 1; wrong.length < want && step < 40; step++) {
      let cand = null;
      if (m) { const v = Number(m[1].replace('\u2212', '-')) + (step % 2 ? 1 : -1) * Math.ceil(step / 2); cand = num(v) + m[2]; }
      else if (/^[A-Z]$/.test(right.en)) cand = String.fromCharCode(65 + ((right.en.charCodeAt(0) - 65 + (step % 2 ? 1 : -1) * Math.ceil(step / 2)) % 26 + 26) % 26);
      if (cand === null) break;
      if (!seen.has(cand)) { seen.add(cand); wrong.push(both(cand)); }
    }
    if (wrong.length < 2) return null;            // caller retries
    const choices = shuffle([right, ...wrong]);
    return {
      type: 'mc', topic: o.topic, q: { en: o.en, zh: o.zh }, choices, correct: choices.indexOf(right),
      sol: { en: o.solEn || '', zh: o.solZh || o.solEn || '' }, source: 'local'
    };
  }

  /* numeric distractors near the correct value */
  function nearNums(v, spread, extra = []) {
    const out = [...extra];
    for (const d of shuffle([1, -1, 2, -2, spread, -spread, spread + 1, -(spread + 1), 3, -3])) out.push(v + d);
    return out.filter(x => Number.isFinite(x) && x !== v).map(x => num(round(x, 4)));
  }

  /* ---------- registry ---------- */
  const SUBJECTS = { maths: {}, ga: {} };   // subject -> topic -> { minYear, fn, weight }

  function register(subject, topic, minYear, fn, weight = 1) { SUBJECTS[subject][topic] = { minYear, fn, weight }; }
  function topicsFor(subject, y) {
    const s = SUBJECTS[subject] || {};
    return Object.keys(s).filter(k => s[k].minYear <= y);
  }
  function subjectOf(topic) { return Object.keys(SUBJECTS).find(s => SUBJECTS[s][topic]) || 'maths'; }

  function generate(subject, year, topic, diff) {
    const list = topicsFor(subject, year);
    const t = topic !== 'mixed' && list.includes(topic) ? topic : pick(list);
    for (let i = 0; i < 20; i++) {
      const q = SUBJECTS[subject][t].fn(year, diff);
      if (q) { q.topic = q.topic || t; q.subject = subject; q.year = year; q.diff = diff; return q; }
    }
    throw new Error('generator failed for ' + t);
  }

  /* n distinct questions. Mixed: spread topics evenly; in maths, about 1 in 3 is a word problem (应用题). */
  function generateSet(subject, year, topic, diff, n) {
    const out = [], seen = new Set();
    const all = topicsFor(subject, year);
    // Mixed: favour this year's content (topics introduced recently appear more often)
    const others = [];
    for (const k of all.filter(k => k !== 'word')) {
      const age = year - SUBJECTS[subject][k].minYear, w = subject === 'ga' ? 1 : age <= 2 ? 3 : age <= 4 ? 2 : 1;
      for (let i = 0; i < w; i++) others.push(k);
    }
    let order = shuffle(others), oi = 0;
    for (let tries = 0; out.length < n && tries < n * 60; tries++) {
      let tp = topic;
      if (topic === 'mixed') {
        if (subject === 'maths' && all.includes('word') && out.length % 3 === 1) tp = 'word';
        else { tp = order[oi % order.length]; oi++; if (oi % order.length === 0) order = shuffle(order); }
      }
      const q = generate(subject, year, tp, diff);
      if (seen.has(q.q.en)) continue;
      seen.add(q.q.en); out.push(q);
    }
    return out;
  }

  const api = {
    R, pick, gcd, lcm, round, MINUS, fmt, num, paren, sg, coef, fracStr, shuffle, both,
    mk, mc, nearNums, register, topicsFor, subjectOf, generate, generateSet, SUBJECTS
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.Gen = api;
})(typeof window !== 'undefined' ? window : globalThis);
