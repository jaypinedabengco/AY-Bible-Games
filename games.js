/*
 * The list of games shown on the front page.
 *
 * To add a game: copy games/names/ to games/your-game/, edit it, then add an
 * entry here. That is the whole wiring.
 *
 * status: 'ready'  - shown as a playable link
 *         'parked' - shown greyed out, not clickable (built but not finished)
 */
window.GAMES = [
  {
    title: 'Bible Names',
    href: 'games/names/index.html',
    blurb: 'Read the picture clues out loud and shout the name. ' +
           'A + dam. Sea + moon. Abra + ham.',
    meta: 'Ready to play',
    status: 'ready',
  },
  {
    title: 'Bible Characters',
    href: 'games/characters/index.html',
    blurb: 'A scene from a Bible story appears; the room guesses who it is. ' +
           'Artwork is drawn, the game page is not built yet.',
    meta: 'Parked',
    status: 'parked',
  },
];
