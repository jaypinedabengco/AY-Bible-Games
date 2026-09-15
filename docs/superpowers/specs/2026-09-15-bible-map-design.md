# A map of the Bible world, and the games it makes possible

Design, 15 September 2026.

Two games, staged, sharing one map component: **Name the Place** first, **Trace
the Journey** second. This spec covers the shared map and the first game in
full; the second is sketched only far enough to prove the map is shaped to
carry it.

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

## The map extent

**The Holy Land** — roughly lon 33.4–36.9, lat 30.3–34.0. Dan to Beersheba,
coast to Moab.

The whole-Bible-world extent was considered for stage 1 and rejected: at 3,000
miles across, Jerusalem and Bethlehem are the same dot, so stage 1 would get
materially worse in order to make stage 2 easier. Staging exists precisely to
avoid that trade — stage 2 gets its own wider extent, which costs a data file
and no code.

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

## Component 1 — `core/atlas.js`

```js
BibleGames.atlas = {
  extents: { holyland: { …bbox, geometry, furniture… } },
  project: function (extent, lon, lat) { return { x: …, y: … }; },
  draw:    function (extent) { /* → a detached <svg> element */ },
};
```

**The extent is a parameter, not a constant.** That single decision is what
makes a second map a data file rather than a rewrite.

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
needs no new mechanism.

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
4   JERICHO  /  JERICO
```

Four beats, matching the quote-shaped games, with the map visible throughout
because the pin *is* the question.

`views.js` gains a `map` type whose `stages` is `1 + (verse ? 1 : 0) +
(clue ? 1 : 0)` — the expression the `quote` type already uses, so a place
whose clue is not written yet simply has fewer beats. The view carries
`extent`, `at: [lon, lat]`, and the usual `verse` / `clue` / `answered`.

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

Alongside that:

- every place's coordinates match `places.json`
- no clue names its own place, in either language
- no clue names another place in the deck
- the committed deck is what the generator produces
- pin separation is measured, with close pairs reported
- projection round-trips within tolerance
- `gm.html` registers the new deck — `tests/pages.test.js` fails otherwise, as
  it has caught twice before

And a mutation test: move one place into the sea, confirm the suite goes red,
restore.

## Stage 2, sketched only

**Trace the Journey** — a route draws itself one leg at a time, and the room
names the journey. Abraham from Ur, the Exodus, Paul's voyages. It needs a
second, wider extent and a `journeys.json`, and it reuses `core/atlas.js`
untouched: the legs are appended to the same `.pins` group the pin game uses.

Its own risk, not solved here: **route legs are argued about far more than city
locations are.** The Exodus route in particular has several reconstructions. It
gets its own exclusion list and its own design pass.

## What this deliberately does not do

- No borders, no provinces, no tribal allotments.
- No relief data. The hill country is a few strokes, honest about being an
  impression rather than a survey.
- No deck-manager tab. The manager exists to source pictures and paste
  scripture, and this deck has neither; a coordinate is edited in
  `places.json` and regenerated.
- No click-the-place variant. The engine's whole interaction model is one
  person driving with a spacebar.
