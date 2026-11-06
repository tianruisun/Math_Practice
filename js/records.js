/* Student records without the screen: which badges a session earns, the year to suggest for a student, and the
   progress file (CSV) used to export and import a student's progress. Loaded by the page and by the Node tests. */
(function (root) {
  'use strict';

  /* ---------- badges ----------
     Each badge belongs to a level: subject + year + difficulty (timed papers: the paper). The same kind of badge at
     another level is a different badge to collect. */
  const KINDS = ['perfect', 'firstTry', 'speed'];
  const MIN_QUESTIONS = 5;                                  // first-try and speed need a real set, not 1 question
  const SPEED_SECONDS = { 1: 20, 2: 30, 3: 60, 4: 90 };     // per question, by difficulty (Core … Challenge)

  /* s: { subject, year, diff, paper?, n, correct, firstTry, seconds } → kinds earned, in KINDS order */
  function awardsFor(s) {
    if (!s.n || s.correct !== s.n) return [];
    const out = ['perfect'];
    const big = s.n >= MIN_QUESTIONS, timed = !!s.paper;
    if (!timed && big && s.firstTry === s.n) out.push('firstTry');
    if (!timed && big && s.seconds > 0 && s.seconds / s.n <= (SPEED_SECONDS[s.diff] || 30)) out.push('speed');
    return out;
  }
  /* The level a badge counts for. Badges from before v1.7.0 have no level: "earlier". */
  const levelOf = b => (b.paper ? 'paper:' + b.paper : b.year && b.diff ? [b.subject || 'maths', b.year, b.diff].join(':') : 'earlier');

  /* badges list → { level: { kind: count } } */
  function collection(badges) {
    const out = {};
    for (const b of badges || []) {
      const lv = levelOf(b), kind = b.kind || 'perfect';
      out[lv] = out[lv] || {};
      out[lv][kind] = (out[lv][kind] || 0) + 1;
    }
    return out;
  }

  /* ---------- suggested year ----------
     School year entered by the parent moves up by itself each new calendar year (NSW school years follow the calendar).
     Otherwise from the birth month: NSW children start Kindergarten in the year they turn 5 if born January–July,
     else the year after. Year 1 follows Kindergarten. Result 1–12, or null when nothing is known. */
  function suggestYear(profile, now) {
    const year = now.getFullYear();
    let y = null;
    if (profile && profile.schoolYear) y = profile.schoolYear + (year - (profile.schoolYearSet || year));
    else if (profile && /^\d{4}-\d{2}$/.test(profile.dob || '')) {
      const [by, bm] = profile.dob.split('-').map(Number);
      y = year - by - (bm <= 7 ? 5 : 6);
    }
    if (y === null || !Number.isFinite(y)) return null;
    return Math.max(1, Math.min(12, y));
  }

  /* ---------- progress file (CSV) ----------
     One row per record. "student" holds the details, "session" a finished set, "badge" an earned badge.
     The readable columns are for a spreadsheet; the last column, data, is the whole record as JSON so an import
     restores it exactly (including the questions to review). */
  const COLUMNS = ['record', 'date', 'name', 'school_year', 'birth_month', 'subject', 'year', 'topic', 'difficulty',
    'questions', 'correct', 'stars', 'seconds', 'badge', 'data'];
  const MAX_FILE = 2 * 1024 * 1024;

  const cell = v => {
    const s = v === undefined || v === null ? '' : String(v);
    // quote when needed; a leading = + - @ is prefixed so a spreadsheet does not run it as a formula
    const safe = /^[=+\-@]/.test(s) ? "'" + s : s;
    return /[",\r\n]/.test(safe) ? '"' + safe.replace(/"/g, '""') + '"' : safe;
  };
  const iso = ms => new Date(ms).toISOString();

  function toCSV(student, history, badges) {
    const rows = [COLUMNS];
    rows.push(['student', '', student.name || '', student.schoolYear || '', student.dob || '', '', '', '', '', '', '', '', '', '',
      JSON.stringify({ name: student.name || '', schoolYear: student.schoolYear || null, schoolYearSet: student.schoolYearSet || null, dob: student.dob || '' })]);
    for (const h of history || []) {
      rows.push(['session', iso(h.date), '', '', '', h.subject || '', h.year || '', h.topic || '', h.diff || '', h.n, h.correct,
        h.stars !== undefined ? h.stars : '', h.time ? Math.round(h.time / 1000) : '', '', JSON.stringify(h)]);
    }
    for (const b of badges || []) {
      rows.push(['badge', iso(b.date), '', '', '', b.subject || '', b.year || '', b.topic || '', b.diff || '', b.n || '', '', '', '',
        b.kind || 'perfect', JSON.stringify(b)]);
    }
    // the byte-order mark lets Excel open Chinese names correctly
    return '﻿' + rows.map(r => r.map(cell).join(',')).join('\r\n') + '\r\n';
  }

  /* RFC 4180 parser: quoted fields, doubled quotes, commas and line breaks inside quotes. */
  function parseCSV(text) {
    const rows = []; let row = [], f = '', q = false;
    const s = String(text).replace(/^﻿/, '');
    for (let i = 0; i < s.length; i++) {
      const c = s[i];
      if (q) {
        if (c === '"') { if (s[i + 1] === '"') { f += '"'; i++; } else q = false; }
        else f += c;
      } else if (c === '"') q = true;
      else if (c === ',') { row.push(f); f = ''; }
      else if (c === '\n' || c === '\r') { if (c === '\r' && s[i + 1] === '\n') i++; row.push(f); rows.push(row); row = []; f = ''; }
      else f += c;
    }
    if (f !== '' || row.length) { row.push(f); rows.push(row); }
    return rows.filter(r => r.length > 1 || r[0] !== '');
  }

  const num = (v, lo, hi) => { const n = Number(v); return Number.isFinite(n) && n >= lo && n <= hi ? n : null; };
  const str = (v, max) => (typeof v === 'string' ? v.slice(0, max) : '');
  const json = v => { try { const o = JSON.parse(v); return o && typeof o === 'object' && !Array.isArray(o) ? o : null; } catch (e) { return null; } };

  /* A session from a file, checked: numbers in range, a date, and text fields as text. Returns null if unusable. */
  function cleanSession(o, row) {
    const date = num(o.date, 0, 4102444800000) || Date.parse(row.date);
    const n = num(o.n !== undefined ? o.n : row.questions, 1, 200), correct = num(o.correct !== undefined ? o.correct : row.correct, 0, 200);
    if (!date || n === null || correct === null || correct > n) return null;
    const s = Object.assign({}, o, {
      date, n, correct, subject: str(o.subject || row.subject, 20) || 'maths', topic: str(o.topic || row.topic, 40) || 'mixed',
      year: num(o.year !== undefined ? o.year : row.year, 1, 14), diff: num(o.diff !== undefined ? o.diff : row.difficulty, 1, 4)
    });
    if (!Array.isArray(s.wrong)) s.wrong = [];
    if (!s.byTopic || typeof s.byTopic !== 'object') s.byTopic = { [s.topic]: [correct, n] };
    return s;
  }
  function cleanBadge(o, row) {
    const date = num(o.date, 0, 4102444800000) || Date.parse(row.date);
    if (!date) return null;
    const kind = KINDS.includes(o.kind || row.badge) ? (o.kind || row.badge) : 'perfect';
    const b = Object.assign({}, o, { date, kind, subject: str(o.subject || row.subject, 20) || 'maths' });
    // a timed-paper badge has no year or difficulty: only keep the ones that are there
    const year = num(o.year !== undefined ? o.year : row.year, 1, 14), diff = num(o.diff !== undefined ? o.diff : row.difficulty, 1, 4);
    if (year !== null) b.year = year; else delete b.year;
    if (diff !== null) b.diff = diff; else delete b.diff;
    if (b.paper !== undefined) b.paper = str(b.paper, 40);
    return b;
  }

  /* text → { student, history, badges, skipped } or throws Error('format') */
  function fromCSV(text) {
    if (String(text).length > MAX_FILE) throw new Error('size');
    const rows = parseCSV(text);
    if (!rows.length || rows[0].join(',') !== COLUMNS.join(',')) throw new Error('format');
    const out = { student: null, history: [], badges: [], skipped: 0 };
    for (const r of rows.slice(1)) {
      const row = {}; COLUMNS.forEach((c, i) => { row[c] = (r[i] || '').replace(/^'(?=[=+\-@])/, ''); });
      const o = json(row.data) || {};
      if (row.record === 'student') {
        out.student = { name: str(o.name || row.name, 20), schoolYear: num(o.schoolYear || row.school_year, 1, 12),
          schoolYearSet: num(o.schoolYearSet, 2000, 2100), dob: /^\d{4}-\d{2}$/.test(o.dob || row.birth_month) ? (o.dob || row.birth_month) : '' };
      } else if (row.record === 'session') { const s = cleanSession(o, row); s ? out.history.push(s) : out.skipped++; }
      else if (row.record === 'badge') { const b = cleanBadge(o, row); b ? out.badges.push(b) : out.skipped++; }
      else out.skipped++;
    }
    return out;
  }

  /* Adds imported records to existing ones without duplicates (same time and same counts = same record), oldest first. */
  function merge(existing, incoming, keyOf, cap) {
    const seen = new Set(existing.map(keyOf)), out = existing.slice();
    let added = 0;
    for (const x of incoming) { const k = keyOf(x); if (!seen.has(k)) { seen.add(k); out.push(x); added++; } }
    out.sort((a, b) => a.date - b.date);
    return { list: cap ? out.slice(-cap) : out, added };
  }
  const sessionKey = h => [h.date, h.subject, h.n, h.correct].join('|');
  const badgeKey = b => [b.date, b.kind || 'perfect', levelOf(b)].join('|');

  const api = { KINDS, MIN_QUESTIONS, SPEED_SECONDS, awardsFor, levelOf, collection, suggestYear, COLUMNS, toCSV, parseCSV, fromCSV, merge, sessionKey, badgeKey };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.Records = api;
})(typeof window !== 'undefined' ? window : globalThis);
