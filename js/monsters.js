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

/**
 * דרקון מרושע - הבסיס לשלושת הבוסים.
 * p: { body, belly, dark, wing, horn, pupil, ink, extraBack, extraFront }
 */
function evilDragon(mood, p) {
  const wing = 'M72 100L18 30Q30 58 12 70Q34 76 22 98Q44 98 40 120Q58 110 74 120z';
  const ribs = 'M72 100L18 30M72 102L12 70M72 106L22 98M72 112L40 120';
  return svg(`
    <ellipse cx="100" cy="170" rx="62" ry="8" fill="rgba(0,0,0,.35)"/>
    ${p.extraBack || ''}
    <g>
      <path d="${wing}" fill="${p.wing}"/>
      <path d="${ribs}" stroke="${p.dark}" stroke-width="3" stroke-linecap="round"/>
    </g>
    <g transform="translate(200 0) scale(-1 1)">
      <path d="${wing}" fill="${p.wing}"/>
      <path d="${ribs}" stroke="${p.dark}" stroke-width="3" stroke-linecap="round"/>
    </g>
    <path d="M130 150c24 12 44 6 50-14" stroke="${p.body}" stroke-width="11" fill="none" stroke-linecap="round"/>
    <path d="M174 140l16-14-2 20z" fill="${p.dark}"/>
    <ellipse cx="100" cy="134" rx="40" ry="32" fill="${p.body}"/>
    <ellipse cx="100" cy="142" rx="23" ry="22" fill="${p.belly}"/>
    <path d="M84 134h32M82 144h36M84 154h32" stroke="${p.dark}" stroke-width="2" opacity=".35"/>
    <ellipse cx="76" cy="162" rx="13" ry="8" fill="${p.dark}"/>
    <ellipse cx="124" cy="162" rx="13" ry="8" fill="${p.dark}"/>
    <path d="M66 166l3-6 3 6zM74 167l3-6 3 6zM120 167l3-6 3 6zM128 166l3-6 3 6z" fill="#f2ead8"/>
    <path d="M76 58C70 40 60 30 48 24c6 12 8 22 10 36zM124 58c6-18 16-28 28-34-6 12-8 22-10 36z" fill="${p.horn}"/>
    <path d="M90 52l5-14 5 12 5-12 5 14z" fill="${p.dark}"/>
    <ellipse cx="100" cy="80" rx="38" ry="31" fill="${p.body}"/>
    <ellipse cx="100" cy="100" rx="22" ry="13" fill="${p.belly}"/>
    <circle cx="93" cy="96" r="2" fill="${p.dark}"/>
    <circle cx="107" cy="96" r="2" fill="${p.dark}"/>
    ${face(mood, { l: 86, r: 114, y: 76, er: 8, pupil: p.pupil, mx: 100, my: 104, mw: 11, ink: p.ink, sx: 136, sy: 52 })}
    <path d="M92 101l3 7 3-7zM102 101l3 7 3-7z" fill="#fff"/>
    ${p.extraFront || ''}
  `, mood);
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

  // --- בוסים: דרקונים מרושעים. מופיעים מדי פעם במקום מפלצת רגילה ---
  {
    id: 'lava_dragon',
    name: 'דרקון הלבה',
    boss: true,
    art: (mood = 0) => evilDragon(mood, {
      body: '#c0392b', belly: '#ffb347', dark: '#5c120a', wing: '#8e1e12', horn: '#2b0a05',
      pupil: '#ffcc4d', ink: '#3d0b05',
      extraBack: '<path d="M30 168c4-10 2-18-4-24 10 2 16 12 14 24zM164 168c4-10 2-18-4-24 10 2 16 12 14 24z" fill="#ff8a3d" opacity=".85"/>',
      extraFront: '<path d="M84 128l4 10-4 6M118 126l-3 10 4 8" stroke="#ffcc4d" stroke-width="2.5" fill="none" stroke-linecap="round"/>',
    }),
  },
  {
    id: 'shadow_dragon',
    name: 'דרקון הצללים',
    boss: true,
    art: (mood = 0) => evilDragon(mood, {
      body: '#3b2a5e', belly: '#6d5a9e', dark: '#150d2e', wing: '#241840', horn: '#c9d3dd',
      pupil: '#ff3b3b', ink: '#0d0820',
      extraBack: '<circle cx="34" cy="150" r="10" fill="#5b3a9c" opacity=".4"/><circle cx="168" cy="40" r="12" fill="#5b3a9c" opacity=".35"/>',
      extraFront: '<path d="M78 120l6 4M122 120l-6 4" stroke="#b57bff" stroke-width="2.5" stroke-linecap="round"/>',
    }),
  },
  {
    id: 'venom_dragon',
    name: 'דרקון הרעל',
    boss: true,
    art: (mood = 0) => evilDragon(mood, {
      body: '#3f8f2a', belly: '#c8f26a', dark: '#163d0e', wing: '#2a6b1c', horn: '#e8e2c4',
      pupil: '#ff9d1a', ink: '#0f2a08',
      extraFront: `
        <path d="M95 110c0 5-2 8-2 10a2 2 0 0 0 4 0c0-2-2-5-2-10z" fill="#9dff3a"/>
        <circle cx="64" cy="118" r="3" fill="#9dff3a" opacity=".8"/><circle cx="140" cy="112" r="2.4" fill="#9dff3a" opacity=".8"/>`,
    }),
  },
];

/** כמה פעמים (בערך) מופיע בוס במקום מפלצת רגילה */
export const BOSS_CHANCE = 0.25;

/** מצב הרוח לפי הנזק שספגה המפלצת: ככל שהלוחם מצליח יותר - היא מפחדת יותר */
export function moodFor(hp, maxHp) {
  const lost = 1 - hp / maxHp;
  if (lost <= 0) return 0;
  if (lost < 0.35) return 1;
  if (lost < 0.65) return 2;
  return 3;
}

/** מפלצת לקרב: לרוב מפלצת רגילה, ולפעמים בוס */
export function randomMonster() {
  const bosses = MONSTERS.filter((m) => m.boss);
  const regular = MONSTERS.filter((m) => !m.boss);
  const pool = bosses.length && Math.random() < BOSS_CHANCE ? bosses : regular;
  return pool[Math.floor(Math.random() * pool.length)];
}
