# Hot Potato Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build Hot Potato — the first game here whose deck does not run out — by teaching the engine that a screen may advance itself.

**Architecture:** A card is a three-stage item (music, STOP, the challenge), with a fourth stage for cards that have an answer to give back. `views.js` declares *that* stage 0 advances itself; `boot.js` owns the clock and the music, because the deck is in scope there and `views.js` must stay pure. A view that does not ask for a timer gets no timer, so the seven existing games take exactly the path they take today.

**Tech Stack:** Vanilla ES5 in IIFEs, no build step, no dependencies, `file://`-safe relative paths, `node --test`. Web Audio for the music — no audio files.

**Spec:** `docs/superpowers/specs/2026-10-07-hot-potato-design.md`

## Global Constraints

- **ES5 syntax only in `core/*.js`** — `var`, no arrow functions, no template literals, no `const`/`let`. `tests/pages.test.js:158` enforces this.
- **Every path relative.** `tests/pages.test.js:130` rejects absolute paths. GitHub Pages serves from a subpath and the game must run from a USB stick over `file://`.
- **No dependencies, no build step, no `fetch()`.** Everything loads through plain `<script>` tags.
- **Every core module is an IIFE** ending `})(typeof globalThis !== 'undefined' ? globalThis : window);` and attaches to `root.BibleGames`.
- **Audio never blocks play.** If `AudioContext` is missing, blocked, or throws, the game runs silently and every timer still fires.
- **No strobe and no rapid flashing** in any animation. Dark hall, bright projector, room full of young people.
- **Any text sized in `vmin` must also be capped in `vw`** — `font-size: min(Xvmin, Yvw)`. Name the Place shipped a `7vw` masked beat that clipped its last line at 16:9; the cap belongs on both axes.
- **All 255 existing tests and all seven populated decks stay green** after every task.
- **Commit messages** end with `Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>`.
- **Never `git add -A`.** Stage explicit paths only. `games/object-trail/` and `package.json` hold the user's own uncommitted work and must never be staged.

## Review Focus

Five things the spec implies but no obvious task test covers. Each has its test assigned to the task that owns the code.

1. **A stale timer firing after the screen has moved on.** Pressing ArrowLeft, R, O, Home or S during the music must cancel the pending advance, or the screen jumps while the room is reading it. — Task 4.
2. **Web Audio missing, blocked, or throwing.** A muted church laptop, or a browser that refuses an `AudioContext`, must still play the game with working timers. — Tasks 1 and 4.
3. **The music outliving its stage.** Leaving stage 0 by *any* route — including `S`, which tears the host down — must stop the sound. A loop still playing over the next game is worse than no music. — Task 4.
4. **A malformed `musicSeconds` in a deck.** A reversed pair `[20, 6]`, a missing field, a string, or a zero must fall back to a sane delay rather than produce `NaN`, an instant stop, or a timer that never fires. — Task 1.
5. **A knowledge card with no `prompt`.** A deck typo must not paint a blank screen in front of a room. — Task 5.

---

### Task 1: `core/sound.js` — the delay and the music

**Files:**
- Create: `core/sound.js`
- Test: `tests/sound.test.js`

**Interfaces:**
- Consumes: nothing.
- Produces: `BibleGames.sound.delayMs(range)` → `number` (milliseconds); `BibleGames.sound.play()` → `boolean` (whether sound actually started); `BibleGames.sound.stop()` → `undefined`. Task 4 calls all three.

- [ ] **Step 1: Write the failing test**

Create `tests/sound.test.js`:

```js
'use strict';
// The one random number in this project that is deliberately NOT reproducible.
// Every other test here asserts that a rebuild gives an identical result; this
// one asserts the opposite, because "nobody can anticipate the stop" is the
// whole mechanic and a seeded delay is one a room can learn.
const test = require('node:test');
const assert = require('node:assert/strict');
require('../core/sound.js');
const { delayMs } = globalThis.BibleGames.sound;

function draws(range, n) {
  const out = [];
  for (let i = 0; i < n; i += 1) { out.push(delayMs(range)); }
  return out;
}

test('the delay stays inside the range it was given', () => {
  const out = draws([6, 20], 500);
  const bad = out.filter((ms) => ms < 6000 || ms > 20000);
  assert.deepEqual(bad, [], 'drew outside 6-20s: ' + bad.join(', '));
});

test('the delay is not reproducible, which is the point', () => {
  // A seeded delay would hand the room the one thing the game depends on
  // withholding. 500 draws over a 14-second window collapsing to fewer than
  // 50 distinct values means something is caching or seeding.
  assert.ok(new Set(draws([6, 20], 500)).size > 50,
    'the delay repeats itself - it must be drawn fresh every round');
});

test('the delay uses the whole range, not a corner of it', () => {
  const out = draws([6, 20], 500);
  assert.ok(Math.min(...out) < 9000, 'never draws near the short end');
  assert.ok(Math.max(...out) > 17000, 'never draws near the long end');
});

test('a malformed range falls back instead of breaking the game', () => {
  // These come from a hand-written deck, where a mistake is a reversed pair or
  // a missing field - not a crash. A NaN delay never fires and the game stops
  // dead in front of a room.
  [undefined, null, [], [0, 0], ['a', 'b'], [20, 6], [10]].forEach((bad) => {
    const ms = delayMs(bad);
    assert.ok(Number.isFinite(ms) && ms >= 1000 && ms <= 60000,
      JSON.stringify(bad) + ' produced ' + ms);
  });
});

test('a reversed range is read as a range, not rejected', () => {
  const out = draws([20, 6], 200);
  const bad = out.filter((ms) => ms < 6000 || ms > 20000);
  assert.deepEqual(bad, [], 'a reversed pair should still mean 6-20s');
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/sound.test.js`
Expected: FAIL — `Cannot find module '../core/sound.js'`

- [ ] **Step 3: Write the implementation**

Create `core/sound.js`:

```js
/*
 * The music for Hot Potato, and the one random number in this project that is
 * deliberately NOT reproducible.
 *
 * Everywhere else here, randomness is seeded so a rebuild produces an
 * identical deck: a mistyped fact is only wrong once, on a projector, in front
 * of a room. Here reproducibility is the bug. "Nobody can anticipate the stop"
 * is the whole mechanic, and a seeded delay is one that a teenager who has
 * played twice can learn. So: Math.random, re-rolled every round.
 *
 * No audio FILES. A hymn being public domain does not make a RECORDING of it
 * public domain, and nothing here should need carrying on the USB stick. The
 * loop is built from oscillators instead.
 *
 * Audio NEVER blocks play. If AudioContext is missing, blocked, or throws, the
 * game runs silently and every timer still fires. A church laptop with its
 * output muted must still be able to play this game, so every path through
 * this file returns rather than raising.
 */
(function (root) {
  'use strict';

  var DEFAULT_RANGE = [6, 20];   // seconds
  var MIN_SECONDS = 1;
  var MAX_SECONDS = 60;

  function seconds(value, fallback) {
    var n = Number(value);
    if (!isFinite(n) || n < MIN_SECONDS || n > MAX_SECONDS) { return fallback; }
    return n;
  }

  // Milliseconds to wait before the music stops. Every input is treated as
  // suspect: the range comes from a hand-written deck, where a mistake is a
  // reversed pair or a missing field rather than a crash, and a NaN delay is a
  // timer that never fires and a game that stops dead in front of a room.
  function delayMs(range) {
    var raw = range || [];
    var lo = seconds(raw[0], DEFAULT_RANGE[0]);
    var hi = seconds(raw[1], DEFAULT_RANGE[1]);
    if (hi < lo) { var swap = lo; lo = hi; hi = swap; }
    return Math.round((lo + Math.random() * (hi - lo)) * 1000);
  }

  // A cheerful pentatonic loop over a walking bass. Deliberately plain: this
  // plays under a room talking and laughing, and its only real job is to stop.
  var STEP_MS = 180;
  var LEAD = [523.25, 659.25, 783.99, 659.25, 587.33, 783.99, 880.00, 783.99];
  var BASS = [130.81, 130.81, 164.81, 164.81, 146.83, 146.83, 174.61, 174.61];

  var ctx = null;
  var parts = null;
  var ticker = null;

  function context() {
    if (ctx) { return ctx; }
    var Ctor = root.AudioContext || root.webkitAudioContext;
    if (!Ctor) { return null; }
    try { ctx = new Ctor(); } catch (e) { ctx = null; }
    return ctx;
  }

  function voice(c, out, type, gain) {
    var osc = c.createOscillator();
    var amp = c.createGain();
    osc.type = type;
    amp.gain.value = gain;
    osc.connect(amp);
    amp.connect(out);
    osc.start();
    return { osc: osc, amp: amp };
  }

  function play() {
    stop();
    var c = context();
    if (!c) { return false; }
    try {
      // Browsers suspend a context created outside a gesture. The spacebar
      // that starts the round IS the gesture, so this resume is the one that
      // matters and a rejected promise is not a reason to fail.
      if (c.state === 'suspended' && c.resume) {
        var resumed = c.resume();
        if (resumed && resumed.catch) { resumed.catch(function () {}); }
      }
      var master = c.createGain();
      master.gain.value = 0.09;
      master.connect(c.destination);
      var lead = voice(c, master, 'triangle', 0.0);
      var bass = voice(c, master, 'sine', 0.35);
      parts = { master: master, lead: lead, bass: bass };

      var step = 0;
      ticker = setInterval(function () {
        if (!parts) { return; }
        var now = c.currentTime;
        parts.lead.osc.frequency.setValueAtTime(LEAD[step % LEAD.length], now);
        parts.bass.osc.frequency.setValueAtTime(BASS[step % BASS.length], now);
        // A plucked envelope rather than a held tone, so eight notes read as
        // eight notes from the back of a hall.
        parts.lead.amp.gain.cancelScheduledValues(now);
        parts.lead.amp.gain.setValueAtTime(0.5, now);
        parts.lead.amp.gain.exponentialRampToValueAtTime(0.01, now + 0.16);
        step += 1;
      }, STEP_MS);
      return true;
    } catch (e) {
      stop();
      return false;
    }
  }

  // Safe to call when nothing is playing, and safe to call twice. boot.js
  // calls it on every redraw, which is the only reason the music cannot
  // outlive the screen that started it.
  function stop() {
    if (ticker) { clearInterval(ticker); ticker = null; }
    if (!parts) { return; }
    var dead = parts;
    parts = null;
    try {
      [dead.lead, dead.bass].forEach(function (v) {
        try { v.osc.stop(); } catch (e) { /* already stopped */ }
        try { v.osc.disconnect(); } catch (e) { /* already gone */ }
        try { v.amp.disconnect(); } catch (e) { /* already gone */ }
      });
      dead.master.disconnect();
    } catch (e) { /* tearing down a dead graph is not a failure */ }
  }

  root.BibleGames = root.BibleGames || {};
  root.BibleGames.sound = { delayMs: delayMs, play: play, stop: stop };
})(typeof globalThis !== 'undefined' ? globalThis : window);
```

- [ ] **Step 4: Run the tests**

Run: `node --test tests/sound.test.js`
Expected: PASS, 5 tests.

- [ ] **Step 5: Run the whole suite and check ES5**

Run: `node --test tests/`
Expected: 260 pass, 0 fail. `tests/pages.test.js` must still pass — it parses every `core/*.js` as ES5, and `core/sound.js` is now one of them.

- [ ] **Step 6: Commit**

```bash
git add core/sound.js tests/sound.test.js
git commit -m "Add the music, and the one delay that must not be reproducible"
```

---

### Task 2: the `card` view type

**Files:**
- Modify: `core/normalize.js` — `kind` must survive normalization
- Modify: `core/views.js` — add `card` to `byType`
- Test: `tests/normalize.test.js`, `tests/views.test.js`

**Why normalize.js is in this task:** `normalizeVariant` does not copy a
variant wholesale — it builds a new object from a fixed list of keys. A field
it does not know about is **silently dropped**. `kind` is such a field, so
without this change `variant.kind` is `undefined` by the time any renderer
sees it, `stages()` returns 2 for every card, and **no knowledge card ever
reveals its answer**. The deck would look correct, every existing test would
pass, and the failure would appear in a hall.

**Interfaces:**
- Consumes: `base(kind, puzzle, variant)` and `answered(puzzle, stage, revealAt, variant)`, both already in `views.js`.
- Produces: a view `{ kind: 'card', id, badge, phase, autoAdvance, prompt, answered }`. `phase` is `'playing' | 'stop' | 'card'`. `autoAdvance` is `true` only at stage 0. Task 3 renders it; Task 4 reads `autoAdvance`.

- [ ] **Step 1: Write the failing test**

First, append to `tests/normalize.test.js`:

```js
test('a card variant keeps the field that says what kind it is', () => {
  // normalizeVariant builds a NEW object from a fixed key list rather than
  // copying - so a key it has not been told about vanishes without a word.
  // If `kind` vanishes, every card looks like a task, no knowledge card ever
  // reveals, and nothing anywhere fails.
  const p = normalizePuzzle({
    id: 'hp-01', answer: 'Belshazzar',
    variants: [{ type: 'card', kind: 'knowledge', prompt: 'Which king?' }],
  });
  assert.equal(p.variants[0].kind, 'knowledge');
  assert.equal(p.variants[0].prompt, 'Which king?');
});

test('a variant with no kind gets null, not undefined', () => {
  // Every other key in this module is present-but-empty rather than absent.
  const p = normalizePuzzle({ id: 'x-01', answer: 'A',
                              variants: [{ type: 'text', prompt: 'A?' }] });
  assert.equal(p.variants[0].kind, null);
});
```

Then append to `tests/views.test.js`:

```js
const card = (over) => normalizePuzzle(Object.assign({
  id: 'hp-01', answer: 'Recite two verses from memory',
  variants: [{ type: 'card', kind: 'task' }],
}, over));

const knowledge = () => normalizePuzzle({
  id: 'hp-02', answer: 'Belshazzar', ref: 'Daniel 5',
  variants: [{ type: 'card', kind: 'knowledge',
               prompt: 'Which king saw writing on a wall?' }],
});

test('a task card is three screens and a knowledge card is four', () => {
  // A task has nothing to give back - the room judges. A knowledge card does,
  // and without that fourth screen its answer lives only on a phone nobody
  // opened for a filler game.
  const task = card();
  const know = knowledge();
  assert.equal(byType.card.stages(task.variants[0]), 2);
  assert.equal(byType.card.stages(know.variants[0]), 3);
});

test('only the music screen advances itself', () => {
  const p = card();
  const phases = [0, 1, 2].map((s) => byType.card.view(p, p.variants[0], s));
  assert.deepEqual(phases.map((v) => v.phase), ['playing', 'stop', 'card']);
  assert.deepEqual(phases.map((v) => v.autoAdvance), [true, false, false]);
});

test('the card text is withheld until the third screen', () => {
  const p = card();
  assert.equal(byType.card.view(p, p.variants[0], 0).prompt, null);
  assert.equal(byType.card.view(p, p.variants[0], 1).prompt, null);
  assert.equal(byType.card.view(p, p.variants[0], 2).prompt,
    'Recite two verses from memory');
});

test('a task card IS its answer, so the text is written once', () => {
  // validate.js already rejects two puzzles sharing an answer, so putting the
  // task text there buys duplicate-card detection for nothing.
  const p = card();
  const v = byType.card.view(p, p.variants[0], 2);
  assert.equal(v.prompt, p.answer);
  assert.equal(v.answered, null, 'a task has no answer to reveal');
});

test('a knowledge card asks one thing and answers another', () => {
  const p = knowledge();
  assert.equal(byType.card.view(p, p.variants[0], 2).prompt,
    'Which king saw writing on a wall?');
  assert.equal(byType.card.view(p, p.variants[0], 2).answered, null);
  const end = byType.card.view(p, p.variants[0], 3);
  assert.equal(end.answered.answer, 'Belshazzar');
  assert.equal(end.answered.ref, 'Daniel 5');
});

test('NO OTHER TYPE advances itself', () => {
  // This is the test protecting the seven games that already work. boot.js
  // only sets a timer when a view asks for one; if any other renderer ever
  // starts asking, those games begin moving on their own in front of a room.
  //
  // It COUNTS what it probed. An earlier draft swallowed a throw and carried
  // on, so a wrong probe shape skipped that renderer in silence - and a wrong
  // probe table skipped EVERY renderer, found no offenders and went green
  // while checking nothing. A test whose two halves share the thing under
  // test is the failure that has cost this project the most.
  const others = Object.keys(byType).filter((k) => k !== 'card');
  const noShape = others.filter((k) => !probeFor(k));
  assert.deepEqual(noShape, [],
    'no probe shape for: ' + noShape.join(', ') + ' - add one, do not skip it');

  const offenders = [];
  let probed = 0;
  others.forEach((kind) => {
    for (let stage = 0; stage < 5; stage += 1) {
      const p = probeFor(kind);
      const v = byType[kind].view(p, p.variants[0], stage);
      probed += 1;
      if (v && v.autoAdvance) { offenders.push(kind + ' at stage ' + stage); }
    }
  });
  assert.equal(probed, others.length * 5,
    'probed ' + probed + ' of ' + (others.length * 5) + ' renderer/stage pairs');
  assert.deepEqual(offenders, [], offenders.join('\n'));
});
```

Add this helper above that last test, in the same file:

```js
// Minimal but VALID input per renderer. A renderer handed the wrong shape
// throws, and a test that swallowed the throw would report "no offenders"
// about a renderer it never actually ran.
// It must NOT throw and must NOT return undefined for a registered type.
// views.test.js does not load the atlas, so if the map renderer needs it,
// that surfaces here as a FAILURE rather than as a silent skip.
function probeFor(kind) {
  const shapes = {
    rebus: { variants: [{ type: 'rebus', clues: [{ img: 'a.png', word: 'A' }] }] },
    image: { variants: [{ type: 'image', img: 'a.png' }] },
    text: { variants: [{ type: 'text', prompt: 'A?' }] },
    quote: { variants: [{ type: 'quote', quote: 'A', verse: 'John 1:1' }] },
    binary: { variants: [{ type: 'binary', prompt: 'A?', options: ['A', 'B'], answer: 'A' }] },
    trail: { variants: [{ type: 'trail', items: [{ pictures: [{ img: 'a.png' }] }] }] },
    order: { variants: [{ type: 'order', items: ['A', 'B', 'C'],
             correct: [{ label: 'A', when: '1' }, { label: 'B', when: '2' },
                       { label: 'C', when: '3' }] }] },
    map: { variants: [{ type: 'map', at: [35, 32], extent: 'holyland' }] },
    card: { variants: [{ type: 'card', kind: 'task' }] },
  };
  if (!shapes[kind]) { return null; }
  return normalizePuzzle(Object.assign({ id: 'x-01', answer: 'A' }, shapes[kind]));
}

// If the map renderer needs the atlas loaded, add
// `require('../core/atlas-holyland.js')` and `require('../core/atlas.js')` at
// the top of this file. Do NOT reintroduce a try/catch: a renderer this test
// cannot run is a renderer this test is not protecting.
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/normalize.test.js tests/views.test.js`
Expected: FAIL on both — `kind` comes back `undefined`, and `byType.card` does not exist.

- [ ] **Step 3: Write the implementation**

First, in `core/normalize.js`, add `'kind'` to `VARIANT_KEYS`:

```js
  var VARIANT_KEYS = ['type', 'clues', 'img', 'prompt', 'options', 'items',
                      'correct', 'quote', 'verse', 'clue',
                      'extent', 'at', 'kind',
                      'lang', 'answer', 'ref', 'flag', 'spoken', 'weight', 'difficulty'];
```

and add the field to the object `normalizeVariant` returns, beside `at`:

```js
      // Hot Potato: whether this card is something to DO or something to
      // ANSWER. It decides how many screens the card has, so a dropped `kind`
      // is a knowledge card that never reveals - silently, in a hall.
      kind: v.kind || null,
```

Then, in `core/views.js`, add to the `byType` object, after the `map` entry:

```js
    card: {
      // Three screens for a task - music, STOP, the card - and a fourth for a
      // knowledge card, which has an answer to give back. The quote type
      // already varies its stage count per variant; this is the same idea, and
      // for the same reason: a beat that would say nothing is not shown.
      //
      // Without that fourth screen a knowledge card's answer lives only on the
      // Game Master's phone, and nobody opens a phone for a filler game.
      stages: function (variant) {
        return (variant && variant.kind === 'knowledge') ? 3 : 2;
      },
      view: function (puzzle, variant, stage) {
        var v = base('card', puzzle, variant);
        v.phase = stage === 0 ? 'playing' : (stage === 1 ? 'stop' : 'card');
        // The ONLY screen in this project that moves without a keypress. This
        // function stays pure and says only THAT it wants a clock; boot.js
        // owns the clock, because the deck - and so the range - is in scope
        // there and the randomness must not leak into a view builder every
        // other test in this file assumes is deterministic.
        v.autoAdvance = stage === 0;
        // A task card IS its answer. "Recite two verses from memory" is both
        // the instruction on screen and the identity validate.js dedupes on,
        // so it is written once, in `answer`, and read back here.
        v.prompt = stage >= 2
          ? (variant.kind === 'knowledge' ? variant.prompt : puzzle.answer)
          : null;
        v.answered = answered(puzzle, stage, 3, variant);
        return v;
      },
    },
```

- [ ] **Step 4: Run the tests**

Run: `node --test tests/views.test.js`
Expected: PASS.

- [ ] **Step 5: Run the whole suite**

Run: `node --test tests/`
Expected: all green.

- [ ] **Step 6: Commit**

```bash
git add core/normalize.js core/views.js tests/normalize.test.js tests/views.test.js
git commit -m "Teach views that one screen may ask to advance itself"
```

---

### Task 3: the renderer and the animation

**Files:**
- Modify: `core/paint.js` — a `card` branch in `render`
- Modify: `core/theme.css` — the ring, the STOP word, the card text
- Test: `tests/paint` coverage lives in `tests/views.test.js`; this task's check is a browser one, recorded in Task 7

**Interfaces:**
- Consumes: the view from Task 2 — `{ kind: 'card', phase, prompt, answered }`.
- Produces: DOM only. No new exports.

- [ ] **Step 1: Add the renderer branch**

In `core/paint.js`, inside `render`, add after the `text` branch:

```js
    } else if (view.kind === 'card') {
      if (view.phase === 'playing') {
        // An object going round, with no abrupt change in brightness. A dark
        // hall, a projector at full output and a room full of young people is
        // not a place to put a strobe.
        var ring = el('div', 'hp-ring');
        ring.appendChild(el('div', 'hp-orbit'));
        body.appendChild(ring);
      } else if (view.phase === 'stop') {
        body.appendChild(el('div', 'hp-stop', 'STOP'));
      } else {
        body.appendChild(el('div', 'hp-card', view.prompt));
      }
```

- [ ] **Step 2: Add the styles**

Append to `core/theme.css`:

```css
/* Hot Potato ------------------------------------------------------------- */

/* The object going round. One orbiting dot rather than a ring of pulsing
   ones: the motion reads as travel from the back of a hall, and there is no
   luminance change anywhere in the cycle. NO STROBE - see spec. */
.hp-ring { position: relative; width: 38vmin; height: 38vmin;
           border: 0.6vmin solid var(--muted); border-radius: 50%;
           margin: 0 auto; opacity: 0.55; }
.hp-orbit { position: absolute; top: 0; right: 0; bottom: 0; left: 0;
            animation: hp-spin 1.6s linear infinite; }
.hp-orbit::after { content: ''; position: absolute; top: -1.8vmin; left: 50%;
                   width: 3.4vmin; height: 3.4vmin; margin-left: -1.7vmin;
                   border-radius: 50%; background: var(--accent); }
@keyframes hp-spin { from { transform: rotate(0deg); }
                     to   { transform: rotate(360deg); } }

/* Capped on BOTH axes. Name the Place shipped a masked beat sized in vw alone
   and it clipped its last line at 16:9; a single-axis cap is how that happens.
   The pop runs ONCE and does not flash. */
.hp-stop { font-size: min(18vmin, 13vw); font-weight: 800;
           letter-spacing: 0.12em; color: var(--accent); text-align: center;
           animation: hp-pop 320ms ease-out 1; }
@keyframes hp-pop { from { transform: scale(0.82); opacity: 0; }
                    to   { transform: none; opacity: 1; } }

/* The challenge. Long enough to wrap, so this is capped on both axes too. */
.hp-card { font-size: min(9vmin, 6vw); line-height: 1.25; max-width: 86vw;
           text-align: center; text-wrap: balance; }

/* Someone who has asked their system for less movement gets the ring without
   the orbit, and the STOP word without the pop. Both still say what they mean. */
@media (prefers-reduced-motion: reduce) {
  .hp-orbit { animation: none; }
  .hp-stop { animation: none; }
}
```

- [ ] **Step 3: Run the whole suite**

Run: `node --test tests/`
Expected: all green — this task adds no tests, and must break none. `tests/pages.test.js` parses CSS-adjacent files only for the JS rules, so the CSS is not syntax-checked here; Task 7 looks at it in a browser.

- [ ] **Step 4: Commit**

```bash
git add core/paint.js core/theme.css
git commit -m "Draw the object going round, with nothing that flashes"
```

---

### Task 4: `boot.js` — the self-advancing stage

**Files:**
- Modify: `core/boot.js` — inside `play`, the `draw` function and the action wiring
- Test: `tests/boot.test.js`

**Interfaces:**
- Consumes: `view.autoAdvance` from Task 2; `BibleGames.sound.delayMs/play/stop` from Task 1.
- Produces: no new exports. Behaviour only.

- [ ] **Step 1: Write the failing test**

Append to `tests/boot.test.js`:

```js
test('a view that does not ask for a clock does not get one', () => {
  // The assertion protecting the seven games that already work. If boot ever
  // sets a timer unconditionally, every existing game starts moving on its own
  // in front of a room, and no existing test would notice.
  const src = fs.readFileSync(path.join(ROOT, 'core', 'boot.js'), 'utf8');
  assert.ok(/autoDelayMs\(view, deck\)/.test(src),
    'draw() must ask autoDelayMs whether this screen gets a clock');
});

test('every redraw cancels the pending advance and the music first', () => {
  // A timer that survives a redraw fires into a screen that has moved on, and
  // a loop that survives one plays over the next game. draw() is the single
  // point every route passes through, so the cancel belongs at its top.
  const src = fs.readFileSync(path.join(ROOT, 'core', 'boot.js'), 'utf8');
  const draw = src.slice(src.indexOf('function draw()'));
  const firstLines = draw.slice(0, draw.indexOf('BG.paint.render'));
  assert.ok(/clearAuto\(\)/.test(firstLines),
    'draw() must clear the pending timer before it renders anything');
  assert.ok(/function clearAuto\(\)[\s\S]{0,260}clearTimeout/.test(src),
    'clearAuto must actually clear the timeout');
  assert.ok(/function clearAuto\(\)[\s\S]{0,260}sound[\s\S]{0,40}stop\(\)/.test(src),
    'clearAuto must stop the music too');
});

test('leaving the game entirely stops the music', () => {
  // S tears the host down and goes back to the start screen. Without this the
  // loop plays on underneath a page that no longer has a game on it.
  const src = fs.readFileSync(path.join(ROOT, 'core', 'boot.js'), 'utf8');
  const setup = src.slice(src.indexOf('setup: function ()'));
  assert.ok(/clearAuto\(\)/.test(setup.slice(0, setup.indexOf('},'))),
    'the setup action must clear the timer and the music');
});

test('the round-done card stops the music', () => {
  const src = fs.readFileSync(path.join(ROOT, 'core', 'boot.js'), 'utf8');
  const done = src.slice(src.indexOf('function drawDone('));
  assert.ok(/clearAuto\(\)/.test(done.slice(0, done.indexOf('\n    }'))),
    'drawDone must clear the timer and the music');
});

test('a missing sound module does not stop the game advancing', () => {
  // core/sound.js is only loaded by the one page that needs it. If boot
  // reaches for it unguarded, every other game throws on its first draw.
  const src = fs.readFileSync(path.join(ROOT, 'core', 'boot.js'), 'utf8');
  const lines = src.split('\n');
  // Every call site must sit behind a guard on the same line or the line above.
  lines.forEach((line, i) => {
    if (!/BG\.sound\./.test(line)) { return; }
    const context = (lines[i - 1] || '') + line;
    assert.ok(/BG\.sound\s*(&&|\?)/.test(context) || /if\s*\(\s*BG\.sound/.test(context),
      'unguarded BG.sound at line ' + (i + 1) + ': ' + line.trim());
  });
});
```

Then add the one test here that RUNS code instead of reading it. The four
above read `boot.js` as text, because `draw` is a closure inside an unexported
function and this project has no DOM harness — they are structural tripwires
and they break on reformatting. This is the real assertion:

```js
test('the clock is armed only by a view that asks for one', () => {
  const { autoDelayMs } = globalThis.BibleGames.boot;
  // The behaviour the seven existing games depend on, stated as behaviour.
  assert.equal(autoDelayMs({ kind: 'quote' }, { musicSeconds: [6, 20] }), null);
  assert.equal(autoDelayMs({ kind: 'card', autoAdvance: false }, {}), null);
  assert.equal(autoDelayMs(null, {}), null);

  // A view that asks gets a number inside the deck's own range.
  for (let i = 0; i < 100; i += 1) {
    const ms = autoDelayMs({ kind: 'card', autoAdvance: true },
                           { musicSeconds: [6, 20] });
    assert.ok(ms >= 6000 && ms <= 20000, 'drew ' + ms);
  }

  // A deck that says nothing still gets a usable delay rather than NaN - a
  // timer that never fires is a game stopped dead in front of a room.
  const fallback = autoDelayMs({ kind: 'card', autoAdvance: true }, {});
  assert.ok(Number.isFinite(fallback) && fallback > 0);
});
```

If `tests/boot.test.js` does not already define `fs`, `path` and `ROOT`, add them at the top in the style the file already uses.

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/boot.test.js`
Expected: FAIL on all six — none of `clearAuto`, `autoDelayMs` or `BG.sound` exists yet.

- [ ] **Step 3: Write the implementation**

First, at module level in `core/boot.js` — outside `play`, beside the other
top-level helpers — add the pure decision and export it:

```js
  // Whether this screen is one that moves on its own, and for how long.
  // Pure, and deliberately OUTSIDE draw(): draw is a closure inside play()
  // that no test in this project can reach, and "only a view that asks gets
  // a clock" is the behaviour all seven existing games depend on. That is
  // worth one exported function to be able to assert by running it.
  function autoDelayMs(view, deck) {
    if (!view || !view.autoAdvance) { return null; }
    // core/sound.js is loaded by ONE page. Without it the game runs silently
    // and still advances - audio never blocks play.
    var snd = root.BibleGames && root.BibleGames.sound;
    return snd ? snd.delayMs(deck && deck.musicSeconds) : 12000;
  }
```

Add `autoDelayMs: autoDelayMs,` to the object `boot.js` attaches to
`root.BibleGames.boot`, beside `buildSession`.

Then, inside `play`, declare the handle beside `finished` and `deckEmpty`:

```js
    // The only timer in this project. It belongs to whichever screen is up,
    // and dies with it: a timer that outlives its screen fires into a room
    // that has already moved on.
    var autoTimer = null;

    function clearAuto() {
      if (autoTimer) { clearTimeout(autoTimer); autoTimer = null; }
      // Guarded because core/sound.js is loaded by ONE page. Every other game
      // would throw on its first draw if this reached for it unconditionally.
      if (BG.sound) { BG.sound.stop(); }
    }
```

Change `draw` so it clears first, keeps the view in a variable, and arms the clock afterwards:

```js
    function draw() {
      clearAuto();
      finished = false;
      var s = machine.state();

      var key = s.item.puzzle.id + '#' + s.item.puzzle.variants.indexOf(s.item.variant);
      if (!seen.has(key)) {
        seen.add(key);
        saveAsked(deckId, seen);
      }

      var view = BG.views.viewForItem(s.item, s.stage);
      BG.paint.render(host, view, session.srcFor, {
        position: s.index + 1,
        total: items.length,
        round: round,
        stage: s.stage,
        stages: s.stages,
        showBadge: session.deck.languages.length > 1,
      });

      // The one screen that moves without a keypress. The view says only THAT
      // it wants a clock; the length is drawn here, where the deck is in
      // scope, and is re-rolled every single time this runs - including when
      // ArrowLeft brings the room back to it. A driver who backs up has
      // usually done so because the round went wrong, and replaying the same
      // interval would be worse than no interval at all.
      var wait = autoDelayMs(view, deck);
      if (wait !== null) {
        if (BG.sound) { BG.sound.play(); }
        autoTimer = setTimeout(function () {
          autoTimer = null;
          if (BG.sound) { BG.sound.stop(); }
          machine.advance();
          draw();
        }, wait);
      }
    }
```

Add `clearAuto();` as the first statement of `drawDone`, and as the first statement of the `setup` action, before `hideLegend()`.

- [ ] **Step 4: Run the tests**

Run: `node --test tests/boot.test.js`
Expected: PASS.

- [ ] **Step 5: Run the whole suite**

Run: `node --test tests/`
Expected: all green. Then confirm the seven existing games are untouched: `for d in games/*/deck.js; do node tools/validate.js "$d"; done` — six `deck OK` plus the deliberate `character-names` message.

- [ ] **Step 6: Commit**

```bash
git add core/boot.js tests/boot.test.js
git commit -m "Let one screen advance itself, and make sure it dies with its screen"
```

---

### Task 5: the game runs end to end

**Files:**
- Modify: `tools/validate.js:13` — add `'card'` to `TYPES`
- Create: `games/hot-potato/index.html`
- Create: `games/hot-potato/deck.js` — six cards, enough to play
- Modify: `games.js` — the catalogue entry
- Modify: `gm.html` — load the new deck
- Modify: `tests/pages.test.js` — a card deck must load `sound.js`
- Create: `tests/hot-potato.test.js`

**Interfaces:**
- Consumes: everything from Tasks 1–4.
- Produces: a playable game at `games/hot-potato/index.html`.

- [ ] **Step 1: Write the failing tests**

Create `tests/hot-potato.test.js`:

```js
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

test('every card is a task or a knowledge card, and says which', () => {
  const wrong = [];
  deck().puzzles.forEach((p) => {
    p.variants.forEach((v) => {
      if (v.type !== 'card') { wrong.push(p.id + ': type is ' + v.type); }
      if (v.kind !== 'task' && v.kind !== 'knowledge') {
        wrong.push(p.id + ': kind is ' + JSON.stringify(v.kind));
      }
    });
  });
  assert.deepEqual(wrong, [], wrong.join('\n'));
});

test('a knowledge card asks something, and a task card does not', () => {
  // A knowledge card with no prompt paints a BLANK SCREEN in front of a room -
  // the deck is hand-written, so this is one typo away at all times.
  const wrong = [];
  deck().puzzles.forEach((p) => {
    p.variants.forEach((v) => {
      if (v.kind === 'knowledge') {
        if (!v.prompt || !String(v.prompt).trim()) {
          wrong.push(p.id + ': a knowledge card with no question');
        }
        if (!p.ref) { wrong.push(p.id + ': a knowledge card with no reference'); }
      } else if (v.prompt) {
        wrong.push(p.id + ': a task card carries a prompt; its text belongs in answer');
      }
    });
  });
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
  assert.deepEqual(validate(deck()), []);
});
```

Append to `tests/pages.test.js`:

```js
test('a page whose deck has cards loads the sound module', () => {
  // Same shape as the atlas check above, and for the same reason: plain script
  // tags, no build step to notice one missing. Without sound.js the game still
  // runs - audio never blocks play - but it runs SILENTLY, which is the whole
  // mechanic gone, and nothing else would catch it.
  const problems = [];
  let checked = 0;
  fs.readdirSync(path.join(ROOT, 'games')).forEach((slug) => {
    const page = path.join(ROOT, 'games', slug, 'index.html');
    const deck = path.join(ROOT, 'games', slug, 'deck.js');
    if (!fs.existsSync(page) || !fs.existsSync(deck)) { return; }
    if (!/type:\s*['"]card['"]/.test(fs.readFileSync(deck, 'utf8'))) { return; }
    checked += 1;
    const src = fs.readFileSync(page, 'utf8');
    const soundAt = src.search(/<script[^>]*src="\.\.\/\.\.\/core\/sound\.js"/);
    const bootAt = src.search(/<script[^>]*src="\.\.\/\.\.\/core\/boot\.js"/);
    if (soundAt === -1) { problems.push(slug + ' does not load sound.js'); }
    else if (bootAt !== -1 && soundAt > bootAt) {
      problems.push(slug + ' loads sound.js after boot.js');
    }
  });
  assert.ok(checked > 0, 'no card deck found - the test is not looking at anything');
  assert.deepEqual(problems, [], problems.join('\n'));
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `node --test tests/hot-potato.test.js tests/pages.test.js`
Expected: FAIL — no `games/hot-potato/deck.js`, and the new pages test asserts it is looking at something.

- [ ] **Step 3: Allow the type**

In `tools/validate.js:13`, change:

```js
  var TYPES = ['rebus', 'image', 'text', 'binary', 'order', 'quote', 'trail', 'map'];
```

to:

```js
  var TYPES = ['rebus', 'image', 'text', 'binary', 'order', 'quote', 'trail',
               'map', 'card'];
```

- [ ] **Step 4: Write the starter deck**

Create `games/hot-potato/deck.js`:

```js
/*
 * Hot Potato - the deck.
 *
 * HAND-WRITTEN, unlike What Came First? and Higher or Lower, which are
 * generated because their content is facts that cannot be proofread by eye.
 * These cards are writing. There is no source to derive them from.
 *
 * TWO KINDS OF CARD, and the difference is where the text lives:
 *
 *   a TASK       something to DO. The text goes in `answer`, because a task IS
 *                its own identity - and validate.js already rejects two
 *                puzzles sharing an answer, so that buys duplicate-card
 *                detection for free. No `prompt`.
 *   a KNOWLEDGE  a question in `prompt`, the answer in `answer`, the reference
 *                in `ref`. It gets a fourth screen the task cards do not have.
 *
 * THE RULE FOR A TASK CARD: it must be performable by whoever is holding the
 * mic, with nothing but a Bible and the people next to them. No props, no
 * phones, no printing. A card that cannot be done is only discovered when it
 * comes up, in front of everyone, which is the worst place to find out.
 *
 * English only for now. `languages` carries the slot, so Tagalog is a deck
 * edit later with no code change - the same as every other game here.
 */
window.DECK = {
  id: 'hot-potato',
  title: 'Hot Potato',
  idPrefix: 'hp',   // shown on the projector, so it must never hint the answer
  shuffle: true,
  sessionSize: 6,
  languages: ['en'],
  // The range the stop is drawn from, in seconds - NOT a fixed duration. Every
  // round draws a fresh number inside it, so nobody can count. Widen it if the
  // room starts sensing the floor.
  musicSeconds: [6, 20],
  howToPlay: [
    'Pass something round while the music plays.',
    'When it stops, whoever is holding it does what the screen says.',
  ],
  puzzles: [
    { id: 'hp-01', answer: 'Recite any two verses from memory',
      variants: [{ type: 'card', kind: 'task' }] },
    { id: 'hp-02', answer: 'Sing one verse of a hymn with the person on your left',
      variants: [{ type: 'card', kind: 'task' }] },
    { id: 'hp-03', answer: 'Name five of the twelve disciples',
      variants: [{ type: 'card', kind: 'task' }] },
    { id: 'hp-04', answer: 'Say a short prayer out loud for someone in this room',
      variants: [{ type: 'card', kind: 'task' }] },
    { id: 'hp-05', answer: 'Belshazzar', ref: 'Daniel 5:5',
      variants: [{ type: 'card', kind: 'knowledge',
                   prompt: 'Which king saw a hand writing on the wall?' }] },
    { id: 'hp-06', answer: 'Melita', ref: 'Acts 28:1',
      variants: [{ type: 'card', kind: 'knowledge',
                   prompt: 'On which island was Paul shipwrecked?' }] },
  ],
};
```

- [ ] **Step 5: Write the page**

Create `games/hot-potato/index.html` by copying `games/higher-or-lower/index.html` verbatim and making exactly four changes:

1. The `<title>` becomes `Hot Potato — San Fernando Adventist Church`.
2. Add `<script src="../../core/sound.js"></script>` immediately **before** the `boot.js` tag.
3. Add `'sound'` to the `needed` array in the inline guard.
4. Nothing else. The inline failure screen is the thing that keeps a black rectangle off a projector; do not reword it.

- [ ] **Step 6: List it, and give the Game Master its answers**

In `games.js`, add before the closing `];`:

```js
  {
    // The first deck here that is not used up by being played. The room
    // supplies the performance; the deck supplies only the prompt.
    title: 'Hot Potato',
    href: 'games/hot-potato/index.html',
    blurb: 'Pass something round while the music plays. It stops when it likes.',
    meta: '6 cards · English',
    status: 'ready',
  },
```

In `gm.html`, add this beside the other deck tags (they sit around lines 137-143, one per game):

```html
<script src="games/hot-potato/deck.js"></script>
```

`tests/pages.test.js:103` requires every deck to be listed there, and it is how the Game Master sees a knowledge card's answer without the projector showing it.

- [ ] **Step 7: Run everything**

Run: `node --test tests/`
Expected: all green.

Run: `node tools/validate.js games/hot-potato/deck.js`
Expected: `deck OK`

- [ ] **Step 8: Commit**

```bash
git add tools/validate.js games/hot-potato/index.html games/hot-potato/deck.js \
        games.js gm.html tests/hot-potato.test.js tests/pages.test.js
git commit -m "Make Hot Potato playable with six cards"
```

---

### Task 6: the full deck

**Files:**
- Modify: `games/hot-potato/deck.js`
- Modify: `tests/hot-potato.test.js`

**Interfaces:** unchanged from Task 5.

- [ ] **Step 1: Raise the bar the tests hold the deck to**

In `tests/hot-potato.test.js`, add:

```js
test('there are enough cards that an evening does not repeat', () => {
  const d = deck();
  const tasks = d.puzzles.filter((p) => p.variants[0].kind === 'task');
  const know = d.puzzles.filter((p) => p.variants[0].kind === 'knowledge');
  assert.ok(tasks.length >= 30, 'only ' + tasks.length + ' task cards');
  assert.ok(know.length >= 15, 'only ' + know.length + ' knowledge cards');
});

test('no two cards say the same thing', () => {
  // validate.js already rejects duplicate answers, which covers task cards
  // outright. This catches two knowledge cards asking the same question with
  // different answers - which validate cannot see.
  const asked = new Map();
  const dupes = [];
  deck().puzzles.forEach((p) => {
    p.variants.forEach((v) => {
      if (!v.prompt) { return; }
      const key = v.prompt.toLowerCase().replace(/[^a-z ]/g, '').trim();
      if (asked.has(key)) { dupes.push(p.id + ' repeats ' + asked.get(key)); }
      asked.set(key, p.id);
    });
  });
  assert.deepEqual(dupes, [], dupes.join('\n'));
});

test('a task card asks for something a person can actually finish', () => {
  // "Recite the book of Psalms" is a card that ends a round. Length is a poor
  // proxy for difficulty, but an unbounded quantity is not: a card naming a
  // number the room must reach is bounded, and one that does not is suspect.
  const unbounded = /\b(all|every|the whole|entire)\b/i;
  const wrong = [];
  deck().puzzles.filter((p) => p.variants[0].kind === 'task').forEach((p) => {
    if (unbounded.test(p.answer)) { wrong.push(p.id + ': "' + p.answer + '"'); }
  });
  assert.deepEqual(wrong, [], wrong.join('\n'));
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `node --test tests/hot-potato.test.js`
Expected: FAIL — `only 4 task cards`.

- [ ] **Step 3: Write the cards**

Bring `games/hot-potato/deck.js` to **at least 30 task cards and 15 knowledge cards**, keeping the existing six, raising `sessionSize` to `12`, and updating `meta` in `games.js` to match the real count.

Rules for the writing, all of them already enforced by tests above:

- A task must be performable with a Bible and the people next to you.
- A task must be bounded — "name five", not "name all".
- A knowledge card carries a `ref`, and its answer must be **stated** in the text, not inferred. This is the same accuracy rule as `tools/numbers.json`: if two translations disagree, the card is out.
- No card may name a person in the room, or ask anyone to perform alone in a way that would single them out uncomfortably. This is a church hall, and the mic lands on whoever it lands on — including the shyest person there.

Spread the tasks across kinds so a round varies: recite, sing, name-five, explain in one sentence, pray, act something out, ask the room a question, do something with a neighbour.

- [ ] **Step 4: Run everything**

Run: `node --test tests/` and `node tools/validate.js games/hot-potato/deck.js`
Expected: all green, `deck OK`.

- [ ] **Step 5: Commit**

```bash
git add games/hot-potato/deck.js games.js tests/hot-potato.test.js
git commit -m "Fill the deck, and hold it to rules a hall can actually meet"
```

---

### Task 7: verify it in a browser, because the tests cannot

**Files:**
- Modify: `tests/hot-potato.test.js` — record what was checked by hand
- Modify: `README.md` if it lists the games

**Interfaces:** none.

- [ ] **Step 1: Open the game and check each claim**

Open `games/hot-potato/index.html` from the filesystem — `file://`, not a server, because that is how it runs off the USB stick. At **1600×900** and **1920×1080**, confirm and record the measured result for each:

1. Music starts when the round starts, and is audible.
2. The ring turns smoothly. Nothing flashes.
3. The music stops at the same moment the STOP screen appears — not before, not after.
4. Ten consecutive rounds give ten visibly different delays. Record them.
5. The longest card in the deck fits on one screen with no clipping, at both sizes. Measure the text box's bottom against the viewport height, using `getBoundingClientRect()`.
6. ArrowLeft during the music restarts it with a *different* delay.
7. `R`, `O`, `Home` and `S` during the music all stop it dead.
8. A knowledge card shows its answer on the fourth press; a task card moves to the next round on the third.
9. With the system muted, the game still advances on time.
10. In a browser with `prefers-reduced-motion` set, the ring is still visible and STOP still legible.

- [ ] **Step 2: Record the limits honestly**

Add to the top of `tests/hot-potato.test.js`:

```js
// WHAT THESE TESTS CANNOT COVER, and what was done instead.
//
// Three claims in the spec have no headless test: that the music plays, that
// the ring reads as an object going round, and that the stop feels
// unpredictable. Node has no DOM and no audio, and this project has zero
// dependencies by design.
//
// They were checked by hand in a browser over file:// at 1600x900 and
// 1920x1080 on <DATE>. Ten consecutive delays were <RECORD THEM>. The longest
// card cleared the viewport bottom by <RECORD> px.
//
// Name the Place carries the same note about its masked beat, for the same
// reason, and that beat regressed TWICE while it looked covered. If a longer
// card is added, these measurements are taken again by hand - no test will
// notice.
```

Fill in every `<RECORD>` with a real measured number. A placeholder left here is a plan failure.

- [ ] **Step 3: Run everything one last time**

Run: `node --test tests/`
Run: `for d in games/*/deck.js; do printf "%-34s " "$d"; node tools/validate.js "$d" | tail -1; done`
Expected: all tests green; seven `deck OK` and the deliberate `character-names` message.

- [ ] **Step 4: Commit**

```bash
git add tests/hot-potato.test.js README.md
git commit -m "Record what a browser had to confirm that no test can"
```
