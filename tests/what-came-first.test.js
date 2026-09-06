'use strict';
// What Came First? is the one deck nobody can proofread by eye. A reversed
// pair reads perfectly well on the page - it is only wrong on a projector, in
// front of a room, once. So the deck is GENERATED from tools/chronology.json,
// and these tests check the generated file against that source rather than
// against anybody's memory.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const chronology = JSON.parse(
  fs.readFileSync(path.join(ROOT, 'tools', 'chronology.json'), 'utf8'));

// Keyed by BOTH labels, because a Tagalog variant is the same anchor under
// another name and has to be checked just as hard - a sequence that is right
// in English and reversed in Tagalog is still wrong on a projector.
const YEAR = {};
const DISPLAY = { en: {}, fil: {} };
chronology.anchors.forEach((a) => {
  YEAR[a.label] = a.year;
  DISPLAY.en[a.label] = a.display;
  if (a.label_fil) {
    YEAR[a.label_fil] = a.year;
    // Keyed per LANGUAGE, not just per label: ABRAHAM is spelled the same in
    // both, so one shared map would let each language's date overwrite the
    // other's and the check would pass on a deck that was wrong.
    DISPLAY.fil[a.label_fil] = a.display_fil;
  }
});

function deck() {
  const g = { window: {} };
  g.window = g;
  const src = fs.readFileSync(
    path.join(ROOT, 'games', 'what-came-first', 'deck.js'), 'utf8');
  new Function('window', src)(g);
  return g.DECK;
}

test('every sequence really is in chronological order', () => {
  const wrong = [];
  deck().puzzles.forEach((p) => {
    p.variants.forEach((v) => {
      const years = v.correct.map((c) => YEAR[c.label]);
      years.forEach((y, i) => {
        if (y === undefined) {
          wrong.push(p.id + ': "' + v.correct[i].label + '" is not in chronology.json');
        } else if (i > 0 && years[i - 1] !== undefined && y <= years[i - 1]) {
          wrong.push(p.id + ': ' + v.correct[i - 1].label + ' is not before ' + v.correct[i].label);
        }
      });
    });
  });
  assert.deepEqual(wrong, [], wrong.join('\n'));
});

test('no puzzle shows a date it does not get from the chronology', () => {
  const wrong = [];
  deck().puzzles.forEach((p) => {
    p.variants.forEach((v) => {
      const display = DISPLAY[v.lang || 'en'];
      v.correct.forEach((c) => {
        if (c.when !== display[c.label]) {
          wrong.push(p.id + ' [' + (v.lang || 'en') + ']: ' + c.label
            + ' shows "' + c.when
            + '" but the chronology says "' + display[c.label] + '"');
        }
      });
    });
  });
  assert.deepEqual(wrong, [], wrong.join('\n'));
});

test('the scramble is never the answer, and no two items share a date', () => {
  const wrong = [];
  deck().puzzles.forEach((p) => {
    p.variants.forEach((v) => {
      const answer = v.correct.map((c) => c.label);
      if (String(v.items) === String(answer)) {
        wrong.push(p.id + ': the scramble IS the answer');
      }
      const shown = v.correct.map((c) => c.when);
      if (new Set(shown).size !== shown.length) {
        // Two identical dates beside numbers claiming an order read as a bug -
        // and the room is right to think so.
        wrong.push(p.id + ': two items show the same date (' + shown.join(', ') + ')');
      }
    });
  });
  assert.deepEqual(wrong, [], wrong.join('\n'));
});

test('no scramble is too wide to read from the back of a hall', () => {
  // Measured on the ROW, because that is what has to fit. 72 characters is
  // where the widest row in the deck sat when it was checked on a screen; the
  // row wraps rather than overflowing, but three lines of chips stops being a
  // glance and starts being a reading exercise.
  const wide = [];
  deck().puzzles.forEach((p) => {
    p.variants.forEach((v) => {
      const width = v.items.join('   ').length;
      if (width > 72) {
        wide.push(p.id + ' [' + (v.lang || 'en') + ']: ' + width + ' chars');
      }
    });
  });
  assert.deepEqual(wide, [], wide.join('\n'));
});

test('the committed deck is what the generator produces', () => {
  // Otherwise the deck and the chronology drift apart silently, and every
  // check above starts testing a file nobody generates any more.
  const { build, render } = require('../tools/make-what-came-first.js');
  const src = fs.readFileSync(
    path.join(ROOT, 'games', 'what-came-first', 'deck.js'), 'utf8');
  const header = src.slice(0, src.indexOf('*/') + 2);
  assert.equal(render(build(), header), src,
    'run: node tools/make-what-came-first.js');
});

test('the chronology itself is sane', () => {
  const seen = new Set();
  const problems = [];
  chronology.anchors.forEach((a) => {
    if (seen.has(a.label)) { problems.push('duplicate label: ' + a.label); }
    seen.add(a.label);
    // Hedged, always. The year is not the claim being made - the order is.
    // Tagalog hedges with "mga", the ordinary word for "about"; the Latin
    // "c." means nothing to a Filipino reader.
    if (!/^(c\. |the beginning)/.test(a.display)) {
      problems.push(a.label + ': "' + a.display + '" is not hedged');
    }
    if (!/^(mga |ang simula)/.test(a.display_fil)) {
      problems.push(a.label + ': "' + a.display_fil + '" is not hedged');
    }
    // Three of these sit in a row on one screen, so the real constraint is the
    // width of the ROW, not of any one label - the row check is below. This is
    // only a guard against a label nothing could fit; a genuinely long name is
    // allowed to be long, and the row wraps.
    [a.label, a.label_fil].forEach((lab) => {
      if (!lab) { problems.push(a.label + ': no Tagalog label'); }
      else if (lab.length > 32) { problems.push(lab + ': label too long for a projector'); }
    });
  });
  assert.deepEqual(problems, [], problems.join('\n'));
});
