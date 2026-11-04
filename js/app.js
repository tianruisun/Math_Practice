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
  const YEARS = Gen.YEARS;   // 1–12, 13 = Year 12 Extension 1 (3U), 14 = Year 12 Extension 2 (4U)
  const yearLabel = y => (y >= 11 ? t('year.' + y) : t('home.yearN', { n: y }));
  const schoolOf = y => (y <= 6 ? 'primary' : 'high');
  const COUNTS = [5, 10, 15, 20];
  const defaults = { subject: 'maths', year: 6, topic: 'mixed', diff: 2, count: 10, selLen: 'full', view: 'single' };
  const SUBJECTS = ['maths', 'ga', 'sel'];
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

  /* fill a <select> (combo box) and keep the current value */
  function combo(sel, options, value, onChange) {
    sel.innerHTML = '';
    options.forEach(([v, label]) => { const o = el('option', '', label); o.value = String(v); sel.append(o); });
    sel.value = String(value);
    if (sel.value !== String(value) && options.length) sel.value = String(options[0][0]);
    sel.onchange = () => onChange(sel.value);
  }

  function appendFig(parent, q) {
    if (!q.fig || !window.Fig) return;
    const f = el('div', 'figwrap small-fig'); f.innerHTML = Fig.render(q.fig, lang()); parent.append(f);
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
    if (!YEARS.includes(st.year)) st.year = 6;
    if (st.topic !== 'mixed' && !Gen.topicsFor(st.subject, st.year).includes(st.topic)) st.topic = 'mixed';
    chips($('#subjectChips'), 'subject', SUBJECTS.map(s => [s, t('subject.' + s)]), st.subject, v => { st.subject = v; st.topic = 'mixed'; saveSettings(); renderHome(); });
    $('#subjectNote').textContent = t(st.subject === 'ga' ? 'home.gaNote' : st.subject === 'sel' ? 'home.selNote' : 'home.levelNote');
    const isSel = st.subject === 'sel';
    $('#practiceOptions').hidden = isSel;
    $('#selOptions').hidden = !isSel;
    if (!['full', 'short'].includes(st.selLen)) st.selLen = 'full';
    combo($('#selLenSel'), ['full', 'short'].map(k => [k, t('sel.len.' + k)]), st.selLen, v => { st.selLen = v; saveSettings(); });
    $('#startBtn').textContent = t(isSel ? 'sel.start' : 'home.start');
    if (!YEARS.includes(st.year)) st.year = 6;
    const school = schoolOf(st.year);
    combo($('#schoolSel'), ['primary', 'high'].map(k => [k, t('school.' + k)]), school, v => {
      st.year = v === 'primary' ? Math.min(st.year, 6) : Math.max(st.year, 7); saveSettings(); renderHome();
    });
    combo($('#yearSel'), (school === 'primary' ? Gen.PRIMARY : Gen.HIGH).map(y => [y, yearLabel(y)]), st.year, v => { st.year = +v; saveSettings(); renderHome(); });
    combo($('#topicSel'), topicOptions(st.subject, st.year), st.topic, v => { st.topic = v; saveSettings(); });
    combo($('#diffSel'), [1, 2, 3, 4].map(d => [d, t('diff.' + d)]), st.diff, v => { st.diff = +v; saveSettings(); });
    combo($('#countSel'), COUNTS.map(n => [n, String(n)]), st.count, v => { st.count = +v; saveSettings(); });
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
    if (settings.subject === 'sel') return startTest(settings);
    S.loadingKey = 'loading.ai';
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
    S.quiz = {
      exam: false, questions, i: 0, page: 0, results: [],
      st: questions.map(() => ({ status: 'answering', tries: 0, given: [], sel: null, fbKey: '', draft: '' })),
      settings: Object.assign({ subject }, settings)
    };
    go('quiz');
    focusCardInput(0);
  }

  function renderLoading() {
    $('#loadingText').textContent = t(S.loadingKey || 'loading.ai', { name: S.loadingName });
  }

  /* ---------- QUIZ: question cards, one at a time or in pages ---------- */
  const PAGE = 5;
  const view = () => (S.settings.view === 'pages' ? 'pages' : 'single');
  const range = (a, b) => Array.from({ length: Math.max(0, b - a) }, (_, k) => a + k);
  const qText = q => q.q[lang()] || q.q.en;
  const doneCount = Q => (Q.exam ? Q.answers.filter(a => a !== null).length : Q.st.filter(x => x.status === 'done').length);

  function focusCardInput(i) {
    setTimeout(() => { const inp = document.querySelector(`#qc${i} input.answer`); if (inp && !inp.disabled) inp.focus({ preventScroll: true }); }, 60);
  }
  function scrollToCard(i) {
    const c = $('#qc' + i);
    if (c && c.scrollIntoView) c.scrollIntoView({ block: 'start', behavior: 'smooth' }); else window.scrollTo(0, 0);
  }

  function renderQuiz() {
    const Q = S.quiz; if (!Q) return go('home');
    const n = Q.questions.length, pages = Math.ceil(n / PAGE), v = view();
    if (Q.page >= pages) Q.page = pages - 1;
    const list = $('#qList'); list.innerHTML = '';
    const idx = v === 'single' ? [Q.i] : range(Q.page * PAGE, Math.min(n, (Q.page + 1) * PAGE));
    idx.forEach(i => list.append(cardEl(i)));
    renderChrome();
  }

  /* header, progress, navigation — everything except the cards themselves */
  function renderChrome() {
    const Q = S.quiz, n = Q.questions.length, pages = Math.ceil(n / PAGE), v = view(), done = doneCount(Q);
    $('#qProgress').textContent = v === 'single' ? t('quiz.progress', { i: Q.i + 1, n }) : t('view.pageOf', { p: Q.page + 1, n: pages });
    $('#qBar').style.width = (100 * done / n) + '%';
    $('#viewSingle').setAttribute('aria-pressed', String(v === 'single'));
    $('#viewPages').setAttribute('aria-pressed', String(v === 'pages'));
    $('#timer').hidden = !Q.exam;
    $('#pageNav').hidden = v !== 'pages';
    $('#prevPage').disabled = Q.page === 0;
    $('#nextPage').disabled = Q.page >= pages - 1;
    const showResultsBtn = !Q.exam && v === 'pages';
    $('#toResults').hidden = !showResultsBtn;
    $('#toResults').disabled = done < n;
    $('#answerAll').hidden = !showResultsBtn || done === n;
    $('#examNav').hidden = !Q.exam;
    if (Q.exam) {
      $('#examSingleNav').hidden = v !== 'single';
      $('#prevQ').disabled = Q.i === 0;
      $('#nextQ').disabled = Q.i === n - 1;
      $('#answeredCount').textContent = t('sel.answered', { a: done, n });
      const pal = $('#palette'); pal.innerHTML = '';
      const onScreen = v === 'single' ? [Q.i] : range(Q.page * PAGE, (Q.page + 1) * PAGE);
      Q.questions.forEach((_, k) => {
        const b = el('button', 'pal' + (Q.answers[k] !== null ? ' done' : '') + (onScreen.includes(k) ? ' current' : ''), String(k + 1));
        b.type = 'button';
        if (k === Q.i && v === 'single') b.setAttribute('aria-current', 'true');
        b.addEventListener('click', () => goToQuestion(k));
        pal.append(b);
      });
      tickTimer();
    }
  }

  function goToQuestion(k) {
    const Q = S.quiz;
    Q.i = k;
    if (view() === 'pages') { const p = Math.floor(k / PAGE); if (p !== Q.page) { Q.page = p; renderQuiz(); } scrollToCard(k); }
    else { renderQuiz(); window.scrollTo(0, 0); }
  }

  function refreshCard(i) {
    const old = $('#qc' + i);
    if (old) old.replaceWith(cardEl(i));
    renderChrome();
  }

  /* one question card */
  function cardEl(i) {
    const Q = S.quiz, q = Q.questions[i], st = Q.exam ? null : Q.st[i], v = view();
    const done = !Q.exam && st.status === 'done';
    const card = el('article', 'qcard' + (done ? (Q.results[i] && Q.results[i].ok ? ' is-ok' : ' is-bad') : ''));
    card.id = 'qc' + i;
    card.setAttribute('aria-labelledby', 'qt' + i);
    const head = el('div', 'qhead');
    head.append(el('span', 'qnum', String(i + 1)), el('span', 'badge', t('topic.' + q.topic)));
    const text = el('p', 'question', qText(q)); text.id = 'qt' + i;
    card.append(head, text);
    if (q.fig && window.Fig) { const f = el('div', 'figwrap'); f.innerHTML = Fig.render(q.fig, lang()); card.append(f); }
    if (!Q.exam && q.topic === 'word') card.append(el('p', 'tip small', t('quiz.wordTip')));

    if (q.type === 'mc') {
      const box = el('div', 'choices'); box.setAttribute('role', 'radiogroup'); box.setAttribute('aria-labelledby', 'qt' + i);
      const selected = Q.exam ? Q.answers[i] : st.sel;
      q.choices.forEach((c, k) => {
        const b = el('button', 'choice'); b.type = 'button';
        b.setAttribute('role', 'radio'); b.setAttribute('aria-checked', String(selected === k));
        b.disabled = done || (Q.exam && Q.finished);
        if (done && S.parent && k === q.correct) b.classList.add('is-correct');
        b.append(el('span', 'letter', 'ABCDE'[k]), el('span', 'ctext', c[lang()] || c.en));
        b.addEventListener('click', () => {
          if (Q.exam) { if (Q.finished) return; Q.answers[i] = k; refreshCard(i); return; }
          if (st.status === 'done') return;
          st.sel = k; st.fbKey = ''; refreshCard(i);
        });
        box.append(b);
      });
      card.append(box);
      if (!Q.exam && !done) {
        const chk = el('button', 'btn primary', t('quiz.check')); chk.type = 'button';
        chk.addEventListener('click', () => submitCard(i));
        card.append(chk);
      }
    } else {
      const form = el('form', 'answer-form'); form.noValidate = true; form.autocomplete = 'off';
      const lab = el('label', 'label', t('quiz.label')); lab.htmlFor = 'ans' + i;
      const inp = el('input', 'answer'); inp.id = 'ans' + i; inp.type = 'text';
      Object.assign(inp, { inputMode: 'text', autocomplete: 'off', spellcheck: false, placeholder: t('quiz.placeholder'), value: st.draft, disabled: done });
      inp.setAttribute('autocorrect', 'off'); inp.setAttribute('autocapitalize', 'off'); inp.setAttribute('enterkeyhint', 'done');
      inp.addEventListener('input', () => { st.draft = inp.value; });
      form.append(lab, inp);
      if (!done) {
        const keys = el('div', 'keys'); keys.setAttribute('role', 'group'); keys.setAttribute('aria-label', 'Extra keys');
        [['/', '/'], ['-', '−'], ['.', '.'], [' ', t('key.space')], ['back', '⌫']].forEach(([k, label]) => {
          const b = el('button', 'key', label); b.type = 'button';
          if (k === 'back') b.setAttribute('aria-label', 'Backspace');
          b.addEventListener('mousedown', e => e.preventDefault());   // keep the keyboard open / caret in place
          b.addEventListener('click', () => { insertKey(inp, k); st.draft = inp.value; });
          keys.append(b);
        });
        form.append(keys, el('p', 'muted small', t('quiz.hint')));
        const chk = el('button', 'btn primary', t('quiz.check')); chk.type = 'submit';
        form.append(chk);
      }
      form.addEventListener('submit', e => { e.preventDefault(); submitCard(i); });
      card.append(form);
    }

    if (!Q.exam) {
      const fb = el('p', 'feedback' + (st.fbKey ? (done && Q.results[i] && Q.results[i].ok ? ' ok' : ' bad') : ''), st.fbKey ? t(st.fbKey) : '');
      fb.setAttribute('role', 'status');
      card.append(fb);
      if (done && S.parent) card.append(el('p', 'parent-box', t('quiz.parentAnswer', { a: answerText(q) })));
      if (done && v === 'single') {
        const last = Q.st.every(x => x.status === 'done');
        const nx = el('button', 'btn primary next', t(last ? 'quiz.finish' : 'quiz.next')); nx.type = 'button';
        nx.addEventListener('click', nextSingle);
        card.append(nx);
      }
    }
    return card;
  }

  function submitCard(i) {
    const Q = S.quiz, q = Q.questions[i], st = Q.st[i];
    if (!Q || Q.exam || st.status === 'done') return;
    if (q.type === 'mc') {   // one try for multiple choice
      if (st.sel === null) { st.fbKey = 'quiz.pickFirst'; refreshCard(i); return; }
      const ok = st.sel === q.correct;
      Q.results[i] = { given: [st.sel], ok, tries: 1 };
      st.status = 'done'; st.fbKey = ok ? 'quiz.correct' : 'quiz.wrong';
    } else {
      const input = st.draft;
      const res = Checker.check(q, input);
      if (res.reason === 'empty' || res.reason === 'unreadable') {
        st.fbKey = res.reason === 'empty' ? 'quiz.empty' : 'quiz.unread';
        refreshCard(i); focusCardInput(i); return;
      }
      st.tries += 1;
      st.given = st.given.concat(input.trim());
      if (res.ok || st.tries >= 2) {
        Q.results[i] = { given: st.given, ok: res.ok, tries: st.tries };
        st.status = 'done';
        st.fbKey = res.ok ? (st.tries === 1 ? 'quiz.correct' : 'quiz.correct2') : 'quiz.wrong';
      } else {
        st.status = 'retry'; st.fbKey = 'quiz.retry';
        refreshCard(i);
        const inp = document.querySelector(`#qc${i} input.answer`); if (inp) { inp.focus(); inp.select(); }
        return;
      }
    }
    refreshCard(i);
    if (view() === 'single') { const nx = document.querySelector(`#qc${i} .next`); if (nx) nx.focus(); }
  }

  /* single view: go to the next unanswered question, or finish */
  function nextSingle() {
    const Q = S.quiz, n = Q.questions.length;
    for (let k = 1; k <= n; k++) {
      const j = (Q.i + k) % n;
      if (Q.st[j].status !== 'done') { Q.i = j; renderQuiz(); window.scrollTo(0, 0); focusCardInput(j); return; }
    }
    finishPractice();
  }
  function finishPractice() {
    const Q = S.quiz;
    if (!Q || Q.exam || Q.st.some(x => x.status !== 'done')) return;
    saveSession(); go('results');
  }

  function setView(v) {
    const Q = S.quiz, cur = view();
    if (v === cur) return;
    if (Q) { if (v === 'pages') Q.page = Math.floor(Q.i / PAGE); else Q.i = Q.page * PAGE; }
    S.settings.view = v; saveSettings();
    if (Q) { renderQuiz(); window.scrollTo(0, 0); }
  }

  function insertKey(a, k) {
    if (!a || a.disabled) return;
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

  /* ---------- SELECTIVE TEST (timed exam: 35 questions / 40 min, or 18 / 20) ---------- */
  let timerId = null;
  function stopTimer() { if (timerId) { clearInterval(timerId); timerId = null; } }
  const mmss = ms => { const sec = Math.max(0, Math.round(ms / 1000)); return Math.floor(sec / 60) + ':' + String(sec % 60).padStart(2, '0'); };

  async function startTest(settings) {
    const len = settings.selLen === 'short' ? 'short' : 'full', spec = len === 'short' ? Selective.SHORT : Selective.FULL;
    S.lastQuizSettings = Object.assign({}, settings);
    let questions = null;
    const ai = aiConfig();
    if (ai && navigator.onLine !== false) {
      S.loadingName = AI.PROVIDERS[ai.provider].name; S.loadingKey = 'loading.sel';
      go('loading');
      try { questions = await AI.generateSelective(ai, len); }
      catch (e) { console.warn('AI test failed:', e); toast(t('loading.fallback', { err: e.message || String(e) }), 7000); questions = null; }
      if (S.screen !== 'loading') return;
    } else if (ai) toast(t('offline'));
    // keep the paper's shape: easy → medium → hard, topping up any tier the AI fell short on
    const mix = Selective.MIX[spec.n], local = Selective.generateTest(len), out = [];
    [1, 2, 3].forEach((tier, k) => {
      const fromAi = (questions || []).filter(q => q.tier === tier).slice(0, mix[k]);
      out.push(...fromAi, ...local.filter(q => q.tier === tier).slice(0, mix[k] - fromAi.length));
    });
    S.quiz = {
      exam: true, questions: out, i: 0, page: 0, answers: Array(out.length).fill(null), results: [], finished: false,
      startedAt: Date.now(), limitMs: spec.minutes * 60000,
      settings: Object.assign({}, settings, { subject: 'sel', topic: len === 'short' ? 'selshort' : 'selfull' })
    };
    go('quiz');
    timerId = setInterval(tickTimer, 1000);
    tickTimer();
  }

  function tickTimer() {
    const Q = S.quiz; if (!Q || !Q.exam || Q.finished) return stopTimer();
    const left = Q.limitMs - (Date.now() - Q.startedAt), tm = $('#timer');
    tm.textContent = '⏱ ' + mmss(left);
    tm.setAttribute('aria-label', t('sel.timer') + ' ' + mmss(left));
    tm.classList.toggle('low', left < 5 * 60000);
    if (left <= 0) finishTest(true);
  }

  function finishTest(timeUp) {
    const Q = S.quiz; if (!Q || !Q.exam || Q.finished) return;
    Q.finished = true; stopTimer();
    Q.timeUsed = Math.min(Date.now() - Q.startedAt, Q.limitMs);
    Q.results = Q.questions.map((q, i) => ({ given: Q.answers[i] === null ? [] : [Q.answers[i]], ok: Q.answers[i] === q.correct, tries: 1 }));
    saveSession();
    go('results');
    if (timeUp) toast(t('sel.timeUp'), 6000);
  }

  /* ---------- PRINT (A4 worksheet, optional answer key on a separate page) ---------- */
  function printMeta(settings, questions) {
    const n = questions.length;
    if (settings.subject === 'sel') {
      const short = settings.selLen === 'short' || settings.topic === 'selshort', spec = short ? Selective.SHORT : Selective.FULL;
      return { title: `${t('sel.heading')} – ${t(short ? 'topic.selshort' : 'topic.selfull')}`, info: t('print.infoSel', { n, m: spec.minutes }) };
    }
    const subject = settings.subject || 'maths';
    return {
      title: `${t('subject.' + subject)} – ${t('topic.' + (settings.topic || 'mixed'))}`,
      info: t('print.infoPractice', { n, subject: t('subject.' + subject), y: yearLabel(settings.year), diff: t('diff.' + settings.diff) })
    };
  }

  function openPrint(questions, settings) {
    S.printJob = { questions, settings };
    $('#printAnswers').checked = false;
    window.I18N.applyStatic($('#printDlg'));
    $('#printDlg').showModal();
  }

  function buildPrint(job, withAnswers, withWorking) {
    const E = s => Fig.esc(s), lines = s => E(s).replace(/\n/g, '<br>');
    const { questions, settings } = job, meta = printMeta(settings, questions), n = questions.length;
    let h = `<header class="p-head"><div><p class="p-app">${E(t('app.title'))}</p><h1>${E(meta.title)}</h1></div>
      <div class="p-fields"><span>${E(t('print.name'))}: <i></i></span><span>${E(t('print.date'))}: <i class="short"></i></span><span>${E(t('print.score'))}: <i class="short"></i> / ${n}</span></div></header>
      <p class="p-info">${E(meta.info)}</p><ol class="p-qs">`;
    questions.forEach(q => {
      h += `<li class="p-q"><div class="p-text">${lines(qText(q))}</div>`;
      if (q.fig) h += Fig.render(q.fig, lang());
      if (q.type === 'mc') {
        const longOpt = q.choices.some(c => (c[lang()] || c.en).length > 18);
        h += `<ol class="p-opts${longOpt ? ' one-col' : ''}">${q.choices.map((c, k) => `<li><b>${'ABCDE'[k]}</b> ${E(c[lang()] || c.en)}</li>`).join('')}</ol>`;
      } else {
        h += `<p class="p-line">${E(t('print.answerLine'))}: <i></i></p>`;
      }
      h += '</li>';
    });
    h += '</ol>';
    if (withAnswers) {
      h += `<section class="p-key"><h2>${E(t('print.key'))} – ${E(meta.title)}</h2><p class="p-note">${E(t('print.forParents'))}</p>
        <table><thead><tr><th>${E(t('print.keyQ'))}</th><th>${E(t('print.keyA'))}</th>${withWorking ? `<th>${E(t('print.keyW'))}</th>` : ''}</tr></thead><tbody>`;
      questions.forEach((q, k) => {
        const sol = q.sol ? (q.sol[lang()] || q.sol.en) : '';
        h += `<tr><td>${k + 1}</td><td>${E(answerText(q))}</td>${withWorking ? `<td>${E(sol)}</td>` : ''}</tr>`;
      });
      h += '</tbody></table></section>';
    }
    $('#printArea').innerHTML = h;
  }

  async function doPrint(e) {
    e.preventDefault();
    const job = S.printJob; if (!job) return;
    const withAnswers = $('#printAnswers').checked, withWorking = $('#printWorking').checked;
    $('#printDlg').close();
    if (withAnswers && !S.parent && !(await unlockParent())) return;   // answers stay hidden from students
    buildPrint(job, withAnswers, withWorking);
    setTimeout(() => window.print(), 150);
  }

  function printFromHome() {
    const st = S.settings;
    if (st.subject === 'sel') {
      const len = st.selLen === 'short' ? 'short' : 'full';
      openPrint(Selective.generateTest(len), Object.assign({}, st, { topic: len === 'short' ? 'selshort' : 'selfull' }));
    } else {
      openPrint(Gen.generateSet(st.subject, st.year, st.topic, st.diff, st.count), Object.assign({}, st));
    }
  }

  function renderExamSummary(Q) {
    const rt = $('#resTime'), rc = $('#resCats');
    if (!Q.exam) { rt.hidden = true; rc.hidden = true; return; }
    const n = Q.questions.length, sec = lang() === 'zh' ? ' 秒' : ' s';
    rt.hidden = false;
    rt.textContent = t('res.time', { used: mmss(Q.timeUsed), limit: mmss(Q.limitMs), per: Math.round(Q.timeUsed / 1000 / n), target: Math.round(Q.limitMs / 1000 / n) + sec });
    const by = {};
    Q.questions.forEach((q, i) => { const b = by[q.topic] = by[q.topic] || [0, 0]; b[1]++; if (Q.results[i].ok) b[0]++; });
    rc.innerHTML = ''; rc.hidden = false;
    rc.append(el('h3', '', t('res.byCat')));
    Object.keys(by).forEach(k => {
      const p = Math.round(100 * by[k][0] / by[k][1]), row = el('div', 'tbar'), lbl = el('div', 'lbl');
      lbl.append(el('span', '', t('topic.' + k)), el('span', '', `${by[k][0]}/${by[k][1]}`));
      const track = el('div', 'track'), fill = el('div', 'fill ' + (p < 50 ? 'low' : p < 80 ? 'mid' : 'high'));
      fill.style.width = p + '%'; track.append(fill); row.append(lbl, track); rc.append(row);
    });
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
      topic: q.topic, type: q.type, q: q.q, fig: q.fig, answer: q.answer, choices: q.choices, correct: q.correct, sol: q.sol, given: (Q.results[i] && Q.results[i].given) || []
    })).filter(Boolean);
    const h = store.get(K.history, []);
    h.push({
      date: Date.now(), subject: Q.settings.subject, year: Q.settings.year, topic: Q.settings.topic, diff: Q.settings.diff,
      n: Q.questions.length, correct: Q.results.filter(r => r && r.ok).length, byTopic, wrong, time: Q.timeUsed || null
    });
    store.set(K.history, h.slice(-100));
  }

  /* ---------- RESULTS ---------- */
  function renderResults() {
    const Q = S.quiz; if (!Q) return go('home');
    const n = Q.questions.length, c = Q.results.filter(r => r && r.ok).length, pct = c / n;
    $('#resScore').textContent = t('res.score', { c, n });
    $('#resMsg').textContent = t(pct >= 0.85 ? 'res.msg.great' : pct >= 0.6 ? 'res.msg.good' : 'res.msg.keep');
    renderExamSummary(Q);
    $('#resLocked').hidden = S.parent;
    $('#unlockBtn').hidden = S.parent;
    const list = $('#resList'); list.innerHTML = '';
    Q.questions.forEach((q, i) => {
      const r = Q.results[i] || { given: [], ok: false, tries: 0 };
      const li = el('li', r.ok ? 'ok' : 'bad');
      const head = el('p', 'q');
      head.append(el('span', 'mark ' + (r.ok ? 'ok' : 'bad'), r.ok ? '✓ ' : '✗ '), document.createTextNode((i + 1) + '. ' + (q.q[lang()] || q.q.en)));
      li.append(head);
      appendFig(li, q);
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
      date: fmtDate(x.date), year: x.subject === 'sel' ? '⏱ ' + mmss(x.time || 0) : yearLabel(x.year), topic: t('subject.' + (x.subject || 'maths')) + ' – ' + t('topic.' + x.topic), c: x.correct, n: x.n
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
        appendFig(li, w);
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

    if (!S.parent) box.append(el('p', 'muted small', t('prog.parentOnly')));
    appendClearButton(box);
  }

  /* Clear progress: always visible, protected by the parent PIN */
  function appendClearButton(box) {
    const wrap = el('div', 'clear-row');
    const btn = el('button', 'btn secondary danger', '🗑 ' + t('prog.clear')); btn.type = 'button'; btn.id = 'clearProgress';
    btn.addEventListener('click', async () => {
      if (!S.parent && !(await unlockParent())) return;
      if (confirm(t('prog.resetConfirm'))) { store.del(K.history); toast(t('prog.clear') + ' ✓'); renderProgress(); }
    });
    wrap.append(btn);
    if (!S.parent) wrap.append(el('p', 'muted small center', t('prog.clearNote')));
    box.append(wrap);
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
    if (S.screen === 'quiz' && !confirm(t(S.quiz && S.quiz.exam ? 'sel.quitConfirm' : 'quiz.quitConfirm'))) return;
    if (S.screen === 'quiz') { stopTimer(); S.quiz = null; }
    go(b.dataset.go);
  }));
  $('#langBtn').addEventListener('click', () => {
    window.I18N.setLang(lang() === 'zh' ? 'en' : 'zh');
    render();   // instant: re-renders text only, the typed answer and quiz state are untouched
  });
  $('#parentBtn').addEventListener('click', async () => {
    if (S.screen === 'quiz') { await unlockParent(); return; }
    if (await unlockParent()) { draftProvider = null; delete $('#aiKey').dataset.touched; go('parent'); }
  });
  $('#startBtn').addEventListener('click', () => startQuiz(S.settings));
  $('#quitBtn').addEventListener('click', () => {
    if (confirm(t(S.quiz && S.quiz.exam ? 'sel.quitConfirm' : 'quiz.quitConfirm'))) { stopTimer(); S.quiz = null; go('home'); }
  });
  $('#prevQ').addEventListener('click', () => { const Q = S.quiz; if (Q && Q.i > 0) goToQuestion(Q.i - 1); });
  $('#nextQ').addEventListener('click', () => { const Q = S.quiz; if (Q && Q.i < Q.questions.length - 1) goToQuestion(Q.i + 1); });
  $('#prevPage').addEventListener('click', () => { const Q = S.quiz; if (Q && Q.page > 0) { Q.page -= 1; renderQuiz(); window.scrollTo(0, 0); } });
  $('#nextPage').addEventListener('click', () => { const Q = S.quiz; if (Q && (Q.page + 1) * PAGE < Q.questions.length) { Q.page += 1; renderQuiz(); window.scrollTo(0, 0); } });
  $('#toResults').addEventListener('click', finishPractice);
  $('#viewSingle').addEventListener('click', () => setView('single'));
  $('#viewPages').addEventListener('click', () => setView('pages'));
  $('#printQuiz').addEventListener('click', () => { const Q = S.quiz; if (Q) openPrint(Q.questions, Q.settings); });
  $('#printHome').addEventListener('click', printFromHome);
  $('#printResults').addEventListener('click', () => { const Q = S.quiz; if (Q) openPrint(Q.questions, Q.settings); });
  $('#printForm').addEventListener('submit', doPrint);
  $('#printCancel').addEventListener('click', () => $('#printDlg').close());
  $('#finishBtn').addEventListener('click', () => {
    const Q = S.quiz; if (!Q || !Q.exam) return;
    const left = Q.answers.filter(a => a === null).length;
    if (confirm(left ? t('sel.finishConfirm', { n: left }) : t('sel.finishConfirm0'))) finishTest(false);
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
    if (S.screen === 'quiz' && S.quiz && (S.quiz.exam ? !S.quiz.finished : S.quiz.st.some(x => x.status !== 'answering'))) { e.preventDefault(); e.returnValue = ''; }
  });

  registerSW();
  go('home');
})();
