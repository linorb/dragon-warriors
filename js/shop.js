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
  { id: 'h_iron', slot: 'helmet', name: 'קסדת ברזל', tier: 'common', price: 40, minRank: 0 },
  { id: 'h_wing', slot: 'helmet', name: 'קסדת הכנפיים', tier: 'rare', price: 130, minRank: 1 },

  { id: 'a_leather', slot: 'armor', name: 'שריון עור', tier: 'common', price: 45, minRank: 0 },
  { id: 'a_steel', slot: 'armor', name: 'שריון פלדה', tier: 'rare', price: 140, minRank: 1 },

  { id: 'w_sword', slot: 'weapon', name: 'חרב ברונזה', tier: 'common', price: 50, minRank: 0 },
  { id: 'w_axe', slot: 'weapon', name: 'גרזן הקרב', tier: 'common', price: 80, minRank: 0 },
  { id: 'w_flame', slot: 'weapon', name: 'חרב הלהבה', tier: 'epic', price: 220, minRank: 2 },

  { id: 's_wood', slot: 'shield', name: 'מגן עץ', tier: 'common', price: 40, minRank: 0 },
  { id: 's_dragon', slot: 'shield', name: 'מגן הדרקון', tier: 'epic', price: 210, minRank: 2 },

  { id: 'c_grey', slot: 'cape', name: 'גלימה אפורה', tier: 'common', price: 35, minRank: 0 },
  { id: 'c_night', slot: 'cape', name: 'גלימת הלילה', tier: 'rare', price: 120, minRank: 1 },

  { id: 'au_fire', slot: 'aura', name: 'הילת האש', tier: 'legend', price: 400, minRank: 3 },
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
