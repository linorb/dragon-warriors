// exprtokens.js - ייצוג תרגיל כרצף אסימונים, לצורך ממשק "מה מחשבים קודם?"
// מודול טהור (ללא DOM) כדי שניתן יהיה לבדוק אותו אוטומטית.

export const N = (v) => ({ t: 'n', v });
export const O = (v) => ({ t: 'o', v });
export const L = () => ({ t: 'p', v: '(' });
export const R = () => ({ t: 'p', v: ')' });

const PREC = { '×': 2, ':': 2, '+': 1, '−': 1 };

/** עומק סוגריים לכל אסימון */
export function depths(tokens) {
  const out = [];
  let d = 0;
  for (const tk of tokens) {
    if (tk.t === 'p' && tk.v === '(') { d += 1; out.push(d); }
    else if (tk.t === 'p' && tk.v === ')') { out.push(d); d -= 1; }
    else out.push(d);
  }
  return out;
}

/**
 * אילו פעולות מותר לבצע עכשיו:
 * קודם מה שבתוך הסוגריים הפנימיים ביותר, בתוכם כפל וחילוק לפני חיבור וחיסור,
 * וברצף של אותה דרגה - משמאל לימין.
 */
export function validOpIndices(tokens) {
  const d = depths(tokens);
  const opIdx = tokens.map((t, i) => (t.t === 'o' ? i : -1)).filter((i) => i >= 0);
  if (!opIdx.length) return [];

  const maxDepth = Math.max(...opIdx.map((i) => d[i]));
  const deepest = opIdx.filter((i) => d[i] === maxDepth);

  // קיבוץ לפי זוג הסוגריים שבו הפעולה נמצאת
  const group = [];
  let g = 0;
  for (let i = 0; i < tokens.length; i++) {
    if (tokens[i].t === 'p') g += 1;
    group[i] = g;
  }

  const byGroup = new Map();
  for (const i of deepest) {
    const key = group[i];
    if (!byGroup.has(key)) byGroup.set(key, []);
    byGroup.get(key).push(i);
  }

  const valid = [];
  for (const list of byGroup.values()) {
    const top = Math.max(...list.map((i) => PREC[tokens[i].v]));
    const same = list.filter((i) => PREC[tokens[i].v] === top);
    for (const i of same) {
      // ברצף של אותה דרגה (כמו 24 : 6 : 2) מתחילים מהפעולה השמאלית
      if (same.includes(i - 2)) continue;
      valid.push(i);
    }
  }
  return valid.sort((a, b) => a - b);
}

function compute(a, op, b) {
  if (op === '+') return a + b;
  if (op === '−') return a - b;
  if (op === '×') return a * b;
  return a / b;
}

/** ביצוע פעולה אחת. מחזיר את רשימת האסימונים החדשה ואת תיאור הצעד */
export function applyOp(tokens, i) {
  const a = tokens[i - 1].v;
  const b = tokens[i + 1].v;
  const op = tokens[i].v;
  const res = compute(a, op, b);
  const text = `${a} ${op} ${b} = ${res}`;

  let out = [...tokens.slice(0, i - 1), N(res), ...tokens.slice(i + 2)];

  // סוגריים שנשאר בהם מספר בודד - מיותרים
  const pos = i - 1;
  if (out[pos - 1] && out[pos - 1].v === '(' && out[pos + 1] && out[pos + 1].v === ')') {
    out = [...out.slice(0, pos - 1), out[pos], ...out.slice(pos + 2)];
  }
  return { tokens: out, text, value: res };
}

/** פתרון מלא: תשובה + שלבים בסדר הנכון */
export function solve(tokens) {
  let cur = tokens;
  const steps = [];
  let guard = 0;
  while (cur.length > 1 && guard++ < 20) {
    const valid = validOpIndices(cur);
    if (!valid.length) break;
    const r = applyOp(cur, valid[0]);
    steps.push(r.text);
    cur = r.tokens;
  }
  return { answer: cur.length === 1 ? cur[0].v : null, steps };
}

/** הצגת התרגיל כטקסט */
export function tokensToString(tokens) {
  let s = '';
  for (let i = 0; i < tokens.length; i++) {
    const tk = tokens[i];
    const prev = tokens[i - 1];
    const sep = i === 0 || (prev && prev.v === '(') || tk.v === ')' ? '' : ' ';
    s += sep + (tk.t === 'n' ? tk.v.toLocaleString('en-US') : tk.v);
  }
  return s;
}
