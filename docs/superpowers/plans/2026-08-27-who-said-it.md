# Who Said It? Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a third game — a phrase spoken by someone in the Bible appears, the room shouts who said it — and give all three games a start screen that explains the mechanic and asks how many puzzles the round should be.

**Architecture:** The engine already does staged reveal, rounds, weighted variants, difficulty ramps and key handling. A new puzzle type is a new entry in the `byType` lookup table in `core/views.js` plus a branch in `core/paint.js`; nothing in the machine, the ordering or the rounds changes. The puzzle is the PERSON and each quote they said is a VARIANT, which is what lets rounds bring a person back with a line the room has not heard. The start screen is added to `core/boot.js` so all three games get it from one place.

**Tech Stack:** Vanilla ES5-compatible browser JS in IIFEs attaching to a `BibleGames` namespace. No build step, no framework, no bundler. `node --test tests/` with `node:test` and `node:assert/strict`, zero dependencies. Plain CSS in `core/theme.css`.

**Spec:** `docs/superpowers/specs/2026-08-27-who-said-it-design.md`

## Global Constraints

- **ES5-compatible browser code.** `var`, `function`, no arrow functions, no `let`/`const`, no template literals, no `class` in anything under `core/` or `games/`. Tools under `tools/` run in Node and may use modern syntax.
- **No `fetch()`, no ES modules, no build step.** Decks are `.js` files assigning `window.DECK`, loaded by a plain `<script>` tag. The game must work opened straight from the filesystem on `file://`.
- **All paths relative.** GitHub Pages serves this from a subpath; a leading `/` breaks it.
- **Zero dependencies.** `package.json` has no `dependencies` and no `devDependencies`, and gains none.
- **All projector CSS in `vmin`/`vw`,** never `px`. The projector is the only viewport that matters.
- **Every browser API that can throw in a private window is wrapped in try/catch** — `localStorage`, `sessionStorage`. Existing code does this; match it.
- **A puzzle id must never contain its own answer.** It is printed on the projector. `validate.js` enforces this.
- **The NKJV credit line, verbatim:** `Scripture taken from the New King James Version®. Copyright © 1982 by Thomas Nelson. Used by permission. All rights reserved.`
- **Every drafted quote ships with `flag: 'unverified'`.** Only a human who has checked the wording against an NKJV Bible removes it.
- **Run `node --test tests/` before every commit.** It is currently 112 passing, 0 failing. Never commit a red suite.
- **Never `git add -A`.** Use explicit paths. A subagent's in-progress work has been swept into a commit that way once already in this project.

---

### Task 1: The `quote` puzzle type

**Files:**
- Modify: `core/normalize.js:11-26` (`VARIANT_KEYS` and `normalizeVariant`)
- Modify: `core/views.js` (add a `quote` entry to the `byType` table)
- Test: `tests/normalize.test.js`, `tests/views.test.js`

**Interfaces:**
- Consumes: `normalizePuzzle` from `core/normalize.js`; `base(kind, puzzle)` and the `byType` table in `core/views.js`.
- Produces: `byType.quote.stages(variant)` returning the stage index at which the answer appears; `byType.quote.view(puzzle, variant, stage)` returning `{ kind: 'quote', id, badge, quote, verse, clue, answered }` where `verse` and `clue` are `null` until their stage and `answered` is `null` until the reveal, then `{ answer, ref }`. New variant keys `quote`, `verse`, `clue`, `verseAtReveal`, `lang`, `answer` — the last two falling back to the puzzle's.

- [ ] **Step 1: Write the failing tests**

Append to `tests/normalize.test.js`:

```js
test('a quote variant keeps its quote, verse, clue and hold flag', () => {
  const p = normalizePuzzle({
    id: 'qs-01', answer: 'CAIN', type: 'quote',
    quote: 'Am I my brother’s keeper?',
    verse: 'Genesis 4:9',
    clue: 'he worked the ground; his brother kept sheep',
  });
  const v = p.variants[0];
  assert.equal(v.type, 'quote');
  assert.equal(v.quote, 'Am I my brother’s keeper?');
  assert.equal(v.verse, 'Genesis 4:9');
  assert.equal(v.clue, 'he worked the ground; his brother kept sheep');
  assert.equal(v.verseAtReveal, false);
});

test('a quote variant with no verse or clue normalizes them to null', () => {
  const p = normalizePuzzle({ id: 'qs-02', answer: 'EVE', type: 'quote', quote: 'x' });
  assert.equal(p.variants[0].verse, null);
  assert.equal(p.variants[0].clue, null);
});

test('verseAtReveal survives normalization when set', () => {
  const p = normalizePuzzle({
    id: 'qs-03', answer: 'JONAH', type: 'quote',
    quote: 'I cried out to the LORD because of my affliction',
    verse: 'Jonah 2:2', verseAtReveal: true,
  });
  assert.equal(p.variants[0].verseAtReveal, true);
});
```

Append to `tests/views.test.js`:

```js
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

test('a variant with no lang or answer of its own falls back to the puzzle', () => {
  const p = quotePuzzle();
  assert.equal(p.variants[0].lang, null);
  assert.equal(byType.quote.view(p, p.variants[0], 3).answered.answer, 'CAIN');
});

test('stagesForItem reads the stage count off a quote variant', () => {
  const p = quotePuzzle();
  assert.equal(stagesForItem({ puzzle: p, variant: p.variants[0] }), 3);
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `node --test tests/normalize.test.js tests/views.test.js 2>&1 | grep -E '^# (pass|fail)'`
Expected: FAIL — `byType.quote` is undefined, so `q.stages` throws `Cannot read properties of undefined`.

- [ ] **Step 3: Add the keys to normalize**

In `core/normalize.js`, extend `VARIANT_KEYS`:

```js
  var VARIANT_KEYS = ['type', 'clues', 'img', 'prompt', 'options', 'items',
                      'correct', 'quote', 'verse', 'clue', 'verseAtReveal',
                      'lang', 'answer', 'flag', 'weight', 'difficulty'];
```

and add to the object `normalizeVariant` returns, after `correct`:

```js
      quote: v.quote || null,
      verse: v.verse || null,
      clue: v.clue || null,
      // Language and answer sit on the VARIANT for the quote game: PEDRO and
      // PETER are the same person, so they are one puzzle. Both fall back to
      // the puzzle's own values, so every existing deck is unaffected.
      lang: v.lang || null,
      answer: v.answer || null,
      // A verse whose book is named after the speaker gives the answer away,
      // so that puzzle holds its reference back to the reveal. validate.js
      // refuses a deck that forgets.
      verseAtReveal: v.verseAtReveal === true,
```

- [ ] **Step 4: Add the type to the views table**

In `core/views.js`, add to `byType` after the `text` entry:

```js
    quote: {
      // Four screens by default - quote, verse, clue, answer - but a puzzle
      // that holds its verse back or has no clue written yet simply has fewer.
      // The machine asks the variant, so nothing here is special-cased there.
      stages: function (variant) { return revealStage(variant); },
      view: function (puzzle, variant, stage) {
        var v = base('quote', puzzle);
        var early = earlyVerse(variant);
        var clueAt = early ? 2 : 1;
        v.quote = variant.quote;
        v.verse = (early && stage >= 1) ? variant.verse : null;
        v.clue = (variant.clue && stage >= clueAt) ? variant.clue : null;
        // The verse belongs to the QUOTE, not to the person: Peter's two
        // lines are in different chapters. So the answer block carries the
        // variant's verse rather than the puzzle's ref.
        v.answered = stage >= revealStage(variant)
          // The answer can differ by language - PEDRO, not PETER - so the
          // variant's wins when it has one.
          ? { answer: variant.answer || puzzle.answer, ref: variant.verse || null }
          : null;
        return v;
      },
    },
```

and above `byType`, the two helpers:

```js
  function earlyVerse(variant) {
    return !!(variant.verse && !variant.verseAtReveal);
  }

  function revealStage(variant) {
    return 1 + (earlyVerse(variant) ? 1 : 0) + (variant.clue ? 1 : 0);
  }
```

- [ ] **Step 5: Run the tests to verify they pass**

Run: `node --test tests/ 2>&1 | grep -E '^# (pass|fail)'`
Expected: PASS, 0 fail. The count rises from 112 by the number of tests added.

- [ ] **Step 6: Commit**

```bash
git add core/normalize.js core/views.js tests/normalize.test.js tests/views.test.js
git commit -m "Add the quote puzzle type

Four screens by default - quote, verse, clue, answer - with the stage count
read off the variant, so a puzzle that holds its verse back or has no clue
written yet is a shorter puzzle rather than a broken one.

The answer block carries the variant's verse, not the puzzle's ref: the verse
belongs to the quote, since one person's lines are in different chapters."
```

---

### Task 2: The validator — the leak rule and the unverified count

**Files:**
- Modify: `tools/validate.js:13` (`TYPES`), `tools/validate.js:19-67` (`checkVariant`), and the notices in `validate()`
- Test: `tests/validate.test.js`

**Interfaces:**
- Consumes: `validate(deck)` returning `{ errors: [string], notices: [string] }`, and `normalizeDeck`.
- Produces: no new exports. `validate` gains errors for a malformed quote variant and for a leaking verse, and a notice counting unverified quotes.

- [ ] **Step 1: Write the failing tests**

Append to `tests/validate.test.js`:

```js
function quoteDeck(variant, puzzle) {
  return {
    id: 'who-said-it', sessionSize: 1, languages: ['en'],
    puzzles: [Object.assign({ id: 'qs-01', answer: 'CAIN' }, puzzle || {},
      { variants: [Object.assign({
          type: 'quote', quote: 'Am I my brother’s keeper?',
          verse: 'Genesis 4:9', clue: 'he worked the ground',
        }, variant || {})] })],
  };
}

test('a scaffold with a verse but no text yet is not an error', () => {
  const r = validate(quoteDeck({ quote: null }));
  assert.deepEqual(r.errors, []);
  assert.ok(r.notices.some((n) => /waiting for their text/.test(n)), r.notices.join('; '));
});

test('a quote variant with neither text nor verse is an error', () => {
  const r = validate(quoteDeck({ quote: null, verse: null }));
  assert.ok(r.errors.some((e) => /needs its text/.test(e)), r.errors.join('; '));
});

test('a well-formed quote deck passes', () => {
  const r = validate(quoteDeck());
  assert.deepEqual(r.errors, []);
});

test('a verse whose book names the speaker is rejected', () => {
  const r = validate(quoteDeck(
    { quote: 'I cried out to the LORD', verse: 'Jonah 2:2', clue: 'a big fish' },
    { answer: 'JONAH' },
  ));
  assert.ok(r.errors.some((e) => /gives the answer away/.test(e)), r.errors.join('; '));
});

test('holding the verse back clears the leak', () => {
  const r = validate(quoteDeck(
    { quote: 'I cried out to the LORD', verse: 'Jonah 2:2',
      clue: 'a big fish', verseAtReveal: true },
    { answer: 'JONAH' },
  ));
  assert.deepEqual(r.errors, []);
});

test('the leak rule catches a book name inside a longer answer', () => {
  const r = validate(quoteDeck(
    { quote: 'I am not the Christ', verse: 'John 1:20', clue: 'he baptized' },
    { answer: 'JOHN THE BAPTIST' },
  ));
  assert.ok(r.errors.some((e) => /gives the answer away/.test(e)), r.errors.join('; '));
});

test('an unrelated verse is not a leak', () => {
  const r = validate(quoteDeck(
    { quote: 'You are the Christ', verse: 'Matthew 16:16', clue: 'a fisherman' },
    { answer: 'PETER' },
  ));
  assert.deepEqual(r.errors, []);
});

test('unverified quotes are counted in a notice', () => {
  const r = validate(quoteDeck({ flag: 'unverified' }));
  assert.ok(r.notices.some((n) => /1 of 1 quotes? still unverified/.test(n)),
            r.notices.join('; '));
});

test('a verified deck says nothing about verification', () => {
  const r = validate(quoteDeck());
  assert.ok(!r.notices.some((n) => /unverified/.test(n)), r.notices.join('; '));
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `node --test tests/validate.test.js 2>&1 | grep -E '^# (pass|fail)'`
Expected: FAIL — `unknown type "quote"` on every one of them.

- [ ] **Step 3: Implement the checks**

In `tools/validate.js`, add `'quote'` to `TYPES`:

```js
  var TYPES = ['rebus', 'image', 'text', 'binary', 'order', 'quote'];
```

Above `checkVariant`, add the book-name helper:

```js
  // The book part of a reference: everything before the first digit, with a
  // leading "1 "/"2 " dropped so "1 Samuel 3:4" gives SAMUEL.
  function bookOf(verse) {
    var m = String(verse || '').match(/^\s*(?:[123]\s+)?([^0-9]+)/);
    return m ? m[1].trim().toUpperCase() : '';
  }

  // A reference that names the speaker ends the puzzle two clicks early, in
  // front of the room, with no way to take it back. Substring both ways, so
  // "John 1:20" is caught under "JOHN THE BAPTIST" as well as under "JOHN".
  function verseLeaks(answer, verse) {
    var book = bookOf(verse);
    var a = String(answer || '').toUpperCase();
    if (!book || !a) { return false; }
    return a.indexOf(book) !== -1 || book.indexOf(a) !== -1;
  }
```

Inside `checkVariant`, after the `order` block:

```js
    if (v.type === 'quote') {
      // A quote with no text is DORMANT, not broken - it is a scaffold waiting
      // for a line to be pasted in, the same way a variant whose picture is
      // missing waits for its file. It is only an error when there is nothing
      // else to identify it by either.
      if (!v.quote && !v.verse) {
        errors.push(where + ': a quote variant needs its text, or at least a verse '
          + 'if it is a scaffold waiting for one');
      }
      if (v.verse && !v.verseAtReveal && verseLeaks(p.answer, v.verse)) {
        errors.push(where + ': "' + v.verse + '" gives the answer away before '
          + 'the clue - set verseAtReveal: true on it');
      }
    }
```

In `validate()`, after the existing per-puzzle loop that calls `checkVariant`, add the count:

```js
    // Drafted scripture is not checked scripture. The count is a notice, not
    // an error: a deck mid-verification is a normal state to be in, but
    // nobody should have to remember how far through it they are.
    var quotes = 0;
    var unverified = 0;
    var waiting = 0;
    pool.forEach(function (p) {
      p.variants.forEach(function (v) {
        if (v.type !== 'quote') { return; }
        quotes++;
        if (v.flag === 'unverified') { unverified++; }
        if (!v.quote) { waiting++; }
      });
    });
    if (unverified) {
      notices.push(unverified + ' of ' + quotes + ' quotes still unverified '
        + '- check the wording against an NKJV Bible before a service');
    }
    if (waiting) {
      notices.push(waiting + ' quotes waiting for their text - dormant until '
        + 'the line is pasted in, so they are never drawn');
    }
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `node --test tests/ 2>&1 | grep -E '^# (pass|fail)'`
Expected: PASS, 0 fail.

- [ ] **Step 5: Commit**

```bash
git add tools/validate.js tests/validate.test.js
git commit -m "Validate quote decks, and refuse a verse that leaks

A reference whose book is named after the speaker - Jonah 2:2 under JONAH -
ends the puzzle two clicks early in front of the room. The deck now fails to
validate unless that puzzle holds its verse back to the reveal, so the tool
catches it rather than the author remembering.

Unverified quotes are counted as a notice: a deck mid-verification is a normal
state, but nobody should have to remember how far through it they are."
```

---

### Task 3: The game master sees the quote

**Files:**
- Modify: `core/gm.js` (`workingOf`, and the `rows` return)
- Test: `tests/gm.test.js`

**Interfaces:**
- Consumes: `rows(deck)` from `core/gm.js`.
- Produces: each row gains `quotes: [{ quote, verse, clue }]` — one entry per quote variant, empty for a picture puzzle. `workings` includes the quote text for quote variants so the existing `working` line is never blank.

- [ ] **Step 1: Write the failing test**

Append to `tests/gm.test.js`:

```js
test('a quote puzzle gives the game master every line it might ask', () => {
  const rows = gm.rows({
    id: 'who-said-it',
    puzzles: [{
      id: 'qs-07', answer: 'PETER',
      variants: [
        { type: 'quote', quote: 'You are the Christ, the Son of the living God.',
          verse: 'Matthew 16:16', clue: 'a fisherman; Jesus called him a rock' },
        { type: 'quote', quote: 'I do not know the Man!', verse: 'Matthew 26:72',
          clue: 'he said it three times, before dawn', flag: 'unverified' },
      ],
    }],
  });
  assert.equal(rows.length, 1);
  const r = rows[0];
  assert.equal(r.answer, 'PETER');
  assert.equal(r.quotes.length, 2);
  assert.deepEqual(r.quotes[1], {
    quote: 'I do not know the Man!',
    verse: 'Matthew 26:72',
    clue: 'he said it three times, before dawn',
  });
  assert.equal(r.working, 'You are the Christ, the Son of the living God.');
  assert.deepEqual(r.flags, ['unverified']);
});

test('a picture puzzle has no quotes', () => {
  const rows = gm.rows({
    id: 'book-names',
    puzzles: [{ id: 'bn-01', answer: 'GENESIS',
                clues: [{ img: 'jeans.jpg', word: 'JEANS' }] }],
  });
  assert.deepEqual(rows[0].quotes, []);
  assert.equal(rows[0].working, 'JEANS');
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `node --test tests/gm.test.js 2>&1 | grep -E '^# (pass|fail)'`
Expected: FAIL — `r.quotes` is undefined.

- [ ] **Step 3: Implement**

In `core/gm.js`, replace `workingOf`:

```js
  function workingOf(variant) {
    // A quote puzzle's working IS the line on screen: it is what the game
    // master needs to match against what the room is staring at.
    if (variant.type === 'quote') { return variant.quote || null; }
    if (!variant.clues) { return null; }
    return variant.clues.map(function (c) { return c.word; }).join(' + ');
  }
```

and add to the object `rows` returns, after `pictures`:

```js
        quotes: p.variants.filter(function (v) { return v.type === 'quote'; })
          .map(function (v) {
            return { quote: v.quote, verse: v.verse, clue: v.clue };
          }),
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `node --test tests/ 2>&1 | grep -E '^# (pass|fail)'`
Expected: PASS, 0 fail.

- [ ] **Step 5: Commit**

```bash
git add core/gm.js tests/gm.test.js
git commit -m "Give the game master the quote, not a blank working line

The projector draws one variant and the game master cannot know which, so the
row carries every line the puzzle might have asked, each with its verse and
clue."
```

---

### Task 4: The game folder, a seed deck, and the front page

**Files:**
- Create: `games/who-said-it/deck.js`, `games/who-said-it/index.html`, `games/who-said-it/gm.html`
- Modify: `games.js`, `index.html`, `CREDITS.md`
- Test: `tools/validate.js` against the new deck

**Interfaces:**
- Consumes: `BibleGames.boot.start(window.DECK, host)`; `BibleGames.gm.rows(window.DECK)`; the `window.GAMES` array shape `{ title, href, blurb, meta, status }`.
- Produces: a deck with `id: 'who-said-it'`, `idPrefix: 'qs'`, `sessionSize: 20`, and six seed puzzles. Nothing later depends on the seed content — Task 7 replaces it wholesale.

- [ ] **Step 1: Write the seed deck**

Create `games/who-said-it/deck.js`. Six puzzles, chosen because their wording is famous enough to check at a glance, one of them deliberately exercising `verseAtReveal`:

```js
/*
 * Who Said It? - the deck.
 *
 * A line someone in the Bible said goes on the projector; the room shouts who
 * said it. Four clicks: the quote, then the verse, then a clue, then the name.
 *
 *   answer     the person, revealed last
 *   quote      the line, NKJV
 *   verse      where it is said. Shown BEFORE the clue on purpose: the
 *              reference is itself a hint for whoever has read the passage.
 *   clue       one line about the speaker that does not name them
 *   verseAtReveal
 *              hold the verse back to the reveal. REQUIRED when the book is
 *              named after the speaker - "Jonah 2:2" under JONAH hands the
 *              answer over. validate.js refuses a deck that forgets.
 *   flag       'unverified' until a human has checked the wording against an
 *              NKJV Bible. validate.js counts them; the game master page
 *              tags them.
 *
 * The puzzle is the PERSON and each quote is a VARIANT. That is what makes
 * rounds work: a person cannot come up twice in one round, but a later round
 * can bring them back with a line the room has not heard.
 *
 * Scripture taken from the New King James Version(R). Copyright (C) 1982 by
 * Thomas Nelson. Used by permission. All rights reserved.
 */
window.DECK = {
  id: 'who-said-it',
  title: 'Who Said It?',
  idPrefix: 'qs',
  shuffle: true,
  sessionSize: 20,
  // Both languages are declared, but Tagalog has nothing playable until its
  // lines are pasted in - so the start screen offers English alone until then,
  // rather than offering a choice that leads to an empty round.
  languages: ['en', 'fil'],
  howToPlay: [
    'A line someone in the Bible said. The room says who said it.',
    'Stuck? The next click gives the verse, then a clue.',
  ],
  puzzles: [
    {
      id: 'qs-01', answer: 'CAIN', difficulty: 1,
      variants: [
        { type: 'quote', flag: 'unverified',
          quote: 'Am I my brother’s keeper?',
          verse: 'Genesis 4:9',
          clue: 'he worked the ground; his brother kept sheep' },
      ],
    },
    {
      id: 'qs-02', answer: 'GOD', difficulty: 1,
      variants: [
        { type: 'quote', flag: 'unverified',
          quote: 'Let there be light.',
          verse: 'Genesis 1:3',
          clue: 'the first words anyone speaks in the Bible' },
      ],
    },
    {
      id: 'qs-03', answer: 'ISAIAH', difficulty: 1,
      variants: [
        { type: 'quote', flag: 'unverified', verseAtReveal: true,
          quote: 'Here am I! Send me.',
          verse: 'Isaiah 6:8',
          clue: 'he saw the Lord on a throne, and a coal touched his lips' },
      ],
    },
    {
      id: 'qs-04', answer: 'RUTH', difficulty: 2,
      variants: [
        { type: 'quote', flag: 'unverified', verseAtReveal: true,
          quote: 'For wherever you go, I will go; and wherever you lodge, I will lodge.',
          verse: 'Ruth 1:16',
          clue: 'she said it to her mother-in-law, on the road out of Moab' },
      ],
    },
    {
      id: 'qs-05', answer: 'PETER', difficulty: 2,
      variants: [
        { type: 'quote', flag: 'unverified',
          quote: 'You are the Christ, the Son of the living God.',
          verse: 'Matthew 16:16',
          clue: 'a fisherman; Jesus called him a rock' },
        { type: 'quote', flag: 'unverified', difficulty: 3,
          quote: 'I do not know the Man!',
          verse: 'Matthew 26:72',
          clue: 'he said it three times, by a fire, before dawn' },
        // The Tagalog scaffold: name, reference and clue are ours to write,
        // the LINE is not - MBB is the Philippine Bible Society's. Dormant
        // until someone pastes it in through the manager.
        { type: 'quote', lang: 'fil', answer: 'PEDRO', flag: 'unverified',
          quote: null,
          verse: 'Mateo 16:16',
          clue: 'isang mangingisda; tinawag siyang bato ni Jesus' },
      ],
    },
    {
      id: 'qs-06', answer: 'PILATE', difficulty: 3,
      variants: [
        { type: 'quote', flag: 'unverified',
          quote: 'What is truth?',
          verse: 'John 18:38',
          clue: 'he asked it of the prisoner in front of him, then washed his hands' },
      ],
    },
  ],
};
```

- [ ] **Step 2: Run the validator to verify the deck is sound**

Run: `node tools/validate.js games/who-said-it/deck.js`
Expected: `deck OK`, plus `notice: 8 of 8 quotes still unverified` and `notice: 1 quotes waiting for their text`. If instead it reports a leak, the `verseAtReveal` flags in the seed are wrong — fix the deck, not the validator.

- [ ] **Step 3: Create the projector page**

Create `games/who-said-it/index.html` by copying `games/book-names/index.html` and changing exactly three things: the `<title>` and the fail-message wording to say Who Said It?, and a footer carrying the NKJV notice. Everything else — the script list, the startup guard, the `fail()` function — is copied verbatim, because a dropped script must say so on the projector rather than showing a black rectangle.

```bash
sed -e 's/Bible Book Names/Who Said It?/g' \
    games/book-names/index.html > games/who-said-it/index.html
```

Then insert immediately before `</body>`:

```html
<p class="credit">Scripture taken from the New King James Version&reg;.
  Copyright &copy; 1982 by Thomas Nelson. Used by permission.
  All rights reserved.</p>
```

- [ ] **Step 4: Create the game master page**

Create `games/who-said-it/gm.html` by copying `games/book-names/gm.html`, then make these changes:

```bash
sed -e 's/Bible Book Names/Who Said It?/g' \
    -e 's/#bn-07/#qs-07/' \
    -e "s/e\.g\. bn-07, ruth/e.g. qs-07, peter/" \
    -e "s/' books';/' people';/" \
    games/book-names/gm.html > games/who-said-it/gm.html
```

Then, inside `draw()`, replace the `if (showPics)` picture-strip block with a quote block — a quote puzzle has no pictures, and the game master needs the lines instead:

```js
        r.quotes.forEach(function (q) {
          var block = el('div', 'gmquote');
          block.appendChild(el('div', 'gmq', '“' + q.quote + '”'));
          if (q.verse) { block.appendChild(el('div', 'gmv', q.verse)); }
          if (q.clue) { block.appendChild(el('div', 'gmc', 'clue: ' + q.clue)); }
          box.appendChild(block);
        });
```

Delete the `#pictoggle` button, its listener, `syncPicBtn`, and the `showPics` variable — there are no pictures on this page to toggle. Add to the page's `<style>`:

```css
  .gmquote { border-left: 0.2rem solid var(--accent); padding-left: 0.6rem;
             margin-bottom: 0.6rem; }
  .gmq { font-size: 1.05rem; line-height: 1.35; }
  .gmv { font-size: 0.72rem; color: var(--accent); letter-spacing: 0.1em;
         text-transform: uppercase; margin-top: 0.15rem; }
  .gmc { font-size: 0.8rem; color: var(--dim); margin-top: 0.2rem; }
  .tag.unverified { background: var(--accent); color: var(--bg); }
```

- [ ] **Step 5: Add the front-page card and the game master links**

In `games.js`, add as the second entry, and delete the `'Finish the Verse'` placeholder — this game supersedes it:

```js
  {
    title: 'Who Said It?',
    href: 'games/who-said-it/index.html',
    blurb: 'A line someone in the Bible said. The room says who said it.',
    meta: 'Ready to play',
    status: 'ready',
  },
```

In `index.html`, the single hard-coded game-master link is now wrong with two playable games. Replace the `<p class="gm-link">` element with an empty `<p class="gm-link" id="gm-links"></p>` and, at the end of the existing card-building loop's IIFE, build one link per ready game:

```js
    var gmHost = document.getElementById('gm-links');
    window.GAMES.filter(function (g) { return g.status === 'ready'; })
      .forEach(function (g, i) {
        if (i) { gmHost.appendChild(document.createTextNode(' · ')); }
        var a = document.createElement('a');
        a.href = g.href.replace(/index\.html$/, 'gm.html');
        a.textContent = 'Game master: ' + g.title;
        gmHost.appendChild(a);
      });
```

- [ ] **Step 6: Add the credit style and the NKJV notice**

Add to `core/theme.css`:

```css
/* The NKJV permission notice. Deliberately tiny and dim: it is a legal
   requirement on the page, not something the room should be reading. */
.credit { position: fixed; bottom: 1vmin; left: 50%; transform: translateX(-50%);
          margin: 0; max-width: 90vw; text-align: center;
          font-size: 1.3vmin; color: var(--dim); opacity: 0.55; }
```

Add to `CREDITS.md`, under a new `## Scripture` heading:

```markdown
## Scripture

Who Said It? quotes the New King James Version in English, and the Magandang
Balita Biblia in Tagalog.

> Scripture taken from the New King James Version®. Copyright © 1982 by
> Thomas Nelson. Used by permission. All rights reserved.

Thomas Nelson permits quoting up to 1,000 verses without written permission,
provided they are not a complete book of the Bible and are not the bulk of the
work. This deck is around 100 short lines, well inside that. If it ever grew
past 1,000 verses, permission would have to be sought.

> Magandang Balita Biblia, copyright © Philippine Bible Society.

CONFIRM THIS WORDING with the Philippine Bible Society's own permissions page
before the first public use. It is a placeholder, not a checked citation. The
Tagalog lines are pasted in by hand for this reason and are not drafted into
this repository.
```

- [ ] **Step 7: Verify the pages load**

Run:
```bash
node tools/validate.js games/who-said-it/deck.js && node --test tests/ 2>&1 | grep -E '^# (pass|fail)'
```
Expected: `deck OK`, tests PASS.

Then open `index.html` in a browser, confirm three cards with Who Said It? marked ready and two game-master links, click through to the game and confirm the startup guard does NOT fire (the page renders something rather than "This game did not start"). The quote will not be laid out yet — that is Task 5.

- [ ] **Step 8: Commit**

```bash
git add games/who-said-it games.js index.html core/theme.css CREDITS.md
git commit -m "Stand up the Who Said It? game

Six seed quotes chosen because their wording is famous enough to check at a
glance, two of them exercising the held-back verse. Everything is flagged
unverified.

The front page's single hard-coded game-master link is now built from the
catalogue instead, since there is more than one playable game to link to."
```

---

### Task 5: Paint the quote

**Files:**
- Modify: `core/paint.js:78-100` (the kind branches)
- Modify: `core/theme.css`

**Interfaces:**
- Consumes: the view object from `byType.quote.view` — `{ kind: 'quote', quote, verse, clue, answered }`.
- Produces: DOM under `.body`: `.quote`, `.verse`, `.clue-text`, then the existing `.answer-block`.

- [ ] **Step 1: Add the branch**

In `core/paint.js`, after the `text` branch:

```js
    } else if (view.kind === 'quote') {
      body.appendChild(el('div', 'quote', '“' + view.quote + '”'));
      if (view.verse) { body.appendChild(el('div', 'verse', view.verse)); }
      if (view.clue) { body.appendChild(el('div', 'clue-text', view.clue)); }
```

- [ ] **Step 2: Add the styles**

Add to `core/theme.css`:

```css
/* A quote is read by the ROOM, from the back, once. Sized against the same
   measurement that set the book game's answer: on a 55" screen 6vmin is about
   1.9 inches of cap height, readable to roughly 24 feet, so the back row
   wants to be inside about 25 feet. Long lines are the risk here, not small
   ones - the max-width keeps it to a few lines rather than one long streak. */
.quote { font-size: 6vmin; line-height: 1.35; max-width: 78vw;
         text-align: center; text-wrap: balance; }
.verse { font-size: 3vmin; color: var(--accent); letter-spacing: 0.12em;
         text-transform: uppercase; }
.clue-text { font-size: 3.4vmin; color: var(--dim); max-width: 70vw;
             text-align: center; line-height: 1.4; }
```

- [ ] **Step 3: Verify in the browser at projector size**

There are no unit tests for `paint.js` — it is deliberately decision-free DOM assembly, and the decisions it renders are tested in `views.test.js`. So this step is verified by looking.

Run a local server and drive it:
```bash
python3 -m http.server 8123
```

Open `http://localhost:8123/games/who-said-it/index.html`, press `O` for deck order so the first puzzle is CAIN, and step through with Space. Confirm at each stage:

1. the quote alone, centred, no verse and no clue
2. the verse appears under it in accent colour
3. the clue appears under that in dim grey
4. `CAIN` large, with `Genesis 4:9` beneath it

Then check the longest seed quote — RUTH, `qs-04` — wraps to two or three balanced lines and does not overflow the screen or force the page to scroll. Resize the window narrow and tall to confirm nothing clips.

- [ ] **Step 4: Commit**

```bash
git add core/paint.js core/theme.css
git commit -m "Paint the quote, the verse and the clue

Sized against the same 55-inch measurement as the book game's answer: 6vmin is
about 1.9 inches of cap height, readable to roughly 24 feet. The max-width
matters more than the size here - an unwrapped long quote is the failure mode."
```

---

### Task 6: Round size and language chosen at the start, shared by all three games

**Files:**
- Modify: `core/boot.js` (`buildSession` options, a `sizeOptions` helper, the start screen, the `S` action)
- Modify: `core/normalize.js` (`howToPlay` on the deck)
- Modify: `core/controls.js` (the `s` key)
- Modify: `core/theme.css`
- Modify: `games/book-names/deck.js`, `games/character-names/deck.js` (a `howToPlay` line each)
- Test: `tests/boot.test.js`, `tests/controls.test.js`, `tests/normalize.test.js`

**Interfaces:**
- Consumes: `buildSession(deck, resolve, rng, opts)`; `BG.order.buildOrder(carriers, { rng, shuffle, sessionSize })`.
- Produces: `buildSession` honours `opts.sessionSize` and `opts.lang`. `BG.boot.sizeOptions(playable, deckSize)` returns `[{ value, label }]`. `BG.boot.langOptions(languages, playableByLang)` returns `[{ value, label }]` for the language picker, empty when there is nothing to choose between. `normalizeDeck` returns `howToPlay` as an array (empty when absent).

- [ ] **Step 1: Write the failing tests**

Append to `tests/normalize.test.js`:

```js
test('howToPlay comes back as an array, empty when the deck omits it', () => {
  const { normalizeDeck } = globalThis.BibleGames.normalize;
  assert.deepEqual(normalizeDeck({ howToPlay: ['one', 'two'] }).howToPlay, ['one', 'two']);
  assert.deepEqual(normalizeDeck({}).howToPlay, []);
});
```

Append to `tests/controls.test.js`:

```js
test('S opens the start screen, and case does not matter', () => {
  assert.equal(actionFor('s'), 'setup');
  assert.equal(actionFor('S'), 'setup');
});
```

Append to `tests/boot.test.js` (this file already has a resolver helper and a seeded rng — reuse whatever it defines rather than writing new ones):

```js
test('the size dropdown offers round numbers up to what the deck can fill', () => {
  const { sizeOptions } = globalThis.BibleGames.boot;
  assert.deepEqual(sizeOptions(100, 20).map((o) => o.value), [5, 10, 15, 20, 25, 30, 100]);
  assert.equal(sizeOptions(100, 20)[6].label, 'All (100)');
  assert.deepEqual(sizeOptions(12, 20).map((o) => o.value), [5, 10, 12]);
  assert.deepEqual(sizeOptions(3, 20).map((o) => o.value), [3]);
  assert.equal(sizeOptions(3, 20)[0].label, 'All (3)');
  assert.deepEqual(sizeOptions(0, 20), []);
});

test('a size override limits the round instead of the deck size', async () => {
  const deck = {
    id: 'sizes', sessionSize: 20, languages: ['en'], shuffle: false,
    puzzles: Array.from({ length: 9 }, (_, i) => ({
      id: 'sz-' + i, answer: 'A' + i, type: 'text', prompt: 'p' + i,
    })),
  };
  const all = await buildSession(deck, resolveNone, seeded(1));
  assert.equal(all.items.length, 9, 'without an override the deck size wins');

  const four = await buildSession(deck, resolveNone, seeded(1), { sessionSize: 4 });
  assert.equal(four.items.length, 4);
  assert.equal(four.keys.length, 4, 'only what was played is marked seen');
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `node --test tests/ 2>&1 | grep -E '^# (pass|fail)'`
Expected: FAIL — `sizeOptions` is not a function; `actionFor('s')` returns null; `howToPlay` is undefined.

- [ ] **Step 2b: Write the failing language tests**

Append to `tests/boot.test.js`:

```js
test('a variant with no lang of its own is played in the puzzle language', async () => {
  const deck = {
    id: 'langs', sessionSize: 10, languages: ['en'], shuffle: false,
    puzzles: [{ id: 'l-1', answer: 'A', type: 'text', prompt: 'p' }],
  };
  const s = await buildSession(deck, resolveNone, seeded(1), { lang: 'en' });
  assert.equal(s.items.length, 1);
});

test('choosing a language plays only that language’s variants', async () => {
  const deck = {
    id: 'langs', sessionSize: 10, languages: ['en', 'fil'], shuffle: false,
    puzzles: [{
      id: 'qs-05', answer: 'PETER',
      variants: [
        { type: 'quote', lang: 'en', quote: 'You are the Christ.', verse: 'Matthew 16:16' },
        { type: 'quote', lang: 'fil', answer: 'PEDRO', quote: 'Ikaw ang Cristo.',
          verse: 'Mateo 16:16' },
      ],
    }],
  };
  const en = await buildSession(deck, resolveNone, seeded(1), { lang: 'en' });
  assert.equal(en.items[0].variant.quote, 'You are the Christ.');

  const fil = await buildSession(deck, resolveNone, seeded(1), { lang: 'fil' });
  assert.equal(fil.items[0].variant.quote, 'Ikaw ang Cristo.');
  assert.equal(fil.items[0].variant.answer, 'PEDRO');
});

test('a quote with no text yet is dormant and never drawn', async () => {
  const deck = {
    id: 'langs', sessionSize: 10, languages: ['en', 'fil'], shuffle: false,
    puzzles: [{
      id: 'qs-05', answer: 'PETER',
      variants: [
        { type: 'quote', lang: 'en', quote: 'You are the Christ.', verse: 'Matthew 16:16' },
        { type: 'quote', lang: 'fil', answer: 'PEDRO', quote: null, verse: 'Mateo 16:16' },
      ],
    }],
  };
  const fil = await buildSession(deck, resolveNone, seeded(1), { lang: 'fil' });
  assert.equal(fil.items.length, 0, 'nothing playable in Tagalog yet');
});

test('the language picker offers only languages with something to play', () => {
  const { langOptions } = globalThis.BibleGames.boot;
  assert.deepEqual(langOptions(['en', 'fil'], { en: 40, fil: 12 }).map((o) => o.value),
                   ['en', 'fil']);
  assert.deepEqual(langOptions(['en', 'fil'], { en: 40, fil: 0 }).map((o) => o.value),
                   [], 'one language playable is no choice at all');
  assert.equal(langOptions(['en', 'fil'], { en: 40, fil: 12 })[1].label, 'Tagalog (12)');
});
```

- [ ] **Step 3: Implement the pure parts**

In `core/normalize.js`, add to what `normalizeDeck` returns:

```js
      howToPlay: d.howToPlay || [],
```

In `core/controls.js`, add to `KEYS` and to the header comment's key list:

```js
    's': 'setup',
```

In `core/boot.js`, above `buildSession`:

```js
  // The dropdown on the start screen. Round numbers only, never more than the
  // deck can actually fill, and always an "all" option so a small deck is
  // playable end to end. A deck of 3 offers only "All (3)": offering 5 when
  // there are 3 would silently give a round of 3 anyway.
  var SIZE_STEPS = [5, 10, 15, 20, 25, 30];

  // Only offer a language there is something to play in. A deck whose Tagalog
  // quotes are all still waiting for their text offers English alone, rather
  // than a choice that leads to an empty round.
  var LANG_NAMES = { en: 'English', fil: 'Tagalog' };

  function langOptions(languages, playableByLang) {
    var live = (languages || []).filter(function (l) {
      return (playableByLang[l] || 0) > 0;
    });
    if (live.length < 2) { return []; }
    return live.map(function (l) {
      return { value: l, label: (LANG_NAMES[l] || l) + ' (' + playableByLang[l] + ')' };
    });
  }

  function sizeOptions(playable, deckSize) {
    if (playable <= 0) { return []; }
    var out = [];
    SIZE_STEPS.forEach(function (n) {
      if (n < playable) { out.push({ value: n, label: String(n) }); }
    });
    out.push({ value: playable, label: 'All (' + playable + ')' });
    return out;
  }
```

and in `buildSession`, replace the `buildOrder` call's `sessionSize`:

```js
      var ordered = BG.order.buildOrder(carriers, {
        rng: rng,
        shuffle: normalized.shuffle,
        // The start screen's choice wins over the deck's own default.
        sessionSize: (opts && opts.sessionSize) || normalized.sessionSize,
      });
```

In `buildSession`, the pool filter moves from the puzzle to the variant. Replace
the `pool` filter and add a language test to `available`:

```js
    // Language is asked of the VARIANT, falling back to the puzzle's, which
    // falls back to English. That keeps the two picture games - whose puzzles
    // carry lang and whose variants do not - working exactly as before.
    var want = (opts && opts.lang) || null;

    function langOf(puzzle, variant) { return variant.lang || puzzle.lang || 'en'; }
```

and inside `available(variant)`, before the image check:

```js
        // A quote with no text yet is dormant, the same as a variant whose
        // picture is missing: it waits, and is never drawn.
        if (variant.type === 'quote' && !variant.quote) { return false; }
```

and in the `pool.forEach` loop, filter the eligible options by language:

```js
        var options = BG.variants.eligible(p, available).filter(function (v) {
          return !want || langOf(p, v) === want;
        });
```

The existing deck-level `languages` filter on `pool` stays: it still drops a
puzzle whose own `lang` is not one the deck declares, which is the check that
catches a typo'd language rather than silently dropping the puzzle.

Export both: `BG.boot = { buildSession: buildSession, sizeOptions: sizeOptions, langOptions: langOptions, start: start };`

- [ ] **Step 4: Run those tests to verify they pass**

Run: `node --test tests/ 2>&1 | grep -E '^# (pass|fail)'`
Expected: PASS, 0 fail.

- [ ] **Step 5: Build the start screen**

In `core/boot.js`, inside `start()`, the flow becomes: resolve images once, count what is playable, show the start screen, and only build the first round when the driver starts. Restructure `start()` so that everything currently inside the `buildSession(...).then(...)` callback is reachable from a `begin(size)` function, and add before it:

```js
      // Nothing has been drawn yet, so the room is looking at a title card
      // rather than a puzzle. This is where the driver reads the mechanic and
      // sets the round length - the two things they cannot do once a room is
      // waiting on them.
      var chosen = null;

      function rememberedSize(deckId, fallback) {
        try {
          var raw = localStorage.getItem('round-size:' + deckId);
          var n = raw === null ? NaN : Number(raw);
          return (n > 0) ? n : fallback;
        } catch (e) { return fallback; }  // private window
      }

      function rememberSize(deckId, n) {
        try { localStorage.setItem('round-size:' + deckId, String(n)); }
        catch (e) { /* private window: the choice just does not persist */ }
      }

      function drawStart(playable) {
        host.innerHTML = '';
        var card = document.createElement('div');
        card.className = 'startcard';

        card.appendChild(el('div', 'start-church', 'San Fernando Adventist Church'));
        card.appendChild(el('div', 'start-title', normalized.title || 'Bible game'));

        normalized.howToPlay.forEach(function (line) {
          card.appendChild(el('div', 'start-how', line));
        });

        if (!playable) {
          // An empty or half-built deck says so here instead of failing at
          // startup with an error card. Bible Character Names sits in exactly
          // this state while its pictures are collected.
          card.appendChild(el('div', 'start-empty',
            'This deck has no puzzles yet. Add some with the deck manager.'));
          host.appendChild(card);
          return;
        }

        // The language row appears only when there is a real choice - the two
        // picture games never show it.
        var langs = langOptions(normalized.languages, playableByLang);
        var langSel = null;
        if (langs.length) {
          var lrow = el('div', 'start-row');
          lrow.appendChild(el('label', 'start-label', 'Language'));
          langSel = document.createElement('select');
          langSel.className = 'start-size';
          langs.forEach(function (o) {
            var node = document.createElement('option');
            node.value = o.value;
            node.textContent = o.label;
            if (o.value === rememberedLang(normalized.id, langs[0].value)) {
              node.selected = true;
            }
            langSel.appendChild(node);
          });
          langSel.addEventListener('click', function (e) { e.stopPropagation(); });
          lrow.appendChild(langSel);
          card.appendChild(lrow);
          // Changing the language changes how many are playable, so the size
          // dropdown has to be rebuilt rather than left showing a stale count.
          langSel.addEventListener('change', function () {
            rememberLang(normalized.id, langSel.value);
            drawStart(playableByLang[langSel.value] || 0);
          });
        }

        var opts = sizeOptions(playable, normalized.sessionSize);
        var want = rememberedSize(normalized.id, normalized.sessionSize || playable);
        var row = el('div', 'start-row');
        row.appendChild(el('label', 'start-label', 'Puzzles this round'));
        var sel = document.createElement('select');
        sel.className = 'start-size';
        opts.forEach(function (o) {
          var node = document.createElement('option');
          node.value = String(o.value);
          node.textContent = o.label;
          if (o.value === want) { node.selected = true; }
          sel.appendChild(node);
        });
        // Clicking the dropdown must not also advance the game: the host
        // element's click handler is what starts the round.
        sel.addEventListener('click', function (e) { e.stopPropagation(); });
        row.appendChild(sel);
        card.appendChild(row);

        card.appendChild(el('div', 'start-go', 'Space to start'));
        host.appendChild(card);
        chosen = function () {
          return { size: Number(sel.value), lang: langSel ? langSel.value : null };
        };
      }
```

`el` here is a small local helper — `paint.js` has one but does not export it, so add a two-line local one in `boot.js` rather than exporting DOM helpers from the painter.

`rememberedLang` and `rememberLang` mirror `rememberedSize`/`rememberSize`, keyed
`'round-lang:' + deckId`, both wrapped in try/catch.

`playableByLang` is counted once after the images resolve: for each language the
deck declares, how many puzzles have at least one eligible variant in it. It is
what both dropdowns are built from, and what decides whether the language row
appears at all.

Wire the actions: while the start screen is up, `advance` calls `begin(chosen())` and remembers the size and language; `setup` returns to `drawStart(playable)` from anywhere; every other action is ignored until a round exists, so `R` on the start screen does nothing rather than throwing.

- [ ] **Step 6: Give the two existing decks their `howToPlay`**

In `games/book-names/deck.js`, after `languages`:

```js
  howToPlay: [
    'Pictures combine into the name of a book of the Bible.',
    'The room shouts the book. One person clicks to reveal.',
  ],
```

In `games/character-names/deck.js`:

```js
  howToPlay: [
    'Pictures combine into the name of a person from a Bible story.',
    'The room shouts the name. One person clicks to reveal.',
  ],
```

- [ ] **Step 7: Add the styles**

```css
/* The start screen. Bigger than a phone UI, smaller than a puzzle: the driver
   is at the laptop reading it, and the room is looking at the title. */
.startcard { display: flex; flex-direction: column; align-items: center;
             gap: 2.4vmin; text-align: center; max-width: 74vw; }
.start-church { font-size: 1.9vmin; letter-spacing: 0.3em; text-transform: uppercase;
                color: var(--accent); }
.start-title { font-size: 9vmin; font-weight: 700; line-height: 1.05; }
.start-how { font-size: 3vmin; color: var(--dim); line-height: 1.45; max-width: 60vw; }
.start-row { display: flex; align-items: center; gap: 1.4vmin; margin-top: 1vmin; }
.start-label { font-size: 2vmin; letter-spacing: 0.16em; text-transform: uppercase;
               color: var(--dim); }
.start-size { font: inherit; font-size: 3vmin; padding: 0.6vmin 1.2vmin;
              border-radius: 0.8vmin; border: 0.2vmin solid var(--card);
              background: var(--card); color: var(--fg); }
.start-go { font-size: 2.4vmin; color: var(--accent); letter-spacing: 0.2em;
            text-transform: uppercase; }
.start-empty { font-size: 2.6vmin; color: var(--bad); max-width: 60vw; }
```

- [ ] **Step 8: Verify all three games in the browser**

```bash
python3 -m http.server 8123
```

For each of `games/book-names/`, `games/who-said-it/` and `games/character-names/`:

1. the start screen appears with the right title and how-to lines
2. the dropdown offers sensible numbers — book names has 43 playable so it should offer 5/10/15/20/25/30/All (43); character names has none, so it shows the empty-deck message and no dropdown
2b. NO language row appears on book names or character names — they declare one language. It appears on Who Said It? only once some Tagalog quotes have their text; before that, English is the only language with anything playable, so the row is correctly absent
3. choosing 5 and pressing Space gives a round whose stamp reads `1 / 5`, and the round-done card appears after the fifth
4. reloading the page shows 5 still selected
5. `S` mid-round returns to the start screen
6. the legend still appears over the first card and still fades on the first reveal

Also add the `S` entry to the legend array in `boot.js` so the on-screen legend lists it: `['S', 'this screen']`.

- [ ] **Step 9: Commit**

```bash
git add core/boot.js core/normalize.js core/controls.js core/theme.css \
        games/book-names/deck.js games/character-names/deck.js \
        tests/boot.test.js tests/controls.test.js tests/normalize.test.js
git commit -m "Ask the language and the round length before starting

All three games get a start screen: the mechanic in the deck's own words, a
dropdown for the round length, and - where a deck has more than one language
with something playable in it - a language picker. Both are remembered per
game and hold for the evening; S returns here to change them.

Language is asked of the variant now, falling back to the puzzle's, so PEDRO
and PETER are one puzzle rather than two. A quote with no text yet is dormant
exactly as a variant with a missing picture is.

An empty deck now says so on this screen instead of failing at startup with an
error card - which is the state the character game is in while its pictures
are collected."
```

---

### Task 7: Populate the deck

**Files:**
- Modify: `games/who-said-it/deck.js`
- Create: `/private/tmp/claude-501/.../scratchpad/quotes-*.json` (working files, not committed)

**Interfaces:**
- Consumes: nothing new.
- Produces: a deck of roughly 60 people and 100 English quotes, every one `flag: 'unverified'`, ids `qs-01` upward with no gaps and no renumbering of the six seed puzzles; plus one dormant Tagalog scaffold per person, carrying a name, a reference and a clue but no line.

- [ ] **Step 1: Dispatch five subagents, one per slice of scripture**

Five agents in ONE message so they run concurrently. Each gets this brief, with `<SLICE>` filled in:

> Return ONLY a JSON array, no prose. Each element:
> `{ "person": "UPPERCASE NAME", "quote": "the line, NKJV wording", "verse": "Book 1:1", "clue": "one line about the speaker that does NOT name them", "difficulty": 1 | 2 | 3 }`
>
> Slice: `<SLICE>`. Aim for 20-25 quotes across at least 12 different speakers.
>
> Rules:
> - **Difficulty is fame, not theology.** 1 = the room shouts it before the line is finished reading. 2 = known to anyone who has read the story. 3 = needs the clue. Aim for roughly a third in each band.
> - The quote must be something a PERSON said aloud, in quotation marks in the text. Not narration.
> - Keep it under about 140 characters. It is read once, from the back of a hall.
> - The clue must not contain the answer, any form of it, or a word that only ever describes that one person.
> - Prefer lines that are memorable, not lines that are theologically weighty.
> - Do not include a verse whose book is named after the speaker unless the quote is unmissable — those cost an extra flag.
> - Several quotes from the same person is GOOD: they become variants.

Slices: `Genesis to Deuteronomy`; `Joshua to Esther`; `Job to Malachi`; `the four Gospels`; `Acts to Revelation`.

- [ ] **Step 2: Merge, dedupe and assemble**

Write the merge as a script in the scratchpad, not by hand — the point is that it is repeatable when a slice comes back thin. It must:

- group by `person`, so multiple quotes become variants of one puzzle
- drop a quote whose text duplicates one already taken (compare lowercased, punctuation stripped)
- drop a quote longer than 160 characters
- keep the six seed puzzles and their ids exactly as they are, adding new quotes to those people as extra variants
- allocate ids from `qs-07` upward, never reusing one
- set `verseAtReveal: true` on any quote where the verse's book name is a substring of the answer or vice versa — the same rule `validate.js` enforces, applied on the way in so the deck lands valid
- write every variant with `flag: 'unverified'`
- put `difficulty` on the variant, not the puzzle
- emit ONE Tagalog scaffold per person: `lang: 'fil'`, `quote: null`, the
  Tagalog form of the name as the variant's `answer`, the Tagalog book name in
  the verse (Mateo, Marcos, Lucas, Juan, Awit, Genesis), and the clue
  translated. NEVER a Tagalog quote — that text is the Philippine Bible
  Society's and is pasted in by hand.

- [ ] **Step 3: Validate**

Run: `node tools/validate.js games/who-said-it/deck.js`
Expected: `deck OK` and a notice counting every quote as unverified.

If it reports a leak, the merge script's `verseAtReveal` rule is wrong — fix the script and re-run it, rather than hand-patching the deck.

- [ ] **Step 4: Read the whole deck once, as a human would**

Print it and read it. This is not optional and cannot be delegated: a subagent will confidently produce a clue that names the answer, a "quote" that is narration, or a line attributed to the wrong person. Check specifically:

```bash
node -e "globalThis.window=globalThis;require('./games/who-said-it/deck.js');
globalThis.DECK.puzzles.forEach(function(p){p.variants.forEach(function(v){
  console.log(p.answer + ' | ' + v.verse + ' | d' + (v.difficulty||p.difficulty) +
    '\n  \"' + v.quote + '\"\n  clue: ' + v.clue);});});"
```

- every clue: does it name the person, or use a word that only describes them?
- every quote: did that person actually say it, aloud?
- every difficulty 1: would a room really shout it instantly?
- every Tagalog scaffold: is the name the form a Filipino congregation actually
  uses, and is the clue natural Tagalog rather than a word-for-word rendering?
- every Tagalog scaffold has `quote: null`. If a subagent produced Tagalog
  scripture text, DELETE it — it is not ours to publish.

Fix what is wrong. Note in the commit message how many were corrected — that number is the honest measure of how much the drafted deck needs checking.

- [ ] **Step 5: Play a round in the browser**

Open the game, press `R`, and play a full round of 20 start to finish. Watch for a quote that overflows, a clue that gives it away, and a difficulty ramp that feels wrong.

- [ ] **Step 6: Commit**

```bash
git add games/who-said-it/deck.js
git commit -m "Populate Who Said It? with <N> quotes from <M> people

Drafted, not transcribed: every quote is flagged unverified until someone has
checked the wording against an NKJV Bible. <K> entries were corrected on
review - clues that named the answer, narration quoted as speech, lines
attributed to the wrong speaker."
```

---

### Task 8: The manager edits quotes

**Files:**
- Modify: `tools/manage.js` (the `GAMES` list, and quote endpoints)
- Modify: `tools/manage.html` (a quotes mode)
- Modify: `tools/README.md`

**Interfaces:**
- Consumes: `pickGame(slug)`, `findBlock(src, id)`, `writeDeckSafely(g, next, expectCount)`, `loadDeck(g)` — all in `tools/manage.js`.
- Produces: `GET /api/quotes?game=who-said-it` returning `[{ id, answer, variants: [{ quote, verse, clue, difficulty, lang, answer, unverified, waiting }] }]`; `POST /api/set-quote` taking `{ id, index, quote?, verse?, clue?, difficulty?, verified?, verseAtReveal? }`; `POST /api/add-quote` taking `{ id, lang, answer?, quote, verse, clue, difficulty }`; `POST /api/add-person` taking `{ answer, quote, verse, clue, difficulty }`.

- [ ] **Step 1: Register the game**

In `tools/manage.js`, add to `GAMES`:

```js
  { slug: 'who-said-it', title: 'Who Said It?', canon: null, kind: 'quotes' },
```

and carry `kind` through `pickGame`'s return and through `/api/games`, defaulting to `'pictures'`. The page reads it to decide which tabs to show.

- [ ] **Step 2: Write the quote endpoints**

`setQuote` follows `setVariant` exactly — `findBlock` to locate the puzzle by id, count braces to find the variant's line, edit that one line, then `writeDeckSafely`, which reloads the file and puts the old one back if anything fails. Do NOT pattern-match the deck with a regex over the whole file: that corrupted GENESIS once already in this project, which is why `findBlock` counts braces.

Text arriving from a form must be escaped, not banned — a quote contains apostrophes constantly:

```js
// A quote is full of apostrophes - "brother's keeper" - and every one of them
// would close the single-quoted literal it is written into. So they are
// escaped on the way in. Newlines and backslashes are refused outright:
// neither belongs in a line read aloud from a screen.
function quoteText(t) {
  var s = String(t === null || t === undefined ? '' : t).trim();
  if (/[\\\n\r]/.test(s)) {
    throw new Error('a quote cannot contain a backslash or a line break');
  }
  if (s.length > 200) { throw new Error('that quote is too long to read from the back of a hall'); }
  return s.replace(/'/g, "\\'");
}
```

`verified: true` removes `flag: 'unverified'` from the variant line; `verified: false` adds it back.

`addPerson` reuses `addBook`'s insertion — find the line that is exactly `  ],`, insert a block before it, allocate the next free id from the deck's own `idPrefix`.

- [ ] **Step 3: Write the quotes mode in the page**

In `tools/manage.html`, when the chosen game's `kind` is `'quotes'`, hide the pictures and variants tabs and show a quotes tab instead. One block per person:

- the answer as the heading, with `#qs-07`
- per quote: a textarea for the quote, inputs for verse and clue, a difficulty select, a verified checkbox, and a save button
- a "hold the verse to the reveal" checkbox, shown with a note explaining when it is required
- a language tag on each quote, and for a Tagalog variant an answer field for
  the Tagalog form of the name
- an add-a-quote row, and an add-a-person block at the top

**A "waiting for text" filter at the top of the quotes tab**, listing only the
dormant scaffolds. That list is the Tagalog to-do: it shows the person, the
reference and the clue, with an empty box to paste the MBB line into. Filling
the box and saving is the whole workflow, and the count drops by one. This is
the screen that gets used most, so it comes first, not last.

Reuse `api()`, `say()`, `post()` and `numSelect()` — they are already game-scoped.

- [ ] **Step 4: Test every endpoint against the real deck, then undo**

```bash
node tools/manage.js &
```

Drive it from the browser console or curl: edit a quote's text including an apostrophe, change a verse, change a clue, set difficulty, tick verified, add a quote to an existing person, add a new person, and paste a line into a dormant Tagalog scaffold — then confirm that scaffold is no longer counted as waiting and DOES get drawn when the game is played in Tagalog. After each, confirm `node tools/validate.js games/who-said-it/deck.js` still says `deck OK` and `node --test tests/` is green. Then confirm the rejections: a backslash, a 300-character quote, a nonexistent id, a variant index that does not exist.

Then `git checkout games/who-said-it/deck.js` to undo the test edits, and check `git status` shows nothing unexpected. **Check `git status` for the user's own uncommitted work before discarding anything** — they edit these decks through the manager in parallel, and their `job-2.webp` variant was nearly deleted once in this project.

- [ ] **Step 5: Document it**

Add a section to `tools/README.md` covering the quotes mode: what each field does, that the verified tick is the only thing that clears the unverified flag, and when `verseAtReveal` is required.

- [ ] **Step 6: Commit**

```bash
git add tools/manage.js tools/manage.html tools/README.md
git commit -m "Manage quotes in the deck manager

A quote deck has no pictures, so this game gets a quotes mode instead of the
pictures and variants tabs: the quote, its verse, its clue, its difficulty and
its verified tick, all editable in place.

Apostrophes are escaped rather than banned - a quote is full of them - and
backslashes and line breaks are refused, since neither belongs in a line read
aloud from a screen."
```

---

### Task 9: Documentation

**Files:**
- Modify: `README.md`, `HANDOVER.md`

- [ ] **Step 1: Update the README**

Add Who Said It? to the games list with its mechanic, the four stages, and the NKJV note. Add the start screen and the round-length dropdown to the how-to-run section, and the `S` key to the key list.

- [ ] **Step 2: Update the handover**

Record the decisions that should not be re-argued:

- the verse shows before the clue, deliberately, and `validate.js` enforces the exception
- difficulty means fame, not theology
- each round ramps internally; the evening does not ramp as a whole, and that was a considered choice
- every drafted quote is unverified until a human checks it, and the count is a notice rather than an error so a deck mid-check is a normal state
- NKJV is used under Thomas Nelson's 1,000-verse allowance, with the credit line on the page

Add the outstanding user-side items: verify the quote wording, and change the GM credentials, which are public in this repo's history.

- [ ] **Step 3: Commit**

```bash
git add README.md HANDOVER.md
git commit -m "Document Who Said It? and the start screen"
```

---

## Self-Review

**Spec coverage.** Mechanic and four stages — Task 1. Puzzle-is-the-person shape — Task 1, Task 7. Data-driven stage count — Task 1. Leak rule — Task 2. Unverified flag across validator, GM page and manager — Tasks 2, 4, 8. NKJV notice — Task 4. Difficulty rubric — Task 7 step 1. Start screen, dropdown, `howToPlay`, remembered choice, empty-deck message, `S` key — Task 6. Files list — matches Tasks 1-6. GM page — Tasks 3, 4. Manager quotes mode — Task 8. Testing list — distributed across the tasks that add each behaviour. Scope of ~60 people / ~100 quotes and the subagent population — Task 7.

**Two languages** — variant-level `lang` and `answer` in Task 1; dormant quotes as a notice in Task 2; the language picker, the variant-level pool filter and `langOptions` in Task 6; the Tagalog scaffolds in Tasks 4 and 7; the paste-the-line workflow and the waiting list in Task 8; the MBB credit line and its CONFIRM-THIS warning in Task 4.

**One spec item deliberately not built:** the difficulty meter on the projector. It is flagged in the spec as an assumption to confirm, and the user has not confirmed which reading they meant. It is a ten-line addition to `paint.js` and `theme.css` once they say. **Ask before starting Task 5, since that is the task that would carry it.**

**Type consistency.** `verseAtReveal` is the field name in Tasks 1, 2, 4, 7 and 8 — not `refAtReveal`, which appears only in the spec's prose. `sizeOptions(playable, deckSize)` returns `{ value, label }` in Task 6 and is consumed as `{ value, label }` in the same task. `rows()` gains `quotes: [{ quote, verse, clue }]` in Task 3 and is consumed with those exact keys in Task 4. `buildSession`'s overrides are `opts.sessionSize` and `opts.lang` in Task 6, matching `buildOrder`'s existing `sessionSize` option name. `langOptions(languages, playableByLang)` takes an ARRAY of language codes, not a deck — the same signature in its test, its implementation and its call site.
