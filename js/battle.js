// battle.js - לולאת הקרב: 5 שאלות מול מפלצת, מטבעות, רמזים ופתרון מלא

import { buildBattle, TOPICS } from './questions.js';
import { randomMonster } from './monsters.js';
import { getState } from './storage.js';
import { mountAvatar } from './avatar.js';
import { createQuestionUI } from './qui.js';
import {
  $, showScreen, toast, answerInput, updateHUD, speak, canSpeak, celebrateLevelUp,
} from './ui.js';
import {
  REWARDS, addCoins, addXp, recordAnswer, pushToReview, clearFromReview, touchDailyStreak,
  bumpSessions, markPerfect, dragonStageFor, hasShape, addShape, shapeList,
} from './progress.js';
import { fmt, esc, wrapMath } from './util.js';

const QUESTIONS_PER_BATTLE = 5;
const MONSTER_MAX_HP = 100;

let battle = null;

/* ============================ משוב ============================ */

function showFeedback(kind, title, html) {
  const fb = $('#q-feedback');
  fb.className = `q-feedback ${kind}`;
  fb.innerHTML = `<span class="fb-title">${esc(title)}</span>${html}`;
  fb.hidden = false;
}

function hideFeedback() {
  const fb = $('#q-feedback');
  fb.hidden = true;
  fb.innerHTML = '';
}

function stepsHtml(steps) {
  return `<ol>${steps.map((s) => `<li>${wrapMath(esc(s))}</li>`).join('')}</ol>`;
}

function hintHtml(q) {
  return `<div>💡 ${wrapMath(esc(q.hint))}</div>`;
}

/* ============================ ציור השאלה ============================ */

function setKeypadVisible(show) {
  $('#answer-row').hidden = !show;
  $('#keypad').hidden = !show;
}

function questionContext() {
  return {
    keypad: answerInput,
    canRead: canSpeak(),
    speak,
    toast,
    setKeypad: setKeypadVisible,
    verdict: (v) => handleVerdict(v),
    shapes: { has: hasShape, add: addShape, list: shapeList },
  };
}

function renderQuestion() {
  const q = battle.questions[battle.index];
  battle.errors = 0;
  battle.hintShown = false;

  const topicName = TOPICS[q.topic] ? TOPICS[q.topic].name : '';
  const tags = [
    `שאלה ${battle.index + 1} מתוך ${battle.questions.length}`,
    topicName,
    q.source === 'teacher' ? 'מדף המורה' : '',
    q.fromReview ? 'חזרה 🔁' : '',
  ].filter(Boolean);
  $('#q-topic').textContent = tags.join(' · ');

  hideFeedback();
  answerInput.reset(q.unit);

  battle.component = createQuestionUI(q, questionContext());
  battle.component.mount($('#q-body'));

  setKeypadVisible(battle.component.usesKeypad);
  $('#btn-submit').hidden = !battle.component.usesSubmit;
  $('#btn-submit').disabled = false;
  $('#btn-next').hidden = true;
  $('#btn-hint').disabled = false;

  renderPips();
}

function renderPips() {
  $('#battle-progress').innerHTML = battle.questions.map((_, i) => {
    const r = battle.results[i];
    let cls = 'pip';
    if (r === 'first') cls += ' good';
    else if (r === 'second') cls += ' half';
    else if (r === 'fail') cls += ' bad';
    if (i === battle.index) cls += ' current';
    return `<div class="${cls}"></div>`;
  }).join('');
}

/* ============================ אנימציות ============================ */

function attackAnimation(damage) {
  const hero = $('#battle-avatar');
  const art = $('#monster-art');
  hero.classList.add('attack-anim');
  setTimeout(() => art.classList.add('shake-anim'), 180);
  setTimeout(() => {
    hero.classList.remove('attack-anim');
    art.classList.remove('shake-anim');
  }, 700);

  const pop = $('#damage-pop');
  pop.textContent = `-${fmt(damage)}`;
  pop.hidden = true;
  void pop.offsetWidth;
  pop.hidden = false;
  setTimeout(() => { pop.hidden = true; }, 1000);
}

function setHp(hp) {
  $('#hp-fill').style.width = `${Math.max(0, (hp / MONSTER_MAX_HP) * 100)}%`;
  if (hp <= 0) setTimeout(() => $('#monster-art').classList.add('defeated'), 500);
}

/* ============================ פסק דין ============================ */

const PRAISE_FIRST = ['מצוין!', 'כל הכבוד!', 'בול בול!', 'אלוף!', 'מדויק!'];
const PRAISE_SECOND = ['יפה מאוד, הצלחת!', 'כל הכבוד על ההתמדה!', 'זהו, תפסת את זה!'];
const ENCOURAGE = ['כמעט! בוא ננסה שוב עם רמז.', 'לא נורא בכלל - יש עוד ניסיון.', 'זה קורה לכולם. הנה רמז קטן.'];

function pickOf(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

function handleVerdict(v) {
  if (!battle || battle.finished) return;
  const q = battle.questions[battle.index];

  if (v.status === 'incomplete') {
    toast(v.message || 'עוד לא סיימנו כאן 🙂');
    return;
  }

  // התקדמות בתוך השאלה (אבן נוספת, מעבר לשלב ההסבר)
  if (v.status === 'progress') {
    showFeedback('good', v.message || 'יופי!', '');
    return;
  }

  if (v.status === 'correct') {
    const outcome = battle.errors === 0 ? 'first' : 'second';
    const base = outcome === 'first' ? REWARDS.firstTry : REWARDS.secondTry;
    const bonus = v.bonus || 0;
    const coins = base + bonus;
    const xp = outcome === 'first' ? REWARDS.xpFirstTry : REWARDS.xpSecondTry;
    const damage = outcome === 'first' ? 20 : 12;

    battle.results[battle.index] = outcome;
    battle.coins += coins;
    battle.xp += xp;
    battle.hp = Math.max(0, battle.hp - damage);

    answerInput.markRight();
    attackAnimation(damage);
    setHp(battle.hp);

    addCoins(coins);
    const lvl = addXp(xp);
    recordAnswer(q.topic, outcome);
    if (q.fromReview) clearFromReview(q.type);
    if (lvl.leveledUp) battle.levelUps.push(lvl.rank.name);
    updateHUD();

    const praise = outcome === 'first' ? pickOf(PRAISE_FIRST) : pickOf(PRAISE_SECOND);
    const extra = bonus ? ` (כולל בונוס של ${fmt(bonus)})` : '';
    showFeedback('good', `${praise} 🎉`, `
      ${v.message ? `<div>${esc(v.message)}</div>` : ''}
      <div>קיבלת <span class="num">${fmt(coins)}</span> מטבעות${esc(extra)}.</div>`);
    endOfQuestion();
    return;
  }

  // תשובה לא נכונה
  battle.errors += 1;
  answerInput.markWrong();

  if (battle.errors === 1) {
    showFeedback('hint', v.message || pickOf(ENCOURAGE),
      `${hintHtml(q)}<div class="fb-extra">נסו שוב - אין שום הפסד של מטבעות.</div>`);
    battle.hintShown = true;
    $('#btn-hint').disabled = true;
    return;
  }

  battle.results[battle.index] = 'fail';
  recordAnswer(q.topic, 'fail');
  pushToReview(q);
  const lvl = addXp(REWARDS.xpEffort);
  if (lvl.leveledUp) battle.levelUps.push(lvl.rank.name);
  battle.xp += REWARDS.xpEffort;
  updateHUD();

  const answerText = q.answerText || (typeof q.answer === 'number' ? fmt(q.answer) : String(q.answer));
  showFeedback('solve', 'בוא נפתור את זה יחד, שלב אחר שלב:',
    `${stepsHtml(q.steps)}<div class="fb-extra">התשובה הנכונה: <span class="num">${esc(answerText)}</span>. השאלה הזו תחזור אלינו בקרב הבא כדי להתאמן עליה שוב. 💪</div>`);
  endOfQuestion();
}

function endOfQuestion() {
  if (battle.component && battle.component.lock) battle.component.lock();
  answerInput.setEnabled(false);
  renderPips();
  $('#btn-submit').hidden = true;
  $('#btn-next').hidden = false;
  $('#btn-hint').disabled = true;
  $('#btn-next').focus();
}

function onSubmit() {
  if (!battle || !battle.component) return;
  handleVerdict(battle.component.submit());
}

function onHint() {
  const q = battle.questions[battle.index];
  const s = getState();
  if (battle.hintShown) return;
  if (s.player.coins < REWARDS.hintCost) {
    toast('אין מספיק מטבעות לרמז. נסו לפתור - גם טעות לא עולה כלום!');
    return;
  }
  addCoins(-REWARDS.hintCost);
  battle.hintsBought += 1;
  battle.hintShown = true;
  updateHUD();
  $('#btn-hint').disabled = true;
  showFeedback('hint', 'רמז:', hintHtml(q));
}

function onNext() {
  battle.index += 1;
  if (battle.index >= battle.questions.length) {
    finishBattle();
    return;
  }
  renderQuestion();
}

/* ============================ סיום קרב ============================ */

function finishBattle() {
  battle.finished = true;
  const firstTry = battle.results.filter((r) => r === 'first').length;
  const second = battle.results.filter((r) => r === 'second').length;
  const correct = firstTry + second;
  const total = battle.questions.length;
  const perfect = firstTry === total;

  let bonus = 0;
  if (perfect) {
    bonus += REWARDS.perfectBonus;
    markPerfect();
  }
  const streakBonus = battle.streakInfo.isNewDay ? battle.streakInfo.bonus : 0;
  bonus += streakBonus;
  if (bonus > 0) addCoins(bonus);
  bumpSessions();
  updateHUD();

  const s = getState();
  const defeated = battle.hp <= 0;
  const days = battle.streakInfo.streak === 1 ? 'יום אחד' : `${fmt(battle.streakInfo.streak)} ימים`;
  const value = (v) => (/[֐-׿]/.test(v) ? `<span>${esc(v)}</span>` : `<span class="num">${esc(v)}</span>`);

  $('#summary-title').textContent = defeated ? 'ניצחון! 🏆' : 'סוף הקרב';
  $('#summary-art').textContent = defeated ? '🐉⚔️' : '💪';

  const rows = [
    ['תשובות נכונות', `${fmt(correct)} מתוך ${fmt(total)}`],
    ['נכון בניסיון ראשון', `${fmt(firstTry)}`],
    ['מטבעות מהקרב', `🪙 ${fmt(battle.coins)}`],
    ['נקודות ניסיון', `⭐ ${fmt(battle.xp)}`],
  ];
  if (battle.hintsBought > 0) rows.push(['רמזים שנקנו', `🪙 -${fmt(battle.hintsBought * REWARDS.hintCost)}`]);

  const bonusRows = [];
  if (perfect) bonusRows.push([`בונוס קרב מושלם! ${fmt(total)} מתוך ${fmt(total)}`, `🪙 +${fmt(REWARDS.perfectBonus)}`]);
  if (streakBonus > 0) bonusRows.push([`בונוס רצף אימונים - ${days}`, `🪙 +${fmt(streakBonus)}`]);

  $('#summary-list').innerHTML = [
    ...rows.map(([k, v]) => `<li><span>${esc(k)}</span>${value(v)}</li>`),
    ...bonusRows.map(([k, v]) => `<li class="bonus"><span>${esc(k)}</span>${value(v)}</li>`),
    `<li><span>סך המטבעות שלך</span><span class="num">🪙 ${fmt(s.player.coins)}</span></li>`,
  ].join('');

  showScreen('summary');

  if (battle.levelUps.length) {
    const rank = battle.levelUps[battle.levelUps.length - 1];
    setTimeout(() => celebrateLevelUp(`עלית לדרגת ${rank}!`), 400);
  }
}

/* ============================ התחלה ויציאה ============================ */

export function startBattle(options = {}) {
  const s = getState();
  const monster = randomMonster();
  const topic = options.topic || null;

  battle = {
    topic,
    questions: buildBattle(s, { count: QUESTIONS_PER_BATTLE, topic }),
    monster,
    hp: MONSTER_MAX_HP,
    index: 0,
    errors: 0,
    hintShown: false,
    hintsBought: 0,
    results: [],
    coins: 0,
    xp: 0,
    levelUps: [],
    component: null,
    finished: false,
    streakInfo: touchDailyStreak(),
  };

  $('#monster-name').textContent = monster.name;
  $('#monster-art').innerHTML = monster.art();
  $('#monster-art').classList.remove('defeated');
  setHp(battle.hp);

  mountAvatar($('#battle-avatar'), {
    color: s.player.color,
    equipped: s.inventory.equipped,
    dragonStage: dragonStageFor(s.player.xp),
    name: s.player.name,
  });

  showScreen('battle');
  if (topic && TOPICS[topic]) $('#topbar-title').textContent = TOPICS[topic].region;
  renderQuestion();

  if (battle.streakInfo.isNewDay && battle.streakInfo.streak > 1) {
    toast(`🔥 רצף של ${battle.streakInfo.streak} ימים! בונוס בסוף הקרב.`);
  }
}

/** האם יש קרב פעיל שעדיין לא הסתיים */
export function isBattleActive() {
  return Boolean(battle && !battle.finished);
}

/** יציאה מהקרב באמצע - מה שנענה כבר נשמר */
export function abandonBattle() {
  if (battle) battle.finished = true;
  battle = null;
}

export function bindBattleButtons() {
  $('#btn-submit').addEventListener('click', onSubmit);
  $('#btn-next').addEventListener('click', onNext);
  $('#btn-hint').addEventListener('click', onHint);
}
