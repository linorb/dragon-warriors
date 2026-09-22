// shop.js - קטלוג הציוד, קנייה והצטיידות

import { getState, update } from './storage.js';
import { rankIndexFor, RANKS } from './progress.js';

export const TIERS = {
  common: { id: 'common', name: 'רגיל', cls: 'tier-common' },
  rare: { id: 'rare', name: 'נדיר', cls: 'tier-rare' },
  epic: { id: 'epic', name: 'אפי', cls: 'tier-epic' },
  legend: { id: 'legend', name: 'אגדי', cls: 'tier-legend' },
};

export const SLOTS = [
  { id: 'helmet', name: 'קסדה' },
  { id: 'armor', name: 'שריון' },
  { id: 'weapon', name: 'נשק' },
  { id: 'shield', name: 'מגן' },
  { id: 'cape', name: 'גלימה' },
  { id: 'aura', name: 'הילה' },
];

export const SLOT_NAMES = Object.fromEntries(SLOTS.map((s) => [s.id, s.name]));

/** minRank = אינדקס דרגה מינימלית (0=טירון, 1=לוחם, 2=אביר, 3=אלוף, 4=אגדה) */
export const CATALOG = [
  // --- קסדות ---
  { id: 'h_iron', slot: 'helmet', name: 'קסדת ברזל', tier: 'common', price: 40, minRank: 0 },
  { id: 'h_horn', slot: 'helmet', name: 'קסדת הקרניים', tier: 'rare', price: 120, minRank: 1 },
  { id: 'h_wing', slot: 'helmet', name: 'קסדת הכנפיים', tier: 'rare', price: 150, minRank: 1 },
  { id: 'h_dragon', slot: 'helmet', name: 'קסדת הדרקון', tier: 'epic', price: 260, minRank: 2 },
  { id: 'h_crown', slot: 'helmet', name: 'כתר האגדה', tier: 'legend', price: 520, minRank: 3 },

  // --- שריונות ---
  { id: 'a_leather', slot: 'armor', name: 'שריון עור', tier: 'common', price: 45, minRank: 0 },
  { id: 'a_forest', slot: 'armor', name: 'שריון היער', tier: 'common', price: 75, minRank: 0 },
  { id: 'a_steel', slot: 'armor', name: 'שריון פלדה', tier: 'rare', price: 140, minRank: 1 },
  { id: 'a_scale', slot: 'armor', name: 'שריון קשקשים', tier: 'epic', price: 250, minRank: 2 },
  { id: 'a_gold', slot: 'armor', name: 'שריון הזהב', tier: 'legend', price: 480, minRank: 3 },

  // --- נשקים ---
  { id: 'w_sword', slot: 'weapon', name: 'חרב ברונזה', tier: 'common', price: 50, minRank: 0 },
  { id: 'w_spear', slot: 'weapon', name: 'חנית הצייד', tier: 'common', price: 65, minRank: 0 },
  { id: 'w_axe', slot: 'weapon', name: 'גרזן הקרב', tier: 'common', price: 80, minRank: 0 },
  { id: 'w_hammer', slot: 'weapon', name: 'פטיש הרעם', tier: 'rare', price: 160, minRank: 1 },
  { id: 'w_ice', slot: 'weapon', name: 'חרב הקרח', tier: 'epic', price: 240, minRank: 2 },
  { id: 'w_flame', slot: 'weapon', name: 'חרב הלהבה', tier: 'epic', price: 260, minRank: 2 },
  { id: 'w_legend', slot: 'weapon', name: 'להב האגדה', tier: 'legend', price: 560, minRank: 3 },

  // --- מגנים ---
  { id: 's_wood', slot: 'shield', name: 'מגן עץ', tier: 'common', price: 40, minRank: 0 },
  { id: 's_round', slot: 'shield', name: 'מגן עגול', tier: 'common', price: 70, minRank: 0 },
  { id: 's_steel', slot: 'shield', name: 'מגן פלדה', tier: 'rare', price: 150, minRank: 1 },
  { id: 's_dragon', slot: 'shield', name: 'מגן הדרקון', tier: 'epic', price: 230, minRank: 2 },
  { id: 's_star', slot: 'shield', name: 'מגן הכוכב', tier: 'legend', price: 500, minRank: 3 },

  // --- גלימות ---
  { id: 'c_grey', slot: 'cape', name: 'גלימה אפורה', tier: 'common', price: 35, minRank: 0 },
  { id: 'c_leaf', slot: 'cape', name: 'גלימת היער', tier: 'common', price: 60, minRank: 0 },
  { id: 'c_night', slot: 'cape', name: 'גלימת הלילה', tier: 'rare', price: 130, minRank: 1 },
  { id: 'c_flame', slot: 'cape', name: 'גלימת האש', tier: 'epic', price: 240, minRank: 2 },
  { id: 'c_royal', slot: 'cape', name: 'גלימת המלכות', tier: 'legend', price: 540, minRank: 3 },

  // --- הילות ---
  { id: 'au_leaf', slot: 'aura', name: 'הילת הטבע', tier: 'rare', price: 180, minRank: 1 },
  { id: 'au_ice', slot: 'aura', name: 'הילת הקרח', tier: 'epic', price: 300, minRank: 2 },
  { id: 'au_fire', slot: 'aura', name: 'הילת האש', tier: 'epic', price: 320, minRank: 2 },
  { id: 'au_storm', slot: 'aura', name: 'הילת הסופה', tier: 'legend', price: 620, minRank: 4 },
];

export function itemById(id) {
  return CATALOG.find((i) => i.id === id) || null;
}

export function owns(id) {
  return getState().inventory.owned.includes(id);
}

export function ownedInSlot(slot) {
  const owned = getState().inventory.owned;
  return CATALOG.filter((i) => i.slot === slot && owned.includes(i.id));
}

/** האם ניתן לקנות עכשיו. מחזיר { ok, reason } */
export function canBuy(id) {
  const item = itemById(id);
  if (!item) return { ok: false, reason: 'הפריט לא נמצא.' };
  if (owns(id)) return { ok: false, reason: 'הפריט כבר שלך.' };
  const s = getState();
  if (rankIndexFor(s.player.xp) < item.minRank) {
    return { ok: false, reason: `צריך להגיע לדרגת ${RANKS[item.minRank].name}.` };
  }
  if (s.player.coins < item.price) {
    return { ok: false, reason: `חסרים ${item.price - s.player.coins} מטבעות.` };
  }
  return { ok: true };
}

/** קנייה. הפריט מצויד אוטומטית */
export function buy(id) {
  const check = canBuy(id);
  if (!check.ok) return check;
  const item = itemById(id);
  update((s) => {
    s.player.coins -= item.price;
    s.inventory.owned.push(item.id);
    s.inventory.equipped[item.slot] = item.id;
  });
  return { ok: true, item };
}

export function equip(slot, id) {
  update((s) => {
    if (id && !s.inventory.owned.includes(id)) return;
    s.inventory.equipped[slot] = id || null;
  });
}

export function equipped() {
  return { ...getState().inventory.equipped };
}
