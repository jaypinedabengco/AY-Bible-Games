/*
 * Bible Book Names - the deck.
 *
 * EDIT THIS FILE to change the game. Nothing else needs touching.
 *
 *   id         a stable handle like 'bn-07', printed small on the projector.
 *              The Game Master looks it up on their phone to see the answer,
 *              so it works no matter how the deck was shuffled. Authored once
 *              and NEVER renumbered - inserting a puzzle takes the next unused
 *              id. It must never contain the answer: it is on a screen in
 *              front of the room, so 'ruth-08' would give the game away.
 *   answer     the book, revealed at the end
 *   ref        canon placement, NOT a chapter - "Daniel 6" under DANIEL
 *              would print the answer beneath the answer
 *   lang       which language is being asked; the card says so on screen
 *   slot       pin to a third of the running order. Always drawn.
 *   difficulty 1-3; the running order ramps upward
 *   variants   more than one picture for one answer; one is drawn per session.
 *              RUTH below shows the shape, commented out.
 *   flag       a note to yourself: 'risky' or 'local'. The game ignores it;
 *              validate.js prints a playtest reminder for 'risky' ones.
 *
 * Every picture lives in ./images/ and is committed. There is no private
 * image tier: this repo publishes to GitHub Pages, which deploys only what
 * is committed, so a gitignored picture would just be missing online.
 *
 * A .js file assigning a global, not .json: fetch() is blocked on file://,
 * so a JSON deck would work on GitHub Pages and then show a blank screen
 * when opened from a USB stick.
 */
window.DECK = {
  id: 'book-names',
  title: 'Bible Book Names',
  imageDirs: ['images/'],
  idPrefix: 'bn',   // puzzle ids are shown on the projector; see spec 16
  shuffle: true,
  sessionSize: 20,
  languages: ['en'],
  puzzles: [
    // ---- Law -----------------------------------------------------------
    {
      id: 'bn-01', answer: 'GENESIS',
      ref: { testament: 'Old', division: 'Law', position: 1 },
      variants: [
        { type: 'rebus', clues: [{ img: 'jeans.jpg', word: 'JEANS' }, { img: 'sis.jpg', word: 'SIS' }], weight: 5, difficulty: 2 },
        // added with the deck manager
        { type: 'rebus', clues: [{ img: 'genesis-2.png', word: null }], weight: 1, difficulty: 2 },
      ],
    },
    {
      id: 'bn-02', answer: 'EXODUS', difficulty: 2, flag: 'local',
      ref: { testament: 'Old', division: 'Law', position: 2 },
      clues: [{ img: 'XO_Candy.jpg', word: 'XO' }, { img: 'numeral-2.svg', word: 'DOS' }],
    },
    {
      // The Levi's LOGO, not a pair of jeans - bn-01 Genesis uses plain jeans
      // for JEANS, so a garment here would teach the room two words from one
      // picture. A wordmark and a garment cannot be confused at hall distance.
      id: 'bn-03', answer: 'LEVITICUS', difficulty: 2,
      ref: { testament: 'Old', division: 'Law', position: 3 },
      // The wordmark alone. LEVI fits exactly one book, so the room gets there
      // without two more clues that photograph badly - a tick read as "spider",
      // and "us" needed the flag of another country.
      //
      // To go back to LEVI + TICK, add a ticked checkbox as a second clue:
      //   { img: 'tick.jpg', word: 'TICK' }
      // tick.jpg is already sourced. A checkbox reads "tick" far better than
      // the arachnid did.
      clues: [{ img: 'Levis.png', word: 'LEVI' }],
    },
    {
      id: 'bn-04', answer: 'NUMBERS', difficulty: 1,
      ref: { testament: 'Old', division: 'Law', position: 4 },
      type: 'image', img: 'numerals.jpg',
    },
    // ---- Historical ----------------------------------------------------
    {
      id: 'bn-05', answer: 'JUDGES', difficulty: 1,
      ref: { testament: 'Old', division: 'Historical', position: 7 },
      type: 'image', img: 'gavel.jpg',
    },
    {
      id: 'bn-06', answer: 'RUTH', difficulty: 2,
      ref: { testament: 'Old', division: 'Historical', position: 8 },
      clues: [{ img: 'root.svg', word: 'ROOT' }],

      // The church-member cameo is prepared but not enabled. To turn it on:
      // drop ruth-member.jpg into images/, delete the `clues` and
      // `difficulty` lines above, and paste these in their place -
      //
      //   slot: 'late',
      //   variants: [
      //     { type: 'image', img: 'ruth-member.jpg', weight: 2, difficulty: 1 },
      //     { type: 'rebus', clues: [{ img: 'root.jpg', word: 'ROOT' }], difficulty: 2 },
      //   ],
      //
      // slot: 'late' matters - the cameo only pays off once the room has
      // understood the game, so it must never land first (spec 6.2).
      // Ask her first: this site is published to a public URL, which is a
      // bigger question than a picture on the hall projector.
    },
    {
      id: 'bn-07', answer: 'SAMUEL', difficulty: 2,
      ref: { testament: 'Old', division: 'Historical', position: 9 },
      clues: [{ img: 'sum.svg', word: 'SUM' }, { img: 'well.jpg', word: 'WELL' }],
    },
    {
      id: 'bn-08', answer: 'KINGS', difficulty: 1,
      ref: { testament: 'Old', division: 'Historical', position: 11 },
      type: 'image', img: 'crown.jpg',
    },
    {
      id: 'bn-09', answer: 'ESTHER', difficulty: 2,
      ref: { testament: 'Old', division: 'Historical', position: 17 },
      clues: [{ img: 'letter-s.svg', word: 'S' }, { img: 'tear.jpg', word: 'TEAR' }],
    },
    // ---- Poetry --------------------------------------------------------
    {
      id: 'bn-10', answer: 'JOB',
      ref: { testament: 'Old', division: 'Poetry', position: 18 },
      // Job on the ash heap with his friends - the scene belongs to no other
      // book. A hard hat only said "builder" and left the room two leaps
      // from the answer.
      variants: [
        { type: 'image', img: 'job-suffering.jpg', weight: 1, difficulty: 2 },
        // added with the deck manager
        { type: 'rebus', clues: [{ img: 'job-2.webp', word: 'JOBS' }], weight: 2, difficulty: 1 },
      ],
    },
    {
      id: 'bn-11', answer: 'PSALMS',
      ref: { testament: 'Old', division: 'Poetry', position: 19 },
      variants: [
        { type: 'rebus', clues: [{ img: 'palms.jpg', word: 'PALMS' }], weight: 1, difficulty: 1 },
        // added with the deck manager
        { type: 'rebus', clues: [{ img: 'psalms-2.jpg', word: 'PALMS' }], weight: 1, difficulty: 2 },
      ],
    },
    // ---- Major Prophets ------------------------------------------------
    {
      // jerry.png is supplied by hand, not sourced here - it is Warner Bros'
      // character and this repo publishes publicly. Until it is added, this
      // card shows a red placeholder on its first clue, which is intended.
      id: 'bn-13', answer: 'JEREMIAH', difficulty: 3,
      ref: { testament: 'Old', division: 'Major Prophets', position: 24 },
      clues: [{ img: 'Jerry_Mouse.webp', word: 'JERRY' }, { img: 'maya.jpg', word: 'MAYA' }],
    },
    {
      id: 'bn-14', answer: 'DANIEL', difficulty: 1,
      ref: { testament: 'Old', division: 'Major Prophets', position: 27 },
      clues: [{ img: 'done.jpg', word: 'DONE' }, { img: 'yell.svg', word: 'YELL' }],
    },
    // ---- Minor Prophets ------------------------------------------------
    {
      id: 'bn-15', answer: 'HOSEA', difficulty: 2,
      ref: { testament: 'Old', division: 'Minor Prophets', position: 28 },
      clues: [{ img: 'hose.jpg', word: 'HOSE' }, { img: 'letter-a.svg', word: 'A' }],
    },
    {
      id: 'bn-16', answer: 'JOEL', difficulty: 2,
      ref: { testament: 'Old', division: 'Minor Prophets', position: 29 },
      clues: [{ img: 'jewel.svg', word: 'JEWEL' }],
    },
    {
      id: 'bn-17', answer: 'AMOS', difficulty: 2,
      ref: { testament: 'Old', division: 'Minor Prophets', position: 30 },
      clues: [{ img: 'letter-a.svg', word: 'A' }, { img: 'moss.jpeg', word: 'MOSS' }],
    },
    {
      id: 'bn-18', answer: 'JONAH', difficulty: 1,
      ref: { testament: 'Old', division: 'Minor Prophets', position: 32 },
      type: 'image', img: 'whale.jpg',
    },
    {
      id: 'bn-19', answer: 'MICAH', difficulty: 2,
      ref: { testament: 'Old', division: 'Minor Prophets', position: 33 },
      clues: [{ img: 'mic.jpg', word: 'MIC' }, { img: 'ah.jpg', word: 'AH' }],
    },
    {
      id: 'bn-20', answer: 'MALACHI', difficulty: 2,
      ref: { testament: 'Old', division: 'Minor Prophets', position: 39 },
      clues: [{ img: 'sm.jpeg', word: 'MALL' }, { img: 'letter-a.svg', word: 'A' },
      { img: 'key.jpg', word: 'KEY' }],
    },
    // ---- Gospels and after ---------------------------------------------
    {
      id: 'bn-21', answer: 'MARK', difficulty: 1,
      ref: { testament: 'New', division: 'Gospels', position: 41 },
      clues: [{ img: 'mark.jpg', word: 'MARK' }],
    },
    {
      id: 'bn-22', answer: 'LUKE', difficulty: 3, flag: 'risky',
      ref: { testament: 'New', division: 'Gospels', position: 42 },
      clues: [{ img: 'look.jpg', word: 'LOOK' }],
    },
    {
      id: 'bn-23', answer: 'ACTS', difficulty: 2,
      ref: { testament: 'New', division: 'History', position: 44 },
      clues: [{ img: 'axe.svg', word: 'AXE' }, { img: 'letter-s.svg', word: 'S' }],
    },
    {
      id: 'bn-24', answer: 'HEBREWS', difficulty: 3,
      ref: { testament: 'New', division: 'General Epistles', position: 58 },
      clues: [{ img: 'he.jpg', word: 'HE' }, { img: 'brews.jpg', word: 'BREWS' }],
    },
    {
      id: 'bn-25', answer: 'JAMES', difficulty: 2,
      ref: { testament: 'New', division: 'General Epistles', position: 59 },
      clues: [{ img: 'jam.jpg', word: 'JAM' }, { img: 'letter-s.svg', word: 'S' }],
    },
    // ---- English: drafted in spec Appendix A, not yet playtested ----------
    {
      id: 'bn-26', answer: 'ISAIAH', difficulty: 2,
      ref: { testament: 'Old', division: 'Major Prophets', position: 23 },
      clues: [{ img: 'eye.jpg', word: 'EYE' }, { img: 'sigh.jpg', word: 'SIGH' },
      { img: 'ah.jpg', word: 'AH' }],
    },
    {
      id: 'bn-27', answer: 'NEHEMIAH', difficulty: 2,
      ref: { testament: 'Old', division: 'Historical', position: 16 },
      clues: [{ img: 'knee.jpg', word: 'KNEE' }, { img: 'he.jpg', word: 'HE' },
      { img: 'maya.jpg', word: 'MAYA' }],
    },
    {
      id: 'bn-28', answer: 'HAGGAI', difficulty: 2,
      ref: { testament: 'Old', division: 'Minor Prophets', position: 37 },
      clues: [{ img: 'hug.jpg', word: 'HUG' }, { img: 'guy.avif', word: 'GUY' }],
    },
    {
      id: 'bn-29', answer: 'SONG OF SOLOMON', difficulty: 2,
      ref: { testament: 'Old', division: 'Poetry', position: 22 },
      clues: [{ img: 'note.jpg', word: 'SONG' }, { img: 'solo.jpg', word: 'SOLO' },
      { img: 'moon.jpg', word: 'MOON' }],
    },
    {
      id: 'bn-30', answer: 'HABAKKUK', difficulty: 3,
      ref: { testament: 'Old', division: 'Minor Prophets', position: 35 },
      clues: [{ img: 'ha.jpg', word: 'HA' }, { img: 'back.jpg', word: 'BACK' },
      { img: 'cook.jpg', word: 'COOK' }],
    },
    {
      id: 'bn-31', answer: 'MATTHEW', difficulty: 1,
      ref: { testament: 'New', division: 'Gospels', position: 40 },
      clues: [{ img: 'mat.jpg', word: 'MAT' }, { img: 'chew.gif', word: 'CHEW' }],
    },
    {
      id: 'bn-32', answer: 'PHILEMON', difficulty: 2,
      ref: { testament: 'New', division: 'Epistles', position: 57 },
      clues: [{ img: 'fill.jpg', word: 'FILL' }, { img: 'lemon.jpg', word: 'LEMON' }],
    },
    {
      id: 'bn-33', answer: 'PETER', difficulty: 2,
      ref: { testament: 'New', division: 'General Epistles', position: 60 },
      clues: [{ img: 'pea.jpg', word: 'PEA' }, { img: 'tear.jpg', word: 'TEAR' }],
    },
    {
      id: 'bn-34', answer: 'TIMOTHY', difficulty: 3,
      ref: { testament: 'New', division: 'Epistles', position: 54 },
      clues: [{ img: 'clock.jpg', word: 'TIME' }, { img: 'moth.jpg', word: 'MOTH' }],
    },
    {
      id: 'bn-35', answer: 'ROMANS', difficulty: 1,
      ref: { testament: 'New', division: 'Epistles', position: 45 },
      type: 'image', img: 'roman-soldier.jpg',
    },
    // ---- Asked by a picture of what the book is about ---------------------
    // No verses anywhere: this is a picture game. These are direct depictions
    // rather than puns, for books whose names will not pun.
    //
    // Six books were dropped rather than forced - Ezra, Obadiah, Nahum,
    // Zephaniah, Titus and Jude have neither a workable pun nor a picture a
    // room would recognise. A bad clue is worse than a missing book.
    {
      // Walls coming down.
      id: 'bn-38', answer: 'JOSHUA', difficulty: 2,
      ref: { testament: 'Old', division: 'Historical', position: 6 },
      type: 'image', img: 'jericho.jpg',
    },
    {
      // A weeping face says lamentation with no words at all.
      id: 'bn-41', answer: 'LAMENTATIONS', difficulty: 1,
      ref: { testament: 'Old', division: 'Major Prophets', position: 25 },
      type: 'image', img: 'lamentations.webp',
    },
    {
      // The valley of dry bones belongs to no other book.
      // Two variants. The dry bones belong to no other book, and easy + kill
      // is closer in sound than the picture is obvious - so the deck plays
      // both. The easy clue is shared with EZRA, which is easy + ra.
      id: 'bn-42', answer: 'EZEKIEL',
      ref: { testament: 'Old', division: 'Major Prophets', position: 26 },
      difficulty: 3, flag: 'risky',
      clues: [{ img: 'easy.jpg', word: 'EASY' },
      { img: 'kill.jpg', word: 'KILL' }],
    },
    {
      // PHILIPPIANS and PHILIPPINES differ by a single letter. The strongest local clue in the deck.
      id: 'bn-48', answer: 'PHILIPPIANS', difficulty: 2,
      flag: 'local',
      ref: { testament: 'New', division: 'Epistles', position: 50 },
      type: 'image', img: 'ph-flag.png',
    },
    {
      // The woman riding the seven-headed beast - Durer's Apocalypse woodcut.
      // Unmistakably this book and nothing else.
      id: 'bn-50', answer: 'REVELATION', difficulty: 1,
      ref: { testament: 'New', division: 'Prophecy', position: 66 },
      type: 'image', img: 'babylon-beast.jpg',
    },
    // ---- Rescued on review ------------------------------------------------
    {
      // A rebus sidesteps the reason Ezra was dropped: any *depiction* of Ezra
      // looks exactly like Nehemiah, but a pun does not depict him at all.
      id: 'bn-51', answer: 'EZRA', difficulty: 3, flag: 'risky',
      ref: { testament: 'Old', division: 'Historical', position: 15 },
      clues: [{ img: 'easy.jpg', word: 'EASY' }, { img: 'letters-ra.svg', word: 'RA' }],
    },
    {
      // nah + HAM, not nah + hum. A ham photographs; humming does not, which
      // is exactly why the earlier version was cut.
      id: 'bn-52', answer: 'NAHUM', difficulty: 3, flag: 'risky',
      ref: { testament: 'Old', division: 'Minor Prophets', position: 34 },
      clues: [{ img: 'nah.jpg', word: 'NAH' }, { img: 'ham.jpg', word: 'HAM' }],
    },
    {
      id: 'bn-53', answer: 'TITUS', difficulty: 3, flag: 'risky',
      ref: { testament: 'New', division: 'Epistles', position: 56 },
      clues: [{ img: 'tie.jpg', word: 'TIE' }, { img: 'toes.jpg', word: 'TOES' }],
    },
    {
      // added with the deck manager
      id: 'bn-12', answer: 'PROVERBS', difficulty: 3,
      ref: { testament: 'Old', division: 'Poetry', position: 20 },
      clues: [{ img: 'proverbs-1.jpeg', word: 'PRO ATHLETE' }, { img: 'proverbs-2.avif', word: 'VERBS' }],
    },
  ],
};
