/* 应用题 Word problems: read the situation, form a calculation or an equation, solve.
   Classic Chinese / Singapore problem types, gated by year and difficulty.
   Every template picks numbers so the answer is exact. */
(function (root) {
  'use strict';
  const G = root.Gen || require('./gen-core.js');
  const { R, pick, gcd, lcm, round, MINUS, mk } = G;

  const NAMES = [['Amy', '小美'], ['Ben', '小斌'], ['Chen', '小陈'], ['Dev', '小德'], ['Ella', '小艾'], ['Hui', '小慧'], ['Leo', '小乐'], ['Mia', '小米'], ['Raj', '小杰'], ['Wei', '小伟']];
  const two = () => { const a = pick(NAMES); let b = pick(NAMES); while (b === a) b = pick(NAMES); return [a, b]; };
  const W = (o) => mk(Object.assign({ topic: 'word' }, o));

  /* each: [minYear, minDiff, fn(y, d)] */
  const T = [], recent = [];
  const add = (minYear, minDiff, fn) => T.push([minYear, minDiff, fn]);

  // 和差问题 sum & difference
  add(4, 1, (y, d) => {
    const [A, B] = two(), b = R(20, 90 * d), diff = R(5, 40), a = b + diff, s = a + b;
    return W({ value: a, en: `${A[0]} and ${B[0]} have ${s} stamps altogether. ${A[0]} has ${diff} more than ${B[0]}. How many stamps does ${A[0]} have?`,
      zh: `${A[1]}和${B[1]}一共有 ${s} 张邮票，${A[1]}比${B[1]}多 ${diff} 张。${A[1]}有多少张邮票？`,
      solEn: `${A[0]} = (sum + difference) ÷ 2 = (${s} + ${diff}) ÷ 2 = ${a}`, solZh: `较大数 = (和 + 差) ÷ 2 = (${s} + ${diff}) ÷ 2 = ${a}（张）` });
  });
  // 和倍问题 sum & multiple
  add(4, 1, (y, d) => {
    const [A, B] = two(), k = R(2, 6), b = R(8, 25 * d), s = b * (k + 1);
    return W({ value: b, en: `${A[0]} and ${B[0]} have $${s} in total. ${A[0]} has ${k} times as much as ${B[0]}. How much does ${B[0]} have?`, unit: '$',
      zh: `${A[1]}和${B[1]}共有 ${s} 元，${A[1]}的钱是${B[1]}的 ${k} 倍。${B[1]}有多少元？`,
      solEn: `${B[0]} = 1 part, ${A[0]} = ${k} parts; ${k + 1} parts = $${s}; 1 part = ${s} ÷ ${k + 1} = $${b}`, solZh: `把${B[1]}的钱看作 1 份，共 ${k + 1} 份：${s} ÷ ${k + 1} = ${b}（元）` });
  });
  // 差倍问题 difference & multiple
  add(4, 2, (y, d) => {
    const [A, B] = two(), k = R(2, 7), b = R(6, 30 * d), diff = b * (k - 1);
    return W({ value: b * k, en: `${A[0]} has ${k} times as many marbles as ${B[0]}, which is ${diff} more than ${B[0]}. How many marbles does ${A[0]} have?`,
      zh: `${A[1]}的弹珠数是${B[1]}的 ${k} 倍，比${B[1]}多 ${diff} 颗。${A[1]}有多少颗弹珠？`,
      solEn: `The difference is ${k} ${MINUS} 1 = ${k - 1} parts = ${diff}, so 1 part = ${b}; ${A[0]} = ${k} × ${b} = ${b * k}`, solZh: `相差 ${k - 1} 倍 = ${diff} 颗，1 倍 = ${b} 颗，${A[1]} = ${b} × ${k} = ${b * k}（颗）` });
  });
  // 植树问题 tree planting
  add(4, 1, (y, d) => {
    const gap = pick([2, 3, 4, 5, 6, 8, 10, 12, 15]), n = R(8, 40 * d), L = gap * n, kind = pick(d === 1 ? ['both'] : ['both', 'none', 'circle', 'twoSides']);
    const v = kind === 'both' ? n + 1 : kind === 'none' ? n - 1 : kind === 'circle' ? n : 2 * (n + 1);
    const en = { both: `Trees are planted along one side of a ${L} m road, every ${gap} m, with a tree at both ends. How many trees are needed?`,
      none: `Lamp posts are put between two buildings ${L} m apart, every ${gap} m, but none next to the buildings themselves. How many lamp posts?`,
      circle: `Trees are planted every ${gap} m around a circular lake with a perimeter of ${L} m. How many trees?`,
      twoSides: `Trees are planted along BOTH sides of a ${L} m road, every ${gap} m, with trees at both ends. How many trees in total?` }[kind];
    const zh = { both: `在一条长 ${L} 米的路的一侧植树，每隔 ${gap} 米种一棵，两端都种。一共要种多少棵？`,
      none: `两栋楼相距 ${L} 米，中间每隔 ${gap} 米立一根路灯杆，两端（楼旁）不立。一共要立多少根？`,
      circle: `在周长 ${L} 米的圆形湖边每隔 ${gap} 米种一棵树，一共要种多少棵？`,
      twoSides: `在一条长 ${L} 米的路的两侧植树，每隔 ${gap} 米种一棵，两端都种。一共要种多少棵？` }[kind];
    const ruleEn = { both: 'gaps + 1', none: 'gaps − 1', circle: 'gaps', twoSides: '2 × (gaps + 1)' }[kind];
    const ruleZh = { both: '棵数 = 间隔数 + 1', none: '棵数 = 间隔数 − 1', circle: '环形：棵数 = 间隔数', twoSides: '两侧：(间隔数 + 1) × 2' }[kind];
    return W({ value: v, en, zh, solEn: `Gaps = ${L} ÷ ${gap} = ${n}; trees = ${ruleEn} = ${v}`, solZh: `间隔数 = ${L} ÷ ${gap} = ${n}；${ruleZh} = ${v}（棵）` });
  });
  // 年龄问题 age
  add(4, 2, (y, d) => {
    const k = R(2, 4), kid = R(4, 12), x = R(1, 12), mum = k * (kid + x) - x, ask = pick(['when', 'now']);
    if (mum < kid + 18 || mum > 60) return null;
    if (ask === 'when') return W({ value: x, en: `Mum is ${mum} and her son is ${kid}. In how many years will Mum be exactly ${k} times as old as her son?`,
      zh: `妈妈今年 ${mum} 岁，儿子今年 ${kid} 岁。几年后妈妈的年龄正好是儿子的 ${k} 倍？`,
      solEn: `Let it be x years: ${mum} + x = ${k}(${kid} + x) → ${mum} ${MINUS} ${k * kid} = ${k - 1}x → x = ${x}`, solZh: `设 x 年后：${mum} + x = ${k}(${kid} + x)，解得 x = ${x}（年）。（年龄差 ${mum - kid} 岁不变）` });
    const gap = mum - kid;
    return W({ value: kid, en: `Mum is ${gap} years older than her son. In ${x} years she will be ${k} times his age. How old is the son now?`,
      zh: `妈妈比儿子大 ${gap} 岁，${x} 年后妈妈的年龄是儿子的 ${k} 倍。儿子今年几岁？`,
      solEn: `The age gap ${gap} never changes. In ${x} years the gap is ${k} ${MINUS} 1 = ${k - 1} times the son's age: son then = ${gap} ÷ ${k - 1} = ${kid + x}; now ${kid}`,
      solZh: `年龄差 ${gap} 岁不变。${x} 年后年龄差是儿子年龄的 ${k - 1} 倍：儿子那时 ${gap} ÷ ${k - 1} = ${kid + x} 岁，现在 ${kid} 岁` });
  });
  // 鸡兔同笼 chickens & rabbits
  add(4, 2, (y, d) => {
    const c = R(3, 20 * d), r = R(3, 15 * d), heads = c + r, legs = 2 * c + 4 * r, askR = Math.random() < 0.5;
    return W({ value: askR ? r : c, en: `A farm has chickens and rabbits. There are ${heads} heads and ${legs} legs. How many ${askR ? 'rabbits' : 'chickens'} are there?`,
      zh: `鸡兔同笼，共有 ${heads} 个头，${legs} 条腿。${askR ? '兔' : '鸡'}有多少只？`,
      solEn: `If all were chickens: ${heads} × 2 = ${heads * 2} legs. Extra ${legs - heads * 2} legs ÷ 2 = ${r} rabbits; chickens = ${c}`,
      solZh: `假设全是鸡：${heads} × 2 = ${heads * 2} 条腿，少了 ${legs - heads * 2} 条；每只兔多 2 条腿：兔 = ${legs - heads * 2} ÷ 2 = ${r} 只，鸡 = ${c} 只` });
  });
  // 归一 unitary method
  add(4, 1, (y, d) => {
    const w1 = R(2, 8), h1 = R(2, 6), rate = R(2, 15), toys = w1 * h1 * rate, w2 = R(3, 12), h2 = R(2, 8), v = w2 * h2 * rate;
    return W({ value: v, en: `${w1} workers make ${toys} toys in ${h1} hours. At the same rate, how many toys do ${w2} workers make in ${h2} hours?`,
      zh: `${w1} 个工人 ${h1} 小时做了 ${toys} 个玩具。照这样计算，${w2} 个工人 ${h2} 小时能做多少个？`,
      solEn: `1 worker in 1 hour: ${toys} ÷ ${w1} ÷ ${h1} = ${rate}; ${rate} × ${w2} × ${h2} = ${v}`, solZh: `1 人 1 小时：${toys} ÷ ${w1} ÷ ${h1} = ${rate}（个）；${rate} × ${w2} × ${h2} = ${v}（个）` });
  });
  // 平均数 average
  add(4, 2, (y, d) => {
    const n = R(3, 6), avg = R(70, 88), target = avg + R(1, 3), need = target * (n + 1) - avg * n;
    if (need > 100) return null;
    return W({ value: need, en: `${pick(NAMES)[0]}'s average over ${n} tests is ${avg}. What score is needed on the next test to raise the average to ${target}?`,
      zh: `${pick(NAMES)[1]}前 ${n} 次测验的平均分是 ${avg} 分，第 ${n + 1} 次要考多少分，才能使平均分提高到 ${target} 分？`,
      solEn: `Needed total ${target} × ${n + 1} = ${target * (n + 1)}; current total ${avg * n}; ${target * (n + 1)} ${MINUS} ${avg * n} = ${need}`, solZh: `${target} × ${n + 1} ${MINUS} ${avg} × ${n} = ${need}（分）` });
  });
  // 盈亏问题 surplus & shortage
  add(5, 2, (y, d) => {
    const kids = R(5, 25), a = R(3, 6), b = a + R(1, 3), extra = R(1, 15), total = a * kids + extra, short = b * kids - total;
    if (short <= 0) return null;
    return W({ value: kids, en: `Sweets are shared among some children. If each gets ${a}, there are ${extra} left over. If each gets ${b}, ${short} are missing. How many children are there?`,
      zh: `把一些糖分给小朋友，每人分 ${a} 颗，多 ${extra} 颗；每人分 ${b} 颗，少 ${short} 颗。有多少个小朋友？`,
      solEn: `Giving ${b - a} more each needs ${extra} + ${short} = ${extra + short} more sweets, so children = ${extra + short} ÷ ${b - a} = ${kids}`, solZh: `盈亏问题：人数 = (盈 + 亏) ÷ 两次分配之差 = (${extra} + ${short}) ÷ (${b} ${MINUS} ${a}) = ${kids}（人）` });
  });
  // 相遇问题 meeting
  add(5, 1, (y, d) => {
    const a = R(4, 16) * 5, b = R(4, 16) * 5, t = pick([1, 1.5, 2, 2.5, 3, 4]), D = round((a + b) * t, 2), askT = Math.random() < 0.5;
    if (askT) return W({ value: t, unit: 'h', en: `Two towns are ${D} km apart. Two cars leave at the same time towards each other at ${a} km/h and ${b} km/h. After how many hours do they meet?`,
      zh: `甲、乙两地相距 ${D} 千米，两辆车同时从两地相向开出，速度分别是每小时 ${a} 千米和 ${b} 千米。几小时后相遇？`,
      solEn: `Closing speed ${a} + ${b} = ${a + b} km/h; ${D} ÷ ${a + b} = ${t} h`, solZh: `相遇时间 = 路程 ÷ 速度和 = ${D} ÷ (${a} + ${b}) = ${t}（小时）` });
    return W({ value: round(D / 5, 2), unit: 'km', en: `Two cyclists start at the same time from two villages and ride towards each other at ${a / 5} km/h and ${b / 5} km/h. They meet after ${t} hours. How far apart are the villages (km)?`,
      zh: `两人同时从两村相向骑车，速度分别是每小时 ${a / 5} 千米和 ${b / 5} 千米，${t} 小时后相遇。两村相距多少千米？`,
      solEn: `(${a / 5} + ${b / 5}) × ${t} = ${round(D / 5, 2)} km`, solZh: `(${a / 5} + ${b / 5}) × ${t} = ${round(D / 5, 2)}（千米）` });
  });
  // 追及问题 catch-up
  add(6, 2, (y, d) => {
    const v1 = R(3, 10) * 10, v2 = v1 + R(1, 5) * 10, t = R(1, 6), head = (v2 - v1) * t;
    return W({ value: t, unit: 'h', en: `A truck leaves at ${v1} km/h. Later a car follows on the same road at ${v2} km/h, starting when the truck is ${head} km ahead. How many hours does the car take to catch up?`,
      zh: `一辆货车以每小时 ${v1} 千米的速度行驶，一辆小汽车在后面 ${head} 千米处以每小时 ${v2} 千米同向追赶。几小时能追上？`,
      solEn: `Gap ÷ speed difference = ${head} ÷ (${v2} ${MINUS} ${v1}) = ${t} h`, solZh: `追及时间 = 路程差 ÷ 速度差 = ${head} ÷ (${v2} ${MINUS} ${v1}) = ${t}（小时）` });
  });
  // 火车过桥 train & bridge
  add(6, 3, (y, d) => {
    const L = R(10, 40) * 10, B = R(20, 120) * 10, v = pick([10, 15, 20, 25, 30]), tot = L + B, t = tot / v;
    if (!Number.isInteger(t)) return null;
    return W({ value: t, unit: 's', en: `A train ${L} m long travels at ${v} m/s. How many seconds does it take to cross a bridge ${B} m long completely (from the front entering to the back leaving)?`,
      zh: `一列长 ${L} 米的火车以每秒 ${v} 米的速度通过一座长 ${B} 米的大桥（从车头上桥到车尾离桥），需要多少秒？`,
      solEn: `Distance = bridge + train = ${B} + ${L} = ${tot} m; ${tot} ÷ ${v} = ${t} s`, solZh: `路程 = 桥长 + 车长 = ${B} + ${L} = ${tot}（米）；${tot} ÷ ${v} = ${t}（秒）` });
  });
  // 工程问题 work rate
  add(6, 2, (y, d) => {
    const [a, b] = pick([[3, 6], [4, 12], [6, 12], [10, 15], [12, 24], [20, 30], [6, 3], [12, 4], [15, 10], [9, 18], [8, 24], [30, 20]]), t = a * b / (a + b);
    if (d >= 3 && Math.random() < 0.5) {
      const both = R(1, Math.max(1, Math.floor(t))), restN = a * b - both * (a + b), rest = restN / a;
      if (restN <= 0) return null;
      return W({ value: rest, answer: G.fracStr(restN, a), unit: 'h', en: `Pipe A fills a tank in ${a} hours; pipe B in ${b} hours. Both run for ${both} hour(s), then A is turned off. How many more hours does B need?`,
        zh: `一个水池，甲管单独注满要 ${a} 小时，乙管单独注满要 ${b} 小时。两管同时开 ${both} 小时后关掉甲管，乙管还要几小时才能注满？`,
        solEn: `Together ${both} h fill ${both}/${a} + ${both}/${b} = ${G.fracStr(both * (a + b), a * b)}; remaining ${G.fracStr(a * b - both * (a + b), a * b)} ÷ (1/${b}) = ${G.fracStr(restN, a)} h`,
        solZh: `合作 ${both} 小时完成 ${G.fracStr(both * (a + b), a * b)}；剩下 ${G.fracStr(a * b - both * (a + b), a * b)} ÷ 1/${b} = ${G.fracStr(restN, a)}（小时）` });
    }
    return W({ value: t, answer: G.fracStr(a * b, a + b), en: `A job takes worker A ${a} days alone and worker B ${b} days alone. Working together, how many days do they take?`,
      zh: `一项工程，甲单独做要 ${a} 天完成，乙单独做要 ${b} 天完成。两人合作需要多少天完成？`,
      solEn: `Rates 1/${a} + 1/${b} = ${G.fracStr(a + b, a * b)} of the job per day; time = 1 ÷ that = ${G.fracStr(a * b, a + b)} days`, solZh: `工作效率和：1/${a} + 1/${b} = ${G.fracStr(a + b, a * b)}；时间 = 1 ÷ ${G.fracStr(a + b, a * b)} = ${G.fracStr(a * b, a + b)}（天）` });
  });
  // Singapore before–after fractions
  add(5, 2, (y, d) => {
    const a = pick([3, 4, 5, 6]), b = pick([2, 3, 4, 5]), left = (a - 1) * (b - 1), unit = R(3, 20 * d), total = a * b * unit, remain = left * unit;
    const [A] = two();
    return W({ value: total, unit: '$', en: `${A[0]} spent 1/${a} of some savings on a bag and 1/${b} of what was left on a book. $${remain} remained. How much were the savings at first?`,
      zh: `${A[1]}用存款的 1/${a} 买了一个书包，又用剩下钱的 1/${b} 买了一本书，还剩 ${remain} 元。${A[1]}原来有多少元？`,
      solEn: `After the bag: ${a - 1}/${a} left; after the book: ${b - 1}/${b} of that, i.e. ${G.fracStr(left, a * b)} of the total = $${remain}. Total = ${remain} ÷ ${G.fracStr(left, a * b)} = $${total}`,
      solZh: `剩下的是总数的 (1 ${MINUS} 1/${a}) × (1 ${MINUS} 1/${b}) = ${G.fracStr(left, a * b)}，对应 ${remain} 元；原有 ${remain} ÷ ${G.fracStr(left, a * b)} = ${total}（元）` });
  });
  // Singapore "transfer" problem: after giving, equal / ratio
  add(5, 3, (y, d) => {
    const [A, B] = two(), give = R(3, 20), endEach = R(20, 80), a = endEach + give, b = endEach - give, total = a + b;
    if (b <= 0) return null;
    return W({ value: a, en: `${A[0]} and ${B[0]} have ${total} cards altogether. After ${A[0]} gives ${give} cards to ${B[0]}, they have the same number. How many cards did ${A[0]} have at first?`,
      zh: `${A[1]}和${B[1]}一共有 ${total} 张卡片。${A[1]}给${B[1]} ${give} 张后，两人卡片一样多。${A[1]}原来有多少张？`,
      solEn: `At the end each has ${total} ÷ 2 = ${endEach}; ${A[0]} had ${endEach} + ${give} = ${a}`, solZh: `最后每人 ${total} ÷ 2 = ${endEach} 张；${A[1]}原来 ${endEach} + ${give} = ${a}（张）` });
  });
  // 利润 profit & discount
  add(6, 2, (y, d) => {
    const cost = R(4, 40) * 10, up = pick([20, 25, 30, 40, 50]), off = pick([10, 20, 25]), marked = cost * (100 + up) / 100, sale = marked * (100 - off) / 100, profit = round(sale - cost, 2);
    const ask = d >= 3 ? 'cost' : 'profit';
    if (ask === 'profit') return W({ value: profit, unit: '$', en: `A shop buys a jacket for $${cost}, marks the price ${up}% higher, then sells it at ${off}% off the marked price. How much profit does it make? (negative = loss)`,
      zh: `商店以 ${cost} 元进了一件夹克，按进价提高 ${up}% 标价，再打 ${(100 - off) / 10} 折出售。商店赚了多少元？（亏本用负数表示）`,
      solEn: `Marked ${cost} × ${(100 + up) / 100} = ${marked}; sold ${marked} × ${(100 - off) / 100} = ${round(sale, 2)}; profit ${round(sale, 2)} ${MINUS} ${cost} = ${profit}`,
      solZh: `标价 ${cost} × (1 + ${up}%) = ${marked} 元；售价 ${marked} × ${(100 - off)}% = ${round(sale, 2)} 元；利润 ${round(sale, 2)} ${MINUS} ${cost} = ${profit} 元` });
    return W({ value: cost, unit: '$', en: `A jacket is marked ${up}% above cost and sold at ${off}% off the marked price, for $${round(sale, 2)}. What was the cost price?`,
      zh: `一件夹克按成本提高 ${up}% 标价，又打 ${(100 - off) / 10} 折卖出，售价 ${round(sale, 2)} 元。成本是多少元？`,
      solEn: `cost × ${(100 + up) / 100} × ${(100 - off) / 100} = ${round(sale, 2)} → cost = ${cost}`, solZh: `设成本为 x：x × (1 + ${up}%) × ${(100 - off)}% = ${round(sale, 2)}，解得 x = ${cost}` });
  });
  // 浓度 concentration
  add(7, 2, (y, d) => {
    const m = R(2, 10) * 50, p1 = pick([10, 15, 20, 25, 30]), p2 = pick([5, 8, 10, 12, 15].filter(v => v < p1)), salt = m * p1 / 100, newTotal = salt / (p2 / 100), water = round(newTotal - m, 4);
    if (!Number.isInteger(water)) return null;
    return W({ value: water, unit: 'g', en: `${m} g of salt water is ${p1}% salt. How many grams of water must be added to make it ${p2}% salt?`,
      zh: `有含盐 ${p1}% 的盐水 ${m} 克，要把它稀释成含盐 ${p2}% 的盐水，需要加水多少克？`,
      solEn: `Salt = ${m} × ${p1}% = ${salt} g stays the same; new total = ${salt} ÷ ${p2}% = ${newTotal} g; add ${water} g`, solZh: `盐的质量不变：${m} × ${p1}% = ${salt} 克；稀释后总质量 ${salt} ÷ ${p2}% = ${newTotal} 克；加水 ${newTotal} ${MINUS} ${m} = ${water}（克）` });
  });
  // 列方程 number puzzle with an equation
  add(5, 2, (y, d) => {
    const x = R(3, 40), a = R(2, 6), b = R(1, 30);   // a·x − b = x + k
    const k = a * x - b - x;
    if (k <= 0) return null;
    return W({ value: x, en: `I think of a number. I multiply it by ${a} and subtract ${b}. The result is ${k} more than the number I first thought of. What is the number?`,
      zh: `我想了一个数，把它乘以 ${a} 再减去 ${b}，得到的结果比原数多 ${k}。这个数是多少？`,
      solEn: `Let the number be x: ${a}x ${MINUS} ${b} = x + ${k} → ${a - 1}x = ${k + b} → x = ${x}`, solZh: `设这个数为 x：${a}x ${MINUS} ${b} = x + ${k}，${a - 1}x = ${k + b}，x = ${x}` });
  });
  // 列方程 consecutive numbers
  add(6, 2, (y, d) => {
    const n = R(3, 5), step = pick([1, 2]), first = R(5, 60) * (step === 2 ? 2 : 1) + (step === 2 && Math.random() < 0.5 ? 1 : 0), sum = Array.from({ length: n }, (_, i) => first + i * step).reduce((s, v) => s + v, 0);
    const kind = step === 1 ? ['consecutive whole numbers', '个连续自然数'] : first % 2 ? ['consecutive odd numbers', '个连续奇数'] : ['consecutive even numbers', '个连续偶数'];
    return W({ value: first + (n - 1) * step, en: `The sum of ${n} ${kind[0]} is ${sum}. What is the largest of them?`, zh: `${n} ${kind[1]}的和是 ${sum}，其中最大的数是多少？`,
      solEn: `Middle value = ${sum} ÷ ${n} = ${sum / n}; the numbers are ${Array.from({ length: n }, (_, i) => first + i * step).join(', ')}`, solZh: `平均数（中间数）= ${sum} ÷ ${n} = ${sum / n}，这几个数是 ${Array.from({ length: n }, (_, i) => first + i * step).join('、')}` });
  });
  // 二元一次方程组 simultaneous (prices)
  add(7, 2, (y, d) => {
    const p = R(2, 15), q = R(2, 15), a = R(1, 5), b = R(1, 5), c = R(1, 5), e = R(1, 5);
    if (a * e - b * c === 0) return null;
    const askQ = Math.random() < 0.5;
    return W({ value: askQ ? q : p, unit: '$', en: `${a} apples and ${b} pears cost $${a * p + b * q}. ${c} apples and ${e} pears cost $${c * p + e * q}. How much does one ${askQ ? 'pear' : 'apple'} cost?`,
      zh: `${a} 个苹果和 ${b} 个梨共 ${a * p + b * q} 元，${c} 个苹果和 ${e} 个梨共 ${c * p + e * q} 元。一个${askQ ? '梨' : '苹果'}多少元？`,
      solEn: `Let an apple be x and a pear y: ${a}x + ${b}y = ${a * p + b * q}, ${c}x + ${e}y = ${c * p + e * q}. Solving: x = ${p}, y = ${q}`,
      solZh: `设苹果 x 元、梨 y 元：${a}x + ${b}y = ${a * p + b * q}，${c}x + ${e}y = ${c * p + e * q}，解得 x = ${p}，y = ${q}` });
  });
  // 鸡兔同笼 with equations / tickets
  add(7, 3, (y, d) => {
    const pa = R(8, 20), pc = R(3, pa - 2), A = R(5, 40), C = R(5, 60), n = A + C, tot = A * pa + C * pc;
    return W({ value: A, en: `Adult tickets cost $${pa} and child tickets $${pc}. ${n} tickets were sold for $${tot}. How many adult tickets were sold?`,
      zh: `成人票每张 ${pa} 元，儿童票每张 ${pc} 元。共卖出 ${n} 张票，收入 ${tot} 元。成人票卖了多少张？`,
      solEn: `Let adults = x: ${pa}x + ${pc}(${n} ${MINUS} x) = ${tot} → ${pa - pc}x = ${tot - pc * n} → x = ${A}`, solZh: `设成人票 x 张：${pa}x + ${pc}(${n} ${MINUS} x) = ${tot}，${pa - pc}x = ${tot - pc * n}，x = ${A}` });
  });
  // 往返平均速度 average speed (challenge)
  add(7, 3, (y, d) => {
    const [u, v] = pick([[30, 60], [40, 60], [20, 30], [60, 90], [12, 6], [45, 90], [10, 15], [15, 10]]), avg = 2 * u * v / (u + v);
    return W({ value: avg, answer: G.fracStr(2 * u * v, u + v), unit: 'km/h', en: `A car drives from A to B at ${u} km/h and returns along the same road at ${v} km/h. What is the average speed for the whole trip (km/h)?`,
      zh: `汽车从甲地到乙地每小时行 ${u} 千米，按原路返回时每小时行 ${v} 千米。往返的平均速度是每小时多少千米？`,
      solEn: `Take the distance as ${lcm(u, v)} km: time ${lcm(u, v) / u} + ${lcm(u, v) / v} h; average = ${2 * lcm(u, v)} ÷ ${lcm(u, v) / u + lcm(u, v) / v} = ${G.fracStr(2 * u * v, u + v)} (not the simple mean!)`,
      solZh: `设单程 ${lcm(u, v)} 千米：时间 ${lcm(u, v) / u} + ${lcm(u, v) / v} 小时；平均速度 = 总路程 ÷ 总时间 = ${2 * lcm(u, v)} ÷ ${lcm(u, v) / u + lcm(u, v) / v} = ${G.fracStr(2 * u * v, u + v)}` });
  });
  // 一元二次方程应用 area
  add(9, 2, (y, d) => {
    const w = R(3, 20), k = R(1, 9), area = w * (w + k);
    return W({ value: w, unit: 'cm', en: `A rectangle's length is ${k} cm more than its width. Its area is ${area} cm². Find the width (cm).`,
      zh: `一个长方形的长比宽多 ${k} 厘米，面积是 ${area} 平方厘米。求宽（厘米）。`,
      solEn: `x(x + ${k}) = ${area} → x² + ${k}x ${MINUS} ${area} = 0 → (x ${MINUS} ${w})(x + ${w + k}) = 0 → x = ${w}`, solZh: `设宽为 x：x(x + ${k}) = ${area}，x² + ${k}x ${MINUS} ${area} = 0，(x ${MINUS} ${w})(x + ${w + k}) = 0，x = ${w}（负根舍去）` });
  });
  // 增长率 growth (Year 9)
  add(9, 3, (y, d) => {
    const r = pick([10, 20, 25, 50]), start = R(2, 20) * 100, end = start * (1 + r / 100) ** 2;
    if (!Number.isInteger(end)) return null;
    return W({ value: r, unit: '%', en: `A shop's sales grew from $${start} to $${end} over two years, growing by the same percentage each year. What was the yearly growth rate (%)?`,
      zh: `某商店两年内销售额从 ${start} 元增长到 ${end} 元，每年的增长率相同。年增长率是百分之几？`,
      solEn: `${start}(1 + x)² = ${end} → (1 + x)² = ${end / start} → 1 + x = ${1 + r / 100} → x = ${r}%`, solZh: `设年增长率为 x：${start}(1 + x)² = ${end}，(1 + x)² = ${end / start}，x = ${r}%` });
  });

  G.register('maths', 'word', 3, (y, d) => {
    if (y < 4) { y = 4; d = 1; }   // Year 3 uses the easiest Year 4 templates
    const ok = T.filter(([my, md]) => my <= y && md <= Math.max(d, 1 + (y >= 7 ? 1 : 0)));
    // challenge/advanced: prefer the harder templates
    const pool = d >= 3 ? ok.filter(([my, md]) => md >= 2).concat(ok.filter(([my, md]) => md >= 3)) : ok;
    // avoid repeating a problem type that was used in the last few questions
    let choices = (pool.length ? pool : ok).filter(tpl => !recent.includes(tpl));
    if (!choices.length) choices = pool.length ? pool : ok;
    const tpl = pick(choices), q = tpl[2](y, d);
    if (q) { recent.push(tpl); if (recent.length > Math.min(6, ok.length - 1)) recent.shift(); }
    return q;
  }, { maxYear: 10 });
})(typeof window !== 'undefined' ? window : globalThis);
