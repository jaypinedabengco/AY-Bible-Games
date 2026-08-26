# Handover — AY Bible Games

Written 2026-08-25. Picking this up? Read `README.md` first — it covers how to
run and edit the game. This file is only what `README.md` cannot be: the
current state, the decisions that would otherwise be re-argued, and what is
still undone.

---

## Where it stands

**Bible Book Names is finished and playable.** 42 of the 66 books, drawing 20
per session. All 64 pictures are in place. 108 tests pass with
`node --test tests/`.

The Game Master view works: the projector prints an id like `#bn-13`, the
person running the game types it on their phone and gets the answer. Username
`GM`, password `Adventist` — **change these before a service.**

**Two things have never been done, and no test can do them:**

1. **A dry run on the real projector and laptop.** Everything has been checked
   in a browser at desktop and phone sizes, on `file://` and `http://`, with no
   console errors. It has never been on a hall screen. The one picture I would
   watch is Revelation's Dürer woodcut — it is dense, and dense art that reads
   on a monitor can turn to mud at the back of a room.
2. **Playtesting the puns.** This remains the riskiest thing in the project. A
   pun that doesn't land dies in silence. Try these on two or three people
   before Sunday: **EZEKIEL, EZRA, LUKE, NAHUM, TITUS**.

---

## Decisions already made, and why

Please don't undo these without reading the reason. Each one was arrived at the
hard way.

**It's a picture game. No verses.** An earlier draft reached 56 books by asking
some of them with a famous line — "Vanity of vanities" for Ecclesiastes, the
valley of dry bones for Ezekiel. It worked and it cost nothing to draw, but it
turned half a session into a verse quiz, which is a different game. The verse
clues were removed and eleven books went with them.

**English only.** A Filipino-answer round was built and then withdrawn: it
doubled the deck but meant every card had to announce which language it wanted,
and the Tagalog names are mostly descriptive (*mga hari* is literally *kings*),
so those puzzles played as recognition rather than wordplay. The drafts survive
in the spec's Appendix A if anyone wants them back.

**Graphics, not photographs, for anything abstract.** This is the single most
useful thing learned. A photograph archive cannot illustrate a word: searching
returned a Japanese railway ticket for "done", an entomological specimen for
"tick", an Axe deodorant for "axe", a Burmese numeral chart for "numerals", and
someone's correspondence for "letter A". Emoji and drawn tiles read instantly on
a projector and weigh a fraction as much. Photographs are for physical objects
only.

**Letters, digits and a few objects are drawn, not sourced.**
`tools/make-letters.js` and `tools/make-graphics.js` produce them. No licence
question, no hunting, legible at any size.

**The id must never contain the answer.** It is printed on the projector. The
validator refuses an id containing its own answer, because `ruth-08` would hand
the game over and somebody will eventually think that's more readable.

**The reference is canon placement, not a chapter.** Printing `Daniel 6` under
DANIEL prints the answer beneath the answer. It shows testament, division and
number out of 66 instead, which teaches something without spoiling anything.

**A missing picture always shows a red `?`, and a failed script says so on
screen.** Silence is never correct: the site is published, and a puzzle that
quietly vanishes online is far harder to notice than a broken card. The startup
guard exists because a dropped script once rendered a black rectangle with the
reason only in the browser console — the worst thing this game could do in front
of a room.

**Nothing here needs a server, a build step, or the internet.** See the last
section of `README.md` for why. `import` and `fetch()` are both blocked on
`file://`.

---

## Open items

**MALACHI is settled, and was queried once.** Its clue is the SM logo standing
for "MALL". I flagged that a room might shout "SM" instead; the answer from
someone who knows the audience is that Filipinos link SM to *mall* automatically,
so it reads. Recorded here so it isn't raised a third time.

**Twenty-four books have no puzzle.** Obadiah, Zephaniah and Jude were dropped
for having neither a workable pun nor a recognisable picture; the rest went with
the verse clues. The spec's Appendix C records what was tried for the hardest
ones and why each failed, so nobody repeats the work. Ezra's blocker is worth
knowing: every *picture* of Ezra looks exactly like Nehemiah, which is why it is
now a rebus instead.

**Two mechanisms are built, tested and unused.** `variants` (several pictures
for one answer, drawn at random) and the `text` renderer. Both were used and
then removed as the deck changed. They are small, and `deck.js` carries a
commented example, so switching one on is deck data — but don't be surprised
they're dormant.

**Three future games are listed on the front page, greyed out**: Old or New?,
Finish the Verse, Bible Character Names. The engine already handles all three;
each needs a deck and one line in `games.js`.

---

## Ideas already rejected — don't re-propose

- *Verse clues* — worked, but turned a picture game into half a verse quiz.
- *Filipino answers* — see above.
- *Jonah as cup of "joe" + "nah"* — "joe" for coffee is American slang, not
  used in the Philippines.
- *Leviticus as Levi's + tick + us* — the tick photographed as a spider and "us"
  needed another country's flag. It is the wordmark alone now; LEVI fits exactly
  one book.
- *Ruth as a church member's photo* — a lovely idea, and the mechanism is still
  there. Withdrawn because the site publishes to a public URL, which is a
  different question from a face on a hall projector, and it's hers to answer.
- *A shared session code so the Game Master's phone could mirror the projector's
  running order* — solved a problem that stable ids remove entirely.

---

## Quick reference

```sh
open index.html                                   # play it, no server needed
open tools/review.html                            # the whole deck on one screen
open games/book-names/gm.html                     # the Game Master view
node tools/validate.js games/book-names/deck.js   # check the deck after editing
node --test tests/                                # 108 tests
node tools/gm-hash.js GM Adventist                # new Game Master credentials
```

If a picture you just added doesn't appear, **hard-reload** — the browser caches
`deck.js`, and that has already caused one false alarm.
