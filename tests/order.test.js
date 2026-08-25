'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const seeded = require('./helpers/rng.js');
require('../core/normalize.js');
require('../core/order.js');
const { normalizePuzzle } = globalThis.BibleGames.normalize;
const { zoneRange, shuffle, byDifficulty, buildOrder } = globalThis.BibleGames.order;

const p = (answer, extra) => normalizePuzzle(Object.assign({ answer }, extra || {}));
const answers = (list) => list.map((x) => x.answer);

test('zones are fractional thirds', () => {
  assert.deepEqual(zoneRange('early', 15), [0, 5]);
  assert.deepEqual(zoneRange('middle', 15), [5, 10]);
  assert.deepEqual(zoneRange('late', 15), [10, 15]);
  assert.deepEqual(zoneRange('anywhere', 15), [0, 15]);
});

test('zones degrade safely at tiny sizes', () => {
  assert.deepEqual(zoneRange('early', 3), [0, 1]);
  assert.deepEqual(zoneRange('late', 3), [2, 3]);
  assert.deepEqual(zoneRange('late', 1), [0, 1]);   // the only puzzle is the last one
});

test('late always contains the final slot, at every size', () => {
  for (let size = 1; size <= 40; size++) {
    const [start, end] = zoneRange('late', size);
    assert.equal(end, size, `late must end at size for size ${size}`);
    assert.ok(start < size, `late is empty at size ${size}`);
  }
});

test('the three zones tile the running order exactly, at every size', () => {
  for (let size = 1; size <= 40; size++) {
    const e = zoneRange('early', size);
    const m = zoneRange('middle', size);
    const l = zoneRange('late', size);
    assert.equal(e[0], 0, `early must start at 0 for size ${size}`);
    assert.equal(e[1], m[0], `early must meet middle for size ${size}`);
    assert.equal(m[1], l[0], `middle must meet late for size ${size}`);
    assert.equal(l[1], size, `late must end at size for size ${size}`);
  }
});

test('shuffle copies rather than mutating', () => {
  const input = [1, 2, 3, 4, 5];
  const out = shuffle(input, seeded(1));
  assert.deepEqual(input, [1, 2, 3, 4, 5]);
  assert.equal(out.length, 5);
  assert.deepEqual(out.slice().sort(), input.slice().sort());
});

test('byDifficulty orders bands ascending', () => {
  const list = [p('C', { difficulty: 3 }), p('A', { difficulty: 1 }), p('B', { difficulty: 2 })];
  assert.deepEqual(answers(byDifficulty(list, seeded(1), false)), ['A', 'B', 'C']);
});

test('the running order honours sessionSize', () => {
  const pool = ['A', 'B', 'C', 'D', 'E', 'F'].map((a) => p(a));
  const out = buildOrder(pool, { rng: seeded(3), shuffle: true, sessionSize: 4 });
  assert.equal(out.length, 4);
  assert.equal(new Set(answers(out)).size, 4, 'no duplicates');
});

test('a pinned puzzle is always drawn even when the session is small', () => {
  const pool = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'].map((a) => p(a))
    .concat([p('RUTH', { slot: 'late' })]);
  for (let seed = 1; seed <= 40; seed++) {
    const out = buildOrder(pool, { rng: seeded(seed), shuffle: true, sessionSize: 3 });
    assert.ok(answers(out).includes('RUTH'), `seed ${seed} dropped RUTH`);
  }
});

test('a pinned puzzle lands inside its zone', () => {
  const pool = Array.from({ length: 14 }, (_, i) => p('F' + i))
    .concat([p('RUTH', { slot: 'late' })]);
  for (let seed = 1; seed <= 40; seed++) {
    const out = buildOrder(pool, { rng: seeded(seed), shuffle: true, sessionSize: 15 });
    const at = answers(out).indexOf('RUTH');
    assert.ok(at >= 10 && at < 15, `seed ${seed} placed RUTH at ${at}`);
  }
});

test('free slots ramp upward in difficulty', () => {
  const pool = [
    p('E1', { difficulty: 1 }), p('E2', { difficulty: 1 }),
    p('M1', { difficulty: 2 }), p('M2', { difficulty: 2 }),
    p('H1', { difficulty: 3 }), p('H2', { difficulty: 3 }),
  ];
  const out = buildOrder(pool, { rng: seeded(5), shuffle: true });
  const seen = out.map((x) => x.difficulty);
  for (let i = 1; i < seen.length; i++) {
    assert.ok(seen[i] >= seen[i - 1], `difficulty dropped at ${i}: ${seen}`);
  }
});

test('an over-subscribed zone throws', () => {
  const pool = Array.from({ length: 3 }, (_, i) => p('L' + i, { slot: 'late' }))
    .concat([p('A'), p('B'), p('C')]);
  assert.throws(
    () => buildOrder(pool, { rng: seeded(1), shuffle: true, sessionSize: 6 }),
    /over-subscribed/,
  );
});

test('more pinned puzzles than slots throws', () => {
  const pool = [p('A', { slot: 'late' }), p('B', { slot: 'early' }), p('C', { slot: 'middle' })];
  assert.throws(
    () => buildOrder(pool, { rng: seeded(1), shuffle: true, sessionSize: 2 }),
    /pinned/,
  );
});

test('the same seed gives the same order', () => {
  const pool = ['A', 'B', 'C', 'D', 'E'].map((a) => p(a));
  const one = buildOrder(pool, { rng: seeded(9), shuffle: true });
  const two = buildOrder(pool, { rng: seeded(9), shuffle: true });
  assert.deepEqual(answers(one), answers(two));
});

test('shuffle false keeps deck order', () => {
  const pool = ['A', 'B', 'C'].map((a) => p(a));
  const out = buildOrder(pool, { rng: seeded(1), shuffle: false });
  assert.deepEqual(answers(out), ['A', 'B', 'C']);
});
