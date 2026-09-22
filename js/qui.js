// qui.js - רכיבי הממשק של סוגי השאלות השונים.
// כל רכיב מקבל שאלה + ctx, מצייר את עצמו, ומחזיר פסק דין:
//   { status: 'correct' | 'wrong' | 'incomplete' | 'progress', message?, bonus? }

import { fmt, esc, wrapMath } from './util.js';
import { validOpIndices, applyOp, tokensToString } from './exprtokens.js';

/* ============================ עזרי ציור ============================ */

function exprBox(q) {
  const body = esc(q.expr).replace(/\?/g, '<span class="blank">?</span>');
  const dir = q.exprRtl ? 'rtl' : 'ltr';
  const cls = q.exprRtl ? 'expr expr-big expr-rtl' : 'expr expr-big';
  return `<div class="${cls}" dir="${dir}">${body}</div>`;
}

function missionCard(q, canRead) {
  const story = esc(q.story).replace(/\[\[(.+?)\]\]/g, '<span class="key-num">$1</span>');
  const readBtn = canRead ? `<button class="read-btn" type="button" id="btn-read">🔊 הקראה</button>` : '';
  return `
    <div class="mission-card">
      <div class="mission-head">📜 משימה</div>
      <div>${story}</div>
      ${readBtn}
    </div>
    <textarea class="scratchpad" id="scratchpad" placeholder="מקום לחישובים..." aria-label="טיוטה לחישובים"></textarea>`;
}

function instructionLine(q) {
  return `<div class="q-text">${esc(q.instruction)}</div>`;
}

function chest(open) {
  return `
    <svg class="chest ${open ? 'open' : ''}" viewBox="0 0 100 86" aria-hidden="true">
      <g class="chest-lid" transform="${open ? 'translate(0 -16) rotate(-18 14 34)' : ''}">
        <path d="M14 40V32c0-14 16-24 36-24s36 10 36 24v8z" fill="#b57a3a"/>
        <path d="M14 40V32c0-14 16-24 36-24v32z" fill="#cf9550"/>
        <rect x="10" y="38" width="80" height="9" rx="4" fill="#8a5a25"/>
      </g>
      <rect x="12" y="46" width="76" height="32" rx="6" fill="#a86f33"/>
      <rect x="12" y="46" width="76" height="8" fill="#8a5a25"/>
      <rect x="42" y="44" width="16" height="20" rx="4" fill="#ffcc4d"/>
      <circle cx="50" cy="56" r="3.4" fill="#6b4a15"/>
      ${open ? '<g class="chest-coins"><circle cx="34" cy="34" r="7" fill="#ffcc4d"/><circle cx="52" cy="26" r="8" fill="#ffe08a"/><circle cx="68" cy="36" r="6" fill="#ffcc4d"/></g>' : ''}
    </svg>`;
}

/* ============================ 1. תשובה מספרית / משימה ============================ */

function numericUI(q, ctx) {
  return {
    usesKeypad: true,
    usesSubmit: true,
    mount(host) {
      host.innerHTML = instructionLine(q) + (q.ui === 'mission' ? missionCard(q, ctx.canRead) : exprBox(q));
      const btn = host.querySelector('#btn-read');
      if (btn) btn.onclick = () => ctx.speak(q.story.replace(/\[\[|\]\]/g, ''));
    },
    submit() {
      const v = ctx.keypad.value();
      if (v === null) return { status: 'incomplete', message: 'כתבו תשובה ואז לחצו בדיקה 🙂' };
      return v === q.answer ? { status: 'correct' } : { status: 'wrong' };
    },
    lock() { ctx.keypad.setEnabled(false); },
  };
}

/* ============================ 2. ישר המספרים - השלמה ============================ */

function numberLineFillUI(q, ctx) {
  const blanks = q.stones.map((s, i) => (s.blank ? i : -1)).filter((i) => i >= 0);
  let pos = 0;                       // איזו אבן חסרה ממלאים עכשיו
  const filled = new Set();
  let host = null;

  function draw() {
    const stones = q.stones.map((s, i) => {
      const isBlank = s.blank && !filled.has(i);
      const active = isBlank && i === blanks[pos];
      const label = isBlank ? '?' : fmt(s.value);
      return `
        <div class="nl-cell">
          <div class="nl-hero-slot">${active ? '<span class="nl-hero">⚔️</span>' : ''}</div>
          <div class="stone ${isBlank ? 'blank' : 'filled'} ${active ? 'active' : ''}">${label}</div>
        </div>`;
    }).join('<div class="nl-gap"></div>');

    host.innerHTML = `${instructionLine(q)}
      <div class="nl-track" dir="ltr">${stones}</div>
      <div class="nl-note">הלוחם קופץ מאבן לאבן. כתבו את המספר של האבן המסומנת.</div>`;
  }

  return {
    usesKeypad: true,
    usesSubmit: true,
    mount(el) { host = el; draw(); },
    submit() {
      const v = ctx.keypad.value();
      if (v === null) return { status: 'incomplete', message: 'כתבו את המספר של האבן המסומנת 🙂' };
      const idx = blanks[pos];
      if (v !== q.stones[idx].value) return { status: 'wrong' };

      filled.add(idx);
      pos += 1;
      draw();
      if (pos >= blanks.length) return { status: 'correct' };
      ctx.keypad.reset(q.unit);
      return { status: 'progress', message: 'יופי! עכשיו האבן הבאה 🪨' };
    },
    lock() {
      blanks.forEach((i) => filled.add(i));
      draw();
      ctx.keypad.setEnabled(false);
    },
  };
}

/* ============================ 3. ישר המספרים - איתור מיקום ============================ */

function numberLineLocateUI(q, ctx) {
  let chosen = -1;
  let host = null;

  function draw() {
    const ticks = q.stones.map((s, i) => `
      <button class="nl-tick ${chosen === i ? 'chosen' : ''}" type="button" data-i="${i}">
        <span class="nl-hero-slot">${chosen === i ? '<span class="nl-hero">⚔️</span>' : ''}</span>
        <span class="nl-mark"></span>
        <span class="nl-label">${s.blank ? '' : fmt(s.value)}</span>
      </button>`).join('');

    host.innerHTML = `${instructionLine(q)}
      <div class="nl-target">היכן נמצא <span class="num">${fmt(q.target)}</span>?</div>
      <div class="nl-axis" dir="ltr">${ticks}</div>`;

    host.querySelectorAll('[data-i]').forEach((b) => {
      b.onclick = () => { chosen = Number(b.dataset.i); draw(); };
    });
  }

  return {
    usesKeypad: false,
    usesSubmit: true,
    mount(el) { host = el; draw(); },
    submit() {
      if (chosen < 0) return { status: 'incomplete', message: 'בחרו מקום על הציר 🙂' };
      return chosen === q.correctIndex ? { status: 'correct' } : { status: 'wrong' };
    },
    lock() {
      chosen = q.correctIndex;
      draw();
      host.querySelectorAll('[data-i]').forEach((b) => { b.disabled = true; });
    },
  };
}

/* ============================ 4. סדר פעולות - הקשה ============================ */

function orderOpsUI(q, ctx) {
  let tokens = q.tokens.map((t) => ({ ...t }));
  const done = [];
  let host = null;
  let locked = false;

  function draw(flashIndex = -1) {
    const chips = tokens.map((t, i) => {
      if (t.t === 'n') return `<span class="tok tok-num">${fmt(t.v)}</span>`;
      if (t.t === 'p') return `<span class="tok tok-paren">${t.v}</span>`;
      return `<button class="tok tok-op ${flashIndex === i ? 'tok-bad' : ''}" type="button" data-op="${i}" ${locked ? 'disabled' : ''}>${t.v}</button>`;
    }).join('');

    host.innerHTML = `${instructionLine(q)}
      <div class="tok-row" dir="ltr">${chips}</div>
      ${done.length ? `<div class="tok-log">${done.map((d) => `<div class="mathrun" dir="ltr">${esc(d)}</div>`).join('')}</div>` : ''}
      <div class="nl-note">לוחצים על הפעולה שצריך לחשב ראשונה, והיא מתכווצת לתוצאה.</div>`;

    host.querySelectorAll('[data-op]').forEach((b) => {
      b.onclick = () => onTap(Number(b.dataset.op));
    });
  }

  function onTap(i) {
    if (locked) return;
    const valid = validOpIndices(tokens);
    if (!valid.includes(i)) {
      draw(i);
      setTimeout(() => draw(), 450);
      ctx.verdict({ status: 'wrong', message: 'זו לא הפעולה הראשונה. איזו פעולה חזקה יותר?' });
      return;
    }
    const r = applyOp(tokens, i);
    tokens = r.tokens;
    done.push(r.text);
    draw();
    if (tokens.length === 1) {
      locked = true;
      draw();
      ctx.verdict({ status: 'correct', message: `פתרת לפי הסדר הנכון! התוצאה: ${fmt(tokens[0].v)}` });
    }
  }

  return {
    usesKeypad: false,
    usesSubmit: false,
    mount(el) { host = el; draw(); },
    submit() { return { status: 'incomplete', message: 'לחצו על הפעולה שמחשבים קודם.' }; },
    lock() {
      locked = true;
      draw();
    },
  };
}

/* ============================ 5. פילוג - חיתוך בחרב ============================ */

function distributeUI(q, ctx) {
  let split = null;
  let host = null;

  function draw() {
    const chips = q.splits.map(([x, y], i) => `
      <button class="split-chip ${split === i ? 'chosen' : ''}" type="button" data-split="${i}">
        <span class="mathrun" dir="ltr">${fmt(x)} + ${fmt(y)}</span>
      </button>`).join('');

    let model = '';
    if (split !== null) {
      const [x, y] = q.splits[split];
      model = `
        <div class="area-model" dir="ltr">
          <div class="area-rect" style="flex:${x}">
            <div class="area-top mathrun" dir="ltr">${fmt(x)}</div>
            <div class="area-val mathrun" dir="ltr">${fmt(q.a)} × ${fmt(x)} = ${fmt(q.a * x)}</div>
          </div>
          <div class="area-rect alt" style="flex:${y}">
            <div class="area-top mathrun" dir="ltr">${fmt(y)}</div>
            <div class="area-val mathrun" dir="ltr">${fmt(q.a)} × ${fmt(y)} = ${fmt(q.a * y)}</div>
          </div>
          <div class="area-side mathrun" dir="ltr">${fmt(q.a)}</div>
        </div>
        <div class="split-sum">עכשיו מחברים: <span class="mathrun" dir="ltr">${fmt(q.a * x)} + ${fmt(q.a * y)} = ?</span></div>`;
    }

    host.innerHTML = `${instructionLine(q)}
      ${exprBox(q)}
      <div class="split-row">⚔️ ${esc(`איך לפצל את ${fmt(q.b)}?`)}</div>
      <div class="split-chips">${chips}</div>
      ${model}`;

    host.querySelectorAll('[data-split]').forEach((b) => {
      b.onclick = () => { split = Number(b.dataset.split); draw(); };
    });
  }

  return {
    usesKeypad: true,
    usesSubmit: true,
    mount(el) { host = el; draw(); },
    submit() {
      if (split === null) return { status: 'incomplete', message: 'קודם בוחרים איך לפצל את המספר ⚔️' };
      const v = ctx.keypad.value();
      if (v === null) return { status: 'incomplete', message: 'כתבו את התוצאה הסופית 🙂' };
      return v === q.answer ? { status: 'correct' } : { status: 'wrong' };
    },
    lock() {
      if (split === null) split = 0;
      draw();
      ctx.keypad.setEnabled(false);
    },
  };
}

/* ============================ 6. סימני התחלקות - תיבת אוצר ============================ */

function divisibilityUI(q, ctx) {
  const chosen = new Set();
  let opened = false;
  let host = null;

  function draw() {
    const numHtml = q.digitsShown.map((d) => (
      d === null
        ? `<span class="digit-slot">${chosen.size ? [...chosen].sort((a, b) => a - b).join('/') : '?'}</span>`
        : `<span class="digit-fixed">${d}</span>`
    )).join('');

    const keys = Array.from({ length: 10 }, (_, d) => `
      <button class="digit-key ${chosen.has(d) ? 'chosen' : ''}" type="button" data-d="${d}">${d}</button>`).join('');

    host.innerHTML = `${instructionLine(q)}
      <div class="div-number" dir="ltr">${numHtml}</div>
      <div class="digit-keys" dir="ltr">${keys}</div>
      <div class="chest-wrap">${chest(opened)}</div>
      <div class="nl-note">אפשר לסמן כמה ספרות. מי שמוצא את כולן מקבל בונוס!</div>`;

    host.querySelectorAll('[data-d]').forEach((b) => {
      b.onclick = () => {
        const d = Number(b.dataset.d);
        if (chosen.has(d)) chosen.delete(d); else chosen.add(d);
        draw();
      };
    });
  }

  return {
    usesKeypad: false,
    usesSubmit: true,
    mount(el) { host = el; draw(); },
    submit() {
      if (!chosen.size) return { status: 'incomplete', message: 'סמנו לפחות ספרה אחת 🙂' };
      const all = [...chosen];
      const bad = all.filter((d) => !q.validDigits.includes(d));
      if (bad.length) {
        return { status: 'wrong', message: `הספרה ${bad[0]} לא מתאימה. נסו שוב.` };
      }
      opened = true;
      draw();
      const foundAll = all.length === q.validDigits.length;
      return {
        status: 'correct',
        bonus: foundAll && q.validDigits.length > 1 ? 5 : 0,
        message: foundAll && q.validDigits.length > 1
          ? `מצאת את כל ${q.validDigits.length} הספרות המתאימות! בונוס 🎁`
          : '',
      };
    },
    lock() {
      q.validDigits.forEach((d) => chosen.add(d));
      opened = true;
      draw();
      host.querySelectorAll('[data-d]').forEach((b) => { b.disabled = true; });
    },
  };
}

/* ============================ 7. שאלות הסבר (תובנה / חולצות) ============================ */

function explainUI(q, ctx) {
  let stage = 1;
  let choice = null;      // שלב 1 מסוג בחירה
  let optionPick = -1;    // שלב 2
  let host = null;

  function draw() {
    const head = q.story
      ? missionCard(q, ctx.canRead)
      : `${q.given ? `<div class="given-box">תרגיל פתור: <span class="mathrun" dir="ltr">${esc(q.given)}</span></div>` : ''}
         ${q.stage1.prompt ? `<div class="expr expr-big" dir="ltr">${esc(q.stage1.prompt).replace(/\?/g, '<span class="blank">?</span>')}</div>` : ''}`;

    let body = '';
    if (stage === 1 && q.stage1.kind === 'choice') {
      body = `<div class="choice-row">${q.stage1.choices.map((c, i) => `
        <button class="choice-btn ${choice === i ? 'chosen' : ''}" type="button" data-c="${i}">${esc(c)}</button>`).join('')}</div>`;
    } else if (stage === 2) {
      body = `
        <div class="explain-q">${esc(q.explainQuestion)}</div>
        <div class="explain-options">${q.options.map((o, i) => `
          <button class="explain-btn ${optionPick === i ? 'chosen' : ''}" type="button" data-o="${i}">${wrapMath(esc(o.text))}</button>`).join('')}</div>`;
    }

    host.innerHTML = `${instructionLine(q)}${head}${body}`;

    const readBtn = host.querySelector('#btn-read');
    if (readBtn) readBtn.onclick = () => ctx.speak(q.story.replace(/\[\[|\]\]/g, ''));
    host.querySelectorAll('[data-c]').forEach((b) => {
      b.onclick = () => { choice = Number(b.dataset.c); draw(); };
    });
    host.querySelectorAll('[data-o]').forEach((b) => {
      b.onclick = () => { optionPick = Number(b.dataset.o); draw(); };
    });
  }

  return {
    usesKeypad: q.stage1.kind === 'numeric',
    usesSubmit: true,
    mount(el) { host = el; draw(); },
    submit() {
      if (stage === 1) {
        let ok;
        if (q.stage1.kind === 'numeric') {
          const v = ctx.keypad.value();
          if (v === null) return { status: 'incomplete', message: 'כתבו תשובה ואז לחצו בדיקה 🙂' };
          ok = v === q.answer;
        } else {
          if (choice === null) return { status: 'incomplete', message: 'בחרו תשובה 🙂' };
          ok = q.stage1.choices[choice] === q.answer;
        }
        if (!ok) return { status: 'wrong' };
        stage = 2;
        ctx.setKeypad(false);
        draw();
        return { status: 'progress', message: 'נכון! ועכשיו החלק החשוב - למה? 🤔' };
      }

      if (optionPick < 0) return { status: 'incomplete', message: 'בחרו את ההסבר הנכון 🙂' };
      return q.options[optionPick].correct
        ? { status: 'correct' }
        : { status: 'wrong', message: 'ההסבר הזה נשמע הגיוני, אבל הוא לא מדויק.' };
    },
    lock() {
      if (stage === 2) optionPick = q.options.findIndex((o) => o.correct);
      draw();
      host.querySelectorAll('button[data-c],button[data-o]').forEach((b) => { b.disabled = true; });
      ctx.keypad.setEnabled(false);
    },
  };
}

/* ============================ בחירת הרכיב ============================ */

const REGISTRY = {
  numeric: numericUI,
  mission: numericUI,
  numberline_fill: numberLineFillUI,
  numberline_locate: numberLineLocateUI,
  orderops: orderOpsUI,
  distribute: distributeUI,
  divisibility: divisibilityUI,
  explain: explainUI,
};

export function createQuestionUI(q, ctx) {
  const factory = REGISTRY[q.ui] || numericUI;
  return factory(q, ctx);
}

export const SUPPORTED_UIS = Object.keys(REGISTRY);
