'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const seeded = require('./rng.js');

test('seeded rng is deterministic for a given seed', () => {
  const a = seeded(42);
  const b = seeded(42);
  const first = [a(), a(), a()];
  const second = [b(), b(), b()];
  assert.deepEqual(first, second);
});

test('seeded rng returns values in [0, 1)', () => {
  const r = seeded(7);
  for (let i = 0; i < 200; i++) {
    const v = r();
    assert.ok(v >= 0 && v < 1, `out of range: ${v}`);
  }
});

test('different seeds produce different streams', () => {
  assert.notDeepEqual([seeded(1)(), seeded(1)()], [seeded(2)(), seeded(2)()]);
});
