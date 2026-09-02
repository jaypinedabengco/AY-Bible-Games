/*
 * The games on the front page.
 *
 * To add one: copy games/book-names/ to games/your-game/, edit its deck,
 * then add an entry here. That is the whole wiring - the engine handles any
 * "show a prompt, reveal in stages, move on" game.
 *
 * status: 'ready'  - a playable link
 *         'parked' - greyed out and not clickable
 *
 * The parked ones are not placeholders. docs/future-games.md sets out how each
 * is meant to work, which renderer it needs, what its deck looks like and what
 * would make it fail - written while the reasoning was fresh, so nobody has to
 * reconstruct it later.
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
    // Built and wired, deliberately greyed out: the deck is empty until it has
    // pictures. Set status to 'ready' once it can fill a round.
    title: 'Bible Character Names',
    href: 'games/character-names/index.html',
    blurb: 'Picture clues combine into a person from a story. Same game, new answers.',
    meta: 'Collecting pictures',
    status: 'parked',
  },
  {
    title: 'Before or After',
    href: 'games/before-or-after/index.html',
    blurb: 'Two people, two events. Which came first? The timeline nobody is sure of.',
    meta: 'Proposed',
    status: 'parked',
  },
  {
    title: 'Higher or Lower',
    href: 'games/higher-or-lower/index.html',
    blurb: 'A number from scripture, then a second one to bet on. Noah or Methuselah?',
    meta: 'Proposed',
    status: 'parked',
  },
  {
    title: 'Who Did It?',
    href: 'games/who-did-it/index.html',
    blurb: 'A deed instead of a line. Cut off a soldier’s ear. Climbed a tree.',
    meta: 'Proposed',
    status: 'parked',
  },
  {
    title: 'The Object Trail',
    href: 'games/object-trail/index.html',
    blurb: 'Honey and a lion. Objects from one story, a step at a time, until the room has it.',
    meta: 'Proposed',
    status: 'parked',
  },
];
