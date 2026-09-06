'use strict';
// Higher or Lower is the other deck nobody can proofread by eye. "Did the sick
// woman suffer longer than Judah served Babylon?" is a sentence you read past
// without ever checking 12 against 70 - and a wrong LONGER on a projector is
// the failure this game cannot afford. So the deck is generated from
// tools/numbers.json, and these tests recompute every answer from that source.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const src = JSON.parse(
  fs.readFileSync(path.join(ROOT, 'tools', 'numbers.json'), 'utf8'));

const BY_VALUE = {};      // "950" -> the entry, per group
src.numbers.forEach((n) => {
  BY_VALUE[n.group] = BY_VALUE[n.group] || {};
  BY_VALUE[n.group][n.value.toLocaleString('en-US')] = n;
});
const BY_STATEMENT = {};
src.numbers.forEach((n) => { BY_STATEMENT[n.statement] = n; });

function deck() {
  const g = { window: {} };
  g.window = g;
  new Function('window', fs.readFileSync(
    path.join(ROOT, 'games', 'higher-or-lower', 'deck.js'), 'utf8'))(g);
  return g.DECK;
}

// The puzzle's own number, found from the reveal note rather than trusted: the
// deck says which verse it is about, and that is the only link back.
function subjectOf(p) {
  const hits = src.numbers.filter((n) => p.answer.indexOf(n.statement) === 0);
  return hits.length === 1 ? hits[0] : null;
}

test('every bet says LONGER when it really is longer', () => {
  const wrong = [];
  deck().puzzles.forEach((p) => {
    const me = subjectOf(p);
    if (!me) { wrong.push(p.id + ': cannot tell which number it is about'); return; }
    const words = src.groups[me.group];
    p.variants.filter((v) => v.options.length === 2).forEach((v) => {
      // The GIVEN number is whatever statement the prompt opens with.
      const given = Object.keys(BY_STATEMENT)
        .filter((st) => v.prompt.indexOf(st + '.') === 0)
        .map((st) => BY_STATEMENT[st])[0];
      if (!given) { wrong.push(p.id + ': prompt does not open with a known statement'); return; }
      if (given.group !== me.group) {
        wrong.push(p.id + ': bets across groups (' + given.group + ' vs ' + me.group + ')');
      }
      if (given.value === me.value) {
        wrong.push(p.id + ': bet against an equal number, which has no answer');
      }
      const truth = me.value > given.value ? words.more : words.less;
      if (v.answer !== truth) {
        wrong.push(p.id + ': ' + me.value + ' against ' + given.value
          + ' should be ' + truth + ', deck says ' + v.answer);
      }
    });
  });
  assert.deepEqual(wrong, [], wrong.join('\n'));
});

test('every guess offers the right number, and only real ones', () => {
  const wrong = [];
  deck().puzzles.forEach((p) => {
    const me = subjectOf(p);
    if (!me) { return; }
    p.variants.filter((v) => v.options.length > 2).forEach((v) => {
      const mine = me.value.toLocaleString('en-US');
      if (v.answer !== mine) {
        wrong.push(p.id + ': answer is ' + v.answer + ', the number is ' + mine);
      }
      if (v.options.indexOf(v.answer) === -1) {
        wrong.push(p.id + ': the answer is not among its own options');
      }
      v.options.forEach((o) => {
        // A wrong option must be another REAL number from the same group. An
        // invented plausible one risks being a real figure from somewhere
        // else in the Bible, and a room told 40 is wrong deserves better.
        if (!BY_VALUE[me.group][o]) {
          wrong.push(p.id + ': "' + o + '" is not a real number in group ' + me.group);
        }
      });
      if (new Set(v.options).size !== v.options.length) {
        wrong.push(p.id + ': the same option twice');
      }
    });
  });
  assert.deepEqual(wrong, [], wrong.join('\n'));
});

test('nothing on screen gives its own answer away', () => {
  const wrong = [];
  deck().puzzles.forEach((p) => {
    const me = subjectOf(p);
    if (!me) { return; }
    p.variants.forEach((v) => {
      // The prompt is on screen BEFORE the answer. The bet's prompt does carry
      // the given number, which is fine - that one is a gift, not the answer -
      // so only this puzzle's own value is forbidden.
      const bare = String(me.value);
      const comma = me.value.toLocaleString('en-US');
      [bare, comma].forEach((form) => {
        if (new RegExp('(^|[^0-9,])' + form.replace(/,/g, ',') + '($|[^0-9])')
            .test(v.prompt) && v.options.length > 2) {
          wrong.push(p.id + ': the guess prompt contains its own answer (' + form + ')');
        }
      });
    });
  });
  assert.deepEqual(wrong, [], wrong.join('\n'));
});

test('the committed deck is what the generator produces', () => {
  const { build, render } = require('../tools/make-higher-or-lower.js');
  const file = fs.readFileSync(
    path.join(ROOT, 'games', 'higher-or-lower', 'deck.js'), 'utf8');
  const header = file.slice(0, file.indexOf('*/') + 2);
  assert.equal(render(build(), header), file,
    'run: node tools/make-higher-or-lower.js');
});

test('the numbers list itself is sane', () => {
  const problems = [];
  const seen = new Set();
  const perGroup = {};
  src.numbers.forEach((n) => {
    if (seen.has(n.id)) { problems.push('duplicate id: ' + n.id); }
    seen.add(n.id);
    perGroup[n.group] = (perGroup[n.group] || 0) + 1;
    if (!src.groups[n.group]) { problems.push(n.id + ': group ' + n.group + ' is not defined'); }
    if (!/^[^.]+ \d+:\d+/.test(n.verse)) { problems.push(n.id + ': odd verse "' + n.verse + '"'); }
    // The statement has to carry its number - it is the gift the bet gives.
    if (n.statement.replace(/,/g, '').indexOf(String(n.value)) === -1) {
      problems.push(n.id + ': the statement does not contain its own number');
    }
    // Neither ask may.
    [n.ask_bet, n.ask_guess].forEach((ask) => {
      if (ask.replace(/,/g, '').indexOf(String(n.value)) !== -1) {
        problems.push(n.id + ': an ask gives its own number away');
      }
    });
  });
  // Fewer than four and a group cannot make a fair three-way guess with real
  // numbers, nor a spread of bets.
  Object.keys(perGroup).forEach((g) => {
    if (perGroup[g] < 4) { problems.push('group ' + g + ' has only ' + perGroup[g]); }
    if (!src.groups[g].more || !src.groups[g].less) {
      problems.push('group ' + g + ' has no comparison words');
    }
  });
  // Two equal numbers in one group make an unanswerable bet.
  Object.keys(perGroup).forEach((g) => {
    const vals = src.numbers.filter((n) => n.group === g).map((n) => n.value);
    if (new Set(vals).size !== vals.length) { problems.push('group ' + g + ' repeats a value'); }
  });
  assert.deepEqual(problems, [], problems.join('\n'));
});
