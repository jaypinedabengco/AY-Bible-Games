'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');

function source(name) {
  return JSON.parse(fs.readFileSync(
    path.join(ROOT, 'tools', 'atlas-source', name + '.json'), 'utf8'));
}

test('the clipped source lies inside its own window', () => {
  const bad = [];
  ['holyland', 'bibleworld'].forEach((name) => {
    const src = source(name);
    const [W, E, S, N] = src.window;
    const every = []
      .concat(src.land)
      .concat(src.lakes.map((l) => l.ring))
      .concat(src.rivers.map((r) => r.line));
    every.forEach((line) => {
      line.forEach((p) => {
        // A little slack: a clipped run keeps the point that carried it out
        // of the window, so an exact bound would fail on correct data.
        if (p[0] < W - 1 || p[0] > E + 1 || p[1] < S - 1 || p[1] > N + 1) {
          bad.push(name + ': point ' + p + ' is far outside ' + src.window);
        }
      });
    });
  });
  assert.deepEqual(bad, [], bad.join('\n'));
});

test('each source has the features the map needs', () => {
  const hl = source('holyland');
  const names = hl.lakes.map((l) => l.name);
  assert.ok(names.includes('Sea of Galilee'), 'holyland needs the Sea of Galilee');
  assert.ok(names.includes('Dead Sea'), 'holyland needs the Dead Sea');
  assert.ok(hl.rivers.some((r) => r.name === 'Jordan'), 'holyland needs the Jordan');

  const bw = source('bibleworld');
  const rivers = bw.rivers.map((r) => r.name);
  assert.ok(rivers.includes('Nile'), 'bibleworld needs the Nile');
  assert.ok(rivers.includes('Euphrates'), 'bibleworld needs the Euphrates');
});
