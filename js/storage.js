// storage.js - שמירת התקדמות ב-localStorage, כולל גרסאות, מיגרציה וגיבוי

const STORAGE_KEY = 'dragonWarriors.save.v1';
export const CURRENT_SCHEMA_VERSION = 1;

/** האם ה-localStorage זמין בפועל (יכול להיחסם במצב פרטי / הגדרות דפדפן) */
let storageAvailable = detectStorage();
/** עותק בזיכרון - מאפשר למשחק לעבוד גם כשאין אחסון */
let state = null;

function detectStorage() {
  try {
    const k = '__dw_test__';
    window.localStorage.setItem(k, '1');
    window.localStorage.removeItem(k);
    return true;
  } catch (e) {
    return false;
  }
}

export function isStorageAvailable() {
  return storageAvailable;
}

export function defaultSave() {
  return {
    schemaVersion: CURRENT_SCHEMA_VERSION,
    createdAt: new Date().toISOString(),
    player: {
      name: '',
      dragonName: '',
      color: '#59a9ff',
      coins: 0,
      xp: 0,
    },
    dragon: {
      stage: 0, // 0=ביצה 1=בקיעה 2=דרקון צעיר 3=דרקון גדול (שלב 2 של הפיתוח)
    },
    inventory: {
      owned: [],
      equipped: {
        helmet: null,
        armor: null,
        weapon: null,
        shield: null,
        cape: null,
        aura: null,
        dragon_head: null,
        dragon_neck: null,
        dragon_skin: null,
      },
    },
    stats: {
      sessions: 0,
      lastPlayed: null,     // מפתח יום "2026-09-22"
      streakDays: 0,
      bestStreakDays: 0,
      perfectBattles: 0,
      totals: { correct: 0, firstTry: 0, wrong: 0, answered: 0 },
      byTopic: {},          // topicId -> { correct, firstTry, wrong, answered }
    },
    reviewQueue: [],        // [{ type, topic, addedAt }]
    records: {
      lightningBest: 0,
      lightningBestEasy: 0,
      shapeCollection: {},   // סוג שאלה -> רשימת הצורות שנמצאו, למשל { geo_rect_area: ['3 × 6'] }
    },
    settings: { readAloud: true },
  };
}

/** מיזוג ערכי ברירת מחדל לתוך אובייקט קיים - כך שתוספות עתידיות לא ישברו שמירות ישנות */
function mergeDefaults(target, defaults) {
  if (target === null || typeof target !== 'object' || Array.isArray(target)) {
    return target === undefined ? defaults : target;
  }
  const out = Array.isArray(defaults) ? target : { ...defaults, ...target };
  for (const key of Object.keys(defaults)) {
    const d = defaults[key];
    if (d && typeof d === 'object' && !Array.isArray(d)) {
      out[key] = mergeDefaults(target[key], d);
    } else if (target[key] === undefined) {
      out[key] = d;
    }
  }
  return out;
}

/**
 * מיגרציה של שמירה ישנה לגרסה הנוכחית.
 * כל שלב מטפל במעבר מגרסה אחת לבאה, וכך התקדמות קיימת לא נמחקת בעדכונים.
 */
export function migrate(raw) {
  if (!raw || typeof raw !== 'object') return defaultSave();
  let data = { ...raw };
  let v = Number(data.schemaVersion) || 0;

  if (v < 1) {
    // גרסה 0 (לפני שדה הגרסה) -> 1
    data.schemaVersion = 1;
    v = 1;
  }

  // דוגמה לשלב עתידי:
  // if (v < 2) { data.someNewField = ...; data.schemaVersion = 2; v = 2; }

  data.schemaVersion = CURRENT_SCHEMA_VERSION;
  data = mergeDefaults(data, defaultSave());

  // ניקוי בסיסי של ערכים לא תקינים
  const p = data.player;
  p.coins = Math.max(0, Math.floor(Number(p.coins) || 0));
  p.xp = Math.max(0, Math.floor(Number(p.xp) || 0));
  if (typeof p.name !== 'string') p.name = '';
  if (typeof p.dragonName !== 'string') p.dragonName = '';
  if (!Array.isArray(data.inventory.owned)) data.inventory.owned = [];
  if (!Array.isArray(data.reviewQueue)) data.reviewQueue = [];

  return data;
}

/** טעינה מהאחסון. תמיד מחזירה אובייקט תקין, גם כשאין שמירה כלל */
export function load() {
  if (state) return state;
  let parsed = null;
  try {
    if (storageAvailable) {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) parsed = JSON.parse(raw);
    }
  } catch (e) {
    console.warn('[storage] טעינה נכשלה, מתחילים שמירה חדשה', e);
    parsed = null;
  }
  state = migrate(parsed);
  return state;
}

/** שמירה. מחזירה true אם נשמר בהצלחה לדיסק */
export function save() {
  if (!state) return false;
  try {
    if (!storageAvailable) return false;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    return true;
  } catch (e) {
    console.warn('[storage] שמירה נכשלה', e);
    storageAvailable = false;
    return false;
  }
}

/** עדכון + שמירה מיידית (נקרא אחרי כל שאלה) */
export function update(fn) {
  const s = load();
  fn(s);
  save();
  return s;
}

export function getState() {
  return load();
}

/** האם כבר נוצר לוחם */
export function hasProfile() {
  const s = load();
  return Boolean(s.player.name);
}

export function resetAll() {
  state = defaultSave();
  try {
    if (storageAvailable) window.localStorage.removeItem(STORAGE_KEY);
  } catch (e) {
    console.warn('[storage] איפוס נכשל', e);
  }
  save();
  return state;
}

/** ייצוא כטקסט JSON */
export function exportText() {
  return JSON.stringify(load(), null, 2);
}

/** ייבוא מטקסט. מחזיר { ok, error } */
export function importText(text) {
  let obj;
  try {
    obj = JSON.parse(text);
  } catch (e) {
    return { ok: false, error: 'הטקסט אינו קובץ גיבוי תקין.' };
  }
  if (!obj || typeof obj !== 'object' || !obj.player) {
    return { ok: false, error: 'הקובץ אינו נראה כמו גיבוי של לוחמי דרקונים.' };
  }
  state = migrate(obj);
  save();
  return { ok: true };
}

/** הורדת קובץ גיבוי */
export function downloadBackup() {
  const s = load();
  const name = (s.player.name || 'לוחם').replace(/[^\p{L}\p{N}_-]/gu, '');
  const stamp = new Date().toISOString().slice(0, 10);
  const blob = new Blob([exportText()], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `dragon-warriors-${name}-${stamp}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
