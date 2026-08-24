'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
require('../core/normalize.js');
const { normalizePuzzle, normalizeDeck } = globalThis.BibleGames.normalize;

test('a puzzle without variants becomes one with exactly one variant', () => {
  const p = normalizePuzzle({
    answer: 'JONAH', type: 'image', img: 'whale.jpg',
  });
  assert.equal(p.variants.length, 1);
  assert.equal(p.variants[0].type, 'image');
  assert.equal(p.variants[0].img, 'whale.jpg');
});

test('puzzle defaults are applied', () => {
  const p = normalizePuzzle({ answer: 'ACTS' });
  assert.equal(p.lang, 'en');
  assert.equal(p.slot, 'anywhere');
  assert.equal(p.difficulty, 2);
  assert.equal(p.answerAlt, null);
  assert.equal(p.ref, null);
});

test('explicit variants are preserved and defaulted', () => {
  const p = normalizePuzzle({
    answer: 'RUTH', slot: 'late',
    variants: [
      { type: 'image', img: 'ruth-member.jpg', weight: 2 },
      { type: 'rebus', clues: [{ img: 'root.jpg', word: 'ROOT' }] },
    ],
  });
  assert.equal(p.variants.length, 2);
  assert.equal(p.variants[0].weight, 2);
  assert.equal(p.variants[1].weight, 1);
  assert.equal(p.variants[1].img, null);
  assert.equal(p.slot, 'late');
});

test('variant difficulty falls back to the puzzle then to 2', () => {
  const withPuzzle = normalizePuzzle({
    answer: 'X', difficulty: 3, variants: [{ type: 'rebus', clues: [] }],
  });
  assert.equal(withPuzzle.variants[0].difficulty, 3);

  const overridden = normalizePuzzle({
    answer: 'Y', difficulty: 3,
    variants: [{ type: 'rebus', clues: [], difficulty: 1 }],
  });
  assert.equal(overridden.variants[0].difficulty, 1);

  const bare = normalizePuzzle({ answer: 'Z', variants: [{ type: 'rebus', clues: [] }] });
  assert.equal(bare.variants[0].difficulty, 2);
});

test('an empty clues array survives normalization', () => {
  const p = normalizePuzzle({ answer: 'X', type: 'rebus', clues: [] });
  assert.deepEqual(p.variants[0].clues, []);
});

test('an absent clues key becomes null', () => {
  const p = normalizePuzzle({ answer: 'Y', type: 'image', img: 'y.jpg' });
  assert.equal(p.variants[0].clues, null);
});

test('deck defaults are applied', () => {
  const d = normalizeDeck({ id: 'book-names', title: 'Bible Book Names', puzzles: [] });
  assert.deepEqual(d.imageDirs, ['images/']);
  assert.equal(d.shuffle, true);
  assert.equal(d.sessionSize, null);
  assert.deepEqual(d.languages, ['en']);
});

test('deck shuffle can be switched off explicitly', () => {
  assert.equal(normalizeDeck({ shuffle: false, puzzles: [] }).shuffle, false);
});
