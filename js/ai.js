/* AI question generation with Claude (Anthropic) or DeepSeek, called directly from the browser
   with the parent's own API key. Every AI question is validated; bad ones are dropped and topped
   up from the built-in generator, so a quiz always has the full number of questions. */
(function (root) {
  'use strict';

  const PROVIDERS = {
    claude: {
      name: 'Claude',
      models: ['claude-opus-5-5', 'claude-sonnet-5-5', 'claude-haiku-5-5'],
      defaultModel: 'claude-opus-5-5'
    },
    deepseek: {
      name: 'DeepSeek',
      models: ['deepseek-chat', 'deepseek-reasoner'],
      defaultModel: 'deepseek-chat'
    }
  };

  const UNITS = ['', 'mm', 'cm', 'm', 'km', 'mm²', 'cm²', 'm²', 'km²', 'cm³', 'm³', 'ml', 'l', 'g', 'kg', 's', 'min', 'h', '°', '%', '$', 'km/h', 'm/s'];

  const str = { type: 'string' };
  const MATHS_SCHEMA = {
    type: 'object', additionalProperties: false, required: ['questions'],
    properties: { questions: { type: 'array', items: {
      type: 'object', additionalProperties: false,
      required: ['topic', 'question_en', 'question_zh', 'answer', 'unit', 'solution_en', 'solution_zh'],
      properties: { topic: str, question_en: str, question_zh: str, answer: str, unit: { type: 'string', enum: UNITS }, solution_en: str, solution_zh: str }
    } } }
  };
  const GA_SCHEMA = {
    type: 'object', additionalProperties: false, required: ['questions'],
    properties: { questions: { type: 'array', items: {
      type: 'object', additionalProperties: false,
      required: ['topic', 'question_en', 'question_zh', 'choices_en', 'choices_zh', 'correct_index', 'solution_en', 'solution_zh'],
      properties: {
        topic: str, question_en: str, question_zh: str,
        choices_en: { type: 'array', items: str }, choices_zh: { type: 'array', items: str },
        correct_index: { type: 'integer' }, solution_en: str, solution_zh: str
      }
    } } }
  };

  const DIFF_WORDS = {
    1: 'Core – the standard textbook level for this grade in China / Singapore (not easy by Western standards)',
    2: 'Standard – typical exam questions for this grade in China / Singapore, usually 2 steps',
    3: 'Advanced – harder exam questions (拓展/拔高), multi-step, combining ideas',
    4: 'Challenge – competition style (奥数 / Singapore Math Olympiad level for this age): non-routine, needs insight'
  };

  function buildPrompt(subject, year, topic, diff, n, topicNames) {
    const topicLine = topic === 'mixed'
      ? `Mix these topics: ${topicNames.map(([k, name]) => `${k} (${name})`).join(', ')}.`
      : `Topic: ${topic} (${(topicNames.find(([k]) => k === topic) || [])[1] || topic}).`;
    const common = [
      `- question_en in clear English; question_zh is the SAME question in natural Simplified Chinese.`,
      `- solution_en / solution_zh: a short worked solution in each language.`,
      `- "topic" must be one of the topic keys given above.`,
      `- Plain text only: × ÷ − ² ³ √ π, fractions as a/b, powers as x^2. No LaTeX, no markdown.`,
      `- Never reveal the answer in the question. Make questions varied. Check every answer carefully.`
    ];
    if (subject === 'ga') {
      return [
        `Write ${n} General Ability (reasoning) multiple-choice questions for a Year ${year} student (age about ${year + 5}), at the level of selective-school / gifted entrance tests (e.g. Singapore GEP, Australian OC/selective, Chinese 思维训练).`,
        topicLine, `Difficulty: ${DIFF_WORDS[diff]}.`, '', 'Rules:',
        '- Exactly 4 options in choices_en and the same 4 options, in the same order, in choices_zh. correct_index is 0–3. Exactly one option is correct; the others are plausible.',
        '- Use reasoning that survives translation: number and letter series, codes, logical deduction, ordering, truth-tellers, symbol equations, patterns (emoji shapes allowed), directions, calendar, counting and spatial reasoning. Do NOT use synonyms, rhymes, spelling or other language-specific wordplay. Letters A–Z may be used in both languages.',
        ...common
      ].join('\n');
    }
    return [
      `Write ${n} maths practice questions for a Year ${year} student (age about ${year + 5}). Use the level of Grade ${year} in mainland China (人教版) and Singapore (MOE) — this is noticeably harder than Australian/UK expectations.`,
      topicLine, `Difficulty: ${DIFF_WORDS[diff]}.`,
      topic === 'mixed' || topic === 'word'
        ? `At least ${topic === 'word' ? 'all' : 'half'} of the questions must be word problems (应用题): a short real-life situation the student must read, turn into a calculation or an equation (方程), and solve — e.g. 和差/和倍, 鸡兔同笼, 植树, 年龄, 行程(相遇/追及), 工程, 盈亏, 浓度, 利润折扣, Singapore before–after and ratio-change model problems, and equation/simultaneous-equation problems.`
        : 'Include some short word problems where they fit the topic.',
      '', 'Rules:',
      '- Every answer must be a single number: integer, decimal, or fraction like 3/4 (negative allowed). No words, lists, coordinates or expressions. If a problem has several unknowns, ask for just one of them.',
      '- Put the number ONLY in "answer" and the unit ONLY in "unit" (from the allowed list, "" if none). "$" for money (元 in Chinese), "%" for percentages, "°" for angles.',
      '- If the answer is not exact, say how to round it (e.g. "to 2 decimal places") or say "use π = 3.14", and give that exact answer.',
      '- For equation problems, show the equation in the solution (e.g. "Let x = …; 3x + 5 = 2x + 12; x = 7").',
      ...common
    ].join('\n');
  }

  async function fetchWithTimeout(url, opts, ms) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), ms);
    try { return await fetch(url, { ...opts, signal: ctrl.signal }); }
    catch (e) { throw new Error(e.name === 'AbortError' ? 'timed out' : 'network error'); }
    finally { clearTimeout(timer); }
  }

  async function errorText(res) {
    try { const j = await res.json(); return (j.error && (j.error.message || j.error.type)) || res.status; }
    catch (e) { return 'HTTP ' + res.status; }
  }

  const SYSTEM = 'You write accurate, age-appropriate school practice questions (maths and reasoning) with bilingual English and Simplified Chinese text. Respond only with the requested JSON.';

  async function callClaude(cfg, prompt, schema, diff) {
    const model = cfg.model || PROVIDERS.claude.defaultModel;
    const headers = {
      'content-type': 'application/json',
      'x-api-key': cfg.key,
      'anthropic-version': '2026-10-21',
      'anthropic-dangerous-direct-browser-access': 'true'
    };
    const body = {
      model,
      max_tokens: 16000,
      // harder sets get more thinking so the answers are checked properly
      output_config: { effort: diff >= 3 ? 'medium' : 'low', format: { type: 'json_schema', schema } },
      system: SYSTEM,
      messages: [{ role: 'user', content: prompt }]
    };
    // if a safety classifier declines, let the API retry on its recommended fallback model
    if (!/haiku/.test(model)) { headers['anthropic-beta'] = 'server-side-fallback-2026-07-01'; body.fallbacks = 'default'; }
    const res = await fetchWithTimeout('https://api.anthropic.com/v1/messages', { method: 'POST', headers, body: JSON.stringify(body) }, 180000);
    if (!res.ok) throw new Error(await errorText(res));
    const data = await res.json();
    if (data.stop_reason === 'refusal') throw new Error('request declined');
    if (data.stop_reason === 'max_tokens') throw new Error('response too long');
    const text = (data.content || []).filter(b => b.type === 'text').map(b => b.text).join('');
    return JSON.parse(text);
  }

  async function callDeepSeek(cfg, prompt, subject) {
    const shape = subject === 'ga'
      ? '{"questions":[{"topic":"...","question_en":"...","question_zh":"...","choices_en":["...","...","...","..."],"choices_zh":["...","...","...","..."],"correct_index":0,"solution_en":"...","solution_zh":"..."}]}'
      : '{"questions":[{"topic":"...","question_en":"...","question_zh":"...","answer":"...","unit":"...","solution_en":"...","solution_zh":"..."}]}. Allowed units: ' + UNITS.map(u => JSON.stringify(u)).join(', ');
    const res = await fetchWithTimeout('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: 'Bearer ' + cfg.key },
      body: JSON.stringify({
        model: cfg.model || PROVIDERS.deepseek.defaultModel,
        max_tokens: 8000,
        // JSON mode is supported by deepseek-chat; the reasoner model ignores/rejects it
        ...(/reasoner/.test(cfg.model || '') ? {} : { response_format: { type: 'json_object' } }),
        messages: [
          { role: 'system', content: SYSTEM + ' Reply with JSON only, in exactly this shape: ' + shape + '.' },
          { role: 'user', content: prompt }
        ]
      })
    }, 180000);
    if (!res.ok) throw new Error(await errorText(res));
    const data = await res.json();
    const text = data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content;
    if (!text) throw new Error('empty response');
    const m = text.match(/\{[\s\S]*\}/);
    if (!m) throw new Error('no JSON in response');
    return JSON.parse(m[0]);
  }

  const clean = v => (typeof v === 'string' ? v.trim() : '');
  function pickTopic(item, allowedTopics, requestedTopic) {
    const tp = clean(item.topic);
    if (requestedTopic !== 'mixed') return requestedTopic;
    return allowedTopics.includes(tp) ? tp : allowedTopics[0];
  }

  /* Turn one raw AI maths item into an app question, or null if it fails validation. */
  function toQuestion(item, year, diff, allowedTopics, requestedTopic) {
    if (!item || typeof item !== 'object') return null;
    const en = clean(item.question_en), zh = clean(item.question_zh), ansRaw = clean(item.answer);
    if (!en || !zh || !ansRaw || en.length > 900 || zh.length > 900) return null;
    const parsed = root.Checker.parse(ansRaw);
    if (!parsed || parsed.unit) return null;              // answer must be a bare number/fraction
    let unit = clean(item.unit);
    if (!UNITS.includes(unit)) unit = root.Checker.canonUnit(unit) || '';
    const show = unit === '$' ? '$' + ansRaw : unit === '%' || unit === '°' ? ansRaw + unit : ansRaw + (unit ? ' ' + unit : '');
    return {
      subject: 'maths', type: 'input', topic: pickTopic(item, allowedTopics, requestedTopic), year, diff, q: { en, zh },
      value: parsed.value, answer: show, unit,
      sol: { en: clean(item.solution_en), zh: clean(item.solution_zh) || clean(item.solution_en) }, source: 'ai'
    };
  }

  /* Turn one raw AI General-ability item into a multiple-choice question, or null. */
  function toMcQuestion(item, year, diff, allowedTopics, requestedTopic) {
    if (!item || typeof item !== 'object') return null;
    const en = clean(item.question_en), zh = clean(item.question_zh);
    const ce = Array.isArray(item.choices_en) ? item.choices_en.map(clean) : [], cz = Array.isArray(item.choices_zh) ? item.choices_zh.map(clean) : [];
    const ci = item.correct_index;
    if (!en || !zh || en.length > 900 || zh.length > 900) return null;
    if (ce.length < 3 || ce.length > 5 || cz.length !== ce.length || ce.some(c => !c || c.length > 120) || cz.some(c => !c)) return null;
    if (!Number.isInteger(ci) || ci < 0 || ci >= ce.length) return null;
    if (new Set(ce).size !== ce.length) return null;
    return {
      subject: 'ga', type: 'mc', topic: pickTopic(item, allowedTopics, requestedTopic), year, diff, q: { en, zh },
      choices: ce.map((c, i) => ({ en: c, zh: cz[i] })), correct: ci,
      sol: { en: clean(item.solution_en), zh: clean(item.solution_zh) || clean(item.solution_en) }, source: 'ai'
    };
  }

  async function generateSet(cfg, subject, year, topic, diff, n, topicNames) {
    const allowed = topicNames.map(([k]) => k);
    const prompt = buildPrompt(subject, year, topic, diff, n, topicNames);
    const raw = cfg.provider === 'deepseek'
      ? await callDeepSeek(cfg, prompt, subject)
      : await callClaude(cfg, prompt, subject === 'ga' ? GA_SCHEMA : MATHS_SCHEMA, diff);
    const items = Array.isArray(raw) ? raw : raw && raw.questions;
    if (!Array.isArray(items)) throw new Error('unexpected response');
    const conv = subject === 'ga' ? toMcQuestion : toQuestion;
    const seen = new Set(), out = [];
    for (const item of items) {
      const q = conv(item, year, diff, allowed, topic);
      if (q && !seen.has(q.q.en)) { seen.add(q.q.en); out.push(q); }
      if (out.length >= n) break;
    }
    if (!out.length) throw new Error('no usable questions');
    return out;
  }

  const api = { PROVIDERS, generateSet, toQuestion, toMcQuestion, buildPrompt };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.AI = api;
})(typeof window !== 'undefined' ? window : globalThis);
