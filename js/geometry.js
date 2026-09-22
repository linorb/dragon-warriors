// geometry.js - בדיקה אוטומטית של צורות שמשורטטות על רשת נקודות.
// כל החישובים נעשים במספרים שלמים (ריבועי אורכים ומכפלות סקלריות),
// כדי שהבדיקה תהיה מדויקת לחלוטין וללא שגיאות עיגול.
//
// נקודה = { c, r }  (עמודה, שורה ברשת)
// שתי רשתות נתמכות:
//   'square' - רשת ריבועית רגילה
//   'tri'    - רשת משולשת (מאפשרת משולש שווה צלעות, שאי אפשר לשרטט ברשת ריבועית)

export const SQRT3_2 = Math.sqrt(3) / 2;

export function sub(p, q) {
  return { a: p.c - q.c, b: p.r - q.r };
}

/** ריבוע האורך של וקטור */
export function len2(v, kind = 'square') {
  if (kind === 'tri') return v.a * v.a + v.a * v.b + v.b * v.b;
  return v.a * v.a + v.b * v.b;
}

/** מכפלה סקלרית כפול 2 (נשאר מספר שלם) - הסימן שלה קובע את סוג הזווית */
export function dot2(u, v, kind = 'square') {
  if (kind === 'tri') return 2 * u.a * v.a + u.a * v.b + u.b * v.a + 2 * u.b * v.b;
  return 2 * (u.a * v.a + u.b * v.b);
}

/** מכפלה וקטורית - שווה לאפס בדיוק כאשר הווקטורים מקבילים */
export function cross(u, v) {
  return u.a * v.b - u.b * v.a;
}

/** מיקום הנקודה במסך */
export function toXY(p, kind = 'square', step = 1) {
  if (kind === 'tri') return { x: (p.c + p.r / 2) * step, y: p.r * SQRT3_2 * step };
  return { x: p.c * step, y: p.r * step };
}

export function samePoint(p, q) {
  return p.c === q.c && p.r === q.r;
}

/* ============================ משולשים ============================ */

/**
 * סיווג משולש.
 * @returns {{valid:boolean, angle:'right'|'obtuse'|'acute'|null, sides:'equilateral'|'isosceles'|'scalene'|null}}
 */
export function classifyTriangle(pts, kind = 'square') {
  if (!pts || pts.length !== 3) return { valid: false, angle: null, sides: null };
  const [A, B, C] = pts;
  if (samePoint(A, B) || samePoint(B, C) || samePoint(A, C)) {
    return { valid: false, angle: null, sides: null };
  }
  // נקודות על קו אחד אינן משולש
  if (cross(sub(B, A), sub(C, A)) === 0) return { valid: false, angle: null, sides: null };

  const angles = [
    dot2(sub(B, A), sub(C, A), kind), // הזווית ב-A
    dot2(sub(A, B), sub(C, B), kind), // הזווית ב-B
    dot2(sub(A, C), sub(B, C), kind), // הזווית ב-C
  ];

  let angle = 'acute';
  if (angles.some((d) => d === 0)) angle = 'right';
  else if (angles.some((d) => d < 0)) angle = 'obtuse';

  const s = [len2(sub(B, A), kind), len2(sub(C, B), kind), len2(sub(A, C), kind)];
  const distinct = new Set(s).size;
  const sides = distinct === 1 ? 'equilateral' : distinct === 2 ? 'isosceles' : 'scalene';

  return { valid: true, angle, sides };
}

/* ============================ מרובעים ============================ */

function segmentsCross(p1, p2, p3, p4, kind) {
  const A = toXY(p1, kind); const B = toXY(p2, kind);
  const C = toXY(p3, kind); const D = toXY(p4, kind);
  const d = (u, v, w) => (v.x - u.x) * (w.y - u.y) - (v.y - u.y) * (w.x - u.x);
  const d1 = d(C, D, A); const d2v = d(C, D, B);
  const d3 = d(A, B, C); const d4 = d(A, B, D);
  return ((d1 > 0 && d2v < 0) || (d1 < 0 && d2v > 0)) && ((d3 > 0 && d4 < 0) || (d3 < 0 && d4 > 0));
}

/**
 * סיווג מרובע לפי סדר הנקודות.
 * @returns {{valid, simple, parallelPairs, parallelogram, rhombus, rectangle, square, rightAngles}}
 */
export function classifyQuad(pts, kind = 'square') {
  const bad = {
    valid: false, simple: false, parallelPairs: 0,
    parallelogram: false, rhombus: false, rectangle: false, square: false, rightAngles: 0,
  };
  if (!pts || pts.length !== 4) return bad;

  for (let i = 0; i < 4; i++) {
    for (let j = i + 1; j < 4; j++) if (samePoint(pts[i], pts[j])) return bad;
  }

  const [A, B, C, D] = pts;
  const v = [sub(B, A), sub(C, B), sub(D, C), sub(A, D)];
  // שלוש נקודות על קו אחד - לא מרובע אמיתי
  for (let i = 0; i < 4; i++) {
    if (cross(v[i], v[(i + 1) % 4]) === 0) return bad;
  }

  // צלעות נגדיות שאינן נחתכות (לא "עניבת פרפר")
  const simple = !segmentsCross(A, B, C, D, kind) && !segmentsCross(B, C, D, A, kind);

  const parallelPairs = (cross(v[0], v[2]) === 0 ? 1 : 0) + (cross(v[1], v[3]) === 0 ? 1 : 0);
  const parallelogram = simple && v[0].a === -v[2].a && v[0].b === -v[2].b;

  const s = v.map((x) => len2(x, kind));
  const allEqual = s.every((x) => x === s[0]);
  const rightAngles = [0, 1, 2, 3].filter((i) => dot2(v[i], v[(i + 1) % 4], kind) === 0).length;

  const rhombus = parallelogram && allEqual;
  const rectangle = parallelogram && dot2(v[0], v[1], kind) === 0;
  const square = rectangle && allEqual;

  return { valid: true, simple, parallelPairs, parallelogram, rhombus, rectangle, square, rightAngles };
}

/* ============================ מלבנים: שטח והיקף ============================ */

/**
 * מידות מלבן שצלעותיו מקבילות לרשת. מחזיר null אם זה לא מלבן כזה.
 */
export function rectDims(pts) {
  if (!pts || pts.length !== 4) return null;
  const q = classifyQuad(pts, 'square');
  if (!q.rectangle) return null;
  const v = [sub(pts[1], pts[0]), sub(pts[2], pts[1])];
  const axisAligned = v.every((x) => x.a === 0 || x.b === 0);
  if (!axisAligned) return null;
  const w = Math.abs(v[0].a) + Math.abs(v[0].b);
  const h = Math.abs(v[1].a) + Math.abs(v[1].b);
  return { w, h, area: w * h, perimeter: 2 * (w + h) };
}

/** שטח מצולע ברשת ריבועית (נוסחת השרוכים) */
export function polygonArea(pts) {
  let sum = 0;
  for (let i = 0; i < pts.length; i++) {
    const p = pts[i];
    const q = pts[(i + 1) % pts.length];
    sum += p.c * q.r - q.c * p.r;
  }
  return Math.abs(sum) / 2;
}

/* ============================ בדיקת מטרה ============================ */

/**
 * בדיקה אם הצורה שצוירה עונה על דרישות השאלה.
 * goal:
 *   { kind:'triangle', angle?, sides? }
 *   { kind:'quad', requires:'rhombus'|'parallelogram'|'rectangle'|'square' }
 *   { kind:'rect_area', value } / { kind:'rect_perimeter', value }
 *   { kind:'parallelogram_complete', fixed:[p,p] }
 * @returns {{ok:boolean, reason?:string, label?:string}}
 */
export function checkGoal(pts, goal, kind = 'square') {
  if (goal.kind === 'triangle') {
    const t = classifyTriangle(pts, kind);
    if (!t.valid) return { ok: false, reason: 'שלוש הנקודות נמצאות על קו אחד - זה עדיין לא משולש.' };
    if (goal.angle && t.angle !== goal.angle) {
      const names = { right: 'ישר זווית', obtuse: 'קהה זווית', acute: 'חד זווית' };
      return { ok: false, reason: `המשולש שציירת הוא ${names[t.angle]}, וצריך ${names[goal.angle]}.` };
    }
    if (goal.sides && t.sides !== goal.sides) {
      const names = { equilateral: 'שווה צלעות', isosceles: 'שווה שוקיים', scalene: 'שונה צלעות' };
      return { ok: false, reason: `המשולש שציירת הוא ${names[t.sides]}, וצריך ${names[goal.sides]}.` };
    }
    return { ok: true };
  }

  if (goal.kind === 'quad' || goal.kind === 'parallelogram_complete') {
    const q = classifyQuad(pts, kind);
    if (!q.valid) return { ok: false, reason: 'זה עדיין לא מרובע תקין. נסו נקודות אחרות.' };
    if (!q.simple) return { ok: false, reason: 'הצלעות מצטלבות. נסו לסדר את הנקודות בסדר סביב הצורה.' };
    const need = goal.requires || 'parallelogram';
    if (need === 'rhombus' && !q.rhombus) {
      return { ok: false, reason: q.parallelogram ? 'הצלעות עדיין לא כולן שוות.' : 'צריך מרובע שכל צלעותיו שוות.' };
    }
    if (need === 'parallelogram' && !q.parallelogram) {
      return { ok: false, reason: 'במקבילית כל שתי צלעות נגדיות מקבילות ושוות באורכן.' };
    }
    if (need === 'rectangle' && !q.rectangle) return { ok: false, reason: 'במלבן יש ארבע זוויות ישרות.' };
    if (need === 'square' && !q.square) return { ok: false, reason: 'בריבוע כל הצלעות שוות וכל הזוויות ישרות.' };
    return { ok: true };
  }

  if (goal.kind === 'rect_area' || goal.kind === 'rect_perimeter') {
    const d = rectDims(pts);
    if (!d) return { ok: false, reason: 'צריך מלבן שצלעותיו לאורך קווי הרשת.' };
    const actual = goal.kind === 'rect_area' ? d.area : d.perimeter;
    const unit = goal.kind === 'rect_area' ? 'סמ"ר' : 'ס"מ';
    const what = goal.kind === 'rect_area' ? 'שטח' : 'היקף';
    if (actual !== goal.value) {
      return { ok: false, reason: `ה${what} של המלבן הזה הוא ${actual} ${unit}, וצריך ${goal.value}.` };
    }
    return { ok: true, label: `${Math.min(d.w, d.h)} × ${Math.max(d.w, d.h)}` };
  }

  return { ok: false, reason: 'לא ידענו לבדוק את הצורה הזו.' };
}

/** כמה מלבנים שונים אפשר לצייר בכלל (לבדיקת האוסף) */
export function allRectSolutions(goal) {
  const out = [];
  for (let w = 1; w <= 40; w++) {
    for (let h = w; h <= 40; h++) {
      const v = goal.kind === 'rect_area' ? w * h : 2 * (w + h);
      if (v === goal.value) out.push(`${w} × ${h}`);
    }
  }
  return out;
}
