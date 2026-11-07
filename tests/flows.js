/* Browser flow tests: what a student and a parent actually do, past the home screen.
   Each flow runs in a fresh browser profile with made-up data only, so it is safe against Test and Production too. */
const { launch } = require('./smoke.js');

const SETTINGS = 'sp.settings.p1';
const PIN = '2468';

/* initScript: code run in the page before the app (e.g. to make storage fail). */
async function freshPage(browser, site, seed, initScript) {
  const context = await browser.newContext({ viewport: { width: 375, height: 812 } });
  context.setDefaultTimeout(20000);   // no single step may wait longer than 20 s
  if (initScript) await context.addInitScript(initScript);
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('dialog', d => d.accept());   // confirm() dialogs: finish with unanswered questions, reset PIN
  if (seed) {
    // seed before the app first runs, as an earlier version would have left it: open a plain file on the same site first
    await page.goto(site + 'version.js');
    await page.evaluate(s => { for (const [k, v] of Object.entries(s)) localStorage.setItem(k, v); }, seed);
  }
  await page.goto(site, { waitUntil: 'load' });
  return { context, page, errors };
}

const settings = o => JSON.stringify(Object.assign({ subject: 'maths', year: 6, topic: 'mixed', diff: 2, count: 5, view: 'pages' }, o));
const visible = (page, sel) => page.locator(sel).first().isVisible();

async function typePin(page) {
  for (let k = 0; k < 2; k++) {               // create: PIN, then the same PIN again; enter: once (the second is skipped)
    if (!(await page.locator('#pinDialog').evaluate(d => d.open))) break;
    await page.fill('#pinInput', PIN);
    await page.click('#pinOk');
  }
}

async function run(site) {
  let pass = 0, fail = 0;
  const check = (name, ok, detail) => { ok ? pass++ : fail++; if (!ok) console.log('FAIL flows:', name, detail === undefined ? '' : detail); };
  // one flow failing (e.g. a step timing out) is one failure; the other flows still run
  const flow = async (name, fn) => { try { await fn(); } catch (e) { check(name + ': finished', false, e.message.split('\n')[0]); } };
  const browser = await launch();
  try {
    // 1. Practice: start a set of 5, finish with nothing answered, results and review appear.
    //    F.8: a worked method asks for the parent PIN and stays closed when the student cancels.
    await flow('practice', async () => {
      const { context, page, errors } = await freshPage(browser, site, { [SETTINGS]: settings() });
      await page.click('#startBtn');
      check('practice: quiz screen opens', await visible(page, '#screen-quiz'));
      await page.click('#finishBtn');
      check('practice: results screen opens', await visible(page, '#screen-results'));
      check('practice: score is out of 5', /\b5\b/.test(await page.textContent('#resScore')), await page.textContent('#resScore'));
      check('practice: review lists 5 questions', (await page.locator('#resList > li').count()) === 5);
      await page.locator('#resList details.method summary').first().click();
      check('F.8 method asks for the parent PIN', await page.locator('#pinDialog').evaluate(d => d.open));
      await page.click('#pinCancel');
      check('F.8 method stays closed without the PIN', !(await page.locator('#resList details.method').first().evaluate(d => d.open)));
      await page.locator('#resList details.method summary').nth(1).click();
      await typePin(page);
      // R1.2: the method the parent tapped opens right after the PIN, without tapping again (second item: not just the first)
      check('R1.2 tapped method opens after the PIN', await page.locator('#resList details.method').nth(1).evaluate(d => d.open));
      check('R1.2 only that method opens', !(await page.locator('#resList details.method').first().evaluate(d => d.open)));
      check('practice: no page errors', errors.length === 0, errors.join(' | '));
      await context.close();
    });

    // 2. Parent: create a PIN, open Parent settings; the old "students can open methods" switch is gone.
    await flow('parent', async () => {
      const { context, page } = await freshPage(browser, site);
      await page.click('#parentBtn');
      await typePin(page);
      check('parent: PIN opens Parent settings', await visible(page, '#screen-parent'));
      check('F.8 no switch that opens methods for students', (await page.locator('#methodsToggle').count()) === 0);
      await context.close();
    });

    // 3. F.1: "Forgot PIN" erases this app's data (progress, PIN, key) and keeps the language.
    await flow('F.1 forgot PIN', async () => {
      const { context, page } = await freshPage(browser, site, {
        'sp.pin': JSON.stringify({ salt: 'x', hash: 'y' }), 'sp.history.p1': '[{"n":1,"correct":1}]',
        'sp.ai': '{"provider":"claude","key":"made-up-test-key"}', 'sp.lang': 'en', 'other-app.data': 'keep'
      });
      await page.click('#parentBtn');
      check('F.1 Forgot PIN is offered', await visible(page, '#pinForgot'));
      await Promise.all([page.waitForEvent('load'), page.click('#pinForgot')]);
      const keys = await page.evaluate(() => Object.keys(localStorage).sort());
      check('F.1 reset erases progress, PIN and AI key', !keys.some(k => ['sp.pin', 'sp.history.p1', 'sp.ai'].includes(k)), keys.join(','));
      check('F.1 reset keeps the language and other apps\' keys', keys.includes('sp.lang') && keys.includes('other-app.data'), keys.join(','));
      await context.close();
    });

    // 4. F.2: keys from v1.6.3 ("mp.") move to "sp." once; the saved language still applies.
    await flow('F.2 old keys', async () => {
      const { context, page } = await freshPage(browser, site, {
        'mp.lang': 'zh', 'mp.settings.p1': settings({ year: 3 }),
        'mp.history.p1': '[{"n":5,"correct":5,"old":true}]', 'sp.history.p1': '[{"n":5,"correct":1,"new":true}]',
        'mp.other-app': 'not ours'
      });
      const store = await page.evaluate(() => Object.assign({}, localStorage));
      check('F.2 settings and language moved to "sp."', store['sp.settings.p1'] && store['sp.lang'] === 'zh' && !store['mp.settings.p1'] && !store['mp.lang'], Object.keys(store).join(','));
      check('F.2 moved language applies (Chinese)', (await page.evaluate(() => document.documentElement.lang)) === 'zh-CN');
      check('F.6 bottom navigation is named in Chinese', (await page.getAttribute('nav.bottom-nav', 'aria-label')) === '主导航');
      check('R1.1 when both exist, both are kept', /"new"/.test(store['sp.history.p1']) && /"old"/.test(store['mp.history.p1'] || ''), Object.keys(store).join(','));
      check('R1.1 another app\'s "mp." key is left alone', store['mp.other-app'] === 'not ours');
      // R1.1: the move happens once; an old key written later (e.g. by a v1.6.3 tab still open) is not moved or deleted
      await page.evaluate(() => localStorage.setItem('mp.badges.p1', '["late"]'));
      await page.reload({ waitUntil: 'load' });
      const later = await page.evaluate(() => [localStorage.getItem('mp.badges.p1'), localStorage.getItem('sp.badges.p1')]);
      check('R1.1 the move runs once only', later[0] === '["late"]' && later[1] === null, JSON.stringify(later));
      await context.close();
    });

    // R1.3 (F.9): when the browser refuses every save, the app keeps working and says so once, not on every save.
    await flow('R1.3 storage full', async () => {
      const failing = () => { Storage.prototype.setItem = function () { throw new DOMException('quota', 'QuotaExceededError'); }; };
      const toastText = () => page.evaluate(() => { const b = document.querySelector('#toast'); return b.hidden ? '' : b.textContent; });
      const { context, page, errors } = await freshPage(browser, site, null, failing);
      await page.waitForTimeout(300);
      // the first failed save happens while the app starts (the student profile), so the message is there at once
      check('R1.3 "not saving" message appears', /not saving progress/.test(await toastText()), await toastText());
      await page.evaluate(() => { const b = document.querySelector('#toast'); b.hidden = true; b.textContent = ''; });
      await page.click('#startBtn');
      await page.click('#finishBtn');                 // saving the session fails again
      check('R1.3 results still appear when saving fails', await visible(page, '#screen-results'));
      await page.waitForTimeout(300);
      check('R1.3 the message is not repeated on later saves', !/not saving progress/.test(await toastText()), await toastText());
      check('R1.3 no page errors', errors.length === 0, errors.join(' | '));
      await context.close();
    });

    // 5. Language switch keeps a typed answer (pages view shows 5 questions, so a typed one is almost always there).
    await flow('language switch', async () => {
      const { context, page } = await freshPage(browser, site, { [SETTINGS]: settings() });
      let typed = false;
      for (let k = 0; k < 4 && !typed; k++) {
        await page.click(k ? '#againBtn' : '#startBtn').catch(() => {});
        const box = page.locator('input.answer').first();
        if (await box.count()) {
          await box.fill('12.5');
          await page.click('#langBtn');
          check('language switch keeps the typed answer', (await page.locator('input.answer').first().inputValue()) === '12.5');
          typed = true;
        } else { await page.click('#finishBtn'); }
      }
      check('language switch: found a typed question', typed);
      await context.close();
    });

    // 6. F.13: the options of a multiple-choice question are one tab stop, and arrow keys move and choose.
    await flow('F.13 keyboard', async () => {
      const { context, page } = await freshPage(browser, site, { [SETTINGS]: settings({ subject: 'ga', year: 7, view: 'single' }) });
      await page.click('#startBtn');
      const group = page.locator('[role=radiogroup]').first();
      const stops = await group.locator('.choice').evaluateAll(bs => bs.map(b => b.tabIndex));
      check('F.13 one tab stop per option group', stops.filter(x => x === 0).length === 1, stops.join(','));
      await group.locator('.choice').first().focus();
      await page.keyboard.press('ArrowRight');
      const after = await page.locator('[role=radiogroup]').first().locator('.choice').evaluateAll(bs => bs.map(b => [b.getAttribute('aria-checked'), b === document.activeElement]));
      check('F.13 ArrowRight chooses and focuses the next option', after[1] && after[1][0] === 'true' && after[1][1], JSON.stringify(after));
      await context.close();
    });
    await flow('F.13 button size', async () => {
      const { context, page } = await freshPage(browser, site);
      const h = await page.evaluate(() => document.querySelector('#heroStart').getBoundingClientRect().height);
      check('F.13 Get started button is at least 44 px tall', h >= 44, h);
      await context.close();
    });

    // v1.7.0: the answer hint sits behind an info icon: hidden until hover, focus or tap
    await flow('v1.7 info tip', async () => {
      const { context, page } = await freshPage(browser, site, { [SETTINGS]: settings() });
      await page.click('#startBtn');
      const wrap = page.locator('#qList .info').first(), tip = wrap.locator('.tip');
      check('v1.7 hint is not shown as a line of text', !(await page.locator('#qList p').filter({ hasText: 'Fractions like' }).count()));
      check('v1.7 hint hidden until asked', (await tip.evaluate(e => getComputedStyle(e).visibility)) === 'hidden');
      await wrap.locator('.info-btn').hover();
      check('v1.7 hint shows on hover', (await tip.evaluate(e => getComputedStyle(e).visibility)) === 'visible');
      check('v1.7 hint text', /3\/4/.test(await tip.textContent()), await tip.textContent());
      await page.mouse.move(5, 5);
      await wrap.locator('.info-btn').click();
      check('v1.7 hint shows on tap', (await wrap.getAttribute('class')).includes('open') && (await tip.evaluate(e => getComputedStyle(e).visibility)) === 'visible');
      const box = await tip.boundingBox();
      check('v1.7 hint stays on a 375 px screen', box && box.x >= 0 && box.x + box.width <= 375, JSON.stringify(box));
      await context.close();
    });

    // v1.7.0: a fast, all-correct, first-try set earns Perfect, First try and Speed at its own level
    await flow('v1.7 badges earned', async () => {
      const { context, page } = await freshPage(browser, site, { [SETTINGS]: settings({ year: 4, diff: 1 }) });
      await page.click('#startBtn');
      const answers = await page.evaluate(() => (window.__testAnswers ? window.__testAnswers() : null));
      if (!answers) { console.log('  (flows: badge flow skipped: no test hook on a Production host)'); await context.close(); return; }
      for (let i = 0; i < answers.length; i++) {
        const a = answers[i], card = page.locator('#qc' + i);
        if (a.type === 'mc') { await card.locator('.choice').nth(a.correct).click(); await page.locator('#qc' + i + ' button.btn.primary').click(); }
        else { await page.fill('#ans' + i, String(a.answer)); await page.press('#ans' + i, 'Enter'); }
      }
      await page.click('#finishBtn');
      const text = await page.textContent('#resBadgeText');
      check('v1.7 results show all three new badges', /Perfect/.test(text) && /First try/.test(text) && /Speed/.test(text), text);
      check('v1.7 results name the level', /Year 4/.test(text) && /Core/.test(text), text);
      await page.click('.tab[data-go="progress"]');
      const row = await page.locator('.badge-grid tr').nth(1).locator('td').evaluateAll(tds => tds.map(td => td.className));
      check('v1.7 Year 4 Core row has all three badges', row.join() === 'got,got,got', row.join());
      const other = await page.locator('.badge-grid tr').nth(2).locator('td.got').count();
      check('v1.7 other difficulties stay empty', other === 0, other);
      await context.close();
    });

    // v1.7.0: student details choose the year on Home
    await flow('v1.7 student details', async () => {
      const Rec = require('../js/records.js');
      const { context, page } = await freshPage(browser, site, { [SETTINGS]: settings({ year: 9 }) });
      await page.click('#profileBtn');
      await page.locator('#profileList .icon-btn').first().click();
      await page.selectOption('.profile-edit select', '5');
      await page.click('.profile-edit button[type=submit]');
      await page.click('#profileClose');
      check('v1.7 school year chooses the year on Home', (await page.inputValue('#yearSel')) === '5', await page.inputValue('#yearSel'));
      // a new student: the details open straight away; a birth month alone also chooses the year
      await page.click('#profileBtn');
      await page.fill('#profileNew', 'Kid');
      await page.click('#profileAddBtn');
      check('v1.7 details open for a new student', (await page.locator('.profile-edit').count()) === 1);
      await page.fill('.profile-edit input[type=month]', '2016-08');
      await page.click('.profile-edit button[type=submit]');
      await page.click('#profileClose');
      const want = String(Rec.suggestYear({ dob: '2016-08' }, new Date()));
      check('v1.7 birth month chooses the year on Home', (await page.inputValue('#yearSel')) === want, (await page.inputValue('#yearSel')) + ' want ' + want);
      await context.close();
    });

    // v1.7.0: export a student's progress to CSV, import it into another student; a wrong file is refused
    await flow('v1.7 CSV', async () => {
      const os = require('os'), fs = require('fs'), path = require('path');
      const t0 = Date.parse('2026-10-01T10:00:00Z');
      const { context, page } = await freshPage(browser, site, {
        'sp.profiles': JSON.stringify({ list: [{ id: 'p1', name: 'Ann', schoolYear: 4, schoolYearSet: new Date().getFullYear(), dob: '2016-03' }], active: 'p1' }),
        'sp.history.p1': JSON.stringify([
          { date: t0, subject: 'maths', year: 4, topic: 'frac', diff: 2, n: 5, correct: 5, stars: 3, byTopic: { frac: [5, 5] }, wrong: [] },
          { date: t0 + 864e5, subject: 'maths', year: 4, topic: 'dec', diff: 2, n: 5, correct: 3, stars: 1, byTopic: { dec: [3, 5] }, wrong: [] }]),
        'sp.badges.p1': JSON.stringify([{ date: t0, kind: 'perfect', subject: 'maths', year: 4, diff: 2, n: 5 }, { date: t0, kind: 'firstTry', subject: 'maths', year: 4, diff: 2, n: 5 }])
      });
      await page.click('#parentBtn');
      await typePin(page);
      const [dl] = await Promise.all([page.waitForEvent('download'), page.click('#csvExport')]);
      const file = path.join(os.tmpdir(), 'Student_Practice-tests', 'progress.csv');
      fs.mkdirSync(path.dirname(file), { recursive: true });
      await dl.saveAs(file);
      const lines = fs.readFileSync(file, 'utf8').replace(/^﻿/, '').trim().split(/\r\n/);
      check('v1.7 export: header, student, 2 sessions, 2 badges', lines.length === 6 && lines[0].startsWith('record,date,name') && lines.filter(l => l.startsWith('session,')).length === 2, lines.length);
      check('v1.7 export file name names the student', /^student-practice_Ann_\d{4}-\d{2}-\d{2}\.csv$/.test(dl.suggestedFilename()), dl.suggestedFilename());
      // a second student, then import Ann's file into it
      await page.click('#profileBtn');
      await page.fill('#profileNew', 'Copy');
      await page.click('#profileAddBtn');
      await page.locator('.profile-edit .btn.ghost').click();
      await page.click('#profileClose');
      await page.click('#parentBtn');
      await page.setInputFiles('#csvImport', file);
      await page.waitForTimeout(300);
      const p2 = await page.evaluate(() => ({ h: JSON.parse(localStorage.getItem('sp.history.p2') || '[]').length, b: JSON.parse(localStorage.getItem('sp.badges.p2') || '[]').length, pr: JSON.parse(localStorage.getItem('sp.profiles')).list.find(x => x.id === 'p2') }));
      check('v1.7 import adds the sessions and badges', p2.h === 2 && p2.b === 2, JSON.stringify(p2));
      check('v1.7 import fills missing details, keeps the name', p2.pr.name === 'Copy' && p2.pr.schoolYear === 4 && p2.pr.dob === '2016-03', JSON.stringify(p2.pr));
      await page.setInputFiles('#csvImport', file);   // the same file again adds nothing
      await page.waitForTimeout(300);
      const again = await page.evaluate(() => JSON.parse(localStorage.getItem('sp.history.p2')).length);
      check('v1.7 importing twice adds no duplicates', again === 2, again);
      const bad = path.join(path.dirname(file), 'not-progress.csv');
      fs.writeFileSync(bad, 'name,score\nA,1\n');
      await page.setInputFiles('#csvImport', bad);
      await page.waitForTimeout(300);
      check('v1.7 a wrong file is refused with a message', /not a Student Practice progress file/.test(await page.textContent('#toast')), await page.textContent('#toast'));
      await context.close();
    });

    // R1.1 (v1.7.0): a crafted progress file cannot break Progress; a bad record already stored hides only its own part
    await flow('R1.1 bad records', async () => {
      const os = require('os'), fs = require('fs'), path = require('path'), Rec = require('../js/records.js');
      const t0 = Date.parse('2026-10-01T10:00:00Z');
      const crafted = { date: t0, subject: 'maths', year: 4, topic: 'frac', diff: 2, n: 5, correct: 4, stars: 99, byTopic: { frac: [4, 5] }, wrong: [{ q: null }, { type: 'input', q: { en: 'Kept 1/2?' }, answer: '1/2', given: [] }] };
      const file = path.join(os.tmpdir(), 'Student_Practice-tests', 'crafted.csv');
      fs.mkdirSync(path.dirname(file), { recursive: true });
      fs.writeFileSync(file, Rec.COLUMNS.join(',') + '\r\nsession,,,,,,,,,,,,,,"' + JSON.stringify(crafted).replace(/"/g, '""') + '"\r\n');
      const { context, page, errors } = await freshPage(browser, site, { [SETTINGS]: settings() });
      await page.click('#parentBtn');
      await typePin(page);
      await page.setInputFiles('#csvImport', file);
      await page.waitForTimeout(300);
      const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('sp.history.p1') || '[]'));
      check('R1.1 import stores stars in range and only showable questions', stored.length === 1 && stored[0].stars === undefined && stored[0].wrong.length === 1, JSON.stringify(stored));
      await page.click('.tab[data-go="progress"]');
      check('R1.1 imported file: Progress lists the session', (await page.locator('#progBody ul.plain li').count()) >= 1);
      check('R1.1 imported file: the question to review shows', (await page.locator('#progBody ol.review > li').count()) === 1);
      check('R1.1 imported file: no page errors', errors.length === 0, errors.join(' | '));
      // records stored as they were before this fix: the screen still opens and Clear progress is there
      await page.evaluate(c => localStorage.setItem('sp.history.p1', JSON.stringify([c])), crafted);
      const logged = [];
      page.on('console', m => { if (m.type() === 'error') logged.push(m.text()); });
      await page.click('.tab[data-go="home"]');
      await page.click('.tab[data-go="progress"]');
      check('R1.1 stored bad record: Clear progress is there', (await page.locator('#clearProgress').count()) === 1);
      check('R1.1 stored bad record: the other parts still show', (await page.locator('#progBody .stats').count()) === 1 && (await page.locator('#progBody .badge-shelf').count()) === 1);
      check('R1.1 stored bad record: no uncaught page errors', errors.length === 0, errors.join(' | '));
      await page.click('#clearProgress');
      check('R1.1 Clear progress recovers', (await page.evaluate(() => localStorage.getItem('sp.history.p1'))) === null);
      await context.close();
    });

    // R1.2 (v1.7.0): a year picked by hand is kept when a new school year moves the suggestion; one that was the suggestion moves on
    await flow('R1.2 hand-picked year', async () => {
      const y = new Date().getFullYear();
      const profiles = JSON.stringify({ list: [{ id: 'p1', name: 'Ann', schoolYear: 5, schoolYearSet: y - 1 }], active: 'p1' });   // Year 6 now
      let { context, page } = await freshPage(browser, site, { 'sp.profiles': profiles, [SETTINGS]: settings({ year: 8, suggested: 5 }) });
      check('R1.2 hand-picked Year 8 stays in a new school year', (await page.inputValue('#yearSel')) === '8', await page.inputValue('#yearSel'));
      check('R1.2 the new suggestion is remembered', (await page.evaluate(k => JSON.parse(localStorage.getItem(k)).suggested, SETTINGS)) === 6);
      await context.close();
      ({ context, page } = await freshPage(browser, site, { 'sp.profiles': profiles, [SETTINGS]: settings({ year: 5, suggested: 5 }) }));
      check('R1.2 a year that was the suggestion moves up', (await page.inputValue('#yearSel')) === '6', await page.inputValue('#yearSel'));
      await context.close();
    });

    // R2.1 / R4.1 (v1.7.0): the student details only move the default year. A year picked by hand on Home is kept
    // whatever is edited (Terry's decision on R4.1); a Home year that was the suggestion follows the new one.
    await flow('R2.1 details save keeps a hand-picked year', async () => {
      const y = new Date().getFullYear();
      const profiles = JSON.stringify({ list: [{ id: 'p1', name: 'Ann', schoolYear: 5, schoolYearSet: y }], active: 'p1' });
      const { context, page } = await freshPage(browser, site, { 'sp.profiles': profiles, [SETTINGS]: settings({ year: 8, suggested: 5 }) });
      const editYear = async v => {
        await page.click('#profileBtn');
        await page.locator('#profileList .icon-btn').first().click();
        await page.selectOption('.profile-edit select', v);
        await page.click('.profile-edit button[type=submit]');
        await page.click('#profileClose');
      };
      check('R2.1 Home starts on the hand-picked Year 8', (await page.inputValue('#yearSel')) === '8', await page.inputValue('#yearSel'));
      await page.click('#profileBtn');
      await page.locator('#profileList .icon-btn').first().click();
      await page.fill('.profile-edit input[type=text]', 'Anna');
      await page.click('.profile-edit button[type=submit]');
      await page.click('#profileClose');
      check('R2.1 a name edit keeps Year 8', (await page.inputValue('#yearSel')) === '8', await page.inputValue('#yearSel'));
      await editYear('6');
      check('R4.1 a new school year keeps the hand-picked Year 8', (await page.inputValue('#yearSel')) === '8', await page.inputValue('#yearSel'));
      check('R4.1 the new suggestion is remembered', (await page.evaluate(k => JSON.parse(localStorage.getItem(k)).suggested, SETTINGS)) === 6);
      await context.close();
      {   // Home still on the suggestion: the default moves it
        const { context, page: p2 } = await freshPage(browser, site, { 'sp.profiles': profiles, [SETTINGS]: settings({ year: 5, suggested: 5 }) });
        await p2.click('#profileBtn');
        await p2.locator('#profileList .icon-btn').first().click();
        await p2.selectOption('.profile-edit select', '6');
        await p2.click('.profile-edit button[type=submit]');
        await p2.click('#profileClose');
        check('R4.1 a Home year that was the suggestion follows a new school year', (await p2.inputValue('#yearSel')) === '6', await p2.inputValue('#yearSel'));
        await context.close();
      }
    });

    // R3.1 / R4.1 (v1.7.0): a birth-month edit keeps a hand-picked year, even when it moves the suggestion
    await flow('R3.1 birth month and a hand-picked year', async () => {
      const Rec = require('../js/records.js'), y = new Date().getFullYear();
      const edit = async (page, month) => {
        await page.click('#profileBtn');
        await page.locator('#profileList .icon-btn').first().click();
        await page.fill('.profile-edit input[type=month]', month);
        await page.click('.profile-edit button[type=submit]');
        await page.click('#profileClose');
      };
      const stored = page => page.evaluate(k => JSON.parse(localStorage.getItem(k)).suggested, SETTINGS);
      // Hermes's case: school year 8 entered this year (it wins over the birth month), Home picked by hand: Year 10
      {
        const profiles = JSON.stringify({ list: [{ id: 'p1', name: 'Ann', schoolYear: 8, schoolYearSet: y }], active: 'p1' });
        const { context, page } = await freshPage(browser, site, { 'sp.profiles': profiles, [SETTINGS]: settings({ year: 10, suggested: 8 }) });
        check('R3.1 Home starts on the hand-picked Year 10', (await page.inputValue('#yearSel')) === '10', await page.inputValue('#yearSel'));
        await edit(page, '2015-03');
        check('R3.1 a birth month that does not move the suggestion keeps Year 10', (await page.inputValue('#yearSel')) === '10', await page.inputValue('#yearSel'));
        await context.close();
      }
      // no school year, so the suggestion comes from the birth month (R4.1, measured by Hermes)
      const from = Rec.suggestYear({ dob: '2016-03' }, new Date()), to = Rec.suggestYear({ dob: '2014-03' }, new Date());
      {
        const profiles = JSON.stringify({ list: [{ id: 'p1', name: 'Ben', dob: '2016-03' }], active: 'p1' });
        const { context, page } = await freshPage(browser, site, { 'sp.profiles': profiles, [SETTINGS]: settings({ year: 10, suggested: from }) });
        await edit(page, '2014-03');
        check('R4.1 a birth month that moves the suggestion keeps the hand-picked Year 10', (await page.inputValue('#yearSel')) === '10', await page.inputValue('#yearSel'));
        check('R4.1 and remembers the new suggestion', (await stored(page)) === to, String(await stored(page)) + ' want ' + to);
        await context.close();
      }
      {
        const profiles = JSON.stringify({ list: [{ id: 'p1', name: 'Ben', dob: '2016-03' }], active: 'p1' });
        const { context, page } = await freshPage(browser, site, { 'sp.profiles': profiles, [SETTINGS]: settings({ year: from, suggested: from }) });
        await edit(page, '2014-03');
        check('R4.1 a Home year that was the suggestion follows the birth month', (await page.inputValue('#yearSel')) === String(to), (await page.inputValue('#yearSel')) + ' want ' + to);
        await context.close();
      }
    });

    // R4.1 (v1.7.0): the birth month, read against today's date, suggests a school year in the editor; the parent decides
    await flow('R4.1 school year hint from the birth month', async () => {
      const Rec = require('../js/records.js'), y = new Date().getFullYear();
      const byAge = Rec.suggestYear({ dob: '2014-03' }, new Date()), set = byAge === 3 ? 4 : 3;
      const profiles = JSON.stringify({ list: [{ id: 'p1', name: 'Cal', schoolYear: set, schoolYearSet: y, dob: '2014-03' }], active: 'p1' });
      const { context, page, errors } = await freshPage(browser, site, { 'sp.profiles': profiles, [SETTINGS]: settings({ year: set, suggested: set }) });
      await page.click('#profileBtn');
      await page.locator('#profileList .icon-btn').first().click();
      const hint = page.locator('.profile-edit .profile-hint');
      check('R4.1 hint shows when the school year differs from the birth month', await hint.isVisible() && (await hint.textContent()).includes('Year ' + byAge), await hint.textContent());
      check('R4.1 the hint changes nothing by itself', (await page.inputValue('.profile-edit select')) === String(set));
      await hint.locator('button').click();
      check('R4.1 Use sets the school year field', (await page.inputValue('.profile-edit select')) === String(byAge), await page.inputValue('.profile-edit select'));
      check('R4.1 the hint hides once they match', !(await hint.isVisible()));
      await page.selectOption('.profile-edit select', String(set));
      check('R4.1 the parent can still choose another year', (await page.inputValue('.profile-edit select')) === String(set) && await hint.isVisible());
      await page.fill('.profile-edit input[type=month]', '');
      check('R4.1 no birth month, no hint', !(await hint.isVisible()));
      check('R4.1 hint: no page errors', !errors || errors.length === 0, (errors || []).join(' | '));
      await context.close();
    });

    await flow('R2 import and Progress', async () => {
      const os = require('os'), fs = require('fs'), path = require('path'), Rec = require('../js/records.js');
      const { context, page, errors } = await freshPage(browser, site, { [SETTINGS]: settings() });
      await page.click('.tab[data-go="progress"]');
      check('R2.4 no Clear progress with nothing to clear', (await page.locator('#clearProgress').count()) === 0);
      const file = path.join(os.tmpdir(), 'Student_Practice-tests', 'typed.csv');
      fs.mkdirSync(path.dirname(file), { recursive: true });
      const badge = o => 'badge,,,,,,,,,,,,,,"' + JSON.stringify(o).replace(/"/g, '""') + '"';
      fs.writeFileSync(file, [Rec.COLUMNS.join(','),
        'session,2026-03-01T09:00:00Z,,,,maths,5,dec,3,5,5,,,,',        // blank stars: worked out from 5/5
        'session,2026-03-02T09:00:00Z,,,,maths,5,dec,3,5,,,,,',         // blank correct: skipped
        'session,2026-03-03T09:00:00Z,,,,zzz,5,zzz,3,5,4,,,,',          // unknown subject: skipped
        'session,2026-03-04T09:00:00Z,,,,maths,5,zzz,3,5,4,,,,',        // unknown topic: mixed
        badge({ date: Date.parse('2026-03-01T09:00:00Z'), kind: 'perfect', subject: 'sel', paper: 'x' })   // unknown paper: skipped
      ].join('\r\n') + '\r\n');
      await page.click('#parentBtn');
      await typePin(page);
      page.once('dialog', d => { page.confirmText = d.message(); });   // freshPage's own handler accepts it
      await page.setInputFiles('#csvImport', file);
      await page.waitForTimeout(300);
      check('R2.5 the confirm says how many rows were left out', /3 row\(s\) could not be read/.test(page.confirmText || ''), page.confirmText);
      check('R2.5 the toast says it too', /Added 2 session\(s\).*3 row\(s\) could not be read/.test(await page.textContent('#toast')), await page.textContent('#toast'));
      const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('sp.history.p1') || '[]'));
      check('R2.2 blank stars not stored as 0', stored.length === 2 && !('stars' in stored[0]), JSON.stringify(stored));
      check('R2.3 unknown topic stored as mixed', stored[1] && stored[1].topic === 'mixed', JSON.stringify(stored[1]));
      await page.click('.tab[data-go="progress"]');
      const recent = await page.locator('#progBody ul.plain').first().textContent();
      check('R2.2 a 5/5 set shows three stars', /5\/5\s*★★★/.test(recent), recent);
      check('R2.3 no raw text keys on Progress', !/topic\.|subject\.|null/.test(await page.textContent('#progBody')), recent);
      check('R2.4 Clear progress shows once there is progress', (await page.locator('#clearProgress').count()) === 1);
      check('R2 no page errors', errors.length === 0, errors.join(' | '));
      await context.close();
    });
  } finally {
    await browser.close();
  }
  return { pass, fail };
}

module.exports = { run };
