/*
 * Name the Place - the deck.
 *
 * GENERATED. Do not edit by hand: run
 *
 *     node tools/make-name-the-place.js
 *
 * after changing tools/places.json, which is the one hand-written thing behind
 * this game and the only place a coordinate should ever be corrected.
 *
 * THE GAME. A dot pulses on a map of the Bible world; the room shouts what
 * place it is. Four beats: the pin, the verse, a clue, the name.
 *
 * WHICH MAP. Each place is asked on the TIGHTEST map that contains it, which
 * the generator reads off the coordinates. Jerusalem is only ever asked
 * close-up, where it is a distinct dot; Babylon is only ever asked on the wide
 * map. There is deliberately no hand-written extent field: it would be a
 * second source of truth for something the coordinates already decide, and
 * the failure it invites is a map drawn with no pin visible on it.
 *
 * THE ACCURACY RULE. The location must not be seriously disputed. Mount Sinai,
 * Cana, Emmaus, Bethsaida and Ai are all left out on exactly that basis - see
 * tools/places.json for the list and the reasons.
 */
window.DECK = {
  id: 'name-the-place',
  title: 'Name the Place',
  idPrefix: 'np',   // shown on the projector, so it must never hint the answer
  shuffle: true,
  sessionSize: 12,
  languages: ['en', 'fil'],
  howToPlay: [
    'A dot appears on the map. The room says what place it is.',
    'Stuck? The next click gives the verse, then a clue.',
  ],
  // No credits and no versions: nothing here is quoted. The clues are ours
  // in both languages, and a coastline belongs to nobody.
  puzzles: [
    {
      id: 'np-01', answer: 'JERUSALEM', difficulty: 1,
      variants: [
        { type: 'map', difficulty: 1,
          extent: 'holyland', at: [35.23, 31.78],
          verse: '2 Samuel 5:7',
          clue: 'David took its stronghold and called it his city' },
        { type: 'map', difficulty: 1, lang: 'fil',
          answer: 'JERUSALEM',
          extent: 'holyland', at: [35.23, 31.78],
          verse: '2 Samuel 5:7',
          clue: 'sinakop ito ni David at tinawag na kaniyang lungsod' },
      ],
    },
    {
      id: 'np-02', answer: 'BETHLEHEM', difficulty: 1,
      variants: [
        { type: 'map', difficulty: 1,
          extent: 'holyland', at: [35.2, 31.7],
          verse: 'Micah 5:2',
          clue: 'little among the thousands of Judah' },
        { type: 'map', difficulty: 1, lang: 'fil',
          answer: 'BETLEHEM',
          extent: 'holyland', at: [35.2, 31.7],
          verse: 'Micah 5:2',
          clue: 'maliit sa mga angkan ng Juda' },
      ],
    },
    {
      id: 'np-03', answer: 'JERICHO', difficulty: 1,
      variants: [
        { type: 'map', difficulty: 1,
          extent: 'holyland', at: [35.44, 31.87],
          verse: 'Joshua 6:20',
          clue: 'the walls fell down flat' },
        { type: 'map', difficulty: 1, lang: 'fil',
          answer: 'JERICO',
          extent: 'holyland', at: [35.44, 31.87],
          verse: 'Joshua 6:20',
          clue: 'gumuho ang pader nito' },
      ],
    },
    {
      id: 'np-04', answer: 'NAZARETH', difficulty: 1,
      variants: [
        { type: 'map', difficulty: 1,
          extent: 'holyland', at: [35.3, 32.7],
          verse: 'Luke 2:39',
          clue: 'can anything good come out of it?' },
        { type: 'map', difficulty: 1, lang: 'fil',
          answer: 'NAZARET',
          extent: 'holyland', at: [35.3, 32.7],
          verse: 'Luke 2:39',
          clue: 'may mabuti bang manggagaling dito?' },
      ],
    },
    {
      id: 'np-05', answer: 'THE SEA OF GALILEE', difficulty: 1,
      variants: [
        { type: 'map', difficulty: 1,
          extent: 'holyland', at: [35.58, 32.8],
          verse: 'Matthew 4:18',
          clue: 'four fishermen were called from this shore' },
        { type: 'map', difficulty: 1, lang: 'fil',
          answer: 'DAGAT NG GALILEA',
          extent: 'holyland', at: [35.58, 32.8],
          verse: 'Matthew 4:18',
          clue: 'apat na mangingisda ang tinawag sa baybaying ito' },
      ],
    },
    {
      id: 'np-06', answer: 'THE DEAD SEA', difficulty: 2,
      variants: [
        { type: 'map', difficulty: 2,
          extent: 'holyland', at: [35.45, 31.45],
          verse: 'Genesis 19:24',
          clue: 'two cities burned at its southern end' },
        { type: 'map', difficulty: 2, lang: 'fil',
          answer: 'DAGAT NA PATAY',
          extent: 'holyland', at: [35.45, 31.45],
          verse: 'Genesis 19:24',
          clue: 'dalawang lungsod ang nasunog sa timog nito' },
      ],
    },
    {
      id: 'np-07', answer: 'JOPPA', difficulty: 2,
      variants: [
        { type: 'map', difficulty: 2,
          extent: 'holyland', at: [34.75, 32.05],
          verse: 'Jonah 1:3',
          clue: 'he paid his fare and sailed the other way' },
        { type: 'map', difficulty: 2, lang: 'fil',
          answer: 'JOPE',
          extent: 'holyland', at: [34.75, 32.05],
          verse: 'Jonah 1:3',
          clue: 'nagbayad siya ng pamasahe at naglayag paurong' },
      ],
    },
    {
      id: 'np-08', answer: 'MOUNT CARMEL', difficulty: 2,
      variants: [
        { type: 'map', difficulty: 2,
          extent: 'holyland', at: [35.05, 32.73],
          verse: '1 Kings 18:38',
          clue: 'fire fell on a soaked altar here' },
        { type: 'map', difficulty: 2, lang: 'fil',
          answer: 'BUNDOK CARMELO',
          extent: 'holyland', at: [35.05, 32.73],
          verse: '1 Kings 18:38',
          clue: 'bumaba ang apoy sa basang altar dito' },
      ],
    },
    {
      id: 'np-09', answer: 'GOSHEN', difficulty: 2,
      variants: [
        { type: 'map', difficulty: 2,
          extent: 'bibleworld', at: [31.8, 30.8],
          verse: 'Genesis 47:27',
          clue: 'Jacob\'s family settled in the best of the land' },
        { type: 'map', difficulty: 2, lang: 'fil',
          answer: 'GOSEN',
          extent: 'bibleworld', at: [31.8, 30.8],
          verse: 'Genesis 47:27',
          clue: 'dito tumira ang sambahayan ni Jacob' },
      ],
    },
    {
      id: 'np-10', answer: 'BABYLON', difficulty: 1,
      variants: [
        { type: 'map', difficulty: 1,
          extent: 'bibleworld', at: [44.42, 32.54],
          verse: 'Daniel 1:1',
          clue: 'Judah was carried here for seventy years' },
        { type: 'map', difficulty: 1, lang: 'fil',
          answer: 'BABILONIA',
          extent: 'bibleworld', at: [44.42, 32.54],
          verse: 'Daniel 1:1',
          clue: 'dito dinala ang Juda sa loob ng pitumpung taon' },
      ],
    },
    {
      id: 'np-11', answer: 'NINEVEH', difficulty: 2,
      variants: [
        { type: 'map', difficulty: 2,
          extent: 'bibleworld', at: [43.15, 36.36],
          verse: 'Jonah 3:4',
          clue: 'forty days, and it shall be overthrown' },
        { type: 'map', difficulty: 2, lang: 'fil',
          answer: 'NINIVE',
          extent: 'bibleworld', at: [43.15, 36.36],
          verse: 'Jonah 3:4',
          clue: 'apatnapung araw, at gugain ito' },
      ],
    },
    {
      id: 'np-12', answer: 'UR', difficulty: 3,
      variants: [
        { type: 'map', difficulty: 3,
          extent: 'bibleworld', at: [46.1, 30.96],
          verse: 'Genesis 11:31',
          clue: 'Abraham\'s family left here for Canaan' },
        { type: 'map', difficulty: 3, lang: 'fil',
          answer: 'UR',
          extent: 'bibleworld', at: [46.1, 30.96],
          verse: 'Genesis 11:31',
          clue: 'mula rito umalis ang angkan ni Abraham' },
      ],
    },
  ],
};
