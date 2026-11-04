/* All interface text lives here. Add a key to BOTH languages.
   Placeholders like {n} are filled in by t(key, {n: 5}). */
(function () {
  'use strict';

  const STRINGS = {
    en: {
      'app.title': 'Maths Practice',
      'app.tagline': 'Years 4 to 10',
      'nav.home': 'Home',
      'nav.progress': 'Progress',
      'nav.parent': 'Parent',
      'nav.parentOn': 'Parent ✓',
      'lang.switch': '中文',
      'lang.label': 'Switch language to Chinese',

      'home.heading': 'Set up your practice',
      'home.year': 'Year level',
      'home.yearN': 'Year {n}',
      'home.topic': 'Topic',
      'home.diff': 'Difficulty',
      'home.count': 'Number of questions',
      'home.start': 'Start practice',
      'home.source.local': 'Questions: built-in generator',
      'home.source.ai': 'Questions: {name} AI',

      'diff.1': 'Easy',
      'diff.2': 'Medium',
      'diff.3': 'Hard',

      'topic.mixed': 'Mixed',
      'topic.place': 'Place value & rounding',
      'topic.addsub': 'Add & subtract',
      'topic.muldiv': 'Multiply & divide',
      'topic.frac': 'Fractions',
      'topic.dec': 'Decimals',
      'topic.pct': 'Percentages',
      'topic.ratio': 'Ratio & rates',
      'topic.int': 'Negative numbers',
      'topic.index': 'Powers & roots',
      'topic.alg': 'Algebra',
      'topic.linear': 'Linear graphs',
      'topic.meas': 'Measurement',
      'topic.angle': 'Angles',
      'topic.pyth': 'Pythagoras',
      'topic.stats': 'Statistics',
      'topic.prob': 'Probability',

      'loading.ai': 'Asking {name} to write your questions…',
      'loading.fallback': 'The AI could not be reached ({err}). Using built-in questions instead.',

      'quiz.progress': 'Question {i} of {n}',
      'quiz.label': 'Your answer',
      'quiz.placeholder': 'Type your answer',
      'quiz.hint': 'Fractions like 3/4 or 1 1/2. Units are optional.',
      'quiz.check': 'Check answer',
      'quiz.next': 'Next question',
      'quiz.finish': 'See results',
      'quiz.correct': 'Correct! Well done.',
      'quiz.correct2': 'Correct on the second try. Good persistence!',
      'quiz.retry': 'Not quite. Have another go.',
      'quiz.wrong': 'Not quite. This one will be in your review.',
      'quiz.empty': 'Please type an answer first.',
      'quiz.unread': 'I could not read that as a number. Try e.g. 12, 0.5 or 3/4.',
      'quiz.quit': 'Quit',
      'quiz.quitConfirm': 'Stop this practice? Your answers so far will not be saved.',
      'quiz.parentAnswer': 'Parent view – answer: {a}',
      'quiz.score': 'Score: {c}',
      'key.space': 'space',

      'res.heading': 'Results',
      'res.score': 'You got {c} out of {n}',
      'res.msg.great': 'Excellent work!',
      'res.msg.good': 'Good job – keep practising!',
      'res.msg.keep': 'Keep going – practice makes progress.',
      'res.yours': 'Your answer: {a}',
      'res.blank': '(no answer)',
      'res.second': '(2nd try)',
      'res.answer': 'Answer: {a}',
      'res.solution': 'Working: {s}',
      'res.locked': 'Correct answers are hidden. A parent can unlock them.',
      'res.unlock': 'Parent: show answers',
      'res.again': 'Practise again',
      'res.home': 'Change settings',

      'prog.heading': 'Progress',
      'prog.none': 'No practice yet. Start a quiz from Home!',
      'prog.sessions': 'Sessions',
      'prog.questions': 'Questions',
      'prog.accuracy': 'Accuracy',
      'prog.byTopic': 'By topic',
      'prog.recent': 'Recent sessions',
      'prog.review': 'Questions to review',
      'prog.reviewNone': 'Nothing to review – great!',
      'prog.reset': 'Delete all progress',
      'prog.resetConfirm': 'Delete all saved progress on this device?',
      'prog.parentOnly': 'Unlock parent mode to see answers and reset progress.',
      'prog.row': '{date} · {year} · {topic} · {c}/{n}',

      'parent.heading': 'Parent settings',
      'parent.lock': 'Lock parent mode',
      'parent.aiHeading': 'Question source',
      'parent.aiInfo': 'Questions can be written by an AI (Claude or DeepSeek) using your own API key. The key is stored only in this browser and sent only to the provider you choose. If the AI is unavailable, the built-in generator is used.',
      'parent.provider': 'Provider',
      'parent.provider.local': 'Built-in (offline)',
      'parent.provider.claude': 'Claude (Anthropic)',
      'parent.provider.deepseek': 'DeepSeek',
      'parent.key': 'API key',
      'parent.keyPh': 'Paste your API key',
      'parent.model': 'Model',
      'parent.test': 'Test connection',
      'parent.testing': 'Testing…',
      'parent.testOk': 'Connected. The AI wrote a test question.',
      'parent.testBad': 'Failed: {err}',
      'parent.save': 'Save',
      'parent.saved': 'Saved.',
      'parent.pinHeading': 'Parent PIN',
      'parent.changePin': 'Change PIN',

      'pin.create': 'Create a 4-digit parent PIN',
      'pin.confirm': 'Type the same PIN again',
      'pin.enter': 'Enter the parent PIN',
      'pin.ok': 'OK',
      'pin.cancel': 'Cancel',
      'pin.bad': 'Wrong PIN.',
      'pin.mismatch': 'The PINs did not match. Start again.',
      'pin.short': 'Please use exactly 4 digits.',
      'pin.forgot': 'Forgot PIN? Reset it',
      'pin.forgotConfirm': 'Reset the PIN? This also removes the saved AI key from this device.',
      'pin.note': 'The PIN keeps answers hidden from students. It is a child lock, not strong security.',

      'update.ready': 'A new version is ready.',
      'update.reload': 'Reload',
      'offline': 'You are offline – using built-in questions.'
    },

    zh: {
      'app.title': '数学练习',
      'app.tagline': '4–10 年级',
      'nav.home': '首页',
      'nav.progress': '学习进度',
      'nav.parent': '家长',
      'nav.parentOn': '家长 ✓',
      'lang.switch': 'EN',
      'lang.label': '切换为英文',

      'home.heading': '设置练习',
      'home.year': '年级',
      'home.yearN': '{n} 年级',
      'home.topic': '题型',
      'home.diff': '难度',
      'home.count': '题目数量',
      'home.start': '开始练习',
      'home.source.local': '题目来源：内置题库',
      'home.source.ai': '题目来源：{name} AI',

      'diff.1': '容易',
      'diff.2': '中等',
      'diff.3': '困难',

      'topic.mixed': '综合',
      'topic.place': '数位与近似',
      'topic.addsub': '加法与减法',
      'topic.muldiv': '乘法与除法',
      'topic.frac': '分数',
      'topic.dec': '小数',
      'topic.pct': '百分数',
      'topic.ratio': '比与比率',
      'topic.int': '负数',
      'topic.index': '乘方与开方',
      'topic.alg': '代数',
      'topic.linear': '一次函数图像',
      'topic.meas': '测量',
      'topic.angle': '角',
      'topic.pyth': '勾股定理',
      'topic.stats': '统计',
      'topic.prob': '概率',

      'loading.ai': '正在请 {name} 出题……',
      'loading.fallback': '无法连接 AI（{err}），已改用内置题目。',

      'quiz.progress': '第 {i} 题，共 {n} 题',
      'quiz.label': '你的答案',
      'quiz.placeholder': '请输入答案',
      'quiz.hint': '分数可写成 3/4 或 1 1/2，单位可写可不写。',
      'quiz.check': '提交答案',
      'quiz.next': '下一题',
      'quiz.finish': '查看结果',
      'quiz.correct': '回答正确！做得好。',
      'quiz.correct2': '第二次答对了，坚持得好！',
      'quiz.retry': '不太对，再试一次。',
      'quiz.wrong': '不太对，这道题会放入复习。',
      'quiz.empty': '请先输入答案。',
      'quiz.unread': '无法识别为数字，请输入如 12、0.5 或 3/4。',
      'quiz.quit': '退出',
      'quiz.quitConfirm': '确定退出本次练习吗？目前的答案不会被保存。',
      'quiz.parentAnswer': '家长查看 – 答案：{a}',
      'quiz.score': '得分：{c}',
      'key.space': '空格',

      'res.heading': '练习结果',
      'res.score': '你答对了 {c} 题，共 {n} 题',
      'res.msg.great': '非常棒！',
      'res.msg.good': '做得好，继续加油！',
      'res.msg.keep': '继续努力，多练就会进步。',
      'res.yours': '你的答案：{a}',
      'res.blank': '（未作答）',
      'res.second': '（第二次）',
      'res.answer': '正确答案：{a}',
      'res.solution': '解题过程：{s}',
      'res.locked': '正确答案已隐藏，家长可以解锁查看。',
      'res.unlock': '家长：显示答案',
      'res.again': '再练一次',
      'res.home': '修改设置',

      'prog.heading': '学习进度',
      'prog.none': '还没有练习记录，去首页开始做题吧！',
      'prog.sessions': '练习次数',
      'prog.questions': '题目总数',
      'prog.accuracy': '正确率',
      'prog.byTopic': '各题型正确率',
      'prog.recent': '最近练习',
      'prog.review': '需要复习的题目',
      'prog.reviewNone': '没有需要复习的题目，太棒了！',
      'prog.reset': '删除所有记录',
      'prog.resetConfirm': '确定删除本设备上的所有学习记录吗？',
      'prog.parentOnly': '解锁家长模式后可查看答案和清除记录。',
      'prog.row': '{date} · {year} · {topic} · {c}/{n}',

      'parent.heading': '家长设置',
      'parent.lock': '退出家长模式',
      'parent.aiHeading': '题目来源',
      'parent.aiInfo': '可以使用你自己的 API 密钥，让 AI（Claude 或 DeepSeek）出题。密钥只保存在本浏览器中，只会发送给你选择的服务商。如果 AI 无法使用，将自动改用内置题库。',
      'parent.provider': '服务商',
      'parent.provider.local': '内置题库（可离线）',
      'parent.provider.claude': 'Claude（Anthropic）',
      'parent.provider.deepseek': 'DeepSeek（深度求索）',
      'parent.key': 'API 密钥',
      'parent.keyPh': '粘贴你的 API 密钥',
      'parent.model': '模型',
      'parent.test': '测试连接',
      'parent.testing': '测试中……',
      'parent.testOk': '连接成功，AI 已生成一道测试题。',
      'parent.testBad': '失败：{err}',
      'parent.save': '保存',
      'parent.saved': '已保存。',
      'parent.pinHeading': '家长密码',
      'parent.changePin': '修改密码',

      'pin.create': '设置 4 位数家长密码',
      'pin.confirm': '请再输入一次',
      'pin.enter': '请输入家长密码',
      'pin.ok': '确定',
      'pin.cancel': '取消',
      'pin.bad': '密码错误。',
      'pin.mismatch': '两次密码不一致，请重新设置。',
      'pin.short': '请输入 4 位数字。',
      'pin.forgot': '忘记密码？重置',
      'pin.forgotConfirm': '确定重置密码吗？这也会删除本设备上保存的 AI 密钥。',
      'pin.note': '密码用于对学生隐藏答案，只是儿童锁，并非严格的安全措施。',

      'update.ready': '新版本已就绪。',
      'update.reload': '刷新',
      'offline': '当前离线，使用内置题目。'
    }
  };

  const LANG_KEY = 'mp.lang';
  let lang = 'en';
  try {
    const saved = localStorage.getItem(LANG_KEY);
    if (saved && STRINGS[saved]) lang = saved;
    else if ((navigator.language || '').toLowerCase().startsWith('zh')) lang = 'zh';
  } catch (e) { /* storage blocked: use default */ }

  function t(key, vars) {
    let s = (STRINGS[lang] && STRINGS[lang][key]) ?? STRINGS.en[key] ?? key;
    if (vars) s = s.replace(/\{(\w+)\}/g, (m, k) => (vars[k] !== undefined ? vars[k] : m));
    return s;
  }

  function setLang(next) {
    if (!STRINGS[next]) return;
    lang = next;
    try { localStorage.setItem(LANG_KEY, next); } catch (e) { /* ignore */ }
  }

  /* Fill every element marked with data-i18n / data-i18n-placeholder / data-i18n-aria. */
  function applyStatic(root) {
    const doc = root || document;
    document.documentElement.lang = lang === 'zh' ? 'zh-CN' : 'en';
    document.title = t('app.title');
    doc.querySelectorAll('[data-i18n]').forEach(el => { el.textContent = t(el.dataset.i18n); });
    doc.querySelectorAll('[data-i18n-placeholder]').forEach(el => { el.placeholder = t(el.dataset.i18nPlaceholder); });
    doc.querySelectorAll('[data-i18n-aria]').forEach(el => { el.setAttribute('aria-label', t(el.dataset.i18nAria)); });
  }

  window.I18N = { STRINGS, t, setLang, applyStatic, get lang() { return lang; } };
})();
