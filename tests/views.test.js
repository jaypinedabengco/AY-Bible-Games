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
  // Rows now, not bare strings, so each can carry a date - see the test below
  // that a plain string still works.
  assert.deepEqual(byType.order.view(p, v, 1).correct.map((r) => r.label),
                   ['Matthew', 'Mark', 'Luke', 'John']);
});

// What Came First? puts three things on the screen and the room shouts the
// order. The renderer existed but had never been on a projector, and three
// things about it were wrong for that job.
test('an ordering puzzle asks the room something', () => {
  const p = normalizePuzzle({
    answer: 'ABRAHAM \u2192 THE EXODUS \u2192 DAVID', type: 'order',
    prompt: 'Put these in order, earliest first',
    items: ['THE EXODUS', 'DAVID BECOMES KING', 'ABRAHAM'],
    correct: [
      { label: 'ABRAHAM', when: 'c. 2000 BC' },
      { label: 'THE EXODUS', when: 'c. 1400 BC' },
      { label: 'DAVID BECOMES KING', when: 'c. 1000 BC' },
    ],
  });
  const v = p.variants[0];
  // Without this the screen shows three words and no task.
  assert.equal(byType.order.view(p, v, 0).prompt, 'Put these in order, earliest first');
});

test('an ordering puzzle does not number the items until they are ordered', () => {
  const p = normalizePuzzle({
    answer: 'A \u2192 B', type: 'order',
    items: ['B', 'A'],
    correct: ['A', 'B'],
  });
  const v = p.variants[0];
  // The scrambled row must say it is scrambled. Numbering it 1, 2, 3 tells the
  // room an order that is wrong - the one thing this screen must not do.
  assert.equal(byType.order.view(p, v, 0).numbered, false);
  assert.equal(byType.order.view(p, v, 1).numbered, true);
});

test('an ordering puzzle carries a date for each item, and still takes plain strings', () => {
  const dated = normalizePuzzle({
    answer: 'x', type: 'order',
    items: ['B', 'A'],
    correct: [{ label: 'A', when: 'c. 2000 BC' }, { label: 'B', when: 'c. 1400 BC' }],
  });
  const rows = byType.order.view(dated, dated.variants[0], 1).correct;
  assert.deepEqual(rows, [
    { label: 'A', when: 'c. 2000 BC' },
    { label: 'B', when: 'c. 1400 BC' },
  ]);

  // The shape that already existed keeps working: a bare string is an item
  // with no date, not a crash.
  const plain = normalizePuzzle({
    answer: 'Gospel order', type: 'order',
    items: ['Mark', 'Matthew'],
    correct: ['Matthew', 'Mark'],
  });
  assert.deepEqual(byType.order.view(plain, plain.variants[0], 1).correct, [
    { label: 'Matthew', when: null },
    { label: 'Mark', when: null },
  ]);
});

test('an ordering puzzle has no shoutable answer, so it prints no answer block', () => {
  const p = normalizePuzzle({
    answer: 'ABRAHAM \u2192 MOSES', type: 'order',
    items: ['MOSES', 'ABRAHAM'], correct: ['ABRAHAM', 'MOSES'],
  });
  // The ordered list IS the answer. Printing puzzle.answer underneath it at
  // projector size would repeat the same thing in a worse format - and the
  // answer field here exists only so the game master page has a row label.
  assert.equal(byType.order.view(p, p.variants[0], 1).answered, null);
});

// This bug has now happened twice: a Tagalog round labelled ENGLISH, because
// language lives on the VARIANT and the badge was read off the puzzle. Fixed
// the first time inside the quote renderer alone, which is exactly why it came
// back on a different one. The check belongs on EVERY renderer.
test('every renderer badges the round in the language it is actually asking in', () => {
  const wrong = [];
  const cases = {
    rebus: { answer: 'A', clues: [{ img: 'a.jpg', word: 'A' }] },
    image: { answer: 'A', type: 'image', img: 'a.jpg' },
    text: { answer: 'A', type: 'text', clue: 'a' },
    quote: { answer: 'A', type: 'quote', quote: 'a', verse: 'X 1:1', clue: 'c' },
    binary: { answer: 'A', type: 'binary', prompt: 'p', options: ['A', 'B'] },
    trail: { answer: 'A', type: 'trail', items: [{ pictures: [{ word: 'a' }] }] },
    order: { answer: 'A', type: 'order', items: ['B', 'A'], correct: ['A', 'B'] },
  };
  Object.keys(cases).forEach((kind) => {
    // The puzzle says nothing about language; the variant says Tagalog. That
    // is the real shape of every bilingual deck here.
    const p = normalizePuzzle(Object.assign({ lang: 'en' }, cases[kind]));
    p.variants[0].lang = 'fil';
    const badge = byType[kind].view(p, p.variants[0], 0).badge;
    if (badge !== badgeFor('fil')) {
      wrong.push(kind + ' badged "' + badge + '" on a Tagalog variant');
    }
  });
  assert.deepEqual(wrong, [], wrong.join('\n'));
});

// The binary renderer had never been on a screen either. In a bilingual deck
// the OPTIONS are per-variant - LONGER/SHORTER become MAS MAHABA/MAS MAIKLI -
// so an answer read off the puzzle matches none of them and the reveal
// highlights nothing at all. Same shape as the badge bug: a shared helper
// reading the puzzle where language lives on the variant.
test('a reveal marks the right option in the language being played', () => {
  const p = normalizePuzzle({
    answer: 'SHORTER', type: 'binary',
    prompt: 'Methuselah lived 969 years. Did NOAH live longer or shorter?',
    options: ['LONGER', 'SHORTER'],
    ref: 'Noah lived 950 years',
    variants: [
      { type: 'binary', prompt: 'en', options: ['LONGER', 'SHORTER'] },
      { type: 'binary', lang: 'fil', answer: 'MAS MAIKLI',
        ref: 'Nabuhay si Noe ng 950 taon',
        prompt: 'fil', options: ['MAS MAHABA', 'MAS MAIKLI'] },
    ],
  });
  const en = byType.binary.view(p, p.variants[0], 1);
  assert.equal(en.answered.answer, 'SHORTER');
  assert.ok(en.options.includes(en.answered.answer), 'English answer is one of its options');

  const fil = byType.binary.view(p, p.variants[1], 1);
  assert.equal(fil.answered.answer, 'MAS MAIKLI');
  assert.ok(fil.options.includes(fil.answered.answer),
    'the Tagalog answer must be one of the Tagalog options, or nothing lights up');
  assert.equal(fil.answered.ref, 'Nabuhay si Noe ng 950 taon',
    'the reveal note is translated too');
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

test('a map puzzle reveals over five beats', () => {
  const p = normalizePuzzle({
    id: 'np-01', answer: 'JERICHO', type: 'map',
    extent: 'holyland', at: [35.44, 31.87],
    verse: 'Joshua 6:20', clue: 'the walls fell down flat',
  });
  const v = p.variants[0];
  assert.equal(byType.map.stages(v), 4, 'pin, verse, clue, first letter - then the answer');

  const s0 = byType.map.view(p, v, 0);
  assert.equal(s0.kind, 'map');
  assert.deepEqual(s0.at, [35.44, 31.87]);
  assert.equal(s0.extent, 'holyland');
  assert.equal(s0.verse, null, 'the verse is beat 2, not beat 1');
  assert.equal(s0.clue, null);
  assert.equal(s0.masked, null);
  assert.equal(s0.answered, null);

  assert.equal(byType.map.view(p, v, 1).verse, 'Joshua 6:20');
  assert.equal(byType.map.view(p, v, 1).clue, null);
  assert.equal(byType.map.view(p, v, 1).masked, null);
  assert.equal(byType.map.view(p, v, 2).clue, 'the walls fell down flat');
  assert.equal(byType.map.view(p, v, 2).masked, null);
  const s3 = byType.map.view(p, v, 3);
  assert.equal(s3.masked, 'J______', 'the first letter, with the rest hidden');
  assert.equal(s3.answered, null);
  assert.equal(s3.verse, 'Joshua 6:20', 'the earlier lines stay up');
  assert.equal(s3.clue, 'the walls fell down flat');
  assert.equal(byType.map.view(p, v, 4).answered.answer, 'JERICHO');
  // The pin is on screen from the first beat and never leaves - it is the
  // question, and the room is still looking at it when the answer lands.
  [0, 1, 2, 3, 4].forEach((s) => {
    assert.deepEqual(byType.map.view(p, v, s).at, [35.44, 31.87]);
    assert.equal(byType.map.view(p, v, s).extent, 'holyland');
  });
});

// A place whose clue is not written yet.
test('a map puzzle with no clue has one beat fewer, not an empty one', () => {
  const p = normalizePuzzle({
    id: 'np-02', answer: 'GAZA', type: 'map',
    extent: 'holyland', at: [34.47, 31.50], verse: 'Judges 16:21',
  });
  const v = p.variants[0];
  assert.equal(byType.map.stages(v), 3, 'pin, verse, first letter - then the answer');
  assert.equal(byType.map.view(p, v, 1).verse, 'Judges 16:21');
  assert.equal(byType.map.view(p, v, 1).clue, null);
  assert.equal(byType.map.view(p, v, 2).masked, 'G___');
  assert.equal(byType.map.view(p, v, 2).clue, null, 'no blank clue beat');
  assert.equal(byType.map.view(p, v, 3).answered.answer, 'GAZA',
    'the answer arrives one beat earlier, not after a blank screen');
});

test('a Tagalog map puzzle is badged, masked and answered in Tagalog', () => {
  const p = normalizePuzzle({
    id: 'np-03', answer: 'JERICHO', type: 'map',
    variants: [
      { type: 'map', extent: 'holyland', at: [35.44, 31.87],
        verse: 'Joshua 6:20', clue: 'the walls fell down flat' },
      { type: 'map', lang: 'fil', answer: 'JERICO',
        extent: 'holyland', at: [35.44, 31.87],
        verse: 'Josue 6:20', clue: 'gumuho ang pader' },
    ],
  });
  const fil = byType.map.view(p, p.variants[1], 4);
  assert.equal(fil.badge, badgeFor('fil'));
  assert.equal(fil.answered.answer, 'JERICO');
  assert.equal(fil.answered.alt, 'JERICHO', 'both name forms at the reveal');
  assert.equal(fil.lang, 'fil', 'the map labels its water in the language played');
  assert.equal(byType.map.view(p, p.variants[0], 0).lang, 'en');
  // The mask reads the VARIANT's answer - the trap the badge fell into twice.
  assert.equal(byType.map.view(p, p.variants[1], 3).masked, 'J_____');
  assert.equal(byType.map.view(p, p.variants[0], 3).masked, 'J______');
});

test('a map puzzle with neither verse nor clue is pin, first letter, answer', () => {
  const p = normalizePuzzle({
    id: 'np-04', answer: 'NAZARETH', type: 'map',
    extent: 'holyland', at: [35.3, 32.7],
  });
  const v = p.variants[0];
  assert.equal(byType.map.stages(v), 2, 'the mask needs nothing from the deck');
  assert.equal(byType.map.view(p, v, 0).masked, null);
  assert.equal(byType.map.view(p, v, 0).answered, null);
  assert.equal(byType.map.view(p, v, 1).masked, 'N_______');
  assert.equal(byType.map.view(p, v, 1).answered, null);
  assert.equal(byType.map.view(p, v, 2).answered.answer, 'NAZARETH');
});

test('the verse leaves the screen at the reveal, as on the quote games', () => {
  const p = normalizePuzzle({
    id: 'np-05', answer: 'JERICHO', type: 'map',
    extent: 'holyland', at: [35.44, 31.87],
    verse: 'Joshua 6:20', clue: 'the walls fell down flat',
  });
  const v = p.variants[0];
  const s4 = byType.map.view(p, v, 4);
  assert.equal(s4.verse, null, 'the answer block prints it instead');
  assert.equal(s4.answered.ref, 'Joshua 6:20');
});

test('the mask is derived: words keep their spaces, punctuation stays put', () => {
  const { maskAnswer } = globalThis.BibleGames.views;
  assert.equal(maskAnswer('JERICHO'), 'J______');
  assert.equal(maskAnswer('THE DEAD SEA'), 'T__ D___ S__');
  assert.equal(maskAnswer('ANTIOCH IN PISIDIA'), 'A______ I_ P______');
  assert.equal(maskAnswer("PATMOS-ISLE O'ER"), "P_____-____ O'__");
  assert.equal(maskAnswer('BETHLEHEM EPHRATAH').split(' ').length, 2);
  assert.equal(maskAnswer(''), null);
});

// UR masks to U_ - half the name, handed over on the beat that is supposed to
// be the last hint held back. One beat fewer is the right answer, exactly as a
// place with no clue written yet already produces.
test('a name of three letters or fewer has no masked beat at all', () => {
  const short = (answer, extra) => normalizePuzzle(Object.assign({
    id: 'np-10', answer: answer, type: 'map', extent: 'bibleworld', at: [46.1, 30.96],
  }, extra || {}));

  const ur = short('UR', { verse: 'Genesis 11:31', clue: 'where Abram set out from' });
  const v = ur.variants[0];
  assert.equal(byType.map.stages(v), 3, 'pin, verse, clue - then the answer, with no U_');
  for (let s = 0; s <= 3; s += 1) {
    assert.equal(byType.map.view(ur, v, s).masked, null, 'stage ' + s);
  }
  assert.equal(byType.map.view(ur, v, 3).answered.answer, 'UR',
    'the answer arrives one beat earlier, not after a beat that gave it away');

  // The boundary, and the letter count is of LETTERS: a hyphen does not buy a
  // name an extra beat.
  assert.equal(byType.map.view(short('DAN'), short('DAN').variants[0], 1).masked, null);
  assert.equal(byType.map.view(short('A-B'), short('A-B').variants[0], 1).masked, null);
  const four = short('GAZA');
  assert.equal(byType.map.view(four, four.variants[0], 1).masked, 'G___',
    'four letters is enough to be worth hiding three of them');
});

test('the beat count follows the answer of the language being played', () => {
  // The English variant of a generated puzzle carries no answer of its own, so
  // stagesForItem has to read the puzzle's. UR is UR in both languages; a name
  // that is short in one language only would differ, and should.
  const p = normalizePuzzle({
    id: 'np-11', answer: 'UR', type: 'map',
    variants: [
      { type: 'map', extent: 'bibleworld', at: [46.1, 30.96], verse: 'Genesis 11:31' },
      { type: 'map', lang: 'fil', answer: 'UR',
        extent: 'bibleworld', at: [46.1, 30.96], verse: 'Genesis 11:31' },
    ],
  });
  assert.equal(stagesForItem({ puzzle: p, variant: p.variants[0] }), 2,
    'pin, verse - then the answer');
  assert.equal(stagesForItem({ puzzle: p, variant: p.variants[1] }), 2);
  const long = normalizePuzzle({
    id: 'np-12', answer: 'NAZARETH', type: 'map',
    variants: [{ type: 'map', extent: 'holyland', at: [35.3, 32.7], verse: 'Luke 4:16' }],
  });
  assert.equal(stagesForItem({ puzzle: long, variant: long.variants[0] }), 3,
    'the masked beat is back when the name is long enough for it');
});

test('the mask never shares a stage with the answer, whatever the puzzle has', () => {
  [
    { verse: 'A 1:1', clue: 'c' }, { verse: 'A 1:1' }, { clue: 'c' }, {},
  ].forEach((extra) => {
    const p = normalizePuzzle(Object.assign({
      id: 'np-09', answer: 'THE DEAD SEA', type: 'map',
      extent: 'holyland', at: [35.4, 31.5],
    }, extra));
    const v = p.variants[0];
    const n = byType.map.stages(v);
    let masks = 0;
    for (let s = 0; s <= n; s += 1) {
      const view = byType.map.view(p, v, s);
      assert.ok(!(view.masked && view.answered), 'stage ' + s + ' ' + JSON.stringify(extra));
      if (view.masked) { masks += 1; assert.equal(s, n - 1, 'mask is the beat before the answer'); }
    }
    assert.equal(masks, 1, 'exactly one mask beat ' + JSON.stringify(extra));
  });
});

// Land is FILLED, never stroked. Clipping a continent to the window leaves
// segments lying exactly on its edge, and a stroke draws them as a border -
// and borders are the one thing this map must not assert.
//
// So the check is not "does a .land rule mention stroke" but "does ANY rule
// with a stroke have a selector that could match a land path". A stroke is
// only allowed where the selector explicitly names something that is not land.
const NOT_LAND = ['ridges', 'rivers', 'lakes', 'peaks', 'locator', 'furniture', 'pin-'];

// Every style rule in a stylesheet, at-rules flattened: the rules inside an
// @media block are returned as rules of their own. @keyframes and @font-face
// hold no selectors, so they are skipped.
function styleRules(css) {
  const text = css.replace(/\/\*[\s\S]*?\*\//g, '');
  const out = [];
  (function walk(from, to) {
    let i = from;
    while (i < to) {
      const open = text.indexOf('{', i);
      if (open === -1 || open >= to) { break; }
      let depth = 1, j = open + 1;
      while (j < to && depth > 0) {
        if (text[j] === '{') { depth++; } else if (text[j] === '}') { depth--; }
        j++;
      }
      const head = text.slice(i, open).trim();
      if (/^@(media|supports|layer|container)/.test(head)) {
        walk(open + 1, j - 1);
      } else if (!head.startsWith('@')) {
        out.push({ selector: head, body: text.slice(open + 1, j - 1) });
      }
      i = j;
    }
  })(0, text.length);
  return out;
}

// The rules that stroke something that might be land.
function landStrokeLeaks(css) {
  const leaks = [];
  styleRules(css).forEach((r) => {
    if (!/stroke/.test(r.body)) { return; }
    r.selector.split(',').forEach((part) => {
      const named = NOT_LAND.some((cls) => part.indexOf('.' + cls) !== -1);
      if (!named) { leaks.push(part.trim() + ' { ' + r.body.trim() + ' }'); }
    });
  });
  return leaks;
}

const THEME_CSS = require('node:fs').readFileSync(
  require('node:path').join(__dirname, '..', 'core', 'theme.css'), 'utf8');

test('the stylesheet never strokes the land', () => {
  assert.ok(styleRules(THEME_CSS).some((r) => /\.land\b/.test(r.selector)),
    'there is a land rule to check');
  assert.deepEqual(landStrokeLeaks(THEME_CSS), []);
});

test('the land-stroke check catches every way of stroking land it knows of', () => {
  [
    '.land path { stroke: #fff; }',
    '.land { stroke: #fff; }',
    'svg path { stroke: #fff; }',
    '[class=land] path { stroke: #fff; }',
    'path { stroke-width: 2; }',
    '@media (min-width: 1px) { .land path { stroke: #fff; } }',
    '.ridges path, .land path { stroke: #fff; }',
  ].forEach((mutation) => {
    assert.ok(landStrokeLeaks(THEME_CSS + '\n' + mutation).length > 0,
      'not caught: ' + mutation);
  });
  // ...and does not cry wolf at a stroke that is plainly not on land.
  assert.deepEqual(landStrokeLeaks('.rivers path { stroke: #fff; }'), []);
});

test('the map body fills the host, so the map cannot move as text arrives', () => {
  const rule = (sel) => styleRules(THEME_CSS).find((r) => r.selector === sel);
  const body = rule('.body-map');
  assert.ok(body, 'a .body-map rule exists');
  assert.match(body.body, /flex:\s*1/);
  assert.match(body.body, /min-height:\s*0/);
  assert.match(body.body, /justify-content:\s*flex-start/,
    'packs from the top; centring would move the map on every beat');
  assert.doesNotMatch(body.body, /\d\s*vh/,
    'vh is the large viewport on a phone and overflows the host');
  assert.match(rule('.mapwrap').body, /max-height:/);
});

// A clue with no verse: the clue is beat 1, and it must not wait for a beat
// that does not exist.
test('a map puzzle with a clue but no verse shows the clue on the first press', () => {
  const p = normalizePuzzle({
    id: 'np-06', answer: 'BABEL', type: 'map', extent: 'bibleworld',
    at: [44.4, 32.5], clue: 'a tower that reached for heaven',
  });
  const v = p.variants[0];
  assert.equal(byType.map.stages(v), 3, 'pin, clue, first letter - then the answer');
  assert.equal(byType.map.view(p, v, 0).clue, null);
  assert.equal(byType.map.view(p, v, 1).clue, 'a tower that reached for heaven');
  assert.equal(byType.map.view(p, v, 1).verse, null);
  assert.equal(byType.map.view(p, v, 2).masked, 'B____');
  assert.equal(byType.map.view(p, v, 3).answered.answer, 'BABEL');
});

test('a map puzzle carries whichever extent it names', () => {
  const p = normalizePuzzle({
    id: 'np-07', answer: 'ROME', type: 'map', extent: 'bibleworld', at: [12.5, 41.9],
  });
  const v = byType.map.view(p, p.variants[0], 0);
  assert.equal(v.extent, 'bibleworld');
  assert.deepEqual(v.at, [12.5, 41.9]);
});

// The paint branch has no browser here, so this stubs the little of the DOM it
// touches. It pins the three things that are otherwise only checked by eye:
// the pin goes INTO the atlas's .pins group, nothing is appended after that
// group, and the body carries the class that stops the map moving.
test('painting a map puts the pin in .pins and marks the body fixed', () => {
  function node(tag) {
    return {
      tagName: tag, className: '', textContent: '', children: [], attrs: {},
      setAttribute(k, v) { this.attrs[k] = String(v); },
      appendChild(c) { this.children.push(c); return c; },
    };
  }
  const pins = node('g'); pins.attrs.class = 'pins';
  const svg = node('svg');
  svg.children.push(node('g'), pins);          // pins LAST, as the atlas draws it
  svg.querySelector = (sel) => (sel === '.pins' ? pins : null);
  const asked = [];
  const saved = { document: globalThis.document, atlas: globalThis.BibleGames.atlas };
  globalThis.document = {
    createElement: node,
    createElementNS: (ns, tag) => node(tag),
  };
  globalThis.BibleGames.atlas = {
    draw: (extent, lang, opts) => { asked.push([extent, lang, opts]); return svg; },
    project: () => ({ x: 412, y: 267 }),
    sizes: () => ({ pinDot: 37, pinHalo: 56, pinRing: 7 }),
  };
  try {
    require('../core/paint.js');
    const host = node('div');
    const p = normalizePuzzle({
      id: 'np-08', answer: 'JERICHO', type: 'map', extent: 'holyland',
      at: [35.44, 31.87], verse: 'Joshua 6:20',
    });
    globalThis.BibleGames.paint.render(host, byType.map.view(p, p.variants[0], 1), null, null);

    const body = host.children.find((c) => /\bbody\b/.test(c.className));
    assert.ok(body, 'the body was added to the host');
    assert.match(body.className, /\bbody-map\b/);
    // The pin's own coordinate is handed to the atlas so it can drop any label
    // sitting under the pin. Five of the six named peaks ARE answers.
    assert.deepEqual(asked, [['holyland', 'en', { hideLabelAt: [35.44, 31.87] }]]);
    assert.equal(svg.children[svg.children.length - 1], pins,
      'nothing is appended after the pins group');
    // One anchor group, TRANSLATED to the pin, with the two circles at its
    // origin. The pulse scales about 0 0, so it needs no transform-box:
    // fill-box - see the note beside @keyframes pin-pulse in theme.css.
    assert.equal(pins.children.length, 1, 'one translated anchor');
    const anchor = pins.children[0];
    assert.equal(anchor.tagName, 'g');
    assert.equal(anchor.attrs.transform, 'translate(412,267)');
    assert.equal(anchor.children.length, 2, 'a halo and a dot');
    anchor.children.forEach((c) => {
      assert.equal(c.tagName, 'circle');
      assert.equal(c.attrs.cx, '0', 'the circle sits at the anchor origin, not at cx/cy');
      assert.equal(c.attrs.cy, '0');
    });
    assert.deepEqual(anchor.children.map((c) => c.attrs.class), ['pin-halo', 'pin-dot']);
    // The radii come from the atlas (a fraction of the map's height), not from
    // a number in paint.js.
    assert.equal(anchor.children[0].attrs.r, '56', 'the halo takes its radius from the atlas');
    assert.equal(anchor.children[1].attrs.r, '37', 'the dot takes its radius from the atlas');
    assert.equal(anchor.children[1].attrs['stroke-width'], '7');
    assert.ok(!body.children.some((c) => c.className === 'masked'),
      'no mask before its beat');
    const wrap = body.children.find((c) => c.className === 'mapwrap');
    assert.ok(wrap && wrap.children[0] === svg, 'the svg sits in the map wrapper');
  } finally {
    if (saved.document === undefined) { delete globalThis.document; }
    else { globalThis.document = saved.document; }
    globalThis.BibleGames.atlas = saved.atlas;
  }
});

// host.innerHTML has already been cleared by the time the map is drawn, and
// boot.js's draw() has no try/catch, so anything that throws in here leaves a
// black rectangle on a projector in the middle of a round. A map with no pin
// is a far smaller failure than no map at all.
test('painting a map with no .pins group draws the map instead of throwing', () => {
  function node(tag) {
    return {
      tagName: tag, className: '', textContent: '', children: [], attrs: {},
      setAttribute(k, v) { this.attrs[k] = String(v); },
      appendChild(c) { this.children.push(c); return c; },
    };
  }
  const svg = node('svg');
  svg.querySelector = () => null;              // an atlas that drew no pins group
  const saved = { document: globalThis.document, atlas: globalThis.BibleGames.atlas };
  globalThis.document = { createElement: node, createElementNS: (ns, tag) => node(tag) };
  globalThis.BibleGames.atlas = {
    draw: () => svg,
    project: () => ({ x: 412, y: 267 }),
    sizes: () => ({ pinDot: 37, pinHalo: 56, pinRing: 7 }),
  };
  try {
    require('../core/paint.js');
    const host = node('div');
    const p = normalizePuzzle({
      id: 'np-08', answer: 'JERICHO', type: 'map', extent: 'holyland',
      at: [35.44, 31.87], verse: 'Joshua 6:20',
    });
    assert.doesNotThrow(() => globalThis.BibleGames.paint.render(
      host, byType.map.view(p, p.variants[0], 1), null, null));
    const body = host.children.find((c) => /\bbody\b/.test(c.className));
    assert.ok(body && body.children.some((c) => c.className === 'mapwrap'),
      'the map is still on screen');
  } finally {
    if (saved.document === undefined) { delete globalThis.document; }
    else { globalThis.document = saved.document; }
    globalThis.BibleGames.atlas = saved.atlas;
  }
});
