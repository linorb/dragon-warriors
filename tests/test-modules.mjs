// בדיקת תקינות של כל המודולים: תחביר, ייבוא/ייצוא, והתאמה בין קטלוג החנות לשכבות הציור.
// הרצה (עם Node): node tests/test-modules.mjs

let pass = 0;
const failures = [];
const check = (name, cond, detail = '') => {
  if (cond) pass += 1; else failures.push(`${name}${detail ? ' :: ' + detail : ''}`);
};

/* ---------- סביבת דפדפן מדומה מינימלית ---------- */
const store = new Map();
const noop = () => {};
const fakeEl = { innerHTML: '', textContent: '', hidden: false, style: {}, classList: { add: noop, remove: noop }, addEventListener: noop, focus: noop, select: noop };
globalThis.window = {
  localStorage: {
    getItem: (k) => (store.has(k) ? store.get(k) : null),
    setItem: (k, v) => store.set(k, String(v)),
    removeItem: (k) => store.delete(k),
  },
  scrollTo: noop,
};
globalThis.document = {
  readyState: 'loading',
  addEventListener: noop,
  querySelector: () => fakeEl,
  querySelectorAll: () => [],
  getElementById: () => fakeEl,
  createElement: () => ({ ...fakeEl, click: noop, remove: noop }),
  body: { appendChild: noop },
};

/* ---------- ייבוא כל המודולים ---------- */
const mods = {};
for (const name of ['util', 'storage', 'progress', 'questions', 'avatar', 'monsters', 'shop', 'ui', 'battle', 'main']) {
  try {
    mods[name] = await import(`../js/${name}.js`);
    check(`נטען המודול ${name}.js`, true);
  } catch (e) {
    check(`נטען המודול ${name}.js`, false, e.message);
  }
}

/* ---------- דמות וציוד ---------- */
const { renderAvatar, itemArt, COLOR_CHOICES, DRAGON_STAGES } = mods.avatar;
const { CATALOG, SLOTS, TIERS } = mods.shop;

{
  const svg = renderAvatar({ color: '#59a9ff', equipped: {}, dragonStage: 1, name: 'אריאל' });
  check('הדמות מצוירת כ-SVG', svg.includes('<svg') && svg.includes('layer-body'));
  check('הדרקון מופיע ליד הלוחם', svg.includes('layer-dragon'));

  const full = renderAvatar({
    color: '#ff6b6b',
    equipped: Object.fromEntries(SLOTS.map((s) => [s.id, CATALOG.find((i) => i.slot === s.id).id])),
    dragonStage: 3,
  });
  for (const slot of SLOTS) {
    check(`שכבת ${slot.id} מצוירת`, full.includes(`layer-${slot.id}`));
  }

  check('4 שלבי דרקון', DRAGON_STAGES.length === 4);
  check('יש בחירת צבעים', COLOR_CHOICES.length >= 6);

  let artOk = true; let detail = '';
  for (const item of CATALOG) {
    const art = itemArt(item.slot, item.id, '#59a9ff');
    if (!art || !art.includes('<svg')) { artOk = false; detail = `אין ציור לפריט ${item.id}`; }
    if (!TIERS[item.tier]) { artOk = false; detail = `דרגת נדירות לא מוכרת: ${item.tier}`; }
    if (!SLOTS.some((s) => s.id === item.slot)) { artOk = false; detail = `מיקום לא מוכר: ${item.slot}`; }
    if (!(item.price > 0)) { artOk = false; detail = `מחיר לא תקין: ${item.id}`; }
  }
  check(`לכל ${CATALOG.length} פריטי החנות יש ציור, מחיר ודרגה`, artOk, detail);
  check('אין מזהי פריטים כפולים', new Set(CATALOG.map((i) => i.id)).size === CATALOG.length);
}

/* ---------- מפלצות ---------- */
{
  const { MONSTERS, randomMonster } = mods.monsters;
  check('יש לפחות 5 מפלצות', MONSTERS.length >= 5);
  check('לכל מפלצת שם וציור', MONSTERS.every((m) => m.name && m.art().includes('<svg')));
  check('בחירת מפלצת אקראית עובדת', Boolean(randomMonster().name));
}

/* ---------- דרגות והתקדמות ---------- */
{
  const { RANKS, rankFor, nextRankFor, dragonStageFor, rankIndexFor } = mods.progress;
  check('חמש דרגות בעברית', RANKS.length === 5 && RANKS.map((r) => r.name).join(',') === 'טירון,לוחם,אביר,אלוף,אגדה');
  check('דרגה מתחילה בטירון', rankFor(0).name === 'טירון');
  check('דרגה עולה לפי ניסיון', rankFor(500).name === 'אביר' && rankFor(99999).name === 'אגדה');
  check('אין דרגה אחרי אגדה', nextRankFor(99999) === null);
  check('שלב הדרקון גדל עם הדרגה', dragonStageFor(0) === 0 && dragonStageFor(500) === 2 && dragonStageFor(99999) === 3);
  check('סדר הדרגות עולה', RANKS.every((r, i) => i === 0 || r.xp > RANKS[i - 1].xp));
  check('חישוב אינדקס דרגה', rankIndexFor(119) === 0 && rankIndexFor(120) === 1);
}

/* ---------- חנות: קנייה, דרגות ומחירים ---------- */
{
  const storage = mods.storage;
  const shop = mods.shop;
  storage.resetAll();

  check('בהתחלה אין ציוד', shop.ownedInSlot('weapon').length === 0);
  check('אי אפשר לקנות בלי מטבעות', shop.canBuy('w_sword').ok === false);

  storage.update((s) => { s.player.coins = 1000; });
  check('אפשר לקנות פריט רגיל', shop.canBuy('w_sword').ok === true);
  check('פריט אגדי חסום בדרגה נמוכה', shop.canBuy('au_fire').ok === false);

  const res = shop.buy('w_sword');
  const item = shop.itemById('w_sword');
  check('הקנייה מצליחה', res.ok === true);
  check('המטבעות ירדו', storage.getState().player.coins === 1000 - item.price);
  check('הפריט נוסף למלאי והותאם', shop.owns('w_sword') && shop.equipped().weapon === 'w_sword');
  check('אי אפשר לקנות פעמיים', shop.canBuy('w_sword').ok === false);

  shop.equip('weapon', null);
  check('אפשר להוריד ציוד', shop.equipped().weapon === null);
  shop.equip('weapon', 'w_sword');
  check('אפשר להצטייד מחדש', shop.equipped().weapon === 'w_sword');
  shop.equip('helmet', 'h_wing');
  check('אי אפשר להצטייד בפריט שלא נקנה', shop.equipped().helmet === null);

  storage.update((s) => { s.player.xp = 2000; s.player.coins = 5000; });
  check('בדרגת אגדה נפתחים כל הפריטים', CATALOG.filter((i) => !shop.owns(i.id)).every((i) => shop.canBuy(i.id).ok));
}

/* ---------- התקדמות: מטבעות, ניסיון, רצף וסטטיסטיקה ---------- */
{
  const storage = mods.storage;
  const p = mods.progress;
  storage.resetAll();

  p.addCoins(50);
  check('הוספת מטבעות', p.coins() === 50);
  p.addCoins(-80);
  check('מטבעות לא יורדים מתחת לאפס', p.coins() === 0);

  const up = p.addXp(130);
  check('עליית דרגה מדווחת', up.leveledUp === true && up.rank.name === 'לוחם');
  const noUp = p.addXp(5);
  check('אין עליית דרגה מיותרת', noUp.leveledUp === false);

  p.recordAnswer('mult_table', 'first');
  p.recordAnswer('mult_table', 'fail');
  const st = storage.getState().stats;
  check('סטטיסטיקה לפי נושא', st.byTopic.mult_table.answered === 2 && st.byTopic.mult_table.firstTry === 1);
  check('דיוק מחושב', p.accuracyByTopic().mult_table === 50);

  p.pushToReview({ type: 'add4', topic: 'add_sub' });
  p.pushToReview({ type: 'add4', topic: 'add_sub' });
  check('תור חזרה בלי כפילויות', storage.getState().reviewQueue.length === 1);

  const streak = p.touchDailyStreak();
  check('רצף יומי מתחיל ב-1', streak.streak === 1 && streak.isNewDay === true);
  const same = p.touchDailyStreak();
  check('אותו יום לא מעלה את הרצף', same.isNewDay === false && same.bonus === 0);
}

/* ---------- סיכום ---------- */
console.log(`\n✔ עברו: ${pass}`);
if (failures.length) {
  console.log(`✘ נכשלו: ${failures.length}`);
  failures.forEach((f) => console.log('   - ' + f));
  process.exitCode = 1;
} else {
  console.log('כל הבדיקות עברו בהצלחה.');
}
