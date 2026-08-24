# AY Bible Games

Simple picture games for church. Put one on the projector, the room shouts the
answer, you click to reveal. Nobody has to type anything.

**Bible Names** is the game that's ready: a rebus. Pictures stand for syllables,
and the answer is a Bible name.

    [✓ done] + [😱 yell]   →   DONE + YELL   →   DANIEL
    [A]      + [dam]       →   A + DAM       →   ADAM
    [magic]  + [ham]       →   ABRA + HAM    →   ABRAHAM

---

## Playing it

**No internet needed.** Open `index.html` from the folder — double-click it.
That's the whole install. Copy the folder to a USB stick and it works on any
laptop in the building, wifi or no wifi.

Once it's open:

| Key | What it does |
|-----|--------------|
| `Space` / click | reveal the working, then the name, then next puzzle |
| `←` | back |
| `R` | shuffle the deck |
| `F` | fullscreen |
| `Home` | back to the first puzzle |

The reveal has two beats on purpose. The first click shows `DONE + YELL`, which
gives the room a moment to get there themselves; the second shows `DANIEL`. If
you reveal the name straight away, anyone who didn't get the pun never finds out
why it worked.

The deck starts in a fixed order rather than shuffling itself, so you can run
through it beforehand and know what's coming. Press `R` when you want it random.

---

## Changing the puzzles

Everything is in **`games/names/deck.js`**. Open it in any text editor. One
puzzle looks like this:

```js
{
  answer: 'DANIEL', ref: 'Daniel 6',
  clues: [{ img: 'done.svg', word: 'DONE' }, { img: 'yell.svg', word: 'YELL' }],
},
```

- `answer` — the name shown at the end
- `ref` — where to find them, shown underneath
- `clues` — the pictures, left to right. `word` is the syllable that picture
  stands for; it's hidden until the reveal.
- `img` — a file in `games/names/clues/`

To **remove** a puzzle, delete its block. To **reorder**, move the blocks
around. No other file needs touching.

### Using your own pictures

Drop the image into `games/names/clues/` and name it in the deck:

```js
clues: [{ img: 'jerry.png', word: 'JERRY' }, { img: 'maya.svg', word: 'MAYA' }],
```

A full URL also works, which is handy while you're trying ideas out:

```js
clues: [{ img: 'https://example.com/beaver-dam.jpg', word: 'DAM' }],
```

**But use local files for anything you'll actually play.** A URL means that clue
needs working internet at the exact moment it appears on screen, and it breaks
permanently if whoever owns that page moves or deletes the picture. Google
Images thumbnail links (`encrypted-tbn0.gstatic.com/images?q=tbn:...`) are the
worst case — those are temporary cache keys that expire, and they're only a
couple of hundred pixels wide, so they look like mush blown up on a projector.
Save the real file into `clues/` instead.

If an image is missing, the card shows a red `?` rather than sitting blank — so
you notice during setup instead of mid-service.

### A note on what you put in there

Cartoon characters, logos and brand mascots belong to somebody. Using one on a
laptop in a church hall is one thing; committing it to a public repo that
publishes to the open web is another. Worth a thought before you push.

---

## Publishing it (optional)

The game does not need this. It's only so people can open it from a phone.

1. Commit and push to `main`.
2. On GitHub: **Settings → Pages**, source **Deploy from a branch**,
   branch `main`, folder `/ (root)`.
3. It appears at `https://jaypinedabengco.github.io/AY-Bible-Games/`.

Every path in this project is **relative** (`assets/theme.css`, not
`/assets/theme.css`). That's deliberate: Pages serves this from a subfolder, and
a single root-absolute path would 404 there while still working fine locally —
the nastiest kind of bug, because it only appears after you publish. If you add
files, keep the paths relative.

`.nojekyll` is there to stop GitHub trying to process the site as a blog.

---

## What's in here

```
index.html              front page, lists the games
games.js                the list of games — add a line to add a game
assets/
  theme.css             shared look; colours and sizes are at the top
  runner.js             the shared engine: reveal stages, keyboard, shuffle
games/names/
  index.html            the Bible Names game
  deck.js               ← THE PUZZLES. This is the file you'll edit.
  clues/*.svg           clue artwork
games/characters/
  images/*.svg          artwork for a second game — see "Parked" below
tools/
  common.py             shared palette for the drawing scripts
  gen_clues.py          redraws games/names/clues/
  gen_images.py         redraws games/characters/images/
  review.html           all puzzles on one page, for checking the deck
```

`tools/review.html` is worth knowing about: open it and you see every puzzle
with its artwork and answer on one screen. It reads the same `deck.js` the game
does, so it's the fastest way to sanity-check the deck after editing.

### Redrawing the artwork

The clue pictures are generated, not hand-drawn, so the whole set shares one
palette. You only need this if you want to change how they look:

```sh
python3 tools/gen_clues.py     # → games/names/clues/
python3 tools/gen_images.py    # → games/characters/images/
```

Colours live in `tools/common.py`. Change one there and every picture follows.

---

## Parked: Bible Characters

A second game, half-built: a scene from a Bible story appears and the room
guesses who it is (an ark with a rainbow → Noah). The 18 illustrations are done
and in `games/characters/images/`, but the game page isn't written, so the front
page shows it greyed out.

To pick it up later: copy `games/names/index.html` and its `deck.js`, point them
at `images/`, use one reveal stage instead of two, and flip `status` to
`'ready'` in `games.js`.

---

## Adding a whole new game

1. Copy `games/names/` to `games/your-game/`.
2. Edit its `deck.js` and `index.html`.
3. Add an entry to `games.js`.

The engine in `assets/runner.js` handles any "show something, reveal it in
stages, move on" game, so most new games are just data.
