# The tools

Four things live here. Only the first one changes files.

| Command | What it is for |
|---|---|
| `node tools/manage.js` | **Deck manager** — replace pictures, add variants, set weight and difficulty |
| `node tools/validate.js games/book-names/deck.js` | Check the deck after any edit |
| `open tools/review.html` | See the whole deck on one screen |
| `node tools/fetch-images.js` | Pull freely-licensed pictures from Wikimedia Commons |

Plus two generators you rarely need: `make-letters.js` draws the letter and
number tiles, `make-graphics.js` draws the clues no search returns cleanly.

---

## The deck manager

It manages **both games** — Bible Book Names and Bible Character Names. Pick
which one at the top left; the choice is in the URL, so a reload or a bookmark
stays on the game you were editing, and a picture can never be posted to one
deck while the page thinks it is showing the other.

The two games are the same engine and the same deck shape, so everything below
applies to either. The only difference is what the **add** tab asks for:

- **Bible Book Names** — the book is chosen from the 66, and its reference
  (testament, division, position) is filled in for you.
- **Bible Character Names** — the name is typed, because there is no closed
  list of Bible characters, and the reference is a free line of your own:
  `Exodus 3 · led Israel out of Egypt`. It prints small under the answer after
  the reveal, so keep the answer out of it.
- **Who Said It?** — a text deck, so it has no pictures at all. It gets the two
  quote tabs described below instead.

The character deck starts **empty**, and its card on the front page stays greyed
out until it can fill a round. `tools/validate.js` will report that `sessionSize`
exceeds the playable count until there are 20 — that is the check doing its job.
When the deck is ready, set that game's `status` to `'ready'` in `games.js`.

```sh
node tools/manage.js
```

Then open **http://localhost:8900**. Leave it running while you work; `Ctrl-C`
stops it.

It needs to be a small local program rather than a web page because **a web page
cannot write to your disk.** This one serves the site *and* accepts uploads, so
it can save a picture into `games/book-names/images/` and edit
`games/book-names/deck.js` for you.

### Pictures tab — replace one picture

Every clue in the deck, with its current picture, the word it stands for, and
its filename. **Drag a new picture onto a card**, or click the card to pick one.

What happens when you do:

1. The file is saved into `games/book-names/images/` under the clue's existing
   name.
2. It is capped at 1400px on the long edge — ample for a projector, and it
   keeps the repository small.
3. If your file has a different extension (you dropped a `.webp` where a `.jpg`
   used to be), `deck.js` is updated to match and the old file is removed.

So you never rename anything and never edit code to swap a picture.

### Variants tab — several pictures for one book

A variant is one way of asking a book. A book can have more than one, and the
game draws one of them per round, so the same book can come back later looking
completely different.

Each book lists its variants with two dials:

- **weight** — how often this variant is picked against the others. Weight 3
  against weight 1 is drawn three times as often.
- **difficulty** — 1 plays early in a round, 3 plays late. The round is ordered
  easiest first so the room is not fried in the first minute.

Both save the moment you change them. Weight only appears once a book has a
second variant — with nothing to compete against it would do nothing, and a
control that does nothing is worse than no control.

**Clue words are editable too.** Type over them and press **save words**. A
picture that reads wrong is often a wording problem rather than a picture
problem: the same drawing lands very differently as `BACK` and as `HA`. Clearing
a word on a single-picture variant makes the picture itself the clue. Words are
checked before they are written — letters, numbers, spaces and `+ - & . ! ?`
only, because a stray quote in `deck.js` would bring the whole game up blank.

**To add a variant**, use the row at the bottom of a book:

- Choose a picture and give it a **clue word** — the syllable it stands for.
- Press **+ another picture** for a rebus of two or more pictures, which is how
  most of this deck works: `JEANS + SIS` is Genesis.
- Leave the word blank on a *single* picture to say the picture **is** the
  answer — a Doré engraving of Job on the ash heap needs no working line.
- Set weight and difficulty, then **add variant**.

Files are named after the book, so `RUTH`'s second variant becomes
`ruth-2-1.png` and `ruth-2-2.png`. The folder stays readable.

### Add a book tab — a book the deck does not have yet

The deck ships with 42 of the 66 books. The rest are there to be added when you
have pictures that work for them.

- Pick the book from the list. It only offers books that are **not** in the deck
  already, so you cannot add Proverbs twice.
- Its reference — testament, division, position in the canon — is filled in
  from the canon list. You do not have to look up which division Zephaniah is
  in.
- Add pictures and clue words exactly as you would for a variant, set the
  difficulty, and press **add book**.

Files are named after the book: `proverbs.png` for one picture, or
`proverbs-1.png` and `proverbs-2.png` for a rebus.

The new book is appended to the end of `deck.js` rather than slotted into canon
order. Play order is shuffled anyway, and inserting into the middle would mean
guessing which division comment it belongs under.

### Quotes tabs — the Who Said It? deck

This deck has no pictures, so the pictures, variants and add tabs are hidden
for it. Two tabs take their place.

**waiting for text** opens first, because it is the tab that gets used. It
lists only the quotes with no line yet — the Tagalog scaffolds. Each shows the
person, the reference and the clue, with an empty box. Paste the Magandang
Balita Biblia line in, press save, and that quote wakes up: it stops being
dormant, starts being drawn in a Tagalog round, and drops off this list.

The MBB text is the Philippine Bible Society's, so it is not committed to this
repository ahead of you. What is committed is the name, the reference and the
clue, which are our own words. That is why the boxes are empty and why this tab
exists.

**quotes** shows every quote, in both languages. Per quote you can edit:

- **the line itself**, in a box big enough to read the whole sentence — a quote
  typed into a single-line field that scrolls sideways is how a mistake gets
  missed
- **verse** and **clue**
- **name**, on a Tagalog quote only: the Tagalog form the room shouts (PEDRO
  for PETER). English quotes take the person's name from the puzzle.
- **difficulty** — 1 is a line the room shouts instantly, 3 needs the clue.
  Difficulty here means FAME, not theology.
- **wording checked** — the ONLY thing that clears the `unverified` flag. Tick
  it once you have compared the line against a real Bible. Until then
  `validate.js` counts it and the game master page tags it.

Apostrophes are fine and are escaped for you — a quote is full of them.
Backslashes and line breaks are refused: neither belongs in a line read aloud
from a screen.

### What it will not do

It does not delete puzzles, and it never regenerates `deck.js` from a parser.
That file is hand-written with comments explaining each decision, and a round
trip through a parser would throw all of that away. Edits are surgical: one
string replaced, or one block inserted.

To remove a variant or a book, edit `deck.js` in a text editor. It is meant to
be read.

### If something goes wrong

Every edit is checked before it is kept. The manager writes the file, reloads
it, and confirms every puzzle still has an id and an answer and that the count
has not changed. If anything fails it **puts the old file back** and tells you
why, so a bad edit cannot leave you with a broken deck.

Two real bugs found this way, both worth knowing about:

- A picture uploaded for a clue whose filename appears twice would repoint the
  wrong one. Filenames are unique in this deck, so it does not arise — but do
  not reuse a filename across two clues.
- Ruth's entry carries a **commented-out** variants example. An early version
  matched that comment as if it were real structure and refused the edit. It
  now only matches real code, but it is a reminder that comments are text: if
  you paste example code into `deck.js`, keep it commented and keep it tidy.

---

## Checking the deck

```sh
node tools/validate.js games/book-names/deck.js
```

Run this after **any** edit, whether by hand or through the manager. It catches
a missing or duplicate id, an id that gives away its own answer, a bad
difficulty or weight, a rebus with no clues, and a session size larger than the
deck. It also lists every pun flagged `risky`, as a standing reminder that they
have not been playtested.

Add `--files games/book-names/images` to list pictures the deck names that are
not in the folder yet.

---

## Finding pictures

```sh
node tools/fetch-images.js               # everything still missing
node tools/fetch-images.js whale.jpg     # just this one
node tools/fetch-images.js --list        # what is missing, no downloads
```

Search terms live in `tools/image-queries.json`. Only freely-licensed files are
accepted and every download adds a row to `CREDITS.md`.

**Two lessons are baked into that file, and they cost real time to learn.**
Wikimedia Commons is a documentary archive, not a clipart library: it is
excellent for classical art and photographs of real objects, and useless for
abstract words. Searching for "done" returned a Japanese railway ticket, "tick"
an entomological specimen, "axe" a deodorant, and "letter A" someone's
correspondence. So abstract words use emoji — and Commons names those by
codepoint, hence `Twemoji 1f456` rather than "jeans". Anything that is a letter
or a number is drawn by `make-letters.js`, never searched.

Files listed in `BY_HAND` at the top of `fetch-images.js` are never fetched or
overwritten. That is where your own pictures go.
