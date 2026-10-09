/*
 * Hot Potato - the deck.
 *
 * HAND-WRITTEN, unlike What Came First? and Higher or Lower, which are
 * generated because their content is facts that cannot be proofread by eye.
 * These cards are writing. There is no source to derive them from.
 *
 * TWO KINDS OF CARD, and the difference is where the text lives:
 *
 *   a TASK       something to DO. The text goes in `answer`, because a task IS
 *                its own identity - and validate.js already rejects two
 *                puzzles sharing an answer, so that buys duplicate-card
 *                detection for free. No `prompt`.
 *   a KNOWLEDGE  a question in `prompt`, the answer in `answer`, the reference
 *                in `ref`. It gets a fourth screen the task cards do not have.
 *
 * THE RULE FOR A TASK CARD: it must be performable by whoever is holding the
 * mic, with nothing but a Bible and the people next to them. No props, no
 * phones, no printing. A card that cannot be done is only discovered when it
 * comes up, in front of everyone, which is the worst place to find out.
 *
 * English only for now. `languages` carries the slot, so Tagalog is a deck
 * edit later with no code change - the same as every other game here.
 */
window.DECK = {
  id: 'hot-potato',
  title: 'Hot Potato',
  idPrefix: 'hp',   // shown on the projector, so it must never hint the answer
  shuffle: true,
  sessionSize: 6,
  languages: ['en'],
  // The range the stop is drawn from, in seconds - NOT a fixed duration. Every
  // round draws a fresh number inside it, so nobody can count. Widen it if the
  // room starts sensing the floor.
  musicSeconds: [6, 20],
  howToPlay: [
    'Pass something round while the music plays.',
    'When it stops, whoever is holding it does what the screen says.',
  ],
  puzzles: [
    { id: 'hp-01', answer: 'Recite any two verses from memory',
      variants: [{ type: 'card', kind: 'task' }] },
    { id: 'hp-02', answer: 'Sing one verse of a hymn with the person on your left',
      variants: [{ type: 'card', kind: 'task' }] },
    { id: 'hp-03', answer: 'Name five of the twelve disciples',
      variants: [{ type: 'card', kind: 'task' }] },
    { id: 'hp-04', answer: 'Say a short prayer out loud for someone in this room',
      variants: [{ type: 'card', kind: 'task' }] },
    { id: 'hp-05', answer: 'Belshazzar', ref: 'Daniel 5:5',
      variants: [{ type: 'card', kind: 'knowledge',
                   prompt: 'Which king saw a hand writing on the wall?' }] },
    { id: 'hp-06', answer: 'Melita', ref: 'Acts 28:1',
      variants: [{ type: 'card', kind: 'knowledge',
                   prompt: 'On which island was Paul shipwrecked?' }] },
  ],
};
