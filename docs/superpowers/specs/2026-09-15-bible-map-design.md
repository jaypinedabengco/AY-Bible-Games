# A map of the Bible world, and the games it makes possible

Design, 15 September 2026.

Two games, staged, sharing one map component over **two extents** — a close map
of the Holy Land and a wide one of the whole Bible world. **Name the Place**
first, **Trace the Journey** second. This spec covers the map and the first
game in full; the second is sketched only far enough to show it needs no map
work of its own.

## Why SVG, and not Canvas

Asked and answered with a throwaway probe before anything was designed. SVG,
for four reasons that are all specific to this project rather than general
preference.

- **It is vector.** Every size in this repository is in `vmin` precisely
  because nobody knows what the projector's resolution will be. Canvas
  rasterises at one size and needs a redraw loop on resize.
- **It is CSS.** The map uses `--bg`, `--accent`, `--dim` — the same custom
  properties as every game. Canvas colours would live in JavaScript, outside
  the stylesheet, and the theme would have two half-truths in it.
- **Hit-testing is free**, should a click-the-place variant ever be wanted.
  Canvas needs hand-written point-in-polygon for that.
- **It diffs.** A coastline is a list of coordinates in a file, so a wrong
  place is correctable and reviewable like any other line of code.

Canvas wins for thousands of moving objects. This is a few dozen dots.

## Where the geography comes from

**Natural Earth**, which is public domain with no attribution required — it is
credited anyway, because that is how this project treats its sources.

The probe clipped `ne_10m_coastline`, `ne_10m_lakes` and
`ne_10m_rivers_lake_centerlines` to the Holy Land window and simplified them
with Douglas-Peucker at about 400 m, which is far finer than a projector can
show. The result was **76 coastline points, both lakes, the Jordan's real
meanders — 3.5 KB**, baked into a plain `<script>` tag. Nothing is fetched at
runtime, so the USB-stick requirement is untouched.

The same tool clips the wide extent from the same three files at a coarser
tolerance. That file will be bigger — the Mediterranean, Red Sea and Persian
Gulf coastlines plus the Nile, Euphrates and Tigris — but it is measured and
committed, not fetched, so its only cost is repository size.

Natural Earth's coastline arrives **split by country**, which the probe found
the hard way: the Levant came back as three separate runs that had to be
chained back into one line before it could be filled. The generator does that
chaining with a gap tolerance and refuses to join runs further apart than it,
so two genuinely different coasts are never welded together.

A real map *image* was considered and rejected. Almost every modern Bible atlas
map is copyrighted; the pre-1929 public-domain ones have **labels printed on
them**, which ends a name-the-place game; and a raster cannot be themed,
animated, or kept crisp at an unknown size.

### Two findings from the probe that shape the design

**Real data is modern data, and the Bible world is not modern.** The Dead Sea
came back as *two separate polygons* — the lake split in the 1970s and is still
shrinking. An ancient map should show one body, so the two basins are merged.
This is not a one-off: it becomes a standing rule that where the modern
landscape differs from the ancient one, the code says which was drawn and why.
Coastlines have barely moved; lakes have.

**Natural Earth knows the peaks by their modern names.** Hermon arrives as
*Jabal ash Shaykh*; there is no Carmel, Tabor, Nebo or Gerizim. So the
mountains are hand-placed at real coordinates — which is correct, because
deciding that Carmel matters and Meron does not is an editorial judgement, not
a survey. The division holds generally: **geometry comes from data, judgement
comes from us.**

## The map extents — two of them

| | window | holds |
|---|---|---|
| `holyland` | lon 33.4–36.9, lat 30.3–34.0 | Dan to Beersheba, coast to Moab |
| `bibleworld` | lon 11.2–47.5, lat 26.5–42.8 | Rome to Ur, Upper Egypt to Ararat |

The wide window was originally lon 11.5–47.5, lat 26.5–42.5. It was nudged
0.3° north and west because Rome — its most north-westerly place — projected
close enough to the corner that its pin halo was clipped by the viewBox, and a
half-drawn halo reads from a hall as a smudge in the corner rather than a dot
on a place. The rule is now a test (`every pin clears the edge of its map by a
whole halo`), and that test dictates the window: when a new place fails it, the
window moves, because moving the coordinate would put the pin somewhere the
place is not.

A single extent was the original design and it was wrong. Checked against
twenty-nine well-known places, the Holy Land window holds fourteen — Jerusalem,
Bethlehem, Nazareth, Jericho, Capernaum, Joppa, Beersheba, Gaza, Tyre, Sidon,
Damascus, Hermon, Dan, Petra — and leaves out **fifteen**: Egypt entirely,
Babylon, Nineveh, Ur, Haran, Sinai, Ararat, Antioch, Tarsus, Ephesus, Athens,
Corinth and Rome. A deck built on it would have no Exodus, no exile, no Jonah at
Nineveh, no Abraham leaving Ur, and none of Paul's world — roughly half the
recognisable place-names in scripture.

Widening the single map does not fix it either: across 3,000 miles Jerusalem and
Bethlehem are the same dot, so the close questions become unanswerable to buy
the far ones.

So both, and **each place is asked on the tightest map that contains it.**
Jerusalem is only ever asked close-up, where it is a distinct dot; Babylon is
only ever asked wide. The generator decides from the coordinates, so nobody has
to remember, and no puzzle can be set on a map that cannot show it.

This costs a second Natural Earth clip and a second furniture list. It costs no
new code, because `draw(extent)` already took the extent as a parameter — a
decision made for stage 2 that turned out to be what stage 1 needed.

**The simplification tolerance is per-extent**, derived from how many degrees
one screen unit covers. The close map simplifies at about 400 m; the wide map
can go far coarser, because a metre of coastline detail is invisible at that
scale and the file would otherwise be an order of magnitude bigger for nothing.

**The wide map carries a locator**: a faint rectangle showing where the close
map sits. Without it the two read as two unrelated pictures instead of one world
at two zooms, and the room has to re-orient from scratch every time the scale
changes mid-round.

## Labelling

**The big water only: `THE GREAT SEA` and `THE JORDAN`.**

Four policies were rendered side by side and looked at. Nothing named leaves a
room unable to tell what it is looking at. A full atlas ends the game — the
room reads the answer off the map. Naming the water *and* the regions reads
best of all, but it retires the Sea of Galilee and the Dead Sea, which are two
of the strongest answers in the deck.

The consequence of choosing the sparse option is that **the clue beat carries
more weight**, and the deck should open with places findable from the coast and
the Jordan alone — Jerusalem, Bethlehem, Jericho, Nazareth — before its harder
tail.

**The wide map needs more furniture, and that costs answers.** Egypt and
Mesopotamia are unrecognisable without their rivers, so `bibleworld` labels
`THE GREAT SEA`, `THE NILE` and `THE EUPHRATES`. Unlike the Great Sea and the
Jordan, the Nile and the Euphrates are plausible puzzle answers — so labelling
them retires them, and that is a deliberate trade recorded here rather than
discovered later. Nothing else on the wide map is named: not Egypt, not
Babylonia, not Asia Minor, and no borders on either map.

## Component 1 — `core/atlas.js`

```js
BibleGames.atlas = {
  extents: {
    holyland:   { …bbox, geometry, furniture… },
    bibleworld: { …bbox, geometry, furniture, locator: 'holyland'… },
  },
  project: function (extent, lon, lat) { return { x: …, y: … }; },
  draw:    function (extent) { /* → a detached <svg> element */ },
  fits:    function (lon, lat) { /* → the tightest extent containing it */ },
};
```

**The extent is a parameter, not a constant.** That single decision is what
made the second map a data file rather than a rewrite — and it was needed a
whole stage earlier than it was designed for.

**`fits` is the only place the tightest-map rule lives.** It takes a coordinate
and returns the smallest extent containing it. The generator calls it to assign
each place its map; a test calls it to check the assignment; nothing else needs
to know the rule exists.

**Projection** is equirectangular with a `cos(midLat)` squeeze on longitude.
Correct enough at this scale, and cheap to invert if a click-the-place variant
is ever wanted.

**`draw` returns an element, not a string.** It builds layers in z-order — sea,
land, hills, lakes, river, furniture labels — and ends with an empty
`<g class="pins">` for the caller to fill. This is the hinge of the whole
design: the pin game appends one dot and the journey game appends legs, and the
atlas knows about neither.

**Hand-written module, generated data.** `core/atlas.js` is written by a
person. `core/atlas-holyland.js` is emitted by `tools/make-atlas.js` and
assigns `atlas.extents.holyland`. Same split as `chronology.json` and its deck,
for the same reason.

**Furniture lives in the extent data**, each label with its own coordinates and
a `label_fil` beside it, so a different map names different things and Tagalog
needs no new mechanism. An extent may also carry `locator`, naming another
extent whose window it draws as a faint rectangle.

**Two rules in the module header.** No borders, ever — they differ by era, and
political lines on the modern Levant are not something this projector should
draw. And where the modern landscape differs from the ancient one, say which
was drawn and why.

**The atlas never learns what a puzzle is.** It draws a map and projects
coordinates. That boundary is the reason stage 2 reuses it untouched.

## Component 2 — the `map` renderer

```
1   [ a dot pulses, west of the Dead Sea ]
2   JOSHUA 6:20
3   the walls fell down flat
4   J _ _ _ _ _ _
5   JERICHO  /  JERICO
```

Five beats, with the map visible throughout because the pin *is* the question.

**The fourth beat is the first letter with the rest masked** — the move a host
makes when a room is stuck, and the natural last nudge before giving it away.
It costs no deck content, because the mask is DERIVED from the answer: each
word keeps its first character and every other letter becomes an underscore,
spaces preserved. `THE DEAD SEA` becomes `T__ D___ S__`. The letter count is
part of the hint, so runs are never collapsed.

Deriving it also means it works in both languages for nothing, and it must be
derived from the VARIANT's answer rather than the puzzle's — JERICO masks to
`J_____`, not to JERICHO's `J______`. That is the same variant-versus-puzzle
trap that produced an English badge on a Tagalog round, twice.

`views.js` gains a `map` type whose `stages` is `1 + (verse ? 1 : 0) +
(clue ? 1 : 0) + 1` — the `quote` type's expression, so a place whose clue is
not written yet simply has fewer beats, plus one for the mask, which is always
available because it needs nothing from the deck. The view carries `extent`,
`at: [lon, lat]`, `masked`, and the usual `verse` / `clue` / `answered`.

Unlike `order`, this renderer **keeps `answerBlock`**: a place name is a
shoutable answer, so the existing bilingual pairing yields JERICHO / JERICO
through `otherName` with no new code.

`paint.js` gains a branch that asks the atlas for the map, appends it, projects
`at` into the `.pins` group, then adds the reveal lines beneath. The layout
constraint is that the map must not be pushed off screen as lines accumulate,
so the SVG is capped at **`max-height: 58vh`** and the text block takes what is
left. That number is a starting point to be checked on a screen, not a
derivation — the reveal grows by three lines and all four beats have to fit
without the map moving.

## Component 3 — the places deck

`tools/places.json` → `tools/make-name-the-place.js` →
`games/name-the-place/deck.js`. One puzzle per place, with an English and a
Tagalog variant, exactly as Who Did It? and What Came First? are built.

```json
{
  "id": "jericho", "kind": "city",
  "label": "JERICHO", "label_fil": "JERICO",
  "at": [35.44, 31.87],
  "verse": "Joshua 6:20",
  "clue": "the walls fell down flat",
  "clue_fil": "gumuho ang pader",
  "difficulty": 1
}
```

**No `extent` field.** It would be a second source of truth for something the
coordinates already determine, and the failure it invites is the worst kind: a
place tagged `holyland` whose coordinates are in Mesopotamia draws a map with
no pin visible on it. The generator asks `atlas.fits` and writes the answer
into the deck.

Difficulty is how *findable* the place is, not how famous: coastal and
well-known is 1, inland and known is 2, obscure is 3.

### The accuracy rule

**The location must not be seriously disputed.** That excludes Mount Sinai
outright — several rival mountains, no consensus — along with Cana, Emmaus,
Bethsaida, Ai and the Mount of Beatitudes. Excluded places are recorded with
their reasons in `places.json`, as `chronology.json` and `numbers.json` already
do.

### The rule the map invents

**Two places must be far enough apart that their pins are visibly different
dots.** Jerusalem and Bethlehem are eight kilometres apart, about 2% of this
extent's width. That is the map's version of two rows printing the same date:
the screen asserts a distinction the room cannot see. Close pairs stay in the
deck only if their clues stand alone without the map.

Made concrete: the viewBox is 1000 units wide and a pin is about 8 units
across, so **any two places whose projected centres are within 20 units** — on
this extent roughly 7 km — are reported by a test. Reported, not rejected:
Jerusalem and Bethlehem are both too good to lose, and their clues do stand
alone. The test exists so that the next close pair is a decision somebody makes
rather than one that happens quietly.

### Carried over unchanged

Nothing shown before the answer may contain the answer, in either language; and
nothing shown may point harder at a different place in the deck — a clue about
Jesus' ministry is as much Capernaum as Nazareth.

## Testing

**A city must be on land.** This is the strongest guard available and the
reason it matters most: a transposed latitude and longitude puts Jericho in the
Mediterranean, and nothing else in the system would notice — not the validator,
not a reader, not a glance at the deck file. Point-in-polygon against the
coastline catches it.

The exemption is driven by `kind`, which is one of `city`, `mountain`, `water`
or `region`. A `city` or a `mountain` must be on land; a `water` place may be
in water and is checked the other way round — the Sea of Galilee failing to be
inside its own lake would be just as wrong. `region` is unconstrained, since a
region's pin is a placed label rather than a point that means anything.

The test runs against **the coastline of the place's own extent**, not a
global one. That matters: the wide map's coastline is simplified far more
coarsely, so a coastal city like Joppa can sit a pixel out to sea there while
being correctly inland on the close map. Testing Joppa against the wide
coastline would fail it for a rounding error in data it is never drawn on.

Alongside that:

- every place's coordinates match `places.json`
- every place is on the tightest extent that contains it, per `atlas.fits`
- no place falls outside BOTH extents — a silent way to lose a puzzle
- no clue names its own place, in either language
- no clue names another place in the deck
- the committed deck is what the generator produces
- pin separation is measured per extent, with close pairs reported
- projection round-trips within tolerance, on both extents
- the wide map's locator rectangle matches the close map's actual window
- `gm.html` registers the new deck — `tests/pages.test.js` fails otherwise, as
  it has caught twice before

And a mutation test: move one place into the sea, confirm the suite goes red,
restore.

## Stage 2, sketched only

**Trace the Journey** — a route draws itself one leg at a time, and the room
names the journey. Abraham from Ur, the Exodus, Paul's voyages.

It now needs **no map work at all.** `bibleworld` was built for stage 1, so
stage 2 is a `journeys.json` and a renderer branch that appends legs to the
same `.pins` group the pin game uses. That is the whole return on deciding the
extent was a parameter.

Its own risk, not solved here: **route legs are argued about far more than city
locations are.** The Exodus route in particular has several reconstructions. It
gets its own exclusion list and its own design pass.

## What this deliberately does not do

- No borders, no provinces, no tribal allotments.
- No relief data. The hill country is a few strokes, honest about being an
  impression rather than a survey — and on the wide map, not even that.
- No third extent. Two is the answer to "close enough to see Bethlehem, wide
  enough to reach Ur"; a third would be a zoom control, and this engine is
  driven by one person with a spacebar.
- No deck-manager tab. The manager exists to source pictures and paste
  scripture, and this deck has neither; a coordinate is edited in
  `places.json` and regenerated.
- No click-the-place variant. The engine's whole interaction model is one
  person driving with a spacebar.
