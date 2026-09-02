# Games we have not built yet

Four proposals, written down while they were fresh so nobody has to reconstruct
the reasoning later. None of these is approved or scheduled; each is a starting
point for the brainstorming conversation, not the end of one.

They are here because the engine makes a new game cheap. A game is a deck plus
one entry in `games.js`. What varies is whether it needs a new *renderer* — and
three of the four do not, because `binary`, `order` and `text` were built and
tested during the rebuild and have never been used.

---

## What the engine already gives you

Before proposing anything, this is what a new game inherits for free:

- **Rounds.** The deck is walked through without repeats, 20 at a time, and what
  has been asked persists between sessions.
- **A start screen** that names the game, explains it in the deck's own words,
  and asks for the round length — and the language, where the deck has more
  than one.
- **The Game Master page.** Every deck loaded, answers looked up by the id
  printed on the projector, no configuration.
- **The deck manager.** `node tools/manage.js` edits decks without touching
  code.
- **Difficulty ramping.** Each round opens easy and ends hard.
- **Two languages**, if the deck carries them.

The renderers are in `core/views.js`. `rebus`, `image` and `quote` are in use.
`binary`, `order` and `text` are built, tested and idle.

---

## The four rules a deck has to obey

Learned the hard way on the three games that exist. They apply to every proposal
below, and any new drafting brief should quote them.

1. **The answer must be a NAME.** A room shouts "CAIAPHAS". It does not shout
   "the nobleman whose son was dying". Fourteen drafted quotes were thrown away
   over this.
2. **Difficulty measures how fast the room gets there** — not how famous the
   verse is, not how weighty the theology. A famous line with an obvious speaker
   is EASY.
3. **A clue is one image, not a biography.** Three stacked facts do the room's
   thinking for it.
4. **Nothing shown before the answer may contain the answer.** The id, the clue,
   the reference. This is the only rule with no exceptions, and it should be
   enforced by `validate.js` rather than by whoever writes the deck.

---

## 1. Before or After

**The idea.** Two people, two events, or one of each. Which came first?

Chronology is the thing a room is haziest about. Most people hold the whole Old
Testament as a single undifferentiated era, and this is the cheapest way to
show them otherwise.

**On screen**

```
1   Did ABRAHAM live before or after MOSES?

        [ BEFORE ]        [ AFTER ]

2   BEFORE
    Abraham   c. 2000 BC
    Moses     c. 1400 BC
    about six hundred years between them
```

**Renderer:** `binary`, already built and tested. The reveal marks the correct
option; the line underneath is the puzzle's `ref`.

**Deck shape**

```js
{
  id: 'ba-01', answer: 'BEFORE', difficulty: 2,
  ref: 'Abraham c. 2000 BC · Moses c. 1400 BC · about 600 years apart',
  type: 'binary',
  prompt: 'Did ABRAHAM live before or after MOSES?',
  options: ['BEFORE', 'AFTER'],
}
```

**Content.** Free — no pictures, no scripture text. A list of roughly forty
figures with approximate dates covers hundreds of pairings.

**Difficulty.** Controlled entirely by how close together the two are. Adam and
Paul is trivial; Daniel and Jonah is not; Obadiah and Joel would defeat most
scholars and should be left out.

**Risk.** Dates in the Old Testament are contested, and a confident wrong answer
on a projector is worse than no game. Stick to pairings where the ordering is
not disputed, and say "about" on every date. Anything where the scholarship
genuinely disagrees does not belong in a youth game.

**Effort.** Small. Renderer exists; it is deck-writing plus a `ref` line.

---

## 2. Higher or Lower

**The idea.** A number from scripture, then a second one to bet on.

This is the only proposal with a gambling shape — the room commits before it
knows — and that is a different feeling from the games we have, all of which
reward recall.

**On screen**

```
1   Methuselah lived 969 years.
    Did NOAH live longer or shorter?

        [ LONGER ]        [ SHORTER ]

2   SHORTER
    Noah lived 950 years — nineteen short of the record
```

**Renderer:** `binary`.

**Deck shape**

```js
{
  id: 'hl-01', answer: 'SHORTER', difficulty: 1,
  ref: 'Noah lived 950 years, nineteen short of the record',
  type: 'binary',
  prompt: 'Methuselah lived 969 years. Did NOAH live longer or shorter?',
  options: ['LONGER', 'SHORTER'],
}
```

**Content.** Free. Ages, reign lengths, army sizes, the number of days, the
number of people fed, distances, weights of gold. Numbers are among the easiest
things to source accurately, because they are stated plainly in the text.

**Difficulty.** The gap between the two numbers. 969 against 950 is a coin flip
and delightful; 969 against 120 is nothing.

**Risk.** It runs out faster than it looks — there are only so many memorable
numbers. Better as a short filler at the end of a programme than as a main
game, and the deck should be honest about that: fifty puzzles, not two hundred.

**Effort.** Small.

---

## 3. Who Did It?

**The idea.** The sibling of Who Said It?, with an **action** instead of a
quote.

The reason to have both: actions are *visual*. A young person who does not read
much can picture someone climbing a tree or hiding spies on a roof, where a
quotation gives them nothing to hold. It widens who can play, which is the whole
argument for it — otherwise it is the same game twice.

**On screen**

```
1   Cut off a soldier's ear

2   John 18:10

3   he did it in a garden, at night, without being asked

4   PETER
    PEDRO
    John 18:10
```

**Renderer:** `quote` unchanged — the four beats and the two-language handling
are identical. The deck's `quote` field holds the action instead of a line of
speech. If that reads badly in `deck.js`, rename the field to `did` and add a
`deed` type that is otherwise a copy; the cost is one entry in the `byType`
table.

**Deck shape**

```js
{
  id: 'wd-01', answer: 'PETER', difficulty: 1,
  variants: [
    { type: 'quote', flag: 'unverified',
      quote: 'Cut off a soldier’s ear',
      verse: 'John 18:10',
      clue: 'he did it in a garden, at night, without being asked' },
    { type: 'quote', lang: 'fil', answer: 'PEDRO', flag: 'unverified',
      quote: 'Tinaga ang tainga ng isang kawal',
      verse: 'Juan 18:10',
      clue: 'ginawa niya ito sa halamanan, gabi, at walang nag-utos' },
  ],
}
```

**Content.** Free, and **easier than Who Said It? in one important way**: the
action is written in our own words, so there is no scripture text to verify and
no translation to source. The Tagalog is a translation of our sentence, not of
the Bible. The whole `unverified` apparatus is unnecessary here.

**Difficulty.** How distinctive the deed is. "Climbed a tree" is instant.
"Bought a field" is not.

**Risk.** Feeling like a reskin. Guard against it by choosing deeds that are
*hard to say in words* — the ear, the tree, the roof opened over a paralytic,
the fleece laid out twice. If a deed's best description is a quote, it belongs
in the other game.

**Effort.** Small to medium — no renderer work if the `quote` type is reused.

---

## 4. The Object Trail

**The idea.** Three objects, revealed one at a time, getting easier.

```
1   a coat

2   a coat  ·  a pit

3   a coat  ·  a pit  ·  a cup

4   JOSEPH
```

Objects are how people actually remember stories. The trail also builds tension
in a way a single clue cannot: the room starts guessing at the first object and
argues its way down.

**This is the one that wants pictures.** Every other proposal here is
deliberately text-only, because artwork is what has kept Bible Character Names
parked with an empty deck. This one is different: a coat, a pit and a cup are
concrete, drawable, and — unlike a rebus — they do not have to be a *pun*, which
was what made the book-game artwork so hard. Any clear picture of a cup works.

The sensible path is text first, pictures later, in the same deck: start with
`items` as words, and once the pictures exist, the same puzzle grows an `img`
per object without the deck being rewritten.

**Renderer:** new, but small. Closest to `order` — a list revealed piece by
piece. Roughly:

```js
trail: {
  stages: function (variant) { return variant.items.length; },
  view: function (puzzle, variant, stage) {
    var v = base('trail', puzzle);
    v.items = variant.items.slice(0, Math.min(stage + 1, variant.items.length));
    v.answered = answered(puzzle, stage, variant.items.length);
    return v;
  },
}
```

**Deck shape**

```js
{
  id: 'ot-01', answer: 'JOSEPH', difficulty: 1,
  ref: 'Genesis 37–45',
  type: 'trail',
  // hardest first: the room should not get it on object one
  items: ['a coat', 'a pit', 'a cup'],
}
```

and later, when the artwork exists:

```js
  items: [
    { word: 'a coat', img: 'coat.png' },
    { word: 'a pit',  img: 'pit.png' },
    { word: 'a cup',  img: 'cup.png' },
  ],
```

**Content.** Free in its text form.

**Difficulty.** Entirely in the ORDER of the objects. The first must be the
least distinctive. A trail that opens with "a coat of many colours" is over
before it starts.

**Risk.** Objects that belong to several stories — a staff, a stone, a well —
produce arguments where the room is right and the deck is wrong. Each trail
needs checking as a whole, not object by object.

**Effort.** Medium. One new renderer, one paint branch, some CSS, and a deck.
The picture version is a later, separate piece of work.

---

## Where these came from, and what was set aside

**Old or New?** was on the front page as planned and has been removed. For most
of the 66 books it is a coin flip the room wins instantly; only the awkward
corners are hard, and that is not enough to carry a game. The salvage of the
idea is *which division is it in* — Law, History, Poetry, Major Prophets, Minor
Prophets, Gospels, Epistles. Placing Habakkuk is genuinely hard, and it teaches
the shape of the Bible rather than a fact about it. It needs more than two
options, so it is not free; the division data is already in `tools/manage.js`.

**Odd One Out** — four names, one does not belong, and the *reason* is the
puzzle. Not written up here only because it needs a four-option renderer that
does not exist. Worth revisiting: it asks "what does not fit", which none of the
current games ask.

**Finish the Verse** was removed when Who Said It? arrived and should stay
removed. It rewards memorisation alone, and splits a room into the few who know
it and the many who do not.

**True or False** is a good game and a cheap one, but its value is in correcting
things people are confident about, which means the deck has to be written by
someone who knows what this congregation actually believes. That is not a job to
hand to a drafting agent.
