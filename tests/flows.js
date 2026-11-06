/* Browser flow tests: what a student and a parent actually do, past the home screen.
   Each flow runs in a fresh browser profile with made-up data only, so it is safe against Test and Production too. */
const { launch } = require('./smoke.js');

const SETTINGS = 'sp.settings.p1';
const PIN = '2468';

async function freshPage(browser, site, seed) {
  const context = await browser.newContext({ viewport: { width: 375, height: 812 } });
  context.setDefaultTimeout(20000);   // no single step may wait longer than 20 s
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('dialog', d => d.accept());   // confirm() dialogs: finish with unanswered questions, reset PIN
  await page.goto(site, { waitUntil: 'load' });
  if (seed) {
    await page.evaluate(s => { for (const [k, v] of Object.entries(s)) localStorage.setItem(k, v); }, seed);
    await page.reload({ waitUntil: 'load' });
  }
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
      await page.locator('#resList details.method summary').first().click();
      await typePin(page);
      await page.locator('#resList details.method summary').first().click();
      check('F.8 method opens after the PIN', await page.locator('#resList details.method').first().evaluate(d => d.open));
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
      const { context, page } = await freshPage(browser, site, { 'mp.lang': 'zh', 'mp.settings.p1': settings({ year: 3 }) });
      const keys = await page.evaluate(() => Object.keys(localStorage));
      check('F.2 no "mp." keys left', !keys.some(k => k.startsWith('mp.')), keys.join(','));
      check('F.2 settings moved to "sp."', keys.includes('sp.settings.p1') && keys.includes('sp.lang'), keys.join(','));
      check('F.2 moved language applies (Chinese)', (await page.evaluate(() => document.documentElement.lang)) === 'zh-CN');
      check('F.6 bottom navigation is named in Chinese', (await page.getAttribute('nav.bottom-nav', 'aria-label')) === '主导航');
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
  } finally {
    await browser.close();
  }
  return { pass, fail };
}

module.exports = { run };
