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

test('the puzzle id survives normalization', () => {
  assert.equal(normalizePuzzle({ id: 'bn-07', answer: 'JONAH' }).id, 'bn-07');
  assert.equal(normalizePuzzle({ answer: 'JONAH' }).id, null);
});

test('a quote variant keeps its quote, verse, clue and hold flag', () => {
  const p = normalizePuzzle({
    id: 'qs-01', answer: 'CAIN', type: 'quote',
    quote: 'Am I my brother’s keeper?',
    verse: 'Genesis 4:9',
    clue: 'he worked the ground; his brother kept sheep',
  });
  const v = p.variants[0];
  assert.equal(v.type, 'quote');
  assert.equal(v.quote, 'Am I my brother’s keeper?');
  assert.equal(v.verse, 'Genesis 4:9');
  assert.equal(v.clue, 'he worked the ground; his brother kept sheep');
  assert.equal(v.verseAtReveal, false);
});

test('a quote variant with no verse or clue normalizes them to null', () => {
  const p = normalizePuzzle({ id: 'qs-02', answer: 'EVE', type: 'quote', quote: 'x' });
  assert.equal(p.variants[0].verse, null);
  assert.equal(p.variants[0].clue, null);
});

test('verseAtReveal survives normalization when set', () => {
  const p = normalizePuzzle({
    id: 'qs-03', answer: 'JONAH', type: 'quote',
    quote: 'I cried out to the LORD because of my affliction',
    verse: 'Jonah 2:2', verseAtReveal: true,
  });
  assert.equal(p.variants[0].verseAtReveal, true);
});

test('lang and answer on a variant survive, and default to null', () => {
  const p = normalizePuzzle({
    id: 'qs-05', answer: 'PETER',
    variants: [
      { type: 'quote', quote: 'You are the Christ.', verse: 'Matthew 16:16' },
      { type: 'quote', lang: 'fil', answer: 'PEDRO', quote: null, verse: 'Mateo 16:16' },
    ],
  });
  assert.equal(p.variants[0].lang, null);
  assert.equal(p.variants[0].answer, null);
  assert.equal(p.variants[1].lang, 'fil');
  assert.equal(p.variants[1].answer, 'PEDRO');
});

test('howToPlay comes back as an array, empty when the deck omits it', () => {
  assert.deepEqual(normalizeDeck({ howToPlay: ['one', 'two'] }).howToPlay, ['one', 'two']);
  assert.deepEqual(normalizeDeck({}).howToPlay, []);
});

test('the deck credits survive normalization, and default to null', () => {
  const c = { en: 'NKJV notice', fil: 'MBB notice' };
  assert.deepEqual(normalizeDeck({ credits: c }).credits, c);
  assert.equal(normalizeDeck({}).credits, null);
});

test('the deck versions survive normalization, and default to null', () => {
  const v = { en: 'New King James Version', fil: 'Ang Dating Biblia (1905)' };
  assert.deepEqual(normalizeDeck({ versions: v }).versions, v);
  assert.equal(normalizeDeck({}).versions, null);
});
