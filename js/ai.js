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

  const SCHEMA = {
    type: 'object',
    additionalProperties: false,
    required: ['questions'],
    properties: {
      questions: {
        type: 'array',
        items: {
          type: 'object',
          additionalProperties: false,
          required: ['topic', 'question_en', 'question_zh', 'answer', 'unit', 'solution_en', 'solution_zh'],
          properties: {
            topic: { type: 'string' },
            question_en: { type: 'string' },
            question_zh: { type: 'string' },
            answer: { type: 'string' },
            unit: { type: 'string', enum: UNITS },
            solution_en: { type: 'string' },
            solution_zh: { type: 'string' }
          }
        }
      }
    }
  };

  const DIFF_WORDS = { 1: 'easy (confidence-building, straightforward one-step)', 2: 'medium (typical, may need two steps)', 3: 'hard (challenging, multi-step, still within the year level)' };

  function buildPrompt(year, topic, diff, n, topicNames) {
    const topicLine = topic === 'mixed'
      ? `Mix these topics evenly: ${topicNames.map(([k, name]) => `${k} (${name})`).join(', ')}.`
      : `Topic: ${topic} (${topicNames.find(([k]) => k === topic)?.[1] || topic}).`;
    return [
      `Write ${n} maths practice questions for a Year ${year} student (age about ${year + 5}), following the Australian/UK school curriculum for that year.`,
      topicLine,
      `Difficulty: ${DIFF_WORDS[diff]}.`,
      '',
      'Rules:',
      '- Every answer must be a single number: an integer, a decimal, or a fraction written like 3/4 (negative allowed, e.g. -2 or -3/4). No words, no lists, no coordinates, no algebraic expressions.',
      '- Put the answer ONLY in "answer" (without the unit) and the unit ONLY in "unit" (one of the allowed values, "" if none). Use "$" for money, "%" for percentages, "°" for angles.',
      '- If the answer is not exact, say in the question how to round it (e.g. "to 2 decimal places") and give the rounded answer.',
      '- Never reveal or hint at the answer inside the question text.',
      '- question_en is in clear British/Australian English; question_zh is the same question in natural Simplified Chinese (use 元 for money, Chinese unit names such as 厘米).',
      '- solution_en / solution_zh: a short worked solution (1–3 steps) in each language.',
      '- "topic" must be one of the topic keys given above.',
      '- Use plain text maths: × ÷ − ² ³ √ π, fractions as a/b, powers as x^2. No LaTeX, no markdown.',
      '- Make the questions varied (different numbers, contexts and question types). Check each answer carefully.'
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

  async function callClaude(cfg, prompt) {
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
      output_config: { effort: 'low', format: { type: 'json_schema', schema: SCHEMA } },
      system: 'You write accurate, age-appropriate school maths practice questions with bilingual (English and Simplified Chinese) text. Respond only with the requested JSON.',
      messages: [{ role: 'user', content: prompt }]
    };
    // if a safety classifier declines, let the API retry on its recommended fallback model
    if (!/haiku/.test(model)) { headers['anthropic-beta'] = 'server-side-fallback-2026-07-01'; body.fallbacks = 'default'; }
    const res = await fetchWithTimeout('https://api.anthropic.com/v1/messages', {
      method: 'POST', headers, body: JSON.stringify(body)
    }, 120000);
    if (!res.ok) throw new Error(await errorText(res));
    const data = await res.json();
    if (data.stop_reason === 'refusal') throw new Error('request declined');
    if (data.stop_reason === 'max_tokens') throw new Error('response too long');
    const text = (data.content || []).filter(b => b.type === 'text').map(b => b.text).join('');
    return JSON.parse(text);
  }
  async function callDeepSeek(cfg, prompt) {
    const res = await fetchWithTimeout('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: 'Bearer ' + cfg.key },
      body: JSON.stringify({
        model: cfg.model || PROVIDERS.deepseek.defaultModel,
        max_tokens: 8000,
        // JSON mode is supported by deepseek-chat; the reasoner model ignores/rejects it
        ...(/reasoner/.test(cfg.model || '') ? {} : { response_format: { type: 'json_object' } }),
        messages: [
          { role: 'system', content: 'You write accurate, age-appropriate school maths practice questions with bilingual (English and Simplified Chinese) text. Reply with JSON only, in exactly this shape: {"questions":[{"topic":"...","question_en":"...","question_zh":"...","answer":"...","unit":"...","solution_en":"...","solution_zh":"..."}]}. Allowed units: ' + UNITS.map(u => JSON.stringify(u)).join(', ') + '.' },
          { role: 'user', content: prompt }
        ]
      })
    }, 120000);
    if (!res.ok) throw new Error(await errorText(res));
    const data = await res.json();
    const text = data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content;
    if (!text) throw new Error('empty response');
    const m = text.match(/\{[\s\S]*\}/);
    if (!m) throw new Error('no JSON in response');
    return JSON.parse(m[0]);
  }

  /* Turn one raw AI item into an app question, or null if it fails validation. */
  function toQuestion(item, year, diff, allowedTopics, requestedTopic) {
    if (!item || typeof item !== 'object') return null;
    const str = v => (typeof v === 'string' ? v.trim() : '');
    const en = str(item.question_en), zh = str(item.question_zh), ansRaw = str(item.answer);
    if (!en || !zh || !ansRaw || en.length > 600 || zh.length > 600) return null;
    const parsed = root.Checker.parse(ansRaw);
    if (!parsed || parsed.unit) return null;              // answer must be a bare number/fraction
    let unit = str(item.unit);
    if (!UNITS.includes(unit)) unit = root.Checker.canonUnit(unit) || '';
    let topic = str(item.topic);
    if (requestedTopic !== 'mixed') topic = requestedTopic;
    else if (!allowedTopics.includes(topic)) topic = allowedTopics[0];
    const show = unit === '$' ? '$' + ansRaw : unit === '%' || unit === '°' ? ansRaw + unit : ansRaw + (unit ? ' ' + unit : '');
    return {
      topic, year, diff, q: { en, zh }, value: parsed.value, answer: show, unit,
      sol: { en: str(item.solution_en), zh: str(item.solution_zh) || str(item.solution_en) }, source: 'ai'
    };
  }

  async function generateSet(cfg, year, topic, diff, n, topicNames) {
    const allowed = topicNames.map(([k]) => k);
    const prompt = buildPrompt(year, topic, diff, n, topicNames);
    const raw = cfg.provider === 'deepseek' ? await callDeepSeek(cfg, prompt) : await callClaude(cfg, prompt);
    const items = Array.isArray(raw) ? raw : raw && raw.questions;
    if (!Array.isArray(items)) throw new Error('unexpected response');
    const seen = new Set();
    const out = [];
    for (const item of items) {
      const q = toQuestion(item, year, diff, allowed, topic);
      if (q && !seen.has(q.q.en)) { seen.add(q.q.en); out.push(q); }
      if (out.length >= n) break;
    }
    if (!out.length) throw new Error('no usable questions');
    return out;
  }

  const api = { PROVIDERS, generateSet, toQuestion, buildPrompt };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.AI = api;
})(typeof window !== 'undefined' ? window : globalThis);
