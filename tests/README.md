# Tests

One-time setup: `npm install`. The smoke suite uses the installed Google Chrome (or run `npx playwright install chromium` on a PC without Chrome).

| Command | What it runs |
|---|---|
| `npm test` | every suite against a local copy of this folder |
| `npm test -- --site=https://test.student-practice.pages.dev` | the smoke suite against the Test site (unit suite still runs on the local code) |
| `npm test -- --site=https://student-practice.pages.dev` | the same against Production |

Each run prints a count per suite and exits non-zero if anything failed.

| Suite | File | Covers |
|---|---|---|
| unit | `run.js` | answer checker; every generated question accepts its own answer; AI parsing; competition papers |
| kit | `kit.js` | the test kit: `serve.js` finds files with the folder written five ways, `../` cannot leave the folder, a folder with no `index.html` is refused |
| smoke | `smoke.js` | page loads with no console errors; fits a 375px phone; TEST badge shows `TEST v<version>` off Production and is absent on Production; offline cache is named after `version.js` |

Screenshots go to `<system temp>/Student_Practice-tests/`, never into the repo.
`serve.js` is a tiny static server for local runs. It accepts a folder written any way (`D:/x`, `D:\x`, relative) and stops at once
if the folder has no `index.html`. `config.js` holds what differs between repos.

Time limits: unit 5 min, smoke 3 min, any single browser step 20 s. A run that hits one reports `timed out` as a failure;
it never hangs. Scripts of your own that reuse `serve.js` or Playwright should set the same kind of limits.
