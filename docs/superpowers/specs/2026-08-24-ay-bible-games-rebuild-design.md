# AY Bible Games — rebuild design

**Date:** 2026-08-24
**Status:** approved in chat, pending spec review
**Repo:** `AY-Bible-Games` (branch `claude/handover-file-review-ff1489`)
**For:** San Fernando AY Church

---

## 1. Why we are rebuilding

The existing repo (single commit `64a218a`) contains a working rebus game about
**Bible characters**. That is not what was asked for. The original request was a
projected picture game where the room shouts an answer and one person clicks to
reveal — and the first game was meant to be about the **books of the Bible**
(Genesis, Exodus, Jeremiah, Revelation), with characters as a separate, later
game.

Two further drifts:

- **Generated pictograms instead of real images.** All artwork is flat-vector
  SVG produced by `tools/gen_clues.py` / `tools/gen_images.py`. `noah.svg` is a
  3 KB rainbow arc; `david.svg` is 2 KB. Real photographs were wanted — a real
  Tom & Jerry Jerry for the JERRY clue, not a generic mouse outline.
- **Reveal logic tangled into each game's HTML,** so a second game means
  copying and editing a page rather than adding data.

`HANDOVER.md` also documents this drifted direction as settled decisions "not to
undo", and its git-cleanup section is expired (it cites commit `4341bfd`, which
does not exist, and a `_incoming.tar.gz` problem that is already fixed).

This design starts the structure fresh while deliberately preserving the
constraints the previous attempt got right.

## 2. Goals

1. A projected, no-input game: show a puzzle, the room shouts, one key reveals.
2. **Game 1 — Bible Book Names.** Learn the books of the Bible, with the deck
   growing toward all 66 over time.
3. A reusable engine so future games are data, not projects.
4. Real photographic images, sourced legitimately, with a clean answer to the
   copyrighted-cartoon problem.
5. Runs with no internet, from a folder or a USB stick.

## 3. Non-goals

- **Bible Character Names is not built now.** It is Game 2, later.
- No scoring, no timers, no teams, no accounts, no typing.
- No deployment pipeline. GitHub Pages stays a convenience, never a requirement.
- No attempt to cover all 66 books in the first deck.

## 4. Constraints — carried over, non-negotiable

Each of these is a bug someone would otherwise hit on a Sunday morning.

| Constraint | Why |
|---|---|
| Opens by double-clicking `index.html` | Church wifi is unreliable; a reveal game has no reason to need a network |
| No `fetch()` | Blocked on `file://`. A JSON deck would work on Pages and show a blank screen from a USB stick — a bug only visible where you cannot debug it |
| No ES modules, no build step, no framework | `import` is blocked on `file://`. Plain IIFEs and `<script>` tags |
| Deck data is a `.js` global | Same reason. `deck.js` assigns `window.DECK` |
| Every asset path relative | Pages serves from `/AY-Bible-Games/`. One root-absolute path 404s only after publishing |
| Missing image → loud placeholder | You catch it at setup, not mid-service |
| Randomised by default | The deck must not feel the same twice — see §6.1. `review.html` covers rehearsal, so fixed order is no longer the price of it |
| Reveal has beats | The working line before the answer, so whoever missed the pun still learns why it worked |

Also retained: `.nojekyll`, so Pages does not try to treat the site as a blog.

## 5. Structure

```
index.html               front page — "San Fernando AY Church — AY Bible Games"
games.js                 registry; one entry per game
core/
  engine.js              staged reveal, keyboard, shuffle, fullscreen, preload
  renderers.js           rebus | image | text | binary | order
  images.js              image resolution + fallback chain
  boot.js                wires a page from its deck; game HTML stays ~10 lines
  theme.css              shared look, projector-first sizing
games/book-names/
  index.html
  deck.js                the puzzles — the only file a host edits
  images/                every clue picture — all committed
  gm.html                the Game Master view — answers on a phone (§16)
tools/
  review.html            whole deck on one screen, reads the real deck.js
  validate.js            deck sanity check, runs under node
CREDITS.md               source + licence for every committed image
README.md
HANDOVER.md
```

The previous repo's `assets/runner.js` had the right idea; the fix is that
per-game HTML no longer owns any reveal logic. `boot.js` reads the deck, picks
renderers per puzzle, and starts the engine.

### Dropped

`games/names/`, `assets/`, `tools/gen_clues.py`, `tools/gen_images.py`,
`tools/common.py`, and the 18 character pictograms are removed from the new
structure. Nothing is lost — all of it stays retrievable from commit `64a218a`.
The 10 character-based rebus puns are preserved in Appendix B for Game 2.

## 6. Engine

`core/engine.js` exposes one factory. It is the whole of the interaction model.

```js
BibleGames.createEngine({
  host:        element,                      // where to draw
  items:       array,                        // puzzles, in deck order
  stagesFor:   function (item) -> number,    // reveal steps beyond first view
  render:      function (item, stage, host), // paint one state
  preload:     function (item) -> [url],     // images for the next item
})
```

Returns `{ advance, back, next, prev, restart, shuffle, resetOrder,
toggleFullscreen, state }`. `advance` and `back` move one **stage** at a time,
crossing into the neighbouring item at the ends; `next` and `prev` skip a whole
**item**. `boot.js` supplies `stagesFor` by delegating to the matching
renderer's `stages(item)`.

**Stage model.** `stage 0` is the puzzle as first shown. Each `advance` steps to
the next stage; advancing past `stagesFor(item)` moves to the next item at stage
0. `back` walks the same path in reverse. This single counter is what lets one
engine serve every game format below.

**Controls.** `Space` / click advance · `←` back · `R` reshuffle · `O` original
order · `F` fullscreen · `Home` restart · `Esc` leave fullscreen. Nothing else
is bound, because a mis-key in front of a room is worse than a missing feature.

**Preload.** The next item's images are fetched during the current puzzle, so a
reveal never waits on a decode.

## 6.1 Randomisation

The previous build shipped a fixed order, reasoning that the host needed to
rehearse. That reasoning is superseded: `tools/review.html` shows the whole deck
on one screen, so the host rehearses the **deck** rather than an order. Which
frees the running order to be random — and it should be, or the second Sunday is
the first Sunday again.

Three separate settings, because they solve different problems:

**`shuffle: true`** (default) — the running order is randomised on load. `R`
reshuffles mid-game; `O` drops back to deck order for rehearsal.

**`sessionSize: 15`** — draw *fifteen of thirty-six* rather than reordering all
thirty-six. This is the setting that actually makes the game feel new: a
reshuffle of the whole deck is the same puzzles in a new order, whereas a subset
draw is a different game. Omit it to play the whole deck.

**`difficulty: 1 | 2 | 3`** per puzzle — because pure randomness will eventually
open the night with HABAKKUK and lose the room in the first thirty seconds. The
engine shuffles *within* difficulty bands and plays them in ascending order, so
the ramp survives randomisation: a few gentle ones, then the hard ones once the
room has warmed up. Puzzles with no `difficulty` default to 2.

**Repeat avoidance is deliberately out of scope.** Remembering which puzzles ran
last month needs persistence, and `localStorage` is unreliable under `file://` —
Chrome gives file pages an opaque origin, so it can throw or silently share
state between unrelated folders. A subset draw over 36 puzzles already makes an
identical night unlikely, and a host who wants control has `O` and the deck
file. Revisit only if repeats actually become a complaint.

## 6.2 Placement constraints

Randomisation is not enough on its own. The Ruth cameo has to land *late* — it
is a payoff, and it only pays off once the room has understood the game. Opening
with it wastes it.

So a puzzle may pin itself to a zone of the running order:

```js
{ type: 'image', answer: 'RUTH', img: 'ruth-member.jpg',
  slot: 'late', difficulty: 1 }
```

**The cameo itself is deferred** — RUTH ships as the `root` rebus for now (see
§10.1). `slot` is built, tested, and kept ready for it, so enabling the cameo
later is a deck edit and nothing more.

`slot` takes `'early'`, `'middle'`, `'late'`, or `'anywhere'` (the default).
Zones are **fractional thirds of the running order**, not fixed indices, so a
constraint written once holds whether the night runs 10 puzzles or 36.

### Two axes, and which one wins

This deliberately conflicts with §6.1. `difficulty` is a *cognitive* ramp —
don't fry the room early. `slot` is *dramatic* placement — spend the good stuff
when it counts. Ruth is difficulty 1 and slot late: easy, but saved.

**`slot` is a hard constraint; `difficulty` is a preference.** Placement runs:

1. Partition the running order into early / middle / late thirds.
2. Place every `slot`-constrained puzzle into its zone, shuffled within it.
3. Fill the remaining slots from the rest, ascending by difficulty as far as the
   free slots allow.

Step 3 is best-effort by construction — a pinned puzzle can leave the ramp
slightly uneven, and that is the right trade. The ramp is a nicety; a cameo
fired at the wrong moment is a wasted moment.

**A pinned puzzle is always drawn.** With `sessionSize: 15` over 36 puzzles, a
purely random draw would sometimes exclude Ruth entirely and the cameo would
never fire. So any puzzle with an explicit `slot` is always in the session, and
the random draw fills only the slots left over. Pinning a puzzle therefore says
two things — *always play this* and *play it here*.

If a zone is over-subscribed — more puzzles demanding `'late'` than the late
third has slots — that is a **deck error, not a runtime shrug**. The validator
catches it, because discovering it live means someone's cameo silently landed
second.

## 7. Renderers

`core/renderers.js` exports `BibleGames.renderers`, keyed by puzzle `type`. Each
renderer is `{ stages(item), render(item, stage, host) }`. Five cover every game
on the roadmap.

### `rebus` — clue pictures combine into the answer

```js
{ type: 'rebus', answer: 'JEREMIAH',
  ref: { testament: 'Old', division: 'Major Prophets', position: 24 },
  clues: [ { img: 'jerry.png', word: 'JERRY' },
           { img: 'maya.jpg',  word: 'MAYA'  } ],
  flag: 'risky' }        // optional note to self; the game ignores it
```

`stages: 2` — 0: pictures only · 1: the working, `JERRY + MAYA` · 2: the answer
and its reference.

### `image` — one picture, direct depiction

```js
{ type: 'image', answer: 'JONAH', img: 'whale.jpg', ref: {...} }
```

`stages: 1` — 0: picture · 1: answer.

**Use `image` when a working line would add nothing** — either a direct
depiction (a whale for Jonah, a crown for Kings), or a clue whose word already
*is* the answer (numerals for Numbers). Where the clue word differs from the
answer, stay a single-clue `rebus` even with one picture, so the working line
still teaches the joke: palms → `PALMS` → **PSALMS**.

### `text` — finish the verse / who said it

```js
{ type: 'text', prompt: 'For God so loved the world, that he gave his only ___',
  answer: 'begotten Son', ref: 'John 3:16' }
```

`stages: 1`.

### `binary` — A-or-B sorting

```js
{ type: 'binary', prompt: 'HABAKKUK', options: ['Old', 'New'], answer: 'Old' }
```

`stages: 1` — 0: item plus both labels · 1: correct label highlighted.

### `order` — arrange into sequence

```js
{ type: 'order', items: ['Mark','Matthew','Luke','John'],
  correct: ['Matthew','Mark','Luke','John'] }
```

`stages: 1`.

## 8. Images

### Fallback chain

`core/images.js` resolves each `img` value against the deck's `imageDirs`, in
order, and falls through on load failure:

```
images/jerry.png   →   red placeholder card
```

**Every picture is committed.** `imageDirs` stays an ordered array because the
resolver is generic, but the shipped deck lists one directory. A file that is
not there resolves to null and the card shows a loud placeholder — always, with
no exceptions, because the site is published and a puzzle that silently vanishes
online is harder to notice than one that shouts.

Resolution is memoised per filename, so the chain is probed once and the same
resolver feeds the engine's preload. It works on `file://` because it is an
`<img>` error handler and nothing more.

An `img` value may also be a full URL or a `data:` URI, which is handy while
trying ideas out — but a URL means that clue needs live internet at the exact
moment it hits the screen, and breaks for good if its owner moves the file.

Specifically banned: Google Images thumbnail links
(`encrypted-tbn0.gstatic.com/images?q=tbn:...`). Those are rotating cache keys
that expire, and they are a couple of hundred pixels wide — mush on a projector.

### 8.1 Publishing, and why there is no private image tier

An earlier draft of this spec had a `localOnly` flag: a puzzle whose picture
lived in a gitignored `images-local/` and which dropped out of the deck when the
picture was absent. It existed so a church-member cameo and a copyrighted
cartoon could play in the hall without being committed.

**That is withdrawn.** The site is published to GitHub Pages, and Pages deploys
what is in the repo — so a gitignored image is simply absent from the published
game. Two versions of the deck, differing by which files a laptop happened to
have, is a worse thing to reason about than one. Every picture is committed, and
the deck is the same everywhere.

Two consequences worth stating plainly:

- **Git history is permanent.** Committing a picture to a public repo and
  deleting it later does not remove it. "Commit now, tidy up later" is not
  available.
- **A photograph of a private individual on a public URL is a different ask
  from the same photograph on a projector in their own church** — indexable,
  permanent, outside their control. If the RUTH cameo is ever enabled, that is
  the question to put to her, and it is a larger one than it first looks.

The cameo trick still generalises, and book names that double as ordinary first
names are **Esther, Daniel, Samuel, Mark, John, James, Job, Timothy, Titus** —
any member willing to be on screen is a puzzle no other church can copy. It is
deferred, not abandoned: see §10.1 for what is already in place for it.

### Sourcing

Committed images come from public-domain and free-stock sources: Doré
engravings and classical paintings for scriptural subjects, Unsplash / Pexels /
Wikimedia Commons for clue objects (a dam, a ham, palms, a gavel). Every
committed file gets a row in `CREDITS.md`: filename, source URL, author,
licence.

Two files are supplied by hand rather than sourced here, and they are the two
this spec will not fetch: `jerry.png`, because it is Warner Bros' character and
this repo publishes to a public URL, and `ruth-member.jpg` if the cameo is ever
enabled, because it is a real person's face. Both go in `images/` like any other
picture — there is no separate tier any more — and both are Jay's to add and
commit deliberately. Until `jerry.png` is added, JEREMIAH shows a red
placeholder on its first clue, which is the behaviour we want: visible.

## 9. The scripture reference

The old deck printed `ref: 'Daniel 6'` under DANIEL, which hands the answer
over. For a book-names game the reference teaches canon placement instead:

> **JEREMIAH** · Old Testament · Major Prophets · book 24 of 66

`ref` accepts either the structured form
`{ testament, division, position }` or a plain string, so non-book games
(`text`, `binary`) can cite a verse directly.

## 10. Deck format

```js
window.DECK = {
  id:          'book-names',
  title:       'Bible Book Names',
  idPrefix:    'bn',   // puzzle ids are <idPrefix>-NN, shown on the projector
  imageDirs:   ['images/'],
  shuffle:     true,   // randomise running order on load
  sessionSize: 15,     // draw this many; omit to play the whole deck
  puzzles:     [ /* ... in deck order; `O` restores it ... */ ],
};
```

`flag` is optional on **any** puzzle type — `'risky'` for a pun that may not
land, `'local'` for one leaning on Filipino pronunciation or a local product.
It is a note to yourself; the game ignores it, and `review.html` surfaces it.


`games.js` stays as it was, because it was already right:

```js
window.GAMES = [
  { title, href, blurb, meta, status: 'ready' | 'parked' },
];
```

`status: 'parked'` renders greyed out and unclickable. Future games from the
roadmap appear parked from day one, so the front page shows where this is going.

## 10.1 Variants — more than one picture per answer

Sometimes RUTH should be the member photo and sometimes the `root` rebus. Not as
two puzzles — the answer is the same, and two puzzles with one answer is the
duplicate the validator exists to catch. As **one puzzle with two variants**, and
the engine picks one per session:

```js
{
  answer: 'RUTH', answerAlt: 'Ruth', slot: 'late',
  ref: { testament: 'Old', division: 'Historical', position: 8 },
  variants: [
    { type: 'image', img: 'ruth-member.jpg', weight: 2 },
    { type: 'rebus', clues: [{ img: 'root.jpg', word: 'ROOT' }] },
  ],
}
```

**Not shipped yet.** RUTH ships as the single-variant `root` rebus; the block
above is what enabling the cameo looks like, and `deck.js` carries it as a
comment beside the puzzle so nobody has to come back here for it. The mechanism
below is built and unit-tested regardless — that is what "prepared" means.

**The model, stated once:** every puzzle has one or more variants. A puzzle
written without a `variants` array *is* a puzzle with exactly one — so every
deck entry elsewhere in this document stays valid, and there is only one code
path.

What lives where: `answer`, `answerAlt`, `ref`, `slot`, and `lang` belong to the
**puzzle**, because they describe the thing being guessed. `type`, `clues`,
`img`, `flag`, and optionally `difficulty` belong to the **variant**, because
they describe how it is asked this time.

### Selection

1. Drop variants whose images do not resolve, so a puzzle with a working
   alternative uses it rather than showing a placeholder.
2. If **no** variant resolves, keep the first one anyway and let it render its
   placeholder. Dropping the puzzle would hide a missing file, and with no
   private tier there is no longer any case where an absent picture is
   intentional.
3. Pick one of the survivors at random. `weight` biases the draw; default 1, so
   `weight: 2` on a cameo would make it twice as likely as the root.

`difficulty` falls back to the puzzle's, then to 2 — a member's face is an
easier puzzle than a root, and a variant may say so.

### Why this matters beyond Ruth

This is the strongest answer to *"the game shouldn't feel the same"* — stronger
than reshuffling, and stronger than a subset draw. Those change the **order** and
the **selection**; variants change the **puzzle itself**. A room that has seen
ADAM as `A + dam` twice can meet it as an atom diagram the third time and have to
think again.

For now only RUTH gets variants. The mechanism is deck data, so adding a second
picture to any puzzle later needs no code.

`tools/review.html` shows every variant of every puzzle, not just the one a
given session happened to draw.

## 11. Game 1 content

Appendix A drafts **36 candidates** across both testaments; expect roughly 30 to
survive the cut. The deck grows toward 66 over later rounds. Pun rules, both
inherited from puns the previous session correctly rejected:

- **No American slang.** "Cup of joe" for Jonah was cut for this reason.
- **No outside knowledge.** Abra-the-province lost to abracadabra because the
  latter needs none.

The full draft list is Appendix A. **The puns get approved before any image is
sourced** — sourcing pictures for puns that then get cut is wasted work, and the
old handover's loudest warning was that nobody had playtested the puns.

## 11.1 Filipino book names

The books have Tagalog names — Exodo, Mga Awit, Santiago, Apocalipsis — and
putting them in the deck adds variety, adds challenge, and teaches something a
purely English deck cannot. Three ways they enter, in increasing ambition.

### The reveal always shows both

`answerAlt` carries the other language's name and appears on the answer card
regardless of which language was asked:

> **JAMES** · *Santiago*
> New Testament · General Epistles · book 59 of 66

Free teaching value on every puzzle in the deck, no new artwork, no new puzzle.

### Filipino-answer puzzles

A puzzle may set `lang: 'fil'`, making the Tagalog name the answer and the pun a
Tagalog pun. This is where the challenge comes from.

**A hard requirement: the puzzle must say which language it wants.** A crown on
screen is KINGS in English and HARI in Filipino, and a room shouting the right
answer to the wrong question is a bug we would have designed in. Every card
carries a visible language badge, and the renderer takes it from `lang` rather
than trusting the host to remember.

### The artwork is already paid for

Most direct-image puzzles work in both languages from **one file**: a crown is
KINGS and HARI, numerals are NUMBERS and BILANG, a gavel is JUDGES and HUKOM, a
music note is PSALMS and AWIT, a whale is JONAH and JONAS. One image, two
puzzles, two languages, zero extra sourcing.

Three Tagalog puns also reuse existing clue art outright: APOCALIPSIS takes
`lips` and `sis`, FILEMON is spelled the Tagalog way already so `fill + lemon`
serves both, and OSEAS extends `hose`.

### Two problems this fixes

- **TITUS → TITO.** `tie + toes` was flagged risky and barely got there. *Tito*
  is Filipino for uncle — a photo of an uncle, and the room has it instantly.
  The Tagalog puzzle is simply better than the English one it replaces.
- **REVELATION → APOCALIPSIS.** Held undecided because `rev + elation` was a
  stretch. *A + polka + lips + sis* reads cleanly and reuses two existing clue
  images.

### Deck configuration

```js
window.DECK = {
  languages:   ['en', 'fil'],  // which puzzles are eligible for a session
  ...
};
```

Omitting `languages` plays English only, so a Tagalog-light congregation is one
edit away. Language is **independent of `difficulty`** — a Filipino puzzle is
not automatically harder, and each is banded on its own merits.

## 12. Verification

1. `node tools/validate.js` — every puzzle has a valid `type`, required fields
   for that type, a non-empty answer, and a resolvable image name; no duplicate
   answers; `order.correct` is a permutation of `order.items`. `difficulty` must
   be 1, 2 or 3 where present; `sessionSize` must not exceed the number of
   playable puzzles; and no `slot` zone may be over-subscribed at the configured
   `sessionSize` — checked against the smallest session the deck permits, not
   just the configured one. Every **variant** is checked for the fields its own
   `type` requires. Every puzzle needs a unique `id`, and an id that contains
   its own answer is an **error** — the id is displayed on a projector in front
   of the room, so `ruth-08` would hand the answer over (§16). Run with
   `--files <dir>` it also lists pictures the deck names that are not yet in the
   directory, which is the image-sourcing worklist.
2. `tools/review.html` — the whole deck with artwork on one screen, reading the
   real `deck.js`, so it cannot drift from the game.
3. Headless render pass at 1280×760 and 390×700, over both `file://` and
   `http://`, asserting no console errors and no failed image loads.
4. **A dry run on the actual projector and laptop.** The previous build never
   had one. This is a release gate, not a nicety.
5. **Playtest the puns on two or three people.** A pun that does not land dies
   in silence, and this remains the single riskiest thing in the project.

## 13. Milestones

1. **Spec approved** (this document).
2. **Puns drafted and approved** — Appendix A reviewed, cuts made.
3. **Engine + renderers + `validate.js`**, exercised by a fixture deck.
4. **Images sourced and credited** for the approved puns.
5. **Game 1 assembled**, front page and branding, review page.
6. **Verification** — validator, headless pass, then projector dry run.
7. **Docs rewritten** — `README.md` for the host, `HANDOVER.md` reduced to
   current state plus decision history, with the expired git section gone.

## 14. Future games

Every one of these is "show a prompt, reveal in stages" and needs no new
engine — only a deck and, at most, one of the five existing renderers.

| Game | Renderer | Teaches |
|---|---|---|
| Old or New? | `binary` | Canon split; strong warm-up |
| Finish the Verse | `text` | Memorisation |
| Who Said It? | `text` | Scripture and attribution |
| Books in Order | `order` | Canon order |
| Three Clues | `rebus` | Stories, with a built-in difficulty ramp |
| Bible Numbers | `text` | Recall hooks (40, 12, 7) |
| Where in the Bible? | `text` | Books plus content |
| Bible Character Names | `image` | People — Game 2 |
| Odd One Out | `binary` | Grouping |
| Bible Places | `image` | Geography |

The same formats extend to Adventist heritage and the 28 fundamental beliefs if
AY nights want that track; not in scope here.

## 15. Risks

| Risk | Mitigation |
|---|---|
| Puns do not land | Approve the list before art; playtest before a service |
| Image sourcing is slower than expected | Puns approved first, so sourcing is never speculative |
| Free-stock photos are visually inconsistent | Prefer one source per clue category; crop to a common frame in the renderer |
| A copyrighted image is committed without thought | `CREDITS.md` needs a row per file, so an unsourced picture is visible; the two hand-supplied files are named in §8 |
| A book has no workable pun | Fall back to `image` where a direct depiction exists; otherwise leave it out of v1 |

---

## 16. The Game Master view

Added after the rebuild began. The room sees the projector; the person running
the game needs to see the answers, on their own phone, on the same site.

### Stable IDs, not a shared session

An earlier draft of this section had the projector mint a session code that
seeded every random decision, so the GM's phone could reproduce the identical
running order. **That is withdrawn.** It solved the wrong problem — it tried to
synchronise two devices when nothing needs synchronising.

Every puzzle instead carries a short **`id` that never changes**: `bn-07`. The
projector shows it small and dim in a corner. The randomiser reorders puzzles as
freely as it likes; the id on screen still names exactly one of them, so the GM
never needs to know the running order.

What that buys, measured against the withdrawn design:

- No seeded PRNG shared across devices, and no requirement that two browsers
  reproduce a shuffle byte-identically.
- **Pressing `R` costs nothing.** Reshuffle all night — ids do not move. The
  withdrawn design went stale the instant anyone reshuffled, and needed a
  written warning about it.
- The GM can join halfway through, close the tab, or arrive late.
- One less module, and `core/rng.js` never has to exist.

### The id must not leak the answer

The id is on a projector in front of the room, so `ruth-08` would hand the
answer to anyone looking. Ids stay opaque — a deck prefix and a number — and
the validator (§12) **rejects any id that contains its own answer**,
case-insensitively, so nobody opens that hole by accident in six months.

Ids are stable, not positional: they are authored once and never renumbered.
Inserting a puzzle means giving it the next unused id, not resequencing the
deck. The validator enforces uniqueness, not contiguity.

### What the GM sees

The whole deck, sorted by id, each row carrying: the id, the answer, the
`answerAlt` Filipino name, the canon reference, the clue working
(`JERRY + MAYA`), the language being asked, and any `flag` — so the GM knows
which puns are risky and can feed the room a hint before one dies in silence.

A filter box at the top jumps to an id. Typing is optional: three characters
finds the row, or the GM simply scans for it. Nothing has to be typed per
question, which matters when the alternative is fumbling a phone mid-service.

### The access code

Site-wide, in `gm-config.js`, gated by nothing more than knowing it. The threat
model is a curious teenager with a phone, not an adversary.

It is stored as a **non-cryptographic hash**, not the literal string. Not
because that is secure — it is not, and this document will not pretend
otherwise — but because this repo is public, and a plain-text code sitting in it
is discoverable by anyone who thinks to look, which defeats the only purpose the
code has. A hash makes casual discovery meaningfully harder at identical cost.

Once entered it is remembered in `sessionStorage`, so the GM does not retype it
moving between screens.

### Structure

```
gm-config.js                 the access-code hash, site-wide
games/book-names/gm.html     the GM view for this deck
```

Two files. The withdrawn design needed four, plus a change to every test that
imported the PRNG.

## Appendix A — Game 1 draft puns

Confidence is my own read, not tested on anyone. **Status** tracks review:
`in` = kept, `proposed` = awaiting a decision, `cut` = removed.

### Salvaged from the old deck

| Book | Clues | Confidence | Status |
|---|---|---|---|
| RUTH | root — cameo variant prepared but not shipped (§10.1) | solid | in |
| DANIEL | done + yell | solid | in |
| SAMUEL | sum + well | solid | in |
| ESTHER | S + tear | solid | in |
| JEREMIAH | Jerry + maya | `jerry.png` supplied by hand (§8) | in |

### Old Testament — rebus

| Book | Clues | Confidence | Status |
|---|---|---|---|
| GENESIS | gene (DNA helix) + sis (sister) | solid | in |
| EXODUS | XO coffee candy + dos (2) | solid, flag `local` | in |
| PSALMS | palms | solid | in |
| AMOS | A + moss | solid | in |
| HOSEA | hose + A | solid | in |
| JOEL | jewel | solid | in |
| MICAH | mic + ah | solid | in |
| MALACHI | mall + A + key | solid | in |
| ISAIAH | eye + sigh + ah | solid | proposed |
| NEHEMIAH | knee + he + maya | solid | proposed |
| HAGGAI | hug + guy | solid | proposed |
| SONG OF SOLOMON | music note + solo + moon | solid | proposed |
| PROVERBS | pro (thumbs up) + verbs | medium | in |
| HABAKKUK | ha (laughing) + back + cook | medium | proposed |
| LEVITICUS | Levi's jeans + tick + us | risky | in — easy cut |

### New Testament — rebus

| Book | Clues | Confidence | Status |
|---|---|---|---|
| ACTS | axe + S | solid | in |
| JAMES | jam + S | solid | in |
| MARK | a mark / tick | solid | in |
| MATTHEW | mat + chew | solid | proposed |
| PHILEMON | fill + lemon | solid | proposed |
| PETER | pea + tear | solid | proposed |
| HEBREWS | he + brews (coffee brewing) | medium | in |
| LUKE | look (eyes) | medium — leans on pronunciation | in |
| TIMOTHY | clock (time) + moth | medium | proposed |
| TITUS | tie + toes | risky | **cut** — superseded by TITO |

### Direct pictures, no pun (`image`)

| Book | Image | Confidence | Status |
|---|---|---|---|
| JONAH | a whale | solid | in |
| KINGS | a crown | solid | in |
| JUDGES | a gavel | solid | in |
| NUMBERS | numerals | solid | in |
| ROMANS | a Roman soldier | solid | proposed |
| JOB | a hard hat / a worker | medium — "job" as work | in |

### Filipino-answer candidates (`lang: 'fil'`)

Rebus, reusing existing clue art where noted.

| Book | Clues | Reuses | Confidence | Status |
|---|---|---|---|---|
| APOCALIPSIS | A + polka (dots) + lips + sis | `lips`, `sis` | solid | proposed |
| JUAN | the numeral 1 (*juan* ≈ *one*) | — | solid | proposed |
| EXODO | XO candy + do (musical note) | `xo` | solid | proposed |
| FILEMON | fill + lemon (same spelling) | `fill`, `lemon` | solid | proposed |
| OSEAS | hose + A + S | `hose` | medium | proposed |
| MIKAS | mic + as | `mic` | medium | proposed |
| JEREMIAS | Jerry + maya + S | `jerry`, `maya` | medium | proposed |
| HEBREO | he + brews + O | `he`, `brews` | medium | proposed |

Direct pictures — **each shares its image file with the English puzzle**.

| Book | Image | Shares with | Confidence | Status |
|---|---|---|---|---|
| TITO | a photo of an uncle | — | solid | proposed |
| HARI | a crown | KINGS | solid | proposed |
| BILANG | numerals | NUMBERS | solid | proposed |
| HUKOM | a gavel | JUDGES | solid | proposed |
| AWIT | a music note | — | solid | proposed |
| JONAS | a whale | JONAH | solid | proposed |
| GAWA | hands at work | — | medium | proposed |
| PANAGHOY | someone weeping | — | medium | proposed |

Deliberately not attempted: DEUTERONOMIO, ECLESIASTES, KAWIKAAN, and the
Tagalog epistle names (Efeso, Colosas, Galacia) — no clean pun, no iconic
image. Left out rather than forced.

### Cut on review

| Book | Clues | Why |
|---|---|---|
| PHILIPPIANS | fill + lip | cut |
| NAHUM | nah (head shake) + hum | cut |

### Undecided

| Book | Clues | Note |
|---|---|---|
| REVELATION | rev (tachometer) + elation | **Resolved** — superseded by APOCALIPSIS (A + polka + lips + sis), which reads better and reuses existing art. |

**Asset reuse worth noting.** NEHEMIAH reuses `maya` from JEREMIAH, and
SONG OF SOLOMON reuses `solo` + `moon` from the parked SOLOMON puzzle in
Appendix B. Three books, no new sourcing.

**Held, not dead: PHILIPPIANS.** `fill + lip` is weak, but there is a much
stronger local option — a Philippine flag, since PHILIPPIANS and PHILIPPINES
differ by a single letter. Out of the deck for now; worth revisiting before v1
ships.

## Appendix B — character puns held for Game 2

Preserved so they are not lost with the old structure. Also in commit `64a218a`.

ADAM (A + dam) · ISAAC (eye + sack) · SIMON (sea + moon) ·
SOLOMON (solo + moon) · PHILIP (fill + lips) · ANDREW (& + drew) ·
DAVID (calendar + camcorder — flagged risky, both clues soft) ·
THOMAS (toe + mass) · ABRAHAM (abra + ham) · BARNABAS (barn + A + bus)

Rejected outright, do not re-propose: Jonah as cup-of-"joe" + "nah" (American
slang); Abraham via Abra the province (needs geography); Gideon as signpost
("guide") + ON switch (a signpost reads "sign", not "guide"); Samuel as
sum + Yule tree (sum + well is better).
