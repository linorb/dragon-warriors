// ui.js - תשתית ממשק: מסכים, חלוניות, הודעות, מקלדת מספרים, וציור מסכי החנות וחדר הנשק

import { getState, isStorageAvailable } from './storage.js';
import { mountAvatar, COLOR_CHOICES, itemArt } from './avatar.js';
import { CATALOG, SLOTS, TIERS, canBuy, buy, equip, equipped, owns, ownedInSlot } from './shop.js';
import { rankFor, nextRankFor, RANKS, rankIndexFor, dragonStageFor } from './progress.js';
import { fmt, esc, hebDate } from './util.js';
import { DRAGON_STAGES } from './avatar.js';
import { TOPICS, REGION_ORDER } from './questions.js';

export const $ = (sel) => document.querySelector(sel);
export const $$ = (sel) => Array.from(document.querySelectorAll(sel));

/* ============================ ניהול מסכים ============================ */

const SCREEN_TITLES = {
  onboarding: 'לוחמי דרקונים',
  home: 'לוחמי דרקונים',
  map: 'מפת העולם',
  battle: 'קרב',
  summary: 'סיכום הקרב',
  shop: 'חנות',
  armory: 'חדר הנשק',
  settings: 'מסך הורים',
  lightning: 'מתקפת ברק',
};

let currentScreen = null;
const backTargets = {
  shop: 'home', armory: 'home', settings: 'home', summary: 'home',
  battle: 'home', map: 'home', lightning: 'home',
};

export function showScreen(name) {
  $$('.screen').forEach((s) => { s.hidden = true; });
  const el = document.getElementById(`screen-${name}`);
  if (el) el.hidden = false;
  currentScreen = name;

  const bar = $('#topbar');
  bar.hidden = name === 'onboarding';
  $('#topbar-title').textContent = SCREEN_TITLES[name] || 'לוחמי דרקונים';
  $('#btn-back').hidden = !backTargets[name];
  window.scrollTo({ top: 0, behavior: 'instant' in window ? 'auto' : 'auto' });
  updateHUD();
}

export function getCurrentScreen() {
  return currentScreen;
}

export function backTarget() {
  return backTargets[currentScreen] || 'home';
}

/* ============================ HUD ============================ */

let lastCoins = null;
let lastXp = null;

/** הבהוב קצר כשהמספר בסרגל העליון משתנה */
function pulse(el) {
  if (!el) return;
  el.classList.remove('chip-pop');
  void el.offsetWidth;
  el.classList.add('chip-pop');
}

export function updateHUD() {
  const s = getState();
  const c = $('#hud-coins');
  const x = $('#hud-xp');
  if (c) {
    if (lastCoins !== null && s.player.coins !== lastCoins) pulse(c.parentElement);
    c.textContent = fmt(s.player.coins);
    lastCoins = s.player.coins;
  }
  if (x) {
    if (lastXp !== null && s.player.xp !== lastXp) pulse(x.parentElement);
    x.textContent = fmt(s.player.xp);
    lastXp = s.player.xp;
  }
}

/* ============================ הודעות וחלוניות ============================ */

let toastTimer = null;

export function toast(msg, ms = 2200) {
  const t = $('#toast');
  t.textContent = msg;
  t.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { t.hidden = true; }, ms);
}

/**
 * חלונית אישור / הודעה / קלט טקסט.
 * מחזירה Promise: true/false, או מחרוזת כאשר withInput=true.
 */
export function modal({ title, body, okText = 'אישור', cancelText = 'ביטול', withInput = false, inputValue = '', hideCancel = false }) {
  return new Promise((resolve) => {
    const box = $('#modal');
    $('#modal-title').textContent = title || '';
    $('#modal-body').innerHTML = body || '';
    const input = $('#modal-input');
    input.hidden = !withInput;
    input.value = inputValue;
    const ok = $('#modal-ok');
    const cancel = $('#modal-cancel');
    ok.textContent = okText;
    cancel.textContent = cancelText;
    cancel.hidden = hideCancel;
    box.hidden = false;
    if (withInput) setTimeout(() => input.focus(), 50);

    const done = (val) => {
      box.hidden = true;
      ok.removeEventListener('click', onOk);
      cancel.removeEventListener('click', onCancel);
      resolve(val);
    };
    const onOk = () => done(withInput ? input.value : true);
    const onCancel = () => done(withInput ? null : false);
    ok.addEventListener('click', onOk);
    cancel.addEventListener('click', onCancel);
  });
}

/** אנימציית עליית דרגה */
export function celebrateLevelUp(text) {
  const el = $('#levelup');
  $('#levelup-text').textContent = text;
  el.hidden = false;
  setTimeout(() => { el.hidden = true; }, 2200);
}

/* ============================ הקראה ============================ */

export function canSpeak() {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}

export function speak(text) {
  if (!canSpeak()) return false;
  try {
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'he-IL';
    u.rate = 0.9;
    window.speechSynthesis.speak(u);
    return true;
  } catch (e) {
    return false;
  }
}

/* ============================ מקלדת מספרים ============================ */

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'clear', '0', 'back'];

export const answerInput = {
  raw: '',
  enabled: true,
  onSubmit: null,

  init() {
    const pad = $('#keypad');
    pad.innerHTML = KEYS.map((k) => {
      if (k === 'clear') return `<button class="key util" type="button" data-key="clear" aria-label="ניקוי">נקה</button>`;
      if (k === 'back') return `<button class="key util" type="button" data-key="back" aria-label="מחיקה">⌫</button>`;
      return `<button class="key" type="button" data-key="${k}">${k}</button>`;
    }).join('');
    pad.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-key]');
      if (!btn) return;
      this.press(btn.dataset.key);
    });
    document.addEventListener('keydown', (e) => {
      if (document.getElementById('screen-battle').hidden) return;
      if (e.target && ['INPUT', 'TEXTAREA'].includes(e.target.tagName)) return;
      if (/^[0-9]$/.test(e.key)) { this.press(e.key); e.preventDefault(); }
      else if (e.key === 'Backspace') { this.press('back'); e.preventDefault(); }
      else if (e.key === 'Delete') { this.press('clear'); e.preventDefault(); }
      else if (e.key === 'Enter') {
        e.preventDefault();
        const next = $('#btn-next');
        if (!next.hidden) next.click();
        else $('#btn-submit').click();
      }
    });
  },

  press(k) {
    if (!this.enabled) return;
    if (k === 'clear') this.raw = '';
    else if (k === 'back') this.raw = this.raw.slice(0, -1);
    else if (this.raw.length < 9) this.raw = (this.raw === '0' ? '' : this.raw) + k;
    this.render();
  },

  render() {
    const d = $('#answer-display');
    d.classList.remove('wrong', 'right');
    d.innerHTML = this.raw === ''
      ? '<span class="placeholder">?</span>'
      : esc(fmt(Number(this.raw)));
  },

  reset(unit = '') {
    this.raw = '';
    this.enabled = true;
    this.render();
    $('#answer-unit').textContent = unit || '';
  },

  value() {
    return this.raw === '' ? null : Number(this.raw);
  },

  markWrong() { $('#answer-display').classList.add('wrong'); },
  markRight() { $('#answer-display').classList.add('right'); },
  setEnabled(v) { this.enabled = v; },
};

/* ============================ מסך הבית ============================ */

export function renderHome() {
  const s = getState();
  mountAvatar($('#home-avatar'), {
    color: s.player.color,
    equipped: s.inventory.equipped,
    dragonStage: dragonStageFor(s.player.xp),
    name: s.player.name,
  });
  $('#home-name').textContent = s.player.name || 'לוחם';
  const rank = rankFor(s.player.xp);
  const next = nextRankFor(s.player.xp);
  $('#home-rank').innerHTML = next
    ? `דרגה: ${esc(rank.name)} · עוד <span class="num">${fmt(next.xp - s.player.xp)}</span> נק' לדרגת ${esc(next.name)}`
    : `דרגה: ${esc(rank.name)} - הדרגה הגבוהה ביותר!`;

  const stage = DRAGON_STAGES[dragonStageFor(s.player.xp)];
  const dragonName = s.player.dragonName || 'הדרקון';
  const streak = s.stats.streakDays;
  $('#home-streak').textContent = streak > 0
    ? `🔥 רצף של ${streak} ${streak === 1 ? 'יום' : 'ימים'} של אימון!`
    : 'מתחילים רצף אימונים חדש היום!';
  $('#home-progress').innerHTML =
    `${esc(dragonName)} נמצא בשלב: ${esc(stage)} · קרבות שהושלמו: <span class="num">${fmt(s.stats.sessions)}</span>`;
}

/* ============================ חנות ============================ */

export function renderShop(onChange) {
  const s = getState();
  const grid = $('#shop-grid');
  grid.innerHTML = CATALOG.map((item) => {
    const isOwned = owns(item.id);
    const tier = TIERS[item.tier];
    const locked = rankIndexFor(s.player.xp) < item.minRank;
    let action;
    if (isOwned) action = `<div class="owned-tag">✔ ברשותך</div>`;
    else if (locked) action = `<button class="btn btn-ghost" type="button" disabled>🔒 ${esc(RANKS[item.minRank].name)}</button>`;
    else action = `<button class="btn btn-primary" type="button" data-buy="${item.id}">קנייה</button>`;
    return `
      <div class="shop-item ${tier.cls}">
        <div class="item-art">${itemArt(item.slot, item.id, s.player.color)}</div>
        <div class="item-name">${esc(item.name)}</div>
        <div class="item-tier">${esc(tier.name)} · ${esc(SLOTS.find((x) => x.id === item.slot).name)}</div>
        ${item.desc ? `<div class="item-desc">${esc(item.desc)}</div>` : ''}
        <div class="item-price">🪙 <span class="num">${fmt(item.price)}</span></div>
        ${action}
      </div>`;
  }).join('');

  grid.onclick = (e) => {
    const btn = e.target.closest('[data-buy]');
    if (!btn) return;
    const id = btn.dataset.buy;
    const check = canBuy(id);
    if (!check.ok) { toast(check.reason); return; }
    const res = buy(id);
    if (res.ok) {
      toast(`${res.item.name} נקנה והותאם ללוחם! 🎉`);
      renderShop(onChange);
      updateHUD();
      if (onChange) onChange();
    }
  };
}

/* ============================ חדר הנשק ============================ */

export function renderArmory() {
  const s = getState();
  const draw = () => mountAvatar($('#armory-avatar'), {
    color: s.player.color,
    equipped: equipped(),
    dragonStage: dragonStageFor(s.player.xp),
    name: s.player.name,
  });
  draw();

  const wrap = $('#armory-slots');
  wrap.innerHTML = SLOTS.map((slot) => {
    const items = ownedInSlot(slot.id);
    const eq = equipped()[slot.id];
    if (!items.length) {
      return `<div class="slot-row"><div class="slot-title">${esc(slot.name)}</div>
        <div class="small-note">עדיין אין פריטים בקטגוריה הזו. אפשר לקנות בחנות!</div></div>`;
    }
    const opts = [
      `<button class="slot-opt" type="button" data-slot="${slot.id}" data-item="" aria-pressed="${!eq}">
         <span style="font-size:26px">🚫</span><span>ללא</span></button>`,
      ...items.map((it) => `
        <button class="slot-opt" type="button" data-slot="${slot.id}" data-item="${it.id}" aria-pressed="${eq === it.id}">
          ${itemArt(it.slot, it.id, s.player.color)}<span>${esc(it.name)}</span>
        </button>`),
    ].join('');
    return `<div class="slot-row"><div class="slot-title">${esc(slot.name)}</div><div class="slot-options">${opts}</div></div>`;
  }).join('');

  wrap.onclick = (e) => {
    const btn = e.target.closest('[data-slot]');
    if (!btn) return;
    equip(btn.dataset.slot, btn.dataset.item || null);
    renderArmory();
  };
}

/* ============================ בורר צבעים ============================ */

export function renderColorPicker(selected, onPick) {
  const row = $('#color-picker');
  row.innerHTML = COLOR_CHOICES.map((c) => `
    <button class="color-dot" type="button" data-color="${c.id}" title="${esc(c.name)}"
            aria-label="${esc(c.name)}" aria-pressed="${c.id === selected}"
            style="background:${c.id}"></button>`).join('');
  row.onclick = (e) => {
    const btn = e.target.closest('[data-color]');
    if (!btn) return;
    onPick(btn.dataset.color);
  };
}

/* ============================ הגדרות ============================ */

export function refreshStorageWarning() {
  const w = $('#storage-warning');
  if (w) w.hidden = isStorageAvailable();
}

/* ============================ מסך הורים ============================ */

export function renderParentStats() {
  const s = getState();
  const t = s.stats;
  const overall = t.totals.answered
    ? Math.round((t.totals.firstTry / t.totals.answered) * 100)
    : null;

  const rows = REGION_ORDER
    .map((id) => ({ id, name: TOPICS[id].name, ...(t.byTopic[id] || { answered: 0, firstTry: 0 }) }))
    .filter((r) => r.answered > 0)
    .map((r) => ({ ...r, acc: Math.round((r.firstTry / r.answered) * 100) }));

  const practiced = rows.slice().sort((a, b) => b.answered - a.answered);
  const weakest = rows.filter((r) => r.answered >= 3).sort((a, b) => a.acc - b.acc).slice(0, 3);
  const untouched = REGION_ORDER.filter((id) => !(t.byTopic[id] && t.byTopic[id].answered));

  const bar = (acc) => {
    const cls = acc >= 80 ? 'good' : acc >= 60 ? 'mid' : 'low';
    return `<div class="acc-bar"><div class="acc-fill ${cls}" style="width:${acc}%"></div></div>`;
  };

  $('#parent-stats').innerHTML = `
    <div class="card">
      <h2 class="title-mid">מסך הורים</h2>
      <p class="subtitle">סיכום ההתקדמות של ${esc(s.player.name || 'הלוחם')}</p>

      <div class="parent-grid">
        <div class="parent-tile"><div class="tile-num num">${fmt(t.sessions)}</div><div>קרבות</div></div>
        <div class="parent-tile"><div class="tile-num num">${fmt(t.totals.answered)}</div><div>שאלות</div></div>
        <div class="parent-tile"><div class="tile-num num">${overall === null ? '—' : `${overall}%`}</div><div>דיוק כללי</div></div>
        <div class="parent-tile"><div class="tile-num num">${fmt(t.streakDays)}</div><div>רצף ימים</div></div>
      </div>

      <ul class="summary-list">
        <li><span>שיחק לאחרונה</span><span>${esc(hebDate(t.lastPlayed))}</span></li>
        <li><span>רצף הימים הארוך ביותר</span><span class="num">${fmt(t.bestStreakDays)}</span></li>
        <li><span>קרבות מושלמים (5 מתוך 5)</span><span class="num">${fmt(t.perfectBattles)}</span></li>
        <li><span>שיא במתקפת ברק</span><span class="num">${fmt(s.records.lightningBest || 0)}</span></li>
        <li><span>שאלות שממתינות לחזרה</span><span class="num">${fmt(s.reviewQueue.length)}</span></li>
      </ul>
    </div>

    <div class="card">
      <h3 class="parent-h3">דיוק לפי נושא <span class="small-note">(תשובה נכונה בניסיון ראשון)</span></h3>
      ${rows.length ? practiced.map((r) => `
        <div class="acc-row">
          <div class="acc-name">${esc(r.name)}</div>
          ${bar(r.acc)}
          <div class="acc-val num">${r.acc}%</div>
          <div class="acc-count small-note"><span class="num">${fmt(r.answered)}</span> שאלות</div>
        </div>`).join('') : '<p class="small-note">עדיין אין נתונים. אחרי הקרב הראשון יופיע כאן פירוט.</p>'}
    </div>

    ${weakest.length ? `
    <div class="card">
      <h3 class="parent-h3">כדאי לתרגל במיוחד</h3>
      <ol class="weak-list">
        ${weakest.map((r) => `<li><strong>${esc(r.name)}</strong> - דיוק <span class="num">${r.acc}%</span>
          מתוך <span class="num">${fmt(r.answered)}</span> שאלות</li>`).join('')}
      </ol>
      <p class="small-note">אפשר לבחור את האזור המתאים במפת העולם ולתרגל אותו ישירות.</p>
    </div>` : ''}

    ${untouched.length ? `
    <div class="card">
      <h3 class="parent-h3">נושאים שעדיין לא תורגלו</h3>
      <p>${untouched.map((id) => esc(TOPICS[id].name)).join(' · ')}</p>
    </div>` : ''}`;
}
