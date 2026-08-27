'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
require('../core/normalize.js');
require('../core/views.js');
const { normalizePuzzle } = globalThis.BibleGames.normalize;
const { formatRef, badgeFor, byType, stagesForItem } = globalThis.BibleGames.views;

test('a structured reference renders canon placement', () => {
  assert.equal(
    formatRef({ testament: 'Old', division: 'Major Prophets', position: 24 }),
    'Old Testament · Major Prophets · book 24 of 66',
  );
});

test('a string reference passes through and null stays null', () => {
  assert.equal(formatRef('John 3:16'), 'John 3:16');
  assert.equal(formatRef(null), null);
});

test('a partial structured reference omits missing parts', () => {
  assert.equal(formatRef({ testament: 'New' }), 'New Testament');
});

test('the badge names the language being asked', () => {
  assert.equal(badgeFor('en'), 'English');
  assert.equal(badgeFor('fil'), 'Tagalog');
});

test('rebus hides clue words until the working is shown', () => {
  const p = normalizePuzzle({
    answer: 'JEREMIAH',
    ref: { testament: 'Old', division: 'Major Prophets', position: 24 },
    clues: [{ img: 'jerry.png', word: 'JERRY' }, { img: 'maya.jpg', word: 'MAYA' }],
  });
  const v = p.variants[0];
  const r = byType.rebus;

  assert.equal(r.stages(v), 2);

  const s0 = r.view(p, v, 0);
  assert.equal(s0.kind, 'rebus');
  assert.equal(s0.badge, 'English');
  assert.deepEqual(s0.clues.map((c) => c.word), [null, null]);
  assert.equal(s0.working, null);
  assert.equal(s0.answered, null);

  const s1 = r.view(p, v, 1);
  assert.deepEqual(s1.clues.map((c) => c.word), ['JERRY', 'MAYA']);
  assert.equal(s1.working, 'JERRY + MAYA');
  assert.equal(s1.answered, null);

  const s2 = r.view(p, v, 2);
  assert.equal(s2.working, 'JERRY + MAYA');
  assert.equal(s2.answered.answer, 'JEREMIAH');
  assert.equal(s2.answered.ref, 'Old Testament · Major Prophets · book 24 of 66');
});

test('a single-clue rebus still shows a working line', () => {
  const p = normalizePuzzle({ answer: 'PSALMS', clues: [{ img: 'palms.jpg', word: 'PALMS' }] });
  const s1 = byType.rebus.view(p, p.variants[0], 1);
  assert.equal(s1.working, 'PALMS');
});

test('image reveals the answer in one stage', () => {
  const p = normalizePuzzle({ answer: 'HARI', lang: 'fil', type: 'image', img: 'crown.jpg' });
  const v = p.variants[0];
  assert.equal(byType.image.stages(v), 1);
  const s0 = byType.image.view(p, v, 0);
  assert.equal(s0.img, 'crown.jpg');
  assert.equal(s0.badge, 'Tagalog');
  assert.equal(s0.answered, null);
  assert.equal(byType.image.view(p, v, 1).answered.answer, 'HARI');
});

test('text holds the prompt and reveals the ending', () => {
  const p = normalizePuzzle({
    answer: 'begotten Son', type: 'text', ref: 'John 3:16',
    prompt: 'For God so loved the world, that he gave his only ___',
  });
  const v = p.variants[0];
  assert.equal(byType.text.stages(v), 1);
  assert.match(byType.text.view(p, v, 0).prompt, /only ___$/);
  assert.equal(byType.text.view(p, v, 0).answered, null);
  assert.equal(byType.text.view(p, v, 1).answered.answer, 'begotten Son');
});

test('binary shows both options and marks the correct one on reveal', () => {
  const p = normalizePuzzle({
    answer: 'Old', type: 'binary', prompt: 'HABAKKUK', options: ['Old', 'New'],
  });
  const v = p.variants[0];
  assert.deepEqual(byType.binary.view(p, v, 0).options, ['Old', 'New']);
  assert.equal(byType.binary.view(p, v, 0).answered, null);
  assert.equal(byType.binary.view(p, v, 1).answered.answer, 'Old');
});

test('order shows the scrambled items and reveals the sequence', () => {
  const p = normalizePuzzle({
    answer: 'Gospel order', type: 'order',
    items: ['Mark', 'Matthew', 'Luke', 'John'],
    correct: ['Matthew', 'Mark', 'Luke', 'John'],
  });
  const v = p.variants[0];
  assert.deepEqual(byType.order.view(p, v, 0).items, ['Mark', 'Matthew', 'Luke', 'John']);
  assert.equal(byType.order.view(p, v, 0).correct, null);
  assert.deepEqual(byType.order.view(p, v, 1).correct, ['Matthew', 'Mark', 'Luke', 'John']);
});

test('every view carries the puzzle id for the projector corner', () => {
  const p = normalizePuzzle({ id: 'bn-07', answer: 'JONAH', type: 'image', img: 'whale.jpg' });
  assert.equal(byType.image.view(p, p.variants[0], 0).id, 'bn-07');
  assert.equal(byType.image.view(p, p.variants[0], 1).id, 'bn-07');
});

test('stagesForItem dispatches on the variant type', () => {
  const rebus = normalizePuzzle({ answer: 'A', clues: [{ img: 'a.jpg', word: 'A' }] });
  const image = normalizePuzzle({ answer: 'B', type: 'image', img: 'b.jpg' });
  assert.equal(stagesForItem({ puzzle: rebus, variant: rebus.variants[0] }), 2);
  assert.equal(stagesForItem({ puzzle: image, variant: image.variants[0] }), 1);
});

function quotePuzzle(extra) {
  return normalizePuzzle(Object.assign({
    id: 'qs-01', answer: 'CAIN', type: 'quote',
    quote: 'Am I my brother’s keeper?',
    verse: 'Genesis 4:9',
    clue: 'he worked the ground; his brother kept sheep',
  }, extra || {}));
}

test('a quote with verse and clue reveals over four stages', () => {
  const p = quotePuzzle();
  const v = p.variants[0];
  const q = byType.quote;
  assert.equal(q.stages(v), 3);

  const s0 = q.view(p, v, 0);
  assert.equal(s0.kind, 'quote');
  assert.equal(s0.quote, 'Am I my brother’s keeper?');
  assert.equal(s0.verse, null, 'the verse must not show with the quote');
  assert.equal(s0.clue, null);
  assert.equal(s0.answered, null);

  assert.equal(q.view(p, v, 1).verse, 'Genesis 4:9');
  assert.equal(q.view(p, v, 1).clue, null, 'the clue comes after the verse');

  assert.equal(q.view(p, v, 2).clue, 'he worked the ground; his brother kept sheep');
  assert.equal(q.view(p, v, 2).answered, null);

  const s3 = q.view(p, v, 3);
  assert.deepEqual(s3.answered, { answer: 'CAIN', ref: 'Genesis 4:9' });
  assert.equal(s3.verse, null, 'the answer block prints the verse; twice reads as a mistake');
  assert.equal(s3.clue, 'he worked the ground; his brother kept sheep',
    'the clue stays up - it is the bit worth teaching');
});

test('holding the verse back drops a stage and still shows it at the reveal', () => {
  const p = quotePuzzle({ answer: 'JONAH', verse: 'Jonah 2:2', verseAtReveal: true });
  const v = p.variants[0];
  const q = byType.quote;
  assert.equal(q.stages(v), 2);
  assert.equal(q.view(p, v, 1).verse, null, 'a held verse never shows early');
  assert.equal(q.view(p, v, 1).clue, 'he worked the ground; his brother kept sheep');
  assert.deepEqual(q.view(p, v, 2).answered, { answer: 'JONAH', ref: 'Jonah 2:2' });
});

test('a quote with no clue drops the clue stage', () => {
  const p = quotePuzzle({ clue: null });
  const v = p.variants[0];
  assert.equal(byType.quote.stages(v), 2);
  assert.equal(byType.quote.view(p, v, 1).verse, 'Genesis 4:9');
  assert.deepEqual(byType.quote.view(p, v, 2).answered,
    { answer: 'CAIN', ref: 'Genesis 4:9' });
});

test('a quote alone is a two-screen puzzle', () => {
  const p = quotePuzzle({ verse: null, clue: null });
  const v = p.variants[0];
  assert.equal(byType.quote.stages(v), 1);
  assert.deepEqual(byType.quote.view(p, v, 1).answered, { answer: 'CAIN', ref: null });
});

test('a variant answer overrides the puzzle answer at the reveal', () => {
  const p = normalizePuzzle({
    id: 'qs-05', answer: 'PETER',
    variants: [
      { type: 'quote', lang: 'en', quote: 'You are the Christ.',
        verse: 'Matthew 16:16', clue: 'a fisherman' },
      { type: 'quote', lang: 'fil', answer: 'PEDRO', quote: 'Ikaw ang Cristo.',
        verse: 'Mateo 16:16', clue: 'isang mangingisda' },
    ],
  });
  const q = byType.quote;
  assert.equal(q.view(p, p.variants[0], 3).answered.answer, 'PETER');
  assert.equal(q.view(p, p.variants[1], 3).answered.answer, 'PEDRO');
});

test('stagesForItem reads the stage count off a quote variant', () => {
  const p = quotePuzzle();
  assert.equal(stagesForItem({ puzzle: p, variant: p.variants[0] }), 3);
});

test('a Tagalog quote is badged Tagalog, not English', () => {
  // The badge used to read the puzzle's lang, which is 'en' by default even
  // when the variant on screen is the Tagalog one - so a Tagalog round was
  // labelled ENGLISH in the corner.
  const p = normalizePuzzle({
    id: 'qs-01', answer: 'CAIN',
    variants: [
      { type: 'quote', lang: 'en', quote: 'Am I my brother’s keeper?', verse: 'Genesis 4:9' },
      { type: 'quote', lang: 'fil', quote: 'Aywan ko', verse: 'Genesis 4:9' },
    ],
  });
  assert.equal(byType.quote.view(p, p.variants[0], 0).badge, 'English');
  assert.equal(byType.quote.view(p, p.variants[1], 0).badge, 'Tagalog');
});
