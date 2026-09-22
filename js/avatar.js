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

const HELMETS = {
  h_iron: () => `
    <g class="layer-helmet">
      <path d="M112 52c-27 0-44 19-44 42v10h88V94c0-23-17-42-44-42z" fill="#9aa5b1"/>
      <path d="M112 52c-27 0-44 19-44 42v10h14V94c0-19 12-33 30-33z" fill="#c3ccd6"/>
      <rect x="106" y="60" width="12" height="46" rx="6" fill="#7b8794"/>
      <rect x="66" y="100" width="92" height="9" rx="4" fill="#6b7682"/>
    </g>`,
  h_wing: (c) => `
    <g class="layer-helmet">
      <path d="M112 50c-28 0-45 20-45 44v9h90v-9c0-24-17-44-45-44z" fill="${shade(c, -0.15)}"/>
      <path d="M112 50c-28 0-45 20-45 44v9h13v-9c0-20 13-35 32-35z" fill="${shade(c, 0.35)}"/>
      <rect x="105" y="58" width="14" height="48" rx="7" fill="${shade(c, -0.4)}"/>
      <path d="M67 84c-16-10-28-8-34-2 10 2 12 6 10 12 10 4 20 2 26-4z" fill="#f2f5ff"/>
      <path d="M157 84c16-10 28-8 34-2-10 2-12 6-10 12-10 4-20 2-26-4z" fill="#f2f5ff"/>
      <rect x="65" y="99" width="94" height="9" rx="4" fill="${shade(c, -0.45)}"/>
    </g>`,
};

const ARMORS = {
  a_leather: () => `
    <g class="layer-armor">
      <path d="M112 132c-16 0-27 5-33 12l-4 30h74l-4-30c-6-7-17-12-33-12z" fill="#8a5a33"/>
      <path d="M78 176h68l3 22H75z" fill="#71472a"/>
      <circle cx="112" cy="156" r="9" fill="#d4a24c"/>
    </g>`,
  a_steel: () => `
    <g class="layer-armor">
      <path d="M112 130c-18 0-30 6-36 14l-5 34h82l-5-34c-6-8-18-14-36-14z" fill="#b9c4d0"/>
      <path d="M112 130c-18 0-30 6-36 14l-5 34h16l3-30c3-10 11-16 22-17z" fill="#e2e9f1"/>
      <path d="M76 180h72l3 20H73z" fill="#93a0ad"/>
      <path d="M112 142l12 14-12 16-12-16z" fill="#6f7d8c"/>
    </g>`,
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
};

const AURAS = {
  au_fire: () => `
    <g class="layer-aura" opacity="0.9">
      <ellipse cx="112" cy="170" rx="104" ry="126" fill="url(#auraFire)"/>
      <ellipse cx="112" cy="170" rx="100" ry="122" fill="none" stroke="#ffb648" stroke-opacity=".45" stroke-width="4"/>
      <g fill="#ffb648" opacity=".8">
        <path d="M24 250c6-14 4-26-2-34 14 4 22 16 20 34z"/>
        <path d="M200 250c-6-14-4-26 2-34-14 4-22 16-20 34z"/>
        <path d="M112 34c6-12 4-22-2-30 14 4 22 14 20 30z"/>
        <path d="M12 130c10-8 14-18 12-28 12 10 14 24 4 34z"/>
        <path d="M212 130c-10-8-14-18-12-28-12 10-14 24-4 34z"/>
      </g>
    </g>`,
};

const SLOT_SETS = {
  helmet: HELMETS,
  armor: ARMORS,
  weapon: WEAPONS,
  shield: SHIELDS,
  cape: CAPES,
  aura: AURAS,
};

/** מסגרת תצוגה מותאמת לכל סוג פריט, כדי שהתמונה בחנות לא תיחתך */
const ITEM_VIEWBOX = {
  helmet: '30 40 164 76',
  armor: '62 122 100 84',
  weapon: '26 74 56 140',
  shield: '134 106 72 102',
  cape: '44 124 136 122',
  aura: '2 38 220 224',
};

/** ציור פריט בודד (לשימוש בחנות ובחדר הנשק) */
export function itemArt(slot, id, color = '#59a9ff') {
  const set = SLOT_SETS[slot];
  if (!set || !set[id]) return '';
  const box = ITEM_VIEWBOX[slot] || '0 0 240 300';
  return `<svg viewBox="${box}" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">${defs(color)}${set[id](color)}</svg>`;
}

/* ============================ הדרקון ============================ */

export const DRAGON_STAGES = ['ביצת דרקון', 'דרקונון', 'דרקון צעיר', 'דרקון אדיר'];

function dragon(stage, c) {
  const body = shade(c, -0.05);
  const belly = shade(c, 0.45);
  const dark = shade(c, -0.45);

  if (stage <= 0) {
    return `
      <g class="layer-dragon">
        <ellipse cx="196" cy="268" rx="26" ry="7" fill="rgba(0,0,0,.3)"/>
        <ellipse cx="196" cy="242" rx="24" ry="30" fill="${belly}"/>
        <path d="M196 212c-13 0-24 13-24 30s11 30 24 30z" fill="${body}" opacity=".6"/>
        <path d="M180 236l6-8 6 8 6-8 6 8" stroke="${dark}" stroke-width="3" fill="none" stroke-linecap="round"/>
        <path d="M180 254l6-8 6 8 6-8 6 8" stroke="${dark}" stroke-width="3" fill="none" stroke-linecap="round"/>
      </g>`;
  }

  const scale = stage === 1 ? 1 : stage === 2 ? 1.25 : 1.5;
  const wings = stage >= 2;
  const horns = stage >= 3;

  return `
    <g class="layer-dragon" transform="translate(196 268) scale(${scale}) translate(-196 -268)">
      <ellipse cx="196" cy="270" rx="28" ry="7" fill="rgba(0,0,0,.3)"/>
      ${wings ? `<path d="M186 226c-22-22-40-24-52-18 12 6 16 16 14 28 14 8 30 4 38-10z" fill="${dark}"/>` : ''}
      <path d="M214 258c14-4 24-16 22-30-8 10-16 12-24 10z" fill="${body}"/>
      <ellipse cx="196" cy="250" rx="24" ry="22" fill="${body}"/>
      <ellipse cx="196" cy="256" rx="15" ry="14" fill="${belly}"/>
      <path d="M182 268l-4 10h8zM210 268l4 10h-8z" fill="${dark}"/>
      <ellipse cx="192" cy="222" rx="21" ry="19" fill="${body}"/>
      <ellipse cx="180" cy="226" rx="11" ry="8" fill="${belly}"/>
      ${horns ? `<path d="M180 206l-6-14 12 8zM204 206l6-14-12 8z" fill="${dark}"/>` : ''}
      <path d="M204 206c6-8 12-8 16-4-6 1-8 5-8 10z" fill="${dark}"/>
      <circle cx="186" cy="218" r="4.5" fill="#fff"/>
      <circle cx="185" cy="219" r="2.4" fill="#231436"/>
      <circle cx="199" cy="217" r="4.5" fill="#fff"/>
      <circle cx="198" cy="218" r="2.4" fill="#231436"/>
      <path d="M176 230c4 3 9 3 13 0" stroke="${dark}" stroke-width="2.4" fill="none" stroke-linecap="round"/>
      <path d="M192 196l4-10 4 10" stroke="${dark}" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
    </g>`;
}

/* ============================ הרכבת הדמות ============================ */

function defs(c) {
  return `
    <defs>
      <linearGradient id="tunicG" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="${shade(c, 0.28)}"/>
        <stop offset="100%" stop-color="${shade(c, -0.22)}"/>
      </linearGradient>
      <radialGradient id="auraFire" cx="50%" cy="50%" r="50%">
        <stop offset="55%" stop-color="#ff9d3d" stop-opacity="0"/>
        <stop offset="85%" stop-color="#ff9d3d" stop-opacity=".45"/>
        <stop offset="100%" stop-color="#ffdf8a" stop-opacity="0"/>
      </radialGradient>
    </defs>`;
}

function baseBody(c) {
  const skin = '#f2c79b';
  const skinDark = '#d9a678';
  return `
    <g class="layer-body">
      <ellipse cx="112" cy="286" rx="64" ry="10" fill="rgba(0,0,0,.35)"/>
      <rect x="90" y="206" width="21" height="58" rx="10" fill="#4a3826"/>
      <rect x="117" y="206" width="21" height="58" rx="10" fill="#4a3826"/>
      <rect x="84" y="252" width="30" height="20" rx="8" fill="#33241a"/>
      <rect x="114" y="252" width="30" height="20" rx="8" fill="#33241a"/>
      <path d="M112 126c-19 0-32 9-37 24l-8 44c-2 11 5 18 16 18h58c11 0 18-7 16-18l-8-44c-5-15-18-24-37-24z" fill="url(#tunicG)"/>
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

  const part = (slot) => {
    const id = eq[slot];
    const set = SLOT_SETS[slot];
    return id && set && set[id] ? set[id](c) : '';
  };

  return `
<svg viewBox="0 0 240 300" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${esc(opts.name || 'הלוחם')}">
  ${defs(c)}
  ${part('aura')}
  ${part('cape')}
  ${baseBody(c)}
  ${part('armor')}
  ${part('helmet')}
  ${part('shield')}
  ${part('weapon')}
  ${showDragon ? dragon(stage, c) : ''}
</svg>`;
}

/** הצבת הדמות בתוך אלמנט */
export function mountAvatar(el, opts) {
  if (!el) return;
  el.innerHTML = renderAvatar(opts);
}
