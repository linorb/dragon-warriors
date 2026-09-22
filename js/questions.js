// questions.js - מנוע השאלות: כל סוג שאלה הוא גנרטור שמייצר מספרים חדשים בכל פעם.
// כל שאלה מחזירה: נוסח, תשובה נכונה, רמז, ופתרון מלא בשלבים.

import { ri, pick, shuffle, weightedPick, fmt } from './util.js';

/* ============================ נושאים ============================ */

export const TOPICS = {
  mult_table: { id: 'mult_table', name: 'לוח הכפל', region: 'הר לוח הכפל' },
  mult_big: { id: 'mult_big', name: 'כפל מספרים גדולים', region: 'מכרות הכפל' },
  add_sub: { id: 'add_sub', name: 'חיבור וחיסור עם המרה', region: 'גשר המספרים' },
  order_ops: { id: 'order_ops', name: 'סדר פעולות חשבון', region: 'מגדל הפעולות' },
  missing: { id: 'missing', name: 'המספר החסר', region: 'מערת החידות' },
  weight: { id: 'weight', name: 'יחידות משקל', region: 'שוק המאזניים' },
  word: { id: 'word', name: 'שאלות מילוליות', region: 'כפר המשימות' },
};

/* ============================ עזרים ============================ */

let seq = 0;

/** בניית אובייקט שאלה אחיד */
function Q(o) {
  seq += 1;
  return {
    qid: `q${seq}`,
    ui: 'numeric',
    unit: '',
    instruction: 'פתרו את התרגיל:',
    expr: '',
    exprPlain: '',
    story: '',
    source: 'generated',
    ...o,
  };
}

/** תרגיל כפל ארוך מוצג כטקסט LTR */
function mulExpr(a, b) {
  return `${fmt(a)} × ${fmt(b)} = ?`;
}

/** קפיצות לוח הכפל לרמז */
function jumps(a, b) {
  const list = [];
  for (let i = 1; i <= b; i++) list.push(a * i);
  return list.join(', ');
}

/* ============================ גנרטורים ============================ */

/* --- לוח הכפל --- */
function genMultTable() {
  // דגש על הטבלאות הקשות (6-9)
  const a = pick([2, 3, 4, 5, 6, 6, 7, 7, 8, 8, 9, 9, 10]);
  const b = pick([2, 3, 4, 5, 6, 6, 7, 7, 8, 8, 9, 9, 10]);
  const ans = a * b;
  return Q({
    type: 'mult_table',
    topic: 'mult_table',
    instruction: 'לוח הכפל - פתרו:',
    expr: mulExpr(a, b),
    exprPlain: `${a}*${b}`,
    answer: ans,
    hint: `אפשר לחשוב על ${fmt(a)} קפיצות של ${fmt(b)}, או להיעזר בתרגיל קרוב: ${fmt(a)} × ${fmt(b - 1)} = ${fmt(a * (b - 1))}, ועכשיו מוסיפים עוד ${fmt(a)}.`,
    steps: [
      `סופרים בקפיצות של ${fmt(a)}: ${jumps(a, b)}.`,
      `עצרנו אחרי ${fmt(b)} קפיצות, ולכן ${fmt(a)} × ${fmt(b)} = ${fmt(ans)}.`,
    ],
  });
}

/* --- כפל דו-ספרתי בעשרות עגולות: 32×60, 26×50 --- */
function genMultRoundTens() {
  const a = ri(12, 49);
  const tens = pick([20, 30, 40, 50, 60, 70, 80, 90]);
  const d = tens / 10;
  const ans = a * tens;
  return Q({
    type: 'mult_round_tens',
    topic: 'mult_big',
    instruction: 'כפל בעשרות שלמות:',
    expr: mulExpr(a, tens),
    exprPlain: `${a}*${tens}`,
    answer: ans,
    hint: `${fmt(tens)} זה ${fmt(d)} × 10. כפלו קודם ב-${fmt(d)} ואז הוסיפו אפס בסוף.`,
    steps: [
      `${fmt(tens)} = ${fmt(d)} × 10.`,
      `${fmt(a)} × ${fmt(d)} = ${fmt(a * d)}.`,
      `מוסיפים אפס (כופלים ב-10): ${fmt(a * d)} × 10 = ${fmt(ans)}.`,
    ],
  });
}

/* --- כפל דו-ספרתי בחד-ספרתי: 56×6 --- */
function genMultByUnit() {
  const a = ri(13, 98);
  const b = ri(3, 9);
  const ans = a * b;
  const tensPart = Math.floor(a / 10) * 10;
  const unitsPart = a % 10;
  return Q({
    type: 'mult_by_unit',
    topic: 'mult_big',
    instruction: 'פתרו את התרגיל:',
    expr: mulExpr(a, b),
    exprPlain: `${a}*${b}`,
    answer: ans,
    hint: `פרקו את ${fmt(a)} ל-${fmt(tensPart)} + ${fmt(unitsPart)}, וכפלו כל חלק ב-${fmt(b)}.`,
    steps: [
      `${fmt(a)} = ${fmt(tensPart)} + ${fmt(unitsPart)}.`,
      `${fmt(tensPart)} × ${fmt(b)} = ${fmt(tensPart * b)}.`,
      `${fmt(unitsPart)} × ${fmt(b)} = ${fmt(unitsPart * b)}.`,
      `מחברים: ${fmt(tensPart * b)} + ${fmt(unitsPart * b)} = ${fmt(ans)}.`,
    ],
  });
}

/* --- חיבור עד 4 ספרות עם המרה --- */
function genAdd4() {
  let a, b;
  do {
    a = ri(1005, 9899);
    b = ri(1005, 9899);
  } while ((a % 10) + (b % 10) < 10); // לוודא שיש המרה לפחות ביחידות
  const ans = a + b;
  return Q({
    type: 'add4',
    topic: 'add_sub',
    instruction: 'חיבור עם המרה:',
    expr: `${fmt(a)} + ${fmt(b)} = ?`,
    exprPlain: `${a}+${b}`,
    answer: ans,
    hint: `סדרו מאונך: יחידות מתחת ליחידות. ${a % 10} + ${b % 10} = ${(a % 10) + (b % 10)} - כותבים ${((a % 10) + (b % 10)) % 10} וממירים 1 לעשרות.`,
    steps: [
      `מחברים יחידות: ${a % 10} + ${b % 10} = ${(a % 10) + (b % 10)}.`,
      `מחברים עשרות, מאות ואלפים, וזוכרים את ההמרות.`,
      `סך הכל: ${fmt(a)} + ${fmt(b)} = ${fmt(ans)}.`,
    ],
  });
}

/* --- חיסור עד 4 ספרות עם פריטה --- */
function genSub4() {
  let a, b;
  do {
    a = ri(3005, 9899);
    b = ri(1005, a - 500);
  } while ((a % 10) >= (b % 10)); // לוודא פריטה
  const ans = a - b;
  return Q({
    type: 'sub4',
    topic: 'add_sub',
    instruction: 'חיסור עם פריטה:',
    expr: `${fmt(a)} − ${fmt(b)} = ?`,
    exprPlain: `${a}-${b}`,
    answer: ans,
    hint: `ביחידות ${a % 10} קטן מ-${b % 10}, ולכן פורטים עשרת אחת: ${(a % 10) + 10} − ${b % 10} = ${(a % 10) + 10 - (b % 10)}.`,
    steps: [
      `ביחידות פורטים עשרת: ${(a % 10) + 10} − ${b % 10} = ${(a % 10) + 10 - (b % 10)}.`,
      `ממשיכים לעשרות, מאות ואלפים וזוכרים את הפריטה.`,
      `התוצאה: ${fmt(a)} − ${fmt(b)} = ${fmt(ans)}.`,
      `בדיקה: ${fmt(ans)} + ${fmt(b)} = ${fmt(a)}.`,
    ],
  });
}

/* --- סדר פעולות חשבון --- */
function genOrderOps() {
  const form = ri(1, 5);
  let expr, plain, ans, first, steps, hint;

  if (form === 1) {
    // a − b:c
    const c = ri(2, 9);
    const q = ri(2, 9);
    const b = c * q;
    const a = ri(q + 5, 60);
    expr = `${fmt(a)} − ${fmt(b)} : ${fmt(c)} = ?`;
    plain = `${a}-${b}/${c}`;
    first = `${fmt(b)} : ${fmt(c)} = ${fmt(q)}`;
    ans = a - q;
    hint = 'חילוק וכפל תמיד לפני חיבור וחיסור. מה צריך לחשב קודם?';
    steps = [`קודם מחלקים: ${first}.`, `עכשיו מחסרים: ${fmt(a)} − ${fmt(q)} = ${fmt(ans)}.`];
  } else if (form === 2) {
    // (a:b) + (c×d)
    const b = ri(2, 9);
    const q = ri(2, 10);
    const a = b * q;
    const c = ri(2, 9);
    const d = ri(2, 9);
    expr = `(${fmt(a)} : ${fmt(b)}) + (${fmt(c)} × ${fmt(d)}) = ?`;
    plain = `(${a}/${b})+(${c}*${d})`;
    ans = q + c * d;
    hint = 'מתחילים תמיד ממה שבתוך הסוגריים.';
    steps = [
      `סוגריים ראשונים: ${fmt(a)} : ${fmt(b)} = ${fmt(q)}.`,
      `סוגריים שניים: ${fmt(c)} × ${fmt(d)} = ${fmt(c * d)}.`,
      `מחברים: ${fmt(q)} + ${fmt(c * d)} = ${fmt(ans)}.`,
    ];
  } else if (form === 3) {
    // a + b×c
    const a = ri(5, 40);
    const b = ri(2, 9);
    const c = ri(2, 9);
    expr = `${fmt(a)} + ${fmt(b)} × ${fmt(c)} = ?`;
    plain = `${a}+${b}*${c}`;
    ans = a + b * c;
    hint = 'הכפל קודם, ורק אחר כך החיבור.';
    steps = [`קודם כופלים: ${fmt(b)} × ${fmt(c)} = ${fmt(b * c)}.`, `ואז מחברים: ${fmt(a)} + ${fmt(b * c)} = ${fmt(ans)}.`];
  } else if (form === 4) {
    // (a + b) × c
    const a = ri(3, 15);
    const b = ri(3, 15);
    const c = ri(2, 9);
    expr = `(${fmt(a)} + ${fmt(b)}) × ${fmt(c)} = ?`;
    plain = `(${a}+${b})*${c}`;
    ans = (a + b) * c;
    hint = 'הסוגריים חזקים יותר מהכפל - פותרים אותם ראשונים.';
    steps = [`בתוך הסוגריים: ${fmt(a)} + ${fmt(b)} = ${fmt(a + b)}.`, `ואז כופלים: ${fmt(a + b)} × ${fmt(c)} = ${fmt(ans)}.`];
  } else {
    // a:b + c:d
    const b = ri(2, 9);
    const q1 = ri(2, 9);
    const a = b * q1;
    const d = ri(2, 9);
    const q2 = ri(2, 9);
    const c = d * q2;
    expr = `${fmt(a)} : ${fmt(b)} + ${fmt(c)} : ${fmt(d)} = ?`;
    plain = `${a}/${b}+${c}/${d}`;
    ans = q1 + q2;
    hint = 'שני החילוקים נעשים קודם, ורק בסוף מחברים.';
    steps = [
      `${fmt(a)} : ${fmt(b)} = ${fmt(q1)}.`,
      `${fmt(c)} : ${fmt(d)} = ${fmt(q2)}.`,
      `מחברים: ${fmt(q1)} + ${fmt(q2)} = ${fmt(ans)}.`,
    ];
  }

  return Q({
    type: 'order_ops',
    topic: 'order_ops',
    instruction: 'שימו לב לסדר הפעולות:',
    expr,
    exprPlain: plain,
    answer: ans,
    hint,
    steps,
  });
}

/* --- מספר חסר --- */
function genMissing() {
  const form = ri(1, 3);
  const a = pick([4, 5, 6, 7, 8, 9]);

  if (form === 1) {
    // a + □ × a = T
    const k = ri(2, 9);
    const T = a * (k + 1);
    return Q({
      type: 'missing_add_mul',
      topic: 'missing',
      instruction: 'איזה מספר חסר?',
      expr: `${fmt(a)} + ? × ${fmt(a)} = ${fmt(T)}`,
      exprPlain: `${a}+x*${a}=${T}`,
      answer: k,
      hint: `הכפל נעשה קודם. כמה צריך להוסיף ל-${fmt(a)} כדי להגיע ל-${fmt(T)}? ואז - כמה פעמים ${fmt(a)} זה המספר הזה?`,
      steps: [
        `${fmt(T)} − ${fmt(a)} = ${fmt(T - a)}, זה החלק של הכפל.`,
        `${fmt(T - a)} : ${fmt(a)} = ${fmt(k)}.`,
        `בדיקה: ${fmt(a)} + ${fmt(k)} × ${fmt(a)} = ${fmt(a)} + ${fmt(k * a)} = ${fmt(T)}.`,
      ],
    });
  }

  if (form === 2) {
    // a × (□ + a) = T  (התשובה יכולה להיות גם 0)
    const k = ri(a - 1, 9);
    const T = a * (k + 1);
    const inner = T / a - a;
    return Q({
      type: 'missing_mul_paren',
      topic: 'missing',
      instruction: 'איזה מספר חסר?',
      expr: `${fmt(a)} × (? + ${fmt(a)}) = ${fmt(T)}`,
      exprPlain: `${a}*(x+${a})=${T}`,
      answer: inner,
      hint: `קודם נגלה מה יוצא בתוך הסוגריים: ${fmt(T)} : ${fmt(a)} = ?`,
      steps: [
        `${fmt(T)} : ${fmt(a)} = ${fmt(T / a)}, אז בסוגריים חייב לצאת ${fmt(T / a)}.`,
        `${fmt(T / a)} − ${fmt(a)} = ${fmt(inner)}.`,
        `בדיקה: ${fmt(a)} × (${fmt(inner)} + ${fmt(a)}) = ${fmt(a)} × ${fmt(T / a)} = ${fmt(T)}.`,
      ],
    });
  }

  // □ × a = T
  const k = ri(3, 12);
  const T = a * k;
  return Q({
    type: 'missing_factor',
    topic: 'missing',
    instruction: 'איזה מספר חסר?',
    expr: `? × ${fmt(a)} = ${fmt(T)}`,
    exprPlain: `x*${a}=${T}`,
    answer: k,
    hint: `כפל וחילוק הם פעולות הפוכות: ${fmt(T)} : ${fmt(a)} = ?`,
    steps: [`מחלקים: ${fmt(T)} : ${fmt(a)} = ${fmt(k)}.`, `בדיקה: ${fmt(k)} × ${fmt(a)} = ${fmt(T)}.`],
  });
}

/* --- יחידות משקל --- */
function genWeight() {
  const form = ri(1, 3);
  const kg = ri(1, 4);
  const g = ri(12, 480);

  if (form === 1) {
    const ans = kg * 1000 + g;
    return Q({
      type: 'weight_to_g',
      topic: 'weight',
      instruction: 'המירו ליחידות גרם:',
      expr: `${fmt(kg)} ק"ג ו-${fmt(g)} גרם = ? גרם`,
      exprPlain: `${kg}*1000+${g}`,
      exprRtl: true,
      answer: ans,
      unit: 'גרם',
      hint: `כל קילוגרם אחד הוא 1,000 גרם, ולכן ${fmt(kg)} ק"ג = ${fmt(kg * 1000)} גרם.`,
      steps: [`${fmt(kg)} ק"ג = ${fmt(kg)} × 1,000 = ${fmt(kg * 1000)} גרם.`, `מוסיפים את הגרמים: ${fmt(kg * 1000)} + ${fmt(g)} = ${fmt(ans)} גרם.`],
    });
  }

  if (form === 2) {
    const z = ri(20, 200);
    const total = kg * 1000 + g;
    const ans = total - z;
    return Q({
      type: 'weight_minus',
      topic: 'weight',
      instruction: 'השלימו את המספר החסר:',
      expr: `${fmt(kg)} ק"ג ו-${fmt(g)} גרם = ? גרם + ${fmt(z)} גרם`,
      exprPlain: `${kg}*1000+${g}-${z}`,
      exprRtl: true,
      answer: ans,
      unit: 'גרם',
      hint: `קודם ממירים הכל לגרמים: ${fmt(kg)} ק"ג ו-${fmt(g)} גרם = ${fmt(total)} גרם. עכשיו - כמה חסר כדי להגיע ל-${fmt(total)} יחד עם ${fmt(z)}?`,
      steps: [
        `${fmt(kg)} ק"ג ו-${fmt(g)} גרם = ${fmt(total)} גרם.`,
        `${fmt(total)} − ${fmt(z)} = ${fmt(ans)}.`,
        `בדיקה: ${fmt(ans)} + ${fmt(z)} = ${fmt(total)} גרם.`,
      ],
    });
  }

  const total = kg * 1000 + g;
  return Q({
    type: 'weight_to_kg',
    topic: 'weight',
    instruction: 'כמה גרם נשארו מעבר לקילוגרמים השלמים?',
    expr: `${fmt(total)} גרם = ${fmt(kg)} ק"ג ו-? גרם`,
    exprPlain: `${total}-${kg}*1000`,
    exprRtl: true,
    answer: g,
    unit: 'גרם',
    hint: `${fmt(kg)} ק"ג הם ${fmt(kg * 1000)} גרם. כמה נשאר מעבר להם?`,
    steps: [`${fmt(kg)} ק"ג = ${fmt(kg * 1000)} גרם.`, `${fmt(total)} − ${fmt(kg * 1000)} = ${fmt(g)} גרם.`],
  });
}

/* --- שאלות מילוליות --- */
const NAMES_F = ['נועה', 'שירה', 'אוריה', 'תמר', 'מאיה', 'רוני', 'יעל'];
const NAMES_M = ['איתי', 'עידו', 'אדם', 'יהלי', 'אורי', 'נועם', 'דניאל'];
const CITIES = ['אשקלון', 'מודיעין', 'חיפה', 'באר שבע', 'רעננה', 'נתניה'];

/** דמות לשאלה מילולית, כולל התאמת פעלים במין הנכון */
function person() {
  const f = Math.random() < 0.5;
  return {
    name: pick(f ? NAMES_F : NAMES_M),
    got: f ? 'קיבלה' : 'קיבל',
    saved: f ? 'חסכה' : 'חסך',
    bought: f ? 'קנתה' : 'קנה',
    paid: f ? 'שילמה' : 'שילם',
    to: f ? 'לה' : 'לו',
    they: f ? 'היא' : 'הוא',
  };
}

function genWordDiff() {
  const base = ri(80, 140) * 10000;
  const diff = ri(3, 19) * 5000;
  const a = base;
  const b = base + diff;
  return Q({
    type: 'word_diff',
    topic: 'word',
    ui: 'mission',
    instruction: 'משימה:',
    story: `דירת 3 חדרים יד שנייה, ללא ממ"ד, עולה [[${fmt(a)}]] ש"ח. דירת 3 חדרים חדשה, עם ממ"ד, עולה [[${fmt(b)}]] ש"ח. מה ההפרש בין מחירי הדירות?`,
    answer: diff,
    unit: 'ש"ח',
    hint: 'הפרש = המחיר הגדול פחות המחיר הקטן. זו פעולת חיסור.',
    steps: [`המחיר הגדול הוא ${fmt(b)} ש"ח והקטן ${fmt(a)} ש"ח.`, `${fmt(b)} − ${fmt(a)} = ${fmt(diff)}.`, `ההפרש הוא ${fmt(diff)} ש"ח.`],
  });
}

function genWordBudget() {
  const budget = ri(40, 99) * 10000;
  const spent = budget - ri(3, 25) * 3000;
  const ans = budget - spent;
  const city = pick(CITIES);
  return Q({
    type: 'word_budget',
    topic: 'word',
    ui: 'mission',
    instruction: 'משימה:',
    story: `בשכונה חדשה הקימו מגרש כדורגל לשימוש התושבים. לצורך הפרויקט הקציבה עיריית ${city} [[${fmt(budget)}]] ש"ח. בפועל, עלות ההקמה הסתכמה ב-[[${fmt(spent)}]] ש"ח. כמה כסף נותר מהסכום שהוקצב?`,
    answer: ans,
    unit: 'ש"ח',
    hint: 'מה שנותר = הסכום שהוקצב פחות מה שבאמת הוצא.',
    steps: [`הוקצבו ${fmt(budget)} ש"ח.`, `הוצאו ${fmt(spent)} ש"ח.`, `${fmt(budget)} − ${fmt(spent)} = ${fmt(ans)} ש"ח נותרו.`],
  });
}

function genWordHalfHalf() {
  const total = ri(10, 40) * 20; // מתחלק ב-4
  const p = person();
  const ans = total / 4;
  return Q({
    type: 'word_half_half',
    topic: 'word',
    ui: 'mission',
    instruction: 'משימה:',
    story: `${p.name} ${p.got} [[${fmt(total)}]] שקלים מההורים ליום ההולדת. חצי מהסכום ${p.they} ${p.saved}, ובחצי שנותר ${p.bought} נעליים וחולצה במחיר זהה. כמה כסף עלתה החולצה?`,
    answer: ans,
    unit: 'ש"ח',
    hint: 'קודם מוצאים כמה נשאר אחרי החיסכון (חצי), ואז מחלקים את הסכום הזה לשני פריטים שווים.',
    steps: [
      `חצי מהסכום נחסך: ${fmt(total)} : 2 = ${fmt(total / 2)} ש"ח נשארו.`,
      `הנעליים והחולצה עלו אותו מחיר: ${fmt(total / 2)} : 2 = ${fmt(ans)}.`,
      `החולצה עלתה ${fmt(ans)} ש"ח.`,
    ],
  });
}

function genWordMultiBuy() {
  const p = person();
  const count = ri(3, 9);
  const price = ri(12, 45);
  const ans = count * price;
  return Q({
    type: 'word_multi_buy',
    topic: 'word',
    ui: 'mission',
    instruction: 'משימה:',
    story: `${p.name} ${p.bought} [[${fmt(count)}]] חוברות לבית הספר. מחיר כל חוברת [[${fmt(price)}]] ש"ח. כמה ${p.paid} בסך הכל?`,
    answer: ans,
    unit: 'ש"ח',
    hint: 'אותו מחיר חוזר על עצמו כמה פעמים - זו שאלה כפלית.',
    steps: [`${fmt(count)} חוברות × ${fmt(price)} ש"ח = ?`, `${fmt(count)} × ${fmt(price)} = ${fmt(ans)}.`, `שילם ${fmt(ans)} ש"ח.`],
  });
}

function genWordBuyRemain() {
  const p = person();
  const count = ri(3, 7);
  const price = ri(11, 30);
  const cost = count * price;
  const wallet = cost + ri(5, 60);
  const ans = wallet - cost;
  return Q({
    type: 'word_buy_remain',
    topic: 'word',
    ui: 'mission',
    instruction: 'משימה:',
    story: `ל${p.name} יש [[${fmt(wallet)}]] ש"ח. ${p.they} ${p.bought} [[${fmt(count)}]] זוגות גרביים במחיר [[${fmt(price)}]] ש"ח לזוג. כמה כסף נשאר ${p.to}?`,
    answer: ans,
    unit: 'ש"ח',
    hint: 'שני שלבים: קודם כמה עלתה כל הקנייה (כפל), ואחר כך כמה נשאר (חיסור).',
    steps: [
      `עלות הקנייה: ${fmt(count)} × ${fmt(price)} = ${fmt(cost)} ש"ח.`,
      `${fmt(wallet)} − ${fmt(cost)} = ${fmt(ans)}.`,
      `נשארו ${fmt(ans)} ש"ח.`,
    ],
  });
}

/* ============================ רישום הגנרטורים ============================ */

export const GENERATORS = [
  { type: 'mult_table', topic: 'mult_table', weight: 3, gen: genMultTable },
  { type: 'mult_round_tens', topic: 'mult_big', weight: 1.4, gen: genMultRoundTens },
  { type: 'mult_by_unit', topic: 'mult_big', weight: 1.2, gen: genMultByUnit },
  { type: 'add4', topic: 'add_sub', weight: 1.2, gen: genAdd4 },
  { type: 'sub4', topic: 'add_sub', weight: 1.2, gen: genSub4 },
  { type: 'order_ops', topic: 'order_ops', weight: 1.8, gen: genOrderOps },
  { type: 'missing', topic: 'missing', weight: 1.5, gen: genMissing },
  { type: 'weight', topic: 'weight', weight: 1, gen: genWeight },
  { type: 'word_diff', topic: 'word', weight: 0.6, gen: genWordDiff },
  { type: 'word_budget', topic: 'word', weight: 0.6, gen: genWordBudget },
  { type: 'word_half_half', topic: 'word', weight: 0.6, gen: genWordHalfHalf },
  { type: 'word_multi_buy', topic: 'word', weight: 0.5, gen: genWordMultiBuy },
  { type: 'word_buy_remain', topic: 'word', weight: 0.5, gen: genWordBuyRemain },
];

export function generateByType(type) {
  const g = GENERATORS.find((x) => x.type === type);
  return g ? g.gen() : pick(GENERATORS).gen();
}

/* ============================ שאלות המורה (קבועות) ============================ */
// הנוסח נשמר בדיוק כפי שהופיע בדף התרגול של המורה.

function T(o) {
  return Q({ source: 'teacher', instruction: 'שאלה מדף התרגול של המורה:', ...o });
}

export const TEACHER_QUESTIONS = [
  () => T({
    type: 'teacher_mult_1', topic: 'mult_big',
    expr: '45 × 50 = ?', exprPlain: '45*50', answer: 2250,
    hint: '50 זה 5 × 10. כפלו ב-5 ואז הוסיפו אפס.',
    steps: ['45 × 5 = 225.', '225 × 10 = 2,250.'],
  }),
  () => T({
    type: 'teacher_mult_2', topic: 'mult_big',
    expr: '56 × 6 = ?', exprPlain: '56*6', answer: 336,
    hint: 'פרקו: 50 + 6, וכפלו כל חלק ב-6.',
    steps: ['50 × 6 = 300.', '6 × 6 = 36.', '300 + 36 = 336.'],
  }),
  () => T({
    type: 'teacher_mult_3', topic: 'mult_big',
    expr: '32 × 60 = ?', exprPlain: '32*60', answer: 1920,
    hint: '32 × 6 = 192, ועכשיו מוסיפים אפס.',
    steps: ['60 = 6 × 10.', '32 × 6 = 192.', '192 × 10 = 1,920.'],
  }),
  () => T({
    type: 'teacher_mult_4', topic: 'mult_big',
    expr: '26 × 50 = ?', exprPlain: '26*50', answer: 1300,
    hint: '26 × 5 = 130, ועכשיו מוסיפים אפס.',
    steps: ['50 = 5 × 10.', '26 × 5 = 130.', '130 × 10 = 1,300.'],
  }),
  () => T({
    type: 'teacher_add', topic: 'add_sub',
    expr: '9,184 + 3,459 = ?', exprPlain: '9184+3459', answer: 12643,
    hint: 'יחידות: 4 + 9 = 13. כותבים 3 וממירים 1 לעשרות.',
    steps: ['4 + 9 = 13 - כותבים 3, ממירים 1.', '8 + 5 + 1 = 14 - כותבים 4, ממירים 1.', '1 + 4 + 1 = 6.', '9 + 3 = 12.', 'סך הכל 12,643.'],
  }),
  () => T({
    type: 'teacher_sub', topic: 'add_sub',
    expr: '9,184 − 3,459 = ?', exprPlain: '9184-3459', answer: 5725,
    hint: '4 קטן מ-9, ולכן פורטים עשרת: 14 − 9 = 5.',
    steps: [
      'יחידות: פורטים עשרת, 14 − 9 = 5.',
      'עשרות: נשארו 7 (במקום 8), ולכן 7 − 5 = 2.',
      'מאות: 1 קטן מ-4, פורטים אלף: 11 − 4 = 7.',
      'אלפים: נשארו 8 (במקום 9), ולכן 8 − 3 = 5.',
      'התוצאה: 5,725. בדיקה: 5,725 + 3,459 = 9,184.',
    ],
  }),
  () => T({
    type: 'teacher_order_1', topic: 'order_ops',
    expr: '30 − 6 : 6 = ?', exprPlain: '30-6/6', answer: 29,
    hint: 'חילוק לפני חיסור.',
    steps: ['6 : 6 = 1.', '30 − 1 = 29.'],
  }),
  () => T({
    type: 'teacher_order_2', topic: 'order_ops',
    expr: '(50 : 5) + (8 × 8) = ?', exprPlain: '(50/5)+(8*8)', answer: 74,
    hint: 'פותרים כל זוג סוגריים בנפרד ואז מחברים.',
    steps: ['50 : 5 = 10.', '8 × 8 = 64.', '10 + 64 = 74.'],
  }),
  () => T({
    type: 'teacher_missing_1', topic: 'missing',
    expr: '5 + ? × 5 = 45', exprPlain: '5+x*5=45', answer: 8,
    hint: 'קודם הכפל. 45 − 5 = 40, וכמה פעמים 5 זה 40?',
    steps: ['45 − 5 = 40.', '40 : 5 = 8.', 'בדיקה: 5 + 8 × 5 = 5 + 40 = 45.'],
  }),
  () => T({
    type: 'teacher_missing_2', topic: 'missing',
    expr: '5 × (? + 5) = 45', exprPlain: '5*(x+5)=45', answer: 4,
    hint: '45 : 5 = 9, אז מה צריך לצאת בתוך הסוגריים?',
    steps: ['45 : 5 = 9.', '9 − 5 = 4.', 'בדיקה: 5 × (4 + 5) = 5 × 9 = 45.'],
  }),
  () => T({
    type: 'teacher_missing_3', topic: 'missing',
    expr: '8 + ? × 8 = 64', exprPlain: '8+x*8=64', answer: 7,
    hint: '64 − 8 = 56, וכמה פעמים 8 זה 56?',
    steps: ['64 − 8 = 56.', '56 : 8 = 7.', 'בדיקה: 8 + 7 × 8 = 8 + 56 = 64.'],
  }),
  () => T({
    type: 'teacher_missing_4', topic: 'missing',
    expr: '8 × (? + 8) = 64', exprPlain: '8*(x+8)=64', answer: 0,
    hint: '64 : 8 = 8. מה צריך להוסיף ל-8 כדי לקבל 8?',
    steps: ['64 : 8 = 8.', '8 − 8 = 0.', 'בדיקה: 8 × (0 + 8) = 8 × 8 = 64. התשובה היא אפס!'],
  }),
  () => T({
    type: 'teacher_weight_1', topic: 'weight',
    expr: '1 ק"ג ו-96 גרם = ? גרם', exprPlain: '1*1000+96', answer: 1096, exprRtl: true, unit: 'גרם',
    hint: '1 ק"ג = 1,000 גרם.',
    steps: ['1 ק"ג = 1,000 גרם.', '1,000 + 96 = 1,096 גרם.'],
  }),
  () => T({
    type: 'teacher_weight_2', topic: 'weight',
    expr: '2 ק"ג ו-112 גרם = ? גרם', exprPlain: '2*1000+112', answer: 2112, exprRtl: true, unit: 'גרם',
    hint: '2 ק"ג = 2,000 גרם.',
    steps: ['2 ק"ג = 2,000 גרם.', '2,000 + 112 = 2,112 גרם.'],
  }),
  () => T({
    type: 'teacher_weight_3', topic: 'weight',
    expr: '1 ק"ג ו-34 גרם = ? גרם + 38 גרם', exprPlain: '1*1000+34-38', answer: 996, exprRtl: true, unit: 'גרם',
    hint: '1 ק"ג ו-34 גרם = 1,034 גרם. כמה חסר ל-38 כדי להגיע ל-1,034?',
    steps: ['1 ק"ג ו-34 גרם = 1,034 גרם.', '1,034 − 38 = 996.', 'בדיקה: 996 + 38 = 1,034.'],
  }),
  () => T({
    type: 'teacher_weight_4', topic: 'weight',
    expr: '1 ק"ג ו-104 גרם = ? גרם + 114 גרם', exprPlain: '1*1000+104-114', answer: 990, exprRtl: true, unit: 'גרם',
    hint: '1 ק"ג ו-104 גרם = 1,104 גרם.',
    steps: ['1 ק"ג ו-104 גרם = 1,104 גרם.', '1,104 − 114 = 990.', 'בדיקה: 990 + 114 = 1,104.'],
  }),
  () => T({
    type: 'teacher_word_1', topic: 'word', ui: 'mission',
    story: 'דירת 3 חדרים יד שנייה, ללא ממ"ד, עולה [[1,150,000]] ש"ח. דירת 3 חדרים חדשה, עם ממ"ד, עולה [[1,275,000]] ש"ח. מה ההפרש בין מחירי הדירות?',
    answer: 125000, unit: 'ש"ח',
    hint: 'הפרש = חיסור בין שני המחירים.',
    steps: ['1,275,000 − 1,150,000 = 125,000.', 'ההפרש הוא 125,000 ש"ח.'],
  }),
  () => T({
    type: 'teacher_word_2', topic: 'word', ui: 'mission',
    story: 'בשכונת נווה הדרים הקימו מגרש כדורגל חדש לשימוש תושבי השכונה. לצורך הפרויקט הקציבה עיריית אשקלון [[876,000]] ש"ח. בפועל, עלות הקמת המגרש הסתכמה ב-[[795,000]] ש"ח. כמה כסף נותר מהסכום שהוקצב?',
    answer: 81000, unit: 'ש"ח',
    hint: 'מה שנותר = הסכום שהוקצב פחות מה שהוצא בפועל.',
    steps: ['876,000 − 795,000 = 81,000.', 'נותרו 81,000 ש"ח.'],
  }),
  () => T({
    type: 'teacher_word_3', topic: 'word', ui: 'mission',
    story: 'שירה קיבלה [[200]] שקלים מהוריה ליום הולדתה. חצי מהסכום היא חסכה, בחצי שנותר קנתה נעליים וחולצה במחיר זהה. כמה כסף עלתה החולצה?',
    answer: 50, unit: 'ש"ח',
    hint: 'חצי מ-200 זה 100, ואת ה-100 מחלקים לשני פריטים שווים.',
    steps: ['200 : 2 = 100 ש"ח נשארו אחרי החיסכון.', '100 : 2 = 50.', 'החולצה עלתה 50 ש"ח.'],
  }),
];

export function randomTeacherQuestion() {
  return pick(TEACHER_QUESTIONS)();
}

/* ============================ בניית קרב ============================ */

/** משקל לפי אחוז הטעויות בנושא - נושאים חלשים חוזרים יותר */
function topicWeight(stats, topicId) {
  const t = stats?.byTopic?.[topicId];
  if (!t || !t.answered) return 1;
  const accuracy = t.firstTry / t.answered;
  return 1 + (1 - accuracy) * 1.8;
}

/**
 * בניית קרב של 5 שאלות.
 * מערבב נושאים, נותן משקל גבוה יותר לנושאים שבהם יש יותר טעויות,
 * ומשלב שאלה אחת מדף התרגול של המורה.
 */
export function buildBattle(saveState, count = 5) {
  const stats = saveState?.stats;
  const questions = [];
  const usedTypes = new Set();

  // שאלה אחת מדף המורה (בערך בכל קרב)
  const teacherIndex = ri(0, count - 1);

  for (let i = 0; i < count; i++) {
    if (i === teacherIndex) {
      questions.push(randomTeacherQuestion());
      continue;
    }
    let q = null;
    for (let attempt = 0; attempt < 8; attempt++) {
      const g = weightedPick(GENERATORS, (x) => x.weight * topicWeight(stats, x.topic));
      if (usedTypes.has(g.type) && attempt < 6) continue;
      usedTypes.add(g.type);
      q = g.gen();
      break;
    }
    if (!q) q = genMultTable();
    questions.push(q);
  }

  return shuffle(questions);
}
