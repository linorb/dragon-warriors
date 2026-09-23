// progress.js - מטבעות, נקודות ניסיון, דרגות, רצף ימים וסטטיסטיקה לפי נושא

import { update, getState } from './storage.js';
import { todayKey, daysBetweenKeys, clamp } from './util.js';

/* ============================ דרגות ============================ */

export const RANKS = [
  { id: 'rookie', name: 'טירון', xp: 0 },
  { id: 'fighter', name: 'לוחם', xp: 120 },
  { id: 'knight', name: 'אביר', xp: 400 },
  { id: 'champion', name: 'אלוף', xp: 900 },
  { id: 'legend', name: 'אגדה', xp: 1800 },
];

export function rankIndexFor(xp) {
  let idx = 0;
  for (let i = 0; i < RANKS.length; i++) if (xp >= RANKS[i].xp) idx = i;
  return idx;
}

export function rankFor(xp) {
  return RANKS[rankIndexFor(xp)];
}

export function nextRankFor(xp) {
  const i = rankIndexFor(xp);
  return i < RANKS.length - 1 ? RANKS[i + 1] : null;
}

/** שלב הדרקון נגזר מהדרגה: ביצה -> דרקונון -> צעיר -> אדיר */
export function dragonStageFor(xp) {
  return clamp(rankIndexFor(xp), 0, 3);
}

/* ============================ תגמולים ============================ */

export const REWARDS = {
  firstTry: 10,      // מטבעות על תשובה נכונה בניסיון ראשון
  secondTry: 5,      // חצי על ניסיון שני
  hintCost: 2,
  xpFirstTry: 12,
  xpSecondTry: 6,
  xpEffort: 3,       // גם מי שטעה פעמיים מקבל נקודות על המאמץ
  perfectBonus: 15,
  streakBonusPerDay: 3,
  streakBonusMax: 21,
};

export function coins() {
  return getState().player.coins;
}

export function addCoins(n) {
  update((s) => {
    s.player.coins = Math.max(0, s.player.coins + n);
  });
  return coins();
}

/** הוספת נקודות ניסיון. מחזירה מידע על עליית דרגה */
export function addXp(n) {
  const before = getState().player.xp;
  let after = before;
  update((s) => {
    s.player.xp += n;
    after = s.player.xp;
    s.dragon.stage = dragonStageFor(after);
  });
  const oldIdx = rankIndexFor(before);
  const newIdx = rankIndexFor(after);
  return {
    xp: after,
    leveledUp: newIdx > oldIdx,
    rank: RANKS[newIdx],
    dragonGrew: dragonStageFor(after) > dragonStageFor(before),
  };
}

/* ============================ סטטיסטיקה ============================ */

/**
 * רישום תשובה.
 * @param {string} topic מזהה הנושא
 * @param {'first'|'second'|'fail'} outcome
 */
export function recordAnswer(topic, outcome) {
  update((s) => {
    const t = s.stats.byTopic[topic] || (s.stats.byTopic[topic] = { answered: 0, correct: 0, firstTry: 0, wrong: 0 });
    t.answered += 1;
    s.stats.totals.answered += 1;
    if (outcome === 'first') {
      t.correct += 1; t.firstTry += 1;
      s.stats.totals.correct += 1; s.stats.totals.firstTry += 1;
    } else if (outcome === 'second') {
      t.correct += 1; t.wrong += 1;
      s.stats.totals.correct += 1; s.stats.totals.wrong += 1;
    } else {
      t.wrong += 1;
      s.stats.totals.wrong += 1;
    }
  });
}

/** הוספת שאלה שנענתה לא נכון לתור החזרה (יחזור בקרב עתידי עם מספרים אחרים) */
export function pushToReview(question) {
  update((s) => {
    s.reviewQueue = s.reviewQueue.filter((r) => r.type !== question.type);
    s.reviewQueue.push({ type: question.type, topic: question.topic, addedAt: todayKey() });
    if (s.reviewQueue.length > 30) s.reviewQueue.shift();
  });
}

/** הסרה מתור החזרה אחרי שהנושא נפתר נכון */
export function clearFromReview(type) {
  update((s) => {
    s.reviewQueue = s.reviewQueue.filter((r) => r.type !== type);
  });
}

export function reviewCount() {
  return getState().reviewQueue.length;
}

/**
 * כוכבים לאזור במפה (0-3), לפי כמות תרגול ודיוק בניסיון ראשון.
 */
export function regionStars(topicId) {
  const t = getState().stats.byTopic[topicId];
  if (!t || !t.answered) return 0;
  const acc = t.firstTry / t.answered;
  if (t.answered >= 15 && acc >= 0.8) return 3;
  if (t.answered >= 8 && acc >= 0.6) return 2;
  if (t.answered >= 3) return 1;
  return t.answered >= 1 ? 1 : 0;
}

/** שיא אישי במשחק "מתקפת ברק". מחזיר true אם נשבר שיא */
export function saveLightningBest(score, easy = false) {
  const key = easy ? 'lightningBestEasy' : 'lightningBest';
  let isRecord = false;
  update((s) => {
    if (score > (s.records[key] || 0)) {
      s.records[key] = score;
      isRecord = true;
    }
  });
  return isRecord;
}

/** שיא נפרד לרמה הקלה, כדי שלא יתערבב עם השיא הרגיל */
export function lightningBest(easy = false) {
  return getState().records[easy ? 'lightningBestEasy' : 'lightningBest'] || 0;
}

/* ============================ אוסף הצורות ============================ */

export function shapeList(type) {
  const coll = getState().records.shapeCollection || {};
  return Array.isArray(coll[type]) ? coll[type] : [];
}

export function hasShape(type, label) {
  return shapeList(type).includes(label);
}

/** הוספת צורה לאוסף. מחזיר true אם זו צורה חדשה */
export function addShape(type, label) {
  let isNew = false;
  update((s) => {
    if (!s.records.shapeCollection) s.records.shapeCollection = {};
    const list = s.records.shapeCollection[type] || [];
    if (!list.includes(label)) {
      list.push(label);
      list.sort();
      isNew = true;
    }
    s.records.shapeCollection[type] = list;
  });
  return isNew;
}

/** דיוק לפי נושא, באחוזים */
export function accuracyByTopic() {
  const s = getState();
  const out = {};
  for (const [id, t] of Object.entries(s.stats.byTopic)) {
    out[id] = t.answered ? Math.round((t.firstTry / t.answered) * 100) : null;
  }
  return out;
}

/* ============================ רצף ימים ============================ */

/**
 * עדכון רצף הימים בתחילת קרב. מחזיר { streak, isNewDay, bonus }
 */
export function touchDailyStreak() {
  const today = todayKey();
  let result = { streak: 0, isNewDay: false, bonus: 0 };
  update((s) => {
    const last = s.stats.lastPlayed;
    if (last === today) {
      result = { streak: s.stats.streakDays, isNewDay: false, bonus: 0 };
      return;
    }
    const gap = daysBetweenKeys(last, today);
    s.stats.streakDays = gap === 1 ? s.stats.streakDays + 1 : 1;
    s.stats.bestStreakDays = Math.max(s.stats.bestStreakDays, s.stats.streakDays);
    s.stats.lastPlayed = today;
    const bonus = Math.min(REWARDS.streakBonusMax, s.stats.streakDays * REWARDS.streakBonusPerDay);
    result = { streak: s.stats.streakDays, isNewDay: true, bonus };
  });
  return result;
}

export function bumpSessions() {
  update((s) => { s.stats.sessions += 1; });
}

export function markPerfect() {
  update((s) => { s.stats.perfectBattles += 1; });
}
