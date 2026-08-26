'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
require('../core/controls.js');
const { actionFor } = globalThis.BibleGames.controls;

test('every documented key maps to its action', () => {
  assert.equal(actionFor(' '), 'advance');
  assert.equal(actionFor('ArrowLeft'), 'back');
  assert.equal(actionFor('r'), 'reshuffle');
  assert.equal(actionFor('o'), 'originalOrder');
  assert.equal(actionFor('f'), 'fullscreen');
  assert.equal(actionFor('Home'), 'restart');
  assert.equal(actionFor('?'), 'help');
});

test('letter keys are case-insensitive', () => {
  // Caps lock must not break the game halfway through a service.
  assert.equal(actionFor('R'), 'reshuffle');
  assert.equal(actionFor('O'), 'originalOrder');
  assert.equal(actionFor('F'), 'fullscreen');
});

test('undocumented keys map to nothing', () => {
  // Escape is deliberately unbound: browsers already leave fullscreen on it.
  ['a', 'Enter', 'ArrowRight', 'Escape', '1', 'Tab', '/'].forEach((k) => {
    assert.equal(actionFor(k), null, `${k} should not be bound`);
  });
});
