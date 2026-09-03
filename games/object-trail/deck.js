/*
 * The Object Trail - the deck.
 *
 * Objects from one Bible story appear a step at a time, getting easier, and
 * the room shouts whose story it is. At the reveal they see the name and which
 * verse each object came from.
 *
 *   answer     the person, revealed last
 *   items      the STEPS, vaguest first. One step per click.
 *              Each step is { verse, pictures: [ { word, img } ] }.
 *   variants   several trails for one person; one is drawn per round, so the
 *              same person can come up again later looking completely
 *              different.
 *
 * THREE THINGS TO KNOW BEFORE EDITING THIS FILE
 *
 * 1. A step is a ROW of objects, and pairing is how a step is aimed. One
 *    object alone is usually ambiguous: honey is vague, and a lion is Daniel
 *    or David or the one Samson killed. Honey beside a lion is exactly one
 *    story - and neither picture names him.
 *
 * 2. This is NOT a rebus. A rebus picture is a pun and stands for a sound,
 *    which is what made the book game's artwork so hard. A trail picture is a
 *    THING from the story. Honey means honey, so any clear picture of honey
 *    works and can be sourced rather than drawn.
 *
 * 3. The verses print ONLY at the reveal. A reference beside step one names
 *    the book, and the book is very nearly the answer.
 *
 * 4. A trail must point at ITS OWN answer, not at somebody else in this deck.
 *    Checking that no object NAMES the answer is not enough. MARY's trail was
 *    a manger, swaddling cloths and the Cana water jars - every one of them
 *    her son's - so a room shouted JESUS and was more right than the deck. He
 *    absorbs anyone who shares a scene with him, and Elijah and Elisha do the
 *    same to each other. Read a new trail as a whole and ask which name the
 *    room actually calls out.
 *
 * PICTURES ARE OPTIONAL. Written in words first, and playable that way: an
 * object with no `img` shows its word, larger. Add `img` as the pictures are
 * found and nothing else changes. `node tools/manage.js` lists exactly which
 * ones are still missing and lets you drop them in.
 *
 * A .js file assigning a global, not .json: fetch() is blocked on file://, so
 * a JSON deck would work on GitHub Pages and then show a blank screen when
 * opened from a USB stick.
 */
window.DECK = {
  id: 'object-trail',
  title: 'The Object Trail',
  imageDirs: ['images/'],
  idPrefix: 'ot',   // shown on the projector, so it must never hint the answer
  shuffle: true,
  sessionSize: 20,
  languages: ['en'],
  howToPlay: [
    'Objects from one story, a step at a time, getting easier.',
    'The room shouts whose story it is.',
  ],
  puzzles: [
    {
      id: 'ot-01', answer: 'SAMSON', difficulty: 2,
      variants: [
        { type: 'trail', difficulty: 2, items: [
          { verse: 'Judges 14:8', pictures: [
            { word: 'honey', img: 'samson-honey.jpg' },
            { word: 'a lion', img: 'samson-lion.jpg' },
          ] },
          { verse: 'Judges 16:17', pictures: [
            { word: 'long hair', img: 'samson-long-hair.jpg' },
          ] },
          { verse: 'Judges 16:29', pictures: [
            { word: 'two pillars', img: 'samson-pillars.png' },
          ] },
        ] },
        { type: 'trail', difficulty: 2, items: [
          { verse: 'Judges 15:4', pictures: [
            { word: 'burning torches' },
            { word: 'foxes' },
          ] },
          { verse: 'Judges 16:3', pictures: [
            { word: 'a city gate', find: 'a city gate carried away' },
            { word: 'two gateposts' },
          ] },
          { verse: 'Judges 15:15', pictures: [
            { word: 'a jawbone' },
          ] },
        ] },
        { type: 'trail', difficulty: 3, items: [
          { verse: 'Judges 16:7', pictures: [
            { word: 'seven green cords' },
          ] },
          { verse: 'Judges 16:12', pictures: [
            { word: 'new ropes' },
          ] },
          { verse: 'Judges 16:17', pictures: [
            { word: 'a razor' },
          ] },
        ] },
      ],
    },
    {
      id: 'ot-02', answer: 'JOSEPH', difficulty: 2,
      variants: [
        { type: 'trail', difficulty: 2, items: [
          { verse: 'Genesis 37:28', pictures: [
            { word: 'a deep dry pit', img: 'joseph-deep-dry-pit.jpg' },
            { word: 'twenty pieces of silver', img: 'joseph-twenty-pieces-of-silver.jpg' },
          ] },
          { verse: 'Genesis 44:2', pictures: [
            { word: 'a silver cup', img: 'joseph-silver-cup.jpg' },
            { word: 'a sack of grain', img: 'joseph-sack-of-grain.jpg' },
          ] },
          { verse: 'Genesis 37:3', pictures: [
            { word: 'a coat of many colours', img: 'joseph-coat-of-many-colours.jpg' },
          ] },
        ] },
        { type: 'trail', difficulty: 3, items: [
          { verse: 'Genesis 40:16', pictures: [
            { word: 'three baskets', find: 'three white baskets of bread' },
          ] },
          { verse: 'Genesis 39:12', pictures: [
            { word: 'a garment', find: 'a garment left in a woman\'s hand' },
          ] },
          { verse: 'Genesis 41:3', pictures: [
            { word: 'seven fat cows' },
            { word: 'seven thin cows' },
          ] },
        ] },
      ],
    },
    {
      id: 'ot-03', answer: 'NOAH', difficulty: 1,
      variants: [
        { type: 'trail', difficulty: 1, items: [
          { verse: 'Genesis 6:14', pictures: [
            { word: 'wooden planks', img: 'noah-wooden-planks.jpg' },
            { word: 'black pitch', img: 'noah-black-pitch.jpg' },
          ] },
          { verse: 'Genesis 8:11', pictures: [
            { word: 'a dove', img: 'noah-dove.png' },
            { word: 'an olive leaf', img: 'noah-olive-leaf.jpg' },
          ] },
          { verse: 'Genesis 9:13', pictures: [
            { word: 'a rainbow', img: 'noah-rainbow.jpg' },
          ] },
        ] },
        { type: 'trail', difficulty: 2, items: [
          { verse: 'Genesis 9:20', pictures: [
            { word: 'a vineyard' },
          ] },
          { verse: 'Genesis 8:4', pictures: [
            { word: 'a great boat resting', find: 'a great boat resting on a mountain' },
          ] },
          { verse: 'Genesis 6:19', pictures: [
            { word: 'animals walking', find: 'animals walking in two by two' },
          ] },
        ] },
      ],
    },
    {
      id: 'ot-04', answer: 'MOSES', difficulty: 1,
      variants: [
        { type: 'trail', difficulty: 1, items: [
          { verse: 'Exodus 2:3', pictures: [
            { word: 'a basket of reeds', img: 'moses-basket-of-reeds.jpg' },
            { word: 'tall river reeds', img: 'moses-tall-river-reeds.jpg' },
          ] },
          { verse: 'Exodus 3:2', pictures: [
            { word: 'a bush on fire', img: 'moses-bush-on-fire.jpg' },
          ] },
          { verse: 'Exodus 31:18', pictures: [
            { word: 'two stone tablets', img: 'moses-stone-tablets.jpg' },
          ] },
        ] },
        { type: 'trail', difficulty: 2, items: [
          { verse: 'Numbers 21:9', pictures: [
            { word: 'a bronze snake', find: 'a bronze snake on a pole' },
          ] },
          { verse: 'Exodus 8:6', pictures: [
            { word: 'frogs everywhere' },
          ] },
          { verse: 'Exodus 4:3', pictures: [
            { word: 'a wooden staff' },
            { word: 'a snake' },
          ] },
        ] },
        { type: 'trail', difficulty: 3, items: [
          { verse: 'Exodus 16:14', pictures: [
            { word: 'small white flakes', find: 'small white flakes on the ground' },
          ] },
          { verse: 'Numbers 11:31', pictures: [
            { word: 'quail covering a camp' },
          ] },
          { verse: 'Numbers 20:11', pictures: [
            { word: 'a rock struck', find: 'a rock struck with a rod' },
            { word: 'water gushing out' },
          ] },
        ] },
      ],
    },
    {
      id: 'ot-05', answer: 'DAVID', difficulty: 1,
      variants: [
        { type: 'trail', difficulty: 1, items: [
          { verse: '1 Samuel 17:34', pictures: [
            { word: 'a lion', img: 'david-lion.jpg' },
            { word: 'a bear', img: 'david-bear.jpg' },
            { word: 'a flock of sheep', img: 'david-flock-of-sheep.jpg' },
          ] },
          { verse: '1 Samuel 16:23', pictures: [
            { word: 'a harp', img: 'david-harp.jpg' },
          ] },
          { verse: '1 Samuel 17:40', pictures: [
            { word: 'a sling', img: 'david-sling.avif' },
            { word: 'five smooth stones', img: 'david-smooth-stones.jpg' },
          ] },
        ] },
        { type: 'trail', difficulty: 3, items: [
          { verse: '1 Samuel 24:4', pictures: [
            { word: 'a cut-off corner of a robe' },
          ] },
          { verse: '1 Samuel 26:12', pictures: [
            { word: 'a spear stuck', find: 'a spear stuck in the ground' },
            { word: 'a jug of water' },
          ] },
          { verse: '2 Samuel 12:30', pictures: [
            { word: 'a gold crown' },
          ] },
        ] },
      ],
    },
    {
      id: 'ot-06', answer: 'DANIEL', difficulty: 2,
      variants: [
        { type: 'trail', difficulty: 2, items: [
          { verse: 'Daniel 1:12', pictures: [
            { word: 'a plate of vegetables', img: 'daniel-plate-of-vegetables.jpg' },
            { word: 'a cup of water', img: 'daniel-cup-of-water.jpg' },
          ] },
          { verse: 'Daniel 5:5', pictures: [
            { word: 'a hand writing', img: 'daniel-hand-writing.webp' },
          ] },
          { verse: 'Daniel 6:16', pictures: [
            { word: 'a den of lions', img: 'daniel-den-of-lions.jpg' },
          ] },
        ] },
        { type: 'trail', difficulty: 2, items: [
          { verse: 'Daniel 8:3', pictures: [
            { word: 'a ram with two horns' },
          ] },
          { verse: 'Daniel 7:6', pictures: [
            { word: 'a leopard', find: 'a leopard with four wings' },
          ] },
          { verse: 'Daniel 2:32', pictures: [
            { word: 'a statue', find: 'a statue with a head of gold' },
          ] },
        ] },
      ],
    },
    {
      id: 'ot-07', answer: 'SHADRACH, MESHACH AND ABED-NEGO', difficulty: 1,
      variants: [
        { type: 'trail', difficulty: 1, items: [
          { verse: 'Daniel 3:5', pictures: [
            { word: 'a horn', img: 'shadrach-meshach-and-abed-nego-horn.webp' },
            { word: 'a flute', img: 'shadrach-meshach-and-abed-nego-flute.webp' },
            { word: 'a harp', img: 'shadrach-meshach-and-abed-nego-harp.webp' },
          ] },
          { verse: 'Daniel 3:1', pictures: [
            { word: 'a giant golden statue', img: 'shadrach-meshach-and-abed-nego-giant-golden-statue.jpg' },
          ] },
          { verse: 'Daniel 3:6', pictures: [
            { word: 'a burning furnace', img: 'shadrach-meshach-and-abed-nego-burning-furnace.jpg' },
          ] },
        ] },
      ],
    },
    {
      id: 'ot-08', answer: 'JONAH', difficulty: 1,
      variants: [
        { type: 'trail', difficulty: 1, items: [
          { verse: 'Jonah 1:5', pictures: [
            { word: 'a wooden sailing ship', img: 'jonah-wooden-sailing-ship.png' },
            { word: 'cargo thrown into the sea', img: 'jonah-cargo-thrown-into-the-sea.jpg' },
          ] },
          { verse: 'Jonah 4:6', pictures: [
            { word: 'a leafy gourd vine', img: 'jonah-leafy-gourd-vine.webp' },
          ] },
          { verse: 'Jonah 1:17', pictures: [
            { word: 'a great fish', img: 'jonah-great-fish.jpg' },
          ] },
        ] },
        { type: 'trail', difficulty: 2, items: [
          { verse: 'Jonah 1:7', pictures: [
            { word: 'lots cast', find: 'lots cast on a ship\'s deck' },
          ] },
          { verse: 'Jonah 3:6', pictures: [
            { word: 'a king in sackcloth' },
            { word: 'a heap of ashes' },
          ] },
          { verse: 'Jonah 1:15', pictures: [
            { word: 'a raging sea', find: 'a man thrown into a raging sea' },
          ] },
        ] },
      ],
    },
    {
      id: 'ot-09', answer: 'GIDEON', difficulty: 2,
      variants: [
        { type: 'trail', difficulty: 2, items: [
          { verse: 'Judges 6:11', pictures: [
            { word: 'wheat', img: 'gideon-wheat.webp' },
            { word: 'a winepress', img: 'gideon-winepress.jpg' },
          ] },
          { verse: 'Judges 6:37', pictures: [
            { word: 'a wool fleece', img: 'gideon-wool-fleece.jpg' },
          ] },
          { verse: 'Judges 7:16', pictures: [
            { word: 'a trumpet', img: 'gideon-trumpet.webp' },
            { word: 'a clay pitcher', img: 'gideon-clay-pitcher.avif' },
            { word: 'a lamp', img: 'gideon-lamp.jpg' },
          ] },
        ] },
        { type: 'trail', difficulty: 3, items: [
          { verse: 'Judges 6:19', pictures: [
            { word: 'a young goat' },
            { word: 'unleavened bread' },
          ] },
          { verse: 'Judges 6:28', pictures: [
            { word: 'a broken stone altar' },
            { word: 'a felled wooden pole' },
          ] },
          { verse: 'Judges 7:13', pictures: [
            { word: 'a barley loaf', find: 'a loaf of barley bread rolling into a tent' },
          ] },
        ] },
      ],
    },
    {
      id: 'ot-10', answer: 'ELIJAH', difficulty: 2,
      variants: [
        { type: 'trail', difficulty: 2, items: [
          { verse: '1 Kings 17:6', pictures: [
            { word: 'a raven', img: 'elijah-raven.jpg' },
            { word: 'a loaf of bread', img: 'elijah-loaf-of-bread.avif' },
          ] },
          { verse: '1 Kings 18:33', pictures: [
            { word: 'firewood soaked', img: 'elijah-firewood-soaked.webp' },
            { word: 'four barrels of water', img: 'elijah-four-barrels-of-water.avif' },
          ] },
          { verse: '2 Kings 2:11', pictures: [
            { word: 'a chariot of fire', img: 'elijah-chariot-of-fire.jpg' },
            { word: 'horses of fire', img: 'elijah-horses-of-fire.webp' },
          ] },
        ] },
        { type: 'trail', difficulty: 3, items: [
          { verse: '1 Kings 19:6', pictures: [
            { word: 'a cake baked', find: 'a cake baked on hot coals' },
            { word: 'a jar of water' },
          ] },
          { verse: '1 Kings 17:12', pictures: [
            { word: 'a handful of flour' },
            { word: 'a little jar of oil' },
          ] },
          { verse: '1 Kings 18:44', pictures: [
            { word: 'a small cloud', find: 'a small cloud like a man\'s hand rising over the sea' },
          ] },
        ] },
      ],
    },
    {
      id: 'ot-11', answer: 'ELISHA', difficulty: 3,
      variants: [
        { type: 'trail', difficulty: 3, items: [
          { verse: '2 Kings 4:41', pictures: [
            { word: 'a cooking pot of stew', img: 'elisha-cooking-pot-of-stew.webp' },
            { word: 'a handful of flour', img: 'elisha-handful-of-flour.jpg' },
          ] },
          { verse: '2 Kings 6:6', pictures: [
            { word: 'an iron axe head', img: 'elisha-iron-axe-head.jpg' },
          ] },
          { verse: '2 Kings 2:14', pictures: [
            { word: 'a rolled-up cloak', img: 'elisha-rolled-up-cloak.jpg' },
            { word: 'a river struck with it', img: 'elisha-river-struck-with-it.jpg' },
          ] },
        ] },
        { type: 'trail', difficulty: 3, items: [
          { verse: '2 Kings 4:10', pictures: [
            { word: 'a bed' },
            { word: 'a table' },
            { word: 'a lamp' },
          ] },
          { verse: '2 Kings 4:3', pictures: [
            { word: 'many empty borrowed jars' },
          ] },
          { verse: '2 Kings 4:2', pictures: [
            { word: 'one small pot of oil' },
          ] },
        ] },
      ],
    },
    {
      id: 'ot-12', answer: 'RUTH', difficulty: 3,
      variants: [
        { type: 'trail', difficulty: 3, items: [
          { verse: 'Ruth 4:7', pictures: [
            { word: 'a sandal handed over', img: 'ruth-sandal-handed-over.webp' },
          ] },
          { verse: 'Ruth 3:6', pictures: [
            { word: 'a threshing floor', img: 'ruth-threshing-floor.jpg' },
          ] },
          { verse: 'Ruth 2:17', pictures: [
            { word: 'a heap of gleaned barley', img: 'ruth-heap-of-gleaned-barley.jpg' },
          ] },
        ] },
      ],
    },
    {
      id: 'ot-13', answer: 'ESTHER', difficulty: 2,
      variants: [
        { type: 'trail', difficulty: 2, items: [
          { verse: 'Esther 8:8', pictures: [
            { word: 'a scroll', img: 'esther-scroll.jpg' },
            { word: 'a king\'s signet ring', img: 'esther-king-s-signet-ring.png' },
          ] },
          { verse: 'Esther 5:2', pictures: [
            { word: 'a golden sceptre', img: 'esther-golden-sceptre.jpg' },
          ] },
          { verse: 'Esther 2:17', pictures: [
            { word: 'a royal crown', img: 'esther-royal-crown.png' },
          ] },
        ] },
      ],
    },
    {
      id: 'ot-14', answer: 'ABRAHAM', difficulty: 2,
      variants: [
        { type: 'trail', difficulty: 2, items: [
          { verse: 'Genesis 22:6', pictures: [
            { word: 'firewood', img: 'abraham-firewood.webp' },
            { word: 'a knife', img: 'abraham-knife.jpg' },
          ] },
          { verse: 'Genesis 15:5', pictures: [
            { word: 'stars in the night sky', img: 'abraham-stars-in-the-night-sky.webp' },
          ] },
          { verse: 'Genesis 22:13', pictures: [
            { word: 'a ram caught', img: 'abraham-ram-caught.jpg' },
          ] },
        ] },
        { type: 'trail', difficulty: 3, items: [
          { verse: 'Genesis 18:6', pictures: [
            { word: 'fine flour' },
            { word: 'cakes baked in a hurry' },
          ] },
          { verse: 'Genesis 18:8', pictures: [
            { word: 'butter' },
            { word: 'milk' },
            { word: 'a roasted calf' },
          ] },
          { verse: 'Genesis 18:2', pictures: [
            { word: 'three visitors', find: 'three visitors standing by a tent' },
          ] },
        ] },
      ],
    },
    {
      id: 'ot-15', answer: 'JACOB', difficulty: 2,
      variants: [
        { type: 'trail', difficulty: 2, items: [
          { verse: 'Genesis 25:34', pictures: [
            { word: 'a bowl of red lentil stew', img: 'jacob-bowl-of-red-lentil-stew.jpg' },
            { word: 'a loaf of bread', img: 'jacob-loaf-of-bread.avif' },
          ] },
          { verse: 'Genesis 28:11', pictures: [
            { word: 'a stone pillow', img: 'jacob-stone-pillow.jpg' },
          ] },
          { verse: 'Genesis 28:12', pictures: [
            { word: 'a ladder', img: 'jacob-ladder.jpg' },
          ] },
        ] },
        { type: 'trail', difficulty: 3, items: [
          { verse: 'Genesis 29:2', pictures: [
            { word: 'a well' },
            { word: 'a great stone', find: 'a great stone over its mouth' },
          ] },
          { verse: 'Genesis 30:37', pictures: [
            { word: 'peeled white poplar rods' },
          ] },
          { verse: 'Genesis 30:39', pictures: [
            { word: 'speckled and spotted goats' },
          ] },
        ] },
      ],
    },
    {
      id: 'ot-16', answer: 'JOSHUA', difficulty: 2,
      variants: [
        { type: 'trail', difficulty: 2, items: [
          { verse: 'Joshua 4:20', pictures: [
            { word: 'twelve stones', img: 'joshua-twelve-stones.jpg' },
          ] },
          { verse: 'Joshua 6:4', pictures: [
            { word: 'seven ram\'s-horn trumpets' },
          ] },
          { verse: 'Joshua 6:20', pictures: [
            { word: 'a city wall fallen flat' },
          ] },
        ] },
        { type: 'trail', difficulty: 3, items: [
          { verse: 'Joshua 10:11', pictures: [
            { word: 'huge hailstones' },
          ] },
          { verse: 'Joshua 10:27', pictures: [
            { word: 'great stones', find: 'great stones rolled over a cave mouth' },
          ] },
          { verse: 'Joshua 10:13', pictures: [
            { word: 'the sun standing still' },
            { word: 'the moon' },
          ] },
        ] },
      ],
    },
    {
      id: 'ot-17', answer: 'RAHAB', difficulty: 3,
      variants: [
        { type: 'trail', difficulty: 3, items: [
          { verse: 'Joshua 2:6', pictures: [
            { word: 'stalks of flax' },
            { word: 'a flat rooftop' },
          ] },
          { verse: 'Joshua 2:15', pictures: [
            { word: 'a rope', find: 'a rope hanging from a window' },
          ] },
          { verse: 'Joshua 2:18', pictures: [
            { word: 'a scarlet cord' },
          ] },
        ] },
      ],
    },
    {
      id: 'ot-18', answer: 'SOLOMON', difficulty: 2,
      variants: [
        { type: 'trail', difficulty: 2, items: [
          { verse: '1 Kings 10:10', pictures: [
            { word: 'sacks of spices' },
            { word: 'gold' },
            { word: 'precious stones' },
          ] },
          { verse: '1 Kings 10:18', pictures: [
            { word: 'an ivory throne', find: 'an ivory throne overlaid with gold' },
          ] },
          { verse: '1 Kings 6:22', pictures: [
            { word: 'a temple covered', find: 'a temple covered in gold' },
          ] },
        ] },
        { type: 'trail', difficulty: 2, items: [
          { verse: '1 Kings 10:22', pictures: [
            { word: 'ivory tusks' },
            { word: 'apes' },
            { word: 'peacocks' },
          ] },
          { verse: '1 Kings 3:24', pictures: [
            { word: 'a drawn sword' },
          ] },
          { verse: '1 Kings 3:25', pictures: [
            { word: 'a living baby' },
          ] },
        ] },
      ],
    },
    {
      id: 'ot-19', answer: 'NEHEMIAH', difficulty: 3,
      variants: [
        { type: 'trail', difficulty: 3, items: [
          { verse: 'Nehemiah 2:13', pictures: [
            { word: 'broken-down city walls' },
            { word: 'burnt city gates' },
          ] },
          { verse: 'Nehemiah 2:1', pictures: [
            { word: 'a king\'s cup of wine' },
          ] },
          { verse: 'Nehemiah 4:17', pictures: [
            { word: 'a load of building stones' },
            { word: 'a sword' },
          ] },
        ] },
      ],
    },
    {
      id: 'ot-20', answer: 'NAAMAN', difficulty: 3,
      variants: [
        { type: 'trail', difficulty: 3, items: [
          { verse: '2 Kings 5:5', pictures: [
            { word: 'bags of silver' },
            { word: 'changes of fine clothing' },
          ] },
          { verse: '2 Kings 5:6', pictures: [
            { word: 'a sealed letter to a king' },
          ] },
          { verse: '2 Kings 5:14', pictures: [
            { word: 'a muddy river' },
          ] },
        ] },
      ],
    },
    {
      id: 'ot-21', answer: 'EZEKIEL', difficulty: 3,
      variants: [
        { type: 'trail', difficulty: 3, items: [
          { verse: 'Ezekiel 1:16', pictures: [
            { word: 'a wheel within a wheel' },
          ] },
          { verse: 'Ezekiel 3:3', pictures: [
            { word: 'a written scroll', find: 'a written scroll being eaten' },
          ] },
          { verse: 'Ezekiel 37:1', pictures: [
            { word: 'a valley of dry bones' },
          ] },
        ] },
      ],
    },
    {
      id: 'ot-22', answer: 'ADAM AND EVE', difficulty: 1,
      variants: [
        { type: 'trail', difficulty: 1, items: [
          { verse: 'Genesis 3:1', pictures: [
            { word: 'a serpent' },
            { word: 'a fruit tree' },
          ] },
          { verse: 'Genesis 3:6', pictures: [
            { word: 'a piece of picked fruit' },
          ] },
          { verse: 'Genesis 3:7', pictures: [
            { word: 'aprons of fig leaves' },
          ] },
        ] },
        { type: 'trail', difficulty: 2, items: [
          { verse: 'Genesis 3:18', pictures: [
            { word: 'thorns' },
            { word: 'thistles' },
          ] },
          { verse: 'Genesis 3:21', pictures: [
            { word: 'coats of animal skin' },
          ] },
          { verse: 'Genesis 3:24', pictures: [
            { word: 'a flaming sword' },
            { word: 'a garden gate' },
          ] },
        ] },
      ],
    },
    {
      id: 'ot-23', answer: 'PETER', difficulty: 1,
      variants: [
        { type: 'trail', difficulty: 1, items: [
          { verse: 'Matthew 4:18', pictures: [
            { word: 'a fishing net' },
          ] },
          { verse: 'Matthew 14:29', pictures: [
            { word: 'a boat on rough water' },
          ] },
          { verse: 'Matthew 26:74', pictures: [
            { word: 'a rooster' },
          ] },
        ] },
        { type: 'trail', difficulty: 1, items: [
          { verse: 'Acts 10:11', pictures: [
            { word: 'a large sheet', find: 'a large sheet let down by its four corners' },
          ] },
          { verse: 'Acts 12:7', pictures: [
            { word: 'chains fallen open' },
            { word: 'a prison door' },
          ] },
          { verse: 'John 18:10', pictures: [
            { word: 'a sword' },
            { word: 'a severed ear' },
          ] },
        ] },
        { type: 'trail', difficulty: 1, items: [
          { verse: 'John 21:9', pictures: [
            { word: 'a charcoal fire', find: 'a charcoal fire on a shore' },
            { word: 'bread' },
            { word: 'fish' },
          ] },
          { verse: 'Matthew 17:27', pictures: [
            { word: 'a coin', find: 'a coin in a fish\'s mouth' },
          ] },
          { verse: 'Matthew 16:19', pictures: [
            { word: 'a set of keys' },
          ] },
        ] },
      ],
    },
    {
      id: 'ot-24', answer: 'PAUL', difficulty: 1,
      variants: [
        { type: 'trail', difficulty: 1, items: [
          { verse: 'Acts 18:3', pictures: [
            { word: 'a half-sewn tent' },
            { word: 'a leather-worker\'s needle' },
          ] },
          { verse: 'Acts 9:25', pictures: [
            { word: 'a large basket', find: 'a large basket lowered from a city wall' },
          ] },
          { verse: 'Acts 9:3', pictures: [
            { word: 'a blinding light', find: 'a blinding light on a road' },
          ] },
        ] },
        { type: 'trail', difficulty: 1, items: [
          { verse: 'Acts 27:41', pictures: [
            { word: 'a ship', find: 'a ship broken on the rocks' },
          ] },
          { verse: 'Acts 28:3', pictures: [
            { word: 'a bundle of firewood' },
            { word: 'a snake' },
          ] },
          { verse: 'Acts 28:20', pictures: [
            { word: 'an iron chain' },
          ] },
        ] },
        { type: 'trail', difficulty: 1, items: [
          { verse: '2 Timothy 4:13', pictures: [
            { word: 'a travelling cloak' },
            { word: 'scrolls and parchments' },
          ] },
          { verse: 'Acts 16:24', pictures: [
            { word: 'wooden stocks', find: 'wooden stocks in a prison' },
          ] },
          { verse: 'Acts 17:23', pictures: [
            { word: 'a stone altar', find: 'a stone altar with an inscription' },
          ] },
        ] },
      ],
    },
    {
      id: 'ot-25', answer: 'JESUS', difficulty: 1,
      variants: [
        { type: 'trail', difficulty: 1, items: [
          { verse: 'Matthew 21:8', pictures: [
            { word: 'cut branches', find: 'cut branches spread across a road' },
          ] },
          { verse: 'Matthew 27:29', pictures: [
            { word: 'a crown of thorns' },
          ] },
        ] },
        { type: 'trail', difficulty: 1, items: [
          { verse: 'Matthew 14:19', pictures: [
            { word: 'five loaves' },
            { word: 'two fish' },
          ] },
          { verse: 'John 19:34', pictures: [
            { word: 'a soldier\'s spear' },
          ] },
          { verse: 'John 19:17', pictures: [
            { word: 'a wooden cross' },
          ] },
        ] },
      ],
    },
    {
      id: 'ot-26', answer: 'JOHN THE BAPTIST', difficulty: 1,
      variants: [
        { type: 'trail', difficulty: 1, items: [
          { verse: 'Matthew 3:4', pictures: [
            { word: 'a garment of camel\'s hair' },
            { word: 'a leather belt' },
          ] },
          { verse: 'Mark 1:6', pictures: [
            { word: 'locusts' },
            { word: 'a jar of wild honey' },
          ] },
          { verse: 'Matthew 14:11', pictures: [
            { word: 'a head on a platter' },
          ] },
        ] },
        { type: 'trail', difficulty: 1, items: [
          { verse: 'Matthew 3:10', pictures: [
            { word: 'an axe', find: 'an axe laid at the root of a tree' },
          ] },
          { verse: 'Matthew 3:12', pictures: [
            { word: 'a winnowing fan' },
            { word: 'a threshing floor' },
          ] },
          { verse: 'Mark 1:5', pictures: [
            { word: 'the Jordan river' },
          ] },
        ] },
      ],
    },
    {
      id: 'ot-27', answer: 'JUDAS', difficulty: 1,
      variants: [
        { type: 'trail', difficulty: 1, items: [
          { verse: 'John 12:6', pictures: [
            { word: 'a money box' },
          ] },
          { verse: 'Matthew 26:15', pictures: [
            { word: 'thirty silver coins' },
          ] },
          { verse: 'Matthew 27:5', pictures: [
            { word: 'silver coins', find: 'silver coins scattered on a temple floor' },
          ] },
        ] },
        { type: 'trail', difficulty: 1, items: [
          { verse: 'John 13:26', pictures: [
            { word: 'a piece of bread dipped', find: 'a piece of bread dipped in a dish' },
          ] },
          { verse: 'John 18:3', pictures: [
            { word: 'lanterns and torches', find: 'lanterns and torches in an olive grove' },
          ] },
          { verse: 'Matthew 27:7', pictures: [
            { word: 'a potter\'s field' },
            { word: 'a lump of clay' },
          ] },
        ] },
      ],
    },
    {
      id: 'ot-28', answer: 'ZACCHAEUS', difficulty: 1,
      variants: [
        { type: 'trail', difficulty: 1, items: [
          { verse: 'Luke 19:8', pictures: [
            { word: 'a bag of coins', find: 'a bag of silver coins counted out' },
          ] },
          { verse: 'Luke 19:4', pictures: [
            { word: 'a sycamore tree', find: 'a sycamore tree beside a road' },
          ] },
        ] },
      ],
    },
    {
      id: 'ot-29', answer: 'THE PRODIGAL SON', difficulty: 1,
      variants: [
        { type: 'trail', difficulty: 1, items: [
          { verse: 'Luke 15:22', pictures: [
            { word: 'a best robe' },
            { word: 'a ring' },
            { word: 'sandals' },
          ] },
          { verse: 'Luke 15:23', pictures: [
            { word: 'a fatted calf' },
          ] },
          { verse: 'Luke 15:16', pictures: [
            { word: 'a pig trough of husks' },
          ] },
        ] },
      ],
    },
    {
      id: 'ot-31', answer: 'THOMAS', difficulty: 2,
      variants: [
        { type: 'trail', difficulty: 2, items: [
          { verse: 'John 20:19', pictures: [
            { word: 'a locked door', find: 'the locked door of an upper room' },
          ] },
          { verse: 'John 20:25', pictures: [
            { word: 'nail wounds', find: 'nail wounds in two hands' },
          ] },
          { verse: 'John 20:27', pictures: [
            { word: 'a reaching hand', find: 'a hand reaching out one finger to touch' },
          ] },
        ] },
      ],
    },
    {
      id: 'ot-32', answer: 'LAZARUS', difficulty: 2,
      variants: [
        { type: 'trail', difficulty: 2, items: [
          { verse: 'John 11:38', pictures: [
            { word: 'a cave mouth', find: 'a cave mouth with a stone against it' },
          ] },
          { verse: 'John 11:44', pictures: [
            { word: 'bound hands and feet' },
            { word: 'a cloth wrapped', find: 'a cloth wrapped around a face' },
          ] },
        ] },
      ],
    },
    {
      id: 'ot-33', answer: 'PILATE', difficulty: 2,
      variants: [
        { type: 'trail', difficulty: 2, items: [
          { verse: 'John 19:13', pictures: [
            { word: 'a stone judgment seat' },
          ] },
          { verse: 'Matthew 27:24', pictures: [
            { word: 'a basin of water' },
            { word: 'wet hands' },
          ] },
        ] },
      ],
    },
    {
      id: 'ot-34', answer: 'STEPHEN', difficulty: 2,
      variants: [
        { type: 'trail', difficulty: 2, items: [
          { verse: 'Acts 7:58', pictures: [
            { word: 'a pile of coats', find: 'a pile of coats laid on the ground' },
          ] },
          { verse: 'Acts 7:59', pictures: [
            { word: 'stones in raised hands' },
          ] },
        ] },
      ],
    },
    {
      id: 'ot-35', answer: 'NICODEMUS', difficulty: 2,
      variants: [
        { type: 'trail', difficulty: 2, items: [
          { verse: 'John 3:2', pictures: [
            { word: 'a small oil lamp', find: 'a small oil lamp carried at night' },
          ] },
          { verse: 'John 19:39', pictures: [
            { word: 'myrrh and aloes', find: 'a heavy bundle of myrrh and aloes' },
          ] },
        ] },
      ],
    },
    {
      id: 'ot-36', answer: 'THE SAMARITAN WOMAN', difficulty: 2,
      variants: [
        { type: 'trail', difficulty: 2, items: [
          { verse: 'John 4:6', pictures: [
            { word: 'a deep well', find: 'a deep stone well at midday' },
          ] },
          { verse: 'John 4:28', pictures: [
            { word: 'a water jar', find: 'a water jar left standing on the ground' },
          ] },
        ] },
      ],
    },
    {
      id: 'ot-37', answer: 'THE GOOD SAMARITAN', difficulty: 2,
      variants: [
        { type: 'trail', difficulty: 2, items: [
          { verse: 'Luke 10:30', pictures: [
            { word: 'an empty road', find: 'an empty road winding down to Jericho' },
          ] },
          { verse: 'Luke 10:35', pictures: [
            { word: 'two silver coins' },
            { word: 'an inn door' },
          ] },
          { verse: 'Luke 10:34', pictures: [
            { word: 'a flask of oil and wine' },
            { word: 'bandages' },
            { word: 'a donkey' },
          ] },
        ] },
      ],
    },
    {
      id: 'ot-38', answer: 'MARY MAGDALENE', difficulty: 3,
      variants: [
        { type: 'trail', difficulty: 3, items: [
          { verse: 'Mark 16:1', pictures: [
            { word: 'jars of burial spices' },
          ] },
          { verse: 'John 20:1', pictures: [
            { word: 'a stone rolled away' },
            { word: 'an open tomb at dawn' },
          ] },
          { verse: 'John 20:15', pictures: [
            { word: 'a weeping woman', find: 'a woman weeping, turning to speak to a gardener' },
            { word: 'a gardener\'s tools' },
          ] },
        ] },
      ],
    },
    {
      id: 'ot-39', answer: 'MARTHA', difficulty: 3,
      variants: [
        { type: 'trail', difficulty: 3, items: [
          { verse: 'John 12:2', pictures: [
            { word: 'a supper table', find: 'a supper table being served in Bethany' },
          ] },
          { verse: 'Luke 10:40', pictures: [
            { word: 'a cooking pot' },
            { word: 'a serving dish' },
          ] },
        ] },
      ],
    },
    {
      id: 'ot-40', answer: 'LYDIA', difficulty: 3,
      variants: [
        { type: 'trail', difficulty: 3, items: [
          { verse: 'Acts 16:13', pictures: [
            { word: 'a riverbank', find: 'a riverbank outside a city gate' },
          ] },
          { verse: 'Acts 16:14', pictures: [
            { word: 'bolts of purple cloth' },
          ] },
          { verse: 'Acts 16:15', pictures: [
            { word: 'an open house door' },
          ] },
        ] },
      ],
    },
    {
      id: 'ot-41', answer: 'JOHN', difficulty: 3,
      variants: [
        { type: 'trail', difficulty: 3, items: [
          { verse: 'Revelation 1:9', pictures: [
            { word: 'a rocky island', find: 'a rocky island in the sea' },
          ] },
          { verse: 'Revelation 1:12', pictures: [
            { word: 'seven golden lampstands' },
          ] },
          { verse: 'Revelation 5:1', pictures: [
            { word: 'a scroll closed', find: 'a scroll closed with seven seals' },
          ] },
        ] },
      ],
    },
    {
      id: 'ot-43', answer: 'PHILIP', difficulty: 3,
      variants: [
        { type: 'trail', difficulty: 3, items: [
          { verse: 'Acts 8:28', pictures: [
            { word: 'a chariot', find: 'a chariot on a desert road' },
          ] },
          { verse: 'Acts 8:30', pictures: [
            { word: 'an open scroll of Isaiah' },
          ] },
          { verse: 'Acts 8:36', pictures: [
            { word: 'a pool of water', find: 'a pool of water beside a road' },
          ] },
        ] },
      ],
    },
    {
      id: 'ot-44', answer: 'DORCAS', difficulty: 3,
      variants: [
        { type: 'trail', difficulty: 3, items: [
          { verse: 'Acts 9:37', pictures: [
            { word: 'a bed in an upper room' },
          ] },
          { verse: 'Acts 9:39', pictures: [
            { word: 'folded tunics and robes' },
          ] },
        ] },
      ],
    },
  ],
};
