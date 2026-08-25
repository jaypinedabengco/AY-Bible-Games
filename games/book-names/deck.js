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
 *   answerAlt  its Filipino name, shown under the answer on the reveal. This is
 *              teaching value only - the question is always the English name.
 *   answerAlt  its Filipino name, shown alongside on the reveal
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
      // Two variants, so Genesis is not the same puzzle every time.
      //
      // The first asks it by meaning rather than by sound: Genesis means
      // beginning, and "In the beginning" is the most quoted opening in the
      // Bible, so an AY room gets there instantly - which makes it a good
      // opener. It also needs no picture at all, so it is the one puzzle
      // that plays before any art is sourced.
      //
      // The second is the rebus, for a room that has met the first one.
      id: 'bn-01', answer: 'GENESIS', answerAlt: 'Genesis',
      ref: { testament: 'Old', division: 'Law', position: 1 },
      variants: [
        { type: 'text', prompt: '\u201cIn the beginning\u2026\u201d', difficulty: 1 },
        { type: 'rebus', difficulty: 2,
          clues: [{ img: 'jeans.jpg', word: 'JEANS' }, { img: 'sis.jpg', word: 'SIS' }] },
      ],
    },
    {
      id: 'bn-02', answer: 'EXODUS', answerAlt: 'Exodo', difficulty: 2, flag: 'local',
      ref: { testament: 'Old', division: 'Law', position: 2 },
      clues: [{ img: 'xo.jpg', word: 'XO' }, { img: 'dos.jpg', word: 'DOS' }],
    },
    {
      // The Levi's LOGO, not a pair of jeans - bn-01 Genesis uses plain jeans
      // for JEANS, so a garment here would teach the room two words from one
      // picture. A wordmark and a garment cannot be confused at hall distance.
      id: 'bn-03', answer: 'LEVITICUS', answerAlt: 'Levitico', difficulty: 3, flag: 'risky',
      ref: { testament: 'Old', division: 'Law', position: 3 },
      clues: [{ img: 'levis-logo.jpg', word: 'LEVI' }, { img: 'tick.jpg', word: 'TICK' },
              { img: 'us.jpg', word: 'US' }],
    },
    {
      id: 'bn-04', answer: 'NUMBERS', answerAlt: 'Mga Bilang', difficulty: 1,
      ref: { testament: 'Old', division: 'Law', position: 4 },
      type: 'image', img: 'numerals.jpg',
    },

    // ---- Historical ----------------------------------------------------
    {
      id: 'bn-05', answer: 'JUDGES', answerAlt: 'Mga Hukom', difficulty: 1,
      ref: { testament: 'Old', division: 'Historical', position: 7 },
      type: 'image', img: 'gavel.jpg',
    },
    {
      id: 'bn-06', answer: 'RUTH', answerAlt: 'Ruth', difficulty: 2,
      ref: { testament: 'Old', division: 'Historical', position: 8 },
      clues: [{ img: 'root.jpg', word: 'ROOT' }],

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
      id: 'bn-07', answer: 'SAMUEL', answerAlt: '1 Samuel', difficulty: 2,
      ref: { testament: 'Old', division: 'Historical', position: 9 },
      clues: [{ img: 'sum.jpg', word: 'SUM' }, { img: 'well.jpg', word: 'WELL' }],
    },
    {
      id: 'bn-08', answer: 'KINGS', answerAlt: 'Mga Hari', difficulty: 1,
      ref: { testament: 'Old', division: 'Historical', position: 11 },
      type: 'image', img: 'crown.jpg',
    },
    {
      id: 'bn-09', answer: 'ESTHER', answerAlt: 'Ester', difficulty: 2,
      ref: { testament: 'Old', division: 'Historical', position: 17 },
      clues: [{ img: 'letter-s.jpg', word: 'S' }, { img: 'tear.jpg', word: 'TEAR' }],
    },

    // ---- Poetry --------------------------------------------------------
    {
      id: 'bn-10', answer: 'JOB', answerAlt: 'Job', difficulty: 2,
      ref: { testament: 'Old', division: 'Poetry', position: 18 },
      type: 'image', img: 'hardhat.jpg',
    },
    {
      id: 'bn-11', answer: 'PSALMS', answerAlt: 'Mga Awit', difficulty: 1,
      ref: { testament: 'Old', division: 'Poetry', position: 19 },
      clues: [{ img: 'palms.jpg', word: 'PALMS' }],
    },
    {
      id: 'bn-12', answer: 'PROVERBS', answerAlt: 'Mga Kawikaan', difficulty: 3,
      ref: { testament: 'Old', division: 'Poetry', position: 20 },
      clues: [{ img: 'pro.jpg', word: 'PRO' }, { img: 'verbs.jpg', word: 'VERBS' }],
    },

    // ---- Major Prophets ------------------------------------------------
    {
      // jerry.png is supplied by hand, not sourced here - it is Warner Bros'
      // character and this repo publishes publicly. Until it is added, this
      // card shows a red placeholder on its first clue, which is intended.
      id: 'bn-13', answer: 'JEREMIAH', answerAlt: 'Jeremias', difficulty: 3,
      ref: { testament: 'Old', division: 'Major Prophets', position: 24 },
      clues: [{ img: 'jerry.png', word: 'JERRY' }, { img: 'maya.jpg', word: 'MAYA' }],
    },
    {
      id: 'bn-14', answer: 'DANIEL', answerAlt: 'Daniel', difficulty: 1,
      ref: { testament: 'Old', division: 'Major Prophets', position: 27 },
      clues: [{ img: 'done.jpg', word: 'DONE' }, { img: 'yell.jpg', word: 'YELL' }],
    },

    // ---- Minor Prophets ------------------------------------------------
    {
      id: 'bn-15', answer: 'HOSEA', answerAlt: 'Oseas', difficulty: 2,
      ref: { testament: 'Old', division: 'Minor Prophets', position: 28 },
      clues: [{ img: 'hose.jpg', word: 'HOSE' }, { img: 'letter-a.jpg', word: 'A' }],
    },
    {
      id: 'bn-16', answer: 'JOEL', answerAlt: 'Joel', difficulty: 2,
      ref: { testament: 'Old', division: 'Minor Prophets', position: 29 },
      clues: [{ img: 'jewel.jpg', word: 'JEWEL' }],
    },
    {
      id: 'bn-17', answer: 'AMOS', answerAlt: 'Amos', difficulty: 2,
      ref: { testament: 'Old', division: 'Minor Prophets', position: 30 },
      clues: [{ img: 'letter-a.jpg', word: 'A' }, { img: 'moss.jpg', word: 'MOSS' }],
    },
    {
      id: 'bn-18', answer: 'JONAH', answerAlt: 'Jonas', difficulty: 1,
      ref: { testament: 'Old', division: 'Minor Prophets', position: 32 },
      type: 'image', img: 'whale.jpg',
    },
    {
      id: 'bn-19', answer: 'MICAH', answerAlt: 'Mikas', difficulty: 2,
      ref: { testament: 'Old', division: 'Minor Prophets', position: 33 },
      clues: [{ img: 'mic.jpg', word: 'MIC' }, { img: 'ah.jpg', word: 'AH' }],
    },
    {
      id: 'bn-20', answer: 'MALACHI', answerAlt: 'Malakias', difficulty: 2,
      ref: { testament: 'Old', division: 'Minor Prophets', position: 39 },
      clues: [{ img: 'mall.jpg', word: 'MALL' }, { img: 'letter-a.jpg', word: 'A' },
              { img: 'key.jpg', word: 'KEY' }],
    },

    // ---- Gospels and after ---------------------------------------------
    {
      id: 'bn-21', answer: 'MARK', answerAlt: 'Marcos', difficulty: 1,
      ref: { testament: 'New', division: 'Gospels', position: 41 },
      clues: [{ img: 'mark.jpg', word: 'MARK' }],
    },
    {
      id: 'bn-22', answer: 'LUKE', answerAlt: 'Lucas', difficulty: 3, flag: 'risky',
      ref: { testament: 'New', division: 'Gospels', position: 42 },
      clues: [{ img: 'look.jpg', word: 'LOOK' }],
    },
    {
      id: 'bn-23', answer: 'ACTS', answerAlt: 'Mga Gawa', difficulty: 2,
      ref: { testament: 'New', division: 'History', position: 44 },
      clues: [{ img: 'axe.jpg', word: 'AXE' }, { img: 'letter-s.jpg', word: 'S' }],
    },
    {
      id: 'bn-24', answer: 'HEBREWS', answerAlt: 'Hebreo', difficulty: 3,
      ref: { testament: 'New', division: 'General Epistles', position: 58 },
      clues: [{ img: 'he.jpg', word: 'HE' }, { img: 'brews.jpg', word: 'BREWS' }],
    },
    {
      id: 'bn-25', answer: 'JAMES', answerAlt: 'Santiago', difficulty: 2,
      ref: { testament: 'New', division: 'General Epistles', position: 59 },
      clues: [{ img: 'jam.jpg', word: 'JAM' }, { img: 'letter-s.jpg', word: 'S' }],
    },

    // ---- English: drafted in spec Appendix A, not yet playtested ----------
    {
      id: 'bn-26', answer: 'ISAIAH', answerAlt: 'Isaias', difficulty: 2,
      ref: { testament: 'Old', division: 'Major Prophets', position: 23 },
      clues: [{ img: 'eye.jpg', word: 'EYE' }, { img: 'sigh.jpg', word: 'SIGH' },
              { img: 'ah.jpg', word: 'AH' }],
    },
    {
      id: 'bn-27', answer: 'NEHEMIAH', answerAlt: 'Nehemias', difficulty: 2,
      ref: { testament: 'Old', division: 'Historical', position: 16 },
      clues: [{ img: 'knee.jpg', word: 'KNEE' }, { img: 'he.jpg', word: 'HE' },
              { img: 'maya.jpg', word: 'MAYA' }],
    },
    {
      id: 'bn-28', answer: 'HAGGAI', answerAlt: 'Hagai', difficulty: 2,
      ref: { testament: 'Old', division: 'Minor Prophets', position: 37 },
      clues: [{ img: 'hug.jpg', word: 'HUG' }, { img: 'guy.jpg', word: 'GUY' }],
    },
    {
      id: 'bn-29', answer: 'SONG OF SOLOMON', answerAlt: 'Awit ni Solomon', difficulty: 2,
      ref: { testament: 'Old', division: 'Poetry', position: 22 },
      clues: [{ img: 'note.jpg', word: 'SONG' }, { img: 'solo.jpg', word: 'SOLO' },
              { img: 'moon.jpg', word: 'MOON' }],
    },
    {
      id: 'bn-30', answer: 'HABAKKUK', answerAlt: 'Habacuc', difficulty: 3,
      ref: { testament: 'Old', division: 'Minor Prophets', position: 35 },
      clues: [{ img: 'ha.jpg', word: 'HA' }, { img: 'back.jpg', word: 'BACK' },
              { img: 'cook.jpg', word: 'COOK' }],
    },
    {
      id: 'bn-31', answer: 'MATTHEW', answerAlt: 'Mateo', difficulty: 1,
      ref: { testament: 'New', division: 'Gospels', position: 40 },
      clues: [{ img: 'mat.jpg', word: 'MAT' }, { img: 'chew.jpg', word: 'CHEW' }],
    },
    {
      id: 'bn-32', answer: 'PHILEMON', answerAlt: 'Filemon', difficulty: 2,
      ref: { testament: 'New', division: 'Epistles', position: 57 },
      clues: [{ img: 'fill.jpg', word: 'FILL' }, { img: 'lemon.jpg', word: 'LEMON' }],
    },
    {
      id: 'bn-33', answer: 'PETER', answerAlt: 'Pedro', difficulty: 2,
      ref: { testament: 'New', division: 'General Epistles', position: 60 },
      clues: [{ img: 'pea.jpg', word: 'PEA' }, { img: 'tear.jpg', word: 'TEAR' }],
    },
    {
      id: 'bn-34', answer: 'TIMOTHY', answerAlt: 'Timoteo', difficulty: 3,
      ref: { testament: 'New', division: 'Epistles', position: 54 },
      clues: [{ img: 'clock.jpg', word: 'TIME' }, { img: 'moth.jpg', word: 'MOTH' }],
    },
    {
      id: 'bn-35', answer: 'ROMANS', answerAlt: 'Mga Taga-Roma', difficulty: 1,
      ref: { testament: 'New', division: 'Epistles', position: 45 },
      type: 'image', img: 'roman-soldier.jpg',
    },
    {
      id: 'bn-36', answer: 'COLOSSIANS', answerAlt: 'Mga Taga-Colosas', difficulty: 3,
      flag: 'risky',
      ref: { testament: 'New', division: 'Epistles', position: 51 },
      type: 'image', img: 'colossus.jpg',
    },

    // ---- Asked by meaning or by a famous line -----------------------------
    // These reach the books that resist a rebus: Deuteronomy and Ecclesiastes
    // have no workable pun, but a room that knows the words gets there at once.
    //
    // They also need NO artwork, which is why they exist - sourcing pictures
    // is the bottleneck, and these play the day they are written.
    //
    // Rule: the line must never contain the book's own name.
    {
      id: 'bn-37', answer: 'DEUTERONOMY', answerAlt: 'Deuteronomio', difficulty: 3,
      ref: { testament: 'Old', division: 'Law', position: 5 },
      type: 'text', prompt: '“Moses reviews the law one last time, and dies before the people cross over.”',
    },
    {
      id: 'bn-38', answer: 'JOSHUA', answerAlt: 'Josue', difficulty: 2,
      ref: { testament: 'Old', division: 'Historical', position: 6 },
      type: 'text', prompt: '“Be strong and courageous… for the LORD your God is with you wherever you go.”',
    },
    {
      id: 'bn-39', answer: 'CHRONICLES', answerAlt: 'Mga Cronica', difficulty: 3,
      ref: { testament: 'Old', division: 'Historical', position: 13 },
      type: 'text', prompt: '“If my people, who are called by my name, will humble themselves and pray…”',
    },
    {
      id: 'bn-40', answer: 'EZRA', answerAlt: 'Ezra', difficulty: 3,
      flag: 'risky',
      ref: { testament: 'Old', division: 'Historical', position: 15 },
      type: 'text', prompt: '“The scribe who set his heart to study the Law of the LORD, and to teach it.”',
    },
    {
      id: 'bn-41', answer: 'ECCLESIASTES', answerAlt: 'Mangangaral', difficulty: 2,
      ref: { testament: 'Old', division: 'Poetry', position: 21 },
      type: 'text', prompt: '“Vanity of vanities; all is vanity.”',
    },
    {
      // A weeping face says "lamentation" with no words at all - far better
      // than a verse the room has to place.
      id: 'bn-42', answer: 'LAMENTATIONS', answerAlt: 'Mga Panaghoy', difficulty: 1,
      ref: { testament: 'Old', division: 'Major Prophets', position: 25 },
      type: 'image', img: 'weeping.jpg',
    },
    {
      id: 'bn-43', answer: 'EZEKIEL', answerAlt: 'Ezekiel', difficulty: 1,
      ref: { testament: 'Old', division: 'Major Prophets', position: 26 },
      type: 'text', prompt: '“A valley of dry bones, and the question: can these bones live?”',
    },
    {
      id: 'bn-44', answer: 'OBADIAH', answerAlt: 'Obadias', difficulty: 3,
      flag: 'risky',
      ref: { testament: 'Old', division: 'Minor Prophets', position: 31 },
      type: 'text', prompt: '“The shortest book in the Old Testament — one chapter, against Edom.”',
    },
    {
      id: 'bn-45', answer: 'NAHUM', answerAlt: 'Nahum', difficulty: 3,
      flag: 'risky',
      ref: { testament: 'Old', division: 'Minor Prophets', position: 34 },
      type: 'text', prompt: '“A prophecy against Nineveh — the city Jonah had once warned.”',
    },
    {
      id: 'bn-46', answer: 'ZEPHANIAH', answerAlt: 'Zefanias', difficulty: 3,
      flag: 'risky',
      ref: { testament: 'Old', division: 'Minor Prophets', position: 36 },
      type: 'text', prompt: '“He will rejoice over you with singing.”',
    },
    {
      id: 'bn-47', answer: 'ZECHARIAH', answerAlt: 'Zacarias', difficulty: 3,
      ref: { testament: 'Old', division: 'Minor Prophets', position: 38 },
      type: 'text', prompt: '“Behold, your king comes to you… humble, and riding on a donkey.”',
    },
    {
      id: 'bn-48', answer: 'JOHN', answerAlt: 'Juan', difficulty: 1,
      ref: { testament: 'New', division: 'Gospels', position: 43 },
      type: 'text', prompt: '“Written by the disciple whom Jesus loved.”',
    },
    {
      id: 'bn-49', answer: 'CORINTHIANS', answerAlt: 'Mga Taga-Corinto', difficulty: 1,
      ref: { testament: 'New', division: 'Epistles', position: 46 },
      type: 'text', prompt: '“Love is patient, love is kind. It does not envy, it does not boast.”',
    },
    {
      id: 'bn-50', answer: 'GALATIANS', answerAlt: 'Mga Taga-Galacia', difficulty: 2,
      ref: { testament: 'New', division: 'Epistles', position: 48 },
      type: 'text', prompt: '“The fruit of the Spirit is love, joy, peace, patience, kindness…”',
    },
    {
      id: 'bn-51', answer: 'EPHESIANS', answerAlt: 'Mga Taga-Efeso', difficulty: 1,
      ref: { testament: 'New', division: 'Epistles', position: 49 },
      type: 'text', prompt: '“Put on the whole armour of God.”',
    },
    {
      id: 'bn-52', answer: 'PHILIPPIANS', answerAlt: 'Mga Taga-Filipos', difficulty: 1,
      ref: { testament: 'New', division: 'Epistles', position: 50 },
      type: 'text', prompt: '“I can do all things through Christ who strengthens me.”',
    },
    {
      id: 'bn-53', answer: 'THESSALONIANS', answerAlt: 'Mga Taga-Tesalonica', difficulty: 2,
      ref: { testament: 'New', division: 'Epistles', position: 52 },
      type: 'text', prompt: '“The Lord himself will come down from heaven, and the dead in Christ will rise first.”',
    },
    {
      id: 'bn-54', answer: 'TITUS', answerAlt: 'Tito', difficulty: 3,
      flag: 'risky',
      ref: { testament: 'New', division: 'Epistles', position: 56 },
      type: 'text', prompt: '“A letter to a young pastor left behind on Crete.”',
    },
    {
      id: 'bn-55', answer: 'JUDE', answerAlt: 'Judas', difficulty: 3,
      flag: 'risky',
      ref: { testament: 'New', division: 'General Epistles', position: 65 },
      type: 'text', prompt: '“A single chapter, and the only book that quotes Enoch.”',
    },
    {
      // Two variants. The first is where it was written: an exile alone on a
      // rocky island. The second is what the word itself means - apokalypsis
      // is an unveiling, so a curtain drawn back IS the answer.
      id: 'bn-56', answer: 'REVELATION', answerAlt: 'Apocalipsis',
      ref: { testament: 'New', division: 'Prophecy', position: 66 },
      variants: [
        { type: 'text', difficulty: 2,
          prompt: '“Written by an exile on a lonely island, full of visions and beasts.”' },
        { type: 'image', img: 'unveiling.jpg', difficulty: 1 },
      ],
    },
  ],
};
