// lightning.js - מיני משחק "מתקפת ברק": לוח הכפל בלחץ זמן, עם שיא אישי.
// זהו המקום היחיד במשחק שבו יש טיימר.

import { ri, pick, shuffle, fmt, esc } from './util.js';
import { $, showScreen, toast, updateHUD, celebrateLevelUp } from './ui.js';
import { addCoins, addXp, recordAnswer, saveLightningBest, lightningBest } from './progress.js';

const GAME_SECONDS = 60;

let game = null;
let timer = null;

/* ============================ שאלות ============================ */

/** easy = כפולות של 2 עד 5 בלבד */
function nextFact(easy = false) {
  let a, b;
  if (easy) {
    const small = pick([2, 2, 3, 3, 4, 4, 5]);
    const other = ri(1, 10);
    [a, b] = Math.random() < 0.5 ? [small, other] : [other, small];
  } else {
    a = pick([2, 3, 4, 5, 6, 6, 7, 7, 8, 8, 9, 9, 10]);
    b = pick([2, 3, 4, 5, 6, 6, 7, 7, 8, 8, 9, 9, 10]);
  }
  const answer = a * b;

  const candidates = new Set([answer]);
  const tries = [answer + a, answer - a, answer + b, answer - b, a * (b + 1), (a + 1) * b, answer + 10, answer - 10];
  for (const c of shuffle(tries)) {
    if (c > 0 && c !== answer && candidates.size < 4) candidates.add(c);
  }
  while (candidates.size < 4) candidates.add(answer + ri(1, 12));

  return { a, b, answer, choices: shuffle([...candidates]) };
}

/* ============================ ציור ============================ */

function drawIntro() {
  $('#lightning-body').innerHTML = `
    <div class="card lightning-card">
      <div class="lightning-title">⚡ מתקפת ברק</div>
      <p class="subtitle">${GAME_SECONDS} שניות. כמה תרגילי כפל תספיק לפתור?</p>
      <div class="best-row">🏆 השיא שלך: <span class="num">${fmt(lightningBest())}</span> · קל: <span class="num">${fmt(lightningBest(true))}</span></div>
      <button class="btn btn-primary btn-xl" type="button" id="btn-lightning-start">מתחילים!</button>
      <button class="btn btn-secondary btn-xl lightning-easy-btn" type="button" id="btn-lightning-easy">🐣 מתחילים ברמה קלה (כפולות 2-5)</button>
      <p class="small-note">כל תשובה נכונה = מטבע ונקודות ניסיון. טעות לא מורידה כלום.</p>
    </div>`;
  $('#btn-lightning-start').onclick = () => start(false);
  $('#btn-lightning-easy').onclick = () => start(true);
}

function drawGame(flash = '') {
  const q = game.q;
  $('#lightning-body').innerHTML = `
    <div class="lightning-hud">
      <div class="chip-box">⚡ <span class="num">${fmt(game.score)}</span></div>
      <div class="timer-bar"><div class="timer-fill" style="width:${(game.left / GAME_SECONDS) * 100}%"></div></div>
      <div class="chip-box">⏱ <span class="num">${Math.ceil(game.left)}</span></div>
    </div>
    ${game.combo >= 3 ? `<div class="combo">🔥 רצף של ${fmt(game.combo)}!</div>` : ''}
    <div class="card lightning-card ${flash}">
      <div class="expr expr-big" dir="ltr">${fmt(q.a)} × ${fmt(q.b)} = ?</div>
      <div class="bolt-choices">
        ${q.choices.map((c) => `<button class="bolt-btn" type="button" data-v="${c}">${fmt(c)}</button>`).join('')}
      </div>
    </div>`;

  $('#lightning-body').querySelectorAll('[data-v]').forEach((b) => {
    b.onclick = () => answer(Number(b.dataset.v));
  });
}

function drawEnd(isRecord) {
  const coins = game.score;
  const xp = game.score * 2;
  $('#lightning-body').innerHTML = `
    <div class="card lightning-card">
      <div class="lightning-title">${isRecord ? '🏆 שיא חדש!' : '⚡ סוף הסיבוב'}</div>
      <div class="big-score num">${fmt(game.score)}</div>
      <p class="subtitle">תרגילים נכונים ב-${GAME_SECONDS} שניות</p>
      <ul class="summary-list">
        <li><span>השיא שלך${game.easy ? ' (קל)' : ''}</span><span class="num">🏆 ${fmt(lightningBest(game.easy))}</span></li>
        <li><span>מטבעות</span><span class="num">🪙 +${fmt(coins)}</span></li>
        <li><span>נקודות ניסיון</span><span class="num">⭐ +${fmt(xp)}</span></li>
        <li><span>הרצף הארוך ביותר</span><span class="num">🔥 ${fmt(game.bestCombo)}</span></li>
      </ul>
      <button class="btn btn-primary btn-xl" type="button" id="btn-lightning-again">עוד סיבוב!</button>
    </div>`;
  const easy = game.easy;
  $('#btn-lightning-again').onclick = () => start(easy);
}

/* ============================ לוגיקה ============================ */

function answer(v) {
  if (!game || game.over) return;
  const correct = v === game.q.answer;
  if (correct) {
    game.score += 1;
    game.combo += 1;
    game.bestCombo = Math.max(game.bestCombo, game.combo);
    recordAnswer('mult_table', 'first');
    game.q = nextFact(game.easy);
    drawGame('flash-good');
    setTimeout(() => { if (game && !game.over) drawGame(); }, 160);
  } else {
    game.combo = 0;
    recordAnswer('mult_table', 'fail');
    const right = game.q.answer;
    drawGame('flash-bad');
    toast(`${fmt(game.q.a)} × ${fmt(game.q.b)} = ${fmt(right)}`, 1200);
    game.q = nextFact(game.easy);
    setTimeout(() => { if (game && !game.over) drawGame(); }, 500);
  }
}

function tick() {
  if (!game || game.over) return;
  game.left -= 0.1;
  if (game.left <= 0) {
    finish();
    return;
  }
  const fill = document.querySelector('.timer-fill');
  if (fill) fill.style.width = `${(game.left / GAME_SECONDS) * 100}%`;
  const t = document.querySelectorAll('.chip-box .num')[1];
  if (t) t.textContent = fmt(Math.ceil(game.left));
}

function finish() {
  game.over = true;
  clearInterval(timer);
  timer = null;

  const isRecord = saveLightningBest(game.score, game.easy);
  addCoins(game.score);
  const lvl = addXp(game.score * 2);
  updateHUD();

  drawEnd(isRecord);
  if (isRecord && game.score > 0) celebrateLevelUp(`שיא חדש: ${fmt(game.score)}!`);
  else if (lvl.leveledUp) celebrateLevelUp(`עלית לדרגת ${lvl.rank.name}!`);
}

function start(easy = false) {
  stopLightning();
  game = { easy, score: 0, combo: 0, bestCombo: 0, left: GAME_SECONDS, over: false, q: nextFact(easy) };
  drawGame();
  timer = setInterval(tick, 100);
}

/* ============================ ממשק חיצוני ============================ */

export function openLightning() {
  stopLightning();
  showScreen('lightning');
  drawIntro();
}

/** עצירת הטיימר - נקרא ביציאה מהמסך */
export function stopLightning() {
  if (timer) { clearInterval(timer); timer = null; }
  if (game) game.over = true;
  game = null;
}

export function isLightningRunning() {
  return Boolean(game && !game.over);
}
