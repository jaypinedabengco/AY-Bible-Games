# Handover — AY Bible Games

Written 2026-08-24. Picking this up in Claude Code? Read this, then
`games/names/deck.js`, then `README.md`.

---

## What this is

Picture games for church, projected in the hall. The room shouts answers; one
person drives with the spacebar. No typing, no sign-in, no internet required.

**Game 1 — Bible Names (built, playable).** A rebus. Pictures stand for
syllables and the answer is a Bible name.

    [A] + [dam]            →  A + DAM        →  ADAM
    [magic hat] + [ham]    →  ABRA + HAM     →  ABRAHAM
    [✓ done] + [yelling]   →  DONE + YELL    →  DANIEL

**Game 2 — Bible Characters (parked).** A scene from a story appears, the room
names the person. 18 illustrations are drawn and in
`games/characters/images/`, but the game page was never written. The front page
shows it greyed out. Parked deliberately, to finish one game properly first.

---

## Decisions already made, and why

Please don't undo these without reading the reason — each one is a bug someone
would otherwise hit on a Sunday morning.

**The game does not need hosting.** Original plan was to serve the HTML and
images from a public Google Drive folder. That does not work: Google removed
static web hosting from Drive in 2016, so a public `.html` there downloads or
renders as escaped text instead of running. Drive image hotlinks
(`uc?id=...`) are rate-limited and break periodically. More importantly, church
wifi is unreliable and a picture-reveal game has no reason to need a network.
So: a plain folder that runs by double-clicking `index.html`. Publishing to
GitHub Pages is a convenience on top, never a requirement.

**Deck data is a `.js` global, not `.json`.** Browsers block `fetch()` on
`file://` URLs. A JSON deck loaded by fetch would work on GitHub Pages and then
show a blank screen when someone opens it from a USB stick — the worst kind of
bug, because it only appears in the place you can't debug. `deck.js` assigns
`window.NAME_PUZZLES` and is loaded with a plain `<script>`, which works
everywhere.

**No ES modules, no build step, no framework.** Same reason: `import` is blocked
on `file://`. `assets/runner.js` is an old-fashioned IIFE on purpose.

**Every asset path is relative.** GitHub Pages will serve this from
`jaypinedabengco.github.io/AY-Bible-Games/` — a subpath. One root-absolute path
(`/assets/theme.css`) would work locally and 404 once published. Keep paths
relative when adding files.

**The reveal has two beats.** First click shows the working (`DONE + YELL`),
second shows the name. If you reveal the name immediately, anyone who missed the
pun never learns why it worked, and the joke dies.

**The deck does not auto-shuffle.** Fixed order so the host can rehearse and
know what's coming. `R` shuffles when you want it.

**Clue art is generated, not hand-drawn.** `tools/gen_clues.py` +
`tools/common.py`. One shared palette means the set looks like a set, and
restyling everything is a one-line change. Regenerate with
`python3 tools/gen_clues.py`.

---

## The deck: 15 puzzles

Ordered as they appear. Open `tools/review.html` in a browser to see all of them
with their artwork on one screen — it reads the real `deck.js`, so it is always
in sync.

| # | Clues | Answer | Status |
|---|-------|--------|--------|
| 01 | A + dam | ADAM | ok |
| 02 | root | RUTH | ok — single clue |
| 03 | eye + sack | ISAAC | ok |
| 04 | done + yell | DANIEL | ok — Jay's original example |
| 05 | sea + moon | SIMON | ok |
| 06 | solo + moon | SOLOMON | ok |
| 07 | fill + lips | PHILIP | ok |
| 08 | & + drew | ANDREW | ok |
| 09 | sum + well | SAMUEL | ok — Jay's idea, better than my first try |
| 10 | S + tear | ESTHER | ok |
| 11 | day + vid | DAVID | **flagged `risky`** |
| 12 | toe + mass | THOMAS | ok — chalice reads as "mass" for a church crowd |
| 13 | abra + ham | ABRAHAM | ok |
| 14 | barn + A + bus | BARNABAS | ok — only 3-clue puzzle |
| 15 | Jerry + maya | JEREMIAH | **flagged `risky`** — needs a real Jerry image |

### Open items on the deck

**11 DAVID — two soft clues in one puzzle.** The calendar may read "calendar" or
"date" rather than "day", and the camcorder may read "camera" rather than "vid".
Either find a better pair or cut him. Not yet resolved.

**15 JEREMIAH — the mouse is a placeholder.** Jay wants the actual Jerry from
Tom & Jerry. I did not source it: Jerry is Warner Bros' copyrighted character
and this repo publishes to a public URL, so I won't fetch or commit his image.
Jay said he'd find it himself. The mechanism is ready — see below. Note the
`maya` clue *is* correct now: it's drawn as the Eurasian tree sparrow, the bird
Filipinos actually call maya (chestnut crown, black cheek patch, streaked wing).

**Rejected ideas, don't re-propose:**
- *Jonah = cup of "joe" + "nah"* — "joe" for coffee is American slang, not used
  in the Philippines. Jay cut it.
- *Abraham via Abra the province* — needs geography knowledge. The shipped
  `abra.svg` is a magician's top hat and wand (abra*cadabra*), which needs none.
- *Gideon = signpost ("guide") + ON switch* — a signpost reads "sign" or "this
  way", not "guide". Too clever; cut.
- *Samuel = sum + Yule tree* — Jay's sum + well is better.

---

## Using your own images

`img` accepts a filename in `clues/`, a full URL, or a `data:` URI. Local files
are strongly preferred:

```js
clues: [{ img: 'jerry.png', word: 'JERRY' }, { img: 'maya.svg', word: 'MAYA' }],
```

A URL means that clue needs live internet the moment it hits the screen, and
breaks permanently if the owner moves the file.

**Specifically avoid Google Images thumbnail links** —
`encrypted-tbn0.gstatic.com/images?q=tbn:ANd9Gc...`. Those are temporary cache
keys that rotate and expire, and they are only a couple of hundred pixels wide,
so they turn to mush on a projector. Save the real file into `clues/`.

Missing images render a red `?` on the card rather than a blank, so you catch it
during setup rather than mid-service.

---

## Known rough edges

**`clues/ham.svg`** — readable, but the protruding bone looks a bit like a
balloon knot. Cosmetic.

**`clues/dam.svg`** — third attempt. It is now a side cross-section (water high
on one side, low on the other, spilling over the crest) which finally reads as a
dam. The two earlier attempts read as a table and a bathtub respectively. If you
touch it, check it at small size before shipping. A fallback idea if it still
bothers you: drop the dam entirely and make ADAM a single `atom` clue — an atom
diagram is instantly readable and "atom" sits very close to "Adam".

**`clues/toe.svg`** — now a footprint (separated toe pads, big toe ringed in
red), which reads much better than the foot silhouette it replaced.

**Not tested on real hardware.** Everything was verified in headless Chromium at
1280×760 and 390×700, on both `file://` and `http://`, with no console errors
and no broken images. It has never been on an actual projector. Do one dry run
before a service.

**Nobody has playtested the puns.** The riskiest thing in the project. Try the
deck on one or two people before Sunday; a pun that doesn't land dies in silence.

---

## Repo state — READ THIS

There is one commit, `4341bfd`, containing all 59 project files. It has **not
been pushed**. The remote is `git@github.com:jaypinedabengco/AY-Bible-Games.git`,
branch `main`.

**Two things need cleaning up, and I could not do them from this session** — the
sandbox I was working in cannot delete files, only create and move them, so git
kept leaving lock files I was unable to remove.

1. **`_incoming.tar.gz` was committed by mistake.** It was the transfer archive.
   It is already in `.gitignore` and moved to `_to_delete/`, but it is still in
   commit `4341bfd`.
2. **`_to_delete/` holds junk to remove**, including `_to_delete/stale-git/`
   with ~74 orphaned git temp objects and lock files I moved out of `.git/`.

From a normal terminal, this fixes both:

```sh
cd ~/Developer/Personal/AY-Bible-Games
rm -rf _to_delete .git/index.lock .git/HEAD.lock
git reset                 # rebuild the index from HEAD
git add -A
git commit --amend --no-edit
git fsck                  # expect only "dangling commit", which is harmless
git ls-files | wc -l      # expect 59, and no _incoming.tar.gz
git push -u origin main
```

If `git fsck` reports anything worse than a dangling commit, the simplest
recovery is a clean start — the working tree is complete and correct, so
`rm -rf .git && git init && git remote add origin
git@github.com:jaypinedabengco/AY-Bible-Games.git && git add -A &&
git commit && git push -u origin main` loses nothing but the one local commit.

To publish afterwards: GitHub **Settings → Pages**, deploy from branch `main`,
folder `/ (root)`.

---

## Suggested next steps, in order

1. Clean up the repo as above and push.
2. Playtest the 15 puns on a couple of people. Cut whatever doesn't land.
3. Resolve #11 DAVID and #15 JEREMIAH.
4. Do one dry run on the actual projector and laptop.
5. Only then consider unparking Bible Characters. To do it: copy
   `games/names/index.html` and `deck.js` into `games/characters/`, point them
   at `images/`, use `stages: 1` instead of `2` (one reveal, no working line),
   and flip `status` to `'ready'` in `games.js`. The 18 pictures and their
   answers are: abraham, baptist (John the Baptist), daniel, david, elijah,
   esther, goliath, jonah, joseph, lazarus, moses, noah, paul, peter, ruth,
   samson, solomon, zacchaeus.

---

## Quick reference

```sh
open index.html                      # play it, no server needed
open tools/review.html               # see the whole deck at once
python3 tools/gen_clues.py           # redraw games/names/clues/
python3 tools/gen_images.py          # redraw games/characters/images/
python3 -m http.server 8000          # if you want to test over http
```

Controls: `Space`/click reveal & advance · `←` back · `R` shuffle ·
`F` fullscreen · `Home` restart.
