/*
 * Who Said It? - the deck.
 *
 * A line someone in the Bible said goes on the projector; the room shouts who
 * said it. Four clicks: the quote, then the verse, then a clue, then the name.
 *
 *   answer     the person, revealed last
 *   quote      the line. English quotes are NKJV; Tagalog quotes are MBB and
 *              are pasted in by hand - see "Tagalog" below.
 *   verse      where it is said. Shown BEFORE the clue on purpose: the
 *              reference is itself a hint for whoever has read the passage.
 *   clue       one line about the speaker that does not name them
 *   verseAtReveal
 *              hold the verse back to the reveal. REQUIRED when the book is
 *              named after the speaker - "Jonah 2:2" under JONAH hands the
 *              answer over. validate.js refuses a deck that forgets.
 *   lang       'en' or 'fil'. On the VARIANT, not the puzzle: PEDRO and PETER
 *              are the same person, so they are one puzzle.
 *   answer     on a variant, the name in that language - PEDRO for PETER.
 *   flag       'unverified' until a human has checked the wording against the
 *              Bible. validate.js counts them; the game master page tags them.
 *
 * The puzzle is the PERSON and each quote is a VARIANT. That is what makes
 * rounds work: a person cannot come up twice in one round, but a later round
 * can bring them back with a line the room has not heard.
 *
 * TAGALOG. The Magandang Balita Biblia text belongs to the Philippine Bible
 * Society, so it is NOT drafted into this repository. What is drafted is
 * everything around it - the name, the reference and the clue, which are our
 * own words. A quote with no text is DORMANT: never drawn, exactly as a
 * variant whose picture file is missing is never drawn. Paste the line in
 * with the deck manager and it wakes up.
 */
window.DECK = {
  id: 'who-said-it',
  title: 'Who Said It?',
  idPrefix: 'qs',   // shown on the projector, so it must never hint the answer
  shuffle: true,
  sessionSize: 20,
  // Both languages are declared, but Tagalog has nothing playable until its
  // lines are pasted in - so the start screen offers English alone until then,
  // rather than a choice that leads to an empty round.
  languages: ['en', 'fil'],
  howToPlay: [
    'A line someone in the Bible said. The room says who said it.',
    'Stuck? The next click gives the verse, then a clue.',
  ],
  // Shown small at the foot of the screen, for the language being played.
  credits: {
    en: 'Scripture taken from the New King James Version®. '
      + 'Copyright © 1982 by Thomas Nelson. Used by permission. '
      + 'All rights reserved.',
    fil: 'Scripture texts are from the Magandang Balita Biblia '
      + '© 2026 Philippine Bible Society, used with permission.',
  },
  puzzles: [
    {
      id: 'qs-01', answer: 'CAIN', difficulty: 1,
      variants: [
        { type: 'quote', flag: 'unverified',
          quote: 'Am I my brother’s keeper?',
          verse: 'Genesis 4:9',
          clue: 'he worked the ground; his brother kept sheep' },
        { type: 'quote', lang: 'fil', answer: 'CAIN', flag: 'unverified',
          quote: null,
          verse: 'Genesis 4:9',
          clue: 'nagsasaka siya; ang kapatid niya ay pastol ng tupa' },
      ],
    },
    {
      id: 'qs-02', answer: 'GOD', difficulty: 1,
      variants: [
        { type: 'quote', flag: 'unverified',
          quote: 'Let there be light.',
          verse: 'Genesis 1:3',
          clue: 'the first words anyone speaks in the Bible' },
        { type: 'quote', lang: 'fil', answer: 'DIYOS', flag: 'unverified',
          quote: null,
          verse: 'Genesis 1:3',
          clue: 'ang kauna-unahang salitang binigkas sa Bibliya' },
      ],
    },
    {
      id: 'qs-03', answer: 'ISAIAH', difficulty: 1,
      variants: [
        { type: 'quote', flag: 'unverified', verseAtReveal: true,
          quote: 'Here am I! Send me.',
          verse: 'Isaiah 6:8',
          clue: 'he saw the Lord on a throne, and a coal touched his lips' },
        { type: 'quote', lang: 'fil', answer: 'ISAIAS', flag: 'unverified',
          verseAtReveal: true, quote: null,
          verse: 'Isaias 6:8',
          clue: 'nakita niya ang Panginoon sa trono, at may baga sa kanyang labi' },
      ],
    },
    {
      id: 'qs-04', answer: 'RUTH', difficulty: 2,
      variants: [
        { type: 'quote', flag: 'unverified', verseAtReveal: true,
          quote: 'For wherever you go, I will go; and wherever you lodge, I will lodge.',
          verse: 'Ruth 1:16',
          clue: 'she said it to her mother-in-law, on the road out of Moab' },
        { type: 'quote', lang: 'fil', answer: 'RUT', flag: 'unverified',
          verseAtReveal: true, quote: null,
          verse: 'Rut 1:16',
          clue: 'sinabi niya ito sa kanyang biyenan, palabas ng Moab' },
      ],
    },
    {
      id: 'qs-05', answer: 'PETER', difficulty: 2,
      variants: [
        { type: 'quote', flag: 'unverified',
          quote: 'You are the Christ, the Son of the living God.',
          verse: 'Matthew 16:16',
          clue: 'a fisherman; Jesus called him a rock' },
        { type: 'quote', flag: 'unverified', difficulty: 3,
          quote: 'I do not know the Man!',
          verse: 'Matthew 26:72',
          clue: 'he said it three times, by a fire, before dawn' },
        { type: 'quote', lang: 'fil', answer: 'PEDRO', flag: 'unverified',
          quote: null,
          verse: 'Mateo 16:16',
          clue: 'isang mangingisda; tinawag siyang bato ni Jesus' },
      ],
    },
    {
      id: 'qs-06', answer: 'PILATE', difficulty: 3,
      variants: [
        { type: 'quote', flag: 'unverified',
          quote: 'What is truth?',
          verse: 'John 18:38',
          clue: 'he asked it of the prisoner in front of him, then washed his hands' },
        { type: 'quote', lang: 'fil', answer: 'PILATO', flag: 'unverified',
          quote: null,
          verse: 'Juan 18:38',
          clue: 'tinanong niya ito sa bilanggo sa harap niya, saka naghugas ng kamay' },
      ],
    },
  ],
};
