/* Runs every suite and prints a count per suite.
   npm test                                  local copy of this folder
   npm test -- --site=https://test.<project>.pages.dev   a live site (unit tests still run on the local code) */
const { spawnSync } = require('child_process');
const path = require('path');
const { serve } = require('./serve.js');
const smoke = require('./smoke.js');
const CONFIG = require('./config.js');

const ROOT = path.resolve(__dirname, '..');

function unitSuite() {
  if (!CONFIG.unit) return null;
  const out = spawnSync(process.execPath, [path.join(ROOT, CONFIG.unit)], { cwd: ROOT, encoding: 'utf8' });
  process.stdout.write(out.stdout.split('\n').filter(l => l.startsWith('FAIL')).join('\n'));
  const m = /(\d+) passed, (\d+) failed/.exec(out.stdout);
  if (!m) return { pass: 0, fail: 1, note: 'could not read the result: ' + (out.stderr || out.stdout).slice(0, 300) };
  return { pass: +m[1], fail: +m[2] + (out.status ? 1 : 0) };
}

(async () => {
  const arg = process.argv.find(a => a.startsWith('--site='));
  let server = null, site = arg && arg.slice(7);
  if (!site) { server = await serve(ROOT); site = `http://127.0.0.1:${server.address().port}/`; }
  const results = { unit: unitSuite() };
  try { results.smoke = await smoke.run(site, { local: !!server }); }
  catch (e) { results.smoke = { pass: 0, fail: 1, note: e.message.split('\n')[0] }; }
  if (server) server.close();

  console.log(`\nSite: ${site}`);
  let failed = 0;
  for (const [name, r] of Object.entries(results)) {
    if (!r) continue;
    failed += r.fail;
    console.log(`${name.padEnd(6)} ${r.pass} passed, ${r.fail} failed${r.note ? '  (' + r.note + ')' : ''}`);
  }
  process.exit(failed ? 1 : 0);
})();
