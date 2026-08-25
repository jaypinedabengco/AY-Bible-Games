'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
require('../core/normalize.js');
require('../core/views.js');
require('../core/gm.js');
const { hashCode, credentials, matchesLogin, rows } = globalThis.BibleGames.gm;

const deck = () => ({
  id: 'book-names',
  puzzles: [
    {
      id: 'bn-02', answer: 'JEREMIAH', flag: 'risky',
      ref: { testament: 'Old', division: 'Major Prophets', position: 24 },
      clues: [{ img: 'Jerry_Mouse.webp', word: 'JERRY' }, { img: 'maya.jpg', word: 'MAYA' }],
    },
    {
      id: 'bn-01', answer: 'JONAH', type: 'image', img: 'whale.jpg',
      ref: { testament: 'Old', division: 'Minor Prophets', position: 32 },
    },
    {
      id: 'bn-03', answer: 'RUTH',
      variants: [
        { type: 'rebus', clues: [{ img: 'root.svg', word: 'ROOT' }] },
        { type: 'image', img: 'ruth-member.jpg' },
      ],
    },
  ],
});

test('hashing is deterministic and ignores case and surrounding space', () => {
  assert.equal(hashCode('Sabbath1844'), hashCode('Sabbath1844'));
  assert.equal(hashCode('  sabbath1844  '), hashCode('SABBATH1844'));
});

test('different codes hash differently', () => {
  assert.notEqual(hashCode('alpha'), hashCode('omega'));
});

test('hashing returns an unsigned 32-bit integer', () => {
  const h = hashCode('anything');
  assert.ok(Number.isInteger(h) && h >= 0 && h <= 0xffffffff, `got ${h}`);
});

test('the right username and password unlock, the wrong ones do not', () => {
  const stored = credentials('GM', 'Adventist');
  assert.equal(matchesLogin('GM', 'Adventist', stored), true);
  assert.equal(matchesLogin('GM', 'wrong', stored), false);
  assert.equal(matchesLogin('someone', 'Adventist', stored), false);
  assert.equal(matchesLogin('someone', 'wrong', stored), false);
});

test('surrounding space and letter case are forgiven', () => {
  // A phone keyboard capitalises without being asked; the gate should not
  // punish that when the whole point is convenience.
  const stored = credentials('GM', 'Adventist');
  assert.equal(matchesLogin(' gm ', ' adventist ', stored), true);
  assert.equal(matchesLogin('Gm', 'ADVENTIST', stored), true);
});

test('a blank username or password never unlocks', () => {
  // Otherwise a bare Enter would open the answers.
  const stored = credentials('GM', 'Adventist');
  assert.equal(matchesLogin('', 'Adventist', stored), false);
  assert.equal(matchesLogin('GM', '', stored), false);
  assert.equal(matchesLogin('   ', '   ', stored), false);
  assert.equal(matchesLogin(null, null, stored), false);
  // And not even against the hash of two blanks.
  assert.equal(matchesLogin('', '', credentials('', '')), false);
});

test('the two fields cannot be swapped', () => {
  const stored = credentials('GM', 'Adventist');
  assert.equal(matchesLogin('Adventist', 'GM', stored), false);
});

test('rows are sorted by id, not by deck order', () => {
  assert.deepEqual(rows(deck()).map((r) => r.id), ['bn-01', 'bn-02', 'bn-03']);
});

test('a row carries what the game master needs to run the puzzle', () => {
  const r = rows(deck()).find((x) => x.id === 'bn-02');
  assert.equal(r.answer, 'JEREMIAH');
  assert.equal(r.ref, 'Old Testament · Major Prophets · book 24 of 66');
  assert.equal(r.working, 'JERRY + MAYA');
  assert.deepEqual(r.flags, ['risky']);
});

test('a direct-picture puzzle has no working line', () => {
  assert.equal(rows(deck()).find((x) => x.id === 'bn-01').working, null);
});

test('a puzzle with variants reports every picture it might draw', () => {
  // The projector draws one variant and the GM cannot know which, so the row
  // reports all of them. A picture-only variant contributes no working line -
  // there is nothing to read out, so `workings` holds just the rebus.
  const r = rows(deck()).find((x) => x.id === 'bn-03');
  assert.equal(r.pictures.length, 2, 'two variants, so two possible pictures');
  assert.deepEqual(r.workings, ['ROOT']);
});

test('every puzzle in the deck gets exactly one row', () => {
  assert.equal(rows(deck()).length, 3);
});
