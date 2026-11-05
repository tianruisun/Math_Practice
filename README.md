# Maths & Reasoning · 数学与思维 (Years 1–12, Extension 1 & 2)

A mobile-first, installable maths and reasoning practice web app (PWA) for students in Years 4 to 10.
Plain HTML/CSS/JS – no frameworks, no build step, relative paths only – so it runs on GitHub Pages as-is.

## Features
- **Two subjects** (toggle on Home):
  - **Maths** – typed answers. Levels follow **China (人教版) and Singapore (MOE)** expectations for each year, which are noticeably harder than Australian/UK ones. 22 topics, including 简便计算 (clever calculation), 数论 (number theory), 找规律 (sequences), equations, simultaneous equations, quadratics, π = 3.14 circle/cylinder/cone work, and trigonometry.
  - **应用题 word problems**: classic types (和差, 和倍, 差倍, 鸡兔同笼, 植树, 年龄, 相遇/追及, 火车过桥, 工程, 盈亏, 浓度, 利润折扣, Singapore before/after fractions and transfer problems, equation and simultaneous-equation problems, quadratic area problems). About 1 in 3 questions in a Mixed maths set is a word problem; the worked solution shows the equation.
  - **General ability (综合能力)** – multiple choice: number series, letter series, codes, logical reasoning (ordering, calendars, truth-tellers, knights and knaves), symbol puzzles, visual patterns, spatial reasoning and counting. Puzzles avoid wordplay so both languages ask exactly the same question.
- **Review with worked methods:** after a session (and under Progress → Review), every question has a **Show method** panel with the worked solution set out step by step. Parents can switch this off for students in Parent settings → Review, so that the method needs the PIN.
- **Practise similar questions:** tick ✓ any question answered incorrectly, choose how many similar questions to make for each one (1, 2, 3, 5 or 10), and start a reinforcement set. Each question remembers where it came from, so similar questions use the same problem type with new numbers: the same competition or Selective template, or the same topic generator, keeping the candidates that read most like the original. Sets are capped at 50 questions.
- **New look:** greeting header with the student's avatar, a hero banner, subject tiles with icons, a bottom navigation bar with a centre Start button, and a soft lavender and violet theme (Poppins font, dark mode included).
  - **Competition (数学竞赛)** – timed papers in the style of the Australian Mathematics Competition, one per division: Middle Primary (Years 3–4), Upper Primary (5–6), Junior (7–8), Intermediate (9–10), Senior (11–12). Each has **30 questions**: Q1–25 multiple choice A–E, Q26–30 whole-number answers 0–999. Primary papers take 60 minutes and secondary papers 75. Marks are 3/4/5 and then 6–10, for 135 in total. There is also an **AIMO-style olympiad paper**: 10 questions, whole-number answers, 4 hours, 35 marks. Half papers are available. Results show marks as well as the number correct.
  - **Selective test (选拔考试模拟)** – a timed practice paper in the style of the NSW Selective High School Placement Test – Mathematical Reasoning, modelled on the published practice tests: **35 questions in 40 minutes** (or a half test, 18 questions in 20 minutes), five options A–E, no calculator, easier → harder. Countdown timer, a grid to jump between questions, the ability to change answers, and automatic marking when time runs out. Results show the score, time used, time per question and a breakdown by area (number, measurement, space, statistics, problem solving). About 60 question types, randomised every time; questions that need a diagram in the real papers (nets, rotations, folding) are not included.
- **Charts and diagrams:** Selective-test questions include column graphs, line graphs, pictographs, scale dials, measuring jugs, clocks, spinners, labelled shapes, square-grid shapes and magic-square tables, drawn as crisp SVG with labels in both languages (`js/figures.js`).
- **Two views:** answer **one question at a time**, or switch to **Pages** to see five questions per screen (works for practice sets and the timed test).
- **Print on A4:** a Print button (on Home, in a quiz and on Results) lays the questions out as an A4 worksheet with name/date/score fields, figures and A–E options or answer lines. Optionally adds an **answer key with worked solutions on a separate page** (needs the parent PIN). Use the browser's print window to print or “Save as PDF”.
- **Modern look** with automatic dark mode.
- **Years 1–12, Extension 1 (3U) and Extension 2 (4U)**, chosen with two combo boxes: **School** (Primary / High school) and **Year**. Years 1–3 have counting, adding, times tables, shapes, telling the time (clock faces), money, simple fractions and picture graphs; Years 11–12 have functions, exponentials and logs, trigonometry, calculus, series and probability; 3U adds combinatorics, polynomials, vectors and inverse trig; 4U adds complex numbers, integration and mechanics.
- **Wide difficulty spread:** Core and Standard follow the school level (China/Singapore standards); **Advanced** is tutoring-centre extension level and **Challenge** is olympiad level: in high school most Challenge problems come from an AMO-style bank. These adapt Australian Mathematical Olympiad problems (n! + c = 2ᵏ, f(f(n)) = 3n, a³ + b³ = 2ᶜ, tiling counts, take-away games and more) so that each has a single whole-number answer that can be marked automatically. Advanced/Challenge sets draw on a bank of competition problems for every school band (`js/gen-olympiad.js`) whose answers are computed by brute force, so they are always correct. AI questions are asked for the same levels.
- **More charts:** Graphs & data and Geometry diagrams topics (Years 4–10), clock and picture-graph questions (Years 1–3), coordinate-grid and triangle diagrams (senior), and pie charts, coordinate grids and travel graphs in the Selective test.
- **Clear progress** button on the Progress screen (protected by the parent PIN).
- **Up to 3 student profiles** per device (👤 button in the header): each has its own progress and settings; deleting a profile needs the parent PIN.
- **Move freely between questions** in both views (Previous / Next / question grid); finish at any time — unanswered questions count as wrong.
- **Formulas look like maths:** stacked fractions, superscript powers, and the expression of “Work out / Solve / Evaluate” questions in a large formula box (on screen, in reviews and in print).
- **Number of questions:** 1, 5, 10, 15, 20 or a custom number (1–50).
- **Editable AI prompt:** Parent settings show the built-in prompt for Maths, General ability and the Selective test; parents can edit it (with {placeholders}) or reset it. Answer-format rules are always added so the app can read the reply. The default prompt asks for descriptive, real-world questions.
- **Four difficulty levels:** Core 基础 · Standard 提高 · Advanced 拓展（培优）· Challenge 挑战（奥赛）.
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
3. **After every change, bump `CACHE_VERSION` in `sw.js`** (e.g. `maths-v9` → `maths-v10`) so installed copies update. `publish.bat` does this for you on Windows. The app shows "A new version is ready – Reload" when an update arrives.

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
| `js/gen-junior.js` | Years 1–3 |
| `js/gen-senior.js` | Years 11–12, Extension 1 and 2 |
| `js/gen-charts.js` | Graphs & data, geometry diagrams |
| `js/gen-olympiad.js` | Competition / tutoring-centre problems (Advanced & Challenge) |
| `js/gen-ga.js` | General ability (multiple choice) |
| `js/figures.js` | Charts and diagrams (SVG/HTML) for questions |
| `js/gen-amo.js` | AMO-level problems (find-all / counting / functional equations / tilings / games) with brute-force answers |
| `js/similar.js` | Similar questions for the review (same template or topic, new numbers) |
| `js/gen-comp.js` | Competition papers (AMC divisions and AIMO) |
| `js/gen-selective.js` | Selective test (35 questions / 40 minutes, 5 options) |
| `js/ai.js` | Claude / DeepSeek question generation (maths and general ability) and validation |
| `js/app.js` | Screens, state, parent mode, progress |
| `sw.js` | Service worker (bump `CACHE_VERSION` on release) |
| `tests/run.js` | `node tests/run.js` – checker tests, and every generated question checked against its own answer |
