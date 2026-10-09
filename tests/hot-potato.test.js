// WHAT THESE TESTS CANNOT COVER, and what was done instead.
//
// Three claims in the spec have no headless test: that the music plays, that
// the potato reads as being passed round a ring, and that the stop feels
// unpredictable. Node has no DOM and no audio, and this project has zero
// dependencies by design, so nothing here can notice if one of them breaks.
//
// They were checked by hand, in a real browser (Chrome, driven over the
// DevTools protocol), against games/hot-potato/index.html opened over file://
// - the way it runs off the USB stick - at 1600x900 and at 1920x1080, on
// 2026-10-09. What was measured:
//
//   Music plays. AudioContext 'running', 2 oscillators live, one interval, and
//   a signal on the output (RMS about 0.023) at both sizes. It stops at the
//   same instant STOP appears: the oscillators were stopped 0.3 to 1.6 ms
//   BEFORE the STOP screen was painted, in the same task, on all 20 rounds,
//   with 0 oscillators, 0 intervals and silence 150 ms later.
//
//   The potato is passed, not slid. Eight figures; the potato sits in the
//   top figure's hands for 0.55 s, then jumps a full 45 degrees to the next
//   figure at the TOP of its toss, and so on round: 8 resting positions, 9
//   instant jumps in 4.6 s, never between two figures. Brightness never
//   changes: mean frame luminance moved by at most 0.03% across 60 frames,
//   and no wisp of steam changed opacity by more than 0.021 in a frame.
//
//   The stop is unpredictable. Ten consecutive delays, in seconds, in the
//   order they happened (deck range is 6 to 20):
//     1600x900   12.72  6.98  15.90  11.35  15.32  6.17  17.69  8.49  13.90  13.10
//     1920x1080  16.72  18.11  19.74  13.48  14.25  10.02  16.19  8.69  19.26  9.14
//   Spread 11.5 s and 11.0 s, standard deviation 3.7 s and 3.9 s (a uniform
//   draw over 14 s would give 4.0), no two within 0.38 s of each other, and
//   100000 draws of sound.delayMs fall 14.2 to 14.5 percent into each 2 s band.
//   They do not cluster.
//
//   The longest card (hp-033, 136 characters) wraps to 4 lines and its text
//   bottom clears the viewport bottom by 247.5 px at 1600x900 (box bottom
//   652.5 of 900) and by 297.0 px at 1920x1080 (box bottom 783.0 of 1080). It
//   is also the worst of all 120 task cards, which were each measured; 0 overflow
//   sideways or past the bottom, and none touches the key legend or id stamp.
//
//   Also confirmed: ArrowLeft re-rolls the delay (6 presses, 6 different
//   delays); R, O and Home tear the old music down and start the new round's;
//   S leaves it silent with no timer, and nothing fired when the old delay
//   ran out; a card moves on at the third press; with AudioContext missing,
//   throwing, or its oscillators throwing, STOP arrived within 3 ms of the
//   timer; with prefers-reduced-motion the figures and the potato in the top
//   figure's hands stay, nothing moves, and STOP is still legible (contrast
//   9.83:1, inside the viewport).
//
// The LIST cards' fourth screen (the valid answers) was measured separately,
// on 2026-10-09, by rendering every list card through core/paint.js with the
// real theme.css in headless Chrome (a harness page, not index.html) at
// 1920x1080, 1600x900 and 1280x720. The answer is set at 12vmin, so a long list
// does not shrink - it wraps and runs off the screen: a 130-character list
// started 40 px above the top and ended 40 px below the bottom at 1600x900, and
// 124 and 90 characters came within 23 px of an edge. After the lists were cut
// to at most 75 characters (the longest is 74), the worst case at all three
// sizes was 85 px clear of the top and 85 px clear of the bottom at 1600x900
// (prompt top 85, answer bottom 815 of 900). The cap is tested below. If
// theme.css or paint.js changes how an answer is sized, measure again.
//
// Name the Place carries the same kind of note (see tests/atlas.test.js, on
// the masked beat) for the same reason: a text size that regressed TWICE while
// it looked covered. If a card is added that is longer than hp-033, if the
// ring or the delay range changes, or if core/sound.js changes, these
// measurements are taken again by hand - no test will notice.
//
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

test('the deck holds tasks and lists, and never a knowledge card', () => {
  // Hot Potato is performative. A TASK is something to do; a LIST card is a
  // recall challenge followed by the valid answers, there to settle "does that
  // count?". A KNOWLEDGE card is a question with an answer, which is trivia: it
  // is spent once the room has heard it. The engine still supports knowledge
  // cards, so this test is what keeps one from arriving by accident.
  //
  // It also cannot pass by checking nothing. The guards below are written per
  // kind, and a per-kind loop over a deck holding none of that kind is a green
  // test about nothing - so the deck is required to actually hold both.
  const d = deck();
  assert.ok(d.puzzles.length > 0, 'an empty deck would pass every check below');
  const tasks = d.puzzles.filter((p) => p.variants.every((v) => v.kind === 'task'));
  const lists = d.puzzles.filter((p) => p.variants.every((v) => v.kind === 'list'));
  assert.ok(tasks.length > 0, 'the deck holds no task cards, so the task guards check nothing');
  assert.ok(lists.length > 0, 'the deck holds no list cards, so the list guards check nothing');
  const wrong = [];
  d.puzzles.forEach((p) => {
    if (!p.answer || !String(p.answer).trim()) { wrong.push(p.id + ': no answer'); }
    if (!p.variants.length) { wrong.push(p.id + ': no variants'); }
    p.variants.forEach((v) => {
      if (v.type !== 'card') { wrong.push(p.id + ': type is ' + v.type); }
      if (v.kind === 'knowledge') {
        wrong.push(p.id + ': is a knowledge card; the deck is tasks and lists');
      } else if (v.kind === 'task') {
        if (p.ref) { wrong.push(p.id + ': a task carries a ref'); }
        if (v.prompt) { wrong.push(p.id + ': a task carries a prompt; its text belongs in answer'); }
      } else if (v.kind === 'list') {
        if (!v.prompt || !String(v.prompt).trim()) {
          wrong.push(p.id + ': a list card has no prompt, so there is no challenge to show');
        }
      } else {
        wrong.push(p.id + ': kind is ' + JSON.stringify(v.kind));
      }
    });
  });
  assert.deepEqual(wrong, [], wrong.join('\n'));
  assert.equal(tasks.length + lists.length, d.puzzles.length,
    'every card is exactly one kind');
});

// The names in a list card's answer, as written: one per comma, with every
// parenthesis dropped (they carry alternative spellings and notes, and may
// hold commas of their own) and the "and others" that marks an open set removed.
function listNames(answer) {
  return String(answer).replace(/\([^)]*\)/g, '').split(',')
    .map((n) => n.trim()).filter((n) => n && !/^and others$/i.test(n));
}

test('a list card that asks for a letter only offers names that start with it', () => {
  // "A king starting with X" is a cruel joke, and nothing else would catch one:
  // the card validates, renders and plays. This reads the letter off the
  // challenge and holds every answer to it, so a name filed under the wrong
  // letter - or a letter with no answers at all - fails here.
  const wrong = [];
  let checked = 0;
  deck().puzzles.forEach((p) => {
    p.variants.filter((v) => v.kind === 'list').forEach((v) => {
      const m = /starts? with ([A-Z])$/.exec(v.prompt);
      if (!m) { return; }
      checked += 1;
      const names = listNames(p.answer);
      if (!names.length) { wrong.push(p.id + ': no answers for ' + m[1]); }
      names.forEach((n) => {
        if (n.charAt(0).toUpperCase() !== m[1]) {
          wrong.push(p.id + ': "' + n + '" does not start with ' + m[1]);
        }
      });
    });
  });
  assert.ok(checked > 0, 'no list card asks for a letter, so this checked nothing');
  assert.deepEqual(wrong, [], wrong.join('\n'));
});

test('a list answer is short enough to fit on the projector', () => {
  // Not a style rule: the answer is set at 12vmin and does not shrink, so a
  // long list wraps off the top and bottom of the screen and nothing in the
  // validator, the renderer or the other tests would say so. 75 characters is
  // the measured limit (see the note at the top of this file).
  const wrong = [];
  let checked = 0;
  deck().puzzles.forEach((p) => {
    if (!p.variants.some((v) => v.kind === 'list')) { return; }
    checked += 1;
    if (String(p.answer).length > 75) {
      wrong.push(p.id + ': answer is ' + String(p.answer).length + ' characters');
    }
  });
  assert.ok(checked > 0, 'no list cards, so this checked nothing');
  assert.deepEqual(wrong, [], wrong.join('\n'));
});

test('a list card is as hard as it has few answers', () => {
  // Difficulty is judged by how many valid answers exist: many is easy, one or
  // two is hard. A card that contradicts that puts a one-answer challenge in
  // the warm-up or a ten-answer one at the end of the round.
  const wrong = [];
  let checked = 0;
  deck().puzzles.forEach((p) => {
    if (!p.variants.some((v) => v.kind === 'list')) { return; }
    checked += 1;
    const n = listNames(p.answer).length;
    if (n >= 6 && p.difficulty !== 1) { wrong.push(p.id + ': ' + n + ' answers but difficulty ' + p.difficulty); }
    if (n <= 2 && p.difficulty !== 3) { wrong.push(p.id + ': ' + n + ' answers but difficulty ' + p.difficulty); }
  });
  assert.ok(checked > 0, 'no list cards, so this checked nothing');
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
  assert.ok(d.puzzles.length >= 60, 'only ' + d.puzzles.length + ' cards');
});

test('no two cards say the same thing', () => {
  // validate.js rejects identical answers; this also catches the same card
  // written twice with different capitalisation or punctuation.
  const seen = new Map();
  const dupes = [];
  deck().puzzles.forEach((p) => {
    const key = p.answer.toLowerCase().replace(/[^a-z ]/g, '').replace(/\s+/g, ' ').trim();
    if (seen.has(key)) { dupes.push(p.id + ' repeats ' + seen.get(key)); }
    seen.set(key, p.id);
  });
  assert.deepEqual(dupes, [], dupes.join('\n'));
});

test('a task card asks for something a person can actually finish', () => {
  // "Recite the book of Psalms" is a card that ends a round. Length is a poor
  // proxy for difficulty, but an unbounded quantity is not: a card naming a
  // number the room must reach is bounded, and one that does not is suspect.
  // Tasks only: a list card's `answer` is its valid answers, not an instruction.
  const unbounded = /\b(all|every|the whole|entire)\b/i;
  const wrong = [];
  deck().puzzles.forEach((p) => {
    if (!p.variants.every((v) => v.kind === 'task')) { return; }
    if (unbounded.test(p.answer)) { wrong.push(p.id + ': "' + p.answer + '"'); }
  });
  assert.deepEqual(wrong, [], wrong.join('\n'));
});

test('every card has a difficulty, and the mix is playable', () => {
  // Hard recall cards are exposing by nature. A round ramps 1 -> 2 -> 3, and
  // the deck must hold enough easy, warm cards that a shy person is rarely the
  // one who draws the Ten Commandments.
  const d = deck();
  const count = { 1: 0, 2: 0, 3: 0 };
  const wrong = [];
  d.puzzles.forEach((p) => {
    if (![1, 2, 3].includes(p.difficulty)) {
      wrong.push(p.id + ': difficulty is ' + JSON.stringify(p.difficulty));
    } else { count[p.difficulty]++; }
  });
  assert.deepEqual(wrong, [], wrong.join('\n'));
  const n = d.puzzles.length;
  assert.ok(count[3] >= 15, 'only ' + count[3] + ' hard recall cards');
  assert.ok(count[1] / n >= 0.3, 'easy cards are only ' + count[1] + ' of ' + n);
  assert.ok(count[3] / n <= 0.3, 'hard cards are ' + count[3] + ' of ' + n + ' - too exposing');
});
