# Maths Practice · 数学练习 (Years 4–10)

A mobile-first, installable maths practice web app (PWA) for students in Years 4 to 10.
Plain HTML/CSS/JS – no frameworks, no build step, relative paths only – so it runs on GitHub Pages as-is.

## Features
- **Screens:** Home (choose year, topic or Mixed, difficulty, number of questions) → Quiz → Results, plus Progress and Parent settings.
- **Bilingual:** English and Simplified Chinese. All interface text is in `js/i18n.js`. The 中文/EN button in the header switches instantly, without reloading or losing the current question or what has been typed. The choice is remembered.
- **Answer checking** (`js/checker.js`): ignores spaces; accepts equivalent fractions (6/8 = 3/4), mixed numbers (1 1/2), `3分之2`, full-width (Chinese keyboard) digits, `x = 5`; allows a small tolerance for decimals (2/3 ≈ 0.67); accepts units if present (`24 cm²`, `24平方厘米`, `$12.50`, `72°`) but rejects the wrong unit.
- **Two tries** per question; the student only sees right/wrong.
- **Answers stay hidden from students.** Correct answers and worked solutions show only in parent mode (4-digit PIN, created the first time 🔒 Parent is tapped). The PIN is a child lock, not strong security.
- **Questions:** a built-in offline generator covering 16 topics, scaled by year and difficulty. Or, in Parent settings, choose **Claude** or **DeepSeek** and paste your own API key: the AI writes the questions (in both languages, with worked solutions). Every AI question is validated; if the AI fails or is offline, the built-in generator is used automatically.
- **Progress:** sessions, accuracy, accuracy by topic, recent sessions, and questions to review. Stored only in this browser.
- **PWA:** manifest, icons (incl. maskable and Apple touch icon), and a service worker with a cache version, so it works offline.

## Publish on GitHub Pages
1. Push to GitHub. In the repo: **Settings → Pages → Build and deployment → Deploy from a branch**, pick your branch and `/ (root)`.
2. Open `https://<user>.github.io/<repo>/`. On a phone use **Add to Home Screen** / **Install app**.
3. **After every change, bump `CACHE_VERSION` in `sw.js`** (e.g. `maths-v3` → `maths-v4`) so installed copies update. `publish.bat` does this for you on Windows. The app shows "A new version is ready – Reload" when an update arrives.

## AI keys
- Claude: create a key at console.anthropic.com. Default model `claude-opus-5-5`; `claude-sonnet-5-5` and `claude-haiku-5-5` are cheaper/faster options in settings.
- DeepSeek: create a key at platform.deepseek.com (`deepseek-chat`).
- The key is saved only in this browser's local storage and sent only to the chosen provider. Anyone using this device's browser could find it, so use a key with a spending limit, ideally only on a family device.

## Files
| File | Purpose |
|---|---|
| `index.html` | Page shell and screens |
| `css/style.css` | Mobile-first, high-contrast styles, CJK-friendly font stack |
| `js/i18n.js` | All interface text (English + Simplified Chinese) |
| `js/checker.js` | Answer parsing and checking |
| `js/generator.js` | Built-in question generator |
| `js/ai.js` | Claude / DeepSeek question generation and validation |
| `js/app.js` | Screens, state, parent mode, progress |
| `sw.js` | Service worker (bump `CACHE_VERSION` on release) |
| `tests/run.js` | `node tests/run.js` – checker tests, and every generated question checked against its own answer |
