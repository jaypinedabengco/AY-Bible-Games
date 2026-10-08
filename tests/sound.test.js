'use strict';
// The one random number in this project that is deliberately NOT reproducible.
// Every other test here asserts that a rebuild gives an identical result; this
// one asserts the opposite, because "nobody can anticipate the stop" is the
// whole mechanic and a seeded delay is one a room can learn.
const test = require('node:test');
const assert = require('node:assert/strict');
require('../core/sound.js');
const { delayMs } = globalThis.BibleGames.sound;

function draws(range, n) {
  const out = [];
  for (let i = 0; i < n; i += 1) { out.push(delayMs(range)); }
  return out;
}

test('the delay stays inside the range it was given', () => {
  const out = draws([6, 20], 500);
  const bad = out.filter((ms) => ms < 6000 || ms > 20000);
  assert.deepEqual(bad, [], 'drew outside 6-20s: ' + bad.join(', '));
});

test('the delay is not reproducible, which is the point', () => {
  // A seeded delay would hand the room the one thing the game depends on
  // withholding. 500 draws over a 14-second window collapsing to fewer than
  // 50 distinct values means something is caching or seeding.
  assert.ok(new Set(draws([6, 20], 500)).size > 50,
    'the delay repeats itself - it must be drawn fresh every round');
});

test('the delay uses the whole range, not a corner of it', () => {
  const out = draws([6, 20], 500);
  assert.ok(Math.min(...out) < 9000, 'never draws near the short end');
  assert.ok(Math.max(...out) > 17000, 'never draws near the long end');
});

test('a malformed range falls back instead of breaking the game', () => {
  // These come from a hand-written deck, where a mistake is a reversed pair or
  // a missing field - not a crash. A NaN delay never fires and the game stops
  // dead in front of a room.
  [undefined, null, [], [0, 0], ['a', 'b'], [20, 6], [10]].forEach((bad) => {
    const ms = delayMs(bad);
    assert.ok(Number.isFinite(ms) && ms >= 1000 && ms <= 60000,
      JSON.stringify(bad) + ' produced ' + ms);
  });
});

test('a reversed range is read as a range, not rejected', () => {
  const out = draws([20, 6], 200);
  const bad = out.filter((ms) => ms < 6000 || ms > 20000);
  assert.deepEqual(bad, [], 'a reversed pair should still mean 6-20s');
});
