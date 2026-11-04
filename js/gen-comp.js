/* Competition papers modelled on the Australian Mathematics Trust competitions.
   AMC: 30 questions — Q1–25 multiple choice (A–E), Q26–30 whole-number answers 0–999;
        Middle Primary (Years 3–4) and Upper Primary (Years 5–6): 60 minutes; Junior (7–8),
        Intermediate (9–10), Senior (11–12): 75 minutes. Marks: Q1–10 = 3, Q11–20 = 4, Q21–25 = 5, Q26–30 = 6–10.
   AIMO: 10 questions, whole-number answers 0–999, 4 hours, marks 2–5 (the real Q10 is a proof;
        here every question has a numeric answer so it can be marked automatically).
   Questions come from the topic generators (easy part), harder topic questions and the
   olympiad bank (middle), and the olympiad bank only (hard part). */
(function (root) {
  'use strict';
  const G = root.Gen || require('./gen-core.js');
  const { R, pick, shuffle, round } = G;

  const PAPERS = {
    amc_mp: { kind: 'amc', years: [3, 4], minutes: 60 },
    amc_up: { kind: 'amc', years: [5, 6], minutes: 60 },
    amc_j: { kind: 'amc', years: [7, 8], minutes: 75 },
    amc_i: { kind: 'amc', years: [9, 10], minutes: 75 },
    amc_s: { kind: 'amc', years: [11, 12], minutes: 75 },
    aimo: { kind: 'aimo', years: [9, 10], minutes: 240 }
  };
  const paperForYear = y => (y <= 4 ? 'amc_mp' : y <= 6 ? 'amc_up' : y <= 8 ? 'amc_j' : y <= 10 ? 'amc_i' : 'amc_s');

  /* paper layout: one entry per question → [section, marks]
     sections: E easy MC, M medium MC, H hard MC, N whole-number answer */
  function layout(paper, len) {
    if (PAPERS[paper].kind === 'aimo') {
      return len === 'short' ? [['N3', 2], ['N3', 3], ['N4', 4], ['N4', 4], ['N4', 5]]
        : [['N3', 2], ['N3', 2], ['N3', 3], ['N4', 3], ['N4', 3], ['N4', 4], ['N4', 4], ['N4', 4], ['N4', 5], ['N4', 5]];
    }
    if (len === 'short') return [...Array(5).fill(['E', 3]), ...Array(5).fill(['M', 4]), ['H', 5], ['H', 5], ['N4', 6], ['N4', 8], ['N4', 10]];
    return [...Array(10).fill(['E', 3]), ...Array(10).fill(['M', 4]), ...Array(5).fill(['H', 5]), ['N4', 6], ['N4', 7], ['N4', 8], ['N4', 9], ['N4', 10]];
  }

  /* ---------- turning a typed question into a 5-option multiple-choice question ---------- */
  const MINUS = '−';
  function toMC(q, tier) {
    if (!q) return null;
    if (q.type === 'mc') return q.choices.length === 5 ? q : null;                // competition papers always use A–E
    if (!Number.isFinite(q.value) || /\//.test(q.answer)) return null;            // fractions stay typed-only
    const v = q.value, dp = Math.min(2, (String(round(Math.abs(v), 6)).split('.')[1] || '').length);
    if (Math.abs(v * 10 ** dp - Math.round(v * 10 ** dp)) > 1e-9) return null;
    const m = String(q.answer).replace(MINUS, '-').match(/^(\$?)\s*(-?[\d.]+)\s*(.*)$/);
    if (!m) return null;
    const show = x => (x < 0 ? MINUS : '') + m[1] + (dp ? Math.abs(x).toFixed(dp) : String(Math.abs(Math.round(x)))) + (m[3] ? (/^[°%]/.test(m[3]) ? '' : ' ') + m[3] : '');
    const step = dp ? 10 ** -dp * (Math.abs(v) >= 1 ? 10 : 1) : Math.max(1, Math.round(Math.abs(v) / 10));
    const cands = shuffle([v + step, v - step, v * 2, v / 2, v + 2 * step, v - 2 * step, v + 1, v - 1, v * 1.5, v + 10, v * 3]);
    const wrong = [], seen = new Set([show(v)]);
    for (const c of cands) {
      const x = dp ? round(c, dp) : Math.round(c);
      if (v >= 0 && x < 0) continue;
      const s = show(x); if (seen.has(s)) continue;
      seen.add(s); wrong.push([x, s]); if (wrong.length === 4) break;
    }
    if (wrong.length < 4) return null;
    const opts = shuffle([[v, show(v)], ...wrong]).sort((a, b) => a[0] - b[0]);
    const both = s => ({ en: s, zh: s });
    return Object.assign({}, q, { type: 'mc', tier, choices: opts.map(o => both(o[1])), correct: opts.findIndex(o => o[1] === show(v)) });
  }

  const intOK = q => q && q.type !== 'mc' && Number.isInteger(q.value) && q.value >= 0 && q.value <= 999;

  /* one question for a section of a paper */
  function make(paper, section, year) {
    const O = root.Olympiad, S = root.Selective, P = PAPERS[paper];
    for (let tries = 0; tries < 40; tries++) {
      let q = null;
      if (section === 'E') {
        q = (paper === 'amc_up' && Math.random() < 0.4 && S) ? pick(S.T[1]).fn() : toMC(G.generate('maths', year, 'mixed', 2), 1);
      } else if (section === 'M') {
        const r = Math.random();
        if ((paper === 'amc_up' || paper === 'amc_mp') && r < 0.35 && S) q = pick(S.T[paper === 'amc_mp' ? 1 : 2]).fn();
        else if (r < 0.7) q = toMC(G.generate('maths', year, 'mixed', 3), 2);
        else q = toMC(O && O.generate(year, Math.random() < 0.5 ? 3 : 4), 2);
      } else if (section === 'H') {
        if (paper === 'amc_up' && Math.random() < 0.3 && S) q = pick(S.T[3]).fn();
        else q = toMC(O && O.generate(year, Math.random() < 0.5 ? 4 : 5), 3);
      } else {
        // whole-number answers: AIMO and the last AMC questions use the AMO-level bank
        const d = section === 'N3' ? 4 : 5, oy = P.kind === 'aimo' ? pick([8, 9, 10]) : year;
        q = O && O.generate(oy, d);
        if (!intOK(q)) q = null;
        if (q) q = Object.assign({}, q, { intAnswer: true });
      }
      if (q) { q.subject = 'comp'; return q; }
    }
    return null;
  }

  function buildPaper(paper, len) {
    const P = PAPERS[paper] || PAPERS.amc_j, lay = layout(paper, len), out = [], seen = new Set();
    lay.forEach(([section, marks], i) => {
      const year = P.years[i < lay.length / 2 ? 0 : 1];
      for (let k = 0; k < 15; k++) {
        const q = make(paper, section, year);
        if (!q) continue;
        const key = q.q.en + (q.fig ? JSON.stringify(q.fig) : '');
        if (seen.has(key)) continue;
        seen.add(key); out.push(Object.assign(q, { marks, section })); return;
      }
    });
    return out;
  }

  const minutes = (paper, len) => (len === 'short' ? Math.round(PAPERS[paper].minutes / 2) : PAPERS[paper].minutes);
  const totalMarks = qs => qs.reduce((s, q) => s + (q.marks || 0), 0);

  const api = { PAPERS, paperForYear, buildPaper, minutes, totalMarks, toMC, layout };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.Competition = api;
})(typeof window !== 'undefined' ? window : globalThis);
