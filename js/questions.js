// questions.js - מנוע השאלות: כל סוג שאלה הוא גנרטור שמייצר מספרים חדשים בכל פעם.
// כל שאלה מחזירה: נוסח, תשובה נכונה, רמז, ופתרון מלא בשלבים.

import { ri, pick, shuffle, weightedPick, fmt } from './util.js';
import { N, O, L, R, solve, tokensToString } from './exprtokens.js';
import { allRectSolutions } from './geometry.js';

/* ============================ נושאים ============================ */

export const TOPICS = {
  mult_table: { id: 'mult_table', name: 'לוח הכפל', region: 'הר לוח הכפל', icon: '⛰️' },
  mult_big: { id: 'mult_big', name: 'כפל מספרים גדולים', region: 'מכרות הכפל', icon: '⛏️' },
  add_sub: { id: 'add_sub', name: 'חיבור וחיסור עם המרה', region: 'גשר המספרים', icon: '🌉' },
  order_ops: { id: 'order_ops', name: 'סדר פעולות חשבון', region: 'מגדל הפעולות', icon: '🗼' },
  missing: { id: 'missing', name: 'המספר החסר', region: 'מערת החידות', icon: '🕯️' },
  weight: { id: 'weight', name: 'יחידות משקל', region: 'שוק המאזניים', icon: '⚖️' },
  word: { id: 'word', name: 'שאלות מילוליות', region: 'כפר המשימות', icon: '🏘️' },
  numberline: { id: 'numberline', name: 'ישר המספרים', region: 'שביל אבני הקפיצה', icon: '🪨' },
  distribute: { id: 'distribute', name: 'כפל בעזרת פילוג', region: 'נפחיית הפילוג', icon: '🔨' },
  divisibility: { id: 'divisibility', name: 'סימני התחלקות', region: 'מרתף האוצרות', icon: '🗝️' },
  insight: { id: 'insight', name: 'תובנה מספרית', region: 'היכל התובנה', icon: '🔮' },
  fractions: { id: 'fractions', name: 'שברים', region: 'מבצר השברים', icon: '🍕' },
  geometry: { id: 'geometry', name: 'צורות וגאומטריה', region: 'עמק הגאומטריה', icon: '📐' },
  chart: { id: 'chart', name: 'קריאת דיאגרמה', region: 'מגדל הדיאגרמות', icon: '📊' },
};

/** סדר האזורים במפת העולם */
export const REGION_ORDER = [
  'mult_table', 'numberline', 'add_sub', 'mult_big', 'distribute',
  'order_ops', 'missing', 'divisibility', 'weight', 'fractions',
  'geometry', 'chart', 'word', 'insight',
];

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

/* --- לוח הכפל למתחילים: כפולות של 2, 3, 4, 5 --- */
function genMultSmall() {
  const small = pick([2, 2, 3, 3, 4, 4, 5]);
  const other = ri(1, 10);
  // לפעמים המספר הקטן ראשון ולפעמים שני
  const [a, b] = Math.random() < 0.5 ? [small, other] : [other, small];
  const ans = a * b;
  return Q({
    type: 'mult_small',
    topic: 'mult_table',
    instruction: 'לוח הכפל - פתרו:',
    expr: mulExpr(a, b),
    exprPlain: `${a}*${b}`,
    answer: ans,
    hint: `ספרו בקפיצות של ${fmt(small)}: ${jumps(small, Math.min(other, 3))}... עד ${fmt(other)} קפיצות.`,
    steps: [
      `סופרים בקפיצות של ${fmt(small)}: ${jumps(small, other)}.`,
      `עצרנו אחרי ${fmt(other)} קפיצות, ולכן ${fmt(a)} × ${fmt(b)} = ${fmt(ans)}.`,
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

/* --- מספר חסר למתחילים: חיבור וחיסור --- */
function genMissingAddSub() {
  const form = ri(1, 4);
  const a = ri(2, 12);
  const k = ri(2, 12);

  if (form === 1) {
    // ? + a = T
    const T = k + a;
    return Q({
      type: 'missing_easy_add',
      topic: 'missing',
      instruction: 'איזה מספר חסר?',
      expr: `? + ${fmt(a)} = ${fmt(T)}`,
      exprPlain: `x+${a}=${T}`,
      answer: k,
      hint: `כמה צריך להוסיף ל-${fmt(a)} כדי להגיע ל-${fmt(T)}? אפשר גם לחשב ${fmt(T)} − ${fmt(a)}.`,
      steps: [`${fmt(T)} − ${fmt(a)} = ${fmt(k)}.`, `בדיקה: ${fmt(k)} + ${fmt(a)} = ${fmt(T)}.`],
    });
  }

  if (form === 2) {
    // a + ? = T
    const T = a + k;
    return Q({
      type: 'missing_easy_add',
      topic: 'missing',
      instruction: 'איזה מספר חסר?',
      expr: `${fmt(a)} + ? = ${fmt(T)}`,
      exprPlain: `${a}+x=${T}`,
      answer: k,
      hint: `התחילו מ-${fmt(a)} וספרו קדימה עד ${fmt(T)}. כמה צעדים עשיתם?`,
      steps: [`${fmt(T)} − ${fmt(a)} = ${fmt(k)}.`, `בדיקה: ${fmt(a)} + ${fmt(k)} = ${fmt(T)}.`],
    });
  }

  if (form === 3) {
    // ? − a = k
    const T = k + a;
    return Q({
      type: 'missing_easy_add',
      topic: 'missing',
      instruction: 'איזה מספר חסר?',
      expr: `? − ${fmt(a)} = ${fmt(k)}`,
      exprPlain: `x-${a}=${k}`,
      answer: T,
      hint: `איזה מספר, כשמורידים ממנו ${fmt(a)}, נשאר ${fmt(k)}? חיבור הוא הפעולה ההפוכה לחיסור.`,
      steps: [`${fmt(k)} + ${fmt(a)} = ${fmt(T)}.`, `בדיקה: ${fmt(T)} − ${fmt(a)} = ${fmt(k)}.`],
    });
  }

  // T − ? = k
  const T = k + a;
  return Q({
    type: 'missing_easy_add',
    topic: 'missing',
    instruction: 'איזה מספר חסר?',
    expr: `${fmt(T)} − ? = ${fmt(k)}`,
    exprPlain: `${T}-x=${k}`,
    answer: a,
    hint: `כמה צריך להוריד מ-${fmt(T)} כדי שיישאר ${fmt(k)}?`,
    steps: [`${fmt(T)} − ${fmt(k)} = ${fmt(a)}.`, `בדיקה: ${fmt(T)} − ${fmt(a)} = ${fmt(k)}.`],
  });
}

/* --- מספר חסר למתחילים: כפל במספרים קטנים --- */
function genMissingMulSmall() {
  const a = pick([2, 3, 4, 5]);
  const k = ri(1, 10);
  const T = a * k;
  const first = Math.random() < 0.5;
  return Q({
    type: 'missing_easy_mul',
    topic: 'missing',
    instruction: 'איזה מספר חסר?',
    expr: first ? `? × ${fmt(a)} = ${fmt(T)}` : `${fmt(a)} × ? = ${fmt(T)}`,
    exprPlain: first ? `x*${a}=${T}` : `${a}*x=${T}`,
    answer: k,
    hint: `ספרו בקפיצות של ${fmt(a)} עד שמגיעים ל-${fmt(T)}. כמה קפיצות היו?`,
    steps: [
      `קפיצות של ${fmt(a)}: ${jumps(a, k)}.`,
      `היו ${fmt(k)} קפיצות, ולכן המספר החסר הוא ${fmt(k)}.`,
      `בדיקה: ${fmt(k)} × ${fmt(a)} = ${fmt(T)}.`,
    ],
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

/* ============================ ישר המספרים ============================ */

/** השלמת ערכים חסרים על ציר המספרים (אבני קפיצה) */
function genNumberLineFill() {
  const step = pick([10, 50, 100, 100, 1000, 25]);
  const count = ri(5, 6);
  const start = step * ri(step >= 100 ? 12 : 4, step >= 100 ? 90 : 40);
  const values = Array.from({ length: count }, (_, i) => start + i * step);

  // שתי אבנים חסרות, אף פעם לא הראשונה או האחרונה.
  // תמיד נשארת לפחות אבן פנימית אחת גלויה, כדי שאפשר יהיה לראות את גודל הקפיצה.
  const inner = shuffle(values.slice(1, -1).map((_, i) => i + 1));
  const blanks = inner.slice(0, Math.max(1, Math.min(2, inner.length - 1))).sort((a, b) => a - b);

  return Q({
    type: 'numberline_fill',
    topic: 'numberline',
    ui: 'numberline_fill',
    instruction: 'השלימו את ציר המספרים במקומות החסרים:',
    stones: values.map((v, i) => ({ value: v, blank: blanks.includes(i) })),
    step,
    answer: values[blanks[0]],
    answers: blanks.map((i) => values[i]),
    hint: `בכל קפיצה מוסיפים ${fmt(step)}. בדקו מה ההפרש בין שתי אבנים שכבר כתובות.`,
    steps: [
      `ההפרש בין אבן לאבן הוא ${fmt(step)}.`,
      ...blanks.map((i) => `${fmt(values[i - 1])} + ${fmt(step)} = ${fmt(values[i])}.`),
    ],
  });
}

/** איתור מיקומו של מספר על הציר */
function genNumberLineLocate() {
  const step = pick([100, 100, 500, 1000, 50]);
  const ticks = 7;
  const start = step * ri(4, 40);
  const values = Array.from({ length: ticks }, (_, i) => start + i * step);
  const target = ri(1, ticks - 2);

  return Q({
    type: 'numberline_locate',
    topic: 'numberline',
    ui: 'numberline_locate',
    instruction: 'בחרו את המקום הנכון על הציר, והלוחם יקפוץ לשם:',
    stones: values.map((v, i) => ({ value: v, blank: i !== 0 && i !== ticks - 1 })),
    target: values[target],
    answer: values[target],
    correctIndex: target,
    hint: `הציר מתחיל ב-${fmt(values[0])} וכל קפיצה היא ${fmt(step)}. ספרו קפיצות עד ${fmt(values[target])}.`,
    steps: [
      `מתחילים ב-${fmt(values[0])}, וכל קפיצה מוסיפה ${fmt(step)}.`,
      `${fmt(values[target])} − ${fmt(values[0])} = ${fmt(values[target] - values[0])}.`,
      `${fmt(values[target] - values[0])} : ${fmt(step)} = ${fmt(target)}, כלומר ${fmt(target)} קפיצות מההתחלה.`,
    ],
  });
}

/* ============================ סדר פעולות - ממשק הקשה ============================ */

function orderOpsTokens() {
  const form = ri(1, 5);
  if (form === 1) {
    const c = ri(2, 9); const q = ri(2, 9); const b = c * q; const a = ri(q + 5, 60);
    return [N(a), O('−'), N(b), O(':'), N(c)];
  }
  if (form === 2) {
    const b = ri(2, 9); const q = ri(2, 10); const a = b * q; const c = ri(2, 9); const d = ri(2, 9);
    return [L(), N(a), O(':'), N(b), R(), O('+'), L(), N(c), O('×'), N(d), R()];
  }
  if (form === 3) {
    return [N(ri(5, 40)), O('+'), N(ri(2, 9)), O('×'), N(ri(2, 9))];
  }
  if (form === 4) {
    return [L(), N(ri(3, 15)), O('+'), N(ri(3, 15)), R(), O('×'), N(ri(2, 9))];
  }
  const b = ri(2, 9); const q1 = ri(2, 9); const d = ri(2, 9); const q2 = ri(2, 9);
  return [N(b * q1), O(':'), N(b), O('+'), N(d * q2), O(':'), N(d)];
}

function genOrderOpsTap() {
  const tokens = orderOpsTokens();
  const sol = solve(tokens);
  return Q({
    type: 'order_ops_tap',
    topic: 'order_ops',
    ui: 'orderops',
    instruction: 'על איזו פעולה לוחצים קודם?',
    tokens,
    expr: `${tokensToString(tokens)} = ?`,
    exprPlain: tokensToString(tokens).replace(/×/g, '*').replace(/:/g, '/').replace(/−/g, '-').replace(/,/g, ''),
    answer: sol.answer,
    hint: 'קודם מה שבתוך הסוגריים, אחר כך כפל וחילוק, ורק בסוף חיבור וחיסור.',
    steps: [...sol.steps.map((s) => `${s}.`), `התוצאה: ${fmt(sol.answer)}.`],
  });
}

/* ============================ פילוג ============================ */

/** הלוחם מפצל מספר לשני חלקים, ורואים גם מודל שטח */
function genDistributeSplit() {
  const a = ri(12, 48);
  const b = pick([12, 13, 14, 15, 16, 17, 18, 19, 21, 23, 24, 26]);
  const tens = Math.floor(b / 10) * 10;
  const units = b % 10;
  // אפשרויות פיצול שונות זו מזו (בלי כפילויות ובלי סדר הפוך של אותו פיצול)
  const seen = new Set();
  const splits = shuffle([
    [tens, units],
    [Math.floor(b / 2), b - Math.floor(b / 2)],
    [b - 5, 5],
    [10, b - 10],
    [b - 3, 3],
    [b - 1, 1],
  ].filter(([x, y]) => {
    if (x <= 0 || y <= 0) return false;
    const key = [x, y].sort((m, n) => m - n).join('+');
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  })).slice(0, 4);

  return Q({
    type: 'distribute_split',
    topic: 'distribute',
    ui: 'distribute',
    instruction: 'פצלו את המספר לשני חלקים ופתרו בעזרת פילוג:',
    a,
    b,
    splits,
    expr: `${fmt(a)} × ${fmt(b)} = ?`,
    exprPlain: `${a}*${b}`,
    answer: a * b,
    hint: `הכי נוח לפצל את ${fmt(b)} ל-${fmt(tens)} + ${fmt(units)}: קודם ${fmt(a)} × ${fmt(tens)}, ואז ${fmt(a)} × ${fmt(units)}.`,
    steps: [
      `${fmt(b)} = ${fmt(tens)} + ${fmt(units)}.`,
      `${fmt(a)} × ${fmt(tens)} = ${fmt(a * tens)}.`,
      `${fmt(a)} × ${fmt(units)} = ${fmt(a * units)}.`,
      `מחברים את שני החלקים: ${fmt(a * tens)} + ${fmt(a * units)} = ${fmt(a * b)}.`,
    ],
  });
}

/** השלמת המספר החסר בפירוק, בנוסח דף התרגול */
function genDistributeMissing() {
  const a = pick([26, 28, 36, 42, 52, 63]);
  const b = ri(12, 19);
  const part = ri(4, b - 2);
  const missing = b - part;
  return Q({
    type: 'distribute_missing',
    topic: 'distribute',
    instruction: 'השלימו את המספר החסר בפירוק:',
    expr: `${fmt(a)} × ${fmt(b)} = ${fmt(a)} × ${fmt(part)} + ${fmt(a)} × ?`,
    exprPlain: `${a}*${b}=${a}*${part}+${a}*x`,
    answer: missing,
    hint: `שני החלקים ביחד חייבים להשלים את ${fmt(b)}. כמה חסר ל-${fmt(part)} כדי להגיע ל-${fmt(b)}?`,
    steps: [
      `הפילוג מחלק את ${fmt(b)} לשני חלקים.`,
      `${fmt(b)} − ${fmt(part)} = ${fmt(missing)}.`,
      `בדיקה: ${fmt(a)} × ${fmt(part)} + ${fmt(a)} × ${fmt(missing)} = ${fmt(a * part)} + ${fmt(a * missing)} = ${fmt(a * b)}.`,
    ],
  });
}

/* ============================ סימני התחלקות ============================ */

const DIVISIBILITY_RULES = {
  2: 'מספר מתחלק ב-2 אם ספרת האחדות שלו זוגית (0, 2, 4, 6, 8).',
  5: 'מספר מתחלק ב-5 אם ספרת האחדות שלו היא 0 או 5.',
  10: 'מספר מתחלק ב-10 אם ספרת האחדות שלו היא 0.',
  3: 'מספר מתחלק ב-3 אם סכום ספרותיו מתחלק ב-3.',
  6: 'מספר מתחלק ב-6 אם הוא מתחלק גם ב-2 (ספרת אחדות זוגית) וגם ב-3 (סכום הספרות מתחלק ב-3).',
};

function genDivisibility() {
  for (let attempt = 0; attempt < 40; attempt++) {
    const divisor = pick([2, 5, 5, 6, 6, 10, 3]);
    const digits = [ri(1, 9), ri(0, 9), ri(0, 9)];
    const pos = ri(0, 2);
    const valid = [];
    for (let d = 0; d <= 9; d++) {
      if (pos === 0 && d === 0) continue;
      const n = Number(digits.map((x, i) => (i === pos ? d : x)).join(''));
      if (n % divisor === 0) valid.push(d);
    }
    if (!valid.length) continue;

    const shown = digits.map((x, i) => (i === pos ? null : x));
    const display = shown.map((x) => (x === null ? '?' : x)).join('');
    const example = digits.map((x, i) => (i === pos ? valid[0] : x)).join('');

    return Q({
      type: 'divisibility',
      topic: 'divisibility',
      ui: 'divisibility',
      instruction: `סמנו כל ספרה שמתאימה, כך שהמספר יתחלק ב-${divisor}:`,
      digitsShown: shown,
      divisor,
      validDigits: valid,
      expr: `${display}`,
      answer: valid[0],
      hint: DIVISIBILITY_RULES[divisor],
      steps: [
        DIVISIBILITY_RULES[divisor],
        `הספרות המתאימות הן: ${valid.join(', ')}.`,
        `לדוגמה ${fmt(Number(example))} : ${divisor} = ${fmt(Number(example) / divisor)}.`,
      ],
    });
  }
  return genMultTable();
}

/* ============================ תובנה מספרית ============================ */

function explainOptions(correctText, wrongA, wrongB) {
  return shuffle([
    { text: correctText, correct: true },
    { text: wrongA, correct: false },
    { text: wrongB, correct: false },
  ]);
}

/** נתון תרגיל פתור - פותרים תרגיל קרוב בלי לחשב מחדש, ומסבירים למה */
function genInsight() {
  const a = pick([15, 25, 35, 45, 24, 32]);
  const b = pick([12, 14, 16, 18]);
  const p = a * b;
  const mode = ri(1, 3);

  if (mode === 1) {
    return Q({
      type: 'insight_double',
      topic: 'insight',
      ui: 'explain',
      instruction: 'היעזרו בתרגיל הפתור:',
      given: `${fmt(a)} × ${fmt(b)} = ${fmt(p)}`,
      stage1: { kind: 'numeric', prompt: `${fmt(a * 2)} × ${fmt(b)} = ?` },
      answer: p * 2,
      explainQuestion: 'למה זו התשובה?',
      options: explainOptions(
        `הגורם ${fmt(a)} גדל פי 2, ולכן גם המכפלה גדלה פי 2.`,
        `הגורם ${fmt(a)} גדל פי 2, ולכן מוסיפים 2 למכפלה.`,
        'שני הגורמים השתנו, ולכן צריך לחשב הכול מההתחלה.'
      ),
      hint: `${fmt(a * 2)} זה בדיוק פי 2 מ-${fmt(a)}. מה קורה למכפלה כשגורם אחד גדל פי 2?`,
      steps: [
        `${fmt(a * 2)} = ${fmt(a)} × 2.`,
        `כשגורם אחד גדל פי 2, המכפלה גדלה פי 2.`,
        `${fmt(p)} × 2 = ${fmt(p * 2)}.`,
      ],
    });
  }

  if (mode === 2) {
    return Q({
      type: 'insight_half',
      topic: 'insight',
      ui: 'explain',
      instruction: 'היעזרו בתרגיל הפתור:',
      given: `${fmt(a)} × ${fmt(b)} = ${fmt(p)}`,
      stage1: { kind: 'numeric', prompt: `${fmt(a)} × ${fmt(b / 2)} = ?` },
      answer: p / 2,
      explainQuestion: 'למה זו התשובה?',
      options: explainOptions(
        `הגורם ${fmt(b)} קטן פי 2, ולכן גם המכפלה קטנה פי 2.`,
        `הגורם ${fmt(b)} קטן ב-${fmt(b / 2)}, ולכן מחסירים ${fmt(b / 2)} מהמכפלה.`,
        'אי אפשר להיעזר בתרגיל הפתור, צריך לכפול מחדש.'
      ),
      hint: `${fmt(b / 2)} זה חצי מ-${fmt(b)}. מה קורה למכפלה כשגורם אחד קטן פי 2?`,
      steps: [
        `${fmt(b / 2)} = ${fmt(b)} : 2.`,
        'כשגורם אחד קטן פי 2, המכפלה קטנה פי 2.',
        `${fmt(p)} : 2 = ${fmt(p / 2)}.`,
      ],
    });
  }

  return Q({
    type: 'insight_factor',
    topic: 'insight',
    ui: 'explain',
    instruction: 'היעזרו בתרגיל הפתור:',
    given: `${fmt(a)} × ${fmt(b)} = ${fmt(p)}`,
    stage1: { kind: 'numeric', prompt: `${fmt(a)} × ${fmt(b)} × ? = ${fmt(p * 2)}` },
    answer: 2,
    explainQuestion: 'איך ידענו זאת בלי לחשב?',
    options: explainOptions(
      'הגורמים בתרגיל זהים. גילינו שהמכפלה גדלה פי 2, ולכן נכפול בגורם 2.',
      `המכפלה גדלה ב-${fmt(p)}, ולכן נוסיף 2 לתרגיל.`,
      'צריך לחלק את המכפלה החדשה בשני הגורמים.'
    ),
    hint: `השוו: ${fmt(p * 2)} לעומת ${fmt(p)}. פי כמה גדלה המכפלה?`,
    steps: [
      `${fmt(p * 2)} : ${fmt(p)} = 2, כלומר המכפלה גדלה פי 2.`,
      'הגורמים נשארו זהים, ולכן הגורם החסר הוא 2.',
      `בדיקה: ${fmt(p)} × 2 = ${fmt(p * 2)}.`,
    ],
  });
}

/** שאלת החולצות - כן / לא / תלוי, ואז הסבר */
function genShirts() {
  const low = 15;
  const high = 25;
  const count = 3;
  const p = person();
  const money = pick([80, 40, 60, 90, 45]);
  const minCost = low * count;
  const maxCost = high * count;

  let verdict, correctText, wrongA, wrongB;
  if (money >= maxCost) {
    verdict = 'כן';
    correctText = `גם אם כל חולצה תעלה ${fmt(high)} ש"ח, ${fmt(count)} חולצות יעלו ${fmt(maxCost)} ש"ח - ויש ${fmt(money)} ש"ח.`;
    wrongA = `${fmt(money)} גדול מ-${fmt(high)}, ולכן תמיד יספיק.`;
    wrongB = `${fmt(count)} חולצות עולות ${fmt(minCost)} ש"ח בלבד, כי זה המחיר הזול ביותר.`;
  } else if (money < minCost) {
    verdict = 'לא';
    correctText = `אפילו במחיר הזול ביותר, ${fmt(count)} חולצות יעלו ${fmt(minCost)} ש"ח - ויש רק ${fmt(money)} ש"ח.`;
    wrongA = `${fmt(money)} קטן מ-${fmt(maxCost)}, ולכן בטוח לא יספיק אף פעם.`;
    wrongB = `אפשר לקנות ${fmt(count)} חולצות ולהישאר עם עודף.`;
  } else {
    verdict = 'תלוי במחיר';
    correctText = `במחיר הזול ${fmt(count)} חולצות עולות ${fmt(minCost)} ש"ח (מספיק), ובמחיר היקר ${fmt(maxCost)} ש"ח (לא מספיק).`;
    wrongA = `${fmt(money)} תמיד מספיק, כי הוא גדול מ-${fmt(minCost)}.`;
    wrongB = `${fmt(money)} אף פעם לא מספיק, כי הוא קטן מ-${fmt(maxCost)}.`;
  }

  return Q({
    type: 'word_shirts',
    topic: 'word',
    ui: 'explain',
    instruction: 'משימה:',
    story: `מחירן של חולצות בית ספר נע בין [[${fmt(low)}]] ש"ח ל-[[${fmt(high)}]] ש"ח. ל${p.name} יש [[${fmt(money)}]] ש"ח. האם הכסף יספיק ${p.to} לקניית [[${fmt(count)}]] חולצות?`,
    stage1: { kind: 'choice', prompt: 'מה התשובה?', choices: ['כן', 'לא', 'תלוי במחיר'] },
    answer: verdict,
    explainQuestion: 'ולמה?',
    options: explainOptions(correctText, wrongA, wrongB),
    hint: `בדקו שני מצבים: מה יקרה אם כל החולצות במחיר הזול (${fmt(low)} ש"ח), ומה יקרה אם כולן במחיר היקר (${fmt(high)} ש"ח).`,
    steps: [
      `הזול ביותר: ${fmt(count)} × ${fmt(low)} = ${fmt(minCost)} ש"ח.`,
      `היקר ביותר: ${fmt(count)} × ${fmt(high)} = ${fmt(maxCost)} ש"ח.`,
      `יש ${fmt(money)} ש"ח, ולכן התשובה היא: ${verdict}.`,
      correctText,
    ],
  });
}

/* ============================ שברים ============================ */

const SHAPE_KINDS = ['pizza', 'bar', 'pizza', 'bar', 'shield'];

/** צביעת חלקים כדי להראות שבר */
function genFracColor() {
  const parts = pick([2, 3, 4, 5, 6, 8]);
  const target = ri(1, parts - 1);
  const shapeKind = pick(SHAPE_KINDS);
  return Q({
    type: 'frac_color',
    topic: 'fractions',
    ui: 'frac_color',
    instruction: 'צבעו את החלקים כך שיתאימו לשבר:',
    shapes: 1,
    parts,
    target,
    shapeKind,
    fraction: { num: target, den: parts },
    answer: target,
    answerText: `${target}/${parts}`,
    hint: `המכנה ${fmt(parts)} אומר לכמה חלקים שווים חילקנו את השלם. המונה ${fmt(target)} אומר כמה חלקים צובעים.`,
    steps: [
      `השלם מחולק ל-${fmt(parts)} חלקים שווים - זה המכנה.`,
      `צריך לצבוע ${fmt(target)} חלקים - זה המונה.`,
      `ולכן צבענו ${target}/${parts} מהשלם.`,
    ],
  });
}

/** התאמת שבר לציור */
function genFracName() {
  const parts = pick([3, 4, 5, 6, 8]);
  const filled = ri(1, parts - 1);
  const wrongs = new Set();
  wrongs.add(`${parts - filled}/${parts}`);
  wrongs.add(`${filled}/${filled + parts}`);
  wrongs.add(`${filled + 1}/${parts}`);
  const options = shuffle([
    { text: `${filled}/${parts}`, correct: true },
    ...[...wrongs].filter((w) => w !== `${filled}/${parts}`).slice(0, 3).map((w) => ({ text: w, correct: false })),
  ]);
  return Q({
    type: 'frac_name',
    topic: 'fractions',
    ui: 'quiz',
    instruction: 'איזה שבר מתאים לציור?',
    figure: { kind: 'fraction', shapes: 1, parts, filled, shapeKind: pick(SHAPE_KINDS) },
    options,
    answer: `${filled}/${parts}`,
    answerText: `${filled}/${parts}`,
    hint: 'המכנה - לכמה חלקים שווים חולק השלם. המונה - כמה חלקים צבועים.',
    steps: [
      `השלם חולק ל-${fmt(parts)} חלקים שווים, ולכן המכנה הוא ${fmt(parts)}.`,
      `צבועים ${fmt(filled)} חלקים, ולכן המונה הוא ${fmt(filled)}.`,
      `השבר הוא ${filled}/${parts}.`,
    ],
  });
}

/** שבר גדול משלם, והפיכתו למספר מעורב */
function genFracImproper() {
  const den = pick([2, 3, 4, 5]);
  const whole = ri(1, 3);
  const rest = ri(1, den - 1);
  const num = whole * den + rest;
  const shapes = whole + 1;
  return Q({
    type: 'frac_improper',
    topic: 'fractions',
    ui: 'frac_color',
    instruction: 'צבעו את החלקים כדי לראות כמה שלמים יש בשבר:',
    shapes,
    parts: den,
    target: num,
    shapeKind: pick(['pizza', 'bar']),
    fraction: { num, den },
    followUp: { prompt: 'כמה שלמים שלמים קיבלנו?', answer: whole },
    answer: num,
    answerText: `${num}/${den} = ${whole} ${rest}/${den}`,
    hint: `כל שלם מורכב מ-${fmt(den)} חלקים. כמה פעמים ${fmt(den)} נכנס בתוך ${fmt(num)}?`,
    steps: [
      `כל שלם הוא ${den}/${den}.`,
      `${fmt(num)} : ${fmt(den)} = ${fmt(whole)} ונשארו ${fmt(rest)} חלקים.`,
      `ולכן ${num}/${den} = ${whole} שלמים ועוד ${rest}/${den}.`,
    ],
  });
}

/** מיון שברים לשתי תיבות */
function genFracSort() {
  const mode = ri(1, 2);
  if (mode === 1) {
    const halves = shuffle([[1, 2], [2, 4], [3, 6], [4, 8], [5, 10], [6, 12]]).slice(0, 3);
    const others = shuffle([[1, 3], [2, 3], [3, 4], [1, 4], [2, 5], [3, 5], [5, 8], [2, 6]]).slice(0, 3);
    const cards = shuffle([
      ...halves.map(([n, d]) => ({ num: n, den: d, bin: 0 })),
      ...others.map(([n, d]) => ({ num: n, den: d, bin: 1 })),
    ]);
    return Q({
      type: 'frac_sort_half',
      topic: 'fractions',
      ui: 'frac_sort',
      instruction: 'מיינו את השברים לשתי התיבות:',
      cards,
      bins: ['שווה לחצי', 'לא שווה לחצי'],
      answer: 'מיון נכון',
      answerText: cards.filter((c) => c.bin === 0).map((c) => `${c.num}/${c.den}`).join(', '),
      hint: 'שבר שווה לחצי כאשר המונה הוא בדיוק חצי מהמכנה, למשל 3/6 או 4/8.',
      steps: [
        'שבר שווה לחצי אם המכנה גדול פי 2 מהמונה.',
        `השברים ששווים לחצי כאן: ${cards.filter((c) => c.bin === 0).map((c) => `${c.num}/${c.den}`).join(', ')}.`,
        'בכל השאר המונה אינו בדיוק חצי מהמכנה.',
      ],
    });
  }

  // גדול מ-1 וקטן מ-2
  const between = shuffle([[3, 2], [5, 4], [4, 3], [7, 5], [5, 3], [9, 8]]).slice(0, 3);
  const outside = shuffle([[1, 2], [3, 4], [2, 3], [7, 3], [9, 4], [5, 2]]).slice(0, 3);
  const cards = shuffle([
    ...between.map(([n, d]) => ({ num: n, den: d, bin: 0 })),
    ...outside.map(([n, d]) => ({ num: n, den: d, bin: 1 })),
  ]);
  return Q({
    type: 'frac_sort_between',
    topic: 'fractions',
    ui: 'frac_sort',
    instruction: 'מיינו את השברים לשתי התיבות:',
    cards,
    bins: ['בין 1 ל-2', 'לא בין 1 ל-2'],
    answer: 'מיון נכון',
    answerText: cards.filter((c) => c.bin === 0).map((c) => `${c.num}/${c.den}`).join(', '),
    hint: 'שבר גדול מ-1 כשהמונה גדול מהמכנה, וקטן מ-2 כשהמונה קטן מפי 2 מהמכנה.',
    steps: [
      'שבר גדול מ-1 כאשר המונה גדול מהמכנה.',
      'שבר קטן מ-2 כאשר המונה קטן מפעמיים המכנה.',
      `השברים המתאימים כאן: ${cards.filter((c) => c.bin === 0).map((c) => `${c.num}/${c.den}`).join(', ')}.`,
    ],
  });
}

/** חיבור שברים בעלי מכנה זהה */
function genFracAdd() {
  const den = pick([4, 5, 6, 8, 10, 12]);
  const a = ri(1, den - 2);
  const b = ri(1, den - a - 1);
  const missing = pick(['result', 'right']);
  const total = a + b;
  return Q({
    type: 'frac_add',
    topic: 'fractions',
    ui: 'frac_add',
    instruction: missing === 'result' ? 'חברו את השברים:' : 'השלימו את השבר החסר:',
    den,
    left: a,
    right: b,
    total,
    missing,
    answer: missing === 'result' ? total : b,
    answerText: missing === 'result' ? `${total}/${den}` : `${b}/${den}`,
    hint: 'כשהמכנים זהים מחברים רק את המונים, והמכנה נשאר אותו הדבר.',
    steps: missing === 'result'
      ? [
        `המכנה זהה בשני השברים, ולכן הוא נשאר ${fmt(den)}.`,
        `מחברים את המונים: ${fmt(a)} + ${fmt(b)} = ${fmt(total)}.`,
        `התוצאה: ${total}/${den}.`,
      ]
      : [
        `המכנה זהה, ולכן עובדים רק עם המונים.`,
        `${fmt(total)} − ${fmt(a)} = ${fmt(b)}.`,
        `השבר החסר הוא ${b}/${den}.`,
      ],
  });
}

/* ============================ גאומטריה ============================ */

const TRIANGLE_GOALS = [
  { angle: 'obtuse', label: 'משולש קהה זווית' },
  { angle: 'right', label: 'משולש ישר זווית' },
  { angle: 'acute', label: 'משולש חד זווית' },
  { sides: 'isosceles', label: 'משולש שווה שוקיים' },
  { sides: 'scalene', label: 'משולש שונה צלעות' },
  { angle: 'right', sides: 'isosceles', label: 'משולש ישר זווית ושווה שוקיים' },
];

function genGeoTriangle() {
  const g = pick(TRIANGLE_GOALS);
  const tips = {
    obtuse: 'בזווית קהה שתי הצלעות "נפתחות" רחב - נסו נקודה רחוקה הצידה.',
    right: 'זווית ישרה נוצרת כששתי צלעות הולכות בדיוק לאורך קווי הרשת - אחת ימינה ואחת למטה.',
    acute: 'במשולש חד זווית כל שלוש הזוויות צרות - צורה "מחודדת" ולא שטוחה.',
  };
  const sideTips = {
    isosceles: 'שווה שוקיים - שתי צלעות באותו אורך בדיוק.',
    scalene: 'שונה צלעות - כל שלוש הצלעות באורכים שונים.',
  };
  return Q({
    type: 'geo_triangle',
    topic: 'geometry',
    ui: 'geo',
    instruction: `סרטטו ${g.label}:`,
    grid: { kind: 'square', cols: 8, rows: 8 },
    points: 3,
    goal: { kind: 'triangle', angle: g.angle, sides: g.sides },
    answer: g.label,
    answerText: g.label,
    hint: [g.angle ? tips[g.angle] : '', g.sides ? sideTips[g.sides] : ''].filter(Boolean).join(' '),
    steps: [
      `צריך לסרטט ${g.label}.`,
      g.angle === 'right' ? 'לדוגמה: נקודה אחת, נקודה שנייה ישר ימינה ממנה, ונקודה שלישית ישר מתחת לראשונה.' : '',
      g.angle === 'obtuse' ? 'לדוגמה: שתי נקודות על אותו קו, והשלישית קרוב מאוד לאחת מהן אך מעט הצידה.' : '',
      g.sides === 'isosceles' ? 'שתי הצלעות היוצאות מאותה נקודה צריכות להיות באותו אורך.' : '',
      'המשחק בודק את הזוויות ואת אורכי הצלעות באופן מדויק.',
    ].filter(Boolean),
  });
}

function genGeoEquilateral() {
  return Q({
    type: 'geo_equilateral',
    topic: 'geometry',
    ui: 'geo',
    instruction: 'סרטטו משולש שווה צלעות:',
    grid: { kind: 'tri', cols: 8, rows: 7 },
    points: 3,
    goal: { kind: 'triangle', sides: 'equilateral' },
    answer: 'משולש שווה צלעות',
    answerText: 'משולש שווה צלעות',
    hint: 'הרשת הזו משולשת: כל שלוש נקודות שכנות יוצרות משולש שווה צלעות.',
    steps: [
      'ברשת משולשת המרחק בין כל שתי נקודות שכנות זהה.',
      'בוחרים שלוש נקודות שכנות שיוצרות משולש - וכל הצלעות יוצאות שוות.',
      'אפשר גם משולש גדול יותר, כל עוד כל הצלעות באותו אורך.',
    ],
  });
}

function genGeoQuadEqual() {
  return Q({
    type: 'geo_quad_equal',
    topic: 'geometry',
    ui: 'geo',
    instruction: 'סרטטו מרובע שכל צלעותיו שוות:',
    grid: { kind: 'square', cols: 8, rows: 8 },
    points: 4,
    goal: { kind: 'quad', requires: 'rhombus' },
    answer: 'ריבוע או מעוין',
    answerText: 'ריבוע או מעוין',
    hint: 'ריבוע הוא הפתרון הקל. מעוין (יהלום) גם מתאים - כל הצלעות שוות אך הזוויות אינן ישרות.',
    steps: [
      'מרובע שכל צלעותיו שוות נקרא מעוין.',
      'ריבוע הוא מקרה מיוחד של מעוין, שבו גם כל הזוויות ישרות.',
      'הכי קל לסרטט ריבוע: אותו מספר צעדים בכל צלע.',
    ],
  });
}

function genGeoParallelogram() {
  const x = ri(1, 3);
  const y = ri(4, 6);
  const dx = ri(2, 4);
  return Q({
    type: 'geo_parallelogram',
    topic: 'geometry',
    ui: 'geo',
    instruction: 'לפניכם צלע אחת של מקבילית. השלימו את הסרטוט למקבילית:',
    grid: { kind: 'square', cols: 8, rows: 8 },
    points: 4,
    fixed: [{ c: x, r: y }, { c: x + dx, r: y }],
    goal: { kind: 'quad', requires: 'parallelogram' },
    answer: 'מקבילית',
    answerText: 'מקבילית',
    hint: 'במקבילית הצלע שמול הצלע הנתונה שווה לה באורך ומקבילה לה - אותה תזוזה בדיוק.',
    steps: [
      'הצלע הנתונה הולכת כמה צעדים לצד אחד.',
      'מוסיפים שתי נקודות כך שהצלע שמולה תהיה באותו כיוון ובאותו אורך.',
      'התוצאה: שתי זוגות של צלעות מקבילות ושוות - מקבילית.',
    ],
  });
}

function genGeoRect(kind) {
  const isArea = kind === 'area';
  const value = isArea ? pick([18, 12, 24, 16]) : pick([18, 14, 20, 16]);
  const goal = { kind: isArea ? 'rect_area' : 'rect_perimeter', value };
  return Q({
    type: isArea ? 'geo_rect_area' : 'geo_rect_perimeter',
    topic: 'geometry',
    ui: 'geo',
    instruction: isArea
      ? `סרטטו מלבן ששטחו ${fmt(value)} סמ"ר:`
      : `סרטטו מלבן שהיקפו ${fmt(value)} ס"מ:`,
    grid: { kind: 'square', cols: 10, rows: 8 },
    points: 4,
    goal,
    collect: true,
    answer: isArea ? `מלבן ששטחו ${value}` : `מלבן שהיקפו ${value}`,
    answerText: allRectSolutions(goal).join(' , '),
    hint: isArea
      ? `שטח = אורך × רוחב. אילו שני מספרים מוכפלים ונותנים ${fmt(value)}?`
      : `היקף = סכום כל ארבע הצלעות. אורך ורוחב ביחד צריכים להיות ${fmt(value / 2)}.`,
    steps: isArea
      ? [
        `שטח המלבן הוא אורך × רוחב.`,
        `צריך שני מספרים שמכפלתם ${fmt(value)}.`,
        `כל האפשרויות: ${allRectSolutions(goal).join(' , ')}.`,
      ]
      : [
        `היקף = 2 × (אורך + רוחב).`,
        `${fmt(value)} : 2 = ${fmt(value / 2)}, ולכן אורך + רוחב = ${fmt(value / 2)}.`,
        `כל האפשרויות: ${allRectSolutions(goal).join(' , ')}.`,
      ],
  });
}

function genGeoParallelSide() {
  const w = ri(3, 6);
  const h = ri(2, 4);
  const x = ri(1, 3);
  const y = ri(1, 3);
  const corners = [
    { c: x, r: y }, { c: x + w, r: y }, { c: x + w, r: y + h }, { c: x, r: y + h },
  ];
  const highlighted = ri(0, 3);
  return Q({
    type: 'geo_parallel_side',
    topic: 'geometry',
    ui: 'geo',
    instruction: 'לפניכם מלבן שבו מודגשת צלע אחת. בחרו את הצלע המקבילה לה:',
    grid: { kind: 'square', cols: 9, rows: 8 },
    mode: 'pick_side',
    corners,
    highlighted,
    goal: { kind: 'pick_side' },
    answerIndex: (highlighted + 2) % 4,
    answer: 'הצלע שמול הצלע המודגשת',
    answerText: 'הצלע שנמצאת בדיוק מול הצלע המודגשת',
    hint: 'צלעות מקבילות הן צלעות שלעולם לא ייפגשו. במלבן זו תמיד הצלע שנמצאת מול הצלע המודגשת.',
    steps: [
      'במלבן יש שני זוגות של צלעות מקבילות.',
      'הצלע המקבילה לצלע המודגשת היא זו שנמצאת ממול, בכיוון זהה.',
      'הצלעות שנוגעות בצלע המודגשת ניצבות לה, ולא מקבילות.',
    ],
  });
}

function genGeoProps() {
  const sets = [
    {
      prompt: 'מה נכון תמיד לגבי ריבוע?',
      options: [
        { text: 'כל הצלעות שוות וכל ארבע הזוויות ישרות.', correct: true },
        { text: 'כל הצלעות שוות, אבל הזוויות אינן ישרות.', correct: false },
        { text: 'רק שתי צלעות נגדיות שוות.', correct: false },
      ],
      steps: ['בריבוע ארבע צלעות שוות.', 'בנוסף, כל ארבע הזוויות הן זוויות ישרות (90 מעלות).', 'לכן ריבוע הוא גם מלבן וגם מעוין.'],
      hint: 'חשבו גם על הצלעות וגם על הזוויות.',
    },
    {
      prompt: 'מה ההבדל בין מעוין לריבוע?',
      options: [
        { text: 'בשניהם כל הצלעות שוות, אבל במעוין הזוויות אינן חייבות להיות ישרות.', correct: true },
        { text: 'במעוין הצלעות אינן שוות, ובריבוע כן.', correct: false },
        { text: 'אין שום הבדל, אלה שתי מילים לאותה צורה.', correct: false },
      ],
      steps: ['במעוין כל ארבע הצלעות שוות באורכן.', 'הזוויות במעוין אינן חייבות להיות ישרות.', 'ריבוע הוא מעוין מיוחד שבו כל הזוויות ישרות.'],
      hint: 'בשתי הצורות כל הצלעות שוות. מה עם הזוויות?',
    },
    {
      prompt: 'כמה זוגות של צלעות מקבילות יש במקבילית?',
      options: [
        { text: 'שני זוגות - כל שתי צלעות נגדיות מקבילות.', correct: true },
        { text: 'זוג אחד בלבד.', correct: false },
        { text: 'אף זוג - הצלעות נפגשות.', correct: false },
      ],
      steps: ['במקבילית הצלעות הנגדיות מקבילות זו לזו.', 'יש שני זוגות כאלה.', 'הצלעות הנגדיות גם שוות באורכן.'],
      hint: 'השם "מקבילית" מרמז על התשובה.',
    },
  ];
  const s = pick(sets);
  return Q({
    type: 'geo_props',
    topic: 'geometry',
    ui: 'quiz',
    instruction: s.prompt,
    options: shuffle(s.options),
    answer: s.options.find((o) => o.correct).text,
    answerText: s.options.find((o) => o.correct).text,
    hint: s.hint,
    steps: s.steps,
  });
}

/* ============================ קריאת דיאגרמה ============================ */

function genChart() {
  const labels = shuffle(['לוחם', 'דרקון', 'קשת', 'קוסם', 'אביר']).slice(0, 4);
  const values = labels.map(() => ri(2, 12) * 5);
  const mode = ri(1, 4);
  const maxI = values.indexOf(Math.max(...values));
  const minI = values.indexOf(Math.min(...values));
  const unit = pick(['נקודות כוח', 'מטבעות', 'ניצחונות']);

  let prompt, answer, steps;
  if (mode === 1) {
    prompt = `כמה ${unit} יש ל${labels[maxI]}?`;
    answer = values[maxI];
    steps = [`מחפשים את העמודה של ${labels[maxI]}.`, `הגובה שלה מראה ${fmt(answer)}.`];
  } else if (mode === 2) {
    prompt = `בכמה ${unit} יש ל${labels[maxI]} יותר מאשר ל${labels[minI]}?`;
    answer = values[maxI] - values[minI];
    steps = [
      `ל${labels[maxI]} יש ${fmt(values[maxI])}.`,
      `ל${labels[minI]} יש ${fmt(values[minI])}.`,
      `${fmt(values[maxI])} − ${fmt(values[minI])} = ${fmt(answer)}.`,
    ];
  } else if (mode === 3) {
    prompt = `כמה ${unit} יש לכולם ביחד?`;
    answer = values.reduce((s, v) => s + v, 0);
    steps = [`מחברים את כל העמודות:`, `${values.map((v) => fmt(v)).join(' + ')} = ${fmt(answer)}.`];
  } else {
    const i = ri(0, labels.length - 1);
    const j = (i + 1) % labels.length;
    prompt = `מה ההפרש בין ${labels[i]} ל${labels[j]}?`;
    answer = Math.abs(values[i] - values[j]);
    steps = [
      `ל${labels[i]} יש ${fmt(values[i])}, ול${labels[j]} יש ${fmt(values[j])}.`,
      `ההפרש: ${fmt(Math.max(values[i], values[j]))} − ${fmt(Math.min(values[i], values[j]))} = ${fmt(answer)}.`,
    ];
  }

  return Q({
    type: 'chart_read',
    topic: 'chart',
    ui: 'chart',
    instruction: prompt,
    chart: { labels, values, unit },
    answer,
    hint: 'כל עמודה מראה מספר. קראו את הגובה של העמודות שהשאלה מדברת עליהן.',
    steps,
  });
}

/* ============================ רישום הגנרטורים ============================ */

export const GENERATORS = [
  // level: 'easy' - שאלות למתחילים, מופיעות בעיקר כשהנושא עוד חדש (ראו topicLevel)
  { type: 'mult_small', topic: 'mult_table', weight: 3, level: 'easy', gen: genMultSmall },
  { type: 'mult_table', topic: 'mult_table', weight: 3, gen: genMultTable },
  { type: 'mult_round_tens', topic: 'mult_big', weight: 1.2, gen: genMultRoundTens },
  { type: 'mult_by_unit', topic: 'mult_big', weight: 1, gen: genMultByUnit },
  { type: 'add4', topic: 'add_sub', weight: 1.1, gen: genAdd4 },
  { type: 'sub4', topic: 'add_sub', weight: 1.1, gen: genSub4 },
  { type: 'order_ops', topic: 'order_ops', weight: 0.9, gen: genOrderOps },
  { type: 'order_ops_tap', topic: 'order_ops', weight: 1.2, gen: genOrderOpsTap },
  { type: 'missing_easy_add', topic: 'missing', weight: 1.3, level: 'easy', gen: genMissingAddSub },
  { type: 'missing_easy_mul', topic: 'missing', weight: 1.3, level: 'easy', gen: genMissingMulSmall },
  { type: 'missing', topic: 'missing', weight: 1.3, gen: genMissing },
  { type: 'weight', topic: 'weight', weight: 1, gen: genWeight },
  { type: 'numberline_fill', topic: 'numberline', weight: 1.1, gen: genNumberLineFill },
  { type: 'numberline_locate', topic: 'numberline', weight: 0.8, gen: genNumberLineLocate },
  { type: 'distribute_split', topic: 'distribute', weight: 1.1, gen: genDistributeSplit },
  { type: 'distribute_missing', topic: 'distribute', weight: 0.9, gen: genDistributeMissing },
  { type: 'divisibility', topic: 'divisibility', weight: 1.2, gen: genDivisibility },
  { type: 'insight', topic: 'insight', weight: 1, gen: genInsight },
  { type: 'word_diff', topic: 'word', weight: 0.5, gen: genWordDiff },
  { type: 'word_budget', topic: 'word', weight: 0.5, gen: genWordBudget },
  { type: 'word_half_half', topic: 'word', weight: 0.5, gen: genWordHalfHalf },
  { type: 'word_multi_buy', topic: 'word', weight: 0.4, gen: genWordMultiBuy },
  { type: 'word_buy_remain', topic: 'word', weight: 0.4, gen: genWordBuyRemain },
  { type: 'word_shirts', topic: 'word', weight: 0.5, gen: genShirts },

  { type: 'frac_color', topic: 'fractions', weight: 1, gen: genFracColor },
  { type: 'frac_name', topic: 'fractions', weight: 1, gen: genFracName },
  { type: 'frac_improper', topic: 'fractions', weight: 1, gen: genFracImproper },
  { type: 'frac_sort', topic: 'fractions', weight: 0.9, gen: genFracSort },
  { type: 'frac_add', topic: 'fractions', weight: 1.1, gen: genFracAdd },

  { type: 'geo_triangle', topic: 'geometry', weight: 1.1, gen: genGeoTriangle },
  { type: 'geo_equilateral', topic: 'geometry', weight: 0.5, gen: genGeoEquilateral },
  { type: 'geo_quad_equal', topic: 'geometry', weight: 0.7, gen: genGeoQuadEqual },
  { type: 'geo_parallelogram', topic: 'geometry', weight: 0.8, gen: genGeoParallelogram },
  { type: 'geo_rect_area', topic: 'geometry', weight: 0.9, gen: () => genGeoRect('area') },
  { type: 'geo_rect_perimeter', topic: 'geometry', weight: 0.9, gen: () => genGeoRect('perimeter') },
  { type: 'geo_parallel_side', topic: 'geometry', weight: 0.8, gen: genGeoParallelSide },
  { type: 'geo_props', topic: 'geometry', weight: 0.7, gen: genGeoProps },

  { type: 'chart_read', topic: 'chart', weight: 1, gen: genChart },
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
  // --- ישר המספרים ---
  () => T({
    type: 'teacher_numberline_1', topic: 'numberline', ui: 'numberline_fill',
    instruction: 'השלימו את ציר המספרים במקומות החסרים:',
    stones: [
      { value: 3900, blank: false }, { value: 4000, blank: true },
      { value: 4100, blank: true }, { value: 4200, blank: false },
    ],
    step: 100, answer: 4000, answers: [4000, 4100],
    hint: 'ההפרש בין 3,900 ל-4,200 הוא 300, בשלוש קפיצות - כל קפיצה 100.',
    steps: ['כל קפיצה היא 100.', '3,900 + 100 = 4,000.', '4,000 + 100 = 4,100.'],
  }),
  () => T({
    type: 'teacher_numberline_2', topic: 'numberline', ui: 'numberline_fill',
    instruction: 'השלימו את ציר המספרים במקומות החסרים:',
    stones: [
      { value: 5600, blank: false }, { value: 5700, blank: false },
      { value: 5800, blank: true }, { value: 5900, blank: true },
      { value: 6000, blank: false },
    ],
    step: 100, answer: 5800, answers: [5800, 5900],
    hint: 'מ-5,600 ל-5,700 הקפיצה היא 100, ולכן כל הקפיצות הן 100.',
    steps: ['5,700 − 5,600 = 100, זו גודל הקפיצה.', '5,700 + 100 = 5,800.', '5,800 + 100 = 5,900.'],
  }),

  // --- פילוג ---
  () => T({
    type: 'teacher_dist_1', topic: 'distribute',
    instruction: 'כתבו תרגיל מתאים לפירוק - השלימו את החסר:',
    expr: '52 × 5 = 50 × 5 + ? × 5', exprPlain: '52*5=50*5+x*5', answer: 2,
    hint: '52 פורק ל-50 ועוד משהו. כמה חסר ל-50 כדי להגיע ל-52?',
    steps: ['52 = 50 + 2.', 'ולכן 52 × 5 = 50 × 5 + 2 × 5.', 'בדיקה: 250 + 10 = 260.'],
  }),
  () => T({
    type: 'teacher_dist_2', topic: 'distribute',
    instruction: 'השלימו את המספר החסר:',
    expr: '52 × 16 = 52 × 6 + 52 × ?', exprPlain: '52*16=52*6+52*x', answer: 10,
    hint: 'שני החלקים ביחד צריכים להשלים 16.',
    steps: ['16 − 6 = 10.', 'בדיקה: 52 × 6 + 52 × 10 = 312 + 520 = 832 = 52 × 16.'],
  }),
  () => T({
    type: 'teacher_dist_3', topic: 'distribute',
    instruction: 'השלימו את המספר החסר:',
    expr: '52 × 16 = 52 × 9 + 52 × ?', exprPlain: '52*16=52*9+52*x', answer: 7,
    hint: 'כמה חסר ל-9 כדי להגיע ל-16?',
    steps: ['16 − 9 = 7.', 'בדיקה: 52 × 9 + 52 × 7 = 468 + 364 = 832.'],
  }),
  () => T({
    type: 'teacher_dist_4', topic: 'distribute',
    instruction: 'השלימו את המספר החסר:',
    expr: '36 × 18 = 36 × 10 + 36 × ?', exprPlain: '36*18=36*10+36*x', answer: 8,
    hint: 'כמה חסר ל-10 כדי להגיע ל-18?',
    steps: ['18 − 10 = 8.', 'בדיקה: 360 + 288 = 648 = 36 × 18.'],
  }),
  () => T({
    type: 'teacher_dist_5', topic: 'distribute',
    instruction: 'השלימו את המספר החסר:',
    expr: '36 × 18 = 36 × 11 + 36 × ?', exprPlain: '36*18=36*11+36*x', answer: 7,
    hint: 'כמה חסר ל-11 כדי להגיע ל-18?',
    steps: ['18 − 11 = 7.', 'בדיקה: 396 + 252 = 648.'],
  }),

  // --- סימני התחלקות ---
  () => T({
    type: 'teacher_div_1', topic: 'divisibility', ui: 'divisibility',
    instruction: 'סמנו כל ספרה שמתאימה, כך שהמספר יתחלק ב-2:',
    digitsShown: [5, null, 6], divisor: 2, validDigits: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
    expr: '5?6', answer: 0,
    hint: DIVISIBILITY_RULES[2],
    steps: [
      DIVISIBILITY_RULES[2],
      'ספרת האחדות כאן היא 6, והיא כבר זוגית.',
      'לכן כל ספרה שנשים באמצע תתאים - כל עשר הספרות נכונות!',
    ],
  }),
  () => T({
    type: 'teacher_div_2', topic: 'divisibility', ui: 'divisibility',
    instruction: 'סמנו כל ספרה שמתאימה, כך שהמספר יתחלק ב-6:',
    digitsShown: [3, null, 2], divisor: 6, validDigits: [1, 4, 7],
    expr: '3?2', answer: 1,
    hint: DIVISIBILITY_RULES[6],
    steps: [
      DIVISIBILITY_RULES[6],
      'ספרת האחדות היא 2, כלומר המספר כבר מתחלק ב-2.',
      'נשאר לבדוק התחלקות ב-3: סכום הספרות הוא 3 + ? + 2 = 5 + ?.',
      'כדי שהסכום יתחלק ב-3 צריך ש-? יהיה 1, 4 או 7 (סכום 6, 9 או 12).',
      'בדיקה: 312 : 6 = 52, 342 : 6 = 57, 372 : 6 = 62.',
    ],
  }),

  // --- תובנה מספרית ---
  () => T({
    type: 'teacher_insight_1', topic: 'insight', ui: 'explain',
    instruction: 'לפניכם תרגיל פתור. היעזרו בו:',
    given: '45 × 18 = 810',
    stage1: { kind: 'numeric', prompt: '90 × 18 = ?' },
    answer: 1620,
    explainQuestion: 'איך ידענו, בלי לחשב מחדש?',
    options: [
      { text: 'הגורם 45 גדל פי 2 (45 × 2 = 90), ולכן גם המכפלה גדלה פי 2.', correct: true },
      { text: 'הגורם 45 גדל ב-45, ולכן מוסיפים 45 למכפלה.', correct: false },
      { text: 'שני הגורמים השתנו, ולכן צריך לכפול הכול מחדש.', correct: false },
    ],
    hint: '90 זה פי 2 מ-45. מה קורה למכפלה?',
    steps: ['90 = 45 × 2.', 'גורם אחד גדל פי 2, ולכן המכפלה גדלה פי 2.', '810 × 2 = 1,620.'],
  }),
  () => T({
    type: 'teacher_insight_2', topic: 'insight', ui: 'explain',
    instruction: 'לפניכם תרגיל פתור. היעזרו בו:',
    given: '45 × 18 = 810',
    stage1: { kind: 'numeric', prompt: '45 × 9 = ?' },
    answer: 405,
    explainQuestion: 'איך ידענו, בלי לחשב מחדש?',
    options: [
      { text: 'הגורם 18 קטן פי 2 (18 : 2 = 9), ולכן גם המכפלה קטנה פי 2.', correct: true },
      { text: 'הגורם 18 קטן ב-9, ולכן מחסירים 9 מהמכפלה.', correct: false },
      { text: 'כשמקטינים גורם, המכפלה לא משתנה.', correct: false },
    ],
    hint: '9 זה חצי מ-18. מה קורה למכפלה?',
    steps: ['9 = 18 : 2.', 'גורם אחד קטן פי 2, ולכן המכפלה קטנה פי 2.', '810 : 2 = 405.'],
  }),
  () => T({
    type: 'teacher_insight_3', topic: 'insight', ui: 'explain',
    instruction: 'לפניכם תרגיל פתור. היעזרו בו:',
    given: '15 × 18 = 270',
    stage1: { kind: 'numeric', prompt: '15 × 18 × ? = 540' },
    answer: 2,
    explainQuestion: 'הסבירו כיצד נעזרתם בתרגיל הפתור, מבלי לחשב:',
    options: [
      { text: 'הגורמים בתרגיל זהים. גילינו שהמכפלה גדלה פי 2, ולכן נכפול בגורם 2.', correct: true },
      { text: 'המכפלה גדלה ב-270, ולכן הגורם החסר הוא 270.', correct: false },
      { text: 'צריך לחלק את 540 ב-15 וב-18 כדי למצוא את הגורם.', correct: false },
    ],
    hint: 'השוו בין 540 ל-270: פי כמה גדלה המכפלה?',
    steps: ['540 : 270 = 2, כלומר המכפלה גדלה פי 2.', 'הגורמים 15 ו-18 לא השתנו.', 'לכן הגורם החסר הוא 2.'],
  }),

  // --- שברים ---
  () => T({
    type: 'teacher_frac_1', topic: 'fractions', ui: 'quiz',
    instruction: 'כתבו את השבר המתאים לציור:',
    figure: { kind: 'fraction', shapes: 1, parts: 4, filled: 3, shapeKind: 'pizza' },
    options: shuffle([
      { text: '3/4', correct: true }, { text: '4/3', correct: false }, { text: '1/4', correct: false }, { text: '3/7', correct: false },
    ]),
    answer: '3/4', answerText: '3/4',
    hint: 'המכנה - לכמה חלקים חולק השלם. המונה - כמה חלקים צבועים.',
    steps: ['העיגול חולק ל-4 חלקים שווים, ולכן המכנה הוא 4.', 'צבועים 3 חלקים, ולכן המונה הוא 3.', 'השבר הוא 3/4.'],
  }),
  () => T({
    type: 'teacher_frac_2', topic: 'fractions', ui: 'frac_sort',
    instruction: 'הקיפו את השברים הגדולים מ-1 וקטנים מ-2 - מיינו אותם לתיבה הנכונה:',
    cards: shuffle([
      { num: 3, den: 2, bin: 0 }, { num: 5, den: 4, bin: 0 }, { num: 4, den: 3, bin: 0 },
      { num: 1, den: 2, bin: 1 }, { num: 5, den: 2, bin: 1 }, { num: 3, den: 4, bin: 1 },
    ]),
    bins: ['בין 1 ל-2', 'לא בין 1 ל-2'],
    answer: 'מיון נכון', answerText: '3/2 , 5/4 , 4/3',
    hint: 'שבר גדול מ-1 כשהמונה גדול מהמכנה. שבר קטן מ-2 כשהמונה קטן מפי 2 מהמכנה.',
    steps: [
      '3/2 = שלם וחצי, 5/4 = שלם ורבע, 4/3 = שלם ושליש - כולם בין 1 ל-2.',
      '1/2 ו-3/4 קטנים מ-1.',
      '5/2 = שניים וחצי, כלומר גדול מ-2.',
    ],
  }),
  () => T({
    type: 'teacher_frac_3', topic: 'fractions', ui: 'frac_sort',
    instruction: 'מצאו שברים השווים לחצי - מיינו אותם לתיבה הנכונה:',
    cards: shuffle([
      { num: 2, den: 4, bin: 0 }, { num: 3, den: 6, bin: 0 }, { num: 5, den: 10, bin: 0 },
      { num: 2, den: 3, bin: 1 }, { num: 3, den: 4, bin: 1 }, { num: 2, den: 5, bin: 1 },
    ]),
    bins: ['שווה לחצי', 'לא שווה לחצי'],
    answer: 'מיון נכון', answerText: '2/4 , 3/6 , 5/10',
    hint: 'שבר שווה לחצי כאשר המכנה גדול פי 2 מהמונה.',
    steps: ['2/4: 4 זה פי 2 מ-2, ולכן זה חצי.', '3/6 ו-5/10 - גם כאן המכנה גדול פי 2 מהמונה.', 'בשאר השברים היחס שונה, ולכן הם אינם חצי.'],
  }),
  () => T({
    type: 'teacher_frac_4', topic: 'fractions', ui: 'frac_add',
    instruction: 'השלימו את השבר החסר:',
    den: 8, left: 3, right: 4, total: 7, missing: 'right',
    answer: 4, answerText: '4/8',
    hint: 'המכנה זהה, ולכן עובדים רק עם המונים: כמה חסר ל-3 כדי להגיע ל-7?',
    steps: ['המכנה נשאר 8.', '7 − 3 = 4.', 'השבר החסר הוא 4/8.'],
  }),

  // --- גאומטריה ---
  () => T({
    type: 'teacher_geo_1', topic: 'geometry', ui: 'geo',
    instruction: 'לפניכם מלבן שבו מודגשת צלע אחת. בחרו צלע מקבילה לצלע המודגשת:',
    grid: { kind: 'square', cols: 9, rows: 8 },
    mode: 'pick_side',
    corners: [{ c: 1, r: 2 }, { c: 6, r: 2 }, { c: 6, r: 5 }, { c: 1, r: 5 }],
    highlighted: 0, answerIndex: 2,
    goal: { kind: 'pick_side' },
    answer: 'הצלע שמול הצלע המודגשת', answerText: 'הצלע התחתונה, שמול הצלע המודגשת',
    hint: 'צלעות מקבילות לעולם לא נפגשות. במלבן זו הצלע שנמצאת בדיוק ממול.',
    steps: ['הצלע המודגשת היא הצלע העליונה.', 'הצלע המקבילה לה היא הצלע התחתונה.', 'שתי הצלעות האחרות ניצבות לה ולא מקבילות.'],
  }),
  () => T({
    type: 'teacher_geo_2', topic: 'geometry', ui: 'geo',
    instruction: 'סרטטו מרובע שכל צלעותיו שוות:',
    grid: { kind: 'square', cols: 8, rows: 8 }, points: 4,
    goal: { kind: 'quad', requires: 'rhombus' },
    answer: 'ריבוע או מעוין', answerText: 'ריבוע או מעוין',
    hint: 'ריבוע הוא הפתרון הפשוט ביותר: אותו מספר צעדים בכל צלע.',
    steps: ['מרובע שכל צלעותיו שוות נקרא מעוין.', 'ריבוע הוא מעוין שבו גם הזוויות ישרות.', 'שני הפתרונות מתקבלים.'],
  }),
  () => T({
    type: 'teacher_geo_3', topic: 'geometry', ui: 'geo',
    instruction: 'לפניכם סרטוט של צלע אחת במקבילית. השלימו את הסרטוט למקבילית:',
    grid: { kind: 'square', cols: 8, rows: 8 }, points: 4,
    fixed: [{ c: 2, r: 5 }, { c: 5, r: 5 }],
    goal: { kind: 'quad', requires: 'parallelogram' },
    answer: 'מקבילית', answerText: 'מקבילית',
    hint: 'הצלע שמול הצלע הנתונה חייבת להיות באותו אורך ובאותו כיוון.',
    steps: ['הצלע הנתונה היא 3 צעדים ימינה.', 'מוסיפים שתי נקודות כך שגם הצלע שממול תהיה 3 צעדים באותו כיוון.', 'התוצאה היא מקבילית.'],
  }),
  () => T({
    type: 'teacher_geo_4', topic: 'geometry', ui: 'geo',
    instruction: 'סרטטו משולש קהה זווית:',
    grid: { kind: 'square', cols: 8, rows: 8 }, points: 3,
    goal: { kind: 'triangle', angle: 'obtuse' },
    answer: 'משולש קהה זווית', answerText: 'משולש קהה זווית',
    hint: 'זווית קהה גדולה מזווית ישרה - המשולש נראה "שטוח ורחב".',
    steps: ['בוחרים שתי נקודות רחוקות זו מזו על אותו קו.', 'הנקודה השלישית קרובה לאחת מהן ורק מעט מעליה.', 'הזווית ליד אותה נקודה תצא קהה.'],
  }),
  () => T({
    type: 'teacher_geo_5', topic: 'geometry', ui: 'geo',
    instruction: 'סרטטו משולש שווה צלעות:',
    grid: { kind: 'tri', cols: 8, rows: 7 }, points: 3,
    goal: { kind: 'triangle', sides: 'equilateral' },
    answer: 'משולש שווה צלעות', answerText: 'משולש שווה צלעות',
    hint: 'ברשת המשולשת הזו כל שלוש נקודות שכנות יוצרות משולש שווה צלעות.',
    steps: ['ברשת משולשת כל הנקודות השכנות במרחק זהה.', 'בוחרים שלוש נקודות שכנות.', 'כל שלוש הצלעות יוצאות באותו אורך.'],
  }),
  () => T({
    type: 'teacher_geo_6', topic: 'geometry', ui: 'geo',
    instruction: 'סרטטו משולש ישר זווית ושווה שוקיים:',
    grid: { kind: 'square', cols: 8, rows: 8 }, points: 3,
    goal: { kind: 'triangle', angle: 'right', sides: 'isosceles' },
    answer: 'משולש ישר זווית ושווה שוקיים', answerText: 'משולש ישר זווית ושווה שוקיים',
    hint: 'שתי צלעות באותו אורך שיוצאות מאותה נקודה - אחת ימינה ואחת למטה.',
    steps: ['נקודה אחת היא "הפינה" של הזווית הישרה.', 'מהפינה יוצאים 3 צעדים ימינה, ו-3 צעדים למטה.', 'מחברים את שתי הנקודות ומקבלים משולש ישר זווית ושווה שוקיים.'],
  }),
  () => T({
    type: 'teacher_geo_7', topic: 'geometry', ui: 'geo',
    instruction: 'סרטטו מלבנים שונים ששטחם 18 סמ"ר:',
    grid: { kind: 'square', cols: 10, rows: 8 }, points: 4,
    goal: { kind: 'rect_area', value: 18 }, collect: true,
    answer: 'מלבן ששטחו 18', answerText: '1 × 18 , 2 × 9 , 3 × 6',
    hint: 'שטח = אורך × רוחב. אילו שני מספרים מוכפלים ונותנים 18?',
    steps: ['18 = 1 × 18.', '18 = 2 × 9.', '18 = 3 × 6.', 'כל אחד מהמלבנים האלה נכון - נסו למצוא כמה שיותר!'],
  }),
  () => T({
    type: 'teacher_geo_8', topic: 'geometry', ui: 'geo',
    instruction: 'סרטטו מלבנים שונים שהיקפם 18 ס"מ:',
    grid: { kind: 'square', cols: 10, rows: 8 }, points: 4,
    goal: { kind: 'rect_perimeter', value: 18 }, collect: true,
    answer: 'מלבן שהיקפו 18', answerText: '1 × 8 , 2 × 7 , 3 × 6 , 4 × 5',
    hint: 'היקף = 2 × (אורך + רוחב). כלומר אורך + רוחב = 9.',
    steps: ['18 : 2 = 9, ולכן אורך + רוחב = 9.', 'האפשרויות: 1 ו-8, 2 ו-7, 3 ו-6, 4 ו-5.', 'נסו למצוא כמה שיותר מלבנים שונים!'],
  }),

  // --- קריאת דיאגרמה ---
  () => T({
    type: 'teacher_chart', topic: 'chart', ui: 'chart',
    instruction: 'לפניכם דיאגרמה של ניצחונות הלוחמים. בכמה ניצחונות יש ללוחם יותר מאשר לקוסם?',
    chart: { labels: ['לוחם', 'דרקון', 'קוסם', 'קשת'], values: [45, 30, 20, 35], unit: 'ניצחונות' },
    answer: 25,
    hint: 'קראו את הגובה של שתי העמודות, ואז חסרו.',
    steps: ['ללוחם יש 45 ניצחונות.', 'לקוסם יש 20 ניצחונות.', '45 − 20 = 25.'],
  }),

  // --- שאלת החולצות ---
  () => T({
    type: 'teacher_shirts', topic: 'word', ui: 'explain',
    instruction: 'משימה:',
    story: 'מחירן של חולצות בית ספר בחנות נע בין [[15]] ש"ח ל-[[25]] ש"ח. לאוריה יש [[80]] ש"ח. האם הכסף יספיק לה לקניית [[3]] חולצות?',
    stage1: { kind: 'choice', prompt: 'מה התשובה?', choices: ['כן', 'לא', 'תלוי במחיר'] },
    answer: 'כן',
    explainQuestion: 'הסבירו:',
    options: [
      { text: 'גם במחיר היקר ביותר 3 חולצות עולות 75 ש"ח, ויש לאוריה 80 ש"ח - אז תמיד יספיק.', correct: true },
      { text: '3 חולצות עולות 45 ש"ח, כי זה המחיר הזול ביותר בחנות.', correct: false },
      { text: 'תלוי במחיר, כי אם כל חולצה תעלה 25 ש"ח לא יהיה מספיק כסף.', correct: false },
    ],
    hint: 'בדקו את המקרה הגרוע ביותר: מה אם כל החולצות עולות 25 ש"ח?',
    steps: [
      'המחיר היקר ביותר: 3 × 25 = 75 ש"ח.',
      'המחיר הזול ביותר: 3 × 15 = 45 ש"ח.',
      'לאוריה יש 80 ש"ח, וזה יותר מ-75, ולכן הכסף יספיק בכל מקרה.',
    ],
  }),

  () => T({
    type: 'teacher_word_3', topic: 'word', ui: 'mission',
    story: 'שירה קיבלה [[200]] שקלים מהוריה ליום הולדתה. חצי מהסכום היא חסכה, בחצי שנותר קנתה נעליים וחולצה במחיר זהה. כמה כסף עלתה החולצה?',
    answer: 50, unit: 'ש"ח',
    hint: 'חצי מ-200 זה 100, ואת ה-100 מחלקים לשני פריטים שווים.',
    steps: ['200 : 2 = 100 ש"ח נשארו אחרי החיסכון.', '100 : 2 = 50.', 'החולצה עלתה 50 ש"ח.'],
  }),
];

export function randomTeacherQuestion(topic = null) {
  const pool = topic
    ? TEACHER_QUESTIONS.filter((f) => f().topic === topic)
    : TEACHER_QUESTIONS;
  return pool.length ? pick(pool)() : null;
}

/** יצירת שאלה לפי מזהה סוג - מהגנרטורים או משאלות המורה */
export function makeByType(type) {
  const g = GENERATORS.find((x) => x.type === type);
  if (g) return g.gen();
  for (const f of TEACHER_QUESTIONS) {
    const q = f();
    if (q.type === type) return q;
  }
  return null;
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
 * רמת הנושא: 0 = מתחילים, 1 = רגיל.
 * עוברים לרגיל אחרי מספיק תרגול עם דיוק טוב, וחוזרים למתחילים אם הדיוק יורד.
 */
export function topicLevel(stats, topicId) {
  const t = stats?.byTopic?.[topicId];
  if (!t || t.answered < 10) return 0;
  return t.firstTry / t.answered >= 0.75 ? 1 : 0;
}

function topicHasEasy(topicId) {
  return GENERATORS.some((x) => x.topic === topicId && x.level === 'easy');
}

/** למתחילים - הרבה שאלות קלות ומעט רגילות. ברמה רגילה - קלות מדי פעם לחימום */
function levelWeight(stats, g) {
  const lvl = topicLevel(stats, g.topic);
  if (g.level === 'easy') return lvl === 0 ? 3 : 0.25;
  // לכל נושא שאין בו שאלות קלות - אין שינוי
  return topicHasEasy(g.topic) && lvl === 0 ? 0.35 : 1;
}

/** האם השאלה מתאימה לרמה הנוכחית בנושא (ולכן מותר לחזור עליה באותו קרב) */
function matchesLevel(stats, g) {
  if (!topicHasEasy(g.topic)) return false;
  return (g.level === 'easy') === (topicLevel(stats, g.topic) === 0);
}

/**
 * בניית קרב.
 * options: { count, topic }
 *  - topic: קרב באזור מסוים. ללא topic - "קרב מעורב" שנותן משקל גבוה יותר
 *    לנושאים שבהם יש יותר טעויות.
 * שאלות שנענו לא נכון בעבר (תור החזרה) חוזרות עם מספרים חדשים.
 */
export function buildBattle(saveState, options = {}) {
  const opts = typeof options === 'number' ? { count: options } : options;
  const count = opts.count || 5;
  const topic = opts.topic || null;
  const stats = saveState?.stats;
  const questions = [];
  const usedTypes = new Set();

  const pool = topic ? GENERATORS.filter((g) => g.topic === topic) : GENERATORS;
  const fallback = pool.length ? pool : GENERATORS;

  // 1. שאלות מתור החזרה - עד שתיים בקרב
  const queue = Array.isArray(saveState?.reviewQueue) ? saveState.reviewQueue : [];
  const relevant = shuffle(queue.filter((r) => !topic || r.topic === topic));
  for (const entry of relevant.slice(0, 2)) {
    const q = makeByType(entry.type);
    if (q) {
      q.fromReview = true;
      questions.push(q);
      usedTypes.add(q.type);
    }
  }

  // 2. שאלה מדף התרגול של המורה (באזור שיש בו שלב מתחילים - רק אחרי שעברו אותו)
  const beginnerRegion = topic && topicLevel(stats, topic) === 0
    && GENERATORS.some((g) => g.topic === topic && g.level === 'easy');
  if (questions.length < count && !beginnerRegion) {
    const tq = randomTeacherQuestion(topic);
    if (tq && !usedTypes.has(tq.type)) {
      questions.push(tq);
      usedTypes.add(tq.type);
    }
  }

  // 3. השלמה מהגנרטורים
  while (questions.length < count) {
    let q = null;
    for (let attempt = 0; attempt < 10; attempt++) {
      const g = weightedPick(fallback, (x) => x.weight * topicWeight(stats, x.topic) * levelWeight(stats, x));
      // שאלה שמתאימה לרמה מותר לחזור עליה, כדי שהגיוון לא ידחוף את הקרב לרמה הלא נכונה
      if (usedTypes.has(g.type) && !matchesLevel(stats, g) && attempt < 7) continue;
      usedTypes.add(g.type);
      q = g.gen();
      break;
    }
    if (!q) q = fallback[0].gen();
    questions.push(q);
  }

  return shuffle(questions.slice(0, count));
}
