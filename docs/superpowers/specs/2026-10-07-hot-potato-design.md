# Hot Potato — a game that never runs out

Every game in this project burns content. Who Said It? holds 322 quotes and
then it is finished; Name the Place holds 53. A youth group that meets weekly
exhausts a deck and the game is over for a year.

Hot Potato does not have that shape. The room supplies the performance; the
deck supplies only the prompt. "Recite two verses from memory" is as good on
its fiftieth outing as its first, because the two verses are different and the
person is different. This is the first **evergreen** game here, and it is worth
building for that reason as much as for the game itself.

## The room

Music plays and an object — a microphone, a ball, a Bible — passes along the
row. The music stops without warning. Whoever is holding it reads the challenge
off the projector and does it. Then the next round.

The app owns the music, the stop, and the card. The room owns the object, the
passing, and the judging. Nothing on screen tracks who was caught or whether
they managed it: the hall already knows both.

## Three beats per card

| Stage | Screen | What advances it |
| --- | --- | --- |
| 0 | Animation, music playing | **the app itself**, after a random delay |
| 1 | A STOP graphic, music cut dead | spacebar |
| 2 | The challenge | spacebar, into the next card |

Stage 1 exists on purpose and costs one spacebar press. Without it the card
appears at the same instant the room erupts, and nobody reads it. The pause
lets the laughing subside and the object actually change hands before anyone
has to take in a sentence.

### Stage 0 is the one new thing in this engine

Every other game in this project changes only when a person presses a key. This
is the first screen that moves on its own, and that is the whole architectural
content of this spec.

`boot.js` already reads the stage count off the view. It now also reads an
optional delay: a view may say "advance me in N milliseconds", and `boot.js`
sets a timer that calls the same `advance` the spacebar calls. **A view that
does not ask for a timer gets no timer**, so all seven existing games take the
path they take today, unchanged.

The timer must be cancelled whenever the state leaves that stage by any other
route — the spacebar, ArrowLeft, R, Home, S — or a stale timer fires into a
screen that has moved on.

The delay lives **on the view for stage 0**, drawn when that view is built.
Views are rebuilt on every render, so going back into stage 0 with ArrowLeft
draws a fresh delay and restarts the music. That is the right behaviour: a
driver who backs up has usually done so because the round went wrong, and
replaying the same interval would be worse than no interval at all.

## A round, and why it is still fresh next month

A round is `sessionSize` cards, drawn and shuffled by the existing machinery —
this game needs no new concept of a round.

What matters more for an evergreen game is already built: `boot.js` keeps an
`asked:` record in `localStorage` and prefers cards the room has not seen. A
group playing fortnightly works through the deck before anything repeats, and
the deck can be re-dealt deliberately when it should be. This is why the game
is worth putting on the existing engine rather than beside it — the hardest
part of "reuse it anytime" is already solved here.

## The random delay is deliberately not reproducible

Everywhere else in this project, randomness is seeded so a rebuild produces an
identical deck. Reproducibility is the rule because a mistyped fact is only
wrong once, on a projector, in front of a room.

Here it is the bug. "Nobody can anticipate it" is the entire mechanic, and a
seeded delay is one that a teenager who has played twice can learn. The delay
is drawn from `Math.random()`, re-rolled every round, and that is correct.

Default range: **6 to 20 seconds**, uniform. Short enough that a round does not
sag, long enough that the object gets round a circle. The deck may override it
so the range can be tuned in a hall without touching code.

## Two kinds of card

Both render identically on the projector — one large line of text.

- **Task.** "Recite two verses from memory." "Sing a hymn with the person on
  your left." "Name five things carried into the ark." No answer exists; the
  room judges.
- **Knowledge.** A question, with the answer carried to the Game Master's phone
  through the existing `gm.js` view.

### The `answer` field carries the Game Master's line

`tools/validate.js` requires every puzzle to have an `answer` and rejects two
puzzles that share one. That is not an obstacle to work around:

- A **knowledge** card sets `answer` to the real answer, exactly as every other
  game does, and the GM phone shows it.
- A **task** card sets `answer` to the task text, which is its identity.

The uniqueness rule then catches a duplicated card for free. `card` is added to
`validate.js`'s `TYPES`; nothing else about validation changes.

## Component 1 — `core/sound.js`

A short loop built from Web Audio oscillators. No audio files: nothing to
commit, nothing to carry on the USB stick, and no licensing question, since a
hymn being public domain does not make a recording of it public domain.

It is started by the spacebar that begins the round, which also satisfies the
browser's requirement that audio follow a user gesture.

**Audio must never block play.** If `AudioContext` is missing, blocked, or
throws, the game runs silently and every timer still fires. A church laptop
with muted output must still be able to play this game.

## Component 2 — the `card` renderer

A new type in `views.js`'s `byType`, with three stages. Stage 0 and 1 carry no
deck content at all — they are the animation and the STOP graphic — so the
renderer's only real work is stage 2.

## Component 3 — the animation

CSS only, in `core/theme.css`, alongside the map layers.

**No strobe, and no rapid flashing.** This is a dark hall, a bright projector
and a room full of young people. A travelling highlight around a ring reads as
"it is going round" without any abrupt luminance change, and that is the
effect wanted anyway.

## Component 4 — the deck

`games/hot-potato/deck.js`, hand-written. Not generated: the cards are writing,
not facts, and there is no source to derive them from. Compare What Came First?
and Higher or Lower, which are generated precisely because their content is
facts that cannot be proofread by eye.

English only at first. `languages` carries the slot, so Tagalog can be added
later as a deck edit with no code change, the same as every other game here.

Target: about 30 task cards and about 15 knowledge cards. The knowledge half
needs the same fact-checking as every other deck in this repository, and 15
cards that are right is worth more than 40 that are plausible.

## Testing

What can be tested in Node, with no DOM and no dependencies:

- the delay range — that it stays inside its bounds, that it varies across
  draws, and that it is **not** reproducible across runs, which is the opposite
  of what every other test in this repository asserts
- the `card` type's stage count
- the deck itself through `validate.js`, including that no two cards duplicate
- that a view without a declared delay produces no timer, which is the
  assertion protecting the seven existing games

What cannot, and will be said so plainly in the test file rather than left
looking covered:

- that the sound plays, or sounds acceptable on a hall PA
- that the animation reads as an object going round
- that the stop feels unpredictable to a human

These are verified in a browser by hand. The project has precedent: the masked
beat's size cap in Name the Place carries the same note, because text width in
a given font needs a layout engine and this project has none.

## What this deliberately does not do

- **No countdown on the performance.** The room decides when someone is done.
- **No penalty deck.** The penalty happens in the hall; it does not need the app.
- **No scoring and no teams.** This is a filler game between other things.
- **The app never picks the person.** The object does, which is the point.
