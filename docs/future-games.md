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
   thinking for it. Note this is about a *written* clue — several PICTURES
   shown together are a different thing, and often necessary: honey alone is
   vague, honey beside a lion is Samson. See The Object Trail.
4. **Nothing shown before the answer may contain the answer.** The id, the clue,
   the reference. This is the only rule with no exceptions, and it should be
   enforced by `validate.js` rather than by whoever writes the deck.
5. **And nothing shown may point harder at somebody ELSE in the deck.** Rule 4
   is a string check and passes happily on a puzzle that is still wrong. The
   Object Trail's MARY was a manger, swaddling cloths and the Cana water jars —
   none of which names her, and all of which are her son's. A room shouts JESUS
   and is more right than the deck. Jesus absorbs anyone who shares a scene with
   him; so do Elijah and Elisha, and Zacchaeus takes any other tax collector.
   This one cannot be automated: read the puzzle as a whole and ask which name
   the room actually calls out.

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

**The idea.** Objects from one story, revealed a step at a time, getting easier —
and **a step is one picture or several together.**

```
1   honey  +  a lion

2   honey  +  a lion        long hair

3   honey  +  a lion        long hair        two pillars

4   SAMSON
    Judges 14:8
```

Objects are how people actually remember stories. The trail also builds tension
in a way a single clue cannot: the room starts guessing at the first step and
argues its way down.

### A step can be several pictures, and usually should be

This is the difference between the trail working and not working. **One object is
usually ambiguous.** Honey on its own is vague. A lion on its own is Daniel, or
David, or the one Samson killed. Put honey and a lion side by side and there is
exactly one story it can be — and neither picture names him.

So pairing is not decoration, it is how a step is aimed. It also solves the
obvious objection to the whole game: that a staff, a stone or a well belongs to
half a dozen stories. It does, alone. A staff beside a snake does not.

### Not a rebus, even though it looks like one

The pictures render as a row exactly the way the book game's do, but they mean
something different, and the distinction matters to whoever writes the deck:

- A **rebus** picture is a *pun*. Jeans + sis = Genesis. The picture stands for a
  sound, and finding a picture that reliably says its syllable is what made that
  artwork so painful — the chew that read as an eye, the jewels that read as
  stones.
- A **trail** picture is a *thing from the story*. Honey means honey. Any clear
  picture of honey works.

That is why this is the proposal worth spending artwork on and Bible Character
Names is not: no picture here has to carry a second meaning.

### The verses appear at the reveal, one per step

Every step carries its own reference, and they are all shown **at the reveal** —
never while the puzzle is running. The reveal becomes the teaching moment: the
answer, and then where each object came from.

```
1   honey  +  a lion

2   honey  +  a lion        long hair

3   honey  +  a lion        long hair        two pillars

4   SAMSON

    honey + a lion      Judges 14:8
    long hair           Judges 16:17
    two pillars         Judges 16:29
```

**A reference shown during the puzzle would give the game away**, and it is the
same trap the quote game already fell into. "Judges 14:8" printed beside step one
names the book, and for a story like this the book is very nearly the answer — a
room that knows Judges knows who the strong man is. So the references wait.

That also keeps the puzzle screens clean: pictures only, nothing to read while
the room is looking.

A step with no verse of its own is fine — the line is simply omitted for it. A
puzzle whose objects all come from one passage can carry a single reference on
the puzzle itself, exactly as the other games do.

### Renderer

New, but it reuses more than it adds. Each step is a row of pictures, which is
exactly what `clueRow` in `core/paint.js` already builds — including the `+`
between pictures and the sizing that shrinks them as the count grows. So the
work is a `byType` entry, a paint branch that draws N rows instead of one, and
some CSS.

**Deck shape** — text first, so it is playable before any artwork exists:

```js
{
  id: 'ot-01', answer: 'SAMSON', difficulty: 2,
  type: 'trail',
  // vaguest step FIRST: the room should not get it on step one
  items: [
    // `pictures` is a list, because one object is usually ambiguous.
    // `verse` is shown at the REVEAL, never with the step.
    { verse: 'Judges 14:8',
      pictures: [{ word: 'honey' }, { word: 'a lion' }] },
    { verse: 'Judges 16:17',
      pictures: [{ word: 'long hair' }] },
    { verse: 'Judges 16:29',
      pictures: [{ word: 'two pillars' }] },
  ],
}
```

and later, when the pictures exist, the same puzzle grows an `img` per object
without being rewritten:

```js
    { verse: 'Judges 14:8',
      pictures: [{ word: 'honey', img: 'honey.png' },
                 { word: 'a lion', img: 'lion.png' }] },
```

The renderer therefore hands the painter two things: the steps revealed so far,
and — only once answered — the full list of steps with their references.

```js
trail: {
  // one stage per step, then the reveal
  stages: function (variant) { return variant.items.length; },
  view: function (puzzle, variant, stage) {
    var v = base('trail', puzzle);
    var done = stage >= variant.items.length;
    // every step up to and including this one, so the trail accumulates
    v.steps = variant.items.slice(0, Math.min(stage + 1, variant.items.length));
    // where each object came from - held back until the answer, because a
    // reference beside step one names the book, and the book is very nearly
    // the answer
    v.sources = done ? variant.items : null;
    v.answered = answered(puzzle, stage, variant.items.length);
    return v;
  },
}
```

**Content.** Free in its text form. The pictures are a later, separate piece of
work, and unlike the rebus artwork they can be sourced rather than drawn,
because a photograph of honey is honey.

**Difficulty.** Almost entirely the ORDER of the steps, and secondarily how many
pictures the first step gets. A trail opening with "a coat of many colours" is
over before it starts; the same trail opening with "a pit" is a real puzzle.

**Risk.** A trail that is right object by object and wrong as a whole — three
steps that each fit the intended story but collectively fit a different one
better. Each trail has to be read end to end, not checked item by item. Pairing
reduces this a great deal but does not remove it.

**Effort.** Medium. One `byType` entry, one paint branch reusing `clueRow`, some
CSS, and a deck. The picture version is separate and later.

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
