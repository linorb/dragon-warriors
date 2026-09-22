// map.js - מפת העולם: כל נושא הוא אזור, עם כוכבי התקדמות

import { TOPICS, REGION_ORDER } from './questions.js';
import { regionStars, accuracyByTopic, reviewCount } from './progress.js';
import { $ } from './ui.js';
import { fmt, esc } from './util.js';

function starsHtml(n) {
  return Array.from({ length: 3 }, (_, i) => `<span class="star ${i < n ? 'on' : ''}">★</span>`).join('');
}

/**
 * ציור המפה.
 * @param {(topicId:string|null)=>void} onPick נקרא עם מזהה נושא, או null לקרב מעורב
 */
export function renderMap(onPick) {
  const acc = accuracyByTopic();
  const queued = reviewCount();

  const cards = REGION_ORDER.map((id) => {
    const t = TOPICS[id];
    if (!t) return '';
    const stars = regionStars(id);
    const a = acc[id];
    const line = a === null || a === undefined
      ? 'עוד לא ביקרת כאן'
      : `דיוק: <span class="num">${fmt(a)}%</span>`;
    return `
      <button class="region-card ${stars === 3 ? 'mastered' : ''}" type="button" data-topic="${id}">
        <span class="region-icon">${t.icon}</span>
        <span class="region-name">${esc(t.region)}</span>
        <span class="region-topic">${esc(t.name)}</span>
        <span class="region-stars">${starsHtml(stars)}</span>
        <span class="region-acc">${line}</span>
      </button>`;
  }).join('');

  $('#map-body').innerHTML = `
    <button class="btn btn-primary btn-xl mixed-btn" type="button" data-topic="">
      <span class="btn-emoji">🌍</span> קרב מעורב - כל הנושאים
    </button>
    <div class="mixed-note">
      בקרב מעורב מגיעות יותר שאלות מהנושאים שבהם קשה יותר${queued ? `, וגם ${fmt(queued)} שאלות לחזרה 🔁` : ''}.
    </div>
    <div class="region-grid">${cards}</div>`;

  $('#map-body').onclick = (e) => {
    const btn = e.target.closest('[data-topic]');
    if (!btn) return;
    onPick(btn.dataset.topic || null);
  };
}
