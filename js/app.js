/* Screens: home → (loading) → quiz → results; progress; parent settings.
   All visible text comes from I18N.t(); render functions can be re-run at any time
   (e.g. after a language switch) without touching what the student has typed. */
(function () {
  'use strict';

  const { t } = window.I18N;
  const $ = sel => document.querySelector(sel);
  const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text !== undefined) e.textContent = text; return e; };
  const lang = () => window.I18N.lang;

  /* ---------- storage (every access guarded: private mode etc.) ---------- */
  const store = {
    get(k, d) { try { const v = localStorage.getItem(k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* ignore */ } },
    del(k) { try { localStorage.removeItem(k); } catch (e) { /* ignore */ } }
  };
  const K = { settings: 'mp.settings', history: 'mp.history', pin: 'mp.pin', ai: 'mp.ai' };

  /* ---------- state ---------- */
  const YEARS = [4, 5, 6, 7, 8, 9, 10];
  const COUNTS = [5, 10, 15, 20];
  const defaults = { subject: 'maths', year: 6, topic: 'mixed', diff: 2, count: 10 };
  const SUBJECTS = ['maths', 'ga'];
  const S = {
    screen: 'home',
    settings: Object.assign({}, defaults, store.get(K.settings, {})),
    quiz: null,              // { questions, i, results:[{given:[], ok, tries}], tries, status, fbKey }
    parent: false,           // unlocked for this page session only
    loadingName: '',
    lastQuizSettings: null
  };

  /* ---------- navigation ---------- */
  function go(screen) {
    if (screen === 'parent' && !S.parent) return;
    S.screen = screen;
    document.querySelectorAll('.screen').forEach(s => { s.hidden = s.id !== 'screen-' + screen; });
    document.querySelectorAll('.tab').forEach(b => {
      const cur = b.dataset.go === screen || (b.dataset.go === 'home' && ['quiz', 'results', 'loading'].includes(screen));
      if (cur) b.setAttribute('aria-current', 'page'); else b.removeAttribute('aria-current');
    });
    render();
    window.scrollTo(0, 0);
  }

  function render() {
    window.I18N.applyStatic();
    const pb = $('#parentBtn');
    pb.setAttribute('aria-pressed', String(S.parent));
    $('#parentLabel').textContent = t(S.parent ? 'nav.parentOn' : 'nav.parent');
    $('#parentIcon').textContent = S.parent ? '🔓' : '🔒';
    ({ home: renderHome, loading: renderLoading, quiz: renderQuiz, results: renderResults, progress: renderProgress, parent: renderParent })[S.screen]();
  }

  /* ---------- HOME ---------- */
  function chips(container, name, options, value, onChange) {
    container.innerHTML = '';
    options.forEach(([v, label]) => {
      const lab = el('label', 'chip');
      const inp = el('input'); inp.type = 'radio'; inp.name = name; inp.value = String(v);
      inp.checked = String(v) === String(value);
      inp.addEventListener('change', () => onChange(v));
      lab.append(inp, el('span', '', label));
      container.append(lab);
    });
  }

  function topicOptions(subject, year) {
    return [['mixed', t('topic.mixed')], ...Gen.topicsFor(subject, year).map(k => [k, t('topic.' + k)])];
  }

  /* text of the correct answer / of what the student gave, in the current language */
  function answerText(q) {
    if (q.type === 'mc') { const c = q.choices[q.correct]; return 'ABCDE'[q.correct] + '. ' + (c[lang()] || c.en); }
    return q.answer;
  }
  function givenText(q, given) {
    if (!given || !given.length) return t('res.blank');
    if (q.type === 'mc') return given.map(i => { const c = q.choices[i]; return c ? 'ABCDE'[i] + '. ' + (c[lang()] || c.en) : ''; }).join(' → ');
    return given.join(' → ');
  }

  function saveSettings() { store.set(K.settings, S.settings); }

  function renderHome() {
    const st = S.settings;
    if (!SUBJECTS.includes(st.subject)) st.subject = 'maths';
    if (![1, 2, 3, 4].includes(st.diff)) st.diff = 2;
    if (st.topic !== 'mixed' && !Gen.topicsFor(st.subject, st.year).includes(st.topic)) st.topic = 'mixed';
    chips($('#subjectChips'), 'subject', SUBJECTS.map(s => [s, t('subject.' + s)]), st.subject, v => { st.subject = v; st.topic = 'mixed'; saveSettings(); renderHome(); });
    $('#subjectNote').textContent = t(st.subject === 'ga' ? 'home.gaNote' : 'home.levelNote');
    chips($('#yearChips'), 'year', YEARS.map(y => [y, String(y)]), st.year, v => { st.year = v; saveSettings(); renderHome(); });
    $('#yearChips').setAttribute('aria-label', t('home.year'));
    chips($('#topicChips'), 'topic', topicOptions(st.subject, st.year), st.topic, v => { st.topic = v; saveSettings(); });
    chips($('#diffChips'), 'diff', [1, 2, 3, 4].map(d => [d, t('diff.' + d)]), st.diff, v => { st.diff = v; saveSettings(); });
    chips($('#countChips'), 'count', COUNTS.map(n => [n, String(n)]), st.count, v => { st.count = v; saveSettings(); });
    const ai = aiConfig();
    $('#sourceLine').textContent = ai ? t('home.source.ai', { name: AI.PROVIDERS[ai.provider].name }) : t('home.source.local');
  }

  /* ---------- starting a quiz ---------- */
  function aiConfig() {
    const c = store.get(K.ai, null);
    return c && c.provider && c.provider !== 'local' && c.key ? c : null;
  }
  function topicNames(subject, year) { return Gen.topicsFor(subject, year).map(k => [k, window.I18N.STRINGS.en['topic.' + k]]); }

  async function startQuiz(settings) {
    const { year, topic, diff, count } = settings, subject = settings.subject || 'maths';
    S.lastQuizSettings = Object.assign({}, settings);
    let questions = null;
    const ai = aiConfig();
    if (ai) {
      if (navigator.onLine === false) {
        toast(t('offline'));
      } else {
        S.loadingName = AI.PROVIDERS[ai.provider].name;
        go('loading');
        try {
          questions = await AI.generateSet(ai, subject, year, topic, diff, count, topicNames(subject, year));
          if (questions.length < count) {
            questions = questions.concat(Gen.generateSet(subject, year, topic, diff, count - questions.length));
          }
        } catch (e) {
          console.warn('AI generation failed:', e);
          toast(t('loading.fallback', { err: e.message || String(e) }), 7000);
          questions = null;
        }
        if (S.screen !== 'loading') return; // user navigated away while waiting
      }
    }
    if (!questions) questions = Gen.generateSet(subject, year, topic, diff, count);
    S.quiz = { questions, i: 0, results: [], tries: 0, sel: null, status: 'answering', fbKey: '', settings: Object.assign({ subject }, settings) };
    $('#answer').value = '';
    go('quiz');
    focusAnswer();
  }

  function renderLoading() {
    $('#loadingText').textContent = t('loading.ai', { name: S.loadingName });
  }

  /* ---------- QUIZ ---------- */
  function focusAnswer() {
    const Q = S.quiz; if (Q && Q.questions[Q.i] && Q.questions[Q.i].type === 'mc') return;
    setTimeout(() => { const a = $('#answer'); if (!a.disabled) a.focus({ preventScroll: true }); }, 50);
  }

  function renderChoices(q, Q, done) {
    const box = $('#choices'); box.innerHTML = '';
    q.choices.forEach((c, i) => {
      const b = el('button', 'choice'); b.type = 'button';
      b.setAttribute('role', 'radio'); b.setAttribute('aria-checked', String(Q.sel === i));
      b.disabled = done;
      if (done && S.parent && i === q.correct) b.classList.add('is-correct');
      b.append(el('span', 'letter', 'ABCDE'[i]), el('span', '', c[lang()] || c.en));
      b.addEventListener('click', () => { if (Q.status === 'done') return; Q.sel = i; Q.fbKey = ''; renderQuiz(); });
      box.append(b);
    });
  }

  function renderQuiz() {
    const Q = S.quiz; if (!Q) return go('home');
    const q = Q.questions[Q.i];
    $('#qProgress').textContent = t('quiz.progress', { i: Q.i + 1, n: Q.questions.length });
    $('#qTopic').textContent = t('topic.' + q.topic);
    $('#qBar').style.width = (100 * Q.i / Q.questions.length) + '%';
    $('#qText').textContent = q.q[lang()] || q.q.en;
    $('#qTip').hidden = q.topic !== 'word';
    const isMc = q.type === 'mc';
    $('#choiceArea').hidden = !isMc;
    $('#inputArea').hidden = isMc;

    const fb = $('#feedback');
    fb.textContent = Q.fbKey ? t(Q.fbKey) : '';
    fb.className = 'feedback' + (Q.fbKey ? (Q.status === 'done' && Q.results[Q.i] && Q.results[Q.i].ok ? ' ok' : ' bad') : '');

    const done = Q.status === 'done';
    $('#answer').disabled = done;
    if (isMc) renderChoices(q, Q, done);
    document.querySelectorAll('.key').forEach(k => { k.disabled = done; });
    $('#checkBtn').hidden = done;
    $('#nextBtn').hidden = !done;
    $('#nextBtn').textContent = t(Q.i + 1 < Q.questions.length ? 'quiz.next' : 'quiz.finish');

    const pa = $('#parentAnswer');
    pa.hidden = !(S.parent && done);
    if (!pa.hidden) pa.textContent = t('quiz.parentAnswer', { a: answerText(q) });
  }

  function submitAnswer() {
    const Q = S.quiz; if (!Q || Q.status === 'done') return;
    const q = Q.questions[Q.i];
    if (q.type === 'mc') {   // one try for multiple choice
      if (Q.sel === null) { Q.fbKey = 'quiz.pickFirst'; renderQuiz(); return; }
      const ok = Q.sel === q.correct;
      Q.results[Q.i] = { given: [Q.sel], ok, tries: 1 };
      Q.status = 'done'; Q.fbKey = ok ? 'quiz.correct' : 'quiz.wrong';
      renderQuiz(); $('#nextBtn').focus(); return;
    }
    const input = $('#answer').value;
    const res = Checker.check(q, input);
    if (res.reason === 'empty' || res.reason === 'unreadable') {
      Q.fbKey = res.reason === 'empty' ? 'quiz.empty' : 'quiz.unread';
      Q.status = 'answering';
      renderQuiz(); focusAnswer(); return;
    }
    Q.tries += 1;
    Q.given = (Q.given || []).concat(input.trim());
    if (res.ok || Q.tries >= 2) {
      Q.results[Q.i] = { given: Q.given, ok: res.ok, tries: Q.tries };
      Q.status = 'done';
      Q.fbKey = res.ok ? (Q.tries === 1 ? 'quiz.correct' : 'quiz.correct2') : 'quiz.wrong';
      renderQuiz();
      $('#nextBtn').focus();
    } else {
      Q.status = 'retry';
      Q.fbKey = 'quiz.retry';
      renderQuiz();
      const a = $('#answer'); a.select(); focusAnswer();
    }
  }

  function nextQuestion() {
    const Q = S.quiz; if (!Q || Q.status !== 'done') return;
    if (Q.i + 1 >= Q.questions.length) { saveSession(); go('results'); return; }
    Q.i += 1; Q.tries = 0; Q.given = []; Q.sel = null; Q.status = 'answering'; Q.fbKey = '';
    $('#answer').value = '';
    renderQuiz();
    focusAnswer();
  }

  function insertKey(k) {
    const a = $('#answer'); if (a.disabled) return;
    const s = a.selectionStart ?? a.value.length, e = a.selectionEnd ?? a.value.length;
    if (k === 'back') {
      const from = s === e ? Math.max(0, s - 1) : s;
      a.value = a.value.slice(0, from) + a.value.slice(e);
      a.setSelectionRange(from, from);
    } else {
      a.value = a.value.slice(0, s) + k + a.value.slice(e);
      a.setSelectionRange(s + k.length, s + k.length);
    }
    a.focus();
  }

  /* ---------- history ---------- */
  function saveSession() {
    const Q = S.quiz;
    const byTopic = {};
    Q.questions.forEach((q, i) => {
      const b = byTopic[q.topic] = byTopic[q.topic] || [0, 0];
      b[1] += 1; if (Q.results[i] && Q.results[i].ok) b[0] += 1;
    });
    const wrong = Q.questions.map((q, i) => (Q.results[i] && Q.results[i].ok ? null : {
      topic: q.topic, type: q.type, q: q.q, answer: q.answer, choices: q.choices, correct: q.correct, sol: q.sol, given: (Q.results[i] && Q.results[i].given) || []
    })).filter(Boolean);
    const h = store.get(K.history, []);
    h.push({
      date: Date.now(), subject: Q.settings.subject, year: Q.settings.year, topic: Q.settings.topic, diff: Q.settings.diff,
      n: Q.questions.length, correct: Q.results.filter(r => r && r.ok).length, byTopic, wrong
    });
    store.set(K.history, h.slice(-100));
  }

  /* ---------- RESULTS ---------- */
  function renderResults() {
    const Q = S.quiz; if (!Q) return go('home');
    const n = Q.questions.length, c = Q.results.filter(r => r && r.ok).length, pct = c / n;
    $('#resScore').textContent = t('res.score', { c, n });
    $('#resMsg').textContent = t(pct >= 0.85 ? 'res.msg.great' : pct >= 0.6 ? 'res.msg.good' : 'res.msg.keep');
    $('#resLocked').hidden = S.parent;
    $('#unlockBtn').hidden = S.parent;
    const list = $('#resList'); list.innerHTML = '';
    Q.questions.forEach((q, i) => {
      const r = Q.results[i] || { given: [], ok: false, tries: 0 };
      const li = el('li', r.ok ? 'ok' : 'bad');
      const head = el('p', 'q');
      head.append(el('span', 'mark ' + (r.ok ? 'ok' : 'bad'), r.ok ? '✓ ' : '✗ '), document.createTextNode((i + 1) + '. ' + (q.q[lang()] || q.q.en)));
      li.append(head);
      li.append(el('p', 'muted', t('res.yours', { a: givenText(q, r.given) }) + (r.ok && r.tries === 2 ? ' ' + t('res.second') : '')));
      if (S.parent) {
        const p = el('p'); p.append(el('span', 'ans', t('res.answer', { a: answerText(q) }))); li.append(p);
        const sol = q.sol && (q.sol[lang()] || q.sol.en);
        if (sol) li.append(el('p', 'muted small', t('res.solution', { s: sol })));
      }
      list.append(li);
    });
  }

  /* ---------- PROGRESS ---------- */
  function renderProgress() {
    const box = $('#progBody'); box.innerHTML = '';
    const h = store.get(K.history, []);
    if (!h.length) { box.append(el('p', 'muted', t('prog.none'))); return; }
    const total = h.reduce((s, x) => s + x.n, 0), correct = h.reduce((s, x) => s + x.correct, 0);
    const stats = el('div', 'stats');
    [[h.length, 'prog.sessions'], [total, 'prog.questions'], [Math.round(100 * correct / total) + '%', 'prog.accuracy']].forEach(([v, k]) => {
      const d = el('div', 'stat'); d.append(el('b', '', String(v)), el('span', '', t(k))); stats.append(d);
    });
    box.append(stats);

    const by = {};
    h.forEach(x => { for (const k in x.byTopic) { const b = by[k] = by[k] || [0, 0]; b[0] += x.byTopic[k][0]; b[1] += x.byTopic[k][1]; } });
    box.append(el('h3', '', t('prog.byTopic')));
    Object.keys(by).sort((a, b) => by[a][0] / by[a][1] - by[b][0] / by[b][1]).forEach(k => {
      const p = Math.round(100 * by[k][0] / by[k][1]);
      const row = el('div', 'tbar');
      const lbl = el('div', 'lbl'); lbl.append(el('span', '', t('topic.' + k)), el('span', '', `${p}% (${by[k][0]}/${by[k][1]})`));
      const track = el('div', 'track'); const fill = el('div', 'fill ' + (p < 50 ? 'low' : p < 80 ? 'mid' : 'high')); fill.style.width = p + '%';
      track.append(fill); row.append(lbl, track); box.append(row);
    });

    box.append(el('h3', '', t('prog.recent')));
    const ul = el('ul', 'plain');
    const fmtDate = d => new Date(d).toLocaleDateString(lang() === 'zh' ? 'zh-CN' : 'en-AU', { day: 'numeric', month: 'short' });
    h.slice(-8).reverse().forEach(x => ul.append(el('li', '', t('prog.row', {
      date: fmtDate(x.date), year: t('home.yearN', { n: x.year }), topic: t('subject.' + (x.subject || 'maths')) + ' – ' + t('topic.' + x.topic), c: x.correct, n: x.n
    }))));
    box.append(ul);

    box.append(el('h3', '', t('prog.review')));
    const wrong = h.flatMap(x => x.wrong || []).slice(-15).reverse();
    if (!wrong.length) box.append(el('p', 'muted', t('prog.reviewNone')));
    else {
      const ol = el('ol', 'review');
      wrong.forEach(w => {
        const li = el('li', 'bad');
        li.append(el('p', 'q', w.q[lang()] || w.q.en));
        li.append(el('p', 'muted', t('res.yours', { a: givenText(w, w.given) })));
        if (S.parent) {
          const p = el('p'); p.append(el('span', 'ans', t('res.answer', { a: answerText(w) }))); li.append(p);
          const sol = w.sol && (w.sol[lang()] || w.sol.en);
          if (sol) li.append(el('p', 'muted small', t('res.solution', { s: sol })));
        }
        ol.append(li);
      });
      box.append(ol);
    }

    if (S.parent) {
      const reset = el('button', 'btn ghost', t('prog.reset')); reset.type = 'button';
      reset.addEventListener('click', () => { if (confirm(t('prog.resetConfirm'))) { store.del(K.history); renderProgress(); } });
      box.append(reset);
    } else {
      box.append(el('p', 'muted small', t('prog.parentOnly')));
    }
  }

  /* ---------- PARENT: PIN ---------- */
  async function hashPin(pin, salt) {
    const data = salt + ':' + pin;
    if (window.crypto && crypto.subtle && window.isSecureContext) {
      const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(data));
      return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
    }
    let h = 2166136261; for (let i = 0; i < data.length; i++) { h ^= data.charCodeAt(i); h = Math.imul(h, 16777619); }
    return 'f' + (h >>> 0).toString(16);
  }

  /* mode: 'unlock' (create if none) | 'change'. Resolves true when unlocked/changed. */
  function pinDialog(mode) {
    return new Promise(resolve => {
      const dlg = $('#pinDialog'), input = $('#pinInput'), msg = $('#pinMsg');
      let saved = store.get(K.pin, null);
      let step = !saved || mode === 'change' ? 'create' : 'enter';
      let first = '';
      const setStep = s => { step = s; $('#pinTitle').textContent = t(s === 'create' ? 'pin.create' : s === 'confirm' ? 'pin.confirm' : 'pin.enter'); input.value = ''; $('#pinForgot').hidden = s !== 'enter'; };
      const finish = v => { cleanup(); if (dlg.open) dlg.close(); resolve(v); };
      const onSubmit = async ev => {
        ev.preventDefault();
        const v = input.value.trim();
        if (!/^\d{4}$/.test(v)) { msg.textContent = t('pin.short'); return; }
        msg.textContent = '';
        if (step === 'enter') {
          if (await hashPin(v, saved.salt) === saved.hash) finish(true);
          else { msg.textContent = t('pin.bad'); input.value = ''; }
        } else if (step === 'create') { first = v; setStep('confirm'); }
        else if (v === first) {
          const salt = Math.random().toString(36).slice(2);
          store.set(K.pin, { salt, hash: await hashPin(v, salt) });
          finish(true);
        } else { msg.textContent = t('pin.mismatch'); first = ''; setStep('create'); }
        input.focus();
      };
      const onCancel = () => finish(false);
      const onForgot = () => {
        if (!confirm(t('pin.forgotConfirm'))) return;
        store.del(K.pin); store.del(K.ai); saved = null; msg.textContent = ''; setStep('create'); input.focus();
      };
      const onClose = () => finish(false);
      function cleanup() {
        $('#pinForm').removeEventListener('submit', onSubmit);
        $('#pinCancel').removeEventListener('click', onCancel);
        $('#pinForgot').removeEventListener('click', onForgot);
        dlg.removeEventListener('close', onClose);
      }
      $('#pinForm').addEventListener('submit', onSubmit);
      $('#pinCancel').addEventListener('click', onCancel);
      $('#pinForgot').addEventListener('click', onForgot);
      dlg.addEventListener('close', onClose);
      msg.textContent = '';
      setStep(step);
      window.I18N.applyStatic(dlg);
      dlg.showModal();
      input.focus();
    });
  }

  async function unlockParent() {
    if (S.parent) return true;
    if (await pinDialog('unlock')) { S.parent = true; render(); return true; }
    return false;
  }

  /* ---------- PARENT: settings ---------- */
  let draftProvider = null;
  function renderParent() {
    const cfg = store.get(K.ai, { provider: 'local', key: '', model: '' });
    if (draftProvider === null) draftProvider = cfg.provider || 'local';
    chips($('#providerChips'), 'provider', ['local', 'claude', 'deepseek'].map(p => [p, t('parent.provider.' + p)]), draftProvider, v => {
      draftProvider = v; $('#aiMsg').textContent = ''; renderParent();
    });
    const isAI = draftProvider !== 'local';
    $('#aiFields').hidden = !isAI;
    if (isAI) {
      const P = AI.PROVIDERS[draftProvider];
      const sel = $('#aiModel'); const keep = cfg.provider === draftProvider ? cfg.model : '';
      sel.innerHTML = '';
      P.models.forEach(m => { const o = el('option', '', m); o.value = m; sel.append(o); });
      sel.value = P.models.includes(keep) ? keep : P.defaultModel;
      if (!$('#aiKey').dataset.touched) $('#aiKey').value = cfg.provider === draftProvider ? (cfg.key || '') : '';
    }
  }
  function currentDraft() {
    return { provider: draftProvider, key: $('#aiKey').value.trim(), model: $('#aiModel').value };
  }

  /* ---------- toast & SW updates ---------- */
  let toastTimer;
  function toast(text, ms = 4500, action) {
    const box = $('#toast'); box.innerHTML = '';
    box.append(el('span', '', text));
    if (action) { const b = el('button', '', action.label); b.type = 'button'; b.addEventListener('click', action.run); box.append(b); }
    box.hidden = false;
    clearTimeout(toastTimer);
    if (ms) toastTimer = setTimeout(() => { box.hidden = true; }, ms);
  }

  function registerSW() {
    if (!('serviceWorker' in navigator)) return;
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./sw.js').then(reg => {
        reg.addEventListener('updatefound', () => {
          const nw = reg.installing;
          nw && nw.addEventListener('statechange', () => {
            if (nw.state === 'installed' && navigator.serviceWorker.controller) {
              toast(t('update.ready'), 0, { label: t('update.reload'), run: () => location.reload() });
            }
          });
        });
      }).catch(e => console.warn('SW registration failed', e));
    });
  }

  /* ---------- wire up ---------- */
  document.querySelectorAll('.tab').forEach(b => b.addEventListener('click', () => {
    if (S.screen === 'quiz' && !confirm(t('quiz.quitConfirm'))) return;
    if (S.screen === 'quiz') S.quiz = null;
    go(b.dataset.go);
  }));
  $('#langBtn').addEventListener('click', () => {
    window.I18N.setLang(lang() === 'zh' ? 'en' : 'zh');
    render();   // instant: re-renders text only, the typed answer and quiz state are untouched
  });
  $('#parentBtn').addEventListener('click', async () => {
    if (S.screen === 'quiz') { if (await unlockParent()) renderQuiz(); return; }
    if (await unlockParent()) { draftProvider = null; delete $('#aiKey').dataset.touched; go('parent'); }
  });
  $('#startBtn').addEventListener('click', () => startQuiz(S.settings));
  $('#answerForm').addEventListener('submit', e => { e.preventDefault(); submitAnswer(); });
  $('#nextBtn').addEventListener('click', nextQuestion);
  $('#quitBtn').addEventListener('click', () => { if (confirm(t('quiz.quitConfirm'))) { S.quiz = null; go('home'); } });
  document.querySelectorAll('.key').forEach(k => {
    k.addEventListener('mousedown', e => e.preventDefault()); // keep the keyboard open / caret in place
    k.addEventListener('click', () => insertKey(k.dataset.key));
  });
  $('#unlockBtn').addEventListener('click', unlockParent);
  $('#againBtn').addEventListener('click', () => startQuiz(S.lastQuizSettings || S.settings));
  $('#homeBtn').addEventListener('click', () => go('home'));
  $('#lockBtn').addEventListener('click', () => { S.parent = false; go('home'); });
  $('#changePin').addEventListener('click', async () => { if (await pinDialog('change')) toast(t('parent.saved')); });
  $('#aiKey').addEventListener('input', () => { $('#aiKey').dataset.touched = '1'; });
  $('#aiSave').addEventListener('click', () => {
    const d = currentDraft();
    store.set(K.ai, d.provider === 'local' ? { provider: 'local', key: '', model: '' } : d);
    $('#aiMsg').className = 'small ok';
    $('#aiMsg').textContent = t('parent.saved');
  });
  $('#aiTest').addEventListener('click', async () => {
    const d = currentDraft(), msg = $('#aiMsg'), btn = $('#aiTest');
    msg.className = 'small'; msg.textContent = t('parent.testing'); btn.disabled = true;
    try {
      const qs = await AI.generateSet(d, 'maths', 6, 'word', 2, 1, topicNames('maths', 6));
      msg.className = 'small ok';
      msg.textContent = t('parent.testOk') + ' “' + (qs[0].q[lang()] || qs[0].q.en) + '”';
    } catch (e) {
      msg.className = 'small bad';
      msg.textContent = t('parent.testBad', { err: e.message || String(e) });
    } finally { btn.disabled = false; }
  });
  window.addEventListener('beforeunload', e => {
    if (S.screen === 'quiz' && S.quiz && S.quiz.i > 0) { e.preventDefault(); e.returnValue = ''; }
  });

  registerSW();
  go('home');
})();
