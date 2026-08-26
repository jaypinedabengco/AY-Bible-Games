# Who Said It? — design

A third game for AY Bible Games. A phrase spoken by someone in the Bible goes
on the projector; the room shouts who said it. One person drives with the
spacebar. No typing, no internet, no sign-in — same as the other two games.

Status: approved in chat 2026-08-27. Not yet implemented.

## Why this game is cheap to build and worth building

The engine already does staged reveal, rounds, variants, weighted draw,
difficulty ramps, shuffle, fullscreen and the key legend. The rebus type is
already a staged reveal — pictures, then the working line, then the answer.
This game is the same machine with different content, so it is a new entry in
a lookup table, not a new engine.

It is also the only one of the three games with no artwork bottleneck. Bible
Character Names is blocked on drawing pictures one at a time. This deck is
text, so it can be filled in an evening — it may well be the game that is
ready to play first.

## The mechanic

Four stages, walked with Space or a click:

```
1   "Am I my brother's keeper?"
2   "Am I my brother's keeper?"          Genesis 4:9
3   clue: he worked the ground; his brother kept sheep
4   CAIN                                 Genesis 4:9
```

The verse comes BEFORE the clue. That was a deliberate choice: the reference is
itself a hint for anyone who knows the passage, which rewards the youth who
read. See "The leak rule" for the one case where it has to be held back.

## The shape of a puzzle

The puzzle is the PERSON. Each quote they said is a VARIANT.

```js
{
  id: 'qs-07', answer: 'PETER', difficulty: 2,
  variants: [
    { type: 'quote', flag: 'unverified',
      quote: 'You are the Christ, the Son of the living God.',
      verse: 'Matthew 16:16',
      clue: 'a fisherman; Jesus called him a rock' },
    { type: 'quote', flag: 'unverified',
      quote: 'I do not know the Man!',
      verse: 'Matthew 26:72',
      clue: 'he said it three times, by a fire, before dawn',
      difficulty: 3 },
  ],
}
```

Keying variants to the person is what makes rounds work as asked: a person
cannot come up twice in one round, because rounds already key on
`id#variantIndex` and drop a puzzle with nothing fresh left. Round 2 can bring
Peter back with a line the room has not heard.

Difficulty sits on the variant, so a person's famous line can play early in a
round and their obscure one late. The puzzle-level `difficulty` is the default
for variants that do not set their own — the existing normalize behaviour, no
change.

New variant keys: `quote`, `verse`, `clue`. Puzzle-level `ref` is unused by
this deck; the verse belongs to the quote, not to the person, because Peter's
two lines are in different chapters.

## Stage count is data-driven, not fixed

The machine already asks each variant how many stages it has. So:

- quote + verse + clue     4 stages
- quote + clue, ref held   3 stages (verse appears only with the answer)
- quote + verse, no clue   3 stages
- quote only               2 stages

Nothing is special-cased in the machine, and a puzzle whose clue has not been
written yet is still playable rather than broken.

## The leak rule

Showing the verse before the clue ends the puzzle early whenever the book is
named after the speaker: Jonah 2:2, Ruth 1:16, Daniel 6:22, Job, Nehemiah,
Ezra, Esther, Joshua.

`validate.js` will ERROR when the verse's book name matches the answer, unless
that puzzle is marked to hold its reference to the reveal. The tool catches the
leak; the author cannot forget it. Same reasoning as the existing rule that
stops a puzzle id containing its own answer — the projector is in front of the
room, and a spoiler there cannot be taken back.

## Verification of the scripture text

The quotes are drafted, not transcribed, so every one ships as
`flag: 'unverified'` until a human checks it against an NKJV Bible.
Misquoting scripture aloud in church is the one error in this game that
actually matters, so it is tracked by the tools rather than by memory:

- `validate.js` prints `38 of 60 quotes still unverified`
- the GM page shows an orange `unverified` tag on that row
- the manager clears the flag with a tick as each is checked

`flag` already carries `'risky'` and `'local'`, so this is one more value, not
a new mechanism.

## Translation and permission

NKJV, chosen by the user. Thomas Nelson permits quoting up to 1,000 verses
without written permission provided they are not a complete book and not the
bulk of the work; a deck of ~100 short lines is far inside that. The required
credit line goes in the game page footer and in `CREDITS.md`:

> Scripture taken from the New King James Version®. Copyright © 1982 by
> Thomas Nelson. Used by permission. All rights reserved.

If this deck ever grew past ~1,000 verses the answer changes. It will not.

## How difficulty is assigned: fame, not theology

Difficulty here means HOW MANY PEOPLE IN THE ROOM WILL KNOW IT, not how
obscure the doctrine is. That is the instruction the deck is populated under:

- **1** — the room shouts it before the line is finished reading.
  "Let there be light." "Here am I! Send me." "Am I my brother's keeper?"
- **2** — known to anyone who has read the story, not instant.
  "You are the Christ, the Son of the living God."
- **3** — needs the clue. A minor speaker, or a famous line whose speaker is
  the surprise.

The running order then ramps ascending, so the easy ones come first and the
hard ones land at the end.

### Where the ramp applies — a point to confirm

`buildOrder` picks the round's 20 at RANDOM from everything still fresh, then
ramps THOSE 20 by difficulty. So every round warms up: easy first, hardest
last. What it does not do is spend all the easy quotes in round 1 — a famous
line can be drawn in round 3, and round 3 still opens with the easiest of what
it drew.

Recommendation: keep it. A round that is 20 hard ones in a row with no warm-up
is a worse experience than a slightly uneven spread of the famous ones, and
each round is its own arc for the room. The alternative — biasing the draw so
the evening ramps as a whole and round 1 is all difficulty 1 — is a change to
`order.js` affecting all three games, so it is out of scope here unless asked
for deliberately.

## Difficulty meter on the projector

ASSUMPTION TO CONFIRM: "difficulty meter" is read as a small visible
indicator — three dots in the corner beside the id stamp, filled to the
variant's difficulty — so the room can see whether a hard one is coming. The
deck-side difficulty field already exists and needs no work.

It is deliberately tiny and beside the existing stamp, not a banner. If it
reads as clutter on a 55" screen it can come out with one CSS rule and one
line of paint.js.

## Start screen — shared by all three games

Requested for this game and for the two name games, so it belongs in
`core/boot.js`, not in one game's page. Every game gets the same screen before
its first card.

```
        BIBLE BOOK NAMES
        San Fernando Adventist Church

        Pictures combine into the name of a book of the
        Bible. The room shouts the book. One person
        clicks to reveal.

        Puzzles this round   [ 20 v ]

        Space to start

        Space reveal · <- back · R shuffle · O deck order
        F fullscreen · Home restart · ? keys · S this screen
```

### How many — the dropdown

- Options are 5, 10, 15, 20, 25, 30 and `All (N)`, filtered to those not
  larger than the number of playable puzzles. A deck of 12 offers 5, 10 and
  `All (12)`.
- Default is the deck's own `sessionSize`, or `All` when the deck is smaller
  than that.
- The choice is remembered per game in `localStorage`, wrapped in try/catch —
  the same treatment the GM page's picture toggle already gets, because private
  windows throw on access. A programme that always runs 15 is set once.
- It applies to every round of that evening. `S` returns to this screen to
  change it; the existing `R` still gives a fresh set immediately without
  asking.

This needs one small change under the hood: `buildSession` must accept a
`sessionSize` override in its options, rather than only reading it off the
deck. `buildOrder` already takes the size as an argument, so the override just
has to be threaded through.

### How it works — text from the deck

Each deck gains a `howToPlay` field: two or three short lines in the deck's own
words. The engine renders it; it does not know what any game is about.

- Bible Book Names — "Pictures combine into the name of a book of the Bible."
- Bible Character Names — "Pictures combine into the name of a person from a
  Bible story."
- Who Said It? — "A line someone in the Bible said. The room says who said it.
  Stuck? The next click gives the verse, then a clue."

A deck with no `howToPlay` shows the screen without that block, so the field is
optional and no existing deck breaks by not having it yet.

### Two things it fixes for free

An empty or half-built deck currently fails at startup with an error card. With
a start screen it can say plainly "this deck has no puzzles yet" — which is
exactly the state Bible Character Names is in while its pictures are collected.

And the key legend gets a proper home. It stays as it is over the first card —
that was asked for deliberately and is not being removed — but the start screen
is now where a driver who has never run the game reads it without time
pressure.

### The one risk

It puts a screen between the driver and the game, in front of a room. Mitigated
by Space starting it with the remembered count already selected: for the person
who runs this every week it is one extra press of the key they are already
holding. If it still gets in the way, the screen can be skipped with a `?start`
in the URL — but that is not being built until it is asked for.

## Files

New:

- `games/who-said-it/deck.js` — the deck
- `games/who-said-it/index.html` — the projector page, copied from the book
  game's, plus the NKJV footer
- `games/who-said-it/gm.html` — the game master page
- tests for the new type, the leak rule and the GM rows

Changed for all three games — the start screen:

- `core/boot.js` — the start screen, the size dropdown, the `S` key, and a
  `sessionSize` override threaded into `buildSession`
- `core/theme.css` — start screen styles, all in vmin
- `core/normalize.js` — `howToPlay` on the deck
- `games/book-names/deck.js`, `games/character-names/deck.js` — a `howToPlay`
  line each. No other change to either deck.

Changed for this game, additively — no existing behaviour altered:

- `core/normalize.js` — `quote`, `verse`, `clue` in `VARIANT_KEYS` and
  `normalizeVariant`
- `core/views.js` — a `quote` entry in the `byType` table, with data-driven
  stages and an answered block carrying the verse
- `core/paint.js` — a `quote` branch: the quote large, the verse under it, the
  clue under that
- `core/theme.css` — `.quote`, `.verse`, `.clue-text`, `.meter`, all in vmin
- `core/gm.js` — `workingOf` returns the quote for a quote variant, so the GM
  sees which line is on screen; rows carry verse and clue
- `tools/validate.js` — `'quote'` in `TYPES`, per-type checks, the leak rule,
  the unverified count
- `games.js` — the front-page card
- `CREDITS.md` — the NKJV notice

Untouched: Bible Book Names, Bible Character Names, `core/machine.js`,
`core/order.js`, `core/boot.js`, `core/controls.js`, `core/images.js`,
`core/variants.js`.

## Game master

No new mechanism. `#qs-07` prints small on the projector; the GM opens
`games/who-said-it/gm.html` on their phone, signs in with the existing
credentials, types the id, and sees the person, every quote that puzzle might
have asked, each clue and verse, and any flags. The GM cannot know which
variant the projector drew, so all of them are listed — the same reason the
book game's GM view lists every working.

## The manager

This deck has no pictures, so the pictures tab is meaningless for it. It gets a
quotes mode: one row per person, their quotes inline and editable — quote,
verse, clue, difficulty, verified tick — plus add-a-quote and add-a-person.

Same server, same game picker, same rollback-verified write: the manager writes
`deck.js`, reloads it, checks every puzzle still has an id and an answer, and
puts the old file back if anything fails.

## Testing

`node --test tests/`, zero dependencies, seeded PRNG for determinism — as now.

- the quote view at each stage, including both 3-stage forms
- stage count derived from which fields are present
- the leak rule: errors on Jonah 2:2 under JONAH, passes when held back,
  passes on Matthew 16:16 under PETER
- the unverified count
- GM rows for a quote puzzle: every quote listed, flags carried
- an end-to-end deck validation of the shipped deck
- the size dropdown's options for a deck of 100, of 12 and of 3
- a chosen size actually limiting the round, and rounds after the first
  honouring it
- a deck of zero playable puzzles showing the start screen, not an error

## Scope

~60 people, ~100 quotes, `sessionSize: 20` — five rounds without a repeat.

Populated by parallel subagents, one per slice of scripture (Law, History,
Poetry and Prophets, Gospels, Acts to Revelation), each returning a strict
schema. No subagent output is trusted for exact wording: everything lands
flagged unverified, which is the point of the flag.

## Not doing

- multiple choice — the room shouts, same as the other games
- scoring or teams — no state to keep, and nobody wants to run a scoreboard
  from a laptop mid-programme
- audio
- a second language — English only, settled earlier for the book game and for
  the same reason: complexity the room does not see
