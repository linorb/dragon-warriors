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
