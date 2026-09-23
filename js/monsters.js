// monsters.js - מפלצות מקוריות לקרבות, מצוירות ב-SVG
// הבעת הפנים משתנה לפי מצב הרוח (mood): 0 חיוך בטוח, 1 חיוך קטן, 2 דאגה, 3 פחד.

const svg = (inner, mood) => `<svg class="mood-${mood}" viewBox="0 0 200 180" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">${inner}</svg>`;

/**
 * פנים לפי מצב רוח.
 * f: { l, r, y - מרכזי העיניים, er - רדיוס עין, pupil, mx, my, mw - מרכז הפה וחצי רוחבו,
 *      ink - צבע קווים, sx, sy - מקום טיפת הזיעה }
 */
function face(mood, f) {
  const { l, r, y, er = 9, pupil = '#2a1a3d', mx, my, mw, ink, sx, sy } = f;
  const scared = mood >= 3;
  const eyeR = scared ? er * 1.2 : er;
  const pr = scared ? er * 0.28 : er * 0.5;
  const eye = (x) => `
    <circle cx="${x}" cy="${y}" r="${eyeR}" fill="#fff"/>
    <circle cx="${x + (scared ? 0 : 1)}" cy="${y + (scared ? 0 : 1)}" r="${pr}" fill="${pupil}"/>`;

  // גבות: בחיוך - מורדות פנימה (בטוח בעצמו), בדאגה ובפחד - מורמות פנימה
  const top = y - eyeR;
  const brow = (x, side) => {
    const out = x - side * er;          // הקצה החיצוני
    const inn = x + side * er * 0.8;    // הקצה הפנימי (לכיוון המרכז)
    if (mood === 0) return `M${out} ${top - 9}L${inn} ${top - 3}`;
    if (mood === 2) return `M${out} ${top - 3}L${inn} ${top - 8}`;
    if (mood >= 3) return `M${out} ${top - 5}L${inn} ${top - 12}`;
    return '';
  };
  const brows = mood === 1 ? '' : `<path d="${brow(l, 1)}${brow(r, -1)}" stroke="${ink}" stroke-width="4" stroke-linecap="round" fill="none"/>`;

  let mouth;
  if (mood === 0) {
    mouth = `<path d="M${mx - mw} ${my - 2}q${mw} ${mw * 0.95} ${mw * 2} 0z" fill="${ink}"/>
      <path d="M${mx - mw * 0.6} ${my + 1}h${mw * 1.2}" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".85"/>`;
  } else if (mood === 1) {
    mouth = `<path d="M${mx - mw * 0.75} ${my}q${mw * 0.75} ${mw * 0.35} ${mw * 1.5} 0" stroke="${ink}" stroke-width="4.5" fill="none" stroke-linecap="round"/>`;
  } else if (mood === 2) {
    const s = mw * 0.4;
    mouth = `<path d="M${mx - mw * 0.8} ${my + 2}q${s / 2} -4 ${s} 0t${s} 0t${s} 0t${s} 0" stroke="${ink}" stroke-width="4" fill="none" stroke-linecap="round"/>`;
  } else {
    mouth = `<ellipse cx="${mx}" cy="${my + 3}" rx="${Math.max(6, mw * 0.45)}" ry="${Math.max(8, mw * 0.6)}" fill="${ink}"/>`;
  }

  const drop = (x, yy, k = 1) => `<path d="M${x} ${yy}c-${4 * k} ${6 * k}-${6 * k} ${9 * k}-${6 * k} ${12 * k}a${6 * k} ${6 * k} 0 0 0 ${12 * k} 0c0-${3 * k}-${2 * k}-${6 * k}-${6 * k}-${12 * k}z" fill="#bfefff" stroke="#5aa6d8" stroke-width="1.5"/>`;
  const sweat = mood >= 2 ? drop(sx, sy, mood >= 3 ? 1.1 : 0.8) + (mood >= 3 ? drop(sx + 14, sy + 16, 0.7) : '') : '';

  return `<g class="face">${brows}${eye(l)}${eye(r)}${mouth}${sweat}</g>`;
}

export const MONSTERS = [
  {
    id: 'stone_golem',
    name: 'גולם האבן',
    art: (mood = 0) => svg(`
      <ellipse cx="100" cy="168" rx="58" ry="9" fill="rgba(0,0,0,.3)"/>
      <rect x="46" y="60" width="108" height="98" rx="26" fill="#7d8b99"/>
      <rect x="60" y="74" width="80" height="60" rx="18" fill="#9dabb9"/>
      <path d="M46 96l-18 12 18 14zM154 96l18 12-18 14z" fill="#68757f"/>
      <path d="M70 60l10-18 10 18zM110 60l10-18 10 18z" fill="#68757f"/>
      ${face(mood, { l: 82, r: 120, y: 100, er: 10, mx: 101, my: 124, mw: 16, ink: '#3f4a54', sx: 140, sy: 72 })}
    `, mood),
  },
  {
    id: 'shadow_bat',
    name: 'עטלף הצללים',
    art: (mood = 0) => svg(`
      <ellipse cx="100" cy="168" rx="46" ry="8" fill="rgba(0,0,0,.3)"/>
      <path d="M72 88C44 62 20 62 8 74c14 6 18 18 14 32 20 10 42 4 50-18z" fill="#4b3a72"/>
      <path d="M128 88c28-26 52-26 64-14-14 6-18 18-14 32-20 10-42 4-50-18z" fill="#4b3a72"/>
      <ellipse cx="100" cy="104" rx="34" ry="42" fill="#5f4a8f"/>
      <ellipse cx="100" cy="112" rx="20" ry="26" fill="#7b62b3"/>
      <path d="M76 66l-6-26 22 16zM124 66l6-26-22 16z" fill="#5f4a8f"/>
      ${face(mood, { l: 88, r: 114, y: 92, er: 9, pupil: '#ffcc4d', mx: 101, my: 118, mw: 12, ink: '#2e2450', sx: 124, sy: 66 })}
    `, mood),
  },
  {
    id: 'spike_grub',
    name: 'זחל הקוצים',
    art: (mood = 0) => svg(`
      <ellipse cx="100" cy="168" rx="62" ry="9" fill="rgba(0,0,0,.3)"/>
      <path d="M40 120l10-22 10 22zM64 112l10-26 10 26zM92 108l10-28 10 28zM122 114l10-24 10 24z" fill="#3f9d63"/>
      <ellipse cx="62" cy="134" rx="26" ry="24" fill="#59c983"/>
      <ellipse cx="100" cy="132" rx="28" ry="26" fill="#59c983"/>
      <ellipse cx="140" cy="134" rx="26" ry="24" fill="#59c983"/>
      <ellipse cx="140" cy="128" rx="22" ry="20" fill="#7ee0a3"/>
      ${face(mood, { l: 132, r: 152, y: 124, er: 8, mx: 142, my: 144, mw: 10, ink: '#237a49', sx: 160, sy: 100 })}
    `, mood),
  },
  {
    id: 'storm_spirit',
    name: 'רוח הסופה',
    art: (mood = 0) => svg(`
      <ellipse cx="100" cy="168" rx="44" ry="8" fill="rgba(0,0,0,.25)"/>
      <path d="M100 30c34 0 58 22 58 52 0 34-26 58-58 58s-58-24-58-58c0-30 24-52 58-52z" fill="#5aa6d8" opacity=".85"/>
      <path d="M100 44c26 0 44 16 44 38 0 26-20 44-44 44s-44-18-44-44c0-22 18-38 44-38z" fill="#8fd0f2" opacity=".8"/>
      ${face(mood, { l: 84, r: 118, y: 88, er: 10, pupil: '#1d3b55', mx: 101, my: 106, mw: 12, ink: '#1d3b55', sx: 132, sy: 58 })}
      <path d="M104 118l-14 24h12l-8 20 24-28h-12l10-16z" fill="#ffcc4d"/>
    `, mood),
  },
  {
    id: 'sand_scorpion',
    name: 'עקרב החול',
    art: (mood = 0) => svg(`
      <ellipse cx="100" cy="168" rx="60" ry="9" fill="rgba(0,0,0,.3)"/>
      <path d="M150 120c22-4 30-22 24-42-4 14-12 18-22 16z" fill="#d79a4a"/>
      <path d="M156 78l8-12 6 14-10 6z" fill="#b87d33"/>
      <ellipse cx="96" cy="128" rx="46" ry="28" fill="#e2a95a"/>
      <ellipse cx="96" cy="122" rx="34" ry="19" fill="#f4c581"/>
      <path d="M52 112l-26-12 8 16-14 10 32 4zM52 140l-26 12 8-16-14-10 32-4z" fill="#d79a4a"/>
      ${face(mood, { l: 84, r: 108, y: 116, er: 8, pupil: '#5a3512', mx: 96, my: 136, mw: 14, ink: '#a96f28', sx: 120, sy: 96 })}
    `, mood),
  },
];

/** מצב הרוח לפי הנזק שספגה המפלצת: ככל שהלוחם מצליח יותר - היא מפחדת יותר */
export function moodFor(hp, maxHp) {
  const lost = 1 - hp / maxHp;
  if (lost <= 0) return 0;
  if (lost < 0.35) return 1;
  if (lost < 0.65) return 2;
  return 3;
}

export function randomMonster() {
  return MONSTERS[Math.floor(Math.random() * MONSTERS.length)];
}
