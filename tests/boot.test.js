'use strict';
const test = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const ROOT = path.join(__dirname, '..');
const assert = require('node:assert/strict');
const seeded = require('./helpers/rng.js');
require('../core/normalize.js');
require('../core/variants.js');
require('../core/order.js');
require('../core/machine.js');
require('../core/views.js');
require('../core/images.js');
require('../core/sound.js');
require('../core/boot.js');
const { buildSession } = globalThis.BibleGames.boot;
const { normalizePuzzle } = globalThis.BibleGames.normalize;

// A resolver that finds everything except the names given.
const resolverWithout = (...missing) => (name) =>
  Promise.resolve(missing.includes(name) ? null : 'images/' + name);
const allPresent = resolverWithout();

const deck = () => ({
  id: 'book-names',
  imageDirs: ['images/'],
  languages: ['en'],
  puzzles: [
    { id: 'bn-01', answer: 'JONAH', type: 'image', img: 'whale.jpg', difficulty: 1 },
    { id: 'bn-02', answer: 'ACTS',
      clues: [{ img: 'axe.jpg', word: 'AXE' }, { img: 'letter-s.jpg', word: 'S' }] },
    {
      id: 'bn-03', answer: 'RUTH', slot: 'late',
      variants: [
        { type: 'image', img: 'ruth-member.jpg', weight: 2 },
        { type: 'rebus', clues: [{ img: 'root.jpg', word: 'ROOT' }] },
      ],
    },
  ],
});

test('a variant with a missing picture is skipped for one that resolves', async () => {
  const s = await buildSession(deck(), resolverWithout('ruth-member.jpg'), seeded(1));
  const ruth = s.items.find((i) => i.puzzle.answer === 'RUTH');
  assert.equal(ruth.variant.type, 'rebus');
});

test('the weighted variant does get drawn when its picture is present', async () => {
  let sawImage = false;
  for (let seed = 1; seed <= 30; seed++) {
    const s = await buildSession(deck(), allPresent, seeded(seed));
    const ruth = s.items.find((i) => i.puzzle.answer === 'RUTH');
    if (ruth.variant.type === 'image') { sawImage = true; break; }
  }
  assert.ok(sawImage, 'weighted variant never drawn across 30 seeds');
});

test('a puzzle whose every picture is missing is kept, not dropped', async () => {
  // Silence would hide a missing file, and the site is published - a gap
  // online is harder to notice than a placeholder.
  const s = await buildSession(deck(), resolverWithout('whale.jpg'), seeded(2));
  const jonah = s.items.find((i) => i.puzzle.answer === 'JONAH');
  assert.ok(jonah, 'JONAH was dropped instead of showing a placeholder');
  assert.equal(s.srcFor('whale.jpg'), null);
});

test('languages filters the pool', async () => {
  const d = deck();
  d.puzzles.push({ id: 'bn-04', answer: 'HARI', lang: 'fil', type: 'image', img: 'crown.jpg' });
  const en = await buildSession(d, allPresent, seeded(3));
  assert.equal(en.items.some((i) => i.puzzle.answer === 'HARI'), false);

  d.languages = ['en', 'fil'];
  const both = await buildSession(d, allPresent, seeded(3));
  assert.equal(both.items.some((i) => i.puzzle.answer === 'HARI'), true);
});

test('srcFor returns resolved urls and null for the unresolved', async () => {
  const s = await buildSession(deck(), resolverWithout('ruth-member.jpg'), seeded(4));
  assert.equal(s.srcFor('whale.jpg'), 'images/whale.jpg');
  assert.equal(s.srcFor('ruth-member.jpg'), null);
});

test('the pinned puzzle still lands late', async () => {
  const d = deck();
  for (let i = 0; i < 12; i++) {
    d.puzzles.push({ id: 'bn-f' + i, answer: 'F' + i, type: 'image', img: 'f.jpg' });
  }
  const s = await buildSession(d, allPresent, seeded(6));
  const at = s.items.findIndex((i) => i.puzzle.answer === 'RUTH');
  assert.ok(at >= Math.ceil((s.items.length / 3) * 2), `RUTH landed at ${at} of ${s.items.length}`);
});

test('viewForItem dispatches to the right builder for a session item', () => {
  const rebus = normalizePuzzle({
    id: 'bn-01', answer: 'ACTS',
    clues: [{ img: 'axe.jpg', word: 'AXE' }, { img: 'letter-s.jpg', word: 'S' }],
  });
  const item = { puzzle: rebus, variant: rebus.variants[0] };
  assert.equal(globalThis.BibleGames.views.viewForItem(item, 0).kind, 'rebus');
  assert.equal(globalThis.BibleGames.views.viewForItem(item, 1).working, 'AXE + S');
  assert.equal(globalThis.BibleGames.views.viewForItem(item, 2).answered.answer, 'ACTS');
});

// ---- rounds ---------------------------------------------------------------
// Round 1 draws a session; later rounds draw only what has not been shown, so
// an evening walks the whole deck without repeating a picture.

const roundDeck = () => {
  const puzzles = [];
  for (let i = 1; i <= 10; i++) {
    puzzles.push({ id: 'bn-' + i, answer: 'B' + i, type: 'image', img: 'x.jpg' });
  }
  return { id: 'd', imageDirs: ['images/'], languages: ['en'], sessionSize: 4, puzzles };
};

test('a later round shows only books the earlier rounds did not', async () => {
  const seen = new Set();
  const r1 = await buildSession(roundDeck(), allPresent, seeded(1), { seen });
  r1.keys.forEach((k) => seen.add(k));
  const r2 = await buildSession(roundDeck(), allPresent, seeded(2), { seen });

  assert.equal(r1.items.length, 4);
  assert.equal(r2.items.length, 4);
  const first = r1.items.map((i) => i.puzzle.answer);
  const second = r2.items.map((i) => i.puzzle.answer);
  const overlap = second.filter((a) => first.includes(a));
  assert.deepEqual(overlap, [], `round 2 repeated: ${overlap}`);
});

test('rounds keep shrinking and the last one is a remainder', async () => {
  const seen = new Set();
  const sizes = [];
  for (let round = 0; round < 5; round++) {
    const s = await buildSession(roundDeck(), allPresent, seeded(round + 1), { seen });
    if (!s.items.length) break;
    s.keys.forEach((k) => seen.add(k));
    sizes.push(s.items.length);
  }
  // ten books, four per round: 4, 4, 2 and then nothing left
  assert.deepEqual(sizes, [4, 4, 2]);
});

test('a second variant counts as unseen, so the book can come back', async () => {
  const deck = {
    id: 'd', imageDirs: ['images/'], languages: ['en'], sessionSize: 1,
    puzzles: [{
      id: 'bn-01', answer: 'RUTH',
      variants: [
        { type: 'rebus', clues: [{ img: 'root.svg', word: 'ROOT' }] },
        { type: 'image', img: 'ruth-scene.jpg' },
      ],
    }],
  };
  const seen = new Set();
  const r1 = await buildSession(deck, allPresent, seeded(3), { seen });
  r1.keys.forEach((k) => seen.add(k));
  const r2 = await buildSession(deck, allPresent, seeded(4), { seen });

  assert.equal(r1.items.length, 1);
  assert.equal(r2.items.length, 1, 'the other variant should still be unseen');
  assert.notEqual(r1.items[0].variant.type, r2.items[0].variant.type);

  r2.keys.forEach((k) => seen.add(k));
  const r3 = await buildSession(deck, allPresent, seeded(5), { seen });
  assert.equal(r3.items.length, 0, 'both variants seen, so nothing is left');
});

test('a variant whose picture is missing is never counted as unseen', async () => {
  // Otherwise a placeholder variant would drag its book into a later round
  // only to be dropped, making the round mysteriously short.
  const deck = {
    id: 'd', imageDirs: ['images/'], languages: ['en'], sessionSize: 4,
    puzzles: [{
      id: 'bn-01', answer: 'JOB',
      variants: [
        { type: 'image', img: 'have.jpg' },
        { type: 'image', img: 'missing.jpg' },
      ],
    }],
  };
  const seen = new Set();
  const r1 = await buildSession(deck, resolverWithout('missing.jpg'), seeded(6), { seen });
  r1.keys.forEach((k) => seen.add(k));
  const r2 = await buildSession(deck, resolverWithout('missing.jpg'), seeded(7), { seen });
  assert.equal(r1.items.length, 1);
  assert.equal(r2.items.length, 0, 'the unsourced variant must not create a round');
});

// ---- quote decks: dormancy and language ---------------------------------

const quoteDeck = () => ({
  id: 'who-said-it', imageDirs: ['images/'], languages: ['en', 'fil'],
  shuffle: false, sessionSize: 10,
  puzzles: [{
    id: 'qs-05', answer: 'PETER',
    variants: [
      { type: 'quote', lang: 'en', quote: 'You are the Christ.',
        verse: 'Matthew 16:16', clue: 'a fisherman' },
      { type: 'quote', lang: 'fil', answer: 'PEDRO', quote: null,
        verse: 'Mateo 16:16', clue: 'isang mangingisda' },
    ],
  }],
});

test('a quote with no text yet is dormant and is never drawn', async () => {
  const s = await buildSession(quoteDeck(), allPresent, seeded(1));
  assert.equal(s.items.length, 1);
  assert.equal(s.items[0].variant.quote, 'You are the Christ.',
    'the scaffold must not be picked - it would paint "null" on the projector');
});

test('choosing a language plays only that language’s variants', async () => {
  const d = quoteDeck();
  d.puzzles[0].variants[1].quote = 'Ikaw ang Cristo.';

  const en = await buildSession(d, allPresent, seeded(1), { lang: 'en' });
  assert.equal(en.items[0].variant.quote, 'You are the Christ.');

  const fil = await buildSession(d, allPresent, seeded(1), { lang: 'fil' });
  assert.equal(fil.items[0].variant.quote, 'Ikaw ang Cristo.');
  assert.equal(fil.items[0].variant.answer, 'PEDRO');
});

test('a language with nothing playable yields an empty session, not a broken one', async () => {
  const fil = await buildSession(quoteDeck(), allPresent, seeded(1), { lang: 'fil' });
  assert.deepEqual(fil.items, []);
});

test('a variant with no lang of its own is played in the puzzle language', async () => {
  const d = {
    id: 'langs', imageDirs: ['images/'], languages: ['en'], shuffle: false, sessionSize: 10,
    puzzles: [{ id: 'l-1', answer: 'A', type: 'text', prompt: 'p' }],
  };
  const s = await buildSession(d, allPresent, seeded(1), { lang: 'en' });
  assert.equal(s.items.length, 1);
});

test('a size override limits the round instead of the deck size', async () => {
  const d = {
    id: 'sizes', imageDirs: ['images/'], languages: ['en'], shuffle: false, sessionSize: 20,
    puzzles: Array.from({ length: 9 }, (_, i) => ({
      id: 'sz-' + i, answer: 'A' + i, type: 'text', prompt: 'p' + i,
    })),
  };
  const all = await buildSession(d, allPresent, seeded(1));
  assert.equal(all.items.length, 9, 'without an override the deck size wins');

  const four = await buildSession(d, allPresent, seeded(1), { sessionSize: 4 });
  assert.equal(four.items.length, 4);
  assert.equal(four.keys.length, 4, 'only what was played is marked seen');
});

test('the size dropdown offers round numbers up to what the deck can fill', () => {
  const { sizeOptions } = globalThis.BibleGames.boot;
  assert.deepEqual(sizeOptions(100, 20).map((o) => o.value), [5, 10, 15, 20, 25, 30, 100]);
  assert.equal(sizeOptions(100, 20)[6].label, 'All (100)');
  assert.deepEqual(sizeOptions(12, 20).map((o) => o.value), [5, 10, 12]);
  assert.deepEqual(sizeOptions(3, 20).map((o) => o.value), [3]);
  assert.equal(sizeOptions(3, 20)[0].label, 'All (3)');
  assert.deepEqual(sizeOptions(0, 20), []);
});

test('the language picker offers only languages with something to play', () => {
  const { langOptions } = globalThis.BibleGames.boot;
  assert.deepEqual(langOptions(['en', 'fil'], { en: 40, fil: 12 }).map((o) => o.value),
                   ['en', 'fil']);
  assert.deepEqual(langOptions(['en', 'fil'], { en: 40, fil: 0 }).map((o) => o.value),
                   [], 'one language playable is no choice at all');
  assert.equal(langOptions(['en', 'fil'], { en: 40, fil: 12 })[1].label, 'Tagalog (12)');
});

test('a dormant quote is not counted as still to come', async () => {
  // The round-end card counts what could fill another round. It must use the
  // SAME availability rule the draw uses, or it promises puzzles that can
  // never appear: every person here has a Tagalog scaffold with no line yet,
  // and counting those said "71 still to come" when 66 remained.
  const deck = {
    id: 'who-said-it', imageDirs: ['images/'], languages: ['en', 'fil'],
    shuffle: false, sessionSize: 2,
    puzzles: [1, 2, 3].map((n) => ({
      id: 'qs-0' + n, answer: 'P' + n,
      variants: [
        { type: 'quote', lang: 'en', quote: 'line ' + n, verse: 'Acts ' + n + ':1' },
        { type: 'quote', lang: 'fil', answer: 'F' + n, quote: null, verse: 'Gawa ' + n + ':1' },
      ],
    })),
  };
  const seen = new Set();
  const first = await buildSession(deck, allPresent, seeded(1), { seen: seen, sessionSize: 2 });
  assert.equal(first.items.length, 2);
  first.keys.forEach((k) => seen.add(k));

  // What is left: one person, not four.
  const left = await buildSession(deck, allPresent, seeded(1),
                                  { seen: seen, sessionSize: 9999 });
  assert.equal(left.items.length, 1,
    'the two dormant Tagalog scaffolds must not count as still to come');
});

test('a later round honours the size chosen at the start', async () => {
  const deck = {
    id: 'sizes', imageDirs: ['images/'], languages: ['en'], shuffle: false, sessionSize: 20,
    puzzles: Array.from({ length: 12 }, (_, i) => ({
      id: 'sz-' + i, answer: 'A' + i, type: 'text', prompt: 'p' + i,
    })),
  };
  const seen = new Set();
  const r1 = await buildSession(deck, allPresent, seeded(1), { seen: seen, sessionSize: 5 });
  assert.equal(r1.items.length, 5);
  r1.keys.forEach((k) => seen.add(k));

  const r2 = await buildSession(deck, allPresent, seeded(1), { seen: seen, sessionSize: 5 });
  assert.equal(r2.items.length, 5, 'round 2 must be the size the host chose, not the deck default');
  const overlap = r2.keys.filter((k) => r1.keys.includes(k));
  assert.deepEqual(overlap, [], 'and must not repeat round 1');
});

// ---- the object trail ---------------------------------------------------

const trailDeck = () => ({
  id: 'object-trail', imageDirs: ['images/'], languages: ['en'],
  shuffle: false, sessionSize: 10,
  puzzles: [{
    id: 'ot-01', answer: 'ABRAHAM',
    variants: [{
      type: 'trail',
      items: [
        { verse: 'Genesis 22:6',
          pictures: [{ word: 'firewood', img: 'abraham-firewood.webp' },
                     { word: 'a knife', img: 'abraham-knife.jpg' }] },
        { verse: 'Genesis 22:13', pictures: [{ word: 'a ram' }] },
      ],
    }],
  }],
});

test('a trail\'s pictures are resolved, wherever they sit in the variant', async () => {
  // They live in items[].pictures[].img, which imageNames had never heard of -
  // so 69 uploaded pictures sat in the folder while the game showed words.
  const s = await buildSession(trailDeck(), allPresent, seeded(1));
  assert.equal(s.items.length, 1);
  assert.equal(s.srcFor('abraham-firewood.webp'), 'images/abraham-firewood.webp');
  assert.equal(s.srcFor('abraham-knife.jpg'), 'images/abraham-knife.jpg');
});

test('a trail with no pictures at all is still playable', async () => {
  // Words first is the whole design: a picture is an enhancement, never a
  // requirement, so a missing one must not make the puzzle dormant.
  const d = trailDeck();
  const s = await buildSession(d, resolverWithout('abraham-firewood.webp',
                                                  'abraham-knife.jpg'), seeded(1));
  assert.equal(s.items.length, 1, 'the puzzle must not vanish');
  assert.equal(s.srcFor('abraham-firewood.webp'), null, 'and the word carries it');
});

test('a half-illustrated trail plays with the pictures it has', async () => {
  const s = await buildSession(trailDeck(), resolverWithout('abraham-knife.jpg'),
                               seeded(1));
  assert.equal(s.items.length, 1);
  assert.equal(s.srcFor('abraham-firewood.webp'), 'images/abraham-firewood.webp');
  assert.equal(s.srcFor('abraham-knife.jpg'), null);
});

// A map variant missing its extent or its pin is DORMANT, exactly as a quote
// with no text is. Not reachable from the generated deck - the extent is
// derived and the coordinate is checked - but the deck manager can hand-author
// a map puzzle, and the failure mode is the worst one there is: paint.js
// throws AFTER host.innerHTML has been cleared and boot's draw() has no
// try/catch, so the room gets a black rectangle in the middle of a round.
test('a map variant with no extent or no pin is dormant and is never drawn', async () => {
  const mapDeck = (over) => ({
    id: 'name-the-place', imageDirs: ['images/'], languages: ['en'], shuffle: false,
    puzzles: [{
      id: 'np-01', answer: 'JERICHO',
      variants: [
        Object.assign({ type: 'map', extent: 'holyland', at: [35.44, 31.87] }, over),
        { type: 'map', extent: 'holyland', at: [35.21, 31.77], verse: 'fallback' },
      ],
    }],
  });
  for (const broken of [{ extent: null }, { at: null }, { extent: null, at: null }]) {
    const s = await buildSession(mapDeck(broken), allPresent, seeded(1));
    assert.equal(s.items.length, 1, JSON.stringify(broken));
    assert.equal(s.items[0].variant.verse, 'fallback',
      'the broken variant must never be picked: ' + JSON.stringify(broken));
  }
  // With a language asked for, a puzzle whose only map variant is broken drops
  // out of the round entirely - which is the path a real game takes, because
  // Name the Place always picks a language on the start screen.
  const only = {
    id: 'name-the-place', imageDirs: ['images/'], languages: ['en'], shuffle: false,
    puzzles: [{ id: 'np-01', answer: 'JERICHO', type: 'map', extent: 'holyland', at: null }],
  };
  assert.deepEqual((await buildSession(only, allPresent, seeded(1), { lang: 'en' })).items, [],
    'a puzzle with nothing drawable is not in the round');
});

test('a view that does not ask for a clock does not get one', () => {
  // The assertion protecting the seven games that already work. If boot ever
  // sets a timer unconditionally, every existing game starts moving on its own
  // in front of a room, and no existing test would notice.
  const src = fs.readFileSync(path.join(ROOT, 'core', 'boot.js'), 'utf8');
  // Anchored on the assignment: the bare call text also appears in the
  // function's own declaration, so an unanchored match passes with draw()
  // never asking at all.
  assert.ok(/=\s*autoDelayMs\(view, deck\)/.test(src),
    'draw() must ask autoDelayMs whether this screen gets a clock');
});

test('every redraw cancels the pending advance and the music first', () => {
  // A timer that survives a redraw fires into a screen that has moved on, and
  // a loop that survives one plays over the next game. draw() is the single
  // point every route passes through, so the cancel belongs at its top.
  const src = fs.readFileSync(path.join(ROOT, 'core', 'boot.js'), 'utf8');
  const draw = src.slice(src.indexOf('function draw()'));
  const firstLines = draw.slice(0, draw.indexOf('BG.paint.render'));
  assert.ok(/clearAuto\(\)/.test(firstLines),
    'draw() must clear the pending timer before it renders anything');
  assert.ok(/function clearAuto\(\)[\s\S]{0,260}clearTimeout/.test(src),
    'clearAuto must actually clear the timeout');
  assert.ok(/function clearAuto\(\)[\s\S]{0,260}sound[\s\S]{0,40}stop\(\)/.test(src),
    'clearAuto must stop the music too');
});

test('leaving the game entirely stops the music', () => {
  // S tears the host down and goes back to the start screen. Without this the
  // loop plays on underneath a page that no longer has a game on it.
  const src = fs.readFileSync(path.join(ROOT, 'core', 'boot.js'), 'utf8');
  const setup = src.slice(src.indexOf('setup: function ()'));
  assert.ok(/clearAuto\(\)/.test(setup.slice(0, setup.indexOf('},'))),
    'the setup action must clear the timer and the music');
});

test('the round-done card stops the music', () => {
  const src = fs.readFileSync(path.join(ROOT, 'core', 'boot.js'), 'utf8');
  const done = src.slice(src.indexOf('function drawDone('));
  assert.ok(/clearAuto\(\)/.test(done.slice(0, done.indexOf('\n    }'))),
    'drawDone must clear the timer and the music');
});

test('a missing sound module does not stop the game advancing', () => {
  // core/sound.js is only loaded by the one page that needs it. If boot
  // reaches for it unguarded, every other game throws on its first draw.
  const src = fs.readFileSync(path.join(ROOT, 'core', 'boot.js'), 'utf8');
  const lines = src.split('\n');
  // Every call site must sit behind a guard on the same line or the line above.
  lines.forEach((line, i) => {
    if (!/BG\.sound\./.test(line)) { return; }
    const context = (lines[i - 1] || '') + line;
    assert.ok(/BG\.sound\s*(&&|\?)/.test(context) || /if\s*\(\s*BG\.sound/.test(context),
      'unguarded BG.sound at line ' + (i + 1) + ': ' + line.trim());
  });
});

test('the clock is armed only by a view that asks for one', () => {
  const { autoDelayMs } = globalThis.BibleGames.boot;
  assert.ok(globalThis.BibleGames.sound, 'core/sound.js must be loaded for this test');
  // The behaviour the seven existing games depend on, stated as behaviour.
  assert.equal(autoDelayMs({ kind: 'quote' }, { musicSeconds: [6, 20] }), null);
  assert.equal(autoDelayMs({ kind: 'card', autoAdvance: false }, {}), null);
  assert.equal(autoDelayMs(null, {}), null);
});

test('a view that asks gets a real draw from the deck\'s own range', () => {
  const { autoDelayMs } = globalThis.BibleGames.boot;
  const card = { kind: 'card', autoAdvance: true };

  // A fallback returns the same number every time; a real draw does not. The
  // band 6000-20000 contains the 12000 fallback, so range alone proves nothing.
  const wide = new Set();
  for (let i = 0; i < 100; i += 1) {
    const ms = autoDelayMs(card, { musicSeconds: [6, 20] });
    assert.ok(ms >= 6000 && ms <= 20000, 'drew ' + ms);
    wide.add(ms);
  }
  assert.ok(wide.size > 1, 'every draw was identical: ' + Array.from(wide));

  // A range that does NOT contain 12000, so the fallback cannot hide inside it.
  for (let i = 0; i < 100; i += 1) {
    const ms = autoDelayMs(card, { musicSeconds: [2, 4] });
    assert.ok(ms >= 2000 && ms <= 4000, 'drew ' + ms + ' for a 2-4 second deck');
  }
});

test('without the sound module the clock still arms, at a fixed fallback', () => {
  // core/sound.js is loaded by one page; every other page lacks it. Reach the
  // fallback on purpose, and put the module back so nothing else sees this.
  const { autoDelayMs } = globalThis.BibleGames.boot;
  const real = globalThis.BibleGames.sound;
  try {
    delete globalThis.BibleGames.sound;
    assert.equal(autoDelayMs({ kind: 'card', autoAdvance: true }, {}), 12000);
    assert.equal(autoDelayMs({ kind: 'card', autoAdvance: true },
                             { musicSeconds: [2, 4] }), 12000);
    assert.equal(autoDelayMs({ kind: 'quote' }, {}), null);
  } finally {
    globalThis.BibleGames.sound = real;
  }
  assert.ok(globalThis.BibleGames.sound, 'the sound module must be restored');
});

test('a deck that does not remember is dealt again instead of running out', () => {
  // Hot Potato sets `remembers: false` because its cards are performances and
  // are never used up. But `seen` still fills as cards are SHOWN, so without
  // this the deck empties WITHIN one evening - and the deck-empty card then
  // tells the room to press R, which used to crash.
  //
  // The two halves, asserted separately so neither can carry the other:
  // buildSession really does return nothing once everything is seen, and
  // clearing `seen` really does bring the cards back.
  const src = fs.readFileSync(path.join(ROOT, 'core', 'boot.js'), 'utf8');
  const deal = src.slice(src.indexOf('function dealing('));
  const body = deal.slice(0, deal.indexOf('\n    function '));
  assert.ok(/seen\.clear\(\)/.test(body),
    'dealing() must forget what it has shown when a non-remembering deck runs dry');
  assert.ok(/next\.items\.length \|\| remembers\(deck\)/.test(body),
    'dealing() must only re-deal for a deck that does not remember');

  // And no caller may build a round out of an empty list - that is what threw
  // on every keypress afterwards.
  const rebuild = src.slice(src.indexOf('function rebuild('));
  assert.ok(/if \(!next\.items\.length\) \{ drawDone\(0\); return; \}/
    .test(rebuild.slice(0, rebuild.indexOf('\n    }'))),
    'rebuild() must show the done card rather than deal an empty round');
});
