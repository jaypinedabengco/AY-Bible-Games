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
  languages: ['en', 'fil'],
  puzzles: [
    // ---- Law -----------------------------------------------------------
    {
      id: 'bn-01', answer: 'GENESIS', answerAlt: 'Genesis', difficulty: 2,
      ref: { testament: 'Old', division: 'Law', position: 1 },
      clues: [{ img: 'jeans.jpg', word: 'JEANS' }, { img: 'sis.jpg', word: 'SIS' }],
    },
    {
      id: 'bn-02', answer: 'EXODUS', answerAlt: 'Exodo', difficulty: 2, flag: 'local',
      ref: { testament: 'Old', division: 'Law', position: 2 },
      clues: [{ img: 'xo.jpg', word: 'XO' }, { img: 'dos.jpg', word: 'DOS' }],
    },
    {
      id: 'bn-03', answer: 'LEVITICUS', answerAlt: 'Levitico', difficulty: 3, flag: 'risky',
      ref: { testament: 'Old', division: 'Law', position: 3 },
      clues: [{ img: 'levi.jpg', word: 'LEVI' }, { img: 'tick.jpg', word: 'TICK' },
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

    // ---- Filipino answers -------------------------------------------------
    // Only names that genuinely differ from the English, per spec 11.1. The
    // room is told which language is wanted by the badge on every card - a
    // crown is KINGS in one puzzle and MGA HARI in another, same picture.
    {
      id: 'bn-37', answer: 'SANTIAGO', answerAlt: 'James', lang: 'fil',
      difficulty: 3, flag: 'risky',
      ref: { testament: 'New', division: 'General Epistles', position: 59 },
      clues: [{ img: 'santa.jpg', word: 'SANTA' }, { img: 'go.jpg', word: 'GO' }],
    },
    {
      id: 'bn-38', answer: 'APOCALIPSIS', answerAlt: 'Revelation', lang: 'fil',
      difficulty: 2,
      ref: { testament: 'New', division: 'Prophecy', position: 66 },
      clues: [{ img: 'letter-a.jpg', word: 'A' }, { img: 'polka.jpg', word: 'POLKA' },
              { img: 'lips.jpg', word: 'LIPS' }, { img: 'sis.jpg', word: 'SIS' }],
    },
    {
      id: 'bn-39', answer: 'JUAN', answerAlt: 'John', lang: 'fil', difficulty: 2,
      ref: { testament: 'New', division: 'Gospels', position: 43 },
      clues: [{ img: 'numeral-1.jpg', word: 'ONE' }],
    },
    {
      id: 'bn-40', answer: 'MGA HARI', answerAlt: 'Kings', lang: 'fil', difficulty: 1,
      ref: { testament: 'Old', division: 'Historical', position: 11 },
      type: 'image', img: 'crown.jpg',
    },
    {
      id: 'bn-41', answer: 'MGA BILANG', answerAlt: 'Numbers', lang: 'fil', difficulty: 1,
      ref: { testament: 'Old', division: 'Law', position: 4 },
      type: 'image', img: 'numerals.jpg',
    },
    {
      id: 'bn-42', answer: 'MGA HUKOM', answerAlt: 'Judges', lang: 'fil', difficulty: 1,
      ref: { testament: 'Old', division: 'Historical', position: 7 },
      type: 'image', img: 'gavel.jpg',
    },
    {
      id: 'bn-43', answer: 'MGA AWIT', answerAlt: 'Psalms', lang: 'fil', difficulty: 1,
      ref: { testament: 'Old', division: 'Poetry', position: 19 },
      type: 'image', img: 'note.jpg',
    },
    {
      id: 'bn-44', answer: 'MGA GAWA', answerAlt: 'Acts', lang: 'fil', difficulty: 2,
      ref: { testament: 'New', division: 'History', position: 44 },
      type: 'image', img: 'hands-work.jpg',
    },
    {
      id: 'bn-45', answer: 'MGA PANAGHOY', answerAlt: 'Lamentations', lang: 'fil',
      difficulty: 2,
      ref: { testament: 'Old', division: 'Major Prophets', position: 25 },
      type: 'image', img: 'weeping.jpg',
    },
    {
      id: 'bn-46', answer: 'MANGANGARAL', answerAlt: 'Ecclesiastes', lang: 'fil',
      difficulty: 2,
      ref: { testament: 'Old', division: 'Poetry', position: 21 },
      type: 'image', img: 'preacher.jpg',
    },
    {
      id: 'bn-47', answer: 'TITO', answerAlt: 'Titus', lang: 'fil', difficulty: 2,
      ref: { testament: 'New', division: 'Epistles', position: 56 },
      type: 'image', img: 'uncle.jpg',
    },
  ],
};
