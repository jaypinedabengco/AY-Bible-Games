/*
 * Bible Names - the rebus deck.
 *
 * EDIT THIS FILE to change the game. Nothing else needs touching.
 *
 * Each puzzle:
 *   answer  - the name revealed at the end
 *   ref     - where to find them, shown under the answer
 *   clues   - the pictures, left to right. `word` is the syllable the picture
 *             stands for; it is hidden until the reveal, then shown as the
 *             working ("DONE + YELL").
 *
 *             `img` is normally a file in ./clues/ - just the filename:
 *                 { img: 'dam.svg', word: 'DAM' }
 *
 *             It can also be a full URL, which is handy while you are trying
 *             ideas out:
 *                 { img: 'https://example.com/beaver-dam.jpg', word: 'DAM' }
 *
 *             Prefer local files for anything you will actually play. A URL
 *             means the clue needs working internet the moment it appears on
 *             screen, and it breaks for good if whoever owns that page moves
 *             or deletes the picture. Download it into ./clues/ instead and
 *             the game keeps working when the church wifi does not.
 *   flag    - optional. 'local' marks a pun that leans on Filipino
 *             pronunciation; 'risky' marks one that may not land. Purely a
 *             note to yourself - the game ignores it.
 *
 * A deliberate choice: this is a .js file assigning a global, not a .json
 * file. Browsers block fetch() on file:// URLs, so a JSON deck would work on
 * GitHub Pages and then show a blank screen when opened from a USB stick.
 */
window.NAME_PUZZLES = [
  {
    answer: 'ADAM', ref: 'Genesis 2',
    clues: [{ img: 'letter-a.svg', word: 'A' }, { img: 'dam.svg', word: 'DAM' }],
  },
  {
    answer: 'RUTH', ref: 'Ruth 1',
    clues: [{ img: 'root.svg', word: 'ROOT' }],
  },
  {
    answer: 'ISAAC', ref: 'Genesis 21',
    clues: [{ img: 'eye.svg', word: 'EYE' }, { img: 'sack.svg', word: 'SACK' }],
  },
  {
    answer: 'DANIEL', ref: 'Daniel 6',
    clues: [{ img: 'done.svg', word: 'DONE' }, { img: 'yell.svg', word: 'YELL' }],
  },
  {
    answer: 'SIMON', ref: 'Matthew 4',
    clues: [{ img: 'sea.svg', word: 'SEA' }, { img: 'moon.svg', word: 'MOON' }],
  },
  {
    answer: 'SOLOMON', ref: '1 Kings 3',
    clues: [{ img: 'solo.svg', word: 'SOLO' }, { img: 'moon.svg', word: 'MOON' }],
  },
  {
    answer: 'PHILIP', ref: 'John 1',
    clues: [{ img: 'fill.svg', word: 'FILL' }, { img: 'lips.svg', word: 'LIPS' }],
  },
  {
    answer: 'ANDREW', ref: 'Matthew 4',
    clues: [{ img: 'ampersand.svg', word: 'AND' }, { img: 'draw.svg', word: 'DREW' }],
  },
  {
    answer: 'SAMUEL', ref: '1 Samuel 3',
    clues: [{ img: 'sum.svg', word: 'SUM' }, { img: 'well.svg', word: 'WELL' }],
  },
  {
    answer: 'ESTHER', ref: 'Esther 4',
    clues: [{ img: 'letter-s.svg', word: 'S' }, { img: 'tear.svg', word: 'TEAR' }],
  },
  {
    answer: 'DAVID', ref: '1 Samuel 17',
    clues: [{ img: 'calendar.svg', word: 'DAY' }, { img: 'video.svg', word: 'VID' }],
    flag: 'risky',
  },
  {
    answer: 'THOMAS', ref: 'John 20',
    clues: [{ img: 'toe.svg', word: 'TOE' }, { img: 'mass.svg', word: 'MASS' }],
  },
  {
    answer: 'ABRAHAM', ref: 'Genesis 12',
    clues: [{ img: 'abra.svg', word: 'ABRA' }, { img: 'ham.svg', word: 'HAM' }],
  },
  {
    answer: 'BARNABAS', ref: 'Acts 4',
    clues: [
      { img: 'barn.svg', word: 'BARN' },
      { img: 'letter-a.svg', word: 'A' },
      { img: 'bus.svg', word: 'BUS' },
    ],
  },
  {
    answer: 'JEREMIAH', ref: 'Jeremiah 1',
    clues: [{ img: 'mouse.svg', word: 'JERRY' }, { img: 'maya.svg', word: 'MAYA' }],
    flag: 'risky',
  },
];
