# Student_Practice

Maths and reasoning practice PWA (Years 1–12, Extension 1 and 2) for students, in English and Simplified Chinese.

## Environments
- Production: https://student-practice.pages.dev   (branch main) (not live yet: waiting for Cloudflare setup)
- Test:       https://test.student-practice.pages.dev   (branch test) (not live yet: waiting for Cloudflare setup)
- Old address https://tianruisun.github.io/Student_Practice/ is GitHub Pages from `main`, until NEW_REPO_SETUP.md Part 3.

## Tech
- Plain HTML/CSS/JS, no build step. Cloudflare build settings: preset None, no build command, output `/`.
- Version lives in: `version.js` (also names the offline cache `maths-<version>`, and lists the Production hosts)

## Tests
- Run all: `npm test`
- Run against Test site: `npm test -- --site=https://test.student-practice.pages.dev`

## Project rules (override the master rules)
- Languages: English + Simplified Chinese. All interface text lives in `js/i18n.js`.
- Audience: school students, used on phones; parents use the PIN-protected Parent settings.
- Answers and worked solutions stay hidden from students unless parent mode allows them.
