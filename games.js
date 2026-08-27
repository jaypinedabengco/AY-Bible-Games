/*
 * The games on the front page.
 *
 * To add one: copy games/book-names/ to games/your-game/, edit its deck,
 * then add an entry here. That is the whole wiring - the engine handles any
 * "show a prompt, reveal in stages, move on" game.
 *
 * status: 'ready'  - a playable link
 *         'parked' - greyed out and not clickable
 */
window.GAMES = [
  {
    title: 'Bible Book Names',
    href: 'games/book-names/index.html',
    blurb: 'Picture clues combine into a book of the Bible. Jeans + sis. XO + dos.',
    meta: 'Ready to play',
    status: 'ready',
  },
  {
    title: 'Who Said It?',
    href: 'games/who-said-it/index.html',
    blurb: 'A line someone in the Bible said. The room says who said it.',
    meta: 'Ready to play',
    status: 'ready',
  },
  {
    title: 'Old or New?',
    href: 'games/old-or-new/index.html',
    blurb: 'A book flashes up; the room shouts which testament. A fast warm-up.',
    meta: 'Planned',
    status: 'parked',
  },
  {
    // Built and wired, deliberately greyed out: the deck is empty until it has
    // pictures. Set status to 'ready' once it can fill a round.
    title: 'Bible Character Names',
    href: 'games/character-names/index.html',
    blurb: 'Picture clues combine into a person from a story. Same game, new answers.',
    meta: 'Collecting pictures',
    status: 'parked',
  },
];
