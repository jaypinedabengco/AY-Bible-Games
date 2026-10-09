/*
 * Hot Potato - the deck.
 *
 * HAND-WRITTEN, unlike What Came First? and Higher or Lower, which are
 * generated because their content is facts that cannot be proofread by eye.
 * These cards are writing. There is no source to derive them from.
 *
 * EVERY CARD IS A TASK, deliberately. A task is something the holder DOES, and
 * its text goes in `answer` because a task IS its own identity - validate.js
 * already rejects two puzzles sharing an answer, so that buys duplicate-card
 * detection for free. No `prompt`, no `ref`.
 *
 * Trivia was dropped on purpose: a question is spent the moment the room hears
 * the answer, but "give two verses that have helped you" is different every
 * time, because a different person is holding the potato. So the test of a
 * card is whether it is still good when it comes up again in three months. The
 * scripture questions that were here are kept, verified, in
 * tools/bible-questions.json. The engine's knowledge-card path still exists in
 * core/views.js for a deck that wants it; this deck just does not use it.
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
  sessionSize: 12,
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
    // Every card is a TASK: something the holder does, text in `answer`, no
    // prompt and no ref. A card must be worth doing again in three months with a
    // different person holding the potato; trivia is spent once the room has heard
    // the answer. The scripture questions are kept in tools/bible-questions.json.
    { id: 'hp-01', answer: 'Recite any two verses from memory',
      variants: [{ type: 'card', kind: 'task' }] },
    { id: 'hp-02', answer: 'Say John 3:16 out loud, and let the room join in',
      variants: [{ type: 'card', kind: 'task' }] },
    { id: 'hp-03', answer: 'Say the Lord’s Prayer together, with the room joining in',
      variants: [{ type: 'card', kind: 'task' }] },
    { id: 'hp-04', answer: 'Read Psalm 117 aloud with the person next to you, one verse each',
      variants: [{ type: 'card', kind: 'task' }] },
    { id: 'hp-05', answer: 'Say the verse that means the most to you, then say in one sentence why',
      variants: [{ type: 'card', kind: 'task' }] },
    { id: 'hp-06', answer: 'Find Proverbs 3:5-6 in your Bible and read it aloud',
      variants: [{ type: 'card', kind: 'task' }] },
    { id: 'hp-07', answer: 'Find the shortest verse in the Bible, John 11:35, and read it aloud',
      variants: [{ type: 'card', kind: 'task' }] },
    { id: 'hp-08', answer: 'Sing one verse of a hymn with the person on your left',
      variants: [{ type: 'card', kind: 'task' }] },
    { id: 'hp-09', answer: 'Sing the chorus of a worship song with the person on your right',
      variants: [{ type: 'card', kind: 'task' }] },
    { id: 'hp-10', answer: 'Name a song you want everyone to sing, then start it off',
      variants: [{ type: 'card', kind: 'task' }] },
    { id: 'hp-11', answer: 'With a neighbour, hum a few notes of a song and let the room guess it for up to 30 seconds, or until they get it',
      variants: [{ type: 'card', kind: 'task' }] },
    { id: 'hp-12', answer: 'Name five of the twelve disciples',
      variants: [{ type: 'card', kind: 'task' }] },
    { id: 'hp-13', answer: 'Name five books of the New Testament',
      variants: [{ type: 'card', kind: 'task' }] },
    { id: 'hp-14', answer: 'Name five people from the Old Testament',
      variants: [{ type: 'card', kind: 'task' }] },
    { id: 'hp-15', answer: 'Name four of the ten plagues of Egypt, and ask the room to help if you get stuck',
      variants: [{ type: 'card', kind: 'task' }] },
    { id: 'hp-16', answer: 'Name three women of the Bible',
      variants: [{ type: 'card', kind: 'task' }] },
    { id: 'hp-17', answer: 'Name four miracles that Jesus did',
      variants: [{ type: 'card', kind: 'task' }] },
    { id: 'hp-18', answer: 'Name three stories that Jesus told',
      variants: [{ type: 'card', kind: 'task' }] },
    { id: 'hp-19', answer: 'Name four animals that appear in the Bible',
      variants: [{ type: 'card', kind: 'task' }] },
    { id: 'hp-20', answer: 'Name three of the nine fruits of the Spirit',
      variants: [{ type: 'card', kind: 'task' }] },
    { id: 'hp-21', answer: 'Say in one sentence what grace means',
      variants: [{ type: 'card', kind: 'task' }] },
    { id: 'hp-22', answer: 'Say in one sentence why we pray',
      variants: [{ type: 'card', kind: 'task' }] },
    { id: 'hp-23', answer: 'Say in one sentence what the good news is',
      variants: [{ type: 'card', kind: 'task' }] },
    { id: 'hp-24', answer: 'Finish this sentence out loud: “I know God is faithful because…”',
      variants: [{ type: 'card', kind: 'task' }] },
    { id: 'hp-25', answer: 'Say in one sentence what you would tell a friend who asked what church is for',
      variants: [{ type: 'card', kind: 'task' }] },
    { id: 'hp-26', answer: 'Say a short prayer out loud for a friend or family member, without naming them',
      variants: [{ type: 'card', kind: 'task' }] },
    { id: 'hp-27', answer: 'Thank God out loud for three things from this week',
      variants: [{ type: 'card', kind: 'task' }] },
    { id: 'hp-28', answer: 'Say a one-sentence prayer of thanks for this place and the people in it',
      variants: [{ type: 'card', kind: 'task' }] },
    { id: 'hp-29', answer: 'Pray one sentence for someone who is having a hard week, without naming them',
      variants: [{ type: 'card', kind: 'task' }] },
    { id: 'hp-30', answer: 'Pray one sentence for the leaders of this group',
      variants: [{ type: 'card', kind: 'task' }] },
    { id: 'hp-31', answer: 'With the people next to you, freeze in a pose that shows a Bible scene, and let the room guess for up to 30 seconds',
      variants: [{ type: 'card', kind: 'task' }] },
    { id: 'hp-32', answer: 'With a neighbour, act out a Bible story without words, and let the room guess for up to 30 seconds',
      variants: [{ type: 'card', kind: 'task' }] },
    { id: 'hp-33', answer: 'With your hands only, show one thing a shepherd does for his sheep, and let the room guess it for up to 30 seconds, or until they get it',
      variants: [{ type: 'card', kind: 'task' }] },
    { id: 'hp-34', answer: 'Tell everyone your favourite Bible story in one sentence',
      variants: [{ type: 'card', kind: 'task' }] },
    { id: 'hp-35', answer: 'Say which Bible character you would most like to meet, and why',
      variants: [{ type: 'card', kind: 'task' }] },
    { id: 'hp-36', answer: 'Say one thing you are thankful for today',
      variants: [{ type: 'card', kind: 'task' }] },
    { id: 'hp-37', answer: 'Give two verses that have helped you in a hard time',
      variants: [{ type: 'card', kind: 'task' }] },
    { id: 'hp-38', answer: 'Say out loud one thing you are glad about in this youth group',
      variants: [{ type: 'card', kind: 'task' }] },
    { id: 'hp-39', answer: 'With the person next to you, find a verse about love and read it to each other',
      variants: [{ type: 'card', kind: 'task' }] },
    { id: 'hp-40', answer: 'Finish this sentence out loud: “Something I have learned about God lately is…”',
      variants: [{ type: 'card', kind: 'task' }] },
    { id: 'hp-41', answer: 'Say a verse you learned as a child, as best you remember it',
      variants: [{ type: 'card', kind: 'task' }] },
    { id: 'hp-42', answer: 'Open your Bible to a Psalm you like and read two verses from it aloud',
      variants: [{ type: 'card', kind: 'task' }] },
    { id: 'hp-43', answer: 'Say a verse you would give a friend who is scared',
      variants: [{ type: 'card', kind: 'task' }] },
    { id: 'hp-44', answer: 'Say a verse that reminds you God is with you',
      variants: [{ type: 'card', kind: 'task' }] },
    { id: 'hp-45', answer: 'Say one thing that made you smile this week',
      variants: [{ type: 'card', kind: 'task' }] },
    { id: 'hp-46', answer: 'Say one thing you are looking forward to',
      variants: [{ type: 'card', kind: 'task' }] },
    { id: 'hp-47', answer: 'Say one thing you enjoy doing when nobody is making you',
      variants: [{ type: 'card', kind: 'task' }] },
    { id: 'hp-48', answer: 'Say what you would be doing right now if you were not here',
      variants: [{ type: 'card', kind: 'task' }] },
    { id: 'hp-49', answer: 'Say one thing you would ask God if you could sit with him for five minutes',
      variants: [{ type: 'card', kind: 'task' }] },
    { id: 'hp-50', answer: 'Say one way you have seen God help someone lately',
      variants: [{ type: 'card', kind: 'task' }] },
    { id: 'hp-51', answer: 'Say the funniest thing you have seen happen in church, without naming anyone',
      variants: [{ type: 'card', kind: 'task' }] },
    { id: 'hp-52', answer: 'Say which Bible story would make the best film, and why',
      variants: [{ type: 'card', kind: 'task' }] },
    { id: 'hp-53', answer: 'Say one thing you hope heaven will be like',
      variants: [{ type: 'card', kind: 'task' }] },
    { id: 'hp-54', answer: 'Say one sentence you would tell someone who had never heard of Jesus',
      variants: [{ type: 'card', kind: 'task' }] },
    { id: 'hp-55', answer: 'Finish this sentence out loud: “I feel closest to God when…”',
      variants: [{ type: 'card', kind: 'task' }] },
    { id: 'hp-56', answer: 'Finish this sentence out loud: “A church should be a place where…”',
      variants: [{ type: 'card', kind: 'task' }] },
    { id: 'hp-57', answer: 'Finish this sentence out loud: “The best advice I ever heard was…”',
      variants: [{ type: 'card', kind: 'task' }] },
    { id: 'hp-58', answer: 'Finish this sentence out loud: “One thing Jesus did that surprises me is…”',
      variants: [{ type: 'card', kind: 'task' }] },
    { id: 'hp-59', answer: 'Finish this sentence out loud: “If I could say one thing to my younger self, it would be…”',
      variants: [{ type: 'card', kind: 'task' }] },
    { id: 'hp-60', answer: 'Say a one-sentence prayer for the week ahead',
      variants: [{ type: 'card', kind: 'task' }] },
    { id: 'hp-61', answer: 'Pray one sentence of thanks for the food you ate today',
      variants: [{ type: 'card', kind: 'task' }] },
    { id: 'hp-62', answer: 'Pray one sentence for the place where you spend most of your week',
      variants: [{ type: 'card', kind: 'task' }] },
    { id: 'hp-63', answer: 'Sing one line of a song that makes you feel peaceful',
      variants: [{ type: 'card', kind: 'task' }] },
    { id: 'hp-64', answer: 'Say one line from a worship song that you like, and why you like it',
      variants: [{ type: 'card', kind: 'task' }] },
    { id: 'hp-65', answer: 'With a neighbour, read Psalm 136:1-4 aloud one verse each, and let the room join in on the line that repeats',
      variants: [{ type: 'card', kind: 'task' }] },
    { id: 'hp-66', answer: 'With a neighbour, agree on one verse and read it together out loud',
      variants: [{ type: 'card', kind: 'task' }] },
    { id: 'hp-67', answer: 'Name three things in creation that you are thankful God made',
      variants: [{ type: 'card', kind: 'task' }] },
    { id: 'hp-68', answer: 'Say three words that describe what God is like',
      variants: [{ type: 'card', kind: 'task' }] },
    { id: 'hp-69', answer: 'Name three things you could do this week to show kindness',
      variants: [{ type: 'card', kind: 'task' }] },
    { id: 'hp-70', answer: 'Stand up, stretch, and thank God for one thing your body can do',
      variants: [{ type: 'card', kind: 'task' }] },
    { id: 'hp-71', answer: 'Give the room one sentence of encouragement for the week ahead',
      variants: [{ type: 'card', kind: 'task' }] },
  ],
};
