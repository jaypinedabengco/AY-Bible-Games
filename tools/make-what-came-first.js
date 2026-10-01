/*
 * Build games/what-came-first/deck.js from tools/chronology.json.
 *
 *   node tools/make-what-came-first.js
 *
 * WHY THIS IS GENERATED AND THE OTHER DECKS ARE NOT
 *
 * Every other deck is a list of things a person wrote, and a person is the
 * right author of a pun or a clue. This one is a list of ORDERINGS, and a
 * person typing fifty orderings by hand will eventually type one backwards.
 * Nothing about a reversed pair looks wrong on the page; it looks wrong on a
 * projector, in front of a room, once.
 *
 * So the only thing written by hand is chronology.json - one dated list, short
 * enough to check properly - and every ordering is derived from it. A date
 * corrected there corrects every puzzle that uses it.
 *
 * The generator is deterministic: same input, same deck, same ids. That
 * matters because the puzzle id is printed on the projector and the game
 * master reads it off a different device, so a rebuild must not renumber
 * anything that did not change.
 */
'use strict';
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const SOURCE = path.join(ROOT, 'tools', 'chronology.json');
const TARGET = path.join(ROOT, 'games', 'what-came-first', 'deck.js');

// How far apart two items must be before they may share a screen. Closer than
// this and the room is being asked to split hairs it cannot split - and the
// two dates may even PRINT the same, which reads as a contradiction: the
// numbers claim an order while the dates say they are simultaneous.
const BANDS = [
  { difficulty: 1, min: 400, max: Infinity, want: 18 },
  { difficulty: 2, min: 150, max: 400, want: 18 },
  { difficulty: 3, min: 60, max: 150, want: 14 },
];

// Deterministic, and small enough to sit here rather than reach into core/ -
// a deck-building tool should not need the game engine.
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

function build() {
  // The file also carries _about, _caveats and _excluded, which are for the
  // person reading it, not for this program.
  const anchors = JSON.parse(fs.readFileSync(SOURCE, 'utf8')).anchors
    .slice()
    .sort((a, b) => a.year - b.year);

  const rand = rng(20260906);
  const puzzles = [];
  const used = new Set();          // triples already made
  const seen = {};                 // how often each anchor has been used

  function cost(i) { return seen[i] || 0; }

  BANDS.forEach((band) => {
    // Every triple whose two adjacent gaps both sit inside this band. Built in
    // full and then chosen from, rather than sampled, so the choice can favour
    // anchors that have not been used much yet.
    const candidates = [];
    for (let a = 0; a < anchors.length; a++) {
      for (let b = a + 1; b < anchors.length; b++) {
        const gap1 = anchors[b].year - anchors[a].year;
        if (gap1 < band.min || gap1 >= band.max) { continue; }
        for (let c = b + 1; c < anchors.length; c++) {
          const gap2 = anchors[c].year - anchors[b].year;
          if (gap2 < band.min || gap2 >= band.max) { continue; }
          // Two items printing the same date contradict the numbers beside
          // them. Cheap to check, and it cannot be checked by eye at speed.
          const shown = [anchors[a].display, anchors[b].display, anchors[c].display];
          if (new Set(shown).size !== 3) { continue; }
          candidates.push([a, b, c]);
        }
      }
    }

    let made = 0;
    while (made < band.want && candidates.length) {
      // Least-used anchors first, so the deck spreads over the whole list
      // instead of asking about Abraham eleven times.
      candidates.sort((x, y) => {
        const dx = cost(x[0]) + cost(x[1]) + cost(x[2]);
        const dy = cost(y[0]) + cost(y[1]) + cost(y[2]);
        return dx - dy;
      });
      // From the ten least-used, pick at random: pure least-used is
      // deterministic in a way that clumps.
      const pool = candidates.slice(0, Math.min(10, candidates.length));
      const pick = pool[Math.floor(rand() * pool.length)];
      const key = pick.join(',');
      candidates.splice(candidates.indexOf(pick), 1);
      if (used.has(key)) { continue; }
      used.add(key);
      pick.forEach((i) => { seen[i] = cost(i) + 1; });

      const correct = pick.map((i) => anchors[i]);
      puzzles.push({ difficulty: band.difficulty, correct, items: scramble(correct, rand) });
      made++;
    }
    if (made < band.want) {
      console.warn('  only ' + made + ' of ' + band.want
        + ' puzzles at difficulty ' + band.difficulty
        + ' - the anchor list has no more triples that far apart');
    }
  });

  return puzzles;
}

// A scramble that is never the answer. Showing the correct order and asking
// for the correct order gives the game away to anyone paying attention.
function scramble(correct, rand) {
  const labels = correct.map((c) => c.label);
  for (let attempt = 0; attempt < 20; attempt++) {
    const out = labels.slice();
    for (let i = out.length - 1; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1));
      const t = out[i]; out[i] = out[j]; out[j] = t;
    }
    if (out.join('|') !== labels.join('|')) { return out; }
  }
  return labels.slice().reverse();
}

const LANGS = [
  { tag: null, label: 'label', display: 'display',
    prompt: 'Put these in order, earliest first' },
  { tag: 'fil', label: 'label_fil', display: 'display_fil',
    prompt: 'Ayusin ito, mula sa pinakauna' },
];

function render(puzzles, header) {
  const lines = [header, 'window.DECK = {',
    "  id: 'what-came-first',",
    "  title: 'What Came First?',",
    "  idPrefix: 'wc',   // shown on the projector, so it must never hint the answer",
    '  shuffle: true,',
    '  // Two beats a puzzle rather than four, so a round moves fast. Fifteen',
    '  // sits about level with the others in playing time - capped at the list,',
    '  // because the validator rejects a session longer than it.',
    '  sessionSize: ' + Math.min(15, puzzles.length) + ',',
    "  languages: ['en', 'fil'],",
    '  howToPlay: [',
    "    'Three things from the Bible, in the wrong order.',",
    "    'The room says which came first, second and third.',",
    '  ],',
    '  // No credits and no versions: nothing here is quoted. The labels are',
    '  // ours in both languages, and a date belongs to nobody.',
    '  puzzles: ['];

  puzzles.forEach((p, i) => {
    const id = 'wc-' + String(i + 1).padStart(2, '0');
    const answer = p.correct.map((c) => c.label).join(' → ');
    lines.push('    {');
    lines.push("      id: '" + id + "', answer: '" + esc(answer) + "', difficulty: " + p.difficulty + ',');
    lines.push('      variants: [');
    // The same triple in each language. Both are variants of ONE puzzle, so a
    // Tagalog round and an English round cannot both ask it in one evening.
    LANGS.forEach((lang) => {
      // The scramble is scrambled the same way in both languages, so the two
      // rounds are the same puzzle rather than accidentally different ones.
      const order = p.items.map((w) => p.correct.findIndex((c) => c.label === w));
      lines.push("        { type: 'order', difficulty: " + p.difficulty + ','
        + (lang.tag ? " lang: '" + lang.tag + "'," : ''));
      lines.push("          prompt: '" + esc(lang.prompt) + "',");
      lines.push('          items: ['
        + order.map((i) => "'" + esc(p.correct[i][lang.label]) + "'").join(', ') + '],');
      lines.push('          correct: [');
      p.correct.forEach((c) => {
        lines.push("            { label: '" + esc(c[lang.label])
          + "', when: '" + esc(c[lang.display]) + "' },");
      });
      lines.push('          ] },');
    });
    lines.push('      ],');
    lines.push('    },');
  });

  lines.push('  ],');
  lines.push('};');
  return lines.join('\n') + '\n';
}

const HEADER = `/*
 * What Came First? - the deck.
 *
 * GENERATED. Do not edit by hand: run
 *
 *     node tools/make-what-came-first.js
 *
 * after changing tools/chronology.json, which is the one hand-written thing
 * behind this game and the only place a date should ever be corrected.
 *
 * THE GAME. Three things from the Bible go up scrambled; the room shouts which
 * order they belong in. Two beats: the scramble, then the sequence with dates.
 *
 * WHY THREE AND NOT TWO. This began as "Before or After", and a two-way
 * question is a coin flip - half a hall shouts each way and somebody is always
 * right by luck, so the moment where a room converges and KNOWS never arrives.
 * Three items have six orderings, which cannot be fluked.
 *
 * THE ACCURACY RULE, WHICH IS THE WHOLE JOB. A confident wrong answer on a
 * screen in church is worse than not having the game. So every date is hedged
 * with "c.", because the year is not the claim being made - the ORDER is - and
 * anything whose century is genuinely contested is left out of the anchor list
 * rather than guessed at. See tools/chronology.json for what was excluded and
 * why.
 */`;

if (require.main === module) {
  const puzzles = build();
  fs.writeFileSync(TARGET, render(puzzles, HEADER));
  const by = { 1: 0, 2: 0, 3: 0 };
  puzzles.forEach((p) => { by[p.difficulty]++; });
  console.log('wrote ' + puzzles.length + ' puzzles to '
    + path.relative(ROOT, TARGET)
    + '  (easy ' + by[1] + ', medium ' + by[2] + ', hard ' + by[3] + ')');
}

// HEADER is exported so the "committed deck is what the generator produces"
// test can compare against it, instead of slicing the comment block out of the
// file it is checking - which passed any change to either.
module.exports = { build, scramble, render, HEADER };
