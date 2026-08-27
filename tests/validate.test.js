'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
require('../core/normalize.js');
require('../core/order.js');
require('../tools/validate.js');
const { validate } = globalThis.BibleGames.validate;

const ok = () => ({
  id: 'book-names',
  puzzles: [
    { id: 'bn-01', answer: 'JONAH', type: 'image', img: 'whale.jpg' },
    { id: 'bn-02', answer: 'ACTS', clues: [{ img: 'axe.jpg', word: 'AXE' }] },
  ],
});

const errs = (deck) => validate(deck).errors.join(' | ');

test('a good deck has no errors', () => {
  const r = validate(ok());
  assert.deepEqual(r.errors, []);
  assert.equal(r.playable, 2);
});

test('a missing answer is an error', () => {
  const d = ok();
  d.puzzles.push({ type: 'image', img: 'x.jpg' });
  assert.match(errs(d), /answer/i);
});

test('an unknown variant type is an error', () => {
  const d = ok();
  d.puzzles.push({ answer: 'X', type: 'crossword' });
  assert.match(errs(d), /type/i);
});

test('a rebus with no clues is an error', () => {
  const d = ok();
  d.puzzles.push({ answer: 'X', type: 'rebus', clues: [] });
  assert.match(errs(d), /clues/i);
});

test('an image variant with no img is an error', () => {
  const d = ok();
  d.puzzles.push({ answer: 'X', type: 'image' });
  assert.match(errs(d), /img/i);
});

test('a binary answer must be one of its options', () => {
  const d = ok();
  d.puzzles.push({ answer: 'Maybe', type: 'binary', prompt: 'X', options: ['Old', 'New'] });
  assert.match(errs(d), /options/i);
});

test('order correct must be a permutation of items', () => {
  const d = ok();
  d.puzzles.push({
    answer: 'seq', type: 'order', items: ['a', 'b'], correct: ['a', 'c'],
  });
  assert.match(errs(d), /permutation/i);
});

test('a non-positive weight is an error', () => {
  const d = ok();
  d.puzzles.push({ answer: 'X', type: 'image', img: 'x.jpg', weight: 0 });
  assert.match(errs(d), /weight/i);
  const neg = ok();
  neg.puzzles.push({ answer: 'Y', type: 'image', img: 'y.jpg', weight: -1 });
  assert.match(errs(neg), /weight/i);
});

test('a bad difficulty is an error', () => {
  const d = ok();
  d.puzzles.push({ answer: 'X', type: 'image', img: 'x.jpg', difficulty: 7 });
  assert.match(errs(d), /difficulty/i);
});

test('an unknown lang or slot is an error', () => {
  const bad = ok();
  bad.puzzles.push({ answer: 'X', type: 'image', img: 'x.jpg', lang: 'es' });
  assert.match(errs(bad), /lang/i);

  const badSlot = ok();
  badSlot.puzzles.push({ answer: 'Y', type: 'image', img: 'y.jpg', slot: 'end' });
  assert.match(errs(badSlot), /slot/i);
});

test('a missing or duplicate id is an error', () => {
  const missing = ok();
  missing.puzzles.push({ answer: 'X', type: 'image', img: 'x.jpg' });
  assert.match(errs(missing), /id/i);

  const dup = ok();
  dup.puzzles[1].id = dup.puzzles[0].id;
  assert.match(errs(dup), /duplicate id/i);
});

test('an id containing its own answer is an error', () => {
  // The id is printed on a projector in front of the room.
  const d = ok();
  d.puzzles.push({ id: 'ruth-08', answer: 'RUTH', type: 'image', img: 'r.jpg' });
  assert.match(errs(d), /id .*answer|leak/i);
});

test('duplicate answers in the same language are an error', () => {
  const d = ok();
  d.puzzles.push({ answer: 'JONAH', type: 'image', img: 'other.jpg' });
  assert.match(errs(d), /duplicate/i);
});

test('the same answer in two languages is allowed', () => {
  const d = ok();
  d.puzzles.push({ id: 'bn-03', answer: 'JONAH', lang: 'fil', type: 'image', img: 'whale.jpg' });
  d.languages = ['en', 'fil'];
  assert.deepEqual(validate(d).errors, []);
});

test('sessionSize larger than the deck is an error', () => {
  const d = ok();
  d.sessionSize = 9;
  assert.match(errs(d), /sessionSize/i);
});

test('an over-subscribed zone is an error', () => {
  const d = ok();
  d.puzzles.push({ answer: 'L1', type: 'image', img: 'a.jpg', slot: 'late' });
  d.puzzles.push({ answer: 'L2', type: 'image', img: 'b.jpg', slot: 'late' });
  d.puzzles.push({ answer: 'L3', type: 'image', img: 'c.jpg', slot: 'late' });
  assert.match(errs(d), /over-subscribed|late/i);
});

test('a risky flag is a notice, not an error', () => {
  const d = ok();
  d.puzzles.push({ id: 'bn-04', answer: 'LEVITICUS', type: 'image', img: 'x.jpg', flag: 'risky' });
  const r = validate(d);
  assert.deepEqual(r.errors, []);
  assert.match(r.notices.join(' | '), /risky/i);
});

function quoteDeck(variant, puzzle) {
  return {
    id: 'who-said-it', sessionSize: 1, languages: ['en'],
    puzzles: [Object.assign({ id: 'qs-01', answer: 'CAIN' }, puzzle || {},
      { variants: [Object.assign({
          type: 'quote', quote: 'Am I my brother’s keeper?',
          verse: 'Genesis 4:9', clue: 'he worked the ground',
        }, variant || {})] })],
  };
}

test('a scaffold with a verse but no text yet is not an error', () => {
  const r = validate(quoteDeck({ quote: null }));
  assert.deepEqual(r.errors, []);
  assert.ok(r.notices.some((n) => /waiting for their text/.test(n)), r.notices.join('; '));
});

test('a quote variant with neither text nor verse is an error', () => {
  const r = validate(quoteDeck({ quote: null, verse: null }));
  assert.ok(r.errors.some((e) => /needs its text/.test(e)), r.errors.join('; '));
});

test('a well-formed quote deck passes', () => {
  const r = validate(quoteDeck());
  assert.deepEqual(r.errors, []);
});






test('unverified quotes are counted in a notice', () => {
  const r = validate(quoteDeck({ flag: 'unverified' }));
  assert.ok(r.notices.some((n) => /1 of 1 quotes still unverified/.test(n)),
            r.notices.join('; '));
});

test('a verified deck says nothing about verification', () => {
  const r = validate(quoteDeck());
  assert.ok(!r.notices.some((n) => /unverified/.test(n)), r.notices.join('; '));
});

test('a reference is never rewritten or refused, whatever its book', () => {
  // The rule that refused "Jonah 2:2" under JONAH is gone: most quotes from a
  // book named after a person are spoken by someone else, so it rejected far
  // more good decks than bad ones.
  const r = validate(quoteDeck(
    { quote: 'Pick me up and throw me into the sea', verse: 'Jonah 1:12', clue: 'a storm' },
    { answer: 'JONAH' },
  ));
  assert.deepEqual(r.errors, []);
});
