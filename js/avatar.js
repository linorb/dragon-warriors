// avatar.js - ציור הלוחם והדרקון ב-SVG שכבתי. כל פריט ציוד הוא שכבה שניתן להחליף.
// כל הדמויות מקוריות ונוצרו במיוחד למשחק הזה.

import { esc } from './util.js';

/* ============================ עזרי צבע ============================ */

function hex2rgb(hex) {
  const h = hex.replace('#', '');
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  return [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16));
}

function rgb2hex(r, g, b) {
  const c = (n) => Math.round(Math.min(255, Math.max(0, n))).toString(16).padStart(2, '0');
  return `#${c(r)}${c(g)}${c(b)}`;
}

/** בהיר/כהה יותר: amt חיובי מבהיר, שלילי מכהה */
export function shade(hex, amt) {
  const [r, g, b] = hex2rgb(hex);
  const f = (v) => (amt >= 0 ? v + (255 - v) * amt : v * (1 + amt));
  return rgb2hex(f(r), f(g), f(b));
}

/** נצנוץ בן 4 קצוות, במרכז (x,y) ובגודל r (הקצוות במרחק 2r) */
function starPath(x, y, r, fill) {
  const d = r * 2;
  return `<path d="M${x} ${y - d}Q${x} ${y} ${x + d} ${y}Q${x} ${y} ${x} ${y + d}Q${x} ${y} ${x - d} ${y}Q${x} ${y} ${x} ${y - d}z" fill="${fill}"/>`;
}

export const COLOR_CHOICES = [
  { id: '#59a9ff', name: 'כחול' },
  { id: '#4ddb8b', name: 'ירוק' },
  { id: '#ff6b6b', name: 'אדום' },
  { id: '#b57bff', name: 'סגול' },
  { id: '#ffcc4d', name: 'זהב' },
  { id: '#ff9d5c', name: 'כתום' },
  { id: '#5ee0dc', name: 'טורקיז' },
  { id: '#f47fd0', name: 'ורוד' },
];

/* ============================ שכבות ציוד ============================ */
// כל פונקציה מחזירה מחרוזת SVG. c = צבע הבסיס של השחקן.

/**
 * קסדת אביר מלאה: מכסה את כל הראש, ורק העיניים נוצצות מתוך חריץ המצחייה.
 * top - קישוט מאחורי הקסדה (נוצה, קרניים), front - קישוט מעליה (אבנים, סמלים).
 */
function knightHelm({ shell, light, dark, slit = '#140f24', glint = '#fff', top = '', front = '' }) {
  const holes = [88, 94, 100, 124, 130, 136]
    .map((x) => `<circle cx="${x}" cy="116" r="1.8"/><circle cx="${x}" cy="123" r="1.8"/>`).join('');
  return `
    <g class="layer-helmet">
      ${top}
      <path d="M112 44c-26 0-44 16-44 38v30c0 14 10 24 22 28h44c12-4 22-14 22-28V82c0-22-18-38-44-38z" fill="${shell}"/>
      <path d="M112 44c-26 0-44 16-44 38v30c0 14 10 24 22 28h8c-10-6-16-16-16-28V84c0-20 12-34 30-40z" fill="${light}"/>
      <path d="M112 46v92" stroke="${dark}" stroke-width="3" opacity=".55"/>
      <rect x="66" y="76" width="92" height="9" rx="4.5" fill="${dark}"/>
      <rect x="78" y="88" width="68" height="11" rx="5" fill="${slit}"/>
      <circle cx="99" cy="93.5" r="2.3" fill="${glint}"/>
      <circle cx="125" cy="93.5" r="2.3" fill="${glint}"/>
      <g fill="${dark}" opacity=".8">${holes}</g>
      ${front}
    </g>`;
}

// הקסדה יושבת מעל גובה העיניים, ומגני הלחיים יורדים רק בצדדים - כדי שהפנים יישארו גלויות
// (חוץ מקסדות האביר המלאות - h_knight*)
const HELMETS = {
  h_iron: () => `
    <g class="layer-helmet">
      <path d="M112 50c-24 0-42 15-42 32v4h84v-4c0-17-18-32-42-32z" fill="#9aa5b1"/>
      <path d="M112 50c-24 0-42 15-42 32v4h13v-4c0-15 12-27 29-28z" fill="#c3ccd6"/>
      <path d="M70 84v15c0 7 5 11 11 11h5V84z" fill="#8994a1"/>
      <path d="M154 84v15c0 7-5 11-11 11h-5V84z" fill="#8994a1"/>
      <rect x="106" y="80" width="12" height="15" rx="5" fill="#7b8794"/>
      <rect x="66" y="76" width="92" height="10" rx="5" fill="#6b7682"/>
    </g>`,
  h_wing: (c) => `
    <g class="layer-helmet">
      <path d="M112 48c-25 0-43 15-43 33v4h86v-4c0-18-18-33-43-33z" fill="${shade(c, -0.15)}"/>
      <path d="M112 48c-25 0-43 15-43 33v4h13v-4c0-16 13-28 30-29z" fill="${shade(c, 0.35)}"/>
      <path d="M69 83v14c0 7 5 11 11 11h5V83z" fill="${shade(c, -0.3)}"/>
      <path d="M155 83v14c0 7-5 11-11 11h-5V83z" fill="${shade(c, -0.3)}"/>
      <path d="M69 70c-16-10-28-8-34-2 10 2 12 6 10 12 10 4 20 2 26-4z" fill="#f2f5ff"/>
      <path d="M155 70c16-10 28-8 34-2-10 2-12 6-10 12-10 4-20 2-26-4z" fill="#f2f5ff"/>
      <rect x="105" y="78" width="14" height="16" rx="6" fill="${shade(c, -0.45)}"/>
      <rect x="65" y="75" width="94" height="10" rx="5" fill="${shade(c, -0.45)}"/>
    </g>`,
  h_horn: () => `
    <g class="layer-helmet">
      <path d="M112 50c-24 0-42 15-42 32v4h84v-4c0-17-18-32-42-32z" fill="#6f5a45"/>
      <path d="M112 50c-24 0-42 15-42 32v4h13v-4c0-15 12-27 29-28z" fill="#8d7359"/>
      <path d="M72 62c-12-10-24-10-32-4 10 4 14 12 12 22 10 2 18-6 20-18z" fill="#f0e6d2"/>
      <path d="M152 62c12-10 24-10 32-4-10 4-14 12-12 22-10 2-18-6-20-18z" fill="#f0e6d2"/>
      <path d="M70 84v15c0 7 5 11 11 11h5V84z" fill="#5c4a38"/>
      <path d="M154 84v15c0 7-5 11-11 11h-5V84z" fill="#5c4a38"/>
      <rect x="66" y="76" width="92" height="10" rx="5" fill="#4a3a2b"/>
    </g>`,
  h_dragon: (c) => `
    <g class="layer-helmet">
      <path d="M112 48c-25 0-43 16-43 34v4h86v-4c0-18-18-34-43-34z" fill="${shade(c, -0.35)}"/>
      <path d="M112 48c-25 0-43 16-43 34v4h13v-4c0-16 13-29 30-30z" fill="${shade(c, 0.1)}"/>
      <path d="M112 34c5 8 7 16 6 24h-12c-1-8 1-16 6-24z" fill="#ff8a3d"/>
      <path d="M96 44l-6-12 14 8zM128 44l6-12-14 8z" fill="#ff8a3d"/>
      <path d="M69 84v15c0 7 5 11 11 11h6V84z" fill="${shade(c, -0.5)}"/>
      <path d="M155 84v15c0 7-5 11-11 11h-6V84z" fill="${shade(c, -0.5)}"/>
      <rect x="65" y="76" width="94" height="10" rx="5" fill="${shade(c, -0.55)}"/>
      <circle cx="86" cy="70" r="4" fill="#ffcc4d"/>
      <circle cx="138" cy="70" r="4" fill="#ffcc4d"/>
    </g>`,
  h_crown: () => `
    <g class="layer-helmet">
      <path d="M70 84V56l14 12 12-18 16 16 16-16 12 18 14-12v28z" fill="#ffcc4d"/>
      <path d="M70 84V56l14 12 12-18 4 6v28z" fill="#ffe08a"/>
      <rect x="66" y="80" width="92" height="12" rx="6" fill="#e0a213"/>
      <circle cx="84" cy="62" r="5" fill="#ff6b6b"/>
      <circle cx="112" cy="54" r="6" fill="#59a9ff"/>
      <circle cx="140" cy="62" r="5" fill="#4ddb8b"/>
    </g>`,
  h_phoenix: () => `
    <g class="layer-helmet">
      <path d="M112 50c-4-14 2-26 12-34-2 10 2 14 8 16-8 4-10 10-8 18z" fill="#ffcc4d"/>
      <path d="M110 50c-8-9-17-11-25-8 7 3 9 8 7 14z" fill="#ff8a3d"/>
      <path d="M112 48c-25 0-43 15-43 33v4h86v-4c0-18-18-33-43-33z" fill="#c8331b"/>
      <path d="M112 48c-25 0-43 15-43 33v4h13v-4c0-16 13-28 30-29z" fill="#ff6a3d"/>
      <path d="M69 83v14c0 7 5 11 11 11h5V83z" fill="#8c2410"/>
      <path d="M155 83v14c0 7-5 11-11 11h-5V83z" fill="#8c2410"/>
      <rect x="65" y="75" width="94" height="10" rx="5" fill="#ffcc4d"/>
      <path d="M112 56l6 8-6 9-6-9z" fill="#fff3c4"/>
    </g>`,
  h_star: () => `
    <g class="layer-helmet">
      <path d="M112 48c-25 0-43 15-43 33v4h86v-4c0-18-18-33-43-33z" fill="#1f2a6b"/>
      <path d="M112 48c-25 0-43 15-43 33v4h13v-4c0-16 13-28 30-29z" fill="#3848a8"/>
      <path d="M69 83v14c0 7 5 11 11 11h5V83z" fill="#151d4d"/>
      <path d="M155 83v14c0 7-5 11-11 11h-5V83z" fill="#151d4d"/>
      <rect x="65" y="75" width="94" height="10" rx="5" fill="#ffcc4d"/>
      <path d="M112 22l5 11 12 1-9 8 3 12-11-7-11 7 3-12-9-8 12-1z" fill="#ffe08a"/>
      <circle cx="92" cy="62" r="2" fill="#fff"/>
      <circle cx="134" cy="58" r="2.4" fill="#fff"/>
      <circle cx="120" cy="68" r="1.6" fill="#fff"/>
      <circle cx="100" cy="72" r="1.4" fill="#ffe08a"/>
    </g>`,

  h_knight: () => knightHelm({ shell: '#a9b4c0', light: '#d5dde6', dark: '#6f7b88' }),
  h_knight_plume: (c) => knightHelm({
    shell: '#b9c4d0', light: '#e2e9f1', dark: '#7b8794',
    top: `
      <path d="M112 48c-4-18 6-34 32-40-8 10-9 18-5 27-11 2-19 7-27 13z" fill="${c}"/>
      <path d="M114 44c3-13 12-24 26-30-6 9-7 15-5 21" stroke="${shade(c, 0.45)}" stroke-width="3" fill="none" stroke-linecap="round"/>
      <rect x="105" y="38" width="14" height="10" rx="3" fill="#ffcc4d"/>`,
  }),
  h_knight_gold: () => knightHelm({
    shell: '#e0a213', light: '#ffe08a', dark: '#a87708', slit: '#3a2606',
    top: '<path d="M84 54l6-16 9 10 13-18 13 18 9-10 6 16z" fill="#ffcc4d"/>',
    front: '<circle cx="112" cy="64" r="5.5" fill="#ff6b6b"/><circle cx="110.5" cy="62.5" r="1.6" fill="#fff"/>',
  }),
  h_knight_dragon: () => knightHelm({
    shell: '#7a1d1d', light: '#b83a2a', dark: '#3f0c0c', glint: '#ffcc4d',
    top: `
      <path d="M74 70c-14-8-22-22-20-38 6 11 14 17 27 21z" fill="#f0e6d2"/>
      <path d="M150 70c14-8 22-22 20-38-6 11-14 17-27 21z" fill="#f0e6d2"/>
      <path d="M98 50l4-20 7 11 3-19 3 19 7-11 4 20z" fill="#ffcc4d"/>`,
    front: '<path d="M112 56l7 8-7 9-7-9z" fill="#ffcc4d"/>',
  }),
  h_knight_shadow: () => knightHelm({
    shell: '#2a1f45', light: '#4b3a72', dark: '#120c22', slit: '#0a0614', glint: '#d9b8ff',
    top: '<path d="M82 58l-10-24 18 14zM142 58l10-24-18 14zM104 46l8-28 8 28z" fill="#4b3a72"/>',
    front: `
      <rect x="78" y="88" width="68" height="11" rx="5" fill="none" stroke="#9b6bf0" stroke-width="1.6"/>
      <path d="M112 58l4 6-4 6-4-6z" fill="#c79bff"/>`,
  }),
  h_knight_emperor: () => knightHelm({
    shell: '#eef2ff', light: '#ffffff', dark: '#c9a227', slit: '#1f2a6b', glint: '#9fe3ff',
    top: `
      <path d="M112 46c-6-20 2-36 22-44-5 11-4 19 1 26-10 3-17 9-23 18z" fill="#d23c3c"/>
      <path d="M82 54l7-20 10 12 13-22 13 22 10-12 7 20z" fill="#ffcc4d"/>
      <circle cx="89" cy="36" r="3" fill="#59a9ff"/><circle cx="112" cy="26" r="3.5" fill="#ff6b6b"/><circle cx="135" cy="36" r="3" fill="#4ddb8b"/>`,
    front: `
      <path d="M110 104h4v26h-4zM102 110h20v4h-20z" fill="#ffcc4d"/>
      <circle cx="112" cy="64" r="5" fill="#b57bff"/><circle cx="110.5" cy="62.5" r="1.5" fill="#fff"/>`,
  }),
};

// כל השריונות בנויים על אותו קו מתאר, שעוטף בדיוק את הטוניקה של הגוף (baseBody)
// כדי שהשריון ישב על הדמות ולא תבצבץ מתחתיו הטוניקה בצדדים או למטה.
// החזה מתחיל מתחת לסנטר, והחצאית מכסה את החגורה ונגמרת בגובה תחתית הטוניקה.
const ARMOR_TORSO = 'M112 131c-20 0-33 6-38 18l-7 33h90l-7-33c-5-12-18-18-38-18z';
const ARMOR_TORSO_LIGHT = 'M112 131c-20 0-33 6-38 18l-7 33h14l6-30c3-11 12-19 25-21z';
const ARMOR_SKIRT = 'M68 182h88l2 12c2 11-5 19-16 19H82c-11 0-18-8-16-19z';

// אפוד: שני חלקים קדמיים בלי שרוולים ובלי חצאית. במרכז נשאר פתח בצורת V,
// כך שרואים את הטוניקה מתחת, והחגורה נשארת גלויה.
const VEST_LEFT = 'M104 132c-15 1-26 8-30 17l-7 33h43v-26z';
const VEST_RIGHT = 'M120 132c15 1 26 8 30 17l7 33h-43v-26z';
const VEST_LEFT_LIGHT = 'M104 132c-15 1-26 8-30 17l-7 33h12l6-30c3-10 9-16 19-20z';
const VEST_EDGES = 'M104 133l6 23v26M120 133l-6 23v26';

function vest(fill, light, inner = '', edge = '') {
  return `
    <g class="layer-armor">
      <path d="${VEST_LEFT}" fill="${fill}"/>
      <path d="${VEST_RIGHT}" fill="${fill}"/>
      <path d="${VEST_LEFT_LIGHT}" fill="${light}"/>
      ${edge ? `<path d="${VEST_EDGES}" stroke="${edge}" stroke-width="3" fill="none" stroke-linejoin="round"/>` : ''}
      ${inner}
    </g>`;
}

/** תבנית חוזרת (טבעות, קשקשים) רק בתוך שני חלקי האפוד */
function vestPattern(draw) {
  const out = [];
  for (let y = 148; y <= 176; y += 7) {
    for (let x = 80; x <= 102; x += 7) out.push(draw(x, y));
    for (let x = 122; x <= 144; x += 7) out.push(draw(x, y));
  }
  return out.join('');
}

const ARMORS = {
  a_leather: () => `
    <g class="layer-armor">
      <path d="${ARMOR_TORSO}" fill="#8a5a33"/>
      <path d="${ARMOR_SKIRT}" fill="#71472a"/>
      <circle cx="112" cy="158" r="9" fill="#d4a24c"/>
    </g>`,
  a_steel: () => `
    <g class="layer-armor">
      <path d="${ARMOR_TORSO}" fill="#b9c4d0"/>
      <path d="${ARMOR_TORSO_LIGHT}" fill="#e2e9f1"/>
      <path d="${ARMOR_SKIRT}" fill="#93a0ad"/>
      <path d="M112 142l12 14-12 16-12-16z" fill="#6f7d8c"/>
    </g>`,
  a_forest: () => `
    <g class="layer-armor">
      <path d="${ARMOR_TORSO}" fill="#3f7d4a"/>
      <path d="${ARMOR_SKIRT}" fill="#356840"/>
      <path d="M112 146c6 4 9 10 8 16-7 1-12-3-14-9 1-3 3-5 6-7z" fill="#7ee0a3"/>
      <path d="M104 160c-5-1-9-5-9-10 5-2 10 0 12 5z" fill="#7ee0a3"/>
    </g>`,
  a_scale: (c) => `
    <g class="layer-armor">
      <path d="${ARMOR_TORSO}" fill="${shade(c, -0.3)}"/>
      ${[0, 1, 2].map((row) => [0, 1, 2, 3, 4].map((col) => {
    const x = 80 + col * 13 + (row % 2 ? 6 : 0);
    const y = 142 + row * 13;
    return `<path d="M${x} ${y}a7 7 0 0 1 12 0c0 6-6 10-6 10s-6-4-6-10z" fill="${shade(c, 0.15)}" opacity=".9"/>`;
  }).join('')).join('')}
      <path d="${ARMOR_SKIRT}" fill="${shade(c, -0.5)}"/>
    </g>`,
  a_gold: () => `
    <g class="layer-armor">
      <path d="${ARMOR_TORSO}" fill="#e0a213"/>
      <path d="${ARMOR_TORSO_LIGHT}" fill="#ffe08a"/>
      <path d="${ARMOR_SKIRT}" fill="#b8820c"/>
      <path d="M112 140l14 12-6 18h-16l-6-18z" fill="#fff3c4"/>
      <circle cx="112" cy="158" r="5" fill="#ff6b6b"/>
    </g>`,
  a_crystal: () => `
    <g class="layer-armor">
      <path d="${ARMOR_TORSO}" fill="#5ab8e0"/>
      <path d="${ARMOR_TORSO_LIGHT}" fill="#bdeeff"/>
      <path d="${ARMOR_SKIRT}" fill="#3d8fb8"/>
      <path d="M112 138l16 14-6 22h-20l-6-22z" fill="#e8fbff"/>
      <path d="M112 138v36M96 152h32M112 138l-10 36M112 138l10 36" stroke="#5ab8e0" stroke-width="1.6" opacity=".7"/>
      <path d="M82 190l6 8 6-8 6 8 6-8 6 8 6-8 6 8 6-8 6 8 6-8" stroke="#bdeeff" stroke-width="2.2" fill="none" stroke-linejoin="round"/>
    </g>`,
  a_dragonlord: () => `
    <g class="layer-armor">
      <path d="${ARMOR_TORSO}" fill="#7a1d1d"/>
      <path d="${ARMOR_TORSO_LIGHT}" fill="#b83a2a"/>
      ${[0, 1].map((row) => [0, 1, 2, 3].map((col) => {
    const x = 86 + col * 14 + (row % 2 ? 7 : 0);
    const y = 164 + row * 9;
    return `<path d="M${x} ${y}a6 6 0 0 1 11 0" stroke="#e0a213" stroke-width="2" fill="none" opacity=".8"/>`;
  }).join('')).join('')}
      <path d="${ARMOR_SKIRT}" fill="#5a1414"/>
      <path d="M68 182h88v5H68z" fill="#ffcc4d"/>
      <circle cx="112" cy="150" r="11" fill="#ffcc4d"/>
      <path d="M112 142c4 4 7 5 9 4-2 4-2 7 0 10-4 1-7 4-9 7-2-3-5-6-9-7 2-3 2-6 0-10 2 1 5 0 9-4z" fill="#7a1d1d"/>
    </g>`,

  a_vest_leather: () => vest('#9a6a3c', '#b98a55', `
      <path d="M103 137l6 23v19M121 137l-6 23v19" stroke="#e8c27a" stroke-width="1.6" stroke-dasharray="3 3" fill="none"/>
      <path d="M106 141l12 4M107 147l10 4M108 153l8 3" stroke="#5c3a1c" stroke-width="2" stroke-linecap="round"/>
      <rect x="80" y="162" width="18" height="12" rx="3" fill="#7a5230"/>
      <rect x="126" y="162" width="18" height="12" rx="3" fill="#7a5230"/>`),
  a_vest_chain: () => vest('#7b8794', '#9aa5b1',
    vestPattern((x, y) => `<circle cx="${x}" cy="${y}" r="2.7" fill="none" stroke="#d5dde6" stroke-width="1.2"/>`),
    '#5c3a1c'),
  a_vest_knight: (c) => `
    <g class="layer-armor">
      <path d="M112 131c-20 0-33 6-38 18l-7 33 3 24 42 8 42-8 3-24-7-33c-5-12-18-18-38-18z" fill="${shade(c, -0.25)}"/>
      <path d="M112 131c-20 0-33 6-38 18l-7 33 3 24 12 2-1-55c2-12 14-20 31-22z" fill="${shade(c, 0.12)}"/>
      <path d="M112 131c-20 0-33 6-38 18l-7 33 3 24 42 8 42-8 3-24-7-33c-5-12-18-18-38-18z" fill="none" stroke="#ffcc4d" stroke-width="2.5"/>
      <rect x="70" y="182" width="84" height="9" rx="4" fill="#4a3826"/>
      <rect x="104" y="180" width="16" height="13" rx="3" fill="#ffcc4d"/>
      <path d="M112 139c8 0 13 2 13 2v11c0 9-7 13-13 16-6-3-13-7-13-16v-11s5-2 13-2z" fill="#f2f5ff"/>
      <path d="M110 143h4v20h-4zM104 150h16v4h-16z" fill="#d23c3c"/>
    </g>`,
  a_vest_royal: () => vest('#5b2a8c', '#7b45d6', `
      <path d="M103 134l6 23v24M121 134l-6 23v24" stroke="#fff" stroke-width="5" fill="none"/>
      <circle cx="104" cy="142" r="1.2" fill="#222"/><circle cx="107" cy="154" r="1.2" fill="#222"/><circle cx="108" cy="168" r="1.2" fill="#222"/>
      <circle cx="120" cy="142" r="1.2" fill="#222"/><circle cx="117" cy="154" r="1.2" fill="#222"/><circle cx="116" cy="168" r="1.2" fill="#222"/>
      <path d="${VEST_LEFT}${VEST_RIGHT}" fill="none" stroke="#ffcc4d" stroke-width="2"/>
      <circle cx="96" cy="162" r="3" fill="#ffcc4d"/><circle cx="96" cy="172" r="3" fill="#ffcc4d"/>
      <circle cx="128" cy="162" r="3" fill="#ffcc4d"/><circle cx="128" cy="172" r="3" fill="#ffcc4d"/>`),
  a_vest_shadow: () => vest('#1e1633', '#33265a', `
      <path d="M80 150l6 6-6 6 6 6M144 150l-6 6 6 6-6 6" stroke="#9b6bf0" stroke-width="2.2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
      <circle cx="92" cy="146" r="2" fill="#c79bff"/><circle cx="132" cy="146" r="2" fill="#c79bff"/>
      <rect x="104" y="158" width="16" height="4" rx="2" fill="#c9d3dd"/>
      <rect x="104" y="168" width="16" height="4" rx="2" fill="#c9d3dd"/>`, '#4b2a8c'),
  a_vest_dragon: () => vest('#24202e', '#3a3448',
    vestPattern((x, y) => `<path d="M${x - 3.5} ${y}a3.5 3.5 0 0 1 7 0c0 3-3.5 5-3.5 5s-3.5-2-3.5-5z" fill="#3d3a4a" stroke="#c0392b" stroke-width="1.1"/>`)
    + `<rect x="102" y="156" width="20" height="8" rx="3" fill="#ffcc4d"/>
       <circle cx="112" cy="160" r="4" fill="#ff3b3b"/><circle cx="111" cy="159" r="1.2" fill="#fff"/>`,
    '#c0392b'),
};

const WEAPONS = {
  w_sword: () => `
    <g class="layer-weapon">
      <rect x="48" y="96" width="9" height="76" rx="4" fill="#cf9b4e"/>
      <path d="M52.5 88l6 12h-12z" fill="#e8c27a"/>
      <rect x="38" y="170" width="29" height="8" rx="4" fill="#6b4b25"/>
      <rect x="48" y="178" width="9" height="20" rx="4" fill="#4a3318"/>
      <circle cx="52.5" cy="200" r="6" fill="#6b4b25"/>
    </g>`,
  w_axe: () => `
    <g class="layer-weapon">
      <rect x="48" y="92" width="9" height="108" rx="4" fill="#5b3f21"/>
      <path d="M57 104c22-16 38-10 42 4-14 6-16 14-12 24-16 4-28-6-30-18z" fill="#a9b6c3"/>
      <path d="M57 104c22-16 38-10 42 4-10-6-24-8-42 8z" fill="#dde6ef"/>
      <circle cx="52.5" cy="204" r="7" fill="#3c2a13"/>
    </g>`,
  w_flame: () => `
    <g class="layer-weapon">
      <path d="M52 82c10 12 12 26 8 40l-4 50h-9l-4-50c-4-14-1-28 9-40z" fill="#ff8a3d"/>
      <path d="M52 82c7 12 8 24 5 36-3-10-6-16-10-22z" fill="#ffd36b"/>
      <rect x="36" y="170" width="33" height="9" rx="4" fill="#8c3a12"/>
      <rect x="48" y="179" width="9" height="22" rx="4" fill="#5c2409"/>
      <circle cx="52.5" cy="203" r="7" fill="#ff6a2b"/>
      <circle cx="52.5" cy="203" r="3" fill="#ffe9a8"/>
    </g>`,
  w_spear: () => `
    <g class="layer-weapon">
      <rect x="49" y="86" width="7" height="116" rx="3" fill="#7a5a32"/>
      <path d="M52.5 74l9 20h-18z" fill="#cfd8e3"/>
      <path d="M52.5 74l9 20h-9z" fill="#9aa5b1"/>
      <rect x="43" y="96" width="19" height="6" rx="3" fill="#c79b4e"/>
      <path d="M52.5 208l-5-8h10z" fill="#9aa5b1"/>
    </g>`,
  w_hammer: () => `
    <g class="layer-weapon">
      <rect x="48" y="104" width="9" height="98" rx="4" fill="#6b4b25"/>
      <rect x="32" y="82" width="42" height="30" rx="7" fill="#8994a1"/>
      <rect x="32" y="82" width="42" height="11" rx="5" fill="#b9c4d0"/>
      <rect x="36" y="94" width="10" height="8" rx="2" fill="#6b7682"/>
      <circle cx="52.5" cy="206" r="7" fill="#4a3318"/>
    </g>`,
  w_ice: () => `
    <g class="layer-weapon">
      <path d="M52.5 78c9 14 11 28 8 42l-4 48h-9l-4-48c-3-14-1-28 9-42z" fill="#9fe3ff"/>
      <path d="M52.5 78c6 14 7 26 5 38-3-11-6-18-10-24z" fill="#e8f9ff"/>
      <path d="M38 96l-10-8 12 2zM67 96l10-8-12 2z" fill="#cdeeff"/>
      <rect x="36" y="168" width="33" height="9" rx="4" fill="#3d7ea6"/>
      <rect x="48" y="177" width="9" height="22" rx="4" fill="#2a5b7a"/>
      <circle cx="52.5" cy="203" r="7" fill="#9fe3ff"/>
    </g>`,
  w_legend: () => `
    <g class="layer-weapon">
      <path d="M52.5 66l7 16-3 88h-8l-3-88z" fill="#fff3c4"/>
      <path d="M52.5 66l7 16-3 88h-4z" fill="#ffcc4d"/>
      <path d="M30 168h45l-6 12H36z" fill="#b8820c"/>
      <rect x="48" y="180" width="9" height="20" rx="4" fill="#7a5408"/>
      <circle cx="52.5" cy="204" r="8" fill="#ffcc4d"/>
      <circle cx="52.5" cy="204" r="4" fill="#fff3c4"/>
      <path d="M40 96l-8-6 9 1zM65 96l8-6-9 1zM40 126l-8-6 9 1zM65 126l8-6-9 1z" fill="#ffe08a"/>
    </g>`,
  w_trident: () => `
    <g class="layer-weapon">
      <rect x="49" y="96" width="7" height="110" rx="3" fill="#2a7d8c"/>
      <path d="M36 70v18c0 8 7 12 16.5 12S69 96 69 88V70l-5 6v12c0 3-4 5-8 5V64l-3.5-8-3.5 8v29c-4 0-8-2-8-5V76z" fill="#5ee0dc"/>
      <path d="M52.5 56l3.5 8v29h-3.5z" fill="#c9fffc"/>
      <rect x="44" y="100" width="17" height="6" rx="3" fill="#ffcc4d"/>
      <circle cx="52.5" cy="208" r="6" fill="#ffcc4d"/>
    </g>`,
  w_star: () => `
    <g class="layer-weapon">
      <path d="M52.5 62l8 16-3 90h-10l-3-90z" fill="#3848a8"/>
      <path d="M52.5 62l8 16-3 90h-5z" fill="#6b7fe0"/>
      <circle cx="52" cy="92" r="1.8" fill="#fff"/>
      <circle cx="54" cy="112" r="1.4" fill="#fff"/>
      <circle cx="51" cy="132" r="2" fill="#ffe08a"/>
      <circle cx="54" cy="152" r="1.4" fill="#fff"/>
      <path d="M32 166h41l-5 10H37z" fill="#ffcc4d"/>
      <rect x="48" y="176" width="9" height="20" rx="4" fill="#1f2a6b"/>
      <path d="M52.5 194l3 6.5 7 .6-5.3 4.6 1.6 6.8-6.3-3.8-6.3 3.8 1.6-6.8-5.3-4.6 7-.6z" fill="#ffe08a"/>
    </g>`,
  w_dragonfang: () => `
    <g class="layer-weapon">
      <path d="M47 62c18 22 20 62 11 108h-11c4-36 4-72 0-108z" fill="#f3ead2"/>
      <path d="M47 62c18 22 20 62 11 108h-4c7-42 5-78-7-108z" fill="#d6c7a0"/>
      <path d="M50 100l5 3M51 124l5 3M51 148l5 3" stroke="#b8a77a" stroke-width="1.6" stroke-linecap="round"/>
      <path d="M28 166c10-8 18-6 24 0 6-6 14-8 24 0l-6 11H34z" fill="#7a1d1d"/>
      <rect x="48" y="177" width="9" height="20" rx="4" fill="#3a1010"/>
      <circle cx="52.5" cy="202" r="7.5" fill="#7a1d1d"/>
      <circle cx="52.5" cy="202" r="4" fill="#ff3b3b"/>
    </g>`,
  w_eternal: () => `
    <g class="layer-weapon">
      <path d="M52.5 56l9 18-3 94h-12l-3-94z" fill="#9fe3ff"/>
      <path d="M52.5 64l5 12-2 88h-6l-2-88z" fill="#f2fdff"/>
      <path d="M26 164c8-10 18-8 26 0 8-8 18-10 26 0l-8 10H34z" fill="#ffcc4d"/>
      <rect x="48" y="174" width="9" height="22" rx="4" fill="#5b2a8c"/>
      <circle cx="52.5" cy="202" r="8" fill="#ffcc4d"/>
      <circle cx="52.5" cy="202" r="4.5" fill="#b57bff"/>
      ${starPath(36, 92, 2.4, '#fff')}${starPath(70, 118, 2, '#e8f9ff')}${starPath(38, 140, 1.6, '#fff')}
    </g>`,
};

const SHIELDS = {
  s_wood: () => `
    <g class="layer-shield">
      <path d="M170 118c14 0 26 3 26 3v34c0 22-14 34-26 40-12-6-26-18-26-40v-34s12-3 26-3z" fill="#9a6b3c"/>
      <path d="M170 128c9 0 17 2 17 2v26c0 15-9 24-17 28-8-4-17-13-17-28v-26s8-2 17-2z" fill="#b98a55"/>
      <circle cx="170" cy="158" r="8" fill="#6d4a26"/>
    </g>`,
  s_dragon: (c) => `
    <g class="layer-shield">
      <path d="M170 114c15 0 28 4 28 4v36c0 24-15 37-28 43-13-6-28-19-28-43v-36s13-4 28-4z" fill="${shade(c, -0.3)}"/>
      <path d="M170 124c10 0 19 3 19 3v28c0 17-10 26-19 31-9-5-19-14-19-31v-28s9-3 19-3z" fill="${shade(c, 0.25)}"/>
      <path d="M170 134c6 8 12 10 16 9-4 6-4 12 0 18-8 2-12 8-16 14-4-6-8-12-16-14 4-6 4-12 0-18 4 1 10-1 16-9z" fill="${shade(c, -0.5)}"/>
    </g>`,
  s_round: () => `
    <g class="layer-shield">
      <circle cx="170" cy="156" r="32" fill="#8a5a33"/>
      <circle cx="170" cy="156" r="25" fill="#a97544"/>
      <circle cx="170" cy="156" r="10" fill="#c9d3dd"/>
      <circle cx="170" cy="156" r="4" fill="#6b7682"/>
    </g>`,
  s_steel: () => `
    <g class="layer-shield">
      <path d="M170 116c16 0 29 4 29 4v34c0 24-15 38-29 44-14-6-29-20-29-44v-34s13-4 29-4z" fill="#8994a1"/>
      <path d="M170 116c16 0 29 4 29 4v34c0 24-15 38-29 44V116z" fill="#6f7d8c"/>
      <path d="M170 128l9 16-9 14-9-14z" fill="#e2e9f1"/>
      <path d="M148 130h44v6h-44z" fill="#c9d3dd" opacity=".7"/>
    </g>`,
  s_star: () => `
    <g class="layer-shield">
      <path d="M170 112c16 0 30 4 30 4v36c0 25-16 39-30 46-14-7-30-21-30-46v-36s14-4 30-4z" fill="#e0a213"/>
      <path d="M170 122c11 0 21 3 21 3v28c0 18-11 28-21 33-10-5-21-15-21-33v-28s10-3 21-3z" fill="#ffe08a"/>
      <path d="M170 134l6 13 14 1-11 9 4 14-13-8-13 8 4-14-11-9 14-1z" fill="#b8820c"/>
    </g>`,
  s_phoenix: () => `
    <g class="layer-shield">
      <path d="M170 114c15 0 28 4 28 4v36c0 24-15 37-28 43-13-6-28-19-28-43v-36s13-4 28-4z" fill="#a8260f"/>
      <path d="M170 124c10 0 19 3 19 3v28c0 17-10 26-19 31-9-5-19-14-19-31v-28s9-3 19-3z" fill="#ff6a3d"/>
      <path d="M170 176c-3-10-2-18 0-24-6 2-12 0-16-6 6 0 10-2 12-6-4-2-6-6-6-10 6 2 9 5 10 9 1-4 4-7 10-9 0 4-2 8-6 10 2 4 6 6 12 6-4 6-10 8-16 6 2 6 3 14 0 24z" fill="#ffcc4d"/>
    </g>`,
  s_crystal: () => `
    <g class="layer-shield">
      <path d="M170 112l30 16v36l-30 34-30-34v-36z" fill="#3d8fb8"/>
      <path d="M170 112l30 16v36l-30 34z" fill="#5ab8e0"/>
      <path d="M170 126l18 10v24l-18 20-18-20v-24z" fill="#d8f6ff" opacity=".85"/>
      <path d="M170 126v54M152 136l36 24M188 136l-36 24" stroke="#5ab8e0" stroke-width="2" opacity=".7"/>
      <circle cx="162" cy="134" r="2.4" fill="#fff"/>
    </g>`,
  s_dragonlord: () => `
    <g class="layer-shield">
      <path d="M170 110c17 0 31 5 31 5v37c0 26-17 40-31 47-14-7-31-21-31-47v-37s14-5 31-5z" fill="#ffcc4d"/>
      <path d="M170 116c13 0 25 4 25 4v32c0 21-13 33-25 39-12-6-25-18-25-39v-32s12-4 25-4z" fill="#2a1414"/>
      <path d="M170 128c-14 2-20 12-20 12 8-2 12 0 14 4-6 4-8 10-6 16 4-6 8-8 12-8s8 2 12 8c2-6 0-12-6-16 2-4 6-6 14-4 0 0-6-10-20-12z" fill="#c0392b"/>
      <path d="M163 128l-5-10 8 6zM177 128l5-10-8 6z" fill="#ffcc4d"/>
      <circle cx="165" cy="140" r="1.8" fill="#ffcc4d"/><circle cx="175" cy="140" r="1.8" fill="#ffcc4d"/>
    </g>`,
};

// הגלימה רחבה מהגוף כדי שתבלוט משני הצדדים
const CAPE_PATH = 'M86 130C62 150 48 200 52 238c30 12 90 12 120 0 4-38-10-88-34-108-14 10-38 10-52 0z';
const CAPE_FOLD = 'M86 130c-16 30-24 76-22 112 7 2 14 3 21 4-9-38-7-86 1-116z';

const CAPES = {
  c_grey: () => `
    <g class="layer-cape">
      <path d="${CAPE_PATH}" fill="#7d8595"/>
      <path d="${CAPE_FOLD}" fill="#99a2b1"/>
    </g>`,
  c_night: () => `
    <g class="layer-cape">
      <path d="${CAPE_PATH}" fill="#2b2b57"/>
      <path d="${CAPE_FOLD}" fill="#3a3a73"/>
      <circle cx="74" cy="186" r="2.5" fill="#ffe9a8"/>
      <circle cx="146" cy="200" r="2.2" fill="#ffe9a8"/>
      <circle cx="112" cy="232" r="2.8" fill="#ffe9a8"/>
      <circle cx="152" cy="160" r="2" fill="#ffe9a8"/>
      <circle cx="66" cy="222" r="2.2" fill="#ffe9a8"/>
      <circle cx="128" cy="176" r="2" fill="#ffe9a8"/>
    </g>`,
  c_leaf: () => `
    <g class="layer-cape">
      <path d="${CAPE_PATH}" fill="#3f7d4a"/>
      <path d="${CAPE_FOLD}" fill="#59a06a"/>
      <path d="M100 170c8 5 11 14 9 22-9 1-16-5-18-14 2-4 5-7 9-8z" fill="#7ee0a3" opacity=".8"/>
      <path d="M130 205c8 5 11 14 9 22-9 1-16-5-18-14 2-4 5-7 9-8z" fill="#7ee0a3" opacity=".6"/>
    </g>`,
  c_flame: () => `
    <g class="layer-cape">
      <path d="${CAPE_PATH}" fill="#a83214"/>
      <path d="${CAPE_FOLD}" fill="#d14a20"/>
      <path d="M60 238c8-14 8-26 4-34 14 8 20 22 14 34zM110 244c8-14 8-26 4-34 14 8 20 22 14 34zM152 238c8-14 8-26 4-34 14 8 20 22 14 34z" fill="#ff8a3d"/>
    </g>`,
  c_royal: () => `
    <g class="layer-cape">
      <path d="${CAPE_PATH}" fill="#5b2a8c"/>
      <path d="${CAPE_FOLD}" fill="#7b45d6"/>
      <path d="M52 230c30 12 88 12 120 0l3 10c-32 12-94 12-126 0z" fill="#ffe08a"/>
      <path d="M112 160l5 11 12 1-9 8 3 12-11-7-11 7 3-12-9-8 12-1z" fill="#ffcc4d"/>
    </g>`,
  c_star: () => `
    <g class="layer-cape">
      <path d="${CAPE_PATH}" fill="#1f2a6b"/>
      <path d="${CAPE_FOLD}" fill="#2e3d8f"/>
      <path d="M148 168a12 12 0 1 0 8 20 10 10 0 1 1-8-20z" fill="#ffe08a"/>
      ${[[70, 180, 2.4], [96, 214, 2], [128, 232, 2.6], [62, 226, 1.8], [150, 214, 2.2], [80, 150, 1.6], [120, 196, 1.6]]
    .map(([x, y, r]) => starPath(x, y, r, '#fff')).join('')}
    </g>`,
  c_phoenix: () => `
    <g class="layer-cape">
      <path d="${CAPE_PATH}" fill="#c8331b"/>
      <path d="${CAPE_FOLD}" fill="#ff6a3d"/>
      <path d="M52 238c4-16 2-30-6-40 16 6 24 22 20 40zM78 244c4-16 2-30-6-40 16 6 24 22 20 40zM106 246c4-16 2-30-6-40 16 6 24 22 20 40zM134 244c4-16 2-30-6-40 16 6 24 22 20 40zM160 238c4-16 2-30-6-40 16 6 24 22 20 40z" fill="#ffcc4d"/>
      <path d="M86 150c10 6 18 6 26 0 8 6 16 6 26 0" stroke="#ffcc4d" stroke-width="3" fill="none" stroke-linecap="round"/>
    </g>`,
  // גלימה בצורת כנפי דרקון: התחתית מחורצת, ו"עצמות" הכנף יוצאות מהכתפיים
  c_dragonwing: () => `
    <g class="layer-cape">
      <path d="M86 130C62 150 48 200 52 238Q67 222 82 244Q97 228 112 248Q127 228 142 244Q157 222 172 238C176 200 162 150 138 130c-14 10-38 10-52 0z" fill="#5a1414"/>
      <path d="M86 130c-16 30-24 76-22 112 5-6 11-6 18 2-9-38-6-84 4-114z" fill="#7a1d1d"/>
      <path d="M88 134L56 234M98 136L84 242M126 136L140 242M136 134L168 234" stroke="#2a0808" stroke-width="3" stroke-linecap="round"/>
      <path d="M86 130c14 10 38 10 52 0" stroke="#ffcc4d" stroke-width="3" fill="none" stroke-linecap="round"/>
    </g>`,
};

const AURAS = {
  au_fire: (c, uid) => `
    <g class="layer-aura" opacity="0.9">
      <ellipse cx="112" cy="170" rx="104" ry="126" fill="url(#auraFire-${uid})"/>
      <ellipse cx="112" cy="170" rx="100" ry="122" fill="none" stroke="#ffb648" stroke-opacity=".45" stroke-width="4"/>
      <g fill="#ffb648" opacity=".8">
        <path d="M24 250c6-14 4-26-2-34 14 4 22 16 20 34z"/>
        <path d="M200 250c-6-14-4-26 2-34-14 4-22 16-20 34z"/>
        <path d="M112 34c6-12 4-22-2-30 14 4 22 14 20 30z"/>
        <path d="M12 130c10-8 14-18 12-28 12 10 14 24 4 34z"/>
        <path d="M212 130c-10-8-14-18-12-28-12 10-14 24-4 34z"/>
      </g>
    </g>`,
  au_leaf: (c, uid) => `
    <g class="layer-aura" opacity="0.9">
      <ellipse cx="112" cy="170" rx="104" ry="126" fill="url(#auraLeaf-${uid})"/>
      <ellipse cx="112" cy="170" rx="100" ry="122" fill="none" stroke="#7ee0a3" stroke-opacity=".4" stroke-width="3"/>
      <g fill="#7ee0a3" opacity=".85">
        <path d="M22 210c10-6 14-16 12-26 12 8 14 22 4 30z"/>
        <path d="M202 210c-10-6-14-16-12-26-12 8-14 22-4 30z"/>
        <path d="M112 42c10-6 14-16 12-26 12 8 14 22 4 30z"/>
        <path d="M40 92c10-6 14-16 12-26 12 8 14 22 4 30z"/>
      </g>
    </g>`,
  au_ice: (c, uid) => `
    <g class="layer-aura" opacity="0.9">
      <ellipse cx="112" cy="170" rx="104" ry="126" fill="url(#auraIce-${uid})"/>
      <ellipse cx="112" cy="170" rx="100" ry="122" fill="none" stroke="#9fe3ff" stroke-opacity=".5" stroke-width="3"/>
      <g stroke="#e8f9ff" stroke-width="3" stroke-linecap="round" opacity=".9">
        <path d="M20 140v18M12 149h16M196 200v18M188 209h16M112 26v18M104 35h16M30 236v14M24 243h12"/>
      </g>
    </g>`,
  au_storm: (c, uid) => `
    <g class="layer-aura" opacity="0.95">
      <ellipse cx="112" cy="170" rx="106" ry="128" fill="url(#auraStorm-${uid})"/>
      <ellipse cx="112" cy="170" rx="101" ry="123" fill="none" stroke="#c79bff" stroke-opacity=".55" stroke-width="4"/>
      <g fill="#ffcc4d">
        <path d="M26 120l14-30-4 20 12-4-18 34 4-20z"/>
        <path d="M196 230l-14-30 4 20-12-4 18 34-4-20z"/>
        <path d="M112 20l14-24-4 16 12-4-18 30 4-18z"/>
      </g>
    </g>`,
  au_rainbow: () => `
    <g class="layer-aura" opacity="0.8">
      ${['#ff6b6b', '#ff9d5c', '#ffcc4d', '#4ddb8b', '#59a9ff', '#b57bff'].map((col, i) => `
      <ellipse cx="112" cy="170" rx="${104 - i * 5}" ry="${126 - i * 5}" fill="none" stroke="${col}" stroke-width="4.5" stroke-opacity=".55"/>`).join('')}
    </g>`,
  au_star: (c, uid) => `
    <g class="layer-aura" opacity="0.95">
      <ellipse cx="112" cy="170" rx="106" ry="128" fill="url(#auraStar-${uid})"/>
      <ellipse cx="112" cy="170" rx="101" ry="123" fill="none" stroke="#ffe08a" stroke-opacity=".55" stroke-width="3"/>
      ${[[22, 120, 5], [204, 150, 6], [112, 30, 7], [40, 238, 4], [190, 244, 5], [30, 180, 3], [196, 88, 4]]
    .map(([x, y, r]) => starPath(x, y, r, '#fff3c4')).join('')}
    </g>`,
  au_eternal: (c, uid) => `
    <g class="layer-aura" opacity="0.95">
      <ellipse cx="112" cy="170" rx="108" ry="130" fill="url(#auraEternal-${uid})"/>
      <ellipse cx="112" cy="170" rx="104" ry="40" fill="none" stroke="#ffcc4d" stroke-opacity=".6" stroke-width="3" transform="rotate(-24 112 170)"/>
      <ellipse cx="112" cy="170" rx="104" ry="40" fill="none" stroke="#9fe3ff" stroke-opacity=".6" stroke-width="3" transform="rotate(24 112 170)"/>
      ${[[18, 110, 5], [206, 120, 6], [112, 26, 7], [36, 250, 5], [192, 250, 5], [196, 70, 3.5], [24, 190, 3.5]]
    .map(([x, y, r], i) => starPath(x, y, r, i % 2 ? '#e8f9ff' : '#fff3c4')).join('')}
    </g>`,
};

/* ============================ אביזרים לדרקון ============================ */
// מצוירים בקואורדינטות של הדרקונון (ראש במרכז 192,222 - צוואר סביב 194,242).
// בשלבים הגדולים הם גדלים יחד עם הדרקון, ועל הביצה הם מוזזים (ראו dragon).

const DRAGON_HEADS = {
  dh_bow: () => `
    <g class="layer-dragon-head">
      <path d="M192 205c-4-6-12-9-15-5-2 4 2 10 15 5zM192 205c4-6 12-9 15-5 2 4-2 10-15 5z" fill="#ff6b9d"/>
      <path d="M190 204c-3-2-7-3-9-2M194 204c3-2 7-3 9-2" stroke="#ffb3cc" stroke-width="1.5" fill="none" stroke-linecap="round"/>
      <circle cx="192" cy="205" r="3.5" fill="#e0306a"/>
    </g>`,
  dh_party: () => `
    <g class="layer-dragon-head">
      <path d="M180 207l12-30 12 30z" fill="#59a9ff"/>
      <path d="M180 207l12-30 3 30z" fill="#8fd0ff"/>
      <circle cx="188" cy="200" r="2" fill="#fff"/>
      <circle cx="197" cy="195" r="2" fill="#fff"/>
      <circle cx="192" cy="188" r="1.8" fill="#fff"/>
      <path d="M179 206q13 5 26 0" stroke="#ffcc4d" stroke-width="3" fill="none" stroke-linecap="round"/>
      <circle cx="192" cy="177" r="4" fill="#ffcc4d"/>
    </g>`,
  dh_crown: () => `
    <g class="layer-dragon-head">
      <path d="M179 207v-14l6 6 7-10 7 10 6-6v14z" fill="#ffcc4d"/>
      <path d="M179 207v-14l6 6 7-10v18z" fill="#ffe08a"/>
      <rect x="178" y="203" width="28" height="5" rx="2.5" fill="#e0a213"/>
      <circle cx="192" cy="197" r="2.6" fill="#ff6b6b"/>
      <circle cx="184" cy="201" r="1.8" fill="#59a9ff"/>
      <circle cx="200" cy="201" r="1.8" fill="#4ddb8b"/>
    </g>`,
  dh_wizard: () => `
    <g class="layer-dragon-head">
      <path d="M182 206c3-10 5-22 16-34-2 6 0 10 4 12-3 6-2 14 1 22z" fill="#7b45d6"/>
      <path d="M182 206c3-10 5-22 16-34-4 12-6 22-7 34z" fill="#9b6bf0"/>
      <ellipse cx="192" cy="206" rx="17" ry="4" fill="#5b2a8c"/>
      <path d="M193 186l1.5 3.5 3.5.5-2.6 2.4.7 3.6-3.1-1.8-3.1 1.8.7-3.6-2.6-2.4 3.5-.5z" fill="#ffcc4d"/>
      <circle cx="187" cy="198" r="1.3" fill="#ffe08a"/>
    </g>`,
  dh_emperor: () => `
    <g class="layer-dragon-head">
      <path d="M180 203c0-11 6-17 12-17s12 6 12 17z" fill="#c62828"/>
      <path d="M180 203q12-26 24 0M192 186v17" stroke="#ffcc4d" stroke-width="2.4" fill="none"/>
      <path d="M190.5 176h3v8h-3zM188 179h8v3h-8z" fill="#ffcc4d"/>
      <rect x="177" y="201" width="30" height="7" rx="3" fill="#ffcc4d"/>
      <circle cx="184" cy="204.5" r="1.8" fill="#59a9ff"/>
      <circle cx="192" cy="204.5" r="2.2" fill="#ff3b3b"/>
      <circle cx="200" cy="204.5" r="1.8" fill="#4ddb8b"/>
    </g>`,
};

// הצווארון יושב מתחת לסנטר, בחיבור בין הראש לגוף
const DRAGON_COLLAR = 'M175 238q19 10 38 0l1 6q-20 11-40 0z';

const DRAGON_NECKS = {
  dn_scarf: () => `
    <g class="layer-dragon-neck">
      <path d="${DRAGON_COLLAR}" fill="#e04848"/>
      <path d="M200 242l7 15-7 2-4-15z" fill="#c43636"/>
      <path d="M199 250l6-2M201 255l6-2" stroke="#ffd0d0" stroke-width="1.6" stroke-linecap="round"/>
      <path d="M180 241l3 2M189 244l3 1" stroke="#ffd0d0" stroke-width="1.6" stroke-linecap="round"/>
    </g>`,
  dn_bell: () => `
    <g class="layer-dragon-neck">
      <path d="${DRAGON_COLLAR}" fill="#8a5a33"/>
      <circle cx="194" cy="250" r="4.5" fill="#ffcc4d"/>
      <circle cx="192.5" cy="248.5" r="1.4" fill="#fff3c4"/>
      <path d="M191 251.5h6" stroke="#b8820c" stroke-width="1.4" stroke-linecap="round"/>
    </g>`,
  dn_medal: () => `
    <g class="layer-dragon-neck">
      <path d="${DRAGON_COLLAR}" fill="#3f8ddb"/>
      <path d="M190 245l4 6 4-6z" fill="#2a6ab0"/>
      <circle cx="194" cy="254" r="6" fill="#ffcc4d"/>
      <circle cx="194" cy="254" r="4.2" fill="#e0a213"/>
      <path d="M194 250.5l1 2.3 2.4.2-1.8 1.6.5 2.4-2.1-1.3-2.1 1.3.5-2.4-1.8-1.6 2.4-.2z" fill="#fff3c4"/>
    </g>`,
  dn_gem: () => `
    <g class="layer-dragon-neck">
      <path d="M176 239q18 10 36 0" stroke="#ffcc4d" stroke-width="2.6" fill="none" stroke-linecap="round" stroke-dasharray="3 1.5"/>
      <path d="M194 244l6 6-6 8-6-8z" fill="#5ee0dc"/>
      <path d="M194 244l6 6h-12z" fill="#c9fffc"/>
      <path d="M194 244l6 6-6 8-6-8z" fill="none" stroke="#e0a213" stroke-width="1.4" stroke-linejoin="round"/>
    </g>`,
};

/* ============================ שיקויים לדרקון ============================ */
// כל שיקוי משנה את צבעי העור של הדרקון (במקום צבע השחקן), מוסיף מרקם על הגוף
// ו"כוח" קטן שמופיע סביבו. mark = צורת המרקם סביב (0,0), power = הכוח בקואורדינטות הדרקונון.

const snowflake = (x, y, r = 5) => `<path d="M${x - r} ${y}h${r * 2}M${x} ${y - r}v${r * 2}M${x - r * 0.7} ${y - r * 0.7}l${r * 1.4} ${r * 1.4}M${x + r * 0.7} ${y - r * 0.7}l-${r * 1.4} ${r * 1.4}" stroke="#e8f9ff" stroke-width="1.8" stroke-linecap="round"/>`;
const leaf = (x, y, rot, fill) => `<path transform="translate(${x} ${y}) rotate(${rot})" d="M-5 4c0-6 4-10 10-10 0 6-4 10-10 10z" fill="${fill}"/>`;
const bolt = (x, y, fill) => `<path transform="translate(${x} ${y})" d="M-1-8h6l-3 6h4l-8 10 2-7h-4z" fill="${fill}"/>`;

const DRAGON_SKINS = {
  p_fire: {
    liquid: '#ff6a2b', body: '#e8521f', belly: '#ffcf6b', dark: '#8c1f0a',
    mark: '<path d="M0 7c-5-2-6-8-2-13 0 3 2 4 3 4 1-3 0-5-1-7 5 2 7 8 5 12-1 2-3 4-5 4z" fill="#a8260f" opacity=".75"/>',
    power: `
      <path d="M184 232c-6-5-14-6-21-2 4 1 6 3 6 5-4 0-8 2-9 6 9 2 17 0 24-6z" fill="#ff8a3d"/>
      <path d="M183 233c-4-2-9-2-13 0 3 1 4 2 4 3-3 1-5 2-5 4 6 1 11-1 14-4z" fill="#ffd36b"/>`,
    symbol: '<path d="M30 62c-6-2-8-8-3-14 0 4 2 5 4 5 1-4 0-6-1-9 7 3 9 10 6 15-1 2-3 3-6 3z" fill="#ffe08a"/>',
  },
  p_ice: {
    liquid: '#69c8ff', body: '#8fd8f5', belly: '#f2fbff', dark: '#2f7fae',
    mark: starPath(0, 0, 2.4, '#ffffff'),
    power: snowflake(168, 206) + snowflake(224, 198, 4) + snowflake(164, 250, 4),
    symbol: snowflake(30, 52, 7),
  },
  p_forest: {
    liquid: '#4ddb8b', body: '#3fae62', belly: '#c9f5c0', dark: '#1f5e33',
    mark: '<path d="M-5 4c0-6 4-10 10-10 0 6-4 10-10 10z" fill="#1f6e3a" opacity=".8"/>',
    power: leaf(166, 214, -20, '#7ee0a3') + leaf(226, 204, 30, '#a8f0c0') + leaf(170, 256, 10, '#7ee0a3'),
    symbol: '<path transform="translate(30 53)" d="M-8 7c0-10 7-16 16-16 0 10-7 16-16 16z" fill="#e8ffef"/>',
  },
  p_storm: {
    liquid: '#9b6bf0', body: '#6a4bc4', belly: '#d9ccff', dark: '#2e1f66',
    mark: bolt(0, 0, '#ffe066'),
    power: bolt(168, 204, '#ffe066') + bolt(226, 196, '#ffe066') + bolt(230, 246, '#fff3a0'),
    symbol: '<path d="M28 40h9l-5 9h6l-12 15 3-10h-6z" fill="#ffe066"/>',
  },
  p_gold: {
    liquid: '#ffcc4d', body: '#e8b020', belly: '#fff3c4', dark: '#8a6206',
    mark: '<path d="M-5 2a5 5 0 0 1 10 0" stroke="#fff3c4" stroke-width="2" fill="none" opacity=".85"/>',
    power: starPath(170, 212, 3, '#fff3c4') + starPath(222, 202, 3.5, '#fff3c4') + starPath(230, 252, 2.5, '#ffe08a'),
    symbol: starPath(30, 52, 5, '#fff8dc'),
  },
  p_shadow: {
    liquid: '#4b2a8c', body: '#35245e', belly: '#6d5a9e', dark: '#150d2e',
    mark: '<circle r="1.5" fill="#fff"/><circle cx="4" cy="3" r="1" fill="#f47fd0"/>',
    power: `
      <path d="M168 266c-8-6-6-16 4-18-4 6 0 11 4 14zM226 264c8-6 6-16-4-18 4 6 0 11-4 14z" fill="#9b6bf0" opacity=".7"/>
      <circle cx="185.5" cy="218" r="2.4" fill="#e0b3ff"/>
      <circle cx="198.5" cy="218" r="2.4" fill="#e0b3ff"/>`,
    symbol: '<path d="M34 42a11 11 0 1 0 6 19 9 9 0 1 1-6-19z" fill="#f2e6ff"/>',
  },
  p_cosmic: {
    liquid: '#3a2a9c', body: '#2b2f7a', belly: '#a9b8ff', dark: '#11143d',
    mark: starPath(0, 0, 1.6, '#ffffff') + '<circle cx="4" cy="4" r="1" fill="#9fe3ff"/>',
    power: starPath(168, 208, 3, '#fff3c4') + starPath(226, 200, 2.6, '#e8f9ff')
      + '<circle cx="230" cy="250" r="5" fill="#ff9d5c"/><ellipse cx="230" cy="250" rx="9" ry="2.5" fill="none" stroke="#ffe08a" stroke-width="1.4"/>',
    symbol: '<circle cx="30" cy="52" r="6" fill="#ff9d5c"/><ellipse cx="30" cy="52" rx="11" ry="3" fill="none" stroke="#ffe08a" stroke-width="1.6"/>'
      + starPath(20, 42, 1.6, '#fff') + starPath(40, 60, 1.4, '#fff'),
  },
};

/** ציור הבקבוק לחנות ולחדר הנשק */
const POTIONS = Object.fromEntries(Object.entries(DRAGON_SKINS).map(([id, s]) => [id, () => `
  <g class="layer-potion">
    <path d="M24 10h12v12c10 4 16 13 16 24 0 13-10 20-22 20S8 59 8 46c0-11 6-20 16-24z" fill="rgba(255,255,255,.14)"/>
    <path d="M10 42c6-3 14 3 20 0s14-3 20 0c2 13-7 22-20 22S8 55 10 42z" fill="${s.liquid}"/>
    <path d="M13 40c2-8 7-13 12-15" stroke="#fff" stroke-width="2.5" stroke-linecap="round" opacity=".5" fill="none"/>
    <path d="M24 10h12v12c10 4 16 13 16 24 0 13-10 20-22 20S8 59 8 46c0-11 6-20 16-24z" fill="none" stroke="#e8f0ff" stroke-width="2.5" stroke-linejoin="round"/>
    <rect x="21" y="4" width="18" height="8" rx="3" fill="#8a5a33"/>
    ${s.symbol}
  </g>`]));

const SLOT_SETS = {
  helmet: HELMETS,
  armor: ARMORS,
  weapon: WEAPONS,
  shield: SHIELDS,
  cape: CAPES,
  aura: AURAS,
  dragon_head: DRAGON_HEADS,
  dragon_neck: DRAGON_NECKS,
  dragon_skin: POTIONS,
};

/** מסגרת תצוגה מותאמת לכל סוג פריט, כדי שהתמונה בחנות לא תיחתך */
const ITEM_VIEWBOX = {
  helmet: '30 16 164 100',
  armor: '60 126 104 92',
  weapon: '26 52 56 162',
  shield: '134 106 72 102',
  cape: '44 124 136 122',
  aura: '2 38 220 224',
  dragon_head: '172 170 40 42',
  dragon_neck: '170 232 48 30',
  dragon_skin: '2 0 56 70',
};

/**
 * מזהה ייחודי לכל SVG שמצויר.
 * חובה: בדף אחד יש כמה ציורים (דמות, פריטי חנות, חדר הנשק), ואם לכולם יהיה
 * אותו מזהה גרדיאנט - הדפדפן יקשר את כולם לראשון, וחלקים שלמים בדמות ייעלמו.
 */
let svgSeq = 0;
const nextUid = () => `dw${++svgSeq}`;

/** קסדות האביר המלאות גבוהות יותר (נוצה למעלה, סנטר למטה) ולכן צריכות מסגרת משלהן */
const KNIGHT_HELM_VIEWBOX = '36 2 152 142';

/** ציור פריט בודד (לשימוש בחנות ובחדר הנשק) */
export function itemArt(slot, id, color = '#59a9ff') {
  const set = SLOT_SETS[slot];
  if (!set || !set[id]) return '';
  const box = (id.startsWith('h_knight') ? KNIGHT_HELM_VIEWBOX : ITEM_VIEWBOX[slot]) || '0 0 240 300';
  const uid = nextUid();
  return `<svg viewBox="${box}" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">${defs(color, uid)}${set[id](color, uid)}</svg>`;
}

/* ============================ הדרקון ============================ */

export const DRAGON_STAGES = ['ביצת דרקון', 'דרקונון', 'דרקון צעיר', 'דרקון אדיר'];

// נקודות המרקם: על הגוף והזנב, ועל הראש (הלחיים והקודקוד - לא על העיניים)
const SKIN_BODY_POINTS = [[178, 250], [214, 250], [184, 264], [208, 264], [226, 234], [221, 258], [196, 263]];
const SKIN_HEAD_POINTS = [[176, 223], [208, 223], [186, 208], [199, 207]];

/** שכבת מרקם של שיקוי, חתוכה לצורה (clipId) */
function skinMarks(skin, points, clipId) {
  if (!skin) return '';
  return `<g clip-path="url(#${clipId})">${points.map(([x, y]) => `<g transform="translate(${x} ${y})">${skin.mark}</g>`).join('')}</g>`;
}

/**
 * gear = { head, neck } - מחרוזות SVG של אביזרי הדרקון (או ריק)
 * skinId = שיקוי פעיל (מזהה מ-DRAGON_SKINS), uid = מזהה ייחודי ל-clipPath
 */
function dragon(stage, c, gear = {}, skinId = null, uid = 'd') {
  const skin = DRAGON_SKINS[skinId] || null;
  const body = skin ? skin.body : shade(c, -0.05);
  const belly = skin ? skin.belly : shade(c, 0.45);
  const dark = skin ? skin.dark : shade(c, -0.45);
  const head = gear.head || '';
  const neck = gear.neck || '';
  const clipBody = `dskinBody-${uid}`;
  const clipHead = `dskinHead-${uid}`;

  if (stage <= 0) {
    // על הביצה: הכובע יושב על הקודקוד והצווארון נהיה סרט סביב הביצה
    return `
      <g class="layer-dragon">
        ${skin ? `<defs><clipPath id="${clipBody}"><ellipse cx="196" cy="242" rx="24" ry="30"/></clipPath></defs>` : ''}
        <ellipse cx="196" cy="268" rx="26" ry="7" fill="rgba(0,0,0,.3)"/>
        <ellipse cx="196" cy="242" rx="24" ry="30" fill="${belly}"/>
        <path d="M196 212c-13 0-24 13-24 30s11 30 24 30z" fill="${body}" opacity=".6"/>
        ${skinMarks(skin, [...SKIN_BODY_POINTS, ...SKIN_HEAD_POINTS], clipBody)}
        <path d="M180 236l6-8 6 8 6-8 6 8" stroke="${dark}" stroke-width="3" fill="none" stroke-linecap="round"/>
        <path d="M180 254l6-8 6 8 6-8 6 8" stroke="${dark}" stroke-width="3" fill="none" stroke-linecap="round"/>
        ${neck ? `<g transform="translate(2 0)">${neck}</g>` : ''}
        ${head ? `<g transform="translate(4 8)">${head}</g>` : ''}
      </g>`;
  }

  const scale = stage === 1 ? 1 : stage === 2 ? 1.25 : 1.5;
  const wings = stage >= 2;
  const horns = stage >= 3;

  return `
    <g class="layer-dragon" transform="translate(196 268) scale(${scale}) translate(-196 -268)">
      ${skin ? `<defs>
        <clipPath id="${clipBody}"><path d="M214 258c14-4 24-16 22-30-8 10-16 12-24 10z"/><ellipse cx="196" cy="250" rx="24" ry="22"/></clipPath>
        <clipPath id="${clipHead}"><ellipse cx="192" cy="222" rx="21" ry="19"/></clipPath>
      </defs>` : ''}
      <ellipse cx="196" cy="270" rx="28" ry="7" fill="rgba(0,0,0,.3)"/>
      ${wings ? `<path d="M186 226c-22-22-40-24-52-18 12 6 16 16 14 28 14 8 30 4 38-10z" fill="${dark}"/>` : ''}
      <path d="M214 258c14-4 24-16 22-30-8 10-16 12-24 10z" fill="${body}"/>
      <ellipse cx="196" cy="250" rx="24" ry="22" fill="${body}"/>
      <ellipse cx="196" cy="256" rx="15" ry="14" fill="${belly}"/>
      ${skinMarks(skin, SKIN_BODY_POINTS, clipBody)}
      <path d="M182 268l-4 10h8zM210 268l4 10h-8z" fill="${dark}"/>
      ${neck}
      <ellipse cx="192" cy="222" rx="21" ry="19" fill="${body}"/>
      ${skinMarks(skin, SKIN_HEAD_POINTS, clipHead)}
      ${horns ? `<path d="M180 206l-6-14 12 8zM204 206l6-14-12 8z" fill="${dark}"/>` : ''}
      <path d="M180 206c-6-8-12-8-16-4 6 1 8 5 8 10z" fill="${dark}"/>
      <path d="M204 206c6-8 12-8 16-4-6 1-8 5-8 10z" fill="${dark}"/>
      <path d="M188 204l4-9 4 9" stroke="${dark}" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
      <circle cx="185" cy="217" r="4.5" fill="#fff"/>
      <circle cx="185.5" cy="218" r="2.4" fill="#231436"/>
      <circle cx="199" cy="217" r="4.5" fill="#fff"/>
      <circle cx="198.5" cy="218" r="2.4" fill="#231436"/>
      <!-- החוטם במרכז הפנים, בדיוק בין העיניים -->
      <ellipse cx="192" cy="229" rx="11" ry="7.5" fill="${belly}"/>
      <circle cx="188.5" cy="227" r="1.3" fill="${dark}"/>
      <circle cx="195.5" cy="227" r="1.3" fill="${dark}"/>
      <path d="M186 231.5c4 3 8 3 12 0" stroke="${dark}" stroke-width="2.2" fill="none" stroke-linecap="round"/>
      ${skin ? `<g class="dragon-power">${skin.power}</g>` : ''}
      ${head}
    </g>`;
}

/* ============================ הרכבת הדמות ============================ */

function defs(c, uid) {
  return `
    <defs>
      <linearGradient id="tunicG-${uid}" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="${shade(c, 0.28)}"/>
        <stop offset="100%" stop-color="${shade(c, -0.22)}"/>
      </linearGradient>
      ${[['auraFire', '#ff9d3d', '#ffdf8a'], ['auraLeaf', '#4ddb8b', '#d6ffe8'],
    ['auraIce', '#69c8ff', '#e8f9ff'], ['auraStorm', '#b57bff', '#ffe08a'], ['auraStar', '#ffcc4d', '#fff3c4'],
    ['auraEternal', '#e0b3ff', '#9fe3ff']].map(([id, mid, out]) => `
      <radialGradient id="${id}-${uid}" cx="50%" cy="50%" r="50%">
        <stop offset="55%" stop-color="${mid}" stop-opacity="0"/>
        <stop offset="85%" stop-color="${mid}" stop-opacity=".45"/>
        <stop offset="100%" stop-color="${out}" stop-opacity="0"/>
      </radialGradient>`).join('')}
    </defs>`;
}

function baseBody(c, uid) {
  const skin = '#f2c79b';
  const skinDark = '#d9a678';
  return `
    <g class="layer-body">
      <ellipse cx="112" cy="286" rx="64" ry="10" fill="rgba(0,0,0,.35)"/>
      <rect x="90" y="206" width="21" height="58" rx="10" fill="#4a3826"/>
      <rect x="117" y="206" width="21" height="58" rx="10" fill="#4a3826"/>
      <rect x="84" y="252" width="30" height="20" rx="8" fill="#33241a"/>
      <rect x="114" y="252" width="30" height="20" rx="8" fill="#33241a"/>
      <path d="M112 126c-19 0-32 9-37 24l-8 44c-2 11 5 18 16 18h58c11 0 18-7 16-18l-8-44c-5-15-18-24-37-24z" fill="url(#tunicG-${uid})"/>
      <rect x="70" y="182" width="84" height="12" rx="6" fill="${shade(c, -0.5)}"/>
      <rect x="102" y="180" width="20" height="16" rx="5" fill="#e8c27a"/>
      <rect x="58" y="138" width="19" height="62" rx="9" fill="${shade(c, -0.1)}" transform="rotate(10 67 169)"/>
      <rect x="147" y="138" width="19" height="62" rx="9" fill="${shade(c, -0.1)}" transform="rotate(-10 157 169)"/>
      <circle cx="56" cy="198" r="11" fill="${skin}"/>
      <circle cx="170" cy="198" r="11" fill="${skin}"/>
      <circle cx="112" cy="92" r="39" fill="${skin}"/>
      <path d="M112 53c-22 0-38 15-39 34 6-7 14-10 22-8 6-8 20-11 34-6 8 3 14 8 22 13-1-19-17-33-39-33z" fill="#4b3420"/>
      <ellipse cx="98" cy="94" rx="6" ry="7" fill="#fff"/>
      <circle cx="99" cy="95" r="3.4" fill="#2a1a3d"/>
      <ellipse cx="126" cy="94" rx="6" ry="7" fill="#fff"/>
      <circle cx="127" cy="95" r="3.4" fill="#2a1a3d"/>
      <circle cx="90" cy="108" r="6" fill="${skinDark}" opacity=".5"/>
      <circle cx="134" cy="108" r="6" fill="${skinDark}" opacity=".5"/>
      <path d="M103 110c5 5 13 5 18 0" stroke="#8a5a3a" stroke-width="3.2" fill="none" stroke-linecap="round"/>
    </g>`;
}

/**
 * ציור הדמות המלאה.
 * @param {object} opts { color, equipped:{slot:id}, dragonStage, showDragon, name }
 */
export function renderAvatar(opts = {}) {
  const c = opts.color || '#59a9ff';
  const eq = opts.equipped || {};
  const stage = Number(opts.dragonStage) || 0;
  const showDragon = opts.showDragon !== false;
  const uid = nextUid();

  const part = (slot) => {
    const id = eq[slot];
    const set = SLOT_SETS[slot];
    return id && set && set[id] ? set[id](c, uid) : '';
  };

  return `
<svg viewBox="0 0 240 300" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${esc(opts.name || 'הלוחם')}">
  ${defs(c, uid)}
  ${part('aura')}
  ${part('cape')}
  ${baseBody(c, uid)}
  ${part('armor')}
  ${part('helmet')}
  ${part('shield')}
  ${part('weapon')}
  ${showDragon ? dragon(stage, c, { head: part('dragon_head'), neck: part('dragon_neck') }, eq.dragon_skin, uid) : ''}
</svg>`;
}

/** הצבת הדמות בתוך אלמנט */
export function mountAvatar(el, opts) {
  if (!el) return;
  el.innerHTML = renderAvatar(opts);
}
