/*
 * Build games/higher-or-lower/deck.js from tools/numbers.json.
 *
 *   node tools/make-higher-or-lower.js
 *
 * GENERATED, for the same reason What Came First? is: the content is FACTS,
 * not writing. A mistyped number looks perfectly fine on the page and is only
 * wrong on a projector, in front of a room, once. So the hand-written thing is
 * one list of numbers, short enough to check properly, and both ways of asking
 * are derived from it - which also means the bet and the guess about a number
 * can never disagree with each other.
 *
 * Each number becomes ONE puzzle with two variants:
 *
 *   a BET    another number from its group is given, and the room says
 *            whether this one is higher or lower. Two options.
 *   a GUESS  three numbers, one right. Harder, so it lands later in a round.
 *
 * Both on one puzzle, so a round never asks about the same number twice.
 *
 * Deterministic: same input, same deck, same ids. The id is printed on the
 * projector and read off a different device, so a rebuild must not renumber
 * anything that did not change.
 */
'use strict';
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const SOURCE = path.join(ROOT, 'tools', 'numbers.json');
const TARGET = path.join(ROOT, 'games', 'higher-or-lower', 'deck.js');

// How far apart two numbers are, as a ratio, and what that makes the puzzle.
// 969 against 950 is a coin flip and delightful; 969 against 120 is nothing.
function bandOf(a, b) {
  const r = Math.max(a, b) / Math.min(a, b);
  if (r >= 4) { return 1; }
  if (r >= 1.5) { return 2; }
  return 3;
}

function rng(seed) {
  let a = seed >>> 0;
  return function () {
    a += 0x6d2b79f5;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function esc(s) {
  return String(s).replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

// 144000 reads as a phone number on a wall. The option and the answer are both
// made here so they are the same string - the reveal marks the correct option
// by comparing them, and a mismatch would light nothing up.
function money(n) { return n.toLocaleString('en-US'); }

function build() {
  const src = JSON.parse(fs.readFileSync(SOURCE, 'utf8'));
  const groups = src.groups;
  const numbers = src.numbers;
  const rand = rng(20260906);

  const byGroup = {};
  numbers.forEach((n) => { (byGroup[n.group] = byGroup[n.group] || []).push(n); });

  return numbers.map((n, i) => {
    const siblings = byGroup[n.group].filter((o) => o.id !== n.id);
    const words = groups[n.group];

    // THE BET. Aim the three bands round-robin so a round has a spread rather
    // than fifty coin flips or fifty giveaways.
    const wantBand = (i % 3) + 1;
    const inBand = siblings.filter((o) => bandOf(n.value, o.value) === wantBand);
    const pool = inBand.length ? inBand : siblings;
    const given = pool[Math.floor(rand() * pool.length)];

    // GUESS distractors: the two NEAREST real numbers in the group. Never an
    // invented one - a plausible made-up number risks being a real figure from
    // elsewhere in the Bible, and a room told 40 is wrong deserves better than
    // a number we invented.
    const near = siblings.slice()
      .sort((a, b) => Math.abs(Math.log(a.value / n.value))
                    - Math.abs(Math.log(b.value / n.value)))
      .slice(0, 2);
    const options = [n].concat(near)
      .sort((a, b) => a.value - b.value)
      .map((o) => money(o.value));

    return {
      number: n,
      bet: {
        given: given,
        answer: n.value > given.value ? words.more : words.less,
        options: [words.more, words.less],
        difficulty: bandOf(n.value, given.value),
      },
      guess: {
        options: options,
        answer: money(n.value),
        // Set by the nearest wrong option, which is what the room is actually
        // up against.
        difficulty: bandOf(n.value, near[0].value),
      },
    };
  });
}

function render(puzzles, header) {
  const lines = [header, 'window.DECK = {',
    "  id: 'higher-or-lower',",
    "  title: 'Higher or Lower',",
    "  idPrefix: 'hl',   // shown on the projector, so it must never hint the answer",
    '  shuffle: true,',
    '  // Two beats a puzzle, like What Came First?, so a round moves fast.',
    '  sessionSize: 15,',
    "  languages: ['en'],",
    '  howToPlay: [',
    "    'A number from the Bible, then one to bet on.',",
    "    'Sometimes three to choose from instead.',",
    '  ],',
    '  // No credits and no versions: nothing here is quoted. The sentences are',
    '  // ours, and a number belongs to nobody.',
    '  puzzles: ['];

  puzzles.forEach((p, i) => {
    const id = 'hl-' + String(i + 1).padStart(2, '0');
    const n = p.number;
    const where = n.note ? n.note + ' · ' + n.verse : n.verse;
    lines.push('    {');
    lines.push("      id: '" + id + "', answer: '"
      + esc(n.statement + ' · ' + n.verse) + "', difficulty: " + p.bet.difficulty + ',');
    lines.push('      variants: [');

    lines.push("        { type: 'binary', difficulty: " + p.bet.difficulty + ',');
    lines.push("          prompt: '" + esc(p.bet.given.statement + '. ' + n.ask_bet) + "',");
    lines.push('          options: [' + p.bet.options.map((o) => "'" + esc(o) + "'").join(', ') + '],');
    lines.push("          answer: '" + esc(p.bet.answer) + "',");
    lines.push("          ref: '" + esc(n.statement + ' — ' + where) + "' },");

    lines.push("        { type: 'binary', difficulty: " + p.guess.difficulty + ',');
    lines.push("          prompt: '" + esc(n.ask_guess) + "',");
    lines.push('          options: [' + p.guess.options.map((o) => "'" + esc(o) + "'").join(', ') + '],');
    lines.push("          answer: '" + esc(p.guess.answer) + "',");
    lines.push("          ref: '" + esc(where) + "' },");

    lines.push('      ],');
    lines.push('    },');
  });

  lines.push('  ],');
  lines.push('};');
  return lines.join('\n') + '\n';
}

const HEADER = `/*
 * Higher or Lower - the deck.
 *
 * GENERATED. Do not edit by hand: run
 *
 *     node tools/make-higher-or-lower.js
 *
 * after changing tools/numbers.json, which is the one hand-written thing behind
 * this game and the only place a number should ever be corrected.
 *
 * THE GAME. A number from the Bible, then one to bet on - or three to choose
 * from. Two beats: the question, then the answer with where it comes from.
 * This is the one game here with a gambling shape: the room commits before it
 * knows, which is a different feeling from the others, all of which reward
 * recall. That is why a two-way question is right here and was wrong for What
 * Came First? - nobody is expected to KNOW, so nobody is robbed by luck.
 *
 * THE ACCURACY RULE. The number must be STATED in the text, never summed or
 * inferred, and must read the SAME in any common translation. See
 * tools/numbers.json for what that excluded and why - Goliath's height and
 * "seventy times seven" are both out, and the ten plagues are out because
 * Exodus never says ten.
 *
 * ONE KNOWN ROUGH EDGE. A bet GIVES one number in order to ask about another,
 * so a round can state a number that a later puzzle asks for. It is a filler
 * game and the room having seen it counts as reinforcement rather than a leak,
 * but it is real, and no build-time generator can prevent it: the round is
 * drawn at random when the game starts.
 */`;

if (require.main === module) {
  const puzzles = build();
  fs.writeFileSync(TARGET, render(puzzles, HEADER));
  const by = { 1: 0, 2: 0, 3: 0 };
  puzzles.forEach((p) => { by[p.bet.difficulty]++; by[p.guess.difficulty]++; });
  console.log('wrote ' + puzzles.length + ' puzzles ('
    + (puzzles.length * 2) + ' variants) to ' + path.relative(ROOT, TARGET)
    + '  (easy ' + by[1] + ', medium ' + by[2] + ', hard ' + by[3] + ')');
}

module.exports = { build, render, bandOf, money };
