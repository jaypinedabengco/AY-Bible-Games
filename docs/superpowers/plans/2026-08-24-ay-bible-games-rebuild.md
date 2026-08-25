# AY Bible Games Rebuild Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a staged-reveal game engine with five puzzle renderers, then Bible Book Names on top of it, for San Fernando AY Church.

**Architecture:** Vanilla browser JS in small single-responsibility files, each an IIFE attaching to a `BibleGames` namespace on the global object. All decision logic (running order, variant selection, stage transitions, view building) is pure and unit-tested under Node with zero dependencies; only painting, image probing, and key wiring touch the DOM, and those are verified in a headless browser pass. A game is a deck data file plus a registry line — no per-game logic.

**Tech Stack:** Vanilla ES5-compatible JavaScript, plain CSS, `node:test` + `node:assert/strict` for tests. No build step, no framework, no runtime dependencies.

**Spec:** `docs/superpowers/specs/2026-08-24-ay-bible-games-rebuild-design.md`

## Global Constraints

Every task's requirements implicitly include this section. Values are copied verbatim from the spec.

- **Must run by double-clicking `index.html`** from a folder or USB stick, with no server and no internet.
- **No `fetch()`.** Blocked on `file://`. Deck data is a `.js` file assigning `window.DECK`, loaded by a plain `<script>` tag.
- **No ES modules, no build step, no framework.** `import` is blocked on `file://`. Every source file is an IIFE.
- **Namespace pattern**, used by every file in `core/`:
  `(function (root) { ... })(typeof globalThis !== 'undefined' ? globalThis : window);`
  In a browser `globalThis === window`, so `window.BibleGames` works; under Node the same file attaches to `globalThis.BibleGames` with no shim.
- **Every asset path relative.** Never `/core/theme.css` — GitHub Pages serves this from `/AY-Bible-Games/` and a root-absolute path 404s only after publishing.
- **A missing image always shows a visible placeholder**, never a blank card and never a silently dropped puzzle. The site is published, so a puzzle that vanishes online is harder to notice than one that shouts.
- **Controls, and nothing else:** `Space` / click advance · `←` back · `R` reshuffle · `O` original order · `F` fullscreen · `Home` restart · `Esc` leave fullscreen. A mis-key in front of a room is worse than a missing feature.
- **`slot` is a hard constraint; `difficulty` is a preference.** Zones are fractional thirds of the running order. A pinned puzzle is always drawn into the session.
- **`difficulty`** is 1, 2 or 3; default 2.
- **Every puzzle has one or more variants.** A puzzle written without a `variants` array is a puzzle with exactly one. One code path.
- **Every card carries a visible language badge**, taken from the puzzle's `lang` (`'en'` → "English", `'fil'` → "Filipino").
- **Every puzzle carries a stable `id`** (`bn-07`), shown small on the projector so the Game Master can look the answer up on their phone (spec §16). Ids are authored once and never renumbered. **An id must never contain its own answer** — it is on a screen in front of the room.
- **Reference format:** `Old Testament · Major Prophets · book 24 of 66`.
- **Page title:** `San Fernando AY Church — AY Bible Games`.
- **Every clue picture is committed to `games/book-names/images/`.** There is no private image tier — see spec §8.1. Every committed image gets a row in `CREDITS.md`. Two files are supplied by hand rather than sourced (`jerry.png`, and `ruth-member.jpg` only if the cameo is ever enabled); until then JEREMIAH shows a placeholder on its first clue, which is intended.
- **Tests:** `node --test tests/`, Node 18+, zero dependencies. `package.json` exists only to hold the test script; the game must never need it.

---

## File Structure

| File | Responsibility |
|---|---|
| `core/normalize.js` | Apply deck and puzzle defaults; wrap bare puzzles into single-variant form |
| `core/variants.js` | Filter variants by image availability; weighted pick of one |
| `core/order.js` | Zone maths, difficulty banding, running-order construction |
| `core/machine.js` | Index/stage state machine and its transitions |
| `core/views.js` | Reference formatting, language badge, five pure view builders |
| `core/images.js` | Candidate URL construction and the memoised fallback resolver |
| `core/paint.js` | Paint a view object into the DOM |
| `core/theme.css` | Shared look, projector-first sizing |
| `core/controls.js` | Key-to-action table and DOM/keyboard wiring |
| `core/boot.js` | Assemble the above from `window.DECK` and start |
| `tools/validate.js` | Node CLI deck validator |
| `tools/review.html` | Whole deck, every variant, on one screen |
| `games/book-names/index.html` | The game page — markup and script tags only |
| `games/book-names/deck.js` | The puzzles |
| `index.html` / `games.js` | Front page and game registry |

Pure logic lives in `normalize`, `variants`, `order`, `machine`, `views`, and the resolver factory in `images` — all unit-tested under Node. DOM lives in `paint`, `controls`, and `boot`, verified in the browser pass in Task 13.

---

### Task 1: Test harness and repo skeleton

**Files:**
- Create: `package.json`
- Create: `.gitignore`
- Create: `.nojekyll`
- Create: `CREDITS.md`
- Create: `tests/helpers/rng.js`
- Test: `tests/helpers/rng.test.js`

**Interfaces:**
- Consumes: nothing.
- Produces: `require('./helpers/rng.js')` exporting `seeded(seed) -> function(): number` — a deterministic PRNG in `[0, 1)`, used by every later test that needs reproducible randomness.

- [ ] **Step 1: Write the failing test**

Create `tests/helpers/rng.test.js`:

```js
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const seeded = require('./rng.js');

test('seeded rng is deterministic for a given seed', () => {
  const a = seeded(42);
  const b = seeded(42);
  const first = [a(), a(), a()];
  const second = [b(), b(), b()];
  assert.deepEqual(first, second);
});

test('seeded rng returns values in [0, 1)', () => {
  const r = seeded(7);
  for (let i = 0; i < 200; i++) {
    const v = r();
    assert.ok(v >= 0 && v < 1, `out of range: ${v}`);
  }
});

test('different seeds produce different streams', () => {
  assert.notDeepEqual([seeded(1)(), seeded(1)()], [seeded(2)(), seeded(2)()]);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/`
Expected: FAIL — `Cannot find module './rng.js'`

- [ ] **Step 3: Write minimal implementation**

Create `tests/helpers/rng.js` (mulberry32):

```js
'use strict';

module.exports = function seeded(seed) {
  let s = seed | 0;
  return function () {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};
```

Create `package.json`:

```json
{
  "name": "ay-bible-games",
  "version": "0.0.0",
  "private": true,
  "description": "Picture games for San Fernando AY Church. The game itself needs no npm.",
  "scripts": {
    "test": "node --test tests/"
  }
}
```

Create `.gitignore`:

```
.DS_Store
node_modules/
games/*/images-local/
_scratch/
```

Create `.nojekyll` as an empty file. Create `CREDITS.md`:

```markdown
# Image credits

Every committed image needs a row here. Copyrighted images are never committed —
they belong in a gitignored `games/*/images-local/` folder. See spec §8.

| File | Source | Author | Licence |
|---|---|---|---|
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/`
Expected: PASS, 3 tests.

- [ ] **Step 5: Commit**

```bash
git add package.json .gitignore .nojekyll CREDITS.md tests/
git commit -m "Add test harness and repo skeleton"
```

---

### Task 2: `core/normalize.js` — deck and puzzle defaults

**Files:**
- Create: `core/normalize.js`
- Test: `tests/normalize.test.js`

**Interfaces:**
- Consumes: nothing.
- Produces: `BibleGames.normalize` with:
  - `normalizePuzzle(puzzle) -> {answer, answerAlt, lang, ref, slot, difficulty, variants: Variant[]}`
  - `normalizeDeck(deck) -> {id, title, imageDirs, shuffle, sessionSize, languages, puzzles}`
  - `Variant` is `{type, clues, img, prompt, options, items, correct, flag, weight, difficulty}` with every key always present (`null` when absent).

Every later task consumes normalized shapes and may assume defaults are already applied.

- [ ] **Step 1: Write the failing test**

Create `tests/normalize.test.js`:

```js
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
require('../core/normalize.js');
const { normalizePuzzle, normalizeDeck } = globalThis.BibleGames.normalize;

test('a puzzle without variants becomes one with exactly one variant', () => {
  const p = normalizePuzzle({
    answer: 'JONAH', type: 'image', img: 'whale.jpg',
  });
  assert.equal(p.variants.length, 1);
  assert.equal(p.variants[0].type, 'image');
  assert.equal(p.variants[0].img, 'whale.jpg');
});

test('puzzle defaults are applied', () => {
  const p = normalizePuzzle({ answer: 'ACTS' });
  assert.equal(p.lang, 'en');
  assert.equal(p.slot, 'anywhere');
  assert.equal(p.difficulty, 2);
  assert.equal(p.answerAlt, null);
  assert.equal(p.ref, null);
});

test('explicit variants are preserved and defaulted', () => {
  const p = normalizePuzzle({
    answer: 'RUTH', slot: 'late',
    variants: [
      { type: 'image', img: 'ruth-member.jpg', weight: 2 },
      { type: 'rebus', clues: [{ img: 'root.jpg', word: 'ROOT' }] },
    ],
  });
  assert.equal(p.variants.length, 2);
  assert.equal(p.variants[0].weight, 2);
  assert.equal(p.variants[1].weight, 1);
  assert.equal(p.variants[1].img, null);
  assert.equal(p.slot, 'late');
});

test('variant difficulty falls back to the puzzle then to 2', () => {
  const withPuzzle = normalizePuzzle({
    answer: 'X', difficulty: 3, variants: [{ type: 'rebus', clues: [] }],
  });
  assert.equal(withPuzzle.variants[0].difficulty, 3);

  const overridden = normalizePuzzle({
    answer: 'Y', difficulty: 3,
    variants: [{ type: 'rebus', clues: [], difficulty: 1 }],
  });
  assert.equal(overridden.variants[0].difficulty, 1);

  const bare = normalizePuzzle({ answer: 'Z', variants: [{ type: 'rebus', clues: [] }] });
  assert.equal(bare.variants[0].difficulty, 2);
});

test('deck defaults are applied', () => {
  const d = normalizeDeck({ id: 'book-names', title: 'Bible Book Names', puzzles: [] });
  assert.deepEqual(d.imageDirs, ['images/']);
  assert.equal(d.shuffle, true);
  assert.equal(d.sessionSize, null);
  assert.deepEqual(d.languages, ['en']);
});

test('deck shuffle can be switched off explicitly', () => {
  assert.equal(normalizeDeck({ shuffle: false, puzzles: [] }).shuffle, false);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/normalize.test.js`
Expected: FAIL — `Cannot find module '../core/normalize.js'`

- [ ] **Step 3: Write minimal implementation**

Create `core/normalize.js`:

```js
/*
 * Deck and puzzle defaults.
 *
 * Everything downstream assumes normalized shapes: every puzzle has a
 * variants array with at least one entry, and every key is present even
 * when empty. One code path, no undefined checks scattered about.
 */
(function (root) {
  'use strict';

  var VARIANT_KEYS = ['type', 'clues', 'img', 'prompt', 'options', 'items',
                      'correct', 'flag', 'weight', 'difficulty'];

  function normalizeVariant(v, puzzleDifficulty) {
    return {
      type: v.type || 'rebus',
      clues: v.clues || null,
      img: v.img || null,
      prompt: v.prompt || null,
      options: v.options || null,
      items: v.items || null,
      correct: v.correct || null,
      flag: v.flag || null,
      weight: v.weight === undefined ? 1 : v.weight,
      difficulty: v.difficulty || puzzleDifficulty || 2,
    };
  }

  function normalizePuzzle(p) {
    var variants = p.variants;
    if (!variants || !variants.length) {
      // A bare puzzle is a puzzle with exactly one variant: lift the
      // variant-shaped keys off it and wrap them.
      var lifted = {};
      VARIANT_KEYS.forEach(function (k) {
        if (p[k] !== undefined) { lifted[k] = p[k]; }
      });
      variants = [lifted];
    }
    var difficulty = p.difficulty || 2;
    return {
      answer: p.answer,
      answerAlt: p.answerAlt || null,
      lang: p.lang || 'en',
      ref: p.ref === undefined ? null : p.ref,
      slot: p.slot || 'anywhere',
      difficulty: difficulty,
      variants: variants.map(function (v) {
        return normalizeVariant(v, difficulty);
      }),
    };
  }

  function normalizeDeck(deck) {
    var d = deck || {};
    return {
      id: d.id || null,
      title: d.title || '',
      imageDirs: d.imageDirs || ['images/'],
      shuffle: d.shuffle !== false,
      sessionSize: d.sessionSize || null,
      languages: d.languages || ['en'],
      puzzles: (d.puzzles || []).map(normalizePuzzle),
    };
  }

  root.BibleGames = root.BibleGames || {};
  root.BibleGames.normalize = {
    normalizePuzzle: normalizePuzzle,
    normalizeDeck: normalizeDeck,
  };
})(typeof globalThis !== 'undefined' ? globalThis : window);
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/normalize.test.js`
Expected: PASS, 6 tests.

- [ ] **Step 5: Retire the obsolete gitignore rule**

Task 1 added `games/*/images-local/` to `.gitignore` under an earlier design that
kept some clue pictures out of the repo. That design is withdrawn — the site is
published to GitHub Pages, which deploys only what is committed, so a gitignored
image would simply be absent from the published game. Every picture is now
committed.

Delete that one line from `.gitignore`, leaving:

```
.DS_Store
node_modules/
_scratch/
```

Leaving a rule that ignores a directory nothing writes to would mislead the next
person into thinking a private image tier exists.

For the same reason, correct `CREDITS.md`'s preamble — Task 1 wrote it under the
old design. Replace its two prose lines with:

```markdown
# Image credits

Every committed image needs a row here. Every clue picture in this project is
committed; there is no private image tier (see spec §8.1). Two files are
supplied by hand rather than sourced — `jerry.png`, and `ruth-member.jpg` if the
cameo is ever enabled — and they need rows here too.
```

Leave the table header and any existing rows untouched.

- [ ] **Step 6: Run the whole suite**

Run: `node --test tests/`
Expected: PASS — Task 1's tests and this task's, all green.

- [ ] **Step 7: Commit**

```bash
git add core/normalize.js tests/normalize.test.js .gitignore
git commit -m "Add deck and puzzle normalization"
```

---

### Task 3: `core/variants.js` — eligibility and weighted pick

**Files:**
- Create: `core/variants.js`
- Test: `tests/variants.test.js`

**Interfaces:**
- Consumes: normalized `Variant` objects from Task 2.
- Produces: `BibleGames.variants` with:
  - `eligible(puzzle, isAvailable) -> Variant[]` where `isAvailable(variant) -> boolean`
  - `pick(variants, rng) -> Variant | null`, `rng` returning `[0, 1)`

`pick` deliberately consumes one `rng` draw even for a single-variant puzzle. Do
not special-case length 1 to save the draw: determinism is only needed within a
run, never across deck edits, and the uniform path is easier to reason about.

- [ ] **Step 1: Write the failing test**

Create `tests/variants.test.js`:

```js
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
require('../core/normalize.js');
require('../core/variants.js');
const { normalizePuzzle } = globalThis.BibleGames.normalize;
const { eligible, pick } = globalThis.BibleGames.variants;

const ruth = () => normalizePuzzle({
  answer: 'RUTH', slot: 'late',
  variants: [
    { type: 'image', img: 'ruth-member.jpg', weight: 2 },
    { type: 'rebus', clues: [{ img: 'root.jpg', word: 'ROOT' }] },
  ],
});

// In production isAvailable means "every picture this variant names resolved".
// Here we fake that by naming which files are missing.
const without = (...missing) => (v) => {
  const names = v.clues ? v.clues.map((c) => c.img) : (v.img ? [v.img] : []);
  return names.every((n) => !missing.includes(n));
};

test('a variant whose picture is missing is dropped', () => {
  const got = eligible(ruth(), without('ruth-member.jpg'));
  assert.equal(got.length, 1);
  assert.equal(got[0].type, 'rebus');
});

test('all variants survive when every picture resolved', () => {
  assert.equal(eligible(ruth(), without()).length, 2);
});

test('a variant is dropped when any one of its clues is missing', () => {
  const acts = normalizePuzzle({
    answer: 'ACTS',
    clues: [{ img: 'axe.jpg', word: 'AXE' }, { img: 'letter-s.jpg', word: 'S' }],
  });
  assert.deepEqual(eligible(acts, without('letter-s.jpg')), []);
});

test('a variant needing no picture is always available', () => {
  const verse = normalizePuzzle({ answer: 'X', type: 'text', prompt: 'a ___' });
  assert.equal(eligible(verse, without('anything.jpg')).length, 1);
});

test('a puzzle with no surviving variant yields an empty list', () => {
  assert.deepEqual(eligible(ruth(), without('ruth-member.jpg', 'root.jpg')), []);
});

test('weight biases the pick', () => {
  const vs = eligible(ruth(), without());   // weights 2 and 1, total 3
  assert.equal(pick(vs, () => 0.1).type, 'image');  // 0.3 lands in the first
  assert.equal(pick(vs, () => 0.9).type, 'rebus');  // 2.7 lands in the second
});

test('pick returns null for an empty list', () => {
  assert.equal(pick([], () => 0.5), null);
});

test('pick is safe at the top of the range', () => {
  const vs = eligible(ruth(), without());
  assert.ok(pick(vs, () => 0.999999) !== null);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/variants.test.js`
Expected: FAIL — `Cannot find module '../core/variants.js'`

- [ ] **Step 3: Write minimal implementation**

Create `core/variants.js`:

```js
/*
 * Variant eligibility and selection.
 *
 * A puzzle can carry several pictures for one answer, and one is drawn per
 * session - which is what stops a deck feeling identical week to week.
 *
 * A variant is only eligible if every picture it names actually resolved, so
 * a puzzle with a working alternative uses it instead of showing a
 * placeholder. Deciding what to do when NOTHING resolves is boot.js's job,
 * not this module's: see Task 10.
 */
(function (root) {
  'use strict';

  function eligible(puzzle, isAvailable) {
    return puzzle.variants.filter(function (v) { return isAvailable(v); });
  }

  function pick(variants, rng) {
    if (!variants.length) { return null; }
    var total = variants.reduce(function (sum, v) { return sum + v.weight; }, 0);
    var r = rng() * total;
    for (var i = 0; i < variants.length; i++) {
      r -= variants[i].weight;
      if (r < 0) { return variants[i]; }
    }
    return variants[variants.length - 1];  // floating-point backstop
  }

  root.BibleGames = root.BibleGames || {};
  root.BibleGames.variants = { eligible: eligible, pick: pick };
})(typeof globalThis !== 'undefined' ? globalThis : window);
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/variants.test.js`
Expected: PASS, 6 tests.

- [ ] **Step 5: Commit**

```bash
git add core/variants.js tests/variants.test.js
git commit -m "Add variant eligibility and weighted selection"
```

---

### Task 4: `core/order.js` — running order construction

This is the most intricate logic in the project: a subset draw, a difficulty ramp, and hard placement zones that must all hold at once. Read spec §6.1 and §6.2 before starting.

**Files:**
- Create: `core/order.js`
- Test: `tests/order.test.js`

**Interfaces:**
- Consumes: normalized puzzles from Task 2 (needs `slot` and `difficulty`).
- Produces: `BibleGames.order` with:
  - `zoneRange(zone, size) -> [startInclusive, endExclusive]`
  - `shuffle(list, rng) -> Array` (copy; never mutates)
  - `byDifficulty(list, rng, doShuffle) -> Array` (bands 1,2,3 ascending; shuffled within band)
  - `buildOrder(puzzles, {rng, shuffle, sessionSize}) -> Array` — throws `Error` on an over-subscribed zone or more pinned puzzles than slots

- [ ] **Step 1: Write the failing test**

Create `tests/order.test.js`:

```js
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const seeded = require('./helpers/rng.js');
require('../core/normalize.js');
require('../core/order.js');
const { normalizePuzzle } = globalThis.BibleGames.normalize;
const { zoneRange, shuffle, byDifficulty, buildOrder } = globalThis.BibleGames.order;

const p = (answer, extra) => normalizePuzzle(Object.assign({ answer }, extra || {}));
const answers = (list) => list.map((x) => x.answer);

test('zones are fractional thirds', () => {
  assert.deepEqual(zoneRange('early', 15), [0, 5]);
  assert.deepEqual(zoneRange('middle', 15), [5, 10]);
  assert.deepEqual(zoneRange('late', 15), [10, 15]);
  assert.deepEqual(zoneRange('anywhere', 15), [0, 15]);
});

test('zones degrade safely at tiny sizes', () => {
  assert.deepEqual(zoneRange('early', 3), [0, 1]);
  assert.deepEqual(zoneRange('late', 3), [2, 3]);
  assert.deepEqual(zoneRange('late', 1), [0, 1]);   // the only puzzle is the last one
});

// Property tests, because point assertions missed an empty `late` zone at
// sizes 2 and 4 - which would throw at startup and leave a blank projector.
test('late always contains the final slot, at every size', () => {
  for (let size = 1; size <= 40; size++) {
    const [start, end] = zoneRange('late', size);
    assert.equal(end, size, `late must end at size for size ${size}`);
    assert.ok(start < size, `late is empty at size ${size}`);
  }
});

test('the three zones tile the running order exactly, at every size', () => {
  for (let size = 1; size <= 40; size++) {
    const e = zoneRange('early', size);
    const m = zoneRange('middle', size);
    const l = zoneRange('late', size);
    assert.equal(e[0], 0, `early must start at 0 for size ${size}`);
    assert.equal(e[1], m[0], `early must meet middle for size ${size}`);
    assert.equal(m[1], l[0], `middle must meet late for size ${size}`);
    assert.equal(l[1], size, `late must end at size for size ${size}`);
  }
});

test('shuffle copies rather than mutating', () => {
  const input = [1, 2, 3, 4, 5];
  const out = shuffle(input, seeded(1));
  assert.deepEqual(input, [1, 2, 3, 4, 5]);
  assert.equal(out.length, 5);
  assert.deepEqual(out.slice().sort(), input.slice().sort());
});

test('byDifficulty orders bands ascending', () => {
  const list = [p('C', { difficulty: 3 }), p('A', { difficulty: 1 }), p('B', { difficulty: 2 })];
  assert.deepEqual(answers(byDifficulty(list, seeded(1), false)), ['A', 'B', 'C']);
});

test('the running order honours sessionSize', () => {
  const pool = ['A', 'B', 'C', 'D', 'E', 'F'].map((a) => p(a));
  const out = buildOrder(pool, { rng: seeded(3), shuffle: true, sessionSize: 4 });
  assert.equal(out.length, 4);
  assert.equal(new Set(answers(out)).size, 4, 'no duplicates');
});

test('a pinned puzzle is always drawn even when the session is small', () => {
  const pool = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'].map((a) => p(a))
    .concat([p('RUTH', { slot: 'late' })]);
  for (let seed = 1; seed <= 40; seed++) {
    const out = buildOrder(pool, { rng: seeded(seed), shuffle: true, sessionSize: 3 });
    assert.ok(answers(out).includes('RUTH'), `seed ${seed} dropped RUTH`);
  }
});

test('a pinned puzzle lands inside its zone', () => {
  const pool = Array.from({ length: 14 }, (_, i) => p('F' + i))
    .concat([p('RUTH', { slot: 'late' })]);
  for (let seed = 1; seed <= 40; seed++) {
    const out = buildOrder(pool, { rng: seeded(seed), shuffle: true, sessionSize: 15 });
    const at = answers(out).indexOf('RUTH');
    assert.ok(at >= 10 && at < 15, `seed ${seed} placed RUTH at ${at}`);
  }
});

test('free slots ramp upward in difficulty', () => {
  const pool = [
    p('E1', { difficulty: 1 }), p('E2', { difficulty: 1 }),
    p('M1', { difficulty: 2 }), p('M2', { difficulty: 2 }),
    p('H1', { difficulty: 3 }), p('H2', { difficulty: 3 }),
  ];
  const out = buildOrder(pool, { rng: seeded(5), shuffle: true });
  const seen = out.map((x) => x.difficulty);
  for (let i = 1; i < seen.length; i++) {
    assert.ok(seen[i] >= seen[i - 1], `difficulty dropped at ${i}: ${seen}`);
  }
});

test('an over-subscribed zone throws', () => {
  const pool = Array.from({ length: 3 }, (_, i) => p('L' + i, { slot: 'late' }))
    .concat([p('A'), p('B'), p('C')]);
  assert.throws(
    () => buildOrder(pool, { rng: seeded(1), shuffle: true, sessionSize: 6 }),
    /over-subscribed/,
  );
});

test('more pinned puzzles than slots throws', () => {
  const pool = [p('A', { slot: 'late' }), p('B', { slot: 'early' }), p('C', { slot: 'middle' })];
  assert.throws(
    () => buildOrder(pool, { rng: seeded(1), shuffle: true, sessionSize: 2 }),
    /pinned/,
  );
});

test('the same seed gives the same order', () => {
  const pool = ['A', 'B', 'C', 'D', 'E'].map((a) => p(a));
  const one = buildOrder(pool, { rng: seeded(9), shuffle: true });
  const two = buildOrder(pool, { rng: seeded(9), shuffle: true });
  assert.deepEqual(answers(one), answers(two));
});

test('shuffle false keeps deck order', () => {
  const pool = ['A', 'B', 'C'].map((a) => p(a));
  const out = buildOrder(pool, { rng: seeded(1), shuffle: false });
  assert.deepEqual(answers(out), ['A', 'B', 'C']);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/order.test.js`
Expected: FAIL — `Cannot find module '../core/order.js'`

- [ ] **Step 3: Write minimal implementation**

Create `core/order.js`:

```js
/*
 * Building the running order.
 *
 * Three things happen here and they pull against each other:
 *
 *   sessionSize  draw a subset, so a night is not the whole deck
 *   difficulty   ramp upward, so the room is not fried in the first minute
 *   slot         pin a puzzle to a third of the running order
 *
 * slot wins. It is a hard constraint: a pinned puzzle is always drawn and
 * always lands in its zone. The difficulty ramp then fills whatever slots
 * are left, which makes it best-effort by construction - a pinned puzzle
 * can leave the ramp slightly uneven, and that is the right trade. A cameo
 * fired at the wrong moment is a wasted moment; a bumpy ramp is not.
 */
(function (root) {
  'use strict';

  function zoneRange(zone, size) {
    if (size <= 0) { return [0, 0]; }
    var third = Math.ceil(size / 3);
    // Anchor `late` to the END of the order rather than measuring two thirds
    // forward from the start. Measuring forward overshoots: at size 4,
    // 2 * ceil(4/3) is 4, so `late` became the empty range [4,4) and a pinned
    // puzzle threw at startup - a blank projector in front of a room, which is
    // the exact failure this project exists to avoid. Anchoring backwards
    // guarantees `late` always holds at least the final slot.
    var lateStart = Math.max(0, size - third);
    var earlyEnd = Math.min(third, lateStart);
    if (zone === 'early') { return [0, earlyEnd]; }
    if (zone === 'middle') { return [earlyEnd, lateStart]; }
    if (zone === 'late') { return [lateStart, size]; }
    return [0, size];
  }

  function shuffle(list, rng) {
    var a = list.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(rng() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  function byDifficulty(list, rng, doShuffle) {
    var out = [];
    [1, 2, 3].forEach(function (d) {
      var band = list.filter(function (x) { return x.difficulty === d; });
      out = out.concat(doShuffle ? shuffle(band, rng) : band);
    });
    return out;
  }

  function isPinned(p) { return p.slot && p.slot !== 'anywhere'; }

  function buildOrder(puzzles, opts) {
    var rng = opts.rng;
    var doShuffle = opts.shuffle !== false;
    var pinned = puzzles.filter(isPinned);
    var free = puzzles.filter(function (p) { return !isPinned(p); });
    var size = Math.min(opts.sessionSize || puzzles.length, puzzles.length);

    if (pinned.length > size) {
      throw new Error('more pinned puzzles (' + pinned.length +
                      ') than session slots (' + size + ')');
    }

    // Pinned puzzles are always drawn; the random draw fills what is left.
    var fill = (doShuffle ? shuffle(free, rng) : free.slice())
      .slice(0, size - pinned.length);
    var ramp = byDifficulty(fill, rng, doShuffle);

    var slots = new Array(size);
    for (var i = 0; i < size; i++) { slots[i] = null; }

    (doShuffle ? shuffle(pinned, rng) : pinned).forEach(function (p) {
      var range = zoneRange(p.slot, size);
      var open = [];
      for (var i = range[0]; i < range[1]; i++) {
        if (slots[i] === null) { open.push(i); }
      }
      if (!open.length) {
        throw new Error('zone "' + p.slot + '" over-subscribed at size ' + size);
      }
      slots[open[Math.floor(rng() * open.length)]] = p;
    });

    var k = 0;
    for (var j = 0; j < size; j++) {
      if (slots[j] === null) { slots[j] = ramp[k++]; }
    }
    return slots;
  }

  root.BibleGames = root.BibleGames || {};
  root.BibleGames.order = {
    zoneRange: zoneRange,
    shuffle: shuffle,
    byDifficulty: byDifficulty,
    buildOrder: buildOrder,
  };
})(typeof globalThis !== 'undefined' ? globalThis : window);
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/order.test.js`
Expected: PASS, 14 tests.

- [ ] **Step 5: Commit**

```bash
git add core/order.js tests/order.test.js
git commit -m "Add running-order construction with zones and difficulty ramp"
```

---

### Task 5: `core/machine.js` — index and stage state machine

**Files:**
- Create: `core/machine.js`
- Test: `tests/machine.test.js`

**Interfaces:**
- Consumes: an array of items and a `stagesFor(item) -> number` callback.
- Produces: `BibleGames.machine.createMachine(items, stagesFor) -> {state, advance, back, next, prev, restart}` where `state() -> {index, stage, item, atEnd}`.

`advance` and `back` move one **stage**, crossing into the neighbouring item at the ends. `next` and `prev` skip a whole **item** and reset the stage to 0. Both ends clamp — advancing past the final stage of the final item is a no-op, because wrapping unexpectedly in front of a room is worse than stopping.

- [ ] **Step 1: Write the failing test**

Create `tests/machine.test.js`:

```js
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
require('../core/machine.js');
const { createMachine } = globalThis.BibleGames.machine;

// two items, two reveal stages each (a rebus deck)
const build = () => createMachine(['a', 'b'], () => 2);
const at = (m) => [m.state().index, m.state().stage];

test('advance walks stages then crosses to the next item', () => {
  const m = build();
  assert.deepEqual(at(m), [0, 0]);
  m.advance(); assert.deepEqual(at(m), [0, 1]);
  m.advance(); assert.deepEqual(at(m), [0, 2]);
  m.advance(); assert.deepEqual(at(m), [1, 0]);
});

test('advance clamps at the very end', () => {
  const m = build();
  for (let i = 0; i < 10; i++) { m.advance(); }
  assert.deepEqual(at(m), [1, 2]);
  assert.equal(m.state().atEnd, true);
});

test('back steps into the previous items final stage', () => {
  const m = build();
  m.advance(); m.advance(); m.advance();   // 1,0
  m.back();
  assert.deepEqual(at(m), [0, 2]);
});

test('back clamps at the start', () => {
  const m = build();
  m.back(); m.back();
  assert.deepEqual(at(m), [0, 0]);
});

test('next and prev skip whole items and reset the stage', () => {
  const m = build();
  m.advance();               // 0,1
  m.next();  assert.deepEqual(at(m), [1, 0]);
  m.advance();               // 1,1
  m.prev();  assert.deepEqual(at(m), [0, 0]);
});

test('next and prev clamp', () => {
  const m = build();
  m.next(); m.next(); assert.deepEqual(at(m), [1, 0]);
  m.prev(); m.prev(); assert.deepEqual(at(m), [0, 0]);
});

test('restart returns to the beginning', () => {
  const m = build();
  m.advance(); m.advance(); m.advance();
  m.restart();
  assert.deepEqual(at(m), [0, 0]);
});

test('state exposes the current item', () => {
  const m = build();
  assert.equal(m.state().item, 'a');
  m.next();
  assert.equal(m.state().item, 'b');
});

test('stagesFor is honoured per item', () => {
  const m = createMachine(['img', 'rebus'], (x) => (x === 'img' ? 1 : 2));
  m.advance();               // 0,1  (img has one stage)
  m.advance();               // 1,0
  assert.deepEqual(at(m), [1, 0]);
  m.advance(); m.advance();  // 1,2
  assert.deepEqual(at(m), [1, 2]);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/machine.test.js`
Expected: FAIL — `Cannot find module '../core/machine.js'`

- [ ] **Step 3: Write minimal implementation**

Create `core/machine.js`:

```js
/*
 * Where we are in the deck: which puzzle, and how much of it is revealed.
 *
 * advance/back move by stage and cross into the neighbouring puzzle at the
 * ends. next/prev skip a whole puzzle. Both ends clamp rather than wrap -
 * a deck that silently loops back to the start mid-service is worse than
 * one that simply stops.
 */
(function (root) {
  'use strict';

  function createMachine(items, stagesFor) {
    var index = 0;
    var stage = 0;

    function lastStage() { return stagesFor(items[index]); }

    return {
      state: function () {
        return {
          index: index,
          stage: stage,
          item: items[index],
          atEnd: index === items.length - 1 && stage === lastStage(),
        };
      },
      advance: function () {
        if (stage < lastStage()) { stage++; return; }
        if (index < items.length - 1) { index++; stage = 0; }
      },
      back: function () {
        if (stage > 0) { stage--; return; }
        if (index > 0) { index--; stage = lastStage(); }
      },
      next: function () {
        if (index < items.length - 1) { index++; stage = 0; }
      },
      prev: function () {
        if (index > 0) { index--; stage = 0; }
      },
      restart: function () { index = 0; stage = 0; },
    };
  }

  root.BibleGames = root.BibleGames || {};
  root.BibleGames.machine = { createMachine: createMachine };
})(typeof globalThis !== 'undefined' ? globalThis : window);
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/machine.test.js`
Expected: PASS, 9 tests.

- [ ] **Step 5: Commit**

```bash
git add core/machine.js tests/machine.test.js
git commit -m "Add index and stage state machine"
```

---

### Task 6: `core/views.js` — reference formatting, badges, five view builders

These are pure functions from `(puzzle, variant, stage)` to a plain description of what should be on screen. No DOM. This split is what makes every renderer unit-testable — Task 8 paints whatever these return.

**Files:**
- Create: `core/views.js`
- Modify: `core/normalize.js` (add the `id` passthrough — see Step 0)
- Test: `tests/views.test.js`
- Test: `tests/normalize.test.js` (one added case)

**Interfaces:**
- Consumes: normalized puzzles and variants from Task 2.
- Produces: `BibleGames.views` with:
  - `formatRef(ref) -> string | null` — structured refs render as `Old Testament · Major Prophets · book 24 of 66`; a string passes through
  - `badgeFor(lang) -> 'English' | 'Filipino'`
  - `views.byType[type]` for each of `rebus`, `image`, `text`, `binary`, `order`, each `{stages(variant) -> number, view(puzzle, variant, stage) -> object}`
  - `stagesForItem({puzzle, variant}) -> number` — the callback Task 5's machine and Task 10's boot both need

Every view object has `kind`, `badge`, and `answered` (either `{answer, answerAlt, ref}` or `null`).

- [ ] **Step 0: Carry the puzzle `id` through normalization**

`normalizePuzzle` returns an explicit object, so any key it does not name is silently dropped — and it does not currently name `id`. Every view needs the id, so add it as the first field of the returned puzzle in `core/normalize.js`:

```js
    return {
      id: p.id || null,
      answer: p.answer,
```

Add this case to `tests/normalize.test.js`, since a dropped id would be invisible until it reached a projector:

```js
test('the puzzle id survives normalization', () => {
  assert.equal(normalizePuzzle({ id: 'bn-07', answer: 'JONAH' }).id, 'bn-07');
  assert.equal(normalizePuzzle({ answer: 'JONAH' }).id, null);
});
```

Run: `node --test tests/normalize.test.js` — expected PASS, 9 tests.

- [ ] **Step 1: Write the failing test**

Create `tests/views.test.js`:

```js
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
  assert.equal(badgeFor('fil'), 'Filipino');
});

test('rebus hides clue words until the working is shown', () => {
  const p = normalizePuzzle({
    answer: 'JEREMIAH', answerAlt: 'Jeremias',
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
  assert.equal(s2.answered.answerAlt, 'Jeremias');
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
  assert.equal(s0.badge, 'Filipino');
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/views.test.js`
Expected: FAIL — `Cannot find module '../core/views.js'`

- [ ] **Step 3: Write minimal implementation**

Create `core/views.js`:

```js
/*
 * Turning a puzzle into a description of what belongs on screen.
 *
 * Pure functions, no DOM. paint.js draws whatever these return, which is
 * what lets every renderer be unit-tested without a browser.
 *
 * Every view carries a `badge` naming the language being asked. That is not
 * decoration: a crown is KINGS in English and HARI in Filipino, so a room
 * shouting the right answer to the wrong question would be a bug we had
 * designed in.
 */
(function (root) {
  'use strict';

  var BOOKS_IN_BIBLE = 66;
  var BADGES = { en: 'English', fil: 'Filipino' };

  function formatRef(ref) {
    if (!ref) { return null; }
    if (typeof ref === 'string') { return ref; }
    var bits = [];
    if (ref.testament) { bits.push(ref.testament + ' Testament'); }
    if (ref.division) { bits.push(ref.division); }
    if (ref.position) {
      bits.push('book ' + ref.position + ' of ' + BOOKS_IN_BIBLE);
    }
    return bits.length ? bits.join(' · ') : null;
  }

  function badgeFor(lang) { return BADGES[lang] || BADGES.en; }

  function answered(puzzle, stage, revealAt) {
    if (stage < revealAt) { return null; }
    return {
      answer: puzzle.answer,
      answerAlt: puzzle.answerAlt,
      ref: formatRef(puzzle.ref),
    };
  }

  function base(kind, puzzle) {
    // `id` rides on every view because the projector prints it in a corner:
    // it is how the Game Master finds this puzzle's answer on their phone
    // without needing to know the running order at all (spec 16).
    return { kind: kind, id: puzzle.id, badge: badgeFor(puzzle.lang) };
  }

  var byType = {
    rebus: {
      stages: function () { return 2; },
      view: function (puzzle, variant, stage) {
        var v = base('rebus', puzzle);
        var words = variant.clues.map(function (c) { return c.word; });
        v.clues = variant.clues.map(function (c) {
          return { img: c.img, word: stage >= 1 ? c.word : null };
        });
        v.working = stage >= 1 ? words.join(' + ') : null;
        v.answered = answered(puzzle, stage, 2);
        return v;
      },
    },
    image: {
      stages: function () { return 1; },
      view: function (puzzle, variant, stage) {
        var v = base('image', puzzle);
        v.img = variant.img;
        v.answered = answered(puzzle, stage, 1);
        return v;
      },
    },
    text: {
      stages: function () { return 1; },
      view: function (puzzle, variant, stage) {
        var v = base('text', puzzle);
        v.prompt = variant.prompt;
        v.answered = answered(puzzle, stage, 1);
        return v;
      },
    },
    binary: {
      stages: function () { return 1; },
      view: function (puzzle, variant, stage) {
        var v = base('binary', puzzle);
        v.prompt = variant.prompt;
        v.img = variant.img;
        v.options = variant.options;
        v.answered = answered(puzzle, stage, 1);
        return v;
      },
    },
    order: {
      stages: function () { return 1; },
      view: function (puzzle, variant, stage) {
        var v = base('order', puzzle);
        v.items = variant.items;
        v.correct = stage >= 1 ? variant.correct : null;
        v.answered = answered(puzzle, stage, 1);
        return v;
      },
    },
  };

  function stagesForItem(item) {
    return byType[item.variant.type].stages(item.variant);
  }

  function viewForItem(item, stage) {
    return byType[item.variant.type].view(item.puzzle, item.variant, stage);
  }

  root.BibleGames = root.BibleGames || {};
  root.BibleGames.views = {
    formatRef: formatRef,
    badgeFor: badgeFor,
    byType: byType,
    stagesForItem: stagesForItem,
    viewForItem: viewForItem,
  };
})(typeof globalThis !== 'undefined' ? globalThis : window);
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/views.test.js`
Expected: PASS, 12 tests.

- [ ] **Step 5: Commit**

```bash
git add core/views.js tests/views.test.js
git commit -m "Add pure view builders for all five puzzle types"
```

---

### Task 7: `core/images.js` — candidate URLs and the fallback resolver

**Files:**
- Create: `core/images.js`
- Test: `tests/images.test.js`

**Interfaces:**
- Consumes: `imageDirs` from the normalized deck (Task 2).
- Produces: `BibleGames.images` with:
  - `candidates(name, dirs) -> string[]` — a full URL or `data:` URI returns itself alone; otherwise one candidate per directory, in order
  - `makeResolver(dirs, load) -> function(name) -> Promise<string | null>` — walks candidates until `load(url) -> Promise<boolean>` resolves true; memoised per name
  - `browserLoad(url) -> Promise<boolean>` — the real `Image` probe, used by boot; not unit-tested (Task 13 covers it)

The injectable `load` is the point: the whole fallback chain is testable under Node with a fake loader, and only the one-line `Image` probe needs a browser.

- [ ] **Step 1: Write the failing test**

Create `tests/images.test.js`:

```js
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
require('../core/images.js');
const { candidates, makeResolver } = globalThis.BibleGames.images;

const DIRS = ['override/', 'images/'];   // generic: the resolver takes any ordered list

test('a bare filename becomes one candidate per directory, in order', () => {
  assert.deepEqual(candidates('jerry.png', DIRS),
    ['override/jerry.png', 'images/jerry.png']);
});

test('a full URL or data URI is its own only candidate', () => {
  assert.deepEqual(candidates('https://example.com/a.jpg', DIRS),
    ['https://example.com/a.jpg']);
  assert.deepEqual(candidates('data:image/png;base64,AAA', DIRS),
    ['data:image/png;base64,AAA']);
});

test('the earlier directory wins when both exist', async () => {
  const resolve = makeResolver(DIRS, () => Promise.resolve(true));
  assert.equal(await resolve('jerry.png'), 'override/jerry.png');
});

test('resolution falls through to the committed directory', async () => {
  const load = (url) => Promise.resolve(url.startsWith('images/'));
  const resolve = makeResolver(DIRS, load);
  assert.equal(await resolve('root.jpg'), 'images/root.jpg');
});

test('a name in no directory resolves to null', async () => {
  const resolve = makeResolver(DIRS, () => Promise.resolve(false));
  assert.equal(await resolve('missing.jpg'), null);
});

test('resolution is memoised so the chain is probed once', async () => {
  let calls = 0;
  const load = (url) => { calls++; return Promise.resolve(url.startsWith('images/')); };
  const resolve = makeResolver(DIRS, load);
  await resolve('root.jpg');
  const after = calls;
  await resolve('root.jpg');
  assert.equal(calls, after, 'second call re-probed');
});

test('candidates are tried in order, not in parallel', async () => {
  const seen = [];
  const load = (url) => { seen.push(url); return Promise.resolve(url.startsWith('images/')); };
  await makeResolver(DIRS, load)('root.jpg');
  assert.deepEqual(seen, ['override/root.jpg', 'images/root.jpg']);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/images.test.js`
Expected: FAIL — `Cannot find module '../core/images.js'`

- [ ] **Step 3: Write minimal implementation**

Create `core/images.js`:

```js
/*
 * Finding a picture.
 *
 * `img: 'whale.jpg'` resolves through the deck's imageDirs in order, falling
 * through on load failure and ending at null:
 *
 *     images/whale.jpg  ->  null
 *
 * The shipped deck lists one directory, but the chain stays ordered and
 * generic because that costs nothing. A file that is in no directory
 * resolves to null, so paint.js shows a loud placeholder rather than a
 * blank card.
 *
 * `load` is injected rather than hard-wired to Image, which lets the whole
 * chain be tested under node with a fake loader.
 */
(function (root) {
  'use strict';

  var ABSOLUTE = /^(https?:|data:)/i;

  function candidates(name, dirs) {
    if (ABSOLUTE.test(name)) { return [name]; }
    return dirs.map(function (dir) { return dir + name; });
  }

  function makeResolver(dirs, load) {
    var memo = {};
    return function (name) {
      if (Object.prototype.hasOwnProperty.call(memo, name)) { return memo[name]; }
      var list = candidates(name, dirs);
      memo[name] = (function step(i) {
        if (i >= list.length) { return Promise.resolve(null); }
        return load(list[i]).then(function (ok) {
          return ok ? list[i] : step(i + 1);
        });
      })(0);
      return memo[name];
    };
  }

  function browserLoad(url) {
    return new Promise(function (resolve) {
      var img = new Image();
      img.onload = function () { resolve(true); };
      img.onerror = function () { resolve(false); };
      img.src = url;
    });
  }

  root.BibleGames = root.BibleGames || {};
  root.BibleGames.images = {
    candidates: candidates,
    makeResolver: makeResolver,
    browserLoad: browserLoad,
  };
})(typeof globalThis !== 'undefined' ? globalThis : window);
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/images.test.js`
Expected: PASS, 7 tests.

- [ ] **Step 5: Commit**

```bash
git add core/images.js tests/images.test.js
git commit -m "Add image candidate resolution with local-override fallback"
```

---

### Task 8: `core/paint.js` and `core/theme.css` — drawing a view

**Files:**
- Create: `core/paint.js`
- Create: `core/theme.css`
- Test: none under Node — see the note below.

**Interfaces:**
- Consumes: view objects from Task 6; a `srcFor(name) -> string | null` lookup supplied by Task 10 (already resolved, synchronous).
- Produces: `BibleGames.paint.render(host, view, srcFor, meta) -> void`. `meta` is `{position, total}` from the session (Task 10) and may be omitted; `view.id` comes from the view itself.

**On testing:** `paint.js` is the one module with no Node unit test. Testing it would mean a DOM implementation, and a dependency is a worse trade than covering it in Task 14's headless browser pass, which asserts on real rendered output. This is a deliberate gap, stated here so nobody assumes it was an oversight. Keep `paint.js` free of decisions — everything it draws is decided in `views.js`, which *is* tested. If you find yourself writing an `if` about game rules here, it belongs in `views.js`.

- [ ] **Step 1: Write the implementation**

Create `core/paint.js`:

```js
/*
 * Drawing a view object into the DOM.
 *
 * Deliberately stupid: no game rules live here. Everything this function
 * draws was decided by views.js, which is unit-tested. If you are about to
 * write an `if` about how a game works, it belongs there, not here.
 */
(function (root) {
  'use strict';

  function el(tag, cls, text) {
    var node = document.createElement(tag);
    if (cls) { node.className = cls; }
    if (text !== undefined && text !== null) { node.textContent = text; }
    return node;
  }

  function clueCard(name, word, srcFor) {
    var card = el('div', 'clue');
    var src = srcFor(name);
    if (src) {
      var img = document.createElement('img');
      img.src = src;
      img.alt = '';
      card.appendChild(img);
    } else {
      // Loud on purpose: caught at setup rather than mid-service.
      card.appendChild(el('div', 'clue-missing', '?'));
    }
    if (word) { card.appendChild(el('div', 'clue-word', word)); }
    return card;
  }

  function clueRow(clues, srcFor) {
    var row = el('div', 'clue-row');
    clues.forEach(function (c, i) {
      if (i > 0) { row.appendChild(el('div', 'plus', '+')); }
      row.appendChild(clueCard(c.img, c.word, srcFor));
    });
    return row;
  }

  function answerBlock(a) {
    var block = el('div', 'answer-block');
    block.appendChild(el('div', 'answer', a.answer));
    if (a.answerAlt) { block.appendChild(el('div', 'answer-alt', a.answerAlt)); }
    if (a.ref) { block.appendChild(el('div', 'ref', a.ref)); }
    return block;
  }

  function render(host, view, srcFor, meta) {
    host.innerHTML = '';
    host.appendChild(el('div', 'badge', view.badge));

    // The stamp is how the Game Master finds this puzzle on their phone: the
    // id names one puzzle no matter how the deck was shuffled, so nothing has
    // to be synchronised between the projector and the phone (spec 16).
    // Small and dim on purpose - the room should not be reading it.
    if (view.id || meta) {
      var stamp = el('div', 'stamp');
      if (view.id) { stamp.appendChild(el('span', 'stamp-id', '#' + view.id)); }
      if (meta && meta.total) {
        stamp.appendChild(el('span', 'stamp-pos', meta.position + ' / ' + meta.total));
      }
      host.appendChild(stamp);
    }

    var body = el('div', 'body');

    if (view.kind === 'rebus') {
      body.appendChild(clueRow(view.clues, srcFor));
      if (view.working) { body.appendChild(el('div', 'working', view.working)); }
    } else if (view.kind === 'image') {
      body.appendChild(clueRow([{ img: view.img, word: null }], srcFor));
    } else if (view.kind === 'text') {
      body.appendChild(el('div', 'prompt', view.prompt));
    } else if (view.kind === 'binary') {
      if (view.img) { body.appendChild(clueRow([{ img: view.img, word: null }], srcFor)); }
      if (view.prompt) { body.appendChild(el('div', 'prompt', view.prompt)); }
      var opts = el('div', 'options');
      view.options.forEach(function (o) {
        var chosen = view.answered && view.answered.answer === o;
        opts.appendChild(el('div', chosen ? 'option option-correct' : 'option', o));
      });
      body.appendChild(opts);
    } else if (view.kind === 'order') {
      var list = el('div', 'order-list');
      (view.correct || view.items).forEach(function (item, i) {
        list.appendChild(el('div', 'order-item', (i + 1) + '. ' + item));
      });
      body.appendChild(list);
    }

    if (view.answered && view.kind !== 'binary') {
      body.appendChild(answerBlock(view.answered));
    } else if (view.answered && view.kind === 'binary') {
      if (view.answered.ref) { body.appendChild(el('div', 'ref', view.answered.ref)); }
    }

    host.appendChild(body);
  }

  root.BibleGames = root.BibleGames || {};
  root.BibleGames.paint = { render: render };
})(typeof globalThis !== 'undefined' ? globalThis : window);
```

- [ ] **Step 2: Write the stylesheet**

Create `core/theme.css`. Sized for a projector at the back of a hall: very large type, high contrast, one committed look (this is a projected game, not a website, so no theme switching).

```css
/* Projector-first. Every size is in vmin so one stylesheet fits a hall
   screen and a phone without media queries. */
:root {
  --bg: #10131a;
  --fg: #f7f3e8;
  --dim: #9aa3b2;
  --accent: #e8b53c;
  --good: #5fbf7f;
  --bad: #d9534f;
  --card: #1b202b;
}

* { box-sizing: border-box; }

html, body {
  margin: 0;
  height: 100%;
  background: var(--bg);
  color: var(--fg);
  font-family: "Trebuchet MS", "Segoe UI", system-ui, sans-serif;
  overflow: hidden;
}

.host {
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2vmin;
  padding: 3vmin;
  cursor: pointer;
}

.badge {
  position: fixed;
  top: 2vmin;
  right: 2vmin;
  font-size: 2vmin;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: var(--bg);
  background: var(--accent);
  padding: 0.8vmin 2vmin;
  border-radius: 10vmin;
}

/* Bottom-right: puzzle id and position. Deliberately faint - the Game Master
   reads it off the screen; the room should not notice it. */
.stamp {
  position: fixed;
  bottom: 2vmin;
  right: 2vmin;
  display: flex;
  gap: 1.5vmin;
  font-size: 1.8vmin;
  letter-spacing: 0.18em;
  color: var(--dim);
  opacity: 0.55;
}

.stamp-id { text-transform: uppercase; }

.body { display: flex; flex-direction: column; align-items: center; gap: 3vmin; }

.clue-row { display: flex; align-items: center; gap: 2vmin; }

.clue { display: flex; flex-direction: column; align-items: center; gap: 1.5vmin; }

.clue img {
  height: 34vmin;
  max-width: 34vmin;
  object-fit: contain;
  background: var(--card);
  border-radius: 2vmin;
  padding: 1.5vmin;
}

.clue-missing {
  height: 34vmin;
  width: 34vmin;
  display: grid;
  place-items: center;
  font-size: 16vmin;
  color: var(--bad);
  border: 0.6vmin dashed var(--bad);
  border-radius: 2vmin;
}

.clue-word, .plus {
  font-size: 4vmin;
  letter-spacing: 0.08em;
  color: var(--dim);
}

.plus { font-size: 6vmin; color: var(--accent); }

.working {
  font-size: 7vmin;
  letter-spacing: 0.1em;
  color: var(--accent);
}

.prompt { font-size: 5.5vmin; max-width: 80vw; text-align: center; line-height: 1.4; }

.answer-block { text-align: center; }

.answer { font-size: 12vmin; font-weight: 700; letter-spacing: 0.04em; }

.answer-alt { font-size: 5vmin; font-style: italic; color: var(--accent); }

.ref { font-size: 2.6vmin; color: var(--dim); letter-spacing: 0.14em; text-transform: uppercase; }

.options { display: flex; gap: 4vmin; }

.option {
  font-size: 6vmin;
  padding: 1.5vmin 4vmin;
  border-radius: 2vmin;
  background: var(--card);
  color: var(--dim);
}

.option-correct { background: var(--good); color: var(--bg); }

.order-list { display: flex; flex-direction: column; gap: 1.2vmin; font-size: 5vmin; }
```

- [ ] **Step 3: Verify it loads without error**

Run: `node --test tests/`
Expected: PASS — the existing suite still green (this task adds no tests, and must break none).

- [ ] **Step 4: Commit**

```bash
git add core/paint.js core/theme.css
git commit -m "Add DOM painter and projector stylesheet"
```

---

### Task 9: `core/controls.js` — the key table and wiring

**Files:**
- Create: `core/controls.js`
- Test: `tests/controls.test.js`

**Interfaces:**
- Consumes: an `actions` object with `advance`, `back`, `reshuffle`, `originalOrder`, `fullscreen`, `restart`.
- Produces: `BibleGames.controls` with:
  - `actionFor(key) -> string | null` — pure key-to-action lookup, case-insensitive
  - `attach(host, actions) -> void` — binds click and keydown
  - `toggleFullscreen(el) -> void`

Only the documented keys are bound. Nothing else, because a mis-key in front of a room is worse than a missing feature.

- [ ] **Step 1: Write the failing test**

Create `tests/controls.test.js`:

```js
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
require('../core/controls.js');
const { actionFor } = globalThis.BibleGames.controls;

test('every documented key maps to its action', () => {
  assert.equal(actionFor(' '), 'advance');
  assert.equal(actionFor('ArrowLeft'), 'back');
  assert.equal(actionFor('r'), 'reshuffle');
  assert.equal(actionFor('o'), 'originalOrder');
  assert.equal(actionFor('f'), 'fullscreen');
  assert.equal(actionFor('Home'), 'restart');
});

test('letter keys are case-insensitive', () => {
  assert.equal(actionFor('R'), 'reshuffle');
  assert.equal(actionFor('O'), 'originalOrder');
  assert.equal(actionFor('F'), 'fullscreen');
});

test('undocumented keys map to nothing', () => {
  ['a', 'Enter', 'ArrowRight', 'Escape', '1', 'Tab'].forEach((k) => {
    assert.equal(actionFor(k), null, `${k} should not be bound`);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/controls.test.js`
Expected: FAIL — `Cannot find module '../core/controls.js'`

- [ ] **Step 3: Write minimal implementation**

Create `core/controls.js`:

```js
/*
 * One hand on a laptop, in front of a room.
 *
 * Space/click advance - ArrowLeft back - R reshuffle - O original order
 * F fullscreen - Home restart - Esc leaves fullscreen (browser default).
 *
 * Nothing else is bound. Every extra binding is a chance to derail a
 * service by leaning on the keyboard.
 */
(function (root) {
  'use strict';

  var KEYS = {
    ' ': 'advance',
    'arrowleft': 'back',
    'r': 'reshuffle',
    'o': 'originalOrder',
    'f': 'fullscreen',
    'home': 'restart',
  };

  function actionFor(key) {
    if (key === ' ') { return KEYS[' ']; }
    var found = KEYS[String(key).toLowerCase()];
    return found || null;
  }

  function toggleFullscreen(el) {
    var doc = document;
    var active = doc.fullscreenElement || doc.webkitFullscreenElement;
    if (active) {
      (doc.exitFullscreen || doc.webkitExitFullscreen).call(doc);
    } else {
      (el.requestFullscreen || el.webkitRequestFullscreen).call(el);
    }
  }

  function attach(host, actions) {
    host.addEventListener('click', function () { actions.advance(); });
    document.addEventListener('keydown', function (e) {
      var name = actionFor(e.key);
      if (!name || !actions[name]) { return; }
      e.preventDefault();
      actions[name]();
    });
  }

  root.BibleGames = root.BibleGames || {};
  root.BibleGames.controls = {
    actionFor: actionFor,
    attach: attach,
    toggleFullscreen: toggleFullscreen,
  };
})(typeof globalThis !== 'undefined' ? globalThis : window);
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/controls.test.js`
Expected: PASS, 3 tests.

- [ ] **Step 5: Commit**

```bash
git add core/controls.js tests/controls.test.js
git commit -m "Add key-to-action table and control wiring"
```

---

### Task 10: `core/boot.js` — assembling a session

**Files:**
- Create: `core/boot.js`
- Test: `tests/boot.test.js`

**Interfaces:**
- Consumes: everything from Tasks 2–9.
- Produces: `BibleGames.boot` with:
  - `buildSession(deck, resolve, rng) -> Promise<{deck, items, srcFor}>` — the testable half: normalizes, filters by language, resolves every image, picks one eligible variant per puzzle, and builds the running order. `items` are `{puzzle, variant}` pairs. A puzzle whose variants *all* have missing pictures keeps its first variant rather than being dropped, so the card renders a placeholder instead of vanishing.
  - `start(deck, host) -> Promise<void>` — the browser half: calls `buildSession` with the real resolver, wires the machine, painter and controls.

Splitting `buildSession` out is what makes session assembly — the part with all the rules in it — testable without a DOM.

- [ ] **Step 1: Write the failing test**

Create `tests/boot.test.js`:

```js
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const seeded = require('./helpers/rng.js');
require('../core/normalize.js');
require('../core/variants.js');
require('../core/order.js');
require('../core/machine.js');
require('../core/views.js');
require('../core/images.js');
require('../core/boot.js');
const { buildSession } = globalThis.BibleGames.boot;

// A resolver that finds everything except the names given.
const resolverWithout = (...missing) => (name) =>
  Promise.resolve(missing.includes(name) ? null : 'images/' + name);
const allPresent = resolverWithout();

const deck = () => ({
  id: 'book-names',
  imageDirs: ['images/'],
  languages: ['en'],
  puzzles: [
    { answer: 'JONAH', type: 'image', img: 'whale.jpg', difficulty: 1 },
    { answer: 'ACTS', clues: [{ img: 'axe.jpg', word: 'AXE' }, { img: 'letter-s.jpg', word: 'S' }] },
    {
      answer: 'RUTH', slot: 'late',
      variants: [
        { type: 'image', img: 'ruth-member.jpg', weight: 2 },
        { type: 'rebus', clues: [{ img: 'root.jpg', word: 'ROOT' }] },
      ],
    },
  ],
});

test('a variant with a missing picture is skipped for one that resolves', async () => {
  const s = await buildSession(deck(), resolverWithout('ruth-member.jpg'), seeded(1));
  const ruth = s.items.find((i) => i.puzzle.answer === 'RUTH');
  assert.equal(ruth.variant.type, 'rebus');
});

test('the weighted variant does get drawn when its picture is present', async () => {
  let sawImage = false;
  for (let seed = 1; seed <= 30; seed++) {
    const s = await buildSession(deck(), allPresent, seeded(seed));
    const ruth = s.items.find((i) => i.puzzle.answer === 'RUTH');
    if (ruth.variant.type === 'image') { sawImage = true; break; }
  }
  assert.ok(sawImage, 'weighted variant never drawn across 30 seeds');
});

test('a puzzle whose every picture is missing is kept, not dropped', async () => {
  // Silence would hide a missing file, and the site is published - a gap
  // online is harder to notice than a placeholder.
  const s = await buildSession(deck(), resolverWithout('whale.jpg'), seeded(2));
  const jonah = s.items.find((i) => i.puzzle.answer === 'JONAH');
  assert.ok(jonah, 'JONAH was dropped instead of showing a placeholder');
  assert.equal(s.srcFor('whale.jpg'), null);
});

test('languages filters the pool', async () => {
  const d = deck();
  d.puzzles.push({ answer: 'HARI', lang: 'fil', type: 'image', img: 'crown.jpg' });
  const en = await buildSession(d, allPresent, seeded(3));
  assert.equal(en.items.some((i) => i.puzzle.answer === 'HARI'), false);

  d.languages = ['en', 'fil'];
  const both = await buildSession(d, allPresent, seeded(3));
  assert.equal(both.items.some((i) => i.puzzle.answer === 'HARI'), true);
});

test('srcFor returns resolved urls and null for the unresolved', async () => {
  const s = await buildSession(deck(), resolverWithout('ruth-member.jpg'), seeded(4));
  assert.equal(s.srcFor('whale.jpg'), 'images/whale.jpg');
  assert.equal(s.srcFor('ruth-member.jpg'), null);
});

test('the pinned puzzle still lands late', async () => {
  const d = deck();
  for (let i = 0; i < 12; i++) {
    d.puzzles.push({ answer: 'F' + i, type: 'image', img: 'f.jpg' });
  }
  const s = await buildSession(d, allPresent, seeded(6));
  const at = s.items.findIndex((i) => i.puzzle.answer === 'RUTH');
  assert.ok(at >= Math.ceil((s.items.length / 3) * 2), `RUTH landed at ${at} of ${s.items.length}`);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/boot.test.js`
Expected: FAIL — `Cannot find module '../core/boot.js'`

- [ ] **Step 3: Write minimal implementation**

Create `core/boot.js`:

```js
/*
 * Putting a session together.
 *
 * buildSession holds all the rules and no DOM, so it can be tested. start()
 * is the thin browser wrapper: real image probing, machine, painter, keys.
 *
 * Every image is resolved up front. That is what makes variant eligibility
 * decidable (a variant is only eligible if its pictures exist) and makes
 * everything after it synchronous, so a reveal never waits on a decode.
 */
(function (root) {
  'use strict';

  var BG = root.BibleGames;

  function imageNames(variant) {
    if (variant.clues) {
      return variant.clues.map(function (c) { return c.img; });
    }
    return variant.img ? [variant.img] : [];
  }

  function buildSession(deck, resolve, rng) {
    var normalized = BG.normalize.normalizeDeck(deck);
    var pool = normalized.puzzles.filter(function (p) {
      return normalized.languages.indexOf(p.lang) !== -1;
    });

    var wanted = [];
    pool.forEach(function (p) {
      p.variants.forEach(function (v) {
        imageNames(v).forEach(function (n) {
          if (wanted.indexOf(n) === -1) { wanted.push(n); }
        });
      });
    });

    return Promise.all(wanted.map(resolve)).then(function (urls) {
      var resolved = {};
      wanted.forEach(function (name, i) { resolved[name] = urls[i]; });

      function srcFor(name) {
        return Object.prototype.hasOwnProperty.call(resolved, name)
          ? resolved[name] : null;
      }

      function available(variant) {
        var names = imageNames(variant);
        if (!names.length) { return true; }   // text and order need no picture
        return names.every(function (n) { return srcFor(n) !== null; });
      }

      var playable = [];
      pool.forEach(function (p) {
        var options = BG.variants.eligible(p, available);
        // If nothing resolved, keep the first variant anyway so the card
        // renders a loud placeholder. Dropping the puzzle would hide a
        // missing file, and this site is published - a silent gap online is
        // far harder to notice than a red question mark.
        var chosen = options.length ? BG.variants.pick(options, rng) : p.variants[0];
        playable.push({ puzzle: p, variant: chosen });
      });

      // buildOrder reads slot and difficulty off the puzzle, so pass a view
      // of each pair that carries them, then map back to the pair.
      var carriers = playable.map(function (pair) {
        return {
          slot: pair.puzzle.slot,
          difficulty: pair.variant.difficulty,
          pair: pair,
        };
      });

      var ordered = BG.order.buildOrder(carriers, {
        rng: rng,
        shuffle: normalized.shuffle,
        sessionSize: normalized.sessionSize,
      });

      return {
        deck: normalized,
        items: ordered.map(function (c) { return c.pair; }),
        srcFor: srcFor,
      };
    });
  }

  function start(deck, host) {
    var resolver = BG.images.makeResolver(
      (deck.imageDirs || ['images/']),
      BG.images.browserLoad,
    );
    var rng = Math.random;

    return buildSession(deck, resolver, rng).then(function (session) {
      var items = session.items;
      var machine = BG.machine.createMachine(items, BG.views.stagesForItem);

      function draw() {
        var s = machine.state();
        BG.paint.render(host, BG.views.viewForItem(s.item, s.stage), session.srcFor, {
          position: s.index + 1,
          total: items.length,
        });
      }

      function rebuild(shuffle) {
        var d = Object.assign({}, deck, { shuffle: shuffle });
        return buildSession(d, resolver, rng).then(function (next) {
          items = next.items;
          machine = BG.machine.createMachine(items, BG.views.stagesForItem);
          session.srcFor = next.srcFor;
          draw();
        });
      }

      BG.controls.attach(host, {
        advance: function () { machine.advance(); draw(); },
        back: function () { machine.back(); draw(); },
        restart: function () { machine.restart(); draw(); },
        reshuffle: function () { rebuild(true); },
        originalOrder: function () { rebuild(false); },
        fullscreen: function () { BG.controls.toggleFullscreen(document.body); },
      });

      draw();
    });
  }

  BG.boot = { buildSession: buildSession, start: start };
})(typeof globalThis !== 'undefined' ? globalThis : window);
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/boot.test.js`
Expected: PASS, 6 tests.

- [ ] **Step 5: Cover `viewForItem` at its point of first use**

`core/views.js` exports `viewForItem(item, stage)` but nothing tested it directly — Task 6's review accepted that on the grounds it would be exercised the moment a consumer appeared. This task is that consumer, so add the missing assertion to `tests/boot.test.js`:

```js
test('viewForItem dispatches to the right builder for a session item', () => {
  const rebus = normalizePuzzle({
    id: 'bn-01', answer: 'ACTS',
    clues: [{ img: 'axe.jpg', word: 'AXE' }, { img: 'letter-s.jpg', word: 'S' }],
  });
  const item = { puzzle: rebus, variant: rebus.variants[0] };
  assert.equal(globalThis.BibleGames.views.viewForItem(item, 0).kind, 'rebus');
  assert.equal(globalThis.BibleGames.views.viewForItem(item, 1).working, 'AXE + S');
  assert.equal(globalThis.BibleGames.views.viewForItem(item, 2).answered.answer, 'ACTS');
});
```

This needs `normalizePuzzle` in scope — add it to the requires at the top of the file if it is not already there.

- [ ] **Step 6: Run the whole suite**

Run: `node --test tests/`
Expected: PASS, all tests from Tasks 1–10.

- [ ] **Step 7: Commit**

```bash
git add core/boot.js tests/boot.test.js
git commit -m "Add session assembly and browser boot"
```

---

### Task 11: `tools/validate.js` — the deck validator

**Files:**
- Create: `tools/validate.js`
- Test: `tests/validate.test.js`

**Interfaces:**
- Consumes: a raw (un-normalized) deck object; normalizes internally via Task 2.
- Produces: `BibleGames.validate` with `validate(deck) -> {errors: string[], notices: string[], playable: number}`, plus a CLI entry point when run directly.

Errors fail the deck. Notices print and pass — a pun flagged `risky` is a decision, not a defect, but it should be in front of you every time you validate, because the spec's loudest warning is that nobody has playtested the puns.

- [ ] **Step 1: Write the failing test**

Create `tests/validate.test.js`:

```js
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
require('../core/normalize.js');
require('../core/order.js');
require('../tools/validate.js');
const { validate } = globalThis.BibleGames.validate;

const ok = () => ({
  id: 'book-names',
  puzzles: [
    { id: 'bn-01', answer: 'JONAH', type: 'image', img: 'whale.jpg' },
    { id: 'bn-02', answer: 'ACTS', clues: [{ img: 'axe.jpg', word: 'AXE' }] },
  ],
});

const errs = (deck) => validate(deck).errors.join(' | ');

test('a good deck has no errors', () => {
  const r = validate(ok());
  assert.deepEqual(r.errors, []);
  assert.equal(r.playable, 2);
});

test('a missing answer is an error', () => {
  const d = ok();
  d.puzzles.push({ type: 'image', img: 'x.jpg' });
  assert.match(errs(d), /answer/i);
});

test('an unknown variant type is an error', () => {
  const d = ok();
  d.puzzles.push({ answer: 'X', type: 'crossword' });
  assert.match(errs(d), /type/i);
});

test('a rebus with no clues is an error', () => {
  const d = ok();
  d.puzzles.push({ answer: 'X', type: 'rebus', clues: [] });
  assert.match(errs(d), /clues/i);
});

test('an image variant with no img is an error', () => {
  const d = ok();
  d.puzzles.push({ answer: 'X', type: 'image' });
  assert.match(errs(d), /img/i);
});

test('a binary answer must be one of its options', () => {
  const d = ok();
  d.puzzles.push({ answer: 'Maybe', type: 'binary', prompt: 'X', options: ['Old', 'New'] });
  assert.match(errs(d), /options/i);
});

test('order correct must be a permutation of items', () => {
  const d = ok();
  d.puzzles.push({
    answer: 'seq', type: 'order', items: ['a', 'b'], correct: ['a', 'c'],
  });
  assert.match(errs(d), /permutation/i);
});

test('a non-positive weight is an error', () => {
  const d = ok();
  d.puzzles.push({ answer: 'X', type: 'image', img: 'x.jpg', weight: 0 });
  assert.match(errs(d), /weight/i);
  const neg = ok();
  neg.puzzles.push({ answer: 'Y', type: 'image', img: 'y.jpg', weight: -1 });
  assert.match(errs(neg), /weight/i);
});

test('a bad difficulty is an error', () => {
  const d = ok();
  d.puzzles.push({ answer: 'X', type: 'image', img: 'x.jpg', difficulty: 7 });
  assert.match(errs(d), /difficulty/i);
});

test('an unknown lang or slot is an error', () => {
  const bad = ok();
  bad.puzzles.push({ answer: 'X', type: 'image', img: 'x.jpg', lang: 'es' });
  assert.match(errs(bad), /lang/i);

  const badSlot = ok();
  badSlot.puzzles.push({ answer: 'Y', type: 'image', img: 'y.jpg', slot: 'end' });
  assert.match(errs(badSlot), /slot/i);
});

test('a missing or duplicate id is an error', () => {
  const missing = ok();
  missing.puzzles.push({ answer: 'X', type: 'image', img: 'x.jpg' });
  assert.match(errs(missing), /id/i);

  const dup = ok();
  dup.puzzles[1].id = dup.puzzles[0].id;
  assert.match(errs(dup), /duplicate id/i);
});

test('an id containing its own answer is an error', () => {
  // The id is printed on a projector in front of the room.
  const d = ok();
  d.puzzles.push({ id: 'ruth-08', answer: 'RUTH', type: 'image', img: 'r.jpg' });
  assert.match(errs(d), /id .*answer|leak/i);
});

test('an id containing the Filipino answer leaks it too', () => {
  const d = ok();
  d.puzzles.push({ id: 'hari-11', answer: 'KINGS', answerAlt: 'Hari',
                   type: 'image', img: 'crown.jpg' });
  assert.match(errs(d), /leak/i);
});

test('duplicate answers in the same language are an error', () => {
  const d = ok();
  d.puzzles.push({ answer: 'JONAH', type: 'image', img: 'other.jpg' });
  assert.match(errs(d), /duplicate/i);
});

test('the same answer in two languages is allowed', () => {
  const d = ok();
  d.puzzles.push({ id: 'bn-03', answer: 'JONAH', lang: 'fil', type: 'image', img: 'whale.jpg' });
  d.languages = ['en', 'fil'];
  assert.deepEqual(validate(d).errors, []);
});

test('sessionSize larger than the deck is an error', () => {
  const d = ok();
  d.sessionSize = 9;
  assert.match(errs(d), /sessionSize/i);
});

test('an over-subscribed zone is an error', () => {
  const d = ok();
  d.puzzles.push({ answer: 'L1', type: 'image', img: 'a.jpg', slot: 'late' });
  d.puzzles.push({ answer: 'L2', type: 'image', img: 'b.jpg', slot: 'late' });
  d.puzzles.push({ answer: 'L3', type: 'image', img: 'c.jpg', slot: 'late' });
  assert.match(errs(d), /over-subscribed|late/i);
});

test('a risky flag is a notice, not an error', () => {
  const d = ok();
  d.puzzles.push({ id: 'bn-04', answer: 'LEVITICUS', type: 'image', img: 'x.jpg', flag: 'risky' });
  const r = validate(d);
  assert.deepEqual(r.errors, []);
  assert.match(r.notices.join(' | '), /risky/i);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/validate.test.js`
Expected: FAIL — `Cannot find module '../tools/validate.js'`

- [ ] **Step 3: Write minimal implementation**

Create `tools/validate.js`:

```js
/*
 * Deck validator.
 *
 *   node tools/validate.js games/book-names/deck.js
 *
 * Errors fail the deck. Notices print and pass: a pun flagged risky is a
 * decision rather than a defect, but it should be in front of you on every
 * run, because nobody has playtested these yet.
 */
(function (root) {
  'use strict';

  var TYPES = ['rebus', 'image', 'text', 'binary', 'order'];
  var LANGS = ['en', 'fil'];
  var SLOTS = ['early', 'middle', 'late', 'anywhere'];

  function sortedCopy(list) { return list.slice().sort(); }

  function checkVariant(p, v, i, errors) {
    var where = '"' + p.answer + '" variant ' + (i + 1);
    if (TYPES.indexOf(v.type) === -1) {
      errors.push(where + ': unknown type "' + v.type + '"');
      return;
    }
    if ([1, 2, 3].indexOf(v.difficulty) === -1) {
      errors.push(where + ': difficulty must be 1, 2 or 3 (got ' + v.difficulty + ')');
    }
    // A weight of 0 would make pick() degenerate silently: total is 0, the
    // cumulative subtraction never goes negative, and the floating-point
    // backstop returns the last variant every time regardless of the draw.
    // Catch it here, where deck-authoring mistakes belong, rather than
    // guarding the hot path.
    if (typeof v.weight !== 'number' || !(v.weight > 0)) {
      errors.push(where + ': weight must be a positive number (got ' + v.weight + ')');
    }
    if (v.type === 'rebus') {
      if (!v.clues || !v.clues.length) {
        errors.push(where + ': rebus needs a non-empty clues array');
      } else {
        v.clues.forEach(function (c, j) {
          if (!c.img) { errors.push(where + ' clue ' + (j + 1) + ': missing img'); }
          if (!c.word) { errors.push(where + ' clue ' + (j + 1) + ': missing word'); }
        });
      }
    }
    if (v.type === 'image' && !v.img) {
      errors.push(where + ': image needs img');
    }
    if (v.type === 'text' && !v.prompt) {
      errors.push(where + ': text needs prompt');
    }
    if (v.type === 'binary') {
      if (!v.prompt && !v.img) { errors.push(where + ': binary needs prompt or img'); }
      if (!v.options || v.options.length !== 2) {
        errors.push(where + ': binary needs exactly 2 options');
      } else if (v.options.indexOf(p.answer) === -1) {
        errors.push(where + ': answer "' + p.answer + '" is not one of its options');
      }
    }
    if (v.type === 'order') {
      if (!v.items || !v.correct) {
        errors.push(where + ': order needs items and correct');
      } else if (String(sortedCopy(v.items)) !== String(sortedCopy(v.correct))) {
        errors.push(where + ': correct is not a permutation of items');
      }
    }
  }

  function validate(deck) {
    var BG = root.BibleGames;
    var normalized = BG.normalize.normalizeDeck(deck);
    var errors = [];
    var notices = [];
    var seen = {};

    // Structural checks run over EVERY puzzle; playability checks run over the
    // ones this session would actually play.
    //
    // The distinction matters. A typo'd lang like 'es' silently drops a puzzle
    // out of the pool, so validating only the pool would hide exactly the
    // mistake most worth catching: the author sees a deck that passes and a
    // puzzle that never appears. A deliberate 'fil' puzzle in an English-only
    // deck is a different thing - uncounted, not unchecked.
    var pool = normalized.puzzles.filter(function (p) {
      return normalized.languages.indexOf(p.lang) !== -1;
    });

    var seenIds = {};

    normalized.puzzles.forEach(function (p) {
      if (!p.answer) { errors.push('a puzzle is missing its answer'); return; }
      if (!p.id) {
        errors.push('"' + p.answer + '": missing id');
      } else {
        if (seenIds[p.id]) { errors.push('duplicate id "' + p.id + '"'); }
        seenIds[p.id] = true;
        // The id is displayed on a projector in front of the room, so an id
        // that contains its own answer hands the answer over. See spec 16.
        // Both names leak: a Filipino-answer puzzle is given away by an id
        // containing its answerAlt just as surely as by one containing its
        // answer. The id is on a projector in front of the room.
        var leaked = [p.answer, p.answerAlt].filter(Boolean).filter(function (name) {
          return p.id.toLowerCase().indexOf(String(name).toLowerCase()) !== -1;
        });
        if (leaked.length) {
          errors.push('id "' + p.id + '" contains its own answer "' + leaked[0] +
                      '" and would leak it on screen');
        }
      }
      if (LANGS.indexOf(p.lang) === -1) {
        errors.push('"' + p.answer + '": unknown lang "' + p.lang + '"');
      }
      if (SLOTS.indexOf(p.slot) === -1) {
        errors.push('"' + p.answer + '": unknown slot "' + p.slot + '"');
      }
      if ([1, 2, 3].indexOf(p.difficulty) === -1) {
        errors.push('"' + p.answer + '": difficulty must be 1, 2 or 3');
      }
      var key = p.lang + '::' + p.answer;
      if (seen[key]) {
        errors.push('duplicate answer "' + p.answer + '" in ' + p.lang);
      }
      seen[key] = true;

      p.variants.forEach(function (v, i) { checkVariant(p, v, i, errors); });

      p.variants.forEach(function (v) {
        if (v.flag === 'risky') {
          notices.push('"' + p.answer + '" is flagged risky - playtest before a service');
        }
      });
    });

    // From here down the session is what matters, so these use the pool.
    var playable = pool.length;
    var size = normalized.sessionSize || playable;
    if (normalized.sessionSize && normalized.sessionSize > playable) {
      errors.push('sessionSize ' + normalized.sessionSize +
                  ' exceeds ' + playable + ' playable puzzles');
    }

    SLOTS.forEach(function (zone) {
      if (zone === 'anywhere') { return; }
      var pinned = pool.filter(function (p) { return p.slot === zone; }).length;
      if (!pinned) { return; }
      var range = BG.order.zoneRange(zone, Math.min(size, playable));
      var room = range[1] - range[0];
      if (pinned > room) {
        errors.push('zone "' + zone + '" over-subscribed: ' + pinned +
                    ' puzzles for ' + room + ' slots at session size ' + size);
      }
    });

    return { errors: errors, notices: notices, playable: playable };
  }

  root.BibleGames = root.BibleGames || {};
  root.BibleGames.validate = { validate: validate };
})(typeof globalThis !== 'undefined' ? globalThis : window);

// --- CLI -------------------------------------------------------------------
if (typeof require !== 'undefined' && typeof module !== 'undefined' && require.main === module) {
  (function () {
    'use strict';
    var path = require('path');
    var fs = require('fs');
    var target = process.argv[2];
    if (!target) {
      console.error('usage: node tools/validate.js <deck.js> [--files <imageDir>]');
      process.exit(2);
    }
    require(path.resolve(__dirname, '../core/normalize.js'));
    require(path.resolve(__dirname, '../core/order.js'));
    globalThis.window = globalThis;          // deck.js assigns window.DECK
    require(path.resolve(process.cwd(), target));

    var result = globalThis.BibleGames.validate.validate(globalThis.DECK);
    console.log('playable puzzles: ' + result.playable);
    result.notices.forEach(function (n) { console.log('notice: ' + n); });

    var filesFlag = process.argv.indexOf('--files');
    if (filesFlag !== -1 && process.argv[filesFlag + 1]) {
      var dir = process.argv[filesFlag + 1];
      var missing = [];
      globalThis.DECK.puzzles.forEach(function (p) {
        (p.variants || [p]).forEach(function (v) {
          var names = v.clues ? v.clues.map(function (c) { return c.img; })
                              : (v.img ? [v.img] : []);
          names.forEach(function (n) {
            if (!/^(https?:|data:)/i.test(n) && !fs.existsSync(path.join(dir, n))) {
              missing.push(n);
            }
          });
        });
      });
      if (missing.length) {
        console.log('images not yet in ' + dir + ': ' + missing.join(', '));
      }
    }

    if (result.errors.length) {
      result.errors.forEach(function (e) { console.error('error: ' + e); });
      process.exit(1);
    }
    console.log('deck OK');
  })();
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/validate.test.js`
Expected: PASS, 18 tests.

- [ ] **Step 5: Commit**

```bash
git add tools/validate.js tests/validate.test.js
git commit -m "Add deck validator with CLI"
```

---

### Task 12: The deck, the game page, the front page, the review page

**Files:**
- Create: `games/book-names/deck.js`
- Create: `games/book-names/index.html`
- Create: `games/book-names/images/.gitkeep`
- Create: `index.html`
- Create: `games.js`
- Create: `tools/review.html`
- Test: `tests/deck.test.js`

**Interfaces:**
- Consumes: everything from Tasks 2–11.
- Produces: `window.DECK` for the game page; `window.GAMES` for the front page.

The 25 entries below are every row currently marked `in` in the spec's Appendix A. Rows marked `proposed` — the 12 English candidates and the 16 Filipino ones — are added on approval, in exactly the same shape, and `languages` gains `'fil'` at that point.

- [ ] **Step 1: Write the failing test**

Create `tests/deck.test.js`:

```js
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
require('../core/normalize.js');
require('../core/order.js');
require('../tools/validate.js');
globalThis.window = globalThis;
require('../games/book-names/deck.js');
const { validate } = globalThis.BibleGames.validate;

test('the shipped deck validates', () => {
  const r = validate(globalThis.DECK);
  assert.deepEqual(r.errors, [], r.errors.join('\n'));
});

test('the deck is big enough for its session size', () => {
  const r = validate(globalThis.DECK);
  assert.ok(r.playable >= globalThis.DECK.sessionSize,
    `${r.playable} playable for sessionSize ${globalThis.DECK.sessionSize}`);
});

test('Ruth ships as the root rebus, cameo not yet enabled', () => {
  const ruth = globalThis.DECK.puzzles.find((p) => p.answer === 'RUTH');
  assert.equal(ruth.variants, undefined, 'the cameo should still be commented out');
  assert.deepEqual(ruth.clues.map((c) => c.word), ['ROOT']);
});

test('every puzzle has a unique id that does not leak its answer', () => {
  const seen = new Set();
  globalThis.DECK.puzzles.forEach((p) => {
    assert.ok(p.id, `${p.answer} has no id`);
    assert.ok(!seen.has(p.id), `duplicate id ${p.id}`);
    seen.add(p.id);
    assert.ok(
      !p.id.toLowerCase().includes(String(p.answer).toLowerCase()),
      `id ${p.id} leaks its answer on the projector`,
    );
  });
});

test('every picture is expected in the one committed directory', () => {
  assert.deepEqual(globalThis.DECK.imageDirs, ['images/']);
});

test('every puzzle carries a Filipino name for the reveal', () => {
  globalThis.DECK.puzzles.forEach((p) => {
    assert.ok(p.answerAlt, `${p.answer} has no answerAlt`);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/deck.test.js`
Expected: FAIL — `Cannot find module '../games/book-names/deck.js'`

- [ ] **Step 2b: Delete the old game**

The spec's §5 says the previous structure is dropped, but no task has actually removed it — so the repo still holds a complete second game, and the front page you are about to write would sit beside the one it replaces. Remove it now, before writing the new files, so nothing is ambiguous about which game a path refers to:

```bash
git rm -r --quiet games/names games/characters assets tools/gen_clues.py tools/gen_images.py tools/common.py
```

That removes: the old character-rebus deck and its 28 clue SVGs, the 18 character pictograms, `assets/runner.js` and `assets/theme.css` (superseded by `core/`), and the three Python generators that drew the pictograms the rebuild replaces with real photographs.

Nothing is lost — all of it stays reachable in commit `64a218a`, and the ten character puns are preserved in the spec's Appendix B for the future Bible Character Names game.

Leaving `assets/theme.css` beside `core/theme.css` in particular would guarantee somebody edits the wrong one.

- [ ] **Step 3: Write the deck**

Create `games/book-names/deck.js`:

```js
/*
 * Bible Book Names - the deck.
 *
 * EDIT THIS FILE to change the game. Nothing else needs touching.
 *
 *   id         a stable handle like 'bn-07', printed small on the projector.
 *              The Game Master looks it up on their phone to see the answer,
 *              so it works no matter how the deck was shuffled. Authored once
 *              and NEVER renumbered - inserting a puzzle takes the next unused
 *              id. It must never contain the answer: it is on a screen in
 *              front of the room, so 'ruth-08' would give the game away.
 *   answer     the book, revealed at the end
 *   answerAlt  its Filipino name, shown alongside on the reveal
 *   ref        canon placement, NOT a chapter - "Daniel 6" under DANIEL
 *              would print the answer beneath the answer
 *   lang       which language is being asked; the card says so on screen
 *   slot       pin to a third of the running order. Always drawn.
 *   difficulty 1-3; the running order ramps upward
 *   variants   more than one picture for one answer; one is drawn per session.
 *              RUTH below shows the shape, commented out.
 *   flag       a note to yourself: 'risky' or 'local'. The game ignores it;
 *              validate.js prints a playtest reminder for 'risky' ones.
 *
 * Every picture lives in ./images/ and is committed. There is no private
 * image tier: this repo publishes to GitHub Pages, which deploys only what
 * is committed, so a gitignored picture would just be missing online.
 *
 * A .js file assigning a global, not .json: fetch() is blocked on file://,
 * so a JSON deck would work on GitHub Pages and then show a blank screen
 * when opened from a USB stick.
 */
window.DECK = {
  id: 'book-names',
  title: 'Bible Book Names',
  imageDirs: ['images/'],
  idPrefix: 'bn',   // puzzle ids are shown on the projector; see spec 16
  shuffle: true,
  sessionSize: 15,
  languages: ['en'],
  puzzles: [
    // ---- Law -----------------------------------------------------------
    {
      id: 'bn-01', answer: 'GENESIS', answerAlt: 'Genesis', difficulty: 2,
      ref: { testament: 'Old', division: 'Law', position: 1 },
      clues: [{ img: 'gene.jpg', word: 'GENE' }, { img: 'sis.jpg', word: 'SIS' }],
    },
    {
      id: 'bn-02', answer: 'EXODUS', answerAlt: 'Exodo', difficulty: 2, flag: 'local',
      ref: { testament: 'Old', division: 'Law', position: 2 },
      clues: [{ img: 'xo.jpg', word: 'XO' }, { img: 'dos.jpg', word: 'DOS' }],
    },
    {
      id: 'bn-03', answer: 'LEVITICUS', answerAlt: 'Levitico', difficulty: 3, flag: 'risky',
      ref: { testament: 'Old', division: 'Law', position: 3 },
      clues: [{ img: 'levi.jpg', word: 'LEVI' }, { img: 'tick.jpg', word: 'TICK' },
              { img: 'us.jpg', word: 'US' }],
    },
    {
      id: 'bn-04', answer: 'NUMBERS', answerAlt: 'Mga Bilang', difficulty: 1,
      ref: { testament: 'Old', division: 'Law', position: 4 },
      type: 'image', img: 'numerals.jpg',
    },

    // ---- Historical ----------------------------------------------------
    {
      id: 'bn-05', answer: 'JUDGES', answerAlt: 'Mga Hukom', difficulty: 1,
      ref: { testament: 'Old', division: 'Historical', position: 7 },
      type: 'image', img: 'gavel.jpg',
    },
    {
      id: 'bn-06', answer: 'RUTH', answerAlt: 'Ruth', difficulty: 2,
      ref: { testament: 'Old', division: 'Historical', position: 8 },
      clues: [{ img: 'root.jpg', word: 'ROOT' }],

      // The church-member cameo is prepared but not enabled. To turn it on:
      // drop ruth-member.jpg into images/, delete the `clues` and
      // `difficulty` lines above, and paste these in their place -
      //
      //   slot: 'late',
      //   variants: [
      //     { type: 'image', img: 'ruth-member.jpg', weight: 2, difficulty: 1 },
      //     { type: 'rebus', clues: [{ img: 'root.jpg', word: 'ROOT' }], difficulty: 2 },
      //   ],
      //
      // slot: 'late' matters - the cameo only pays off once the room has
      // understood the game, so it must never land first (spec 6.2).
      // Ask her first: this site is published to a public URL, which is a
      // bigger question than a picture on the hall projector.
    },
    {
      id: 'bn-07', answer: 'SAMUEL', answerAlt: '1 Samuel', difficulty: 2,
      ref: { testament: 'Old', division: 'Historical', position: 9 },
      clues: [{ img: 'sum.jpg', word: 'SUM' }, { img: 'well.jpg', word: 'WELL' }],
    },
    {
      id: 'bn-08', answer: 'KINGS', answerAlt: 'Mga Hari', difficulty: 1,
      ref: { testament: 'Old', division: 'Historical', position: 11 },
      type: 'image', img: 'crown.jpg',
    },
    {
      id: 'bn-09', answer: 'ESTHER', answerAlt: 'Ester', difficulty: 2,
      ref: { testament: 'Old', division: 'Historical', position: 17 },
      clues: [{ img: 'letter-s.jpg', word: 'S' }, { img: 'tear.jpg', word: 'TEAR' }],
    },

    // ---- Poetry --------------------------------------------------------
    {
      id: 'bn-10', answer: 'JOB', answerAlt: 'Job', difficulty: 2,
      ref: { testament: 'Old', division: 'Poetry', position: 18 },
      type: 'image', img: 'hardhat.jpg',
    },
    {
      id: 'bn-11', answer: 'PSALMS', answerAlt: 'Mga Awit', difficulty: 1,
      ref: { testament: 'Old', division: 'Poetry', position: 19 },
      clues: [{ img: 'palms.jpg', word: 'PALMS' }],
    },
    {
      id: 'bn-12', answer: 'PROVERBS', answerAlt: 'Mga Kawikaan', difficulty: 3,
      ref: { testament: 'Old', division: 'Poetry', position: 20 },
      clues: [{ img: 'pro.jpg', word: 'PRO' }, { img: 'verbs.jpg', word: 'VERBS' }],
    },

    // ---- Major Prophets ------------------------------------------------
    {
      // jerry.png is supplied by hand, not sourced here - it is Warner Bros'
      // character and this repo publishes publicly. Until it is added, this
      // card shows a red placeholder on its first clue, which is intended.
      id: 'bn-13', answer: 'JEREMIAH', answerAlt: 'Jeremias', difficulty: 3,
      ref: { testament: 'Old', division: 'Major Prophets', position: 24 },
      clues: [{ img: 'jerry.png', word: 'JERRY' }, { img: 'maya.jpg', word: 'MAYA' }],
    },
    {
      id: 'bn-14', answer: 'DANIEL', answerAlt: 'Daniel', difficulty: 1,
      ref: { testament: 'Old', division: 'Major Prophets', position: 27 },
      clues: [{ img: 'done.jpg', word: 'DONE' }, { img: 'yell.jpg', word: 'YELL' }],
    },

    // ---- Minor Prophets ------------------------------------------------
    {
      id: 'bn-15', answer: 'HOSEA', answerAlt: 'Oseas', difficulty: 2,
      ref: { testament: 'Old', division: 'Minor Prophets', position: 28 },
      clues: [{ img: 'hose.jpg', word: 'HOSE' }, { img: 'letter-a.jpg', word: 'A' }],
    },
    {
      id: 'bn-16', answer: 'JOEL', answerAlt: 'Joel', difficulty: 2,
      ref: { testament: 'Old', division: 'Minor Prophets', position: 29 },
      clues: [{ img: 'jewel.jpg', word: 'JEWEL' }],
    },
    {
      id: 'bn-17', answer: 'AMOS', answerAlt: 'Amos', difficulty: 2,
      ref: { testament: 'Old', division: 'Minor Prophets', position: 30 },
      clues: [{ img: 'letter-a.jpg', word: 'A' }, { img: 'moss.jpg', word: 'MOSS' }],
    },
    {
      id: 'bn-18', answer: 'JONAH', answerAlt: 'Jonas', difficulty: 1,
      ref: { testament: 'Old', division: 'Minor Prophets', position: 32 },
      type: 'image', img: 'whale.jpg',
    },
    {
      id: 'bn-19', answer: 'MICAH', answerAlt: 'Mikas', difficulty: 2,
      ref: { testament: 'Old', division: 'Minor Prophets', position: 33 },
      clues: [{ img: 'mic.jpg', word: 'MIC' }, { img: 'ah.jpg', word: 'AH' }],
    },
    {
      id: 'bn-20', answer: 'MALACHI', answerAlt: 'Malakias', difficulty: 2,
      ref: { testament: 'Old', division: 'Minor Prophets', position: 39 },
      clues: [{ img: 'mall.jpg', word: 'MALL' }, { img: 'letter-a.jpg', word: 'A' },
              { img: 'key.jpg', word: 'KEY' }],
    },

    // ---- Gospels and after ---------------------------------------------
    {
      id: 'bn-21', answer: 'MARK', answerAlt: 'Marcos', difficulty: 1,
      ref: { testament: 'New', division: 'Gospels', position: 41 },
      clues: [{ img: 'mark.jpg', word: 'MARK' }],
    },
    {
      id: 'bn-22', answer: 'LUKE', answerAlt: 'Lucas', difficulty: 3, flag: 'risky',
      ref: { testament: 'New', division: 'Gospels', position: 42 },
      clues: [{ img: 'look.jpg', word: 'LOOK' }],
    },
    {
      id: 'bn-23', answer: 'ACTS', answerAlt: 'Mga Gawa', difficulty: 2,
      ref: { testament: 'New', division: 'History', position: 44 },
      clues: [{ img: 'axe.jpg', word: 'AXE' }, { img: 'letter-s.jpg', word: 'S' }],
    },
    {
      id: 'bn-24', answer: 'HEBREWS', answerAlt: 'Hebreo', difficulty: 3,
      ref: { testament: 'New', division: 'General Epistles', position: 58 },
      clues: [{ img: 'he.jpg', word: 'HE' }, { img: 'brews.jpg', word: 'BREWS' }],
    },
    {
      id: 'bn-25', answer: 'JAMES', answerAlt: 'Santiago', difficulty: 2,
      ref: { testament: 'New', division: 'General Epistles', position: 59 },
      clues: [{ img: 'jam.jpg', word: 'JAM' }, { img: 'letter-s.jpg', word: 'S' }],
    },
  ],
};
```

Create an empty `games/book-names/images/.gitkeep` so the committed image directory exists before any image does.

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/deck.test.js`
Expected: PASS, 4 tests.

Run: `node tools/validate.js games/book-names/deck.js`
Expected: `playable puzzles: 25`, `notice:` lines for the three puzzles flagged risky (LEVITICUS, LUKE, and any other), then `deck OK`.

- [ ] **Step 5: Write the game page**

Create `games/book-names/index.html`. Note every `src` is relative — a leading slash would work locally and 404 on GitHub Pages.

```html
<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Bible Book Names — San Fernando AY Church</title>
<link rel="stylesheet" href="../../core/theme.css">
</head>
<body>
<div class="host" id="host"></div>

<script src="../../core/normalize.js"></script>
<script src="../../core/variants.js"></script>
<script src="../../core/order.js"></script>
<script src="../../core/machine.js"></script>
<script src="../../core/views.js"></script>
<script src="../../core/images.js"></script>
<script src="../../core/paint.js"></script>
<script src="../../core/controls.js"></script>
<script src="../../core/boot.js"></script>
<script src="deck.js"></script>
<script>
  BibleGames.boot.start(window.DECK, document.getElementById('host'));
</script>
</body>
</html>
```

- [ ] **Step 6: Write the front page**

Create `games.js`:

```js
/*
 * The games on the front page.
 *
 * To add one: copy games/book-names/ to games/your-game/, edit its deck,
 * then add an entry here. That is the whole wiring - the engine handles any
 * "show a prompt, reveal in stages, move on" game.
 *
 * status: 'ready'  - a playable link
 *         'parked' - greyed out and not clickable
 */
window.GAMES = [
  {
    title: 'Bible Book Names',
    href: 'games/book-names/index.html',
    blurb: 'Picture clues combine into a book of the Bible. Gene + sis. XO + dos.',
    meta: 'Ready to play',
    status: 'ready',
  },
  {
    title: 'Old or New?',
    href: 'games/old-or-new/index.html',
    blurb: 'A book flashes up; the room shouts which testament. A fast warm-up.',
    meta: 'Planned',
    status: 'parked',
  },
  {
    title: 'Finish the Verse',
    href: 'games/finish-the-verse/index.html',
    blurb: 'A familiar verse appears with the ending missing.',
    meta: 'Planned',
    status: 'parked',
  },
  {
    title: 'Bible Character Names',
    href: 'games/character-names/index.html',
    blurb: 'A picture of a person from a story; the room names them.',
    meta: 'Planned',
    status: 'parked',
  },
];
```

Create `index.html`:

```html
<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>San Fernando AY Church — AY Bible Games</title>
<link rel="stylesheet" href="core/theme.css">
<style>
  body { overflow: auto; }
  .front { max-width: 60rem; margin: 0 auto; padding: 6vmin 5vmin; }
  .church { font-size: 2vmin; letter-spacing: 0.3em; text-transform: uppercase;
            color: var(--accent); }
  h1 { font-size: 7vmin; margin: 1vmin 0 1rem; }
  .lead { color: var(--dim); font-size: 2.4vmin; max-width: 40rem; line-height: 1.6; }
  .cards { display: grid; gap: 1.5rem; margin-top: 3rem;
           grid-template-columns: repeat(auto-fit, minmax(16rem, 1fr)); }
  .card { display: block; background: var(--card); border-radius: 1rem;
          padding: 1.5rem; text-decoration: none; color: inherit; }
  .card.parked { opacity: 0.45; pointer-events: none; }
  .card h2 { margin: 0 0 0.5rem; font-size: 1.5rem; }
  .card p { margin: 0 0 1rem; color: var(--dim); line-height: 1.5; }
  .meta { font-size: 0.75rem; letter-spacing: 0.2em; text-transform: uppercase;
          color: var(--accent); }
  .gm-link { margin-top: 3rem; font-size: 0.8rem; }
  .gm-link a { color: var(--dim); }
</style>
</head>
<body>
<div class="front">
  <div class="church">San Fernando AY Church</div>
  <h1>AY Bible Games</h1>
  <p class="lead">Put one on the projector. The room shouts the answer, one
  person clicks to reveal. No typing, no sign-in, and no internet needed —
  open it straight from the folder.</p>
  <div class="cards" id="cards"></div>
  <p class="gm-link"><a href="games/book-names/gm.html">Game master</a></p>
</div>

<script src="games.js"></script>
<script>
  (function () {
    var host = document.getElementById('cards');
    window.GAMES.forEach(function (g) {
      var ready = g.status === 'ready';
      var card = document.createElement(ready ? 'a' : 'div');
      card.className = ready ? 'card' : 'card parked';
      if (ready) { card.href = g.href; }
      var h = document.createElement('h2'); h.textContent = g.title;
      var p = document.createElement('p'); p.textContent = g.blurb;
      var m = document.createElement('div'); m.className = 'meta'; m.textContent = g.meta;
      card.appendChild(h); card.appendChild(p); card.appendChild(m);
      host.appendChild(card);
    });
  })();
</script>
</body>
</html>
```

- [ ] **Step 7: Write the review page**

Create `tools/review.html` — every puzzle and **every variant** on one screen, reading the real deck so it cannot drift from the game.

```html
<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Deck review — Bible Book Names</title>
<link rel="stylesheet" href="../core/theme.css">
<style>
  body { overflow: auto; }
  .grid { display: grid; gap: 1rem; padding: 2rem;
          grid-template-columns: repeat(auto-fill, minmax(18rem, 1fr)); }
  .cell { background: var(--card); border-radius: 0.8rem; padding: 1rem; }
  .cell img { height: 5rem; background: #0d1017; border-radius: 0.4rem; padding: 0.3rem; }
  .cell .row { display: flex; gap: 0.4rem; align-items: center; flex-wrap: wrap; }
  .cell h3 { margin: 0.6rem 0 0.2rem; font-size: 1.3rem; }
  .tag { font-size: 0.65rem; letter-spacing: 0.15em; text-transform: uppercase;
         padding: 0.15rem 0.5rem; border-radius: 1rem; background: var(--bg);
         color: var(--dim); }
  .tag.risky { background: var(--bad); color: #fff; }
  .tag.local { background: var(--accent); color: var(--bg); }
  .miss { color: var(--bad); font-size: 2rem; }
</style>
</head>
<body>
<div class="grid" id="grid"></div>

<script src="../core/normalize.js"></script>
<script src="../games/book-names/deck.js"></script>
<script>
  (function () {
    var deck = BibleGames.normalize.normalizeDeck(window.DECK);
    var grid = document.getElementById('grid');
    var dirs = deck.imageDirs;

    function tag(text, cls) {
      var t = document.createElement('span');
      t.className = 'tag' + (cls ? ' ' + cls : '');
      t.textContent = text;
      return t;
    }

    deck.puzzles.forEach(function (p) {
      p.variants.forEach(function (v, i) {
        var cell = document.createElement('div');
        cell.className = 'cell';
        var row = document.createElement('div');
        row.className = 'row';
        var names = v.clues ? v.clues.map(function (c) { return c.img; })
                            : (v.img ? [v.img] : []);
        names.forEach(function (n) {
          var img = document.createElement('img');
          img.src = dirs[dirs.length - 1] + n;   // committed dir; review is for the public deck
          img.alt = n;
          img.onerror = function () {
            var miss = document.createElement('span');
            miss.className = 'miss';
            miss.textContent = '?';
            miss.title = n + ' not found';
            img.replaceWith(miss);
          };
          row.appendChild(img);
        });
        var h = document.createElement('h3');
        h.textContent = p.answer + (p.variants.length > 1 ? ' · variant ' + (i + 1) : '');
        var tags = document.createElement('div');
        tags.className = 'row';
        tags.appendChild(tag(v.type));
        tags.appendChild(tag('d' + v.difficulty));
        tags.appendChild(tag(p.lang === 'fil' ? 'Filipino' : 'English'));
        if (p.slot !== 'anywhere') { tags.appendChild(tag(p.slot)); }
        if (v.flag) { tags.appendChild(tag(v.flag, v.flag)); }
        cell.appendChild(row);
        cell.appendChild(h);
        if (p.answerAlt) {
          var alt = document.createElement('div');
          alt.style.color = 'var(--accent)';
          alt.textContent = p.answerAlt;
          cell.appendChild(alt);
        }
        cell.appendChild(tags);
        grid.appendChild(cell);
      });
    });
  })();
</script>
</body>
</html>
```

- [ ] **Step 8: Run the whole suite**

Run: `node --test tests/`
Expected: PASS, every test from Tasks 1–12.

- [ ] **Step 9: Commit**

```bash
git add games/ games.js index.html tools/review.html tests/deck.test.js
git commit -m "Add Bible Book Names deck, game page, front page and review page"
```

---

### Task 13: The Game Master view

**Files:**
- Create: `core/gm.js`
- Create: `gm-config.js`
- Create: `tools/gm-hash.js`
- Create: `games/book-names/gm.html`
- Test: `tests/gm.test.js`

**Interfaces:**
- Consumes: `BibleGames.normalize.normalizeDeck` (Task 2), `BibleGames.views.formatRef` (Task 6), and `window.DECK` (Task 12).
- Produces: `BibleGames.gm` with `hashCode(text) -> number`, `matches(input, hash) -> boolean`, and `rows(deck) -> Row[]` where a `Row` is `{id, answer, answerAlt, ref, working, lang, flags}` sorted by `id`.

The projector prints `#bn-07`; the GM finds that row on their phone. Because ids never move, nothing is synchronised between the two devices and reshuffling costs nothing. See spec §16.

- [ ] **Step 1: Write the failing test**

Create `tests/gm.test.js`:

```js
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
require('../core/normalize.js');
require('../core/views.js');
require('../core/gm.js');
const { hashCode, matches, rows } = globalThis.BibleGames.gm;

const deck = () => ({
  id: 'book-names',
  languages: ['en', 'fil'],
  puzzles: [
    {
      id: 'bn-02', answer: 'JEREMIAH', answerAlt: 'Jeremias', flag: 'risky',
      ref: { testament: 'Old', division: 'Major Prophets', position: 24 },
      clues: [{ img: 'jerry.png', word: 'JERRY' }, { img: 'maya.jpg', word: 'MAYA' }],
    },
    { id: 'bn-01', answer: 'JONAH', answerAlt: 'Jonas', type: 'image', img: 'whale.jpg',
      ref: { testament: 'Old', division: 'Minor Prophets', position: 32 } },
    { id: 'bn-03', answer: 'HARI', lang: 'fil', type: 'image', img: 'crown.jpg' },
  ],
});

test('hashing is deterministic and ignores case and surrounding space', () => {
  assert.equal(hashCode('Sabbath1844'), hashCode('Sabbath1844'));
  assert.equal(hashCode('  sabbath1844  '), hashCode('SABBATH1844'));
});

test('different codes hash differently', () => {
  assert.notEqual(hashCode('alpha'), hashCode('omega'));
});

test('hashing returns an unsigned 32-bit integer', () => {
  const h = hashCode('anything');
  assert.ok(Number.isInteger(h) && h >= 0 && h <= 0xffffffff, `got ${h}`);
});

test('matches accepts the right code and rejects the wrong one', () => {
  const stored = hashCode('sabbath1844');
  assert.equal(matches('sabbath1844', stored), true);
  assert.equal(matches(' Sabbath1844 ', stored), true);
  assert.equal(matches('sabbath1845', stored), false);
  assert.equal(matches('', stored), false);
});

test('rows are sorted by id, not by deck order', () => {
  assert.deepEqual(rows(deck()).map((r) => r.id), ['bn-01', 'bn-02', 'bn-03']);
});

test('a row carries what the game master needs to run the puzzle', () => {
  const r = rows(deck()).find((x) => x.id === 'bn-02');
  assert.equal(r.answer, 'JEREMIAH');
  assert.equal(r.answerAlt, 'Jeremias');
  assert.equal(r.ref, 'Old Testament · Major Prophets · book 24 of 66');
  assert.equal(r.working, 'JERRY + MAYA');
  assert.equal(r.lang, 'en');
  assert.deepEqual(r.flags, ['risky']);
});

test('a direct-picture puzzle has no working line', () => {
  assert.equal(rows(deck()).find((x) => x.id === 'bn-01').working, null);
});

test('the language being asked is carried through', () => {
  assert.equal(rows(deck()).find((x) => x.id === 'bn-03').lang, 'fil');
});

test('every puzzle in the deck gets a row, in every language', () => {
  assert.equal(rows(deck()).length, 3);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/gm.test.js`
Expected: FAIL — `Cannot find module '../core/gm.js'`

- [ ] **Step 3: Write the module**

Create `core/gm.js`:

```js
/*
 * The Game Master view's data and its gate.
 *
 * The room sees the projector; whoever is running the game needs the answers
 * on their own phone. Every puzzle carries a stable id that the projector
 * prints in a corner, so the GM looks up one row and never needs to know the
 * running order. Reshuffling costs nothing, and they can join halfway through.
 */
(function (root) {
  'use strict';

  var BG = root.BibleGames;

  // FNV-1a, 32-bit. NOT cryptographic, and not pretending to be: knowing the
  // code is the whole gate, and the threat model is a curious teenager with a
  // phone. The hash exists only so the code is not sitting in plain text in a
  // public repository, which would defeat the one purpose it has.
  function hashCode(text) {
    var s = String(text == null ? '' : text).trim().toLowerCase();
    var h = 0x811c9dc5;
    for (var i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = (h + ((h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24))) >>> 0;
    }
    return h >>> 0;
  }

  function matches(input, hash) {
    if (!String(input == null ? '' : input).trim()) { return false; }
    return hashCode(input) === hash;
  }

  function rows(deck) {
    var normalized = BG.normalize.normalizeDeck(deck);
    return normalized.puzzles.map(function (p) {
      var v = p.variants[0];
      var flags = [];
      p.variants.forEach(function (each) {
        if (each.flag && flags.indexOf(each.flag) === -1) { flags.push(each.flag); }
      });
      return {
        id: p.id,
        answer: p.answer,
        answerAlt: p.answerAlt,
        ref: BG.views.formatRef(p.ref),
        working: v.clues
          ? v.clues.map(function (c) { return c.word; }).join(' + ')
          : null,
        lang: p.lang,
        flags: flags,
      };
    }).sort(function (a, b) {
      return String(a.id) < String(b.id) ? -1 : (String(a.id) > String(b.id) ? 1 : 0);
    });
  }

  root.BibleGames = root.BibleGames || {};
  root.BibleGames.gm = { hashCode: hashCode, matches: matches, rows: rows };
})(typeof globalThis !== 'undefined' ? globalThis : window);
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/gm.test.js`
Expected: PASS, 9 tests.

- [ ] **Step 5: Write the hash tool and the config**

Create `tools/gm-hash.js`:

```js
/*
 * Print the hash for a game master access code.
 *
 *   node tools/gm-hash.js "sabbath1844"
 *
 * Paste the number it prints into gm-config.js. The code itself is never
 * committed anywhere.
 */
'use strict';
require('../core/gm.js');
var code = process.argv[2];
if (!code) {
  console.error('usage: node tools/gm-hash.js "<access code>"');
  process.exit(2);
}
console.log(globalThis.BibleGames.gm.hashCode(code));
```

Create `gm-config.js`. Run `node tools/gm-hash.js "changeme"` and paste the number it prints:

```js
/*
 * Who may see the answers.
 *
 * Knowing the code is the whole gate. This is obscurity, not security - see
 * spec 8.1 and 16. Change it with:  node tools/gm-hash.js "your code"
 */
window.GM_CONFIG = { codeHash: 0 };   // <- replace with the printed number
```

- [ ] **Step 6: Write the Game Master page**

Create `games/book-names/gm.html`. Every path relative, as everywhere else.

```html
<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Game master — Bible Book Names</title>
<link rel="stylesheet" href="../../core/theme.css">
<style>
  body { overflow: auto; }
  .wrap { max-width: 44rem; margin: 0 auto; padding: 1.5rem 1rem 4rem; }
  h1 { font-size: 1.5rem; margin: 0 0 0.25rem; }
  .sub { color: var(--dim); font-size: 0.85rem; margin: 0 0 1.5rem; }
  input { width: 100%; font-size: 1.1rem; padding: 0.7rem 0.9rem; border-radius: 0.6rem;
          border: 1px solid #2c3444; background: var(--card); color: var(--fg); }
  .row { background: var(--card); border-radius: 0.7rem; padding: 0.8rem 1rem;
         margin-top: 0.6rem; }
  .rid { font-size: 0.7rem; letter-spacing: 0.2em; color: var(--dim);
         text-transform: uppercase; }
  .ranswer { font-size: 1.6rem; font-weight: 700; }
  .ralt { color: var(--accent); font-style: italic; }
  .rmeta { font-size: 0.75rem; color: var(--dim); margin-top: 0.3rem; }
  .rwork { font-size: 0.9rem; letter-spacing: 0.08em; color: var(--accent); }
  .tag { font-size: 0.65rem; text-transform: uppercase; letter-spacing: 0.15em;
         padding: 0.1rem 0.45rem; border-radius: 1rem; background: var(--bg);
         color: var(--dim); margin-right: 0.3rem; }
  .tag.risky { background: var(--bad); color: #fff; }
  .hide { display: none; }
  .note { color: var(--dim); font-size: 0.8rem; margin-top: 0.6rem; }
</style>
</head>
<body>
<div class="wrap">
  <h1>Game master</h1>
  <p class="sub">Bible Book Names — San Fernando AY Church</p>

  <div id="gate">
    <input id="code" type="password" placeholder="Access code" autocomplete="off">
    <p class="note" id="gate-note">The projector shows a puzzle id like
      <strong>#bn-07</strong> in the bottom corner. Enter the code, then find that id.</p>
  </div>

  <div id="list" class="hide">
    <input id="filter" type="search" placeholder="Filter by id or answer — e.g. bn-07"
           autocomplete="off">
    <div id="rows"></div>
  </div>
</div>

<script src="../../core/normalize.js"></script>
<script src="../../core/views.js"></script>
<script src="../../core/gm.js"></script>
<script src="../../gm-config.js"></script>
<script src="deck.js"></script>
<script>
  (function () {
    var gate = document.getElementById('gate');
    var list = document.getElementById('list');
    var codeBox = document.getElementById('code');
    var note = document.getElementById('gate-note');
    var rowsHost = document.getElementById('rows');
    var filter = document.getElementById('filter');
    var all = BibleGames.gm.rows(window.DECK);

    function el(tag, cls, text) {
      var n = document.createElement(tag);
      if (cls) { n.className = cls; }
      if (text != null) { n.textContent = text; }
      return n;
    }

    function draw(term) {
      rowsHost.innerHTML = '';
      var q = String(term || '').trim().toLowerCase();
      all.filter(function (r) {
        return !q || r.id.toLowerCase().indexOf(q) !== -1
          || r.answer.toLowerCase().indexOf(q) !== -1;
      }).forEach(function (r) {
        var box = el('div', 'row');
        box.appendChild(el('div', 'rid', '#' + r.id));
        box.appendChild(el('div', 'ranswer', r.answer));
        if (r.answerAlt) { box.appendChild(el('div', 'ralt', r.answerAlt)); }
        if (r.working) { box.appendChild(el('div', 'rwork', r.working)); }
        var meta = el('div', 'rmeta');
        meta.appendChild(el('span', 'tag', r.lang === 'fil' ? 'Filipino' : 'English'));
        r.flags.forEach(function (f) { meta.appendChild(el('span', 'tag ' + f, f)); });
        if (r.ref) { meta.appendChild(document.createTextNode(r.ref)); }
        box.appendChild(meta);
        rowsHost.appendChild(box);
      });
    }

    function unlock() {
      gate.classList.add('hide');
      list.classList.remove('hide');
      draw('');
    }

    function tryCode(value) {
      if (BibleGames.gm.matches(value, window.GM_CONFIG.codeHash)) {
        try { sessionStorage.setItem('gm', '1'); } catch (e) { /* private mode */ }
        unlock();
      } else {
        note.textContent = 'That code is not right. Ask whoever set the game up.';
      }
    }

    try {
      if (sessionStorage.getItem('gm') === '1') { unlock(); }
    } catch (e) { /* private mode: just ask for the code */ }

    codeBox.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') { tryCode(codeBox.value); }
    });
    filter.addEventListener('input', function () { draw(filter.value); });
  })();
</script>
</body>
</html>
```

- [ ] **Step 7: Run the whole suite**

Run: `node --test tests/`
Expected: PASS, every test from Tasks 1–13.

- [ ] **Step 8: Commit**

```bash
git add core/gm.js gm-config.js tools/gm-hash.js games/book-names/gm.html tests/gm.test.js
git commit -m "Add the game master view"
```

---

### Task 14: Verification and documentation

**Files:**
- Modify: `README.md` (replace wholesale)
- Modify: `HANDOVER.md` (replace wholesale)
- Modify: `CREDITS.md` (one row per committed image)

**Interfaces:**
- Consumes: the finished game.
- Produces: nothing code depends on.

- [ ] **Step 1: Run every automated check**

```bash
node --test tests/
node tools/validate.js games/book-names/deck.js --files games/book-names/images
```

Expected: all tests pass; the validator prints `deck OK`, the JEREMIAH public-invisible notice, and a list of images not yet sourced. That last list is the image-sourcing worklist.

- [ ] **Step 2: Check both protocols in a browser**

Open `index.html` by double-clicking it (this is the `file://` case, and the one that matters — it is how the game runs in the hall). Then serve it and check again:

```bash
python3 -m http.server 8000
```

For each of `file://` and `http://localhost:8000`: click through the whole deck, then confirm in the devtools console that there are **no errors** and no failed requests other than images you have not sourced yet. Check at 1280×760 and 390×700.

Specifically confirm:
- The language badge is visible on every card.
- A rebus reveals in two beats — working line, then answer with the Filipino name and canon reference.
- Missing images show the red `?`, not a blank.
- `R` reshuffles, `O` restores deck order, `←` steps back into the previous puzzle's final stage, `Home` restarts, `F` goes fullscreen.
- Any picture not yet sourced shows the red `?` rather than the puzzle disappearing. In particular JEREMIAH shows a placeholder on its `jerry.png` clue and still plays.

- [ ] **Step 3: Check the missing-picture path deliberately**

Temporarily rename one sourced image aside, reload, and confirm the card shows the red `?` and the puzzle **still plays** — it must not disappear from the deck. Put the file back.

This is the behaviour the published site depends on: a picture that failed to deploy has to be visible as a broken card, not as a puzzle that quietly never appears.

Then confirm nothing untracked is lurking in the image directory:

```bash
git status --short games/book-names/
```

Expected: no output once the images are committed. Anything listed here is a picture the published site will not have.

- [ ] **Step 4: Rewrite `README.md`**

This is the host-facing document. It covers, and only covers: what the game is; how to open it; the controls; how to edit `deck.js` (all the field meanings, including the commented-out `variants` cameo on RUTH); how to add your own pictures and why a committed file beats a URL; the Google Images thumbnail warning; the note that cartoon characters and mascots belong to somebody and that this repo publishes publicly, so `jerry.png` is a deliberate choice rather than an oversight; publishing to Pages and why every path is relative; and what is in each directory.

Do not document the engine's internals here. That is what the spec is for.

- [ ] **Step 5: Rewrite `HANDOVER.md`**

Replace it entirely. The old one documented a game about characters as settled decisions, and carried a git-cleanup section citing a commit that no longer exists. Neither survives.

The new one is short and contains only:
- **Current state** — what is built, what is not, what is unverified. Name the projector dry run and the pun playtest as outstanding if they are.
- **Open decisions** — the Appendix A rows still marked `proposed`; whether Ruth has agreed to the cameo; whether `languages` should include `'fil'` yet.
- **Pointers** — the spec for *why*, the plan for *what was built*, `README.md` for *how to run it*, `tools/review.html` for *seeing the deck*.
- **Rejected ideas, do not re-propose** — carry over the list from the spec's Appendix B so nobody re-proposes "cup of joe" for Jonah in six months.

Write it in project voice, not session-log voice: no "I could not do this from this session". A handover that reads as a diary rots with every session; one that reads as documentation gets edited.

- [ ] **Step 6: Fill in `CREDITS.md`**

One row per file actually committed to `games/book-names/images/`: filename, source URL, author, licence. A committed image with no row is a licensing problem waiting to happen, so the table and the directory must match exactly.

- [ ] **Step 7: Commit**

```bash
git add README.md HANDOVER.md CREDITS.md
git commit -m "Rewrite README and HANDOVER for the rebuilt game"
```

- [ ] **Step 8: The gate that is not automatable**

Two things no test covers, both from the spec's §12:

1. **A dry run on the actual projector and laptop.** The previous build never had one. Colours that read on a monitor can wash out on a hall screen, and 34vmin clue art can be too small from the back row.
2. **Playtest the puns on two or three people** before a service. This remains the single riskiest thing in the project — a pun that does not land dies in silence, and no amount of passing tests tells you whether GENESIS reads as *gene + sis*.

Neither is a checkbox anyone else can tick for you. Do them before the deck meets a congregation.

---

## Plan Self-Review

**Spec coverage.** Walking the spec section by section:

| Spec | Task |
|---|---|
| §4 constraints (file://, no fetch, relative paths, IIFE) | Global Constraints; enforced in Tasks 2–12 |
| §5 structure | File Structure table; Tasks 2–12 |
| §6 engine, controls, preload | Tasks 5, 9; preload is satisfied differently — see the note below |
| §6.1 shuffle / sessionSize / difficulty | Task 4 |
| §6.2 slot zones, pinned always drawn | Task 4 |
| §7 five renderers | Task 6 (views) + Task 8 (paint) |
| §8 fallback chain, gitignore, sourcing | Tasks 1, 7; sourcing worklist from Task 13 Step 1 |
| §8.1 no private image tier; a missing picture always shows | Tasks 2, 3, 10, 12 |
| §9 reference format | Task 6 |
| §10 deck format | Tasks 2, 12 |
| §10.1 variants | Tasks 3, 10, 12 |
| §11 deck content | Task 12 |
| §11.1 Filipino names, badge | Tasks 6, 12 |
| §12 verification | Tasks 11, 14 |
| §16 game master view | Tasks 6, 8, 11, 12, 13 |
| §13 milestones | Task order |
| §14 future games | `games.js` parked entries (Task 12) |

**One deliberate divergence.** The spec's §6 describes preloading the *next* item's images during the current puzzle. Task 10 resolves every image up front instead, because variant eligibility has to be known before the running order exists — a variant cannot be picked without knowing whether its pictures are there. Up-front resolution satisfies the intent (no reveal ever waits on a decode) with less machinery, and it is why `srcFor` is synchronous. Decks are tens of images, not thousands.

**Two gaps, both stated rather than hidden.** `core/paint.js` has no Node unit test — a DOM implementation is a worse trade than Task 13's browser pass, and paint is kept decision-free so that the untested part is only drawing. `core/controls.js` has its key table tested but not its DOM wiring, covered the same way.

**Placeholder scan.** No "TBD", no "add error handling", no "similar to Task N". Every code step carries the real code. Task 14's prose steps describe document contents rather than code, which is correct for a documentation task — but where a decision was needed (what leaves the handover, what stays) the plan makes it rather than deferring it.

**Type consistency.** Checked across tasks: `normalizePuzzle`/`normalizeDeck` (T2) → `eligible`/`pick` (T3) → `zoneRange`/`shuffle`/`byDifficulty`/`buildOrder` (T4) → `createMachine` (T5) → `formatRef`/`badgeFor`/`byType`/`stagesForItem`/`viewForItem` (T6) → `candidates`/`makeResolver`/`browserLoad` (T7) → `render(host, view, srcFor)` (T8) → `actionFor`/`attach`/`toggleFullscreen` (T9) → `buildSession`/`start` (T10) → `validate` (T11). Names and arities match at every call site.

One consistency point worth flagging for the implementer: `buildOrder` reads `slot` and `difficulty` off the objects it is given, but a session item is a `{puzzle, variant}` pair whose `difficulty` lives on the *variant* and whose `slot` lives on the *puzzle*. Task 10 therefore wraps each pair in a carrier object exposing both, then maps back. Do not "simplify" this by moving `slot` onto variants — placement is a property of the answer, not of which picture was drawn.
