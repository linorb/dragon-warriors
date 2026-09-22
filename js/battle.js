// battle.js - לולאת הקרב: 5 שאלות מול מפלצת, מטבעות, רמזים ופתרון מלא

import { buildBattle } from './questions.js';
import { randomMonster } from './monsters.js';
import { TOPICS } from './questions.js';
import { getState } from './storage.js';
import { mountAvatar } from './avatar.js';
import {
  $, showScreen, toast, answerInput, updateHUD, speak, canSpeak, celebrateLevelUp,
} from './ui.js';
import {
  REWARDS, addCoins, addXp, recordAnswer, pushToReview, touchDailyStreak,
  bumpSessions, markPerfect, dragonStageFor,
} from './progress.js';
import { fmt, esc, wrapMath } from './util.js';

const QUESTIONS_PER_BATTLE = 5;
const MONSTER_MAX_HP = 100;

let battle = null;

/* ============================ ציור השאלה ============================ */

function renderExpr(q) {
  const body = esc(q.expr).replace(/\?/g, '<span class="blank">?</span>');
  const dir = q.exprRtl ? 'rtl' : 'ltr';
  const cls = q.exprRtl ? 'expr expr-big expr-rtl' : 'expr expr-big';
  return `<div class="${cls}" dir="${dir}">${body}</div>`;
}

function renderMission(q) {
  const story = esc(q.story).replace(/\[\[(.+?)\]\]/g, '<span class="key-num">$1</span>');
  const readBtn = canSpeak() ? `<button class="read-btn" type="button" id="btn-read">🔊 הקראה</button>` : '';
  return `
    <div class="mission-card">
      <div class="mission-head">📜 משימה</div>
      <div>${story}</div>
      ${readBtn}
    </div>
    <textarea class="scratchpad" id="scratchpad" placeholder="מקום לחישובים..." aria-label="טיוטה לחישובים"></textarea>`;
}

function renderQuestion() {
  const q = battle.questions[battle.index];
  battle.attempts = 0;
  battle.hintShown = false;

  const topicName = TOPICS[q.topic] ? TOPICS[q.topic].name : '';
  $('#q-topic').textContent = `שאלה ${battle.index + 1} מתוך ${battle.questions.length} · ${topicName}${q.source === 'teacher' ? ' · מדף המורה' : ''}`;

  const parts = [`<div class="q-text">${esc(q.instruction)}</div>`];
  parts.push(q.ui === 'mission' ? renderMission(q) : renderExpr(q));
  $('#q-body').innerHTML = parts.join('');

  const fb = $('#q-feedback');
  fb.hidden = true;
  fb.innerHTML = '';

  answerInput.reset(q.unit);
  $('#btn-submit').hidden = false;
  $('#btn-submit').disabled = false;
  $('#btn-next').hidden = true;
  $('#btn-hint').disabled = false;

  const readBtn = document.getElementById('btn-read');
  if (readBtn) {
    readBtn.onclick = () => speak(q.story.replace(/\[\[|\]\]/g, ''));
  }

  renderPips();
}

function renderPips() {
  const pips = battle.questions.map((_, i) => {
    const r = battle.results[i];
    let cls = 'pip';
    if (r === 'first') cls += ' good';
    else if (r === 'second') cls += ' half';
    else if (r === 'fail') cls += ' bad';
    if (i === battle.index) cls += ' current';
    return `<div class="${cls}"></div>`;
  }).join('');
  $('#battle-progress').innerHTML = pips;
}

/* ============================ משוב ============================ */

function showFeedback(kind, title, html) {
  const fb = $('#q-feedback');
  fb.className = `q-feedback ${kind}`;
  fb.innerHTML = `<span class="fb-title">${esc(title)}</span>${html}`;
  fb.hidden = false;
}

function stepsHtml(steps) {
  return `<ol>${steps.map((s) => `<li>${wrapMath(esc(s))}</li>`).join('')}</ol>`;
}

/** רמז - עם עטיפת LTR לכל תרגיל שמופיע בתוכו */
function hintHtml(q) {
  return `<div>💡 ${wrapMath(esc(q.hint))}</div>`;
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
}

/* ============================ פעולות ============================ */

const PRAISE_FIRST = ['מצוין!', 'כל הכבוד!', 'בול בול!', 'אלוף!', 'מדויק!'];
const PRAISE_SECOND = ['יפה מאוד, הצלחת!', 'כל הכבוד על ההתמדה!', 'זהו, תפסת את זה!'];
const ENCOURAGE = ['כמעט! בוא ננסה שוב עם רמז.', 'לא נורא בכלל - יש עוד ניסיון.', 'זה קורה לכולם. הנה רמז קטן.'];

function pickOf(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

function onSubmit() {
  const q = battle.questions[battle.index];
  const val = answerInput.value();
  if (val === null) {
    toast('כתבו תשובה ואז לחצו בדיקה 🙂');
    return;
  }

  if (val === q.answer) {
    const outcome = battle.attempts === 0 ? 'first' : 'second';
    const coins = outcome === 'first' ? REWARDS.firstTry : REWARDS.secondTry;
    const xp = outcome === 'first' ? REWARDS.xpFirstTry : REWARDS.xpSecondTry;
    const damage = outcome === 'first' ? 20 : 12;

    battle.results[battle.index] = outcome;
    battle.coins += coins;
    battle.xp += xp;
    battle.hp = Math.max(0, battle.hp - damage);

    answerInput.markRight();
    answerInput.setEnabled(false);
    attackAnimation(damage);
    setHp(battle.hp);

    addCoins(coins);
    const lvl = addXp(xp);
    recordAnswer(q.topic, outcome);
    if (lvl.leveledUp) battle.levelUps.push(lvl.rank.name);
    updateHUD();

    const praise = outcome === 'first' ? pickOf(PRAISE_FIRST) : pickOf(PRAISE_SECOND);
    showFeedback('good', `${praise} 🎉`, `<div>התשובה <span class="num">${fmt(q.answer)}</span> נכונה. קיבלת <span class="num">${fmt(coins)}</span> מטבעות.</div>`);
    endOfQuestion();
    return;
  }

  // תשובה לא נכונה
  if (battle.attempts === 0) {
    battle.attempts = 1;
    answerInput.markWrong();
    showFeedback('hint', pickOf(ENCOURAGE), `${hintHtml(q)}<div style="margin-top:6px">נסו שוב - אין שום הפסד של מטבעות.</div>`);
    battle.hintShown = true;
    $('#btn-hint').disabled = true;
    return;
  }

  // ניסיון שני שגוי - מציגים פתרון מלא
  battle.results[battle.index] = 'fail';
  answerInput.markWrong();
  answerInput.setEnabled(false);
  recordAnswer(q.topic, 'fail');
  pushToReview(q);
  const lvl = addXp(REWARDS.xpEffort);
  if (lvl.leveledUp) battle.levelUps.push(lvl.rank.name);
  battle.xp += REWARDS.xpEffort;
  updateHUD();

  showFeedback(
    'solve',
    'בוא נפתור את זה יחד, שלב אחר שלב:',
    `${stepsHtml(q.steps)}<div style="margin-top:8px">התשובה הנכונה: <span class="num">${fmt(q.answer)}</span>. השאלה הזו תחזור אלינו בקרב הבא כדי להתאמן עליה שוב. 💪</div>`
  );
  endOfQuestion();
}

function endOfQuestion() {
  renderPips();
  $('#btn-submit').hidden = true;
  $('#btn-next').hidden = false;
  $('#btn-hint').disabled = true;
  $('#btn-next').focus();
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
  const firstTry = battle.results.filter((r) => r === 'first').length;
  const second = battle.results.filter((r) => r === 'second').length;
  const correct = firstTry + second;
  const perfect = firstTry === battle.questions.length;

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

  $('#summary-title').textContent = defeated ? 'ניצחון! 🏆' : 'סוף הקרב';
  $('#summary-art').textContent = defeated ? '🐉⚔️' : '💪';

  const total = battle.questions.length;
  const days = battle.streakInfo.streak === 1 ? 'יום אחד' : `${fmt(battle.streakInfo.streak)} ימים`;

  // ערך מעורב (מספר + עברית) נשאר בכיוון עברי; ערך מספרי טהור נעטף ב-LTR
  const value = (v) => (/[֐-׿]/.test(v) ? `<span>${esc(v)}</span>` : `<span class="num">${esc(v)}</span>`);

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

/* ============================ התחלה ============================ */

export function startBattle() {
  const s = getState();
  const monster = randomMonster();
  battle = {
    questions: buildBattle(s, QUESTIONS_PER_BATTLE),
    monster,
    hp: MONSTER_MAX_HP,
    index: 0,
    attempts: 0,
    hintShown: false,
    hintsBought: 0,
    results: [],
    coins: 0,
    xp: 0,
    levelUps: [],
    streakInfo: touchDailyStreak(),
  };

  $('#monster-name').textContent = monster.name;
  $('#monster-art').innerHTML = monster.art();
  setHp(battle.hp);

  mountAvatar($('#battle-avatar'), {
    color: s.player.color,
    equipped: s.inventory.equipped,
    dragonStage: dragonStageFor(s.player.xp),
    name: s.player.name,
  });

  showScreen('battle');
  renderQuestion();

  if (battle.streakInfo.isNewDay && battle.streakInfo.streak > 1) {
    toast(`🔥 רצף של ${battle.streakInfo.streak} ימים! בונוס בסוף הקרב.`);
  }
}

export function bindBattleButtons() {
  $('#btn-submit').addEventListener('click', onSubmit);
  $('#btn-next').addEventListener('click', onNext);
  $('#btn-hint').addEventListener('click', onHint);
}
