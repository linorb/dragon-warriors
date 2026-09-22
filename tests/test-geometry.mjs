// בדיקות לבדיקת הצורות על רשת הנקודות.
// הרצה (עם Node): node tests/test-geometry.mjs

import {
  classifyTriangle, classifyQuad, rectDims, polygonArea, checkGoal, allRectSolutions,
} from '../js/geometry.js';

let pass = 0;
const failures = [];
const check = (name, cond, detail = '') => {
  if (cond) pass += 1; else failures.push(`${name}${detail ? ' :: ' + detail : ''}`);
};

const P = (c, r) => ({ c, r });

/* ---------- משולשים ---------- */

{
  const t = classifyTriangle([P(0, 0), P(3, 0), P(0, 4)]);
  check('משולש 3-4-5: ישר זווית ושונה צלעות', t.valid && t.angle === 'right' && t.sides === 'scalene', JSON.stringify(t));
}
{
  const t = classifyTriangle([P(0, 0), P(2, 0), P(0, 2)]);
  check('משולש ישר זווית ושווה שוקיים', t.angle === 'right' && t.sides === 'isosceles', JSON.stringify(t));
}
{
  const t = classifyTriangle([P(0, 0), P(4, 0), P(5, 1)]);
  check('משולש קהה זווית', t.angle === 'obtuse', JSON.stringify(t));
}
{
  const t = classifyTriangle([P(0, 0), P(4, 0), P(2, 3)]);
  check('משולש חד זווית ושווה שוקיים', t.angle === 'acute' && t.sides === 'isosceles', JSON.stringify(t));
}
{
  const t = classifyTriangle([P(0, 0), P(1, 1), P(3, 3)]);
  check('שלוש נקודות על קו אחד אינן משולש', t.valid === false);
}
{
  const t = classifyTriangle([P(0, 0), P(2, 0), P(2, 0)]);
  check('שתי נקודות זהות אינן משולש', t.valid === false);
}
{
  // ברשת ריבועית אי אפשר לשרטט משולש שווה צלעות
  let found = false;
  for (let c1 = -6; c1 <= 6; c1++) {
    for (let r1 = -6; r1 <= 6; r1++) {
      for (let c2 = -6; c2 <= 6; c2++) {
        for (let r2 = -6; r2 <= 6; r2++) {
          const t = classifyTriangle([P(0, 0), P(c1, r1), P(c2, r2)]);
          if (t.valid && t.sides === 'equilateral') found = true;
        }
      }
    }
  }
  check('ברשת ריבועית אין משולש שווה צלעות (ולכן יש רשת משולשת)', !found);
}
{
  const t = classifyTriangle([P(0, 0), P(1, 0), P(0, 1)], 'tri');
  check('ברשת משולשת יש משולש שווה צלעות', t.valid && t.sides === 'equilateral' && t.angle === 'acute', JSON.stringify(t));
}
{
  // אורכי הצלעות בריבוע: 9, 3, 3 - שווה שוקיים אך לא שווה צלעות
  const t = classifyTriangle([P(0, 0), P(3, 0), P(1, 1)], 'tri');
  check('רשת משולשת: זיהוי משולש שווה שוקיים', t.sides === 'isosceles', JSON.stringify(t));
}
{
  // ברשת משולשת גם (0,0),(2,0),(0,2) הוא שווה צלעות
  const t = classifyTriangle([P(0, 0), P(2, 0), P(0, 2)], 'tri');
  check('רשת משולשת: משולש שווה צלעות גדול', t.sides === 'equilateral', JSON.stringify(t));
}
{
  // אורכי הצלעות 4, 3, 1 - ישר זווית ושונה צלעות
  const t = classifyTriangle([P(0, 0), P(2, 0), P(1, 1)], 'tri');
  check('רשת משולשת: זיהוי משולש ישר זווית', t.angle === 'right' && t.sides === 'scalene', JSON.stringify(t));
}

/* ---------- מרובעים ---------- */

{
  const q = classifyQuad([P(0, 0), P(2, 0), P(2, 2), P(0, 2)]);
  check('ריבוע', q.square && q.rectangle && q.rhombus && q.parallelogram && q.rightAngles === 4, JSON.stringify(q));
}
{
  const q = classifyQuad([P(0, 0), P(6, 0), P(6, 3), P(0, 3)]);
  check('מלבן שאינו ריבוע', q.rectangle && !q.square && q.parallelPairs === 2, JSON.stringify(q));
}
{
  const q = classifyQuad([P(0, 0), P(4, 3), P(4, 8), P(0, 5)]);
  check('מעוין שאינו ריבוע', q.rhombus && !q.rectangle, JSON.stringify(q));
}
{
  const q = classifyQuad([P(0, 0), P(4, 0), P(6, 3), P(2, 3)]);
  check('מקבילית רגילה', q.parallelogram && !q.rhombus && !q.rectangle, JSON.stringify(q));
}
{
  const q = classifyQuad([P(0, 0), P(4, 0), P(3, 3), P(1, 2)]);
  check('מרובע ללא צלעות מקבילות', !q.parallelogram && q.parallelPairs === 0, JSON.stringify(q));
}
{
  const q = classifyQuad([P(0, 0), P(2, 0), P(0, 2), P(2, 2)]);
  check('מרובע מצטלב נפסל', q.simple === false && q.parallelogram === false, JSON.stringify(q));
}
{
  const q = classifyQuad([P(0, 0), P(1, 1), P(2, 2), P(0, 3)]);
  check('שלוש נקודות על קו אחד נפסלות', q.valid === false);
}
{
  // מלבן מסובב - עדיין מלבן, אבל לא לאורך קווי הרשת
  const pts = [P(0, 0), P(4, 3), P(1, 7), P(-3, 4)];
  const q = classifyQuad(pts);
  check('מלבן מסובב מזוהה כמלבן', q.rectangle, JSON.stringify(q));
  check('מלבן מסובב אינו נספר למדידת שטח/היקף ברשת', rectDims(pts) === null);
}

/* ---------- שטח והיקף ---------- */

{
  const d = rectDims([P(0, 0), P(6, 0), P(6, 3), P(0, 3)]);
  check('מלבן 6×3: שטח 18 והיקף 18', d.area === 18 && d.perimeter === 18, JSON.stringify(d));
}
{
  const d = rectDims([P(1, 1), P(1, 4), P(3, 4), P(3, 1)]);
  check('מלבן שצויר בסדר הפוך', d && d.area === 6 && d.perimeter === 10, JSON.stringify(d));
}
check('שטח מצולע לפי נוסחת השרוכים', polygonArea([P(0, 0), P(4, 0), P(4, 2), P(0, 2)]) === 8);

/* ---------- בדיקת מטרות ---------- */

check('מטרה: משולש קהה זווית - הצלחה',
  checkGoal([P(0, 0), P(4, 0), P(5, 1)], { kind: 'triangle', angle: 'obtuse' }).ok);
check('מטרה: משולש קהה זווית - כישלון מנומק',
  checkGoal([P(0, 0), P(3, 0), P(0, 4)], { kind: 'triangle', angle: 'obtuse' }).reason.includes('ישר זווית'));
check('מטרה: משולש ישר זווית ושווה שוקיים',
  checkGoal([P(0, 0), P(3, 0), P(0, 3)], { kind: 'triangle', angle: 'right', sides: 'isosceles' }).ok);
check('מטרה: מרובע שכל צלעותיו שוות',
  checkGoal([P(0, 0), P(4, 3), P(4, 8), P(0, 5)], { kind: 'quad', requires: 'rhombus' }).ok);
check('מטרה: מקבילית',
  checkGoal([P(0, 0), P(4, 0), P(6, 3), P(2, 3)], { kind: 'quad', requires: 'parallelogram' }).ok);
check('מטרה: מקבילית - מרובע רגיל נפסל',
  checkGoal([P(0, 0), P(4, 0), P(3, 3), P(1, 2)], { kind: 'quad', requires: 'parallelogram' }).ok === false);

{
  const r = checkGoal([P(0, 0), P(6, 0), P(6, 3), P(0, 3)], { kind: 'rect_area', value: 18 });
  check('מטרה: מלבן ששטחו 18', r.ok && r.label === '3 × 6', JSON.stringify(r));
}
{
  const r = checkGoal([P(0, 0), P(2, 0), P(2, 9), P(0, 9)], { kind: 'rect_area', value: 18 });
  check('מטרה: מלבן 2×9 ששטחו 18', r.ok && r.label === '2 × 9', JSON.stringify(r));
}
{
  const r = checkGoal([P(0, 0), P(5, 0), P(5, 3), P(0, 3)], { kind: 'rect_area', value: 18 });
  check('מטרה: מלבן בשטח שגוי מקבל הסבר', !r.ok && r.reason.includes('15'), JSON.stringify(r));
}
{
  const r = checkGoal([P(0, 0), P(4, 0), P(4, 5), P(0, 5)], { kind: 'rect_perimeter', value: 18 });
  check('מטרה: מלבן שהיקפו 18', r.ok && r.label === '4 × 5', JSON.stringify(r));
}

check('כל המלבנים ששטחם 18', JSON.stringify(allRectSolutions({ kind: 'rect_area', value: 18 }))
  === JSON.stringify(['1 × 18', '2 × 9', '3 × 6']));
check('כל המלבנים שהיקפם 18', allRectSolutions({ kind: 'rect_perimeter', value: 18 }).length === 4,
  allRectSolutions({ kind: 'rect_perimeter', value: 18 }).join(', '));

/* ---------- סיכום ---------- */

console.log(`\n✔ עברו: ${pass}`);
if (failures.length) {
  console.log(`✘ נכשלו: ${failures.length}`);
  failures.forEach((f) => console.log('   - ' + f));
  process.exitCode = 1;
} else {
  console.log('כל הבדיקות עברו בהצלחה.');
}
