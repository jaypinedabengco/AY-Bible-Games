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
| No auto-shuffle | Fixed order so the host can rehearse. `R` shuffles on demand |
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
  images/                committed: public-domain and free-stock
  images-local/          gitignored: copyrighted cartoon images
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

**Controls.** `Space` / click advance · `←` back · `R` shuffle · `F` fullscreen ·
`Home` restart · `Esc` leave fullscreen. Nothing else is bound, because a
mis-key in front of a room is worse than a missing feature.

**Preload.** The next item's images are fetched during the current puzzle, so a
reveal never waits on a decode.

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
images-local/jerry.png   →   images/jerry.png   →   red placeholder card
```

Consequences, all of which we want:

- Your local copy shows the real Jerry, because `images-local/` is gitignored
  and wins the chain.
- The public repo ships a committed safe stand-in, so anyone cloning it gets a
  playable game.
- A genuinely missing file shows a loud placeholder rather than a blank card.

`.gitignore` gains `games/*/images-local/`, so the split cannot be defeated by
habit. No flags, no config, no build variants — it works on `file://` because it
is an `<img>` error handler and nothing more. Resolution is memoised per filename so
the chain is probed once, and the same resolver feeds the engine's preload.

An `img` value may also be a full URL or a `data:` URI, which is handy while
trying ideas out — but a URL means that clue needs live internet at the exact
moment it hits the screen, and breaks for good if its owner moves the file.

Specifically banned: Google Images thumbnail links
(`encrypted-tbn0.gstatic.com/images?q=tbn:...`). Those are rotating cache keys
that expire, and they are a couple of hundred pixels wide — mush on a projector.

### Sourcing

Committed images come from public-domain and free-stock sources: Doré
engravings and classical paintings for scriptural subjects, Unsplash / Pexels /
Wikimedia Commons for clue objects (a dam, a ham, palms, a gavel). Every
committed file gets a row in `CREDITS.md`: filename, source URL, author,
licence.

Copyrighted cartoon and mascot images are never committed. They go in
`images-local/`, hand-dropped. Running one on a laptop in a church hall is a
different situation from publishing it to the open web, and this split keeps
that distinction structural rather than a matter of remembering.

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
  id:        'book-names',
  title:     'Bible Book Names',
  imageDirs: ['images-local/', 'images/'],
  puzzles:   [ /* ... in play order ... */ ],
};
```

`flag` is optional on **any** puzzle type — `'risky'` for a pun that may not
land, `'local'` for one leaning on Filipino pronunciation. It is a note to
yourself; the game ignores it, and `review.html` surfaces it.

`games.js` stays as it was, because it was already right:

```js
window.GAMES = [
  { title, href, blurb, meta, status: 'ready' | 'parked' },
];
```

`status: 'parked'` renders greyed out and unclickable. Future games from the
roadmap appear parked from day one, so the front page shows where this is going.

## 11. Game 1 content

Appendix A drafts **28 candidates**; expect roughly 24 to survive the cut. The
deck grows toward 66 over later rounds. Pun rules, both inherited from puns the
previous session correctly rejected:

- **No American slang.** "Cup of joe" for Jonah was cut for this reason.
- **No outside knowledge.** Abra-the-province lost to abracadabra because the
  latter needs none.

The full draft list is Appendix A. **The puns get approved before any image is
sourced** — sourcing pictures for puns that then get cut is wasted work, and the
old handover's loudest warning was that nobody had playtested the puns.

## 12. Verification

1. `node tools/validate.js` — every puzzle has a valid `type`, required fields
   for that type, a non-empty answer, and a resolvable image name; no duplicate
   answers; `order.correct` is a permutation of `order.items`.
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
| Someone commits a copyrighted image by habit | `images-local/` is gitignored; `CREDITS.md` makes an unsourced file obvious |
| A book has no workable pun | Fall back to `image` where a direct depiction exists; otherwise leave it out of v1 |

---

## Appendix A — Game 1 draft puns

Pending approval. Confidence is my own read, not tested on anyone.

### Salvaged from the old deck

| Book | Clues | Confidence |
|---|---|---|
| RUTH | root | solid |
| DANIEL | done + yell | solid |
| SAMUEL | sum + well | solid |
| ESTHER | S + tear | solid |
| JEREMIAH | Jerry + maya | needs the private Jerry image |

### New — rebus

| Book | Clues | Confidence |
|---|---|---|
| GENESIS | gene (DNA helix) + sis (sister) | solid |
| PSALMS | palms | solid |
| ACTS | axe + S | solid |
| AMOS | A + moss | solid |
| HOSEA | hose + A | solid |
| JAMES | jam + S | solid |
| JOEL | jewel | solid |
| MICAH | mic + ah | solid |
| MALACHI | mall + A + key | solid |
| MARK | a mark / tick | solid |
| REVELATION | rev (tachometer) + elation | medium |
| HEBREWS | he + brews (coffee brewing) | medium |
| PROVERBS | pro (thumbs up) + verbs | medium |
| LUKE | look (eyes) | medium — leans on pronunciation |
| PHILIPPIANS | fill + lip | medium |
| NAHUM | nah (head shake) + hum | medium |
| LEVITICUS | Levi's jeans + tick + us | risky |
| TITUS | tie + toes | risky |

### New — direct depiction (`image`)

| Book | Image | Confidence |
|---|---|---|
| JONAH | a whale | solid |
| KINGS | a crown | solid |
| JUDGES | a gavel | solid |
| NUMBERS | numerals | solid |
| JOB | a hard hat / a worker | medium — "job" as work |

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
