// בדיקות אוטומטיות למנוע השאלות ולמנגנון השמירה.
// הרצה (עם Node): node tests/test-generators.mjs

import { GENERATORS, TEACHER_QUESTIONS, buildBattle, TOPICS } from '../js/questions.js';
import { fmt, parseNum, wrapMath, esc } from '../js/util.js';

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

  // הטקסט עצמו לא משתנה - רק נוספות עטיפות
  const strip = (s) => s.replace(/<[^>]+>/g, '');
  let preserved = true;
  for (const gen of GENERATORS) {
    for (let i = 0; i < 40; i++) {
      const q = gen.gen();
      for (const text of [q.hint, ...q.steps]) {
        if (strip(wrapMath(esc(text))) !== esc(text)) { preserved = false; }
      }
    }
  }
  check('העטיפה לא משנה את תוכן הרמזים והפתרונות', preserved);
}

/* ---------- 2. תקינות כללית של כל גנרטור ---------- */

const RUNS = 300;

for (const gen of GENERATORS) {
  let structureOk = true;
  let mathOk = true;
  let formatOk = true;
  let badDetail = '';

  for (let i = 0; i < RUNS; i++) {
    const q = gen.gen();

    // מבנה
    if (!Number.isInteger(q.answer) || q.answer < 0) { structureOk = false; badDetail = `answer=${q.answer}`; }
    if (!q.hint || typeof q.hint !== 'string') { structureOk = false; badDetail = 'אין רמז'; }
    if (!Array.isArray(q.steps) || q.steps.length === 0) { structureOk = false; badDetail = 'אין פתרון מלא'; }
    if (!TOPICS[q.topic]) { structureOk = false; badDetail = `נושא לא מוכר: ${q.topic}`; }
    if (q.ui === 'mission') {
      if (!q.story) { structureOk = false; badDetail = 'אין סיפור למשימה'; }
    } else if (!q.expr) { structureOk = false; badDetail = 'אין ביטוי'; }

    // תצוגה: אסור סימני * או / בטקסט המוצג, וחובה מפרידי אלפים
    const shown = q.ui === 'mission' ? q.story : q.expr;
    if (/[*/]/.test(shown)) { formatOk = false; badDetail = `סימן לא תקין בתצוגה: ${shown}`; }
    if (/\d{4,}/.test(shown.replace(/,/g, '###'))) {
      formatOk = false;
      badDetail = `מספר בן 4 ספרות ללא מפרידי אלפים: ${shown}`;
    }
    if (!/^\d{1,3}(,\d{3})*$/.test(fmt(q.answer))) { formatOk = false; badDetail = `פורמט תשובה: ${fmt(q.answer)}`; }

    // נכונות מתמטית - חישוב עצמאי
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
      } else if (q.exprPlain.includes('=')) {
        // תרגיל עם נעלם: מציבים את התשובה ובודקים שוויון
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

// לוח הכפל: רק מספרים 2-10
{
  let ok = true;
  for (let i = 0; i < 300; i++) {
    const q = GENERATORS.find((g) => g.type === 'mult_table').gen();
    const [a, b] = q.exprPlain.split('*').map(Number);
    if (a < 2 || a > 10 || b < 2 || b > 10) ok = false;
  }
  check('לוח הכפל בטווח 2-10', ok);
}

// חיבור 4 ספרות: חייבת להיות המרה ביחידות
{
  let ok = true;
  for (let i = 0; i < 300; i++) {
    const q = GENERATORS.find((g) => g.type === 'add4').gen();
    const [a, b] = q.exprPlain.split('+').map(Number);
    if (a % 10 + b % 10 < 10) ok = false;
    if (a > 9999 || b > 9999) ok = false;
  }
  check('חיבור עם המרה ביחידות, עד 4 ספרות', ok);
}

// חיסור: תוצאה חיובית + פריטה
{
  let ok = true;
  for (let i = 0; i < 300; i++) {
    const q = GENERATORS.find((g) => g.type === 'sub4').gen();
    const [a, b] = q.exprPlain.split('-').map(Number);
    if (a <= b) ok = false;
    if (a % 10 >= b % 10) ok = false;
  }
  check('חיסור עם פריטה ותוצאה חיובית', ok);
}

// כפל בעשרות שלמות: הגורם השני מתחלק ב-10
{
  let ok = true;
  for (let i = 0; i < 200; i++) {
    const q = GENERATORS.find((g) => g.type === 'mult_round_tens').gen();
    const [, tens] = q.exprPlain.split('*').map(Number);
    if (tens % 10 !== 0) ok = false;
  }
  check('כפל בעשרות שלמות', ok);
}

// סדר פעולות: חילוק תמיד מדויק (בלי שברים)
{
  let ok = true;
  for (let i = 0; i < 400; i++) {
    const q = GENERATORS.find((g) => g.type === 'order_ops').gen();
    if (!Number.isInteger(q.answer)) ok = false;
    for (const m of q.exprPlain.matchAll(/(\d+)\/(\d+)/g)) {
      if (Number(m[1]) % Number(m[2]) !== 0) ok = false;
    }
  }
  check('סדר פעולות: חילוק ללא שארית', ok);
}

// משקל: תמיד מול 1,000 גרם לקילו
{
  let ok = true;
  for (let i = 0; i < 300; i++) {
    const q = GENERATORS.find((g) => g.type === 'weight').gen();
    if (q.unit !== 'גרם') ok = false;
    if (!q.exprRtl) ok = false;
    if (evalPlain(q.exprPlain) !== q.answer) ok = false;
  }
  check('יחידות משקל: 1 ק"ג = 1,000 גרם', ok);
}

/* ---------- 4. שאלות המורה ---------- */

const TEACHER_EXPECTED = {
  teacher_mult_1: 2250, teacher_mult_2: 336, teacher_mult_3: 1920, teacher_mult_4: 1300,
  teacher_add: 12643, teacher_sub: 5725,
  teacher_order_1: 29, teacher_order_2: 74,
  teacher_missing_1: 8, teacher_missing_2: 4, teacher_missing_3: 7, teacher_missing_4: 0,
  teacher_weight_1: 1096, teacher_weight_2: 2112, teacher_weight_3: 996, teacher_weight_4: 990,
  teacher_word_1: 125000, teacher_word_2: 81000, teacher_word_3: 50,
};

let teacherOk = true;
let teacherDetail = '';
for (const make of TEACHER_QUESTIONS) {
  const q = make();
  if (TEACHER_EXPECTED[q.type] === undefined) { teacherOk = false; teacherDetail = `סוג לא מוכר: ${q.type}`; continue; }
  if (q.answer !== TEACHER_EXPECTED[q.type]) { teacherOk = false; teacherDetail = `${q.type}: ${q.answer} במקום ${TEACHER_EXPECTED[q.type]}`; }
  if (!q.exprPlain.includes('=') && q.exprPlain) {
    const v = evalPlain(q.exprPlain);
    if (v !== q.answer) { teacherOk = false; teacherDetail = `${q.type}: ${q.exprPlain}=${v}`; }
  }
  if (!q.steps.length || !q.hint) { teacherOk = false; teacherDetail = `${q.type}: חסר רמז/פתרון`; }
}
check(`שאלות המורה (${TEACHER_QUESTIONS.length} שאלות)`, teacherOk, teacherDetail);

/* ---------- 5. בניית קרב ---------- */

{
  const fakeSave = { stats: { byTopic: { mult_table: { answered: 10, firstTry: 2, correct: 2, wrong: 8 } } } };
  let ok = true;
  let sawTeacher = 0;
  for (let i = 0; i < 100; i++) {
    const b = buildBattle(fakeSave, 5);
    if (b.length !== 5) ok = false;
    if (new Set(b.map((q) => q.qid)).size !== 5) ok = false;
    if (b.some((q) => !Number.isInteger(q.answer))) ok = false;
    if (b.some((q) => q.source === 'teacher')) sawTeacher += 1;
  }
  check('קרב = 5 שאלות תקינות', ok);
  check('כל קרב כולל שאלה מדף המורה', sawTeacher === 100, `${sawTeacher}/100`);
}

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

  // מיגרציה משמירה ישנה בלי גרסה ובלי שדות חדשים
  const old = { player: { name: 'דני', coins: 77, xp: 250 }, inventory: { owned: ['h_iron'] } };
  const migrated = storage.migrate(old);
  check('מיגרציה: שומרת מטבעות', migrated.player.coins === 77);
  check('מיגרציה: שומרת ציוד', migrated.inventory.owned.includes('h_iron'));
  check('מיגרציה: מוסיפה שדות חדשים', migrated.stats && migrated.stats.byTopic && migrated.reviewQueue.length === 0);
  check('מיגרציה: מעדכנת גרסה', migrated.schemaVersion === 1);

  // ייצוא וייבוא
  const text = storage.exportText();
  const res = storage.importText(text);
  check('ייבוא גיבוי תקין', res.ok === true);
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
