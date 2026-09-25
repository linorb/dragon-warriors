// qui.js - רכיבי הממשק של סוגי השאלות השונים.
// כל רכיב מקבל שאלה + ctx, מצייר את עצמו, ומחזיר פסק דין:
//   { status: 'correct' | 'wrong' | 'incomplete' | 'progress', message?, bonus? }

import { fmt, esc, wrapMath } from './util.js';
import { validOpIndices, applyOp } from './exprtokens.js';
import { toXY, rectDims, checkGoal } from './geometry.js';

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

/* ============================ טיוטת פילוג ============================ */
// שורות לחישובי ביניים מתחת לתרגיל (למשל 56 × 6 = 50 × 6 + 6 × 6).
// זו טיוטה בלבד - לא נבדקת. שורה שחושבה נכון נצבעת בירוק כעידוד.

const PAD_ROWS = [['×', (x, y) => x * y], ['×', (x, y) => x * y], ['+', (x, y) => x + y]];

function distributePad() {
  const cell = (i, j) => `<input class="pad-in" type="text" inputmode="numeric" maxlength="6"
    data-row="${i}" data-col="${j}" aria-label="טיוטה">`;
  const rows = PAD_ROWS.map(([op], i) => `
    <div class="pad-row" data-row="${i}">
      ${cell(i, 0)}<span class="pad-op">${op}</span>${cell(i, 1)}<span class="pad-op">=</span>${cell(i, 2)}
    </div>`).join('');
  return `
    <div class="dist-pad">
      <div class="pad-title">✏️ מקום לחישובים - פרקו את התרגיל לחלקים ואז חברו:</div>
      <div class="pad-rows" dir="ltr">${rows}</div>
    </div>`;
}

function wireDistributePad(host) {
  const pad = host.querySelector('.dist-pad');
  if (!pad) return;
  pad.addEventListener('input', (e) => {
    const inp = e.target.closest('.pad-in');
    if (!inp) return;
    inp.value = inp.value.replace(/[^\d]/g, '');
    const i = Number(inp.dataset.row);
    const vals = [...pad.querySelectorAll(`.pad-in[data-row="${i}"]`)].map((x) => (x.value === '' ? null : Number(x.value)));
    const ok = vals.every((v) => v !== null) && PAD_ROWS[i][1](vals[0], vals[1]) === vals[2];
    pad.querySelector(`.pad-row[data-row="${i}"]`).classList.toggle('ok', ok);
  });
}

/* ============================ 1. תשובה מספרית / משימה ============================ */

function numericUI(q, ctx) {
  const withPad = q.topic === 'mult_big' && q.ui !== 'mission';
  return {
    usesKeypad: true,
    usesSubmit: true,
    mount(host) {
      host.innerHTML = instructionLine(q)
        + (q.ui === 'mission' ? missionCard(q, ctx.canRead) : exprBox(q))
        + (withPad ? distributePad() : '');
      const btn = host.querySelector('#btn-read');
      if (btn) btn.onclick = () => ctx.speak(q.story.replace(/\[\[|\]\]/g, ''));
      if (withPad) wireDistributePad(host);
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

/* ============================ ציור שברים ============================ */

let quiSeq = 0;
const uid = () => `q${++quiSeq}`;

/** צורה אחת מחולקת לחלקים. filled = מערך בוליאני */
function fracShape(kind, parts, filled, offset, interactive) {
  const id = uid();
  const cells = [];
  const fillOf = (i) => (filled[offset + i] ? 'var(--gold)' : 'rgba(255,255,255,.08)');

  if (kind === 'pizza') {
    for (let i = 0; i < parts; i++) {
      const a0 = (-90 + (i * 360) / parts) * (Math.PI / 180);
      const a1 = (-90 + ((i + 1) * 360) / parts) * (Math.PI / 180);
      const x0 = 50 + 44 * Math.cos(a0); const y0 = 50 + 44 * Math.sin(a0);
      const x1 = 50 + 44 * Math.cos(a1); const y1 = 50 + 44 * Math.sin(a1);
      const large = 360 / parts > 180 ? 1 : 0;
      const d = parts === 1
        ? 'M50 6 A44 44 0 1 1 49.9 6 Z'
        : `M50 50 L${x0.toFixed(2)} ${y0.toFixed(2)} A44 44 0 ${large} 1 ${x1.toFixed(2)} ${y1.toFixed(2)} Z`;
      cells.push(`<path d="${d}" fill="${fillOf(i)}" stroke="#2a1a3d" stroke-width="2"
        ${interactive ? `data-part="${offset + i}" class="frac-part"` : ''}/>`);
    }
    return `<svg class="frac-shape" viewBox="0 0 100 100">${cells.join('')}</svg>`;
  }

  if (kind === 'shield') {
    const band = 96 / parts;
    for (let i = 0; i < parts; i++) {
      cells.push(`<rect x="2" y="${(2 + i * band).toFixed(2)}" width="96" height="${band.toFixed(2)}"
        fill="${fillOf(i)}" stroke="#2a1a3d" stroke-width="1.5"
        ${interactive ? `data-part="${offset + i}" class="frac-part"` : ''}/>`);
    }
    return `<svg class="frac-shape" viewBox="0 0 100 100">
      <defs><clipPath id="sh${id}">
        <path d="M50 3C28 10 14 13 10 14v40c0 24 18 38 40 44 22-6 40-20 40-44V14c-4-1-18-4-40-11z"/>
      </clipPath></defs>
      <g clip-path="url(#sh${id})">${cells.join('')}</g>
      <path d="M50 3C28 10 14 13 10 14v40c0 24 18 38 40 44 22-6 40-20 40-44V14c-4-1-18-4-40-11z"
            fill="none" stroke="#ffcc4d" stroke-width="3"/>
    </svg>`;
  }

  const w = 96 / parts;
  for (let i = 0; i < parts; i++) {
    cells.push(`<rect x="${(2 + i * w).toFixed(2)}" y="18" width="${w.toFixed(2)}" height="64" rx="2"
      fill="${fillOf(i)}" stroke="#2a1a3d" stroke-width="2"
      ${interactive ? `data-part="${offset + i}" class="frac-part"` : ''}/>`);
  }
  return `<svg class="frac-shape" viewBox="0 0 100 100">${cells.join('')}</svg>`;
}

function fracText(num, den) {
  return `<span class="frac"><span class="frac-num">${fmt(num)}</span><span class="frac-den">${fmt(den)}</span></span>`;
}

/* ============================ 8. צביעת שבר ============================ */

function fracColorUI(q, ctx) {
  const total = q.shapes * q.parts;
  const filled = new Array(total).fill(false);
  let stage = 1;
  let host = null;

  function draw() {
    const shapes = Array.from({ length: q.shapes }, (_, s) =>
      `<div class="frac-shape-wrap">${fracShape(q.shapeKind, q.parts, filled, s * q.parts, stage === 1)}</div>`).join('');

    const count = filled.filter(Boolean).length;
    host.innerHTML = `${instructionLine(q)}
      <div class="frac-goal">צריך לצבוע: ${fracText(q.fraction.num, q.fraction.den)}</div>
      <div class="frac-shapes">${shapes}</div>
      <div class="frac-count">צבועים: <span class="num">${fmt(count)}</span> חלקים</div>
      ${stage === 2 ? `<div class="followup">${esc(q.followUp.prompt)}</div>` : ''}`;

    host.querySelectorAll('[data-part]').forEach((el) => {
      el.onclick = () => {
        const i = Number(el.dataset.part);
        filled[i] = !filled[i];
        draw();
      };
    });
  }

  return {
    usesKeypad: false,
    usesSubmit: true,
    mount(el) { host = el; draw(); },
    submit() {
      if (stage === 1) {
        const count = filled.filter(Boolean).length;
        if (count === 0) return { status: 'incomplete', message: 'לחצו על החלקים כדי לצבוע אותם 🎨' };
        if (count !== q.target) return { status: 'wrong' };
        if (!q.followUp) return { status: 'correct' };
        stage = 2;
        ctx.setKeypad(true);
        ctx.keypad.reset('');
        draw();
        return { status: 'progress', message: 'יפה! עכשיו נספור כמה שלמים יצאו 🍕' };
      }
      const v = ctx.keypad.value();
      if (v === null) return { status: 'incomplete', message: 'כתבו תשובה ואז לחצו בדיקה 🙂' };
      return v === q.followUp.answer ? { status: 'correct' } : { status: 'wrong' };
    },
    lock() {
      for (let i = 0; i < total; i++) filled[i] = i < q.target;
      draw();
      ctx.keypad.setEnabled(false);
    },
  };
}

/* ============================ 9. מיון שברים לתיבות ============================ */

function fracSortUI(q, ctx) {
  const placed = q.cards.map(() => -1);   // -1 = עדיין בערמה
  let host = null;

  function draw() {
    const pool = q.cards.map((c, i) => (placed[i] === -1
      ? `<button class="frac-card" type="button" data-card="${i}">${fracText(c.num, c.den)}</button>` : '')).join('');

    const bin = (b) => q.cards.map((c, i) => (placed[i] === b
      ? `<button class="frac-card in-bin" type="button" data-card="${i}">${fracText(c.num, c.den)}</button>` : '')).join('');

    host.innerHTML = `${instructionLine(q)}
      <div class="sort-pool">${pool || '<span class="nl-note">כל הקלפים מוינו 👍</span>'}</div>
      <div class="sort-bins">
        ${[0, 1].map((b) => `
          <div class="sort-bin">
            <div class="bin-label">${esc(q.bins[b])}</div>
            <div class="bin-items">${bin(b)}</div>
            ${chest(false)}
          </div>`).join('')}
      </div>
      <div class="nl-note">לחיצה על קלף מעבירה אותו לתיבה הבאה.</div>`;

    host.querySelectorAll('[data-card]').forEach((el) => {
      el.onclick = () => {
        const i = Number(el.dataset.card);
        placed[i] = placed[i] === -1 ? 0 : placed[i] === 0 ? 1 : -1;
        draw();
      };
    });
  }

  return {
    usesKeypad: false,
    usesSubmit: true,
    mount(el) { host = el; draw(); },
    submit() {
      if (placed.some((p) => p === -1)) {
        return { status: 'incomplete', message: 'צריך למיין את כל הקלפים 🙂' };
      }
      const wrong = q.cards.filter((c, i) => c.bin !== placed[i]).length;
      if (wrong) return { status: 'wrong', message: `${wrong} קלפים עדיין בתיבה הלא נכונה.` };
      return { status: 'correct' };
    },
    lock() {
      q.cards.forEach((c, i) => { placed[i] = c.bin; });
      draw();
      host.querySelectorAll('[data-card]').forEach((b) => { b.disabled = true; });
    },
  };
}

/* ============================ 10. חיבור שברים ============================ */

function fracAddUI(q, ctx) {
  let host = null;

  function bar(num, den, cls) {
    const w = 100 / den;
    const cells = Array.from({ length: den }, (_, i) =>
      `<div class="fb-cell ${i < num ? cls : ''}" style="width:${w}%"></div>`).join('');
    return `<div class="frac-bar">${cells}</div>`;
  }

  function draw() {
    const missingMark = '<span class="frac"><span class="frac-num blank">?</span><span class="frac-den">' + fmt(q.den) + '</span></span>';
    const rightPart = q.missing === 'right' ? missingMark : fracText(q.right, q.den);
    const totalPart = q.missing === 'result' ? missingMark : fracText(q.total, q.den);

    host.innerHTML = `${instructionLine(q)}
      <div class="frac-eq" dir="ltr">
        ${fracText(q.left, q.den)}<span class="frac-op">+</span>${rightPart}<span class="frac-op">=</span>${totalPart}
      </div>
      <div class="frac-bars">
        ${bar(q.left, q.den, 'fill-a')}
        ${q.missing === 'right' ? '' : bar(q.right, q.den, 'fill-b')}
      </div>
      <div class="nl-note">כשהמכנים זהים מחברים רק את המונים.</div>`;
  }

  return {
    usesKeypad: true,
    usesSubmit: true,
    mount(el) { host = el; draw(); },
    submit() {
      const v = ctx.keypad.value();
      if (v === null) return { status: 'incomplete', message: 'כתבו את המונה החסר 🙂' };
      return v === q.answer ? { status: 'correct' } : { status: 'wrong' };
    },
    lock() { ctx.keypad.setEnabled(false); },
  };
}

/* ============================ 11. שאלת בחירה ============================ */

function quizUI(q, ctx) {
  let picked = -1;
  let host = null;

  function figureHtml() {
    if (!q.figure) return '';
    if (q.figure.kind === 'fraction') {
      const f = q.figure;
      const filled = Array.from({ length: f.shapes * f.parts }, (_, i) => i < f.filled);
      const shapes = Array.from({ length: f.shapes }, (_, s) =>
        `<div class="frac-shape-wrap">${fracShape(f.shapeKind, f.parts, filled, s * f.parts, false)}</div>`).join('');
      return `<div class="frac-shapes">${shapes}</div>`;
    }
    return '';
  }

  function draw() {
    host.innerHTML = `${instructionLine(q)}${figureHtml()}
      <div class="explain-options">${q.options.map((o, i) => `
        <button class="explain-btn ${picked === i ? 'chosen' : ''}" type="button" data-o="${i}">${wrapMath(esc(o.text))}</button>`).join('')}</div>`;
    host.querySelectorAll('[data-o]').forEach((b) => {
      b.onclick = () => { picked = Number(b.dataset.o); draw(); };
    });
  }

  return {
    usesKeypad: false,
    usesSubmit: true,
    mount(el) { host = el; draw(); },
    submit() {
      if (picked < 0) return { status: 'incomplete', message: 'בחרו תשובה 🙂' };
      return q.options[picked].correct ? { status: 'correct' } : { status: 'wrong' };
    },
    lock() {
      picked = q.options.findIndex((o) => o.correct);
      draw();
      host.querySelectorAll('[data-o]').forEach((b) => { b.disabled = true; });
    },
  };
}

/* ============================ 12. דיאגרמת עמודות ============================ */

function chartUI(q, ctx) {
  let host = null;

  // SVG עם ציר וקווי רשת, כך שגובה כל עמודה יחסי בדיוק לערך שלה.
  // הציר בצד ימין והעמודה הראשונה מימין - כמו בקריאה בעברית.
  const COLORS = ['#59a9ff', '#b57bff', '#ffcc4d', '#4ddb8b', '#ff9d5c'];
  const W = 360, H = 240, TOP = 18, BOTTOM = 200, LEFT = 10, RIGHT = 318;

  function draw() {
    const { labels, values, unit } = q.chart;
    const axisMax = Math.max(10, Math.ceil(Math.max(...values) / 10) * 10);
    const step = axisMax <= 60 ? 5 : axisMax <= 120 ? 10 : Math.ceil(axisMax / 100) * 10;
    const y = (v) => BOTTOM - (v / axisMax) * (BOTTOM - TOP);

    let grid = '';
    for (let v = 0; v <= axisMax; v += step) {
      const major = v % (step * 2) === 0;
      grid += `<line class="ch-grid ${major ? 'major' : ''}" x1="${LEFT}" x2="${RIGHT}" y1="${y(v)}" y2="${y(v)}"/>`;
      if (major) grid += `<text class="ch-tick" x="${RIGHT + 8}" y="${y(v) + 5}">${fmt(v)}</text>`;
    }

    const n = values.length;
    const slot = (RIGHT - LEFT) / n;
    const bw = Math.min(56, slot * 0.62);
    const bars = values.map((v, i) => {
      const cx = RIGHT - slot * (i + 0.5);
      return `
        <rect x="${cx - bw / 2}" y="${y(v)}" width="${bw}" height="${BOTTOM - y(v)}" rx="5" fill="${COLORS[i % COLORS.length]}"/>
        <text class="ch-val" x="${cx}" y="${y(v) - 6}">${fmt(v)}</text>
        <text class="ch-label" x="${cx}" y="${BOTTOM + 22}">${esc(labels[i])}</text>`;
    }).join('');

    host.innerHTML = `${instructionLine(q)}
      <div class="chart-unit">${esc(unit)}</div>
      <svg class="bar-chart-svg" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(`דיאגרמת עמודות: ${unit}`)}">
        ${grid}
        <line class="ch-axis" x1="${RIGHT}" x2="${RIGHT}" y1="${TOP - 6}" y2="${BOTTOM}"/>
        <line class="ch-axis" x1="${LEFT}" x2="${RIGHT}" y1="${BOTTOM}" y2="${BOTTOM}"/>
        ${bars}
      </svg>`;
  }

  return {
    usesKeypad: true,
    usesSubmit: true,
    mount(el) { host = el; draw(); },
    submit() {
      const v = ctx.keypad.value();
      if (v === null) return { status: 'incomplete', message: 'כתבו תשובה ואז לחצו בדיקה 🙂' };
      return v === q.answer ? { status: 'correct' } : { status: 'wrong' };
    },
    lock() { ctx.keypad.setEnabled(false); },
  };
}

/* ============================ 13. רשת נקודות - גאומטריה ============================ */

function geoUI(q, ctx) {
  const kind = q.grid.kind;
  const STEP = 34;
  const fixed = (q.fixed || []).map((p) => ({ ...p }));
  let pts = fixed.slice();
  let pickedSide = -1;
  let host = null;
  let locked = false;
  const found = [];

  const XY = (p) => toXY(p, kind, STEP);

  function dots() {
    const out = [];
    for (let r = 0; r <= q.grid.rows; r++) {
      for (let c = 0; c <= q.grid.cols; c++) {
        const p = { c, r };
        const { x, y } = XY(p);
        const used = pts.some((t) => t.c === c && t.r === r);
        const isFixed = fixed.some((t) => t.c === c && t.r === r);
        out.push(`
          <g class="dot-g">
            <circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${used ? 6 : 3.5}"
                    fill="${isFixed ? '#ffcc4d' : used ? '#4ddb8b' : 'rgba(255,255,255,.35)'}"/>
            ${locked || q.mode === 'pick_side' ? '' : `<circle class="dot-hit" cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="15" fill="transparent" data-c="${c}" data-r="${r}"/>`}
          </g>`);
      }
    }
    return out.join('');
  }

  function shapeHtml() {
    if (q.mode === 'pick_side') {
      const cs = q.corners.map(XY);
      const sides = [0, 1, 2, 3].map((i) => {
        const a = cs[i]; const b = cs[(i + 1) % 4];
        const isHi = i === q.highlighted;
        const isPick = i === pickedSide;
        const color = isHi ? '#ffcc4d' : isPick ? '#4ddb8b' : 'rgba(255,255,255,.55)';
        return `<line x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}" stroke="${color}" stroke-width="${isHi || isPick ? 7 : 4}" stroke-linecap="round"/>
          ${isHi || locked ? '' : `<line class="side-hit" x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}" stroke="transparent" stroke-width="26" data-side="${i}"/>`}`;
      }).join('');
      return sides;
    }

    if (pts.length < 2) return '';
    const cs = pts.map(XY);
    const closed = pts.length >= q.points;
    const d = cs.map((p, i) => `${i ? 'L' : 'M'}${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ') + (closed ? ' Z' : '');
    return `<path d="${d}" fill="${closed ? 'rgba(89,169,255,.25)' : 'none'}" stroke="#59a9ff" stroke-width="4" stroke-linejoin="round" stroke-linecap="round"/>`;
  }

  function counters() {
    if (!q.goal || (q.goal.kind !== 'rect_area' && q.goal.kind !== 'rect_perimeter')) return '';
    const d = pts.length === 4 ? rectDims(pts) : null;
    return `<div class="geo-counters">
        <span class="chip-box">שטח: <span class="num">${d ? fmt(d.area) : '—'}</span></span>
        <span class="chip-box">היקף: <span class="num">${d ? fmt(d.perimeter) : '—'}</span></span>
      </div>`;
  }

  function collectionHtml() {
    if (!q.collect) return '';
    const mine = ctx.shapes ? ctx.shapes.list(q.type) : found;
    if (!mine.length) return '';
    return `<div class="collection">האוסף שלך: ${mine.map((s) => `<span class="coll-chip">${esc(s)}</span>`).join('')}</div>`;
  }

  function draw() {
    const w = (q.grid.cols + (kind === 'tri' ? q.grid.rows / 2 : 0)) * STEP;
    const h = (kind === 'tri' ? q.grid.rows * 0.8661 : q.grid.rows) * STEP;
    host.innerHTML = `${instructionLine(q)}
      ${counters()}
      <div class="geo-wrap">
        <svg class="geo-grid" viewBox="${-STEP * 0.6} ${-STEP * 0.6} ${w + STEP * 1.2} ${h + STEP * 1.2}">
          ${shapeHtml()}
          ${dots()}
        </svg>
      </div>
      ${q.mode === 'pick_side' ? '<div class="nl-note">לחצו על הצלע שנראית לכם מקבילה לצלע המודגשת בזהב.</div>' : `
        <div class="geo-tools">
          <button class="btn btn-ghost geo-btn" type="button" data-undo>↩ ביטול נקודה</button>
          <button class="btn btn-ghost geo-btn" type="button" data-clear>נקה הכול</button>
        </div>
        <div class="nl-note">לחצו על נקודות ברשת. צריך ${fmt(q.points)} נקודות${fixed.length ? ` (${fmt(fixed.length)} כבר נתונות)` : ''}.</div>`}
      ${collectionHtml()}`;

    host.querySelectorAll('.dot-hit').forEach((el) => {
      el.onclick = () => {
        if (locked || pts.length >= q.points) return;
        const c = Number(el.dataset.c); const r = Number(el.dataset.r);
        if (pts.some((p) => p.c === c && p.r === r)) return;
        pts.push({ c, r });
        draw();
      };
    });
    host.querySelectorAll('.side-hit').forEach((el) => {
      el.onclick = () => { if (!locked) { pickedSide = Number(el.dataset.side); draw(); } };
    });
    const undo = host.querySelector('[data-undo]');
    if (undo) undo.onclick = () => { if (pts.length > fixed.length) { pts.pop(); draw(); } };
    const clear = host.querySelector('[data-clear]');
    if (clear) clear.onclick = () => { pts = fixed.slice(); draw(); };
  }

  return {
    usesKeypad: false,
    usesSubmit: true,
    mount(el) { host = el; draw(); },
    submit() {
      if (q.mode === 'pick_side') {
        if (pickedSide < 0) return { status: 'incomplete', message: 'לחצו על אחת הצלעות 🙂' };
        return pickedSide === q.answerIndex
          ? { status: 'correct' }
          : { status: 'wrong', message: 'הצלע הזו נוגעת בצלע המודגשת, ולכן היא ניצבת לה ולא מקבילה.' };
      }

      if (pts.length < q.points) {
        return { status: 'incomplete', message: `צריך עוד ${fmt(q.points - pts.length)} נקודות 🙂` };
      }
      const res = checkGoal(pts, q.goal, kind);
      if (!res.ok) return { status: 'wrong', message: res.reason };

      let bonus = 0;
      let message = '';
      if (q.collect && res.label) {
        found.push(res.label);
        if (ctx.shapes && !ctx.shapes.has(q.type, res.label)) {
          ctx.shapes.add(q.type, res.label);
          bonus = 3;
          message = `מלבן ${res.label} נוסף לאוסף שלך! 🏅`;
        } else {
          message = `מלבן ${res.label} - כבר באוסף שלך.`;
        }
      }
      return { status: 'correct', bonus, message };
    },
    lock() {
      locked = true;
      if (q.mode === 'pick_side') pickedSide = q.answerIndex;
      draw();
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
  frac_color: fracColorUI,
  frac_sort: fracSortUI,
  frac_add: fracAddUI,
  quiz: quizUI,
  chart: chartUI,
  geo: geoUI,
};

export function createQuestionUI(q, ctx) {
  const factory = REGISTRY[q.ui] || numericUI;
  return factory(q, ctx);
}

export const SUPPORTED_UIS = Object.keys(REGISTRY);
