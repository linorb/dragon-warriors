// main.js - נקודת הכניסה: יצירת לוחם, ניווט בין המסכים, גיבוי ושחזור

import {
  update, hasProfile, resetAll, exportText, importText, downloadBackup, isStorageAvailable,
} from './storage.js';
import {
  $, showScreen, backTarget, updateHUD, toast, modal, renderHome, renderShop, renderArmory,
  renderColorPicker, refreshStorageWarning, answerInput,
} from './ui.js';
import { mountAvatar, COLOR_CHOICES } from './avatar.js';
import { startBattle, bindBattleButtons } from './battle.js';

/* ============================ יצירת לוחם ============================ */

let onbColor = COLOR_CHOICES[0].id;

function drawOnbPreview() {
  mountAvatar($('#onb-avatar'), {
    color: onbColor,
    equipped: {},
    dragonStage: 0,
    name: $('#inp-warrior').value || 'הלוחם',
  });
}

function pickColor(c) {
  onbColor = c;
  renderColorPicker(onbColor, pickColor);
  drawOnbPreview();
}

function initOnboarding() {
  renderColorPicker(onbColor, pickColor);
  drawOnbPreview();

  $('#inp-warrior').addEventListener('input', drawOnbPreview);

  $('#btn-start').addEventListener('click', () => {
    const name = $('#inp-warrior').value.trim();
    const dragonName = $('#inp-dragon').value.trim();
    const err = $('#onb-error');
    if (!name) {
      err.textContent = 'צריך לבחור שם ללוחם 🙂';
      err.hidden = false;
      $('#inp-warrior').focus();
      return;
    }
    if (!dragonName) {
      err.textContent = 'צריך לבחור שם לדרקון 🐉';
      err.hidden = false;
      $('#inp-dragon').focus();
      return;
    }
    err.hidden = true;
    update((s) => {
      s.player.name = name;
      s.player.dragonName = dragonName;
      s.player.color = onbColor;
      s.player.coins = 30; // מתנת פתיחה כדי שאפשר יהיה לקנות פריט ראשון
    });
    goHome();
    toast(`ברוך הבא, ${name}! ${dragonName} כבר מחכה לך 🐉`);
  });
}

/* ============================ ניווט ============================ */

function goHome() {
  renderHome();
  showScreen('home');
}

function initNav() {
  $('#btn-back').addEventListener('click', () => {
    const t = backTarget();
    if (t === 'home') goHome();
    else showScreen(t);
  });

  $('#btn-battle').addEventListener('click', () => startBattle());

  $('#btn-shop').addEventListener('click', () => {
    renderShop(() => renderHome());
    showScreen('shop');
  });

  $('#btn-armory').addEventListener('click', () => {
    renderArmory();
    showScreen('armory');
  });

  $('#btn-settings').addEventListener('click', () => {
    refreshStorageWarning();
    showScreen('settings');
  });

  $('#btn-summary-home').addEventListener('click', goHome);
  $('#btn-summary-shop').addEventListener('click', () => {
    renderShop(() => renderHome());
    showScreen('shop');
  });
}

/* ============================ גיבוי ושחזור ============================ */

function initBackup() {
  $('#btn-export').addEventListener('click', () => {
    try {
      downloadBackup();
      toast('קובץ הגיבוי ירד למחשב ✔');
    } catch (e) {
      toast('לא הצלחנו להוריד קובץ. נסו את הגיבוי כטקסט.');
    }
  });

  $('#btn-import').addEventListener('click', () => $('#file-import').click());

  $('#file-import').addEventListener('change', (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      const ok = await modal({
        title: 'שחזור מגיבוי',
        body: 'השחזור יחליף את ההתקדמות הנוכחית בזו שבקובץ. להמשיך?',
        okText: 'שחזור',
      });
      if (!ok) { e.target.value = ''; return; }
      const res = importText(String(reader.result));
      if (res.ok) {
        toast('ההתקדמות שוחזרה בהצלחה ✔');
        updateHUD();
        goHome();
      } else {
        toast(res.error);
      }
      e.target.value = '';
    };
    reader.onerror = () => toast('לא הצלחנו לקרוא את הקובץ.');
    reader.readAsText(file);
  });

  $('#btn-copy-save').addEventListener('click', async () => {
    const ta = $('#save-text');
    ta.value = exportText();
    ta.hidden = false;
    $('#save-text-actions').hidden = true;
    ta.select();
    try {
      await navigator.clipboard.writeText(ta.value);
      toast('הגיבוי הועתק. הדביקו אותו במקום בטוח 📋');
    } catch (e) {
      toast('סמנו את הטקסט והעתיקו ידנית (Ctrl+C)');
    }
  });

  $('#btn-paste-save').addEventListener('click', () => {
    const ta = $('#save-text');
    ta.value = '';
    ta.hidden = false;
    ta.placeholder = 'הדביקו כאן את טקסט הגיבוי';
    $('#save-text-actions').hidden = false;
    ta.focus();
  });

  $('#btn-paste-cancel').addEventListener('click', () => {
    $('#save-text').hidden = true;
    $('#save-text-actions').hidden = true;
  });

  $('#btn-paste-apply').addEventListener('click', async () => {
    const text = $('#save-text').value.trim();
    if (!text) { toast('אין טקסט לשחזור.'); return; }
    const ok = await modal({
      title: 'שחזור מטקסט',
      body: 'השחזור יחליף את ההתקדמות הנוכחית. להמשיך?',
      okText: 'שחזור',
    });
    if (!ok) return;
    const res = importText(text);
    if (res.ok) {
      $('#save-text').hidden = true;
      $('#save-text-actions').hidden = true;
      toast('ההתקדמות שוחזרה בהצלחה ✔');
      updateHUD();
      goHome();
    } else {
      toast(res.error);
    }
  });

  $('#btn-reset').addEventListener('click', async () => {
    const ok = await modal({
      title: 'איפוס ההתקדמות',
      body: 'כל המטבעות, הציוד וההתקדמות יימחקו לצמיתות. האם אתם בטוחים?<br><strong>מומלץ לעשות גיבוי לפני!</strong>',
      okText: 'כן, למחוק הכל',
      cancelText: 'ביטול',
    });
    if (!ok) return;
    resetAll();
    updateHUD();
    toast('ההתקדמות אופסה.');
    location.reload();
  });
}

/* ============================ הפעלה ============================ */

function boot() {
  answerInput.init();
  bindBattleButtons();
  initNav();
  initBackup();
  initOnboarding();
  refreshStorageWarning();
  updateHUD();

  if (hasProfile()) {
    goHome();
  } else {
    showScreen('onboarding');
  }

  if (!isStorageAvailable()) {
    console.warn('[dragon-warriors] localStorage לא זמין - ההתקדמות תישמר רק בזיכרון.');
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot);
} else {
  boot();
}
