# AY Bible Games — San Fernando Adventist Church

Picture games for church, projected in the hall. The room shouts the answer;
one person drives with the spacebar. No typing, no sign-in, no internet.

**Bible Book Names** is the game that's ready. Pictures stand for syllables, and
the answer is a book of the Bible.

    [jeans] + [sis]        →  JEANS + SIS   →  GENESIS
    [XO candy] + [2]       →  XO + DOS      →  EXODUS
    [✓ done] + [😱 yell]   →  DONE + YELL   →  DANIEL

42 of the 66 books, drawing 20 per session so no two nights are the same.

---

## Playing it

**Double-click `index.html`.** That's the whole install. Copy the folder to a
USB stick and it runs on any laptop in the building, wifi or not.

Pick a game, and it opens on a **start screen**: what the game is, in one or
two lines, and a dropdown for how long the round should be. `Space` starts it.
The choice is remembered per game, so a programme that always runs 15 is set
once. Where a deck has more than one language with something to play in it, a
language picker sits beside the length — one language per round, because a
mixed round leaves the room unsure which language to shout.

| Key | What it does |
|-----|--------------|
| `Space` / click | reveal the working, then the answer, then next |
| `←` | back |
| `R` | reshuffle |
| `O` | back to the order written in `deck.js` |
| `F` | fullscreen |
| `Home` | first puzzle |
| `S` | back to the start screen, to change the round length or language |
| `?` | show the key legend again |

The legend appears on screen for the first few seconds so you don't have to
remember any of this, then fades so the room isn't reading it. `?` brings it
back.

Nothing else is bound. Every extra key is a chance to derail a service by
leaning on the keyboard.

**The reveal has two beats on purpose.** The first click shows `DONE + YELL`,
which gives the room a moment to get there themselves; the second shows
`DANIEL`. Reveal the answer straight away and anyone who missed the pun never
finds out why it worked.

**An evening is played in rounds.** Round one draws 20 puzzles, easiest
first. When it ends the screen says how many are still to come; `Space` starts
the next round, which draws only books the earlier rounds did not show. Rounds keep going until the deck runs out, with nothing repeated, and the last
card says so.

A puzzle with more than one variant can come back in a later round showing its
other picture, or another line the same person said — that counts as something
you have not seen.

### The three games

- **Bible Book Names** — pictures combine into a book of the Bible.
  Jeans + sis. XO + dos. 43 books, three rounds.
- **Who Said It?** — a line someone in the Bible said. Four beats: the quote,
  the verse, a clue, then the name. 71 people, 113 quotes, four rounds.
  English now, Tagalog once its lines are pasted in — see `tools/README.md`.
- **Bible Character Names** — the same idea as the book game, with people.
  Greyed out on the front page until it has pictures; its start screen says so
  rather than failing.

Press `R` at any point for a completely fresh evening, or `O` to walk the deck
in file order when you're rehearsing.

---

## The Game Master view

The room watches the projector. Whoever is running the game opens
**`gm.html` on their phone** to see the answers — one page for every game.

Sign in once, then pick the game from the row at the top — it holds every
playable deck, so switching between them costs nothing and does not ask for the
password again.

Every card prints a small id in the bottom corner — `#bn-13`, `#qs-04`. Type
that id into the Game Master view and you get the answer, the working, and
where it sits: the canon position for a book, or the verse and clue for a
quote. You can search by name too.

A quote still waiting for its Tagalog line shows as *waiting*, so you can see
what is missing as easily as what is there.

Nothing is synchronised between the projector and the phone, so reshuffling
costs nothing and you can join halfway through. The ids never move.

**Username `GM`, password `Adventist`.** Change them before a service:

```sh
node tools/gm-hash.js YourUser YourPassword
```

Paste the number it prints into `gm-config.js`. The credentials themselves are
never written to a file. This is a lock on a door, not a safe — it stops a
curious teenager, nothing more, and the file says so.

That level is deliberate and sufficient. This is a church game; the answers are
the only thing behind the door, and the worst case is somebody spoiling a puzzle
for themselves.

### Getting the answers to your phone without publishing anything

The repository is private and the site is not published, which is fine — the
game never needed a server. But your phone cannot open a file that lives on the
laptop, so use one of these.

**Second screen. Nothing leaves the machine, and this is the best one.** Connect
the laptop to the projector as an *extended* display rather than mirrored. Put
the game fullscreen with `F` on the projector, and open `gm.html` in another
window on the laptop's own screen. The room sees the puzzle; you see the answer.
No network at all.

**Phone on the same network.** Serve the folder from the laptop:

```sh
python3 -m http.server 8000
ipconfig getifaddr en0      # the laptop's address on the network
```

Then on the phone open `http://THAT-ADDRESS:8000/gm.html`.
Church wifi works, and so does a phone hotspot with the laptop joined to it —
no internet is needed, only the two devices on one network.

**On paper.** Open `tools/review.html`, print to PDF, and you have every puzzle
and answer on a sheet. No devices, nothing to go wrong.

---

## Changing the puzzles

Everything is in **`games/book-names/deck.js`**. Open it in any text editor.

```js
{
  id: 'bn-14', answer: 'DANIEL', difficulty: 1,
  ref: { testament: 'Old', division: 'Major Prophets', position: 27 },
  clues: [{ img: 'done.jpg', word: 'DONE' }, { img: 'yell.jpg', word: 'YELL' }],
},
```

- `answer` — the book, shown at the end
- `id` — the handle printed on the projector so the Game Master can look it up.
  **Never put the answer in the id.** It is on a screen in front of the room, so
  `ruth-08` would give the game away. The validator refuses those.
- `ref` — where the book sits: testament, division, and its number out of 66.
  Deliberately *not* a chapter — printing `Daniel 6` under DANIEL hands the
  answer over.
- `clues` — the pictures, left to right. `word` is the syllable that picture
  stands for; it's hidden until the reveal.
- `difficulty` — 1, 2 or 3. A session plays easiest first so the room isn't
  fried in the first minute.
- `flag: 'risky'` — a note to yourself for a pun that might not land. The game
  ignores it; the validator lists it every run.
- `type: 'image'` — for a picture that *is* the answer rather than a syllable,
  like a whale for Jonah. No working line.

To remove a puzzle, delete its block. To reorder, move the blocks. Nothing else
needs touching.

### The easier way: the deck manager

You do not have to edit the file by hand to change a picture or add a variant.

```sh
node tools/manage.js
```

Open **http://localhost:8900** and leave it running while you work. Drag a
picture onto a clue and it is saved, resized and wired up for you. The variants
tab adds a second way of asking a book, with weight and difficulty dials.

Full instructions are in [tools/README.md](tools/README.md). Everything it
writes is checked and rolled back if it does not load, so it cannot leave you
with a broken deck.

**After editing by hand, always run:**

```sh
node tools/validate.js games/book-names/deck.js
```

It catches a missing id, a duplicate, an id that leaks its answer, a bad
difficulty, and a session size larger than the deck.

### Using your own pictures

Drop the file into `games/book-names/images/` and name it in the deck:

```js
clues: [{ img: 'my-picture.jpg', word: 'JAM' }],
```

**Aim for 1000px wide or more.** Anything smaller turns to mush on a projector.

If an image is missing the card shows a red `?` rather than sitting blank, so
you notice during setup instead of mid-service. If a *script* fails to load the
page says so on screen — it never shows a blank rectangle.

**Two hard-won lessons about sourcing.** Photograph archives are useless for
abstract words: a search for "done" returned a Japanese railway ticket, "tick"
an entomological specimen, and "letter A" someone's correspondence. Use a
graphic — an emoji or a drawn tile — for anything that isn't a physical object.
And avoid Google Images thumbnail links entirely; they're rotating cache keys
that expire, and only a couple of hundred pixels wide.

### A note on what you put in there

Cartoon characters, logos and brand mascots belong to somebody. Using one on a
laptop in a church hall is one thing; committing it to a public repository that
publishes to the open web is another. `CREDITS.md` records the source and
licence of every picture — keep it accurate.

---

## Checking the deck

```sh
open tools/review.html
```

Every puzzle with its real artwork on one screen, the clue word and filename
under each picture. Filter by id, answer or filename. Click a card to mark it as
needing a better picture; the marks persist and collect into a copyable list, so
a review pass produces a worklist instead of a memory.

This is the fastest way to spot a clue that doesn't read before it reaches a
projector.

---

## Publishing it (optional)

The game does not need this. It's only so people can open it from a phone.

1. Commit and push to `main`.
2. On GitHub: **Settings → Pages**, source **Deploy from a branch**, branch
   `main`, folder `/ (root)`.
3. It appears at `https://jaypinedabengco.github.io/AY-Bible-Games/`.

Every path in this project is **relative** (`core/theme.css`, not
`/core/theme.css`). That's deliberate: Pages serves this from a subfolder, and a
single root-absolute path would 404 there while working fine locally — the
nastiest kind of bug, because it only appears after you publish. Keep paths
relative when you add files.

`.nojekyll` stops GitHub trying to process the site as a blog.

**Pages deploys what is committed.** There is no private image folder: a picture
that isn't in the repo simply isn't on the published site.

---

## What's in here

```
index.html              front page, lists the games
games.js                the list of games — add a line to add a game
gm-config.js            the Game Master login hash
core/
  normalize.js          deck and puzzle defaults
  variants.js           picking between several pictures for one answer
  order.js              the running order: shuffle, subset, difficulty, zones
  machine.js            which puzzle, and how much of it is showing
  views.js              turning a puzzle into what belongs on screen
  images.js             finding a picture, ending at a visible placeholder
  paint.js              drawing it
  controls.js           the keys
  boot.js               assembling a session
  theme.css             the look; colours and sizes are at the top
games/book-names/
  index.html            the game
  deck.js               ← THE PUZZLES. This is the file you'll edit.
  images/*              clue artwork
  gm.html               the Game Master view — one page, every game
tools/
  manage.js             the deck manager — see tools/README.md
  validate.js           deck checker — run this after editing
  review.html           the whole deck on one screen
  fetch-images.js       source pictures from Wikimedia Commons
  make-letters.js       draw the letter and number tiles
  make-graphics.js      draw the clues no search returns cleanly
  gm-hash.js            hash a Game Master username and password
tests/                  108 tests, zero dependencies
CREDITS.md              source and licence for every picture
```

### Why it's built this way

**No build step, no framework, no `fetch()`.** All three are blocked or broken
on `file://`, and the game has to run by double-clicking a file on a laptop with
no wifi. `deck.js` assigns a global and loads with a plain `<script>`, which
works everywhere. A JSON deck loaded by `fetch` would work on GitHub Pages and
then show a blank screen from a USB stick — the worst kind of bug, because it
only appears where you can't debug it.

**The engine handles any "show something, reveal it in stages, move on" game**,
so a new game is mostly data: copy `games/book-names/`, edit its deck, add a
line to `games.js`.

---

## Running the tests

```sh
node --test tests/
```

108 tests, no dependencies, Node 18 or newer. `package.json` exists only to hold
that command — the game itself never needs npm.
