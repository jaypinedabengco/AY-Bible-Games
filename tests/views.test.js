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
  assert.deepEqual(s3.answered, { answer: 'CAIN', alt: null, ref: 'Genesis 4:9' });
  assert.equal(s3.verse, null, 'the answer block prints the verse; twice reads as a mistake');
  assert.equal(s3.clue, 'he worked the ground; his brother kept sheep',
    'the clue stays up - it is the bit worth teaching');
});


test('a quote with no clue drops the clue stage', () => {
  const p = quotePuzzle({ clue: null });
  const v = p.variants[0];
  assert.equal(byType.quote.stages(v), 2);
  assert.equal(byType.quote.view(p, v, 1).verse, 'Genesis 4:9');
  assert.deepEqual(byType.quote.view(p, v, 2).answered,
    { answer: 'CAIN', alt: null, ref: 'Genesis 4:9' });
});

test('a quote alone is a two-screen puzzle', () => {
  const p = quotePuzzle({ verse: null, clue: null });
  const v = p.variants[0];
  assert.equal(byType.quote.stages(v), 1);
  assert.deepEqual(byType.quote.view(p, v, 1).answered,
    { answer: 'CAIN', alt: null, ref: null });
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




test('the reference always shows, and always before the clue', () => {
  // Every quote gets the same four beats. The reference is shown even when the
  // book carries the speaker's name: most quotes from those books are spoken
  // by someone else entirely - Goliath in 1 Samuel, Nebuchadnezzar in Daniel,
  // Pilate in John - so the book name is a hint far more often than a giveaway.
  const p = quotePuzzle({ answer: 'JONAH', verse: 'Jonah 1:12' });
  const v = p.variants[0];
  assert.equal(byType.quote.stages(v), 3);
  assert.equal(byType.quote.view(p, v, 1).verse, 'Jonah 1:12');
  assert.equal(byType.quote.view(p, v, 1).clue, null, 'the verse comes first');
  assert.equal(byType.quote.view(p, v, 2).clue, 'he worked the ground; his brother kept sheep');
});

test('the reveal names the person in both languages when they differ', () => {
  // A bilingual room half-knows one form and half the other. The name in the
  // language being played is the answer; the other is shown small beside it so
  // nobody is left guessing whether they got it right.
  const p = normalizePuzzle({
    id: 'qs-05', answer: 'PETER',
    variants: [
      { type: 'quote', lang: 'en', quote: 'You are the Christ.', verse: 'Matthew 16:16' },
      { type: 'quote', lang: 'fil', answer: 'PEDRO', quote: 'Ikaw ang Cristo.',
        verse: 'Mateo 16:16' },
    ],
  });
  const q = byType.quote;
  assert.deepEqual(q.view(p, p.variants[0], 2).answered,
    { answer: 'PETER', alt: 'PEDRO', ref: 'Matthew 16:16' });
  assert.deepEqual(q.view(p, p.variants[1], 2).answered,
    { answer: 'PEDRO', alt: 'PETER', ref: 'Mateo 16:16' });
});

test('a name that is the same in both languages is not repeated', () => {
  const p = normalizePuzzle({
    id: 'qs-01', answer: 'DANIEL',
    variants: [
      { type: 'quote', lang: 'en', quote: 'My God sent His angel', verse: 'Daniel 6:22' },
      { type: 'quote', lang: 'fil', answer: 'DANIEL', quote: 'Ang Dios ko', verse: 'Daniel 6:22' },
    ],
  });
  assert.equal(byType.quote.view(p, p.variants[0], 2).answered.alt, null,
    'DANIEL beside DANIEL is noise');
});

test('a deck with one language shows no second name', () => {
  const p = quotePuzzle();
  assert.equal(byType.quote.view(p, p.variants[0], 3).answered.alt, null);
});

test('the second name comes from the person, not from one quote', () => {
  // The Damascus-road quote was given the answer SAUL, which made a Tagalog
  // reveal read "PABLO / SAUL" - as though Saul were the English for Pablo,
  // and colliding with Saul the king. The pairing has to be the person's two
  // names, so the puzzle's own answer wins over a one-off override.
  const p = normalizePuzzle({
    id: 'qs-63', answer: 'PAUL',
    variants: [
      { type: 'quote', lang: 'en', answer: 'SAUL', quote: 'Who are You, Lord?',
        verse: 'Acts 9:5' },
      { type: 'quote', lang: 'en', quote: 'Men of Athens', verse: 'Acts 17:22' },
      { type: 'quote', lang: 'fil', answer: 'PABLO', quote: 'Sino ka baga, Panginoon?',
        verse: 'Mga Gawa 9:5' },
    ],
  });
  const q = byType.quote;
  assert.equal(q.view(p, p.variants[2], 2).answered.alt, 'PAUL',
    'not SAUL, which is a different person in the same deck');
  assert.equal(q.view(p, p.variants[1], 2).answered.alt, 'PABLO');
});

// ---- the object trail ---------------------------------------------------

function trailPuzzle(extra) {
  return normalizePuzzle(Object.assign({
    id: 'ot-01', answer: 'SAMSON', type: 'trail',
    items: [
      { verse: 'Judges 14:8', pictures: [{ word: 'honey' }, { word: 'a lion' }] },
      { verse: 'Judges 16:17', pictures: [{ word: 'long hair' }] },
      { verse: 'Judges 16:29', pictures: [{ word: 'two pillars' }] },
    ],
  }, extra || {}));
}

test('a trail accumulates a step at a time', () => {
  const p = trailPuzzle();
  const v = p.variants[0];
  const t = byType.trail;

  assert.equal(t.stages(v), 3, 'three steps, then the reveal');

  const s0 = t.view(p, v, 0);
  assert.equal(s0.kind, 'trail');
  assert.equal(s0.steps.length, 1);
  assert.deepEqual(s0.steps[0].pictures.map((x) => x.word), ['honey', 'a lion']);
  assert.equal(s0.answered, null);

  assert.equal(t.view(p, v, 1).steps.length, 2);
  assert.equal(t.view(p, v, 2).steps.length, 3);
  // the shared answered() shape; the second-name pairing is quote-specific
  assert.deepEqual(t.view(p, v, 3).answered, { answer: 'SAMSON', ref: null });
});

test('the references are held back until the answer', () => {
  // A reference beside step one names the book, and for a story like this the
  // book is very nearly the answer.
  const p = trailPuzzle();
  const v = p.variants[0];
  const t = byType.trail;

  assert.equal(t.view(p, v, 0).sources, null);
  assert.equal(t.view(p, v, 1).sources, null);
  assert.equal(t.view(p, v, 2).sources, null);

  const done = t.view(p, v, 3);
  assert.equal(done.sources.length, 3);
  assert.deepEqual(done.sources[0], { verse: 'Judges 14:8', words: 'honey + a lion' });
  assert.deepEqual(done.sources[1], { verse: 'Judges 16:17', words: 'long hair' });
});

test('a step with no verse of its own is left out of the sources', () => {
  const p = trailPuzzle({
    items: [
      { pictures: [{ word: 'a staff' }] },
      { verse: 'Exodus 7:10', pictures: [{ word: 'a snake' }] },
    ],
  });
  const done = byType.trail.view(p, p.variants[0], 2);
  assert.equal(done.sources.length, 1, 'only the step that has one');
  assert.equal(done.sources[0].verse, 'Exodus 7:10');
});

test('a trail step carries its pictures through, image or not', () => {
  // Text first, pictures later: the same deck plays either way.
  const p = trailPuzzle({
    items: [{ verse: 'Judges 14:8',
              pictures: [{ word: 'honey', img: 'honey.png' }, { word: 'a lion' }] }],
  });
  const step = byType.trail.view(p, p.variants[0], 0).steps[0];
  assert.equal(step.pictures[0].img, 'honey.png');
  assert.equal(step.pictures[1].img, null, 'no picture yet, and that is fine');
});

test('stagesForItem reads the step count off a trail', () => {
  const p = trailPuzzle();
  assert.equal(stagesForItem({ puzzle: p, variant: p.variants[0] }), 3);
});

// Quotation marks are a CLAIM that somebody said the words. Who Did It? shows
// a sentence of ours describing a deed, so marks around it send the room off
// hunting for a speaker - and reading "Smashed two stone tablets" as a
// quotation is exactly the confusion the two games have to avoid. Nothing on
// screen says which mode is on, so only a test keeps it honest.
test('a deck can say its text is not spoken, and loses the quote marks', () => {
  const { normalizeDeck } = globalThis.BibleGames.normalize;
  // Raw, not quotePuzzle(): that helper is already normalized, and the whole
  // point here is what normalizeDeck hands down to a variant.
  const raw = (extra) => Object.assign({
    id: 'wd-01', answer: 'MOSES', type: 'quote',
    quote: 'Smashed two stone tablets at the foot of a mountain',
    verse: 'Exodus 32:19',
    clue: 'he came down to find a golden calf and dancing',
  }, extra || {});

  const said = normalizeDeck({ puzzles: [raw()] });
  assert.equal(said.puzzles[0].variants[0].spoken, true,
    'a deck that says nothing still shows quotation marks');

  const did = normalizeDeck({ spoken: false, puzzles: [raw()] });
  assert.equal(did.puzzles[0].variants[0].spoken, false);

  const view = byType.quote.view(did.puzzles[0], did.puzzles[0].variants[0], 0);
  assert.equal(view.spoken, false, 'the view has to carry it, or paint cannot see it');
  assert.equal(view.quote, 'Smashed two stone tablets at the foot of a mountain',
    'the text itself is untouched');

  // One variant may override its deck, so a mixed deck stays possible.
  const mixed = normalizeDeck({ spoken: false, puzzles: [raw({ spoken: true })] });
  assert.equal(mixed.puzzles[0].variants[0].spoken, true);
});
