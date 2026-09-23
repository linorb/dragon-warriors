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

// הקסדה יושבת מעל גובה העיניים, ומגני הלחיים יורדים רק בצדדים - כדי שהפנים יישארו גלויות
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
};

// כל השריונות בנויים על אותו קו מתאר, שעוטף בדיוק את הטוניקה של הגוף (baseBody)
// כדי שהשריון ישב על הדמות ולא תבצבץ מתחתיו הטוניקה בצדדים או למטה.
// החזה מתחיל מתחת לסנטר, והחצאית מכסה את החגורה ונגמרת בגובה תחתית הטוניקה.
const ARMOR_TORSO = 'M112 131c-20 0-33 6-38 18l-7 33h90l-7-33c-5-12-18-18-38-18z';
const ARMOR_TORSO_LIGHT = 'M112 131c-20 0-33 6-38 18l-7 33h14l6-30c3-11 12-19 25-21z';
const ARMOR_SKIRT = 'M68 182h88l2 12c2 11-5 19-16 19H82c-11 0-18-8-16-19z';

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

const SLOT_SETS = {
  helmet: HELMETS,
  armor: ARMORS,
  weapon: WEAPONS,
  shield: SHIELDS,
  cape: CAPES,
  aura: AURAS,
  dragon_head: DRAGON_HEADS,
  dragon_neck: DRAGON_NECKS,
};

/** מסגרת תצוגה מותאמת לכל סוג פריט, כדי שהתמונה בחנות לא תיחתך */
const ITEM_VIEWBOX = {
  helmet: '30 40 164 76',
  armor: '60 126 104 92',
  weapon: '26 74 56 140',
  shield: '134 106 72 102',
  cape: '44 124 136 122',
  aura: '2 38 220 224',
  dragon_head: '172 170 40 42',
  dragon_neck: '170 232 48 30',
};

/**
 * מזהה ייחודי לכל SVG שמצויר.
 * חובה: בדף אחד יש כמה ציורים (דמות, פריטי חנות, חדר הנשק), ואם לכולם יהיה
 * אותו מזהה גרדיאנט - הדפדפן יקשר את כולם לראשון, וחלקים שלמים בדמות ייעלמו.
 */
let svgSeq = 0;
const nextUid = () => `dw${++svgSeq}`;

/** ציור פריט בודד (לשימוש בחנות ובחדר הנשק) */
export function itemArt(slot, id, color = '#59a9ff') {
  const set = SLOT_SETS[slot];
  if (!set || !set[id]) return '';
  const box = ITEM_VIEWBOX[slot] || '0 0 240 300';
  const uid = nextUid();
  return `<svg viewBox="${box}" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">${defs(color, uid)}${set[id](color, uid)}</svg>`;
}

/* ============================ הדרקון ============================ */

export const DRAGON_STAGES = ['ביצת דרקון', 'דרקונון', 'דרקון צעיר', 'דרקון אדיר'];

/** gear = { head, neck } - מחרוזות SVG של אביזרי הדרקון (או ריק) */
function dragon(stage, c, gear = {}) {
  const body = shade(c, -0.05);
  const belly = shade(c, 0.45);
  const dark = shade(c, -0.45);
  const head = gear.head || '';
  const neck = gear.neck || '';

  if (stage <= 0) {
    // על הביצה: הכובע יושב על הקודקוד והצווארון נהיה סרט סביב הביצה
    return `
      <g class="layer-dragon">
        <ellipse cx="196" cy="268" rx="26" ry="7" fill="rgba(0,0,0,.3)"/>
        <ellipse cx="196" cy="242" rx="24" ry="30" fill="${belly}"/>
        <path d="M196 212c-13 0-24 13-24 30s11 30 24 30z" fill="${body}" opacity=".6"/>
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
      <ellipse cx="196" cy="270" rx="28" ry="7" fill="rgba(0,0,0,.3)"/>
      ${wings ? `<path d="M186 226c-22-22-40-24-52-18 12 6 16 16 14 28 14 8 30 4 38-10z" fill="${dark}"/>` : ''}
      <path d="M214 258c14-4 24-16 22-30-8 10-16 12-24 10z" fill="${body}"/>
      <ellipse cx="196" cy="250" rx="24" ry="22" fill="${body}"/>
      <ellipse cx="196" cy="256" rx="15" ry="14" fill="${belly}"/>
      <path d="M182 268l-4 10h8zM210 268l4 10h-8z" fill="${dark}"/>
      ${neck}
      <ellipse cx="192" cy="222" rx="21" ry="19" fill="${body}"/>
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
    ['auraIce', '#69c8ff', '#e8f9ff'], ['auraStorm', '#b57bff', '#ffe08a']].map(([id, mid, out]) => `
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
  ${showDragon ? dragon(stage, c, { head: part('dragon_head'), neck: part('dragon_neck') }) : ''}
</svg>`;
}

/** הצבת הדמות בתוך אלמנט */
export function mountAvatar(el, opts) {
  if (!el) return;
  el.innerHTML = renderAvatar(opts);
}
