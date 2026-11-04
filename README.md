# Maths Practice · 数学练习 (Years 4–10)

A mobile-first, installable maths practice web app (PWA) for students in Years 4 to 10.
Plain HTML/CSS/JS – no frameworks, no build step, relative paths only – so it runs on GitHub Pages as-is.

## Features
- **Two subjects** (toggle on Home):
  - **Maths** – typed answers. Levels follow **China (人教版) and Singapore (MOE)** expectations for each year, which are noticeably harder than Australian/UK ones. 22 topics, including 简便计算 (clever calculation), 数论 (number theory), 找规律 (sequences), equations, simultaneous equations, quadratics, π = 3.14 circle/cylinder/cone work, and trigonometry.
  - **应用题 word problems**: classic types (和差, 和倍, 差倍, 鸡兔同笼, 植树, 年龄, 相遇/追及, 火车过桥, 工程, 盈亏, 浓度, 利润折扣, Singapore before/after fractions and transfer problems, equation and simultaneous-equation problems, quadratic area problems). About 1 in 3 questions in a Mixed maths set is a word problem; the worked solution shows the equation.
  - **General ability (综合能力)** – multiple choice: number series, letter series, codes, logical reasoning (ordering, calendars, truth-tellers, knights and knaves), symbol puzzles, visual patterns, spatial reasoning and counting. Puzzles avoid wordplay so both languages ask exactly the same question.
- **Four difficulty levels:** Core 基础 · Standard 提高 · Advanced 拓展 · Challenge 挑战 (competition style).
- **Screens:** Home (subject, year, topic or Mixed, difficulty, number of questions) → Quiz → Results, plus Progress and Parent settings.
- **Bilingual:** English and Simplified Chinese. All interface text is in `js/i18n.js`. The 中文/EN button switches instantly, without reloading or losing the current question, the typed answer or the selected option. The choice is remembered.
- **Answer checking** (`js/checker.js`): ignores spaces; accepts equivalent fractions (6/8 = 3/4), mixed numbers (1 1/2), `3分之2`, full-width (Chinese keyboard) digits, `x = 5`; allows a small tolerance for decimals (2/3 ≈ 0.67); accepts units if present (`24 cm²`, `24平方厘米`, `$12.50`, `72°`) but rejects the wrong unit.
- **Tries:** two tries for typed answers, one for multiple choice. The student only sees right/wrong.
- **Answers stay hidden from students.** Correct answers and worked solutions show only in parent mode (4-digit PIN, created the first time 🔒 Parent is tapped). The PIN is a child lock, not strong security.
- **Questions:** built-in offline generators, or **Claude** / **DeepSeek** with your own API key (Parent settings). The AI is told to use China/Singapore levels, to include word problems, and (for General ability) to write 4-option questions that translate faithfully. Every AI question is validated; if the AI fails or is offline, the built-in generator is used automatically.
- **Progress:** sessions, accuracy, accuracy by topic, recent sessions, and questions to review. Stored only in this browser.
- **PWA:** manifest, icons (incl. maskable and Apple touch icon), and a service worker with a cache version, so it works offline.

## Publish on GitHub Pages
1. Push to GitHub. In the repo: **Settings → Pages → Build and deployment → Deploy from a branch**, pick your branch and `/ (root)`.
2. Open `https://<user>.github.io/<repo>/`. On a phone use **Add to Home Screen** / **Install app**.
3. **After every change, bump `CACHE_VERSION` in `sw.js`** (e.g. `maths-v4` → `maths-v5`) so installed copies update. `publish.bat` does this for you on Windows. The app shows "A new version is ready – Reload" when an update arrives.

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
| `js/gen-core.js` | Shared helpers, topic registry, question sets |
| `js/gen-maths.js` | Maths topics (China/Singapore levels) |
| `js/gen-word.js` | 应用题 word problems |
| `js/gen-ga.js` | General ability (multiple choice) |
| `js/ai.js` | Claude / DeepSeek question generation (maths and general ability) and validation |
| `js/app.js` | Screens, state, parent mode, progress |
| `sw.js` | Service worker (bump `CACHE_VERSION` on release) |
| `tests/run.js` | `node tests/run.js` – checker tests, and every generated question checked against its own answer |
