'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
require('../core/normalize.js');
require('../core/order.js');
require('../tools/validate.js');
globalThis.window = globalThis;
require('../games/book-names/deck.js');
const { validate } = globalThis.BibleGames.validate;

test('the shipped deck validates', () => {
  const r = validate(globalThis.DECK);
  assert.deepEqual(r.errors, [], r.errors.join('\n'));
});

test('the deck is big enough for its session size', () => {
  const r = validate(globalThis.DECK);
  assert.ok(r.playable >= globalThis.DECK.sessionSize,
    `${r.playable} playable for sessionSize ${globalThis.DECK.sessionSize}`);
});

test('Ruth ships as the root rebus, cameo not yet enabled', () => {
  const ruth = globalThis.DECK.puzzles.find((p) => p.answer === 'RUTH');
  assert.equal(ruth.variants, undefined, 'the cameo should still be commented out');
  assert.deepEqual(ruth.clues.map((c) => c.word), ['ROOT']);
});

test('every puzzle has a unique id that does not leak its answer', () => {
  const seen = new Set();
  globalThis.DECK.puzzles.forEach((p) => {
    assert.ok(p.id, `${p.answer} has no id`);
    assert.ok(!seen.has(p.id), `duplicate id ${p.id}`);
    seen.add(p.id);
    assert.ok(
      !p.id.toLowerCase().includes(String(p.answer).toLowerCase()),
      `id ${p.id} leaks its answer on the projector`,
    );
  });
});

test('every picture is expected in the one committed directory', () => {
  assert.deepEqual(globalThis.DECK.imageDirs, ['images/']);
});

test('every puzzle carries a Filipino name for the reveal', () => {
  globalThis.DECK.puzzles.forEach((p) => {
    assert.ok(p.answerAlt, `${p.answer} has no answerAlt`);
  });
});
