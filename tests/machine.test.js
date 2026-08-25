'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
require('../core/machine.js');
const { createMachine } = globalThis.BibleGames.machine;

// two items, two reveal stages each (a rebus deck)
const build = () => createMachine(['a', 'b'], () => 2);
const at = (m) => [m.state().index, m.state().stage];

test('advance walks stages then crosses to the next item', () => {
  const m = build();
  assert.deepEqual(at(m), [0, 0]);
  m.advance(); assert.deepEqual(at(m), [0, 1]);
  m.advance(); assert.deepEqual(at(m), [0, 2]);
  m.advance(); assert.deepEqual(at(m), [1, 0]);
});

test('advance clamps at the very end', () => {
  const m = build();
  for (let i = 0; i < 10; i++) { m.advance(); }
  assert.deepEqual(at(m), [1, 2]);
  assert.equal(m.state().atEnd, true);
});

test('back steps into the previous items final stage', () => {
  const m = build();
  m.advance(); m.advance(); m.advance();   // 1,0
  m.back();
  assert.deepEqual(at(m), [0, 2]);
});

test('back clamps at the start', () => {
  const m = build();
  m.back(); m.back();
  assert.deepEqual(at(m), [0, 0]);
});

test('next and prev skip whole items and reset the stage', () => {
  const m = build();
  m.advance();               // 0,1
  m.next();  assert.deepEqual(at(m), [1, 0]);
  m.advance();               // 1,1
  m.prev();  assert.deepEqual(at(m), [0, 0]);
});

test('next and prev clamp', () => {
  const m = build();
  m.next(); m.next(); assert.deepEqual(at(m), [1, 0]);
  m.prev(); m.prev(); assert.deepEqual(at(m), [0, 0]);
});

test('restart returns to the beginning', () => {
  const m = build();
  m.advance(); m.advance(); m.advance();
  m.restart();
  assert.deepEqual(at(m), [0, 0]);
});

test('state exposes the current item', () => {
  const m = build();
  assert.equal(m.state().item, 'a');
  m.next();
  assert.equal(m.state().item, 'b');
});

test('stagesFor is honoured per item', () => {
  const m = createMachine(['img', 'rebus'], (x) => (x === 'img' ? 1 : 2));
  m.advance();               // 0,1  (img has one stage)
  m.advance();               // 1,0
  assert.deepEqual(at(m), [1, 0]);
  m.advance(); m.advance();  // 1,2
  assert.deepEqual(at(m), [1, 2]);
});
