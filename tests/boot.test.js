'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const seeded = require('./helpers/rng.js');
require('../core/normalize.js');
require('../core/variants.js');
require('../core/order.js');
require('../core/machine.js');
require('../core/views.js');
require('../core/images.js');
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
