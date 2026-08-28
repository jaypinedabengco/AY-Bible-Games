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

**Who Said It? shows the verse BEFORE the clue, always.** The reference is
itself a hint for whoever has read the passage, which rewards the youth who
read.

There WAS an exception, and it was removed after being played: a verse whose
book carried the speaker's name — `Jonah 2:2` under JONAH — used to be held
back to the reveal, and `validate.js` refused a deck that forgot. Two things
killed it. It read as broken in the room: the host clicks for the reference and
the screen does not change. And the premise was mostly wrong — of the quotes
drawn from books named after a person, 36 are spoken by someone else entirely:
Goliath and Eli in Samuel, Nebuchadnezzar in Daniel, Pilate and Thomas and
Nicodemus in John, Mordecai in Esther. The book name is a hint far more often
than a giveaway.

So a handful of puzzles — Ruth in Ruth, Jonah in Jonah — do hand the answer
over at the reference. That is an accepted cost, not an oversight.

**Difficulty means how fast the room names the SPEAKER** - not how famous the
verse is. That distinction was missing from the first two drafting passes and
cost a re-rating of all 184 quotes: "What is truth?" and "I do not know the
Man!" were both sitting at 3, because the raters judged the verse rather than
the speaker. A famous verse with an obvious speaker is EASY; a famous verse
whose speaker is minor is hard. Put that sentence in the brief if a third batch
is ever drafted.

The re-rating moved 76 of 184, mostly downward (38 from 3 to 2, 26 from 2 to 1),
and took the mix from 17/39/44 to 32/45/23. A round of twenty now opens with
about six easy puzzles and ends with a run of five hard ones, where before it
was two and twelve. Each Tagalog variant follows the English quote it was built
from, matched on chapter and verse, so a line cannot be easy in one language
and hard in the other.

**What has been asked persists between sessions, and only the game master can
clear it.** The in-memory set lasted one evening, so a reload started the deck
again - useless for a programme that meets weekly. It is now in localStorage,
keyed per deck, written after every round.

A puzzle is marked when it REACHES THE SCREEN, not when the round is drawn.
The first attempt marked the whole round on draw, so starting a round of twenty
and playing one puzzle burned the other nineteen for good - the count jumped by
a round instead of by one, which is how it was spotted.

`R` therefore hands nothing back: the puzzles a round never reached were never
marked. And the clear control lives on the game master page, behind the sign-in
and behind a second confirming tap - it was on the start screen first, which put
weeks of progress one stray click away on a laptop in a room full of people.

**Every page has a way back to where you came from.** In a game: the start
screen of that same game, and then all games. On the game master page: straight
to the game whose answers are on screen. "All games" alone meant leaving the
game entirely to change a round length, then hunting for the card again.

**Starting is a button, not a click anywhere.** The host element advances the
game on click and the start screen inherited that, so a stray tap launched the
round before anyone was ready.

**A clue is one image, not a biography.** The first drafts described the person
instead of hinting at them - Zacharias was "a priest burning incense who argued
with an angel and was struck silent for months", which is three identifying
facts stacked, any one of which gets you there. It is now "he wrote the baby's
name on a tablet, because he still could not speak": one image, and the room has
to take the step itself.

40 of 184 were tightened on that rule and 144 left alone, because not every long
clue is bad - Jael's "she offered milk and a blanket, then reached for a hammer
and a tent peg" is one scene with a turn in it, and works. Difficulty-3 clues
were mostly protected: for Tertullus or Claudius Lysias the clue is the only
route to the name, and a hall left silent is worse than a clue that gives too
much.

**Difficulty means fame, not theology.** 1 is a line the room shouts before you
finish reading it; 3 needs the clue. The running order ramps ascending, so each
round warms up. Note what that does NOT do: the round's 20 are picked at random
from what is fresh and then ramped, so the evening as a whole does not ramp — a
famous line can turn up in round 3, and round 3 still opens with its easiest.
That was considered and kept: a round of 20 hard ones with no warm-up is worse.

**A quote with no text is dormant, not broken.** Same rule as a variant whose
picture is missing: never drawn, waiting. It is what lets the Tagalog half of
the deck ship complete except the copyrighted line. It is also a rule with a
scar — before it existed, a Tagalog scaffold was drawn in a test round and
painted the word "null" across the projector.

**Tagalog is back, for the quote game only.** It was removed from Bible Book
Names deliberately and that still stands: there, a Tagalog book changed the
puzzle itself, because Santiago is not "Jam + S" and the pictures stopped
working. Here a Tagalog quote is another line by the same person, which is what
a variant already is. Language sits on the VARIANT, with its own answer, so
PEDRO and PETER are one puzzle and one game-master row.

**Noah is not in the quote deck.** His only substantial recorded speech is
Genesis 9:25, the curse of Canaan — obscure as a quotation and the verse abused
for centuries to justify slavery. It does not belong on a screen in front of a
youth programme, and his fame is in what he did rather than anything he said.

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

**Two future games are listed on the front page, greyed out**: Old or New? and
Bible Character Names. Finish the Verse was removed — Who Said It? does the
same job better. The character game is built and wired but its deck is empty
until it has pictures; its start screen says so rather than failing.

**Who Said It? is drafted, not verified.** All 113 quotes carry
`flag: 'unverified'` until a human has compared the wording to an NKJV Bible.
`validate.js` prints the count, the game master page tags them, and the manager
clears them one tick at a time. This is the one open item that must be closed
before it is played in a service — misquoting scripture aloud in church is the
error in this game that actually matters.

**Who Said It? holds 138 people: 184 English quotes and 138 Tagalog.** Twelve
rounds of 20 in English, seven in Tagalog, none repeating.

It was built in two passes, and the second pass taught something worth keeping:
**the answer has to be a NAME.** With the famous named speakers used up, the
drafting agents reached for people the Bible does not name — "the nobleman whose
son was dying", "the mourners at Lazarus' tomb", "the servant girl in the
courtyard". Fourteen of eighty-five drafted were cut on that basis, plus a
second centurion and a second Herod that collided with entries already there,
and the demon-possessed man whose line is "My name is Legion" — which answers
itself. If a third pass is ever drafted, put that rule in the brief.

**Tagalog is playable, in Ang Dating Biblia (1905).**

The text was FETCHED from a public API, not written from memory. That
distinction is the whole reason there is Tagalog scripture in this repository
at all — drafted Tagalog scripture would have been guesswork on a screen in
church. Every line was then cut out of its verse by hand, because ADB wraps
speech in narration that usually names the speaker ("At sinabi ni Ruth, …"),
and each one was checked to be a genuine substring of the verse it came from
before it was written.

It is **not** Magandang Balita Biblia, which was the original preference. MBB
is the Philippine Bible Society's and is not available from a public source.
ADB is public domain, and reads like KJV does in English — "Dios" not "Diyos",
older grammar. Any line can be replaced with MBB in the manager one at a time;
if that is ever done across the deck, the `credits.fil` field must become the
PBS notice, which is left in a comment beside it.

Everything is still flagged unverified, in both languages.

---

**The repository is public and published on GitHub Pages.** It started private
— Pages on a private repo needs a paid plan — and was made public deliberately
so the site could be served. Two consequences that cannot be undone: the brand
imagery in `images/` is public, and git history is permanent.

**The game master credentials are in this repository's history.** They were
`GM` / `Adventist` when they were committed, and rotating them now does not
remove them from the history of a public repo. `tools/gm-hash.js` generates a
new hash for `gm-config.js`. Treat the view as "not on the projector" rather
than as secure, which is all it was ever meant to be.

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
open gm.html                                     # the Game Master view
node tools/validate.js games/book-names/deck.js   # check the deck after editing
node --test tests/                                # 108 tests
node tools/gm-hash.js GM Adventist                # new Game Master credentials
```

If a picture you just added doesn't appear, **hard-reload** — the browser caches
`deck.js`, and that has already caused one false alarm.
