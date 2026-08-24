'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
require('../core/normalize.js');
require('../core/variants.js');
const { normalizePuzzle } = globalThis.BibleGames.normalize;
const { eligible, pick } = globalThis.BibleGames.variants;

const ruth = () => normalizePuzzle({
  answer: 'RUTH', slot: 'late',
  variants: [
    { type: 'image', img: 'ruth-member.jpg', weight: 2 },
    { type: 'rebus', clues: [{ img: 'root.jpg', word: 'ROOT' }] },
  ],
});

// In production isAvailable means "every picture this variant names resolved".
// Here we fake that by naming which files are missing.
const without = (...missing) => (v) => {
  const names = v.clues ? v.clues.map((c) => c.img) : (v.img ? [v.img] : []);
  return names.every((n) => !missing.includes(n));
};

test('a variant whose picture is missing is dropped', () => {
  const got = eligible(ruth(), without('ruth-member.jpg'));
  assert.equal(got.length, 1);
  assert.equal(got[0].type, 'rebus');
});

test('all variants survive when every picture resolved', () => {
  assert.equal(eligible(ruth(), without()).length, 2);
});

test('a variant is dropped when any one of its clues is missing', () => {
  const acts = normalizePuzzle({
    answer: 'ACTS',
    clues: [{ img: 'axe.jpg', word: 'AXE' }, { img: 'letter-s.jpg', word: 'S' }],
  });
  assert.deepEqual(eligible(acts, without('letter-s.jpg')), []);
});

test('a variant needing no picture is always available', () => {
  const verse = normalizePuzzle({ answer: 'X', type: 'text', prompt: 'a ___' });
  assert.equal(eligible(verse, without('anything.jpg')).length, 1);
});

test('a puzzle with no surviving variant yields an empty list', () => {
  assert.deepEqual(eligible(ruth(), without('ruth-member.jpg', 'root.jpg')), []);
});

test('weight biases the pick', () => {
  const vs = eligible(ruth(), without());   // weights 2 and 1, total 3
  assert.equal(pick(vs, () => 0.1).type, 'image');  // 0.3 lands in the first
  assert.equal(pick(vs, () => 0.9).type, 'rebus');  // 2.7 lands in the second
});

test('pick returns null for an empty list', () => {
  assert.equal(pick([], () => 0.5), null);
});

test('pick is safe at the top of the range', () => {
  const vs = eligible(ruth(), without());
  assert.ok(pick(vs, () => 0.999999) !== null);
});
