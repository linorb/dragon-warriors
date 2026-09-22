// monsters.js - מפלצות מקוריות לקרבות, מצוירות ב-SVG

const svg = (inner) => `<svg viewBox="0 0 200 180" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">${inner}</svg>`;

const eyes = (x1, x2, y, r = 9, pupil = '#2a1a3d') => `
  <circle cx="${x1}" cy="${y}" r="${r}" fill="#fff"/>
  <circle cx="${x1 + 1}" cy="${y + 1}" r="${r * 0.5}" fill="${pupil}"/>
  <circle cx="${x2}" cy="${y}" r="${r}" fill="#fff"/>
  <circle cx="${x2 + 1}" cy="${y + 1}" r="${r * 0.5}" fill="${pupil}"/>`;

export const MONSTERS = [
  {
    id: 'stone_golem',
    name: 'גולם האבן',
    art: () => svg(`
      <ellipse cx="100" cy="168" rx="58" ry="9" fill="rgba(0,0,0,.3)"/>
      <rect x="46" y="60" width="108" height="98" rx="26" fill="#7d8b99"/>
      <rect x="60" y="74" width="80" height="60" rx="18" fill="#9dabb9"/>
      <path d="M46 96l-18 12 18 14zM154 96l18 12-18 14z" fill="#68757f"/>
      ${eyes(82, 120, 100, 10)}
      <path d="M82 126h36" stroke="#3f4a54" stroke-width="6" stroke-linecap="round"/>
      <path d="M70 60l10-18 10 18zM110 60l10-18 10 18z" fill="#68757f"/>
    `),
  },
  {
    id: 'shadow_bat',
    name: 'עטלף הצללים',
    art: () => svg(`
      <ellipse cx="100" cy="168" rx="46" ry="8" fill="rgba(0,0,0,.3)"/>
      <path d="M72 88C44 62 20 62 8 74c14 6 18 18 14 32 20 10 42 4 50-18z" fill="#4b3a72"/>
      <path d="M128 88c28-26 52-26 64-14-14 6-18 18-14 32-20 10-42 4-50-18z" fill="#4b3a72"/>
      <ellipse cx="100" cy="104" rx="34" ry="42" fill="#5f4a8f"/>
      <ellipse cx="100" cy="112" rx="20" ry="26" fill="#7b62b3"/>
      <path d="M76 66l-6-26 22 16zM124 66l6-26-22 16z" fill="#5f4a8f"/>
      ${eyes(88, 114, 92, 9, '#ffcc4d')}
      <path d="M90 118l6 10 6-10 6 10 6-10" stroke="#2e2450" stroke-width="4" fill="none" stroke-linecap="round"/>
    `),
  },
  {
    id: 'spike_grub',
    name: 'זחל הקוצים',
    art: () => svg(`
      <ellipse cx="100" cy="168" rx="62" ry="9" fill="rgba(0,0,0,.3)"/>
      <path d="M40 120l10-22 10 22zM64 112l10-26 10 26zM92 108l10-28 10 28zM122 114l10-24 10 24z" fill="#3f9d63"/>
      <ellipse cx="62" cy="134" rx="26" ry="24" fill="#59c983"/>
      <ellipse cx="100" cy="132" rx="28" ry="26" fill="#59c983"/>
      <ellipse cx="140" cy="134" rx="26" ry="24" fill="#59c983"/>
      <ellipse cx="140" cy="128" rx="22" ry="20" fill="#7ee0a3"/>
      ${eyes(132, 152, 124, 8)}
      <path d="M132 146c6 5 14 5 20 0" stroke="#237a49" stroke-width="4" fill="none" stroke-linecap="round"/>
    `),
  },
  {
    id: 'storm_spirit',
    name: 'רוח הסופה',
    art: () => svg(`
      <ellipse cx="100" cy="168" rx="44" ry="8" fill="rgba(0,0,0,.25)"/>
      <path d="M100 30c34 0 58 22 58 52 0 34-26 58-58 58s-58-24-58-58c0-30 24-52 58-52z" fill="#5aa6d8" opacity=".85"/>
      <path d="M100 44c26 0 44 16 44 38 0 26-20 44-44 44s-44-18-44-44c0-22 18-38 44-38z" fill="#8fd0f2" opacity=".8"/>
      ${eyes(84, 118, 88, 10, '#1d3b55')}
      <path d="M96 108c4 8 12 8 16 0" stroke="#1d3b55" stroke-width="5" fill="none" stroke-linecap="round"/>
      <path d="M104 118l-14 24h12l-8 20 24-28h-12l10-16z" fill="#ffcc4d"/>
    `),
  },
  {
    id: 'sand_scorpion',
    name: 'עקרב החול',
    art: () => svg(`
      <ellipse cx="100" cy="168" rx="60" ry="9" fill="rgba(0,0,0,.3)"/>
      <path d="M150 120c22-4 30-22 24-42-4 14-12 18-22 16z" fill="#d79a4a"/>
      <path d="M156 78l8-12 6 14-10 6z" fill="#b87d33"/>
      <ellipse cx="96" cy="128" rx="46" ry="28" fill="#e2a95a"/>
      <ellipse cx="96" cy="122" rx="34" ry="19" fill="#f4c581"/>
      <path d="M52 112l-26-12 8 16-14 10 32 4zM52 140l-26 12 8-16-14-10 32-4z" fill="#d79a4a"/>
      ${eyes(84, 108, 118, 8, '#5a3512')}
      <path d="M78 136c10 6 24 6 34 0" stroke="#a96f28" stroke-width="4" fill="none" stroke-linecap="round"/>
    `),
  },
];

export function randomMonster() {
  return MONSTERS[Math.floor(Math.random() * MONSTERS.length)];
}
