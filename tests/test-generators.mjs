// בדיקות אוטומטיות למנוע השאלות ולמנגנון השמירה.
// הרצה (עם Node): node tests/test-generators.mjs

import { GENERATORS, TEACHER_QUESTIONS, buildBattle, TOPICS, REGION_ORDER, makeByType } from '../js/questions.js';
import { fmt, parseNum, wrapMath, esc } from '../js/util.js';
import { validOpIndices, applyOp, solve, N, O, L, R } from '../js/exprtokens.js';

let pass = 0;
const failures = [];

function check(name, cond, detail = '') {
  if (cond) { pass += 1; } else { failures.push(`${name}${detail ? ' :: ' + detail : ''}`); }
}

/* ---------- עזרים ---------- */

/** חישוב ביטוי חשבוני פשוט (רק ספרות ופעולות) */
function evalPlain(expr) {
  if (!/^[\d+\-*/() .]+$/.test(expr)) throw new Error('ביטוי לא בטוח: ' + expr);
  // eslint-disable-next-line no-new-func
  return Function(`"use strict"; return (${expr});`)();
}

function nums(story) {
  return Array.from(story.matchAll(/\[\[([\d,]+)\]\]/g)).map((m) => parseNum(m[1]));
}

/* ---------- 1. עזרי מספרים ---------- */

check('fmt: 9184 -> 9,184', fmt(9184) === '9,184', fmt(9184));
check('fmt: 1150000 -> 1,150,000', fmt(1150000) === '1,150,000', fmt(1150000));
check('fmt: 45 -> 45', fmt(45) === '45');
check('parseNum: "9,184" -> 9184', parseNum('9,184') === 9184);
check('parseNum: "" -> null', parseNum('') === null);
check('parseNum: "abc" -> null', parseNum('abc') === null);
check('parseNum(fmt(x)) === x', [0, 7, 999, 1000, 123456].every((n) => parseNum(fmt(n)) === n));

/* ---------- 1ב. עטיפת תרגילים ב-LTR בתוך טקסט עברי ---------- */

{
  const a = wrapMath(esc('12 : 4 = 3.'));
  check('עטיפת תרגיל בתוך משפט', a === '<span class="mathrun" dir="ltr">12 : 4 = 3</span>.', a);

  const b = wrapMath(esc('1 ק"ג = 1,000 גרם.'));
  check('מספר בודד לא נעטף', !b.includes('mathrun'), b);

  const c = wrapMath(esc('בדיקה: 5 + 8 × 5 = 45.'));
  check('תרגיל אחרי מילה עברית נעטף', c.includes('>5 + 8 × 5 = 45<'), c);

  const d = wrapMath(esc('5 × (4 + 5) = 45.'));
  check('סוגריים נשארים בתוך העטיפה', d.includes('>5 × (4 + 5) = 45<'), d);

  const strip = (s) => s.replace(/<[^>]+>/g, '');
  let preserved = true;
  for (const gen of GENERATORS) {
    for (let i = 0; i < 40; i++) {
      const q = gen.gen();
      for (const text of [q.hint, ...q.steps]) {
        if (strip(wrapMath(esc(text))) !== esc(text)) preserved = false;
      }
    }
  }
  check('העטיפה לא משנה את תוכן הרמזים והפתרונות', preserved);
}

/* ---------- 1ג. סדר פעולות: איזו פעולה מותר לחשב ---------- */

{
  // 30 − 6 : 6  -> רק החילוק
  const t1 = [N(30), O('−'), N(6), O(':'), N(6)];
  check('חילוק לפני חיסור', JSON.stringify(validOpIndices(t1)) === '[3]', JSON.stringify(validOpIndices(t1)));

  // (50 : 5) + (8 × 8) -> שני זוגות הסוגריים מותרים
  const t2 = [L(), N(50), O(':'), N(5), R(), O('+'), L(), N(8), O('×'), N(8), R()];
  check('שני זוגות סוגריים מותרים', JSON.stringify(validOpIndices(t2)) === '[2,8]', JSON.stringify(validOpIndices(t2)));

  // (3 + 4) × 5 -> רק מה שבסוגריים
  const t3 = [L(), N(3), O('+'), N(4), R(), O('×'), N(5)];
  check('סוגריים לפני כפל', JSON.stringify(validOpIndices(t3)) === '[2]', JSON.stringify(validOpIndices(t3)));

  // 24 : 6 : 2 -> רק השמאלי ביותר
  const t4 = [N(24), O(':'), N(6), O(':'), N(2)];
  check('ברצף חילוקים מתחילים משמאל', JSON.stringify(validOpIndices(t4)) === '[1]', JSON.stringify(validOpIndices(t4)));

  // 20 : 4 + 18 : 6 -> שני החילוקים מותרים
  const t5 = [N(20), O(':'), N(4), O('+'), N(18), O(':'), N(6)];
  check('שני חילוקים נפרדים מותרים', JSON.stringify(validOpIndices(t5)) === '[1,5]', JSON.stringify(validOpIndices(t5)));

  check('פתרון מלא: 30 − 6 : 6 = 29', solve(t1).answer === 29);
  check('פתרון מלא: (50:5)+(8×8) = 74', solve(t2).answer === 74);
  check('פתרון מלא: (3+4)×5 = 35', solve(t3).answer === 35);
  check('צעדי הפתרון מתועדים', solve(t2).steps.length === 3, JSON.stringify(solve(t2).steps));

  const r = applyOp(t3, 2);
  check('סוגריים מיותרים נעלמים', r.tokens.length === 3 && r.tokens[0].v === 7, JSON.stringify(r.tokens));
}

/* ---------- 2. תקינות כללית של כל גנרטור ---------- */

const RUNS = 250;
const NO_EXPR_UIS = ['numberline_fill', 'numberline_locate', 'divisibility', 'explain'];

for (const gen of GENERATORS) {
  let structureOk = true;
  let mathOk = true;
  let formatOk = true;
  let badDetail = '';

  for (let i = 0; i < RUNS; i++) {
    const q = gen.gen();

    // --- מבנה כללי ---
    const answerOk = Number.isInteger(q.answer) ? q.answer >= 0 : typeof q.answer === 'string' && q.answer.length > 0;
    if (!answerOk) { structureOk = false; badDetail = `answer=${q.answer}`; }
    if (!q.hint || typeof q.hint !== 'string') { structureOk = false; badDetail = 'אין רמז'; }
    if (!Array.isArray(q.steps) || q.steps.length === 0) { structureOk = false; badDetail = 'אין פתרון מלא'; }
    if (!TOPICS[q.topic]) { structureOk = false; badDetail = `נושא לא מוכר: ${q.topic}`; }
    if (q.ui === 'mission' && !q.story) { structureOk = false; badDetail = 'אין סיפור למשימה'; }
    if (!q.expr && !q.story && !NO_EXPR_UIS.includes(q.ui)) { structureOk = false; badDetail = 'אין ביטוי'; }

    // --- תצוגה ---
    const shown = [q.expr || '', q.story || '', q.instruction || ''].join(' ');
    if (/[*/]/.test(shown)) { formatOk = false; badDetail = `סימן לא תקין בתצוגה: ${shown}`; }
    if (/\d{4,}/.test(shown.replace(/,/g, '###'))) {
      formatOk = false;
      badDetail = `מספר בן 4 ספרות ללא מפרידי אלפים: ${shown}`;
    }
    if (Number.isInteger(q.answer) && !/^\d{1,3}(,\d{3})*$/.test(fmt(q.answer))) {
      formatOk = false; badDetail = `פורמט תשובה: ${fmt(q.answer)}`;
    }

    // --- נכונות מתמטית, לפי סוג הממשק ---
    try {
      if (q.ui === 'mission') {
        const n = nums(q.story);
        let expected;
        switch (q.type) {
          case 'word_diff': expected = n[1] - n[0]; break;
          case 'word_budget': expected = n[0] - n[1]; break;
          case 'word_half_half': expected = n[0] / 4; break;
          case 'word_multi_buy': expected = n[0] * n[1]; break;
          case 'word_buy_remain': expected = n[0] - n[1] * n[2]; break;
          default: expected = q.answer;
        }
        if (expected !== q.answer) { mathOk = false; badDetail = `${q.type}: ציפינו ל-${expected}, קיבלנו ${q.answer}`; }
      } else if (q.ui === 'numberline_fill') {
        const vals = q.stones.map((s) => s.value);
        const blanks = q.stones.map((s, k) => (s.blank ? k : -1)).filter((k) => k >= 0);
        if (!vals.every((v, k) => k === 0 || v - vals[k - 1] === q.step)) { mathOk = false; badDetail = 'הקפיצות לא שוות'; }
        if (blanks.includes(0) || blanks.includes(vals.length - 1)) { mathOk = false; badDetail = 'האבן הראשונה/אחרונה ריקה'; }
        if (JSON.stringify(q.answers) !== JSON.stringify(blanks.map((k) => vals[k]))) { mathOk = false; badDetail = 'תשובות לא תואמות לאבנים'; }
      } else if (q.ui === 'numberline_locate') {
        if (q.stones[q.correctIndex].value !== q.target || q.answer !== q.target) {
          mathOk = false; badDetail = 'המיקום המסומן לא תואם את המספר';
        }
      } else if (q.ui === 'orderops') {
        const s = solve(q.tokens);
        if (s.answer !== q.answer) { mathOk = false; badDetail = `tokens -> ${s.answer} אבל answer=${q.answer}`; }
      } else if (q.ui === 'distribute') {
        if (q.a * q.b !== q.answer) { mathOk = false; badDetail = 'a×b לא שווה לתשובה'; }
        if (!q.splits.every(([x, y]) => x + y === q.b && x > 0 && y > 0)) { mathOk = false; badDetail = 'פיצול לא תקין'; }
      } else if (q.ui === 'divisibility') {
        const digits = q.digitsShown;
        const pos = digits.indexOf(null);
        for (let d = 0; d <= 9; d++) {
          if (pos === 0 && d === 0) continue;
          const n = Number(digits.map((x, k) => (k === pos ? d : x)).join(''));
          const divides = n % q.divisor === 0;
          if (divides !== q.validDigits.includes(d)) {
            mathOk = false; badDetail = `${n} : ${q.divisor} - סיווג שגוי לספרה ${d}`;
          }
        }
        if (!q.validDigits.length) { mathOk = false; badDetail = 'אין אף ספרה מתאימה'; }
      } else if (q.ui === 'explain') {
        const correct = q.options.filter((o) => o.correct);
        if (q.options.length !== 3) { mathOk = false; badDetail = 'צריך בדיוק 3 הסברים'; }
        if (correct.length !== 1) { mathOk = false; badDetail = 'צריך בדיוק הסבר נכון אחד'; }
        if (q.stage1.kind === 'choice' && !q.stage1.choices.includes(q.answer)) {
          mathOk = false; badDetail = 'התשובה לא נמצאת בין האפשרויות';
        }
      } else if (q.exprPlain.includes('=')) {
        const [lhs, rhs] = q.exprPlain.split('=');
        const left = evalPlain(lhs.replace(/x/g, `(${q.answer})`));
        const right = evalPlain(rhs.replace(/x/g, `(${q.answer})`));
        if (left !== right) { mathOk = false; badDetail = `${q.exprPlain} עם x=${q.answer}: ${left} ≠ ${right}`; }
      } else {
        const v = evalPlain(q.exprPlain);
        if (v !== q.answer) { mathOk = false; badDetail = `${q.exprPlain} = ${v}, אבל התשובה שנשמרה היא ${q.answer}`; }
      }
    } catch (e) {
      mathOk = false;
      badDetail = `שגיאת חישוב: ${e.message}`;
    }
  }

  check(`מבנה תקין: ${gen.type}`, structureOk, badDetail);
  check(`חשבון נכון: ${gen.type}`, mathOk, badDetail);
  check(`תצוגה תקינה: ${gen.type}`, formatOk, badDetail);
}

/* ---------- 3. בדיקות ייעודיות לכללי הנושאים ---------- */

const byType = (t) => GENERATORS.find((g) => g.type === t).gen;

{
  let ok = true;
  for (let i = 0; i < 300; i++) {
    const q = byType('mult_table')();
    const [a, b] = q.exprPlain.split('*').map(Number);
    if (a < 2 || a > 10 || b < 2 || b > 10) ok = false;
  }
  check('לוח הכפל בטווח 2-10', ok);
}

{
  let ok = true;
  for (let i = 0; i < 300; i++) {
    const q = byType('add4')();
    const [a, b] = q.exprPlain.split('+').map(Number);
    if (a % 10 + b % 10 < 10) ok = false;
    if (a > 9999 || b > 9999) ok = false;
  }
  check('חיבור עם המרה ביחידות, עד 4 ספרות', ok);
}

{
  let ok = true;
  for (let i = 0; i < 300; i++) {
    const q = byType('sub4')();
    const [a, b] = q.exprPlain.split('-').map(Number);
    if (a <= b || a % 10 >= b % 10) ok = false;
  }
  check('חיסור עם פריטה ותוצאה חיובית', ok);
}

{
  let ok = true;
  for (let i = 0; i < 200; i++) {
    const q = byType('mult_round_tens')();
    const [, tens] = q.exprPlain.split('*').map(Number);
    if (tens % 10 !== 0) ok = false;
  }
  check('כפל בעשרות שלמות', ok);
}

{
  let ok = true;
  for (let i = 0; i < 400; i++) {
    const q = byType('order_ops')();
    if (!Number.isInteger(q.answer)) ok = false;
    for (const m of q.exprPlain.matchAll(/(\d+)\/(\d+)/g)) {
      if (Number(m[1]) % Number(m[2]) !== 0) ok = false;
    }
  }
  check('סדר פעולות: חילוק ללא שארית', ok);
}

{
  let ok = true;
  for (let i = 0; i < 300; i++) {
    const q = byType('order_ops_tap')();
    if (!Number.isInteger(q.answer) || q.answer < 0) ok = false;
    if (!validOpIndices(q.tokens).length) ok = false;
  }
  check('סדר פעולות בהקשה: תמיד יש פעולה חוקית ותשובה שלמה', ok);
}

{
  let ok = true;
  for (let i = 0; i < 300; i++) {
    const q = byType('weight')();
    if (q.unit !== 'גרם' || !q.exprRtl) ok = false;
    if (evalPlain(q.exprPlain) !== q.answer) ok = false;
  }
  check('יחידות משקל: 1 ק"ג = 1,000 גרם', ok);
}

{
  let ok = true;
  let sawMulti = false;
  for (let i = 0; i < 300; i++) {
    const q = byType('divisibility')();
    if (![2, 3, 5, 6, 10].includes(q.divisor)) ok = false;
    if (q.digitsShown.filter((d) => d === null).length !== 1) ok = false;
    if (q.validDigits.length > 1) sawMulti = true;
  }
  check('התחלקות: ספרה חסרה אחת ומחלק מוכר', ok);
  check('התחלקות: יש שאלות עם כמה תשובות נכונות', sawMulti);
}

{
  let ok = true;
  for (let i = 0; i < 200; i++) {
    const q = byType('distribute_missing')();
    const [lhs, rhs] = q.exprPlain.split('=');
    if (evalPlain(lhs) !== evalPlain(rhs.replace(/x/g, `(${q.answer})`))) ok = false;
  }
  check('פילוג: שני החלקים משלימים את המספר', ok);
}

{
  const seen = new Set();
  for (let i = 0; i < 400; i++) seen.add(byType('word_shirts')().answer);
  check('שאלת החולצות מייצרת כן / לא / תלוי', seen.size === 3, [...seen].join(','));
}

{
  let ok = true;
  let dupes = false;
  for (let i = 0; i < 300; i++) {
    const q = byType('distribute_split')();
    const keys = q.splits.map(([x, y]) => [x, y].sort((m, n) => m - n).join('+'));
    if (new Set(keys).size !== keys.length) dupes = true;
    if (q.splits.length < 2) ok = false;
  }
  check('פילוג: לפחות שתי אפשרויות פיצול', ok);
  check('פילוג: אין אפשרויות פיצול כפולות', !dupes);
}

{
  let ok = true;
  for (let i = 0; i < 300; i++) {
    const q = byType('numberline_fill')();
    const innerCount = q.stones.length - 2;
    const blanks = q.stones.filter((s) => s.blank).length;
    if (blanks < 1 || blanks >= innerCount + 1) ok = false;
    if (blanks >= innerCount && innerCount > 1) ok = false; // תמיד נשארת אבן פנימית גלויה
  }
  check('ישר המספרים: תמיד נשארת אבן פנימית גלויה', ok);
}

/* ---------- 4. שאלות המורה ---------- */

const TEACHER_EXPECTED = {
  teacher_mult_1: 2250, teacher_mult_2: 336, teacher_mult_3: 1920, teacher_mult_4: 1300,
  teacher_add: 12643, teacher_sub: 5725,
  teacher_order_1: 29, teacher_order_2: 74,
  teacher_missing_1: 8, teacher_missing_2: 4, teacher_missing_3: 7, teacher_missing_4: 0,
  teacher_weight_1: 1096, teacher_weight_2: 2112, teacher_weight_3: 996, teacher_weight_4: 990,
  teacher_word_1: 125000, teacher_word_2: 81000, teacher_word_3: 50,
  teacher_numberline_1: 4000, teacher_numberline_2: 5800,
  teacher_dist_1: 2, teacher_dist_2: 10, teacher_dist_3: 7, teacher_dist_4: 8, teacher_dist_5: 7,
  teacher_div_1: 0, teacher_div_2: 1,
  teacher_insight_1: 1620, teacher_insight_2: 405, teacher_insight_3: 2,
  teacher_shirts: 'כן',
};

let teacherOk = true;
let teacherDetail = '';
for (const make of TEACHER_QUESTIONS) {
  const q = make();
  if (TEACHER_EXPECTED[q.type] === undefined) { teacherOk = false; teacherDetail = `סוג לא מוכר: ${q.type}`; continue; }
  if (q.answer !== TEACHER_EXPECTED[q.type]) { teacherOk = false; teacherDetail = `${q.type}: ${q.answer} במקום ${TEACHER_EXPECTED[q.type]}`; }
  if (q.exprPlain && !q.exprPlain.includes('=')) {
    const v = evalPlain(q.exprPlain);
    if (v !== q.answer) { teacherOk = false; teacherDetail = `${q.type}: ${q.exprPlain}=${v}`; }
  }
  if (q.exprPlain && q.exprPlain.includes('=') && q.exprPlain.includes('x')) {
    const [lhs, rhs] = q.exprPlain.split('=');
    if (evalPlain(lhs.replace(/x/g, `(${q.answer})`)) !== evalPlain(rhs.replace(/x/g, `(${q.answer})`))) {
      teacherOk = false; teacherDetail = `${q.type}: שני האגפים לא שווים`;
    }
  }
  if (!q.steps.length || !q.hint) { teacherOk = false; teacherDetail = `${q.type}: חסר רמז/פתרון`; }
}
check(`שאלות המורה (${TEACHER_QUESTIONS.length} שאלות)`, teacherOk, teacherDetail);

// אימות ידני של שתי שאלות ההתחלקות מדף המורה
{
  const d1 = TEACHER_QUESTIONS.map((f) => f()).find((q) => q.type === 'teacher_div_1');
  const d2 = TEACHER_QUESTIONS.map((f) => f()).find((q) => q.type === 'teacher_div_2');
  check('5?6 מתחלק ב-2 עבור כל ספרה', d1.validDigits.length === 10 && [0, 5, 9].every((d) => (500 + d * 10 + 6) % 2 === 0));
  check('3?2 מתחלק ב-6 עבור 1, 4, 7', JSON.stringify(d2.validDigits) === '[1,4,7]'
    && [1, 4, 7].every((d) => (300 + d * 10 + 2) % 6 === 0)
    && [0, 2, 3, 5, 6, 8, 9].every((d) => (300 + d * 10 + 2) % 6 !== 0));
}

check('makeByType מוצא גנרטור', makeByType('mult_table')?.topic === 'mult_table');
check('makeByType מוצא שאלת מורה', makeByType('teacher_add')?.answer === 12643);
check('makeByType מחזיר null לסוג לא מוכר', makeByType('אין_כזה') === null);

/* ---------- 5. בניית קרב ---------- */

{
  const fakeSave = { stats: { byTopic: { mult_table: { answered: 10, firstTry: 2, correct: 2, wrong: 8 } } }, reviewQueue: [] };
  let ok = true;
  let sawTeacher = 0;
  for (let i = 0; i < 100; i++) {
    const b = buildBattle(fakeSave, { count: 5 });
    if (b.length !== 5) ok = false;
    if (new Set(b.map((q) => q.qid)).size !== 5) ok = false;
    if (b.some((q) => q.answer === undefined || q.answer === null)) ok = false;
    if (b.some((q) => q.source === 'teacher')) sawTeacher += 1;
  }
  check('קרב = 5 שאלות תקינות', ok);
  check('כל קרב כולל שאלה מדף המורה', sawTeacher === 100, `${sawTeacher}/100`);

  // קרב באזור מסוים
  let topicOk = true;
  for (const topic of REGION_ORDER) {
    for (let i = 0; i < 12; i++) {
      const b = buildBattle(fakeSave, { count: 5, topic });
      if (b.length !== 5) { topicOk = false; }
      if (b.some((q) => q.topic !== topic)) { topicOk = false; }
    }
  }
  check(`קרב אזורי מביא רק שאלות מהנושא (${REGION_ORDER.length} אזורים)`, topicOk);

  // תור החזרה
  const withQueue = {
    stats: { byTopic: {} },
    reviewQueue: [{ type: 'add4', topic: 'add_sub' }, { type: 'teacher_order_1', topic: 'order_ops' }],
  };
  let reviewHits = 0;
  for (let i = 0; i < 40; i++) {
    const b = buildBattle(withQueue, { count: 5 });
    if (b.filter((q) => q.fromReview).length === 2) reviewHits += 1;
  }
  check('שאלות מתור החזרה חוזרות בקרב', reviewHits === 40, `${reviewHits}/40`);

  const regen = buildBattle(withQueue, { count: 5 }).find((q) => q.type === 'add4');
  check('שאלת חזרה נוצרת מחדש עם מספרים אחרים', Boolean(regen && regen.expr));
}

check('לכל אזור במפה יש נושא מוגדר', REGION_ORDER.every((id) => TOPICS[id] && TOPICS[id].region && TOPICS[id].icon));
check('לכל נושא יש לפחות גנרטור אחד', REGION_ORDER.every((id) => GENERATORS.some((g) => g.topic === id)));

/* ---------- 6. שמירה, מיגרציה וגיבוי ---------- */

const store = new Map();
globalThis.window = {
  localStorage: {
    getItem: (k) => (store.has(k) ? store.get(k) : null),
    setItem: (k, v) => store.set(k, String(v)),
    removeItem: (k) => store.delete(k),
  },
};

const storage = await import('../js/storage.js');

{
  const s = storage.load();
  check('שמירה חדשה תקינה כשהאחסון ריק', s.schemaVersion === 1 && s.player.coins === 0);

  storage.update((st) => { st.player.name = 'אריאל'; st.player.coins = 120; st.inventory.owned.push('w_sword'); });
  check('שמירה נכתבת לאחסון', store.size === 1);

  const old = { player: { name: 'דני', coins: 77, xp: 250 }, inventory: { owned: ['h_iron'] } };
  const migrated = storage.migrate(old);
  check('מיגרציה: שומרת מטבעות', migrated.player.coins === 77);
  check('מיגרציה: שומרת ציוד', migrated.inventory.owned.includes('h_iron'));
  check('מיגרציה: מוסיפה שדות חדשים', migrated.stats && migrated.stats.byTopic && migrated.reviewQueue.length === 0);
  check('מיגרציה: שדות חדשים משלב 2', migrated.records && migrated.records.lightningBest === 0);
  check('מיגרציה: מעדכנת גרסה', migrated.schemaVersion === 1);

  const text = storage.exportText();
  check('ייבוא גיבוי תקין', storage.importText(text).ok === true);
  check('ייבוא טקסט פגום נכשל בעדינות', storage.importText('לא json').ok === false);
  check('ייבוא אובייקט לא רלוונטי נכשל', storage.importText('{"a":1}').ok === false);
  check('הנתונים שרדו את הייצוא/ייבוא', storage.getState().player.name === 'אריאל' && storage.getState().player.coins === 120);

  storage.resetAll();
  check('איפוס מנקה הכל', storage.getState().player.name === '' && storage.getState().player.coins === 0);
}

/* ---------- סיכום ---------- */

console.log(`\n✔ עברו: ${pass}`);
if (failures.length) {
  console.log(`✘ נכשלו: ${failures.length}`);
  failures.forEach((f) => console.log('   - ' + f));
  process.exitCode = 1;
} else {
  console.log('כל הבדיקות עברו בהצלחה.');
}
