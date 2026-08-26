/*
 * Bible Character Names - the deck.
 *
 * Same shape as games/book-names/deck.js, same engine, same rules. Read that
 * file's header for what every field means; only the differences are noted
 * here.
 *
 *   answer     the person, revealed at the end
 *   ref        FREE TEXT here, not a canon slot: 'Judges 4' or 'a judge of
 *              Israel'. There is no closed list of Bible characters, so there
 *              is nothing to look the position up in. Keep it from naming the
 *              answer - it prints under the answer, and repeating it wastes
 *              the one line you have to teach something.
 *
 * The deck starts EMPTY on purpose. A character puzzle is only as good as its
 * picture, and the pictures are being made one at a time. Add them with the
 * deck manager - `node tools/manage.js`, pick this game, use the add tab -
 * rather than typing blocks in here by hand.
 *
 * The front page keeps this game greyed out until it has enough puzzles to
 * fill a round. Flip its status to 'ready' in games.js when it does.
 */
window.DECK = {
  id: 'character-names',
  title: 'Bible Character Names',
  imageDirs: ['images/'],
  idPrefix: 'cn',   // shown on the projector, so it must never hint the answer
  shuffle: true,
  // A round is 20, same as the book game. Until there are 20 playable puzzles,
  // tools/validate.js will say so - that is the check doing its job, not a
  // fault. Lower this number if you want to try a short round while building.
  sessionSize: 20,
  languages: ['en'],
  puzzles: [
  ],
};
