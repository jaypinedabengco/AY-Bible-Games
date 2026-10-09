'use strict';
// Hot Potato is the first deck here that is not consumed by being played, so
// what these tests guard is different: not whether a fact is right, but
// whether a card can be performed by a room with nothing but a Bible.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');

function deck() {
  const g = { window: {} };
  g.window = g;
  new Function('window', fs.readFileSync(
    path.join(ROOT, 'games', 'hot-potato', 'deck.js'), 'utf8'))(g);
  return g.DECK;
}

test('every card is a task or a knowledge card, and says which', () => {
  const wrong = [];
  deck().puzzles.forEach((p) => {
    p.variants.forEach((v) => {
      if (v.type !== 'card') { wrong.push(p.id + ': type is ' + v.type); }
      if (v.kind !== 'task' && v.kind !== 'knowledge') {
        wrong.push(p.id + ': kind is ' + JSON.stringify(v.kind));
      }
    });
  });
  assert.deepEqual(wrong, [], wrong.join('\n'));
});

test('a knowledge card asks something, and a task card does not', () => {
  // A knowledge card with no prompt paints a BLANK SCREEN in front of a room -
  // the deck is hand-written, so this is one typo away at all times.
  const wrong = [];
  deck().puzzles.forEach((p) => {
    p.variants.forEach((v) => {
      if (v.kind === 'knowledge') {
        if (!v.prompt || !String(v.prompt).trim()) {
          wrong.push(p.id + ': a knowledge card with no question');
        }
        if (!p.ref) { wrong.push(p.id + ': a knowledge card with no reference'); }
      } else if (v.prompt) {
        wrong.push(p.id + ': a task card carries a prompt; its text belongs in answer');
      }
    });
  });
  assert.deepEqual(wrong, [], wrong.join('\n'));
});

test('no card needs anything the room will not have', () => {
  // A hall has Bibles, phones that are meant to be away, and each other. A
  // card calling for a prop, a screen or a costume cannot be performed, and
  // that is only discovered when it comes up.
  const banned = /\b(phone|google|search online|internet|print|video|costume|prop|whiteboard|marker)\b/i;
  const wrong = [];
  deck().puzzles.forEach((p) => {
    const text = p.answer + ' ' + p.variants.map((v) => v.prompt || '').join(' ');
    if (banned.test(text)) { wrong.push(p.id + ': "' + text.trim() + '"'); }
  });
  assert.deepEqual(wrong, [], wrong.join('\n'));
});

test('the deck is big enough for the round it asks for', () => {
  const d = deck();
  assert.ok(d.puzzles.length >= d.sessionSize,
    d.puzzles.length + ' cards cannot fill a round of ' + d.sessionSize);
});

test('the music range is sane, or absent', () => {
  const d = deck();
  if (d.musicSeconds === undefined) { return; }
  assert.ok(Array.isArray(d.musicSeconds) && d.musicSeconds.length === 2,
    'musicSeconds must be a pair');
  const [lo, hi] = d.musicSeconds;
  assert.ok(lo >= 3 && hi <= 40 && lo < hi,
    'musicSeconds ' + JSON.stringify(d.musicSeconds) + ' is not a usable range');
});

test('the shipped deck validates', () => {
  // validate.js is a CLI that calls process.exit; the function is reached off
  // the global the way tests/validate.test.js already reaches it.
  require('../core/normalize.js');
  require('../core/order.js');
  require('../tools/validate.js');
  const { validate } = globalThis.BibleGames.validate;
  assert.deepEqual(validate(deck()).errors, []);
});

test('there are enough cards that an evening does not repeat', () => {
  const d = deck();
  const tasks = d.puzzles.filter((p) => p.variants[0].kind === 'task');
  const know = d.puzzles.filter((p) => p.variants[0].kind === 'knowledge');
  assert.ok(tasks.length >= 30, 'only ' + tasks.length + ' task cards');
  assert.ok(know.length >= 15, 'only ' + know.length + ' knowledge cards');
});

test('no two cards say the same thing', () => {
  // validate.js already rejects duplicate answers, which covers task cards
  // outright. This catches two knowledge cards asking the same question with
  // different answers - which validate cannot see.
  const asked = new Map();
  const dupes = [];
  deck().puzzles.forEach((p) => {
    p.variants.forEach((v) => {
      if (!v.prompt) { return; }
      const key = v.prompt.toLowerCase().replace(/[^a-z ]/g, '').trim();
      if (asked.has(key)) { dupes.push(p.id + ' repeats ' + asked.get(key)); }
      asked.set(key, p.id);
    });
  });
  assert.deepEqual(dupes, [], dupes.join('\n'));
});

test('a task card asks for something a person can actually finish', () => {
  // "Recite the book of Psalms" is a card that ends a round. Length is a poor
  // proxy for difficulty, but an unbounded quantity is not: a card naming a
  // number the room must reach is bounded, and one that does not is suspect.
  const unbounded = /\b(all|every|the whole|entire)\b/i;
  const wrong = [];
  deck().puzzles.filter((p) => p.variants[0].kind === 'task').forEach((p) => {
    if (unbounded.test(p.answer)) { wrong.push(p.id + ': "' + p.answer + '"'); }
  });
  assert.deepEqual(wrong, [], wrong.join('\n'));
});
