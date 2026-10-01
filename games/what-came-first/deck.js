/*
 * What Came First? - the deck.
 *
 * GENERATED. Do not edit by hand: run
 *
 *     node tools/make-what-came-first.js
 *
 * after changing tools/chronology.json, which is the one hand-written thing
 * behind this game and the only place a date should ever be corrected.
 *
 * THE GAME. Three things from the Bible go up scrambled; the room shouts which
 * order they belong in. Two beats: the scramble, then the sequence with dates.
 *
 * WHY THREE AND NOT TWO. This began as "Before or After", and a two-way
 * question is a coin flip - half a hall shouts each way and somebody is always
 * right by luck, so the moment where a room converges and KNOWS never arrives.
 * Three items have six orderings, which cannot be fluked.
 *
 * THE ACCURACY RULE, WHICH IS THE WHOLE JOB. A confident wrong answer on a
 * screen in church is worse than not having the game. So every date is hedged
 * with "c.", because the year is not the claim being made - the ORDER is - and
 * anything whose century is genuinely contested is left out of the anchor list
 * rather than guessed at. See tools/chronology.json for what was excluded and
 * why.
 */
window.DECK = {
  id: 'what-came-first',
  title: 'What Came First?',
  idPrefix: 'wc',   // shown on the projector, so it must never hint the answer
  shuffle: true,
  // Two beats a puzzle rather than four, so a round moves fast. Fifteen
  // sits about level with the others in playing time - capped at the list,
  // because the validator rejects a session longer than it.
  sessionSize: 15,
  languages: ['en', 'fil'],
  howToPlay: [
    'Three things from the Bible, in the wrong order.',
    'The room says which came first, second and third.',
  ],
  // No credits and no versions: nothing here is quoted. The labels are
  // ours in both languages, and a date belongs to nobody.
  puzzles: [
    {
      id: 'wc-01', answer: 'THE CREATION → THE FLOOD → JOSEPH', difficulty: 1,
      variants: [
        { type: 'order', difficulty: 1,
          prompt: 'Put these in order, earliest first',
          items: ['THE FLOOD', 'JOSEPH', 'THE CREATION'],
          correct: [
            { label: 'THE CREATION', when: 'the beginning' },
            { label: 'THE FLOOD', when: 'c. 2400 BC' },
            { label: 'JOSEPH', when: 'c. 1800 BC' },
          ] },
        { type: 'order', difficulty: 1, lang: 'fil',
          prompt: 'Ayusin ito, mula sa pinakauna',
          items: ['ANG MALAKING BAHA', 'JOSE', 'ANG PAGLIKHA'],
          correct: [
            { label: 'ANG PAGLIKHA', when: 'ang simula' },
            { label: 'ANG MALAKING BAHA', when: 'mga 2400 BC' },
            { label: 'JOSE', when: 'mga 1800 BC' },
          ] },
      ],
    },
    {
      id: 'wc-02', answer: 'THE TOWER OF BABEL → SLAVERY IN EGYPT → ISAIAH', difficulty: 1,
      variants: [
        { type: 'order', difficulty: 1,
          prompt: 'Put these in order, earliest first',
          items: ['SLAVERY IN EGYPT', 'ISAIAH', 'THE TOWER OF BABEL'],
          correct: [
            { label: 'THE TOWER OF BABEL', when: 'c. 2200 BC' },
            { label: 'SLAVERY IN EGYPT', when: 'c. 1600 BC' },
            { label: 'ISAIAH', when: 'c. 740 BC' },
          ] },
        { type: 'order', difficulty: 1, lang: 'fil',
          prompt: 'Ayusin ito, mula sa pinakauna',
          items: ['PAGKAALIPIN SA EGIPTO', 'ISAIAS', 'ANG TORE NG BABEL'],
          correct: [
            { label: 'ANG TORE NG BABEL', when: 'mga 2200 BC' },
            { label: 'PAGKAALIPIN SA EGIPTO', when: 'mga 1600 BC' },
            { label: 'ISAIAS', when: 'mga 740 BC' },
          ] },
      ],
    },
    {
      id: 'wc-03', answer: 'ABRAHAM → MOSES IS BORN → THE EXILE TO BABYLON', difficulty: 1,
      variants: [
        { type: 'order', difficulty: 1,
          prompt: 'Put these in order, earliest first',
          items: ['MOSES IS BORN', 'THE EXILE TO BABYLON', 'ABRAHAM'],
          correct: [
            { label: 'ABRAHAM', when: 'c. 2000 BC' },
            { label: 'MOSES IS BORN', when: 'c. 1500 BC' },
            { label: 'THE EXILE TO BABYLON', when: 'c. 590 BC' },
          ] },
        { type: 'order', difficulty: 1, lang: 'fil',
          prompt: 'Ayusin ito, mula sa pinakauna',
          items: ['ISINILANG SI MOISES', 'PAGKATAPON SA BABILONIA', 'ABRAHAM'],
          correct: [
            { label: 'ABRAHAM', when: 'mga 2000 BC' },
            { label: 'ISINILANG SI MOISES', when: 'mga 1500 BC' },
            { label: 'PAGKATAPON SA BABILONIA', when: 'mga 590 BC' },
          ] },
      ],
    },
    {
      id: 'wc-04', answer: 'ISAAC → THE EXODUS → ALEXANDER THE GREAT', difficulty: 1,
      variants: [
        { type: 'order', difficulty: 1,
          prompt: 'Put these in order, earliest first',
          items: ['ALEXANDER THE GREAT', 'THE EXODUS', 'ISAAC'],
          correct: [
            { label: 'ISAAC', when: 'c. 1950 BC' },
            { label: 'THE EXODUS', when: 'c. 1450 BC' },
            { label: 'ALEXANDER THE GREAT', when: 'c. 330 BC' },
          ] },
        { type: 'order', difficulty: 1, lang: 'fil',
          prompt: 'Ayusin ito, mula sa pinakauna',
          items: ['ALEJANDRONG DAKILA', 'ANG EXODO', 'ISAAC'],
          correct: [
            { label: 'ISAAC', when: 'mga 1950 BC' },
            { label: 'ANG EXODO', when: 'mga 1450 BC' },
            { label: 'ALEJANDRONG DAKILA', when: 'mga 330 BC' },
          ] },
      ],
    },
    {
      id: 'wc-05', answer: 'JACOB → THE WALLS OF JERICHO → ELIJAH', difficulty: 1,
      variants: [
        { type: 'order', difficulty: 1,
          prompt: 'Put these in order, earliest first',
          items: ['THE WALLS OF JERICHO', 'ELIJAH', 'JACOB'],
          correct: [
            { label: 'JACOB', when: 'c. 1900 BC' },
            { label: 'THE WALLS OF JERICHO', when: 'c. 1400 BC' },
            { label: 'ELIJAH', when: 'c. 860 BC' },
          ] },
        { type: 'order', difficulty: 1, lang: 'fil',
          prompt: 'Ayusin ito, mula sa pinakauna',
          items: ['ANG PADER NG JERICO', 'ELIAS', 'JACOB'],
          correct: [
            { label: 'JACOB', when: 'mga 1900 BC' },
            { label: 'ANG PADER NG JERICO', when: 'mga 1400 BC' },
            { label: 'ELIAS', when: 'mga 860 BC' },
          ] },
      ],
    },
    {
      id: 'wc-06', answer: 'DEBORAH → JEREMIAH → PAUL WRITES ROMANS', difficulty: 1,
      variants: [
        { type: 'order', difficulty: 1,
          prompt: 'Put these in order, earliest first',
          items: ['JEREMIAH', 'DEBORAH', 'PAUL WRITES ROMANS'],
          correct: [
            { label: 'DEBORAH', when: 'c. 1200 BC' },
            { label: 'JEREMIAH', when: 'c. 620 BC' },
            { label: 'PAUL WRITES ROMANS', when: 'c. AD 57' },
          ] },
        { type: 'order', difficulty: 1, lang: 'fil',
          prompt: 'Ayusin ito, mula sa pinakauna',
          items: ['JEREMIAS', 'DEBORA', 'SULAT NI PABLO SA ROMA'],
          correct: [
            { label: 'DEBORA', when: 'mga 1200 BC' },
            { label: 'JEREMIAS', when: 'mga 620 BC' },
            { label: 'SULAT NI PABLO SA ROMA', when: 'mga AD 57' },
          ] },
      ],
    },
    {
      id: 'wc-07', answer: 'GIDEON → ESTHER → JESUS IS BORN', difficulty: 1,
      variants: [
        { type: 'order', difficulty: 1,
          prompt: 'Put these in order, earliest first',
          items: ['JESUS IS BORN', 'ESTHER', 'GIDEON'],
          correct: [
            { label: 'GIDEON', when: 'c. 1150 BC' },
            { label: 'ESTHER', when: 'c. 480 BC' },
            { label: 'JESUS IS BORN', when: 'c. 5 BC' },
          ] },
        { type: 'order', difficulty: 1, lang: 'fil',
          prompt: 'Ayusin ito, mula sa pinakauna',
          items: ['ISINILANG SI JESUS', 'ESTER', 'GEDEON'],
          correct: [
            { label: 'GEDEON', when: 'mga 1150 BC' },
            { label: 'ESTER', when: 'mga 480 BC' },
            { label: 'ISINILANG SI JESUS', when: 'mga 5 BC' },
          ] },
      ],
    },
    {
      id: 'wc-08', answer: 'SAUL BECOMES KING → DANIEL AND THE LIONS → THE CROSS', difficulty: 1,
      variants: [
        { type: 'order', difficulty: 1,
          prompt: 'Put these in order, earliest first',
          items: ['DANIEL AND THE LIONS', 'THE CROSS', 'SAUL BECOMES KING'],
          correct: [
            { label: 'SAUL BECOMES KING', when: 'c. 1050 BC' },
            { label: 'DANIEL AND THE LIONS', when: 'c. 540 BC' },
            { label: 'THE CROSS', when: 'c. AD 31' },
          ] },
        { type: 'order', difficulty: 1, lang: 'fil',
          prompt: 'Ayusin ito, mula sa pinakauna',
          items: ['DANIEL AT ANG MGA LEON', 'ANG KRUS', 'NAGING HARI SI SAUL'],
          correct: [
            { label: 'NAGING HARI SI SAUL', when: 'mga 1050 BC' },
            { label: 'DANIEL AT ANG MGA LEON', when: 'mga 540 BC' },
            { label: 'ANG KRUS', when: 'mga AD 31' },
          ] },
      ],
    },
    {
      id: 'wc-09', answer: 'SAMSON → DANIEL AND THE LIONS → JOHN WRITES REVELATION', difficulty: 1,
      variants: [
        { type: 'order', difficulty: 1,
          prompt: 'Put these in order, earliest first',
          items: ['DANIEL AND THE LIONS', 'SAMSON', 'JOHN WRITES REVELATION'],
          correct: [
            { label: 'SAMSON', when: 'c. 1100 BC' },
            { label: 'DANIEL AND THE LIONS', when: 'c. 540 BC' },
            { label: 'JOHN WRITES REVELATION', when: 'c. AD 95' },
          ] },
        { type: 'order', difficulty: 1, lang: 'fil',
          prompt: 'Ayusin ito, mula sa pinakauna',
          items: ['DANIEL AT ANG MGA LEON', 'SAMSON', 'ANG APOCALIPSIS'],
          correct: [
            { label: 'SAMSON', when: 'mga 1100 BC' },
            { label: 'DANIEL AT ANG MGA LEON', when: 'mga 540 BC' },
            { label: 'ANG APOCALIPSIS', when: 'mga AD 95' },
          ] },
      ],
    },
    {
      id: 'wc-10', answer: 'DAVID BECOMES KING → ESTHER → ROME TAKES JERUSALEM', difficulty: 1,
      variants: [
        { type: 'order', difficulty: 1,
          prompt: 'Put these in order, earliest first',
          items: ['ESTHER', 'ROME TAKES JERUSALEM', 'DAVID BECOMES KING'],
          correct: [
            { label: 'DAVID BECOMES KING', when: 'c. 1000 BC' },
            { label: 'ESTHER', when: 'c. 480 BC' },
            { label: 'ROME TAKES JERUSALEM', when: 'c. 60 BC' },
          ] },
        { type: 'order', difficulty: 1, lang: 'fil',
          prompt: 'Ayusin ito, mula sa pinakauna',
          items: ['ESTER', 'PAGSAKOP NG ROMA SA JERUSALEM', 'NAGING HARI SI DAVID'],
          correct: [
            { label: 'NAGING HARI SI DAVID', when: 'mga 1000 BC' },
            { label: 'ESTER', when: 'mga 480 BC' },
            { label: 'PAGSAKOP NG ROMA SA JERUSALEM', when: 'mga 60 BC' },
          ] },
      ],
    },
    {
      id: 'wc-11', answer: 'THE WALLS OF JERICHO → SOLOMON → PENTECOST', difficulty: 1,
      variants: [
        { type: 'order', difficulty: 1,
          prompt: 'Put these in order, earliest first',
          items: ['PENTECOST', 'SOLOMON', 'THE WALLS OF JERICHO'],
          correct: [
            { label: 'THE WALLS OF JERICHO', when: 'c. 1400 BC' },
            { label: 'SOLOMON', when: 'c. 960 BC' },
            { label: 'PENTECOST', when: 'c. AD 31' },
          ] },
        { type: 'order', difficulty: 1, lang: 'fil',
          prompt: 'Ayusin ito, mula sa pinakauna',
          items: ['ANG PENTECOSTES', 'SOLOMON', 'ANG PADER NG JERICO'],
          correct: [
            { label: 'ANG PADER NG JERICO', when: 'mga 1400 BC' },
            { label: 'SOLOMON', when: 'mga 960 BC' },
            { label: 'ANG PENTECOSTES', when: 'mga AD 31' },
          ] },
      ],
    },
    {
      id: 'wc-12', answer: 'ISAAC → SOLOMON → THE FALL OF JERUSALEM', difficulty: 1,
      variants: [
        { type: 'order', difficulty: 1,
          prompt: 'Put these in order, earliest first',
          items: ['SOLOMON', 'THE FALL OF JERUSALEM', 'ISAAC'],
          correct: [
            { label: 'ISAAC', when: 'c. 1950 BC' },
            { label: 'SOLOMON', when: 'c. 960 BC' },
            { label: 'THE FALL OF JERUSALEM', when: 'c. AD 70' },
          ] },
        { type: 'order', difficulty: 1, lang: 'fil',
          prompt: 'Ayusin ito, mula sa pinakauna',
          items: ['SOLOMON', 'PAGBAGSAK NG JERUSALEM', 'ISAAC'],
          correct: [
            { label: 'ISAAC', when: 'mga 1950 BC' },
            { label: 'SOLOMON', when: 'mga 960 BC' },
            { label: 'PAGBAGSAK NG JERUSALEM', when: 'mga AD 70' },
          ] },
      ],
    },
    {
      id: 'wc-13', answer: 'MOSES IS BORN → DAVID BECOMES KING → PAUL IS CONVERTED', difficulty: 1,
      variants: [
        { type: 'order', difficulty: 1,
          prompt: 'Put these in order, earliest first',
          items: ['DAVID BECOMES KING', 'PAUL IS CONVERTED', 'MOSES IS BORN'],
          correct: [
            { label: 'MOSES IS BORN', when: 'c. 1500 BC' },
            { label: 'DAVID BECOMES KING', when: 'c. 1000 BC' },
            { label: 'PAUL IS CONVERTED', when: 'c. AD 34' },
          ] },
        { type: 'order', difficulty: 1, lang: 'fil',
          prompt: 'Ayusin ito, mula sa pinakauna',
          items: ['NAGING HARI SI DAVID', 'NAGBALIK-LOOB SI PABLO', 'ISINILANG SI MOISES'],
          correct: [
            { label: 'ISINILANG SI MOISES', when: 'mga 1500 BC' },
            { label: 'NAGING HARI SI DAVID', when: 'mga 1000 BC' },
            { label: 'NAGBALIK-LOOB SI PABLO', when: 'mga AD 34' },
          ] },
      ],
    },
    {
      id: 'wc-14', answer: 'SAUL BECOMES KING → JEREMIAH → JOHN THE BAPTIST', difficulty: 1,
      variants: [
        { type: 'order', difficulty: 1,
          prompt: 'Put these in order, earliest first',
          items: ['SAUL BECOMES KING', 'JOHN THE BAPTIST', 'JEREMIAH'],
          correct: [
            { label: 'SAUL BECOMES KING', when: 'c. 1050 BC' },
            { label: 'JEREMIAH', when: 'c. 620 BC' },
            { label: 'JOHN THE BAPTIST', when: 'c. AD 28' },
          ] },
        { type: 'order', difficulty: 1, lang: 'fil',
          prompt: 'Ayusin ito, mula sa pinakauna',
          items: ['NAGING HARI SI SAUL', 'JUAN BAUTISTA', 'JEREMIAS'],
          correct: [
            { label: 'NAGING HARI SI SAUL', when: 'mga 1050 BC' },
            { label: 'JEREMIAS', when: 'mga 620 BC' },
            { label: 'JUAN BAUTISTA', when: 'mga AD 28' },
          ] },
      ],
    },
    {
      id: 'wc-15', answer: 'SAMSON → THE EXILE TO BABYLON → JOHN THE BAPTIST', difficulty: 1,
      variants: [
        { type: 'order', difficulty: 1,
          prompt: 'Put these in order, earliest first',
          items: ['SAMSON', 'JOHN THE BAPTIST', 'THE EXILE TO BABYLON'],
          correct: [
            { label: 'SAMSON', when: 'c. 1100 BC' },
            { label: 'THE EXILE TO BABYLON', when: 'c. 590 BC' },
            { label: 'JOHN THE BAPTIST', when: 'c. AD 28' },
          ] },
        { type: 'order', difficulty: 1, lang: 'fil',
          prompt: 'Ayusin ito, mula sa pinakauna',
          items: ['SAMSON', 'JUAN BAUTISTA', 'PAGKATAPON SA BABILONIA'],
          correct: [
            { label: 'SAMSON', when: 'mga 1100 BC' },
            { label: 'PAGKATAPON SA BABILONIA', when: 'mga 590 BC' },
            { label: 'JUAN BAUTISTA', when: 'mga AD 28' },
          ] },
      ],
    },
    {
      id: 'wc-16', answer: 'THE CREATION → GIDEON → PAUL IS CONVERTED', difficulty: 1,
      variants: [
        { type: 'order', difficulty: 1,
          prompt: 'Put these in order, earliest first',
          items: ['GIDEON', 'THE CREATION', 'PAUL IS CONVERTED'],
          correct: [
            { label: 'THE CREATION', when: 'the beginning' },
            { label: 'GIDEON', when: 'c. 1150 BC' },
            { label: 'PAUL IS CONVERTED', when: 'c. AD 34' },
          ] },
        { type: 'order', difficulty: 1, lang: 'fil',
          prompt: 'Ayusin ito, mula sa pinakauna',
          items: ['GEDEON', 'ANG PAGLIKHA', 'NAGBALIK-LOOB SI PABLO'],
          correct: [
            { label: 'ANG PAGLIKHA', when: 'ang simula' },
            { label: 'GEDEON', when: 'mga 1150 BC' },
            { label: 'NAGBALIK-LOOB SI PABLO', when: 'mga AD 34' },
          ] },
      ],
    },
    {
      id: 'wc-17', answer: 'DEBORAH → ALEXANDER THE GREAT → THE FALL OF JERUSALEM', difficulty: 1,
      variants: [
        { type: 'order', difficulty: 1,
          prompt: 'Put these in order, earliest first',
          items: ['DEBORAH', 'THE FALL OF JERUSALEM', 'ALEXANDER THE GREAT'],
          correct: [
            { label: 'DEBORAH', when: 'c. 1200 BC' },
            { label: 'ALEXANDER THE GREAT', when: 'c. 330 BC' },
            { label: 'THE FALL OF JERUSALEM', when: 'c. AD 70' },
          ] },
        { type: 'order', difficulty: 1, lang: 'fil',
          prompt: 'Ayusin ito, mula sa pinakauna',
          items: ['DEBORA', 'PAGBAGSAK NG JERUSALEM', 'ALEJANDRONG DAKILA'],
          correct: [
            { label: 'DEBORA', when: 'mga 1200 BC' },
            { label: 'ALEJANDRONG DAKILA', when: 'mga 330 BC' },
            { label: 'PAGBAGSAK NG JERUSALEM', when: 'mga AD 70' },
          ] },
      ],
    },
    {
      id: 'wc-18', answer: 'JACOB → ISAIAH → PENTECOST', difficulty: 1,
      variants: [
        { type: 'order', difficulty: 1,
          prompt: 'Put these in order, earliest first',
          items: ['PENTECOST', 'ISAIAH', 'JACOB'],
          correct: [
            { label: 'JACOB', when: 'c. 1900 BC' },
            { label: 'ISAIAH', when: 'c. 740 BC' },
            { label: 'PENTECOST', when: 'c. AD 31' },
          ] },
        { type: 'order', difficulty: 1, lang: 'fil',
          prompt: 'Ayusin ito, mula sa pinakauna',
          items: ['ANG PENTECOSTES', 'ISAIAS', 'JACOB'],
          correct: [
            { label: 'JACOB', when: 'mga 1900 BC' },
            { label: 'ISAIAS', when: 'mga 740 BC' },
            { label: 'ANG PENTECOSTES', when: 'mga AD 31' },
          ] },
      ],
    },
    {
      id: 'wc-19', answer: 'THE TOWER OF BABEL → ISAAC → JOSEPH', difficulty: 2,
      variants: [
        { type: 'order', difficulty: 2,
          prompt: 'Put these in order, earliest first',
          items: ['ISAAC', 'THE TOWER OF BABEL', 'JOSEPH'],
          correct: [
            { label: 'THE TOWER OF BABEL', when: 'c. 2200 BC' },
            { label: 'ISAAC', when: 'c. 1950 BC' },
            { label: 'JOSEPH', when: 'c. 1800 BC' },
          ] },
        { type: 'order', difficulty: 2, lang: 'fil',
          prompt: 'Ayusin ito, mula sa pinakauna',
          items: ['ISAAC', 'ANG TORE NG BABEL', 'JOSE'],
          correct: [
            { label: 'ANG TORE NG BABEL', when: 'mga 2200 BC' },
            { label: 'ISAAC', when: 'mga 1950 BC' },
            { label: 'JOSE', when: 'mga 1800 BC' },
          ] },
      ],
    },
    {
      id: 'wc-20', answer: 'ABRAHAM → JOSEPH → SLAVERY IN EGYPT', difficulty: 2,
      variants: [
        { type: 'order', difficulty: 2,
          prompt: 'Put these in order, earliest first',
          items: ['JOSEPH', 'ABRAHAM', 'SLAVERY IN EGYPT'],
          correct: [
            { label: 'ABRAHAM', when: 'c. 2000 BC' },
            { label: 'JOSEPH', when: 'c. 1800 BC' },
            { label: 'SLAVERY IN EGYPT', when: 'c. 1600 BC' },
          ] },
        { type: 'order', difficulty: 2, lang: 'fil',
          prompt: 'Ayusin ito, mula sa pinakauna',
          items: ['JOSE', 'ABRAHAM', 'PAGKAALIPIN SA EGIPTO'],
          correct: [
            { label: 'ABRAHAM', when: 'mga 2000 BC' },
            { label: 'JOSE', when: 'mga 1800 BC' },
            { label: 'PAGKAALIPIN SA EGIPTO', when: 'mga 1600 BC' },
          ] },
      ],
    },
    {
      id: 'wc-21', answer: 'THE EXODUS → GIDEON → ELIJAH', difficulty: 2,
      variants: [
        { type: 'order', difficulty: 2,
          prompt: 'Put these in order, earliest first',
          items: ['GIDEON', 'THE EXODUS', 'ELIJAH'],
          correct: [
            { label: 'THE EXODUS', when: 'c. 1450 BC' },
            { label: 'GIDEON', when: 'c. 1150 BC' },
            { label: 'ELIJAH', when: 'c. 860 BC' },
          ] },
        { type: 'order', difficulty: 2, lang: 'fil',
          prompt: 'Ayusin ito, mula sa pinakauna',
          items: ['GEDEON', 'ANG EXODO', 'ELIAS'],
          correct: [
            { label: 'ANG EXODO', when: 'mga 1450 BC' },
            { label: 'GEDEON', when: 'mga 1150 BC' },
            { label: 'ELIAS', when: 'mga 860 BC' },
          ] },
      ],
    },
    {
      id: 'wc-22', answer: 'ALEXANDER THE GREAT → ROME TAKES JERUSALEM → JOHN WRITES REVELATION', difficulty: 2,
      variants: [
        { type: 'order', difficulty: 2,
          prompt: 'Put these in order, earliest first',
          items: ['JOHN WRITES REVELATION', 'ROME TAKES JERUSALEM', 'ALEXANDER THE GREAT'],
          correct: [
            { label: 'ALEXANDER THE GREAT', when: 'c. 330 BC' },
            { label: 'ROME TAKES JERUSALEM', when: 'c. 60 BC' },
            { label: 'JOHN WRITES REVELATION', when: 'c. AD 95' },
          ] },
        { type: 'order', difficulty: 2, lang: 'fil',
          prompt: 'Ayusin ito, mula sa pinakauna',
          items: ['ANG APOCALIPSIS', 'PAGSAKOP NG ROMA SA JERUSALEM', 'ALEJANDRONG DAKILA'],
          correct: [
            { label: 'ALEJANDRONG DAKILA', when: 'mga 330 BC' },
            { label: 'PAGSAKOP NG ROMA SA JERUSALEM', when: 'mga 60 BC' },
            { label: 'ANG APOCALIPSIS', when: 'mga AD 95' },
          ] },
      ],
    },
    {
      id: 'wc-23', answer: 'DANIEL AND THE LIONS → ALEXANDER THE GREAT → JESUS IS BORN', difficulty: 2,
      variants: [
        { type: 'order', difficulty: 2,
          prompt: 'Put these in order, earliest first',
          items: ['DANIEL AND THE LIONS', 'JESUS IS BORN', 'ALEXANDER THE GREAT'],
          correct: [
            { label: 'DANIEL AND THE LIONS', when: 'c. 540 BC' },
            { label: 'ALEXANDER THE GREAT', when: 'c. 330 BC' },
            { label: 'JESUS IS BORN', when: 'c. 5 BC' },
          ] },
        { type: 'order', difficulty: 2, lang: 'fil',
          prompt: 'Ayusin ito, mula sa pinakauna',
          items: ['DANIEL AT ANG MGA LEON', 'ISINILANG SI JESUS', 'ALEJANDRONG DAKILA'],
          correct: [
            { label: 'DANIEL AT ANG MGA LEON', when: 'mga 540 BC' },
            { label: 'ALEJANDRONG DAKILA', when: 'mga 330 BC' },
            { label: 'ISINILANG SI JESUS', when: 'mga 5 BC' },
          ] },
      ],
    },
    {
      id: 'wc-24', answer: 'SLAVERY IN EGYPT → THE EXODUS → SAUL BECOMES KING', difficulty: 2,
      variants: [
        { type: 'order', difficulty: 2,
          prompt: 'Put these in order, earliest first',
          items: ['THE EXODUS', 'SLAVERY IN EGYPT', 'SAUL BECOMES KING'],
          correct: [
            { label: 'SLAVERY IN EGYPT', when: 'c. 1600 BC' },
            { label: 'THE EXODUS', when: 'c. 1450 BC' },
            { label: 'SAUL BECOMES KING', when: 'c. 1050 BC' },
          ] },
        { type: 'order', difficulty: 2, lang: 'fil',
          prompt: 'Ayusin ito, mula sa pinakauna',
          items: ['ANG EXODO', 'PAGKAALIPIN SA EGIPTO', 'NAGING HARI SI SAUL'],
          correct: [
            { label: 'PAGKAALIPIN SA EGIPTO', when: 'mga 1600 BC' },
            { label: 'ANG EXODO', when: 'mga 1450 BC' },
            { label: 'NAGING HARI SI SAUL', when: 'mga 1050 BC' },
          ] },
      ],
    },
    {
      id: 'wc-25', answer: 'THE FLOOD → THE TOWER OF BABEL → ABRAHAM', difficulty: 2,
      variants: [
        { type: 'order', difficulty: 2,
          prompt: 'Put these in order, earliest first',
          items: ['ABRAHAM', 'THE FLOOD', 'THE TOWER OF BABEL'],
          correct: [
            { label: 'THE FLOOD', when: 'c. 2400 BC' },
            { label: 'THE TOWER OF BABEL', when: 'c. 2200 BC' },
            { label: 'ABRAHAM', when: 'c. 2000 BC' },
          ] },
        { type: 'order', difficulty: 2, lang: 'fil',
          prompt: 'Ayusin ito, mula sa pinakauna',
          items: ['ABRAHAM', 'ANG MALAKING BAHA', 'ANG TORE NG BABEL'],
          correct: [
            { label: 'ANG MALAKING BAHA', when: 'mga 2400 BC' },
            { label: 'ANG TORE NG BABEL', when: 'mga 2200 BC' },
            { label: 'ABRAHAM', when: 'mga 2000 BC' },
          ] },
      ],
    },
    {
      id: 'wc-26', answer: 'SAMSON → ELIJAH → JEREMIAH', difficulty: 2,
      variants: [
        { type: 'order', difficulty: 2,
          prompt: 'Put these in order, earliest first',
          items: ['JEREMIAH', 'SAMSON', 'ELIJAH'],
          correct: [
            { label: 'SAMSON', when: 'c. 1100 BC' },
            { label: 'ELIJAH', when: 'c. 860 BC' },
            { label: 'JEREMIAH', when: 'c. 620 BC' },
          ] },
        { type: 'order', difficulty: 2, lang: 'fil',
          prompt: 'Ayusin ito, mula sa pinakauna',
          items: ['JEREMIAS', 'SAMSON', 'ELIAS'],
          correct: [
            { label: 'SAMSON', when: 'mga 1100 BC' },
            { label: 'ELIAS', when: 'mga 860 BC' },
            { label: 'JEREMIAS', when: 'mga 620 BC' },
          ] },
      ],
    },
    {
      id: 'wc-27', answer: 'THE WALLS OF JERICHO → DEBORAH → DAVID BECOMES KING', difficulty: 2,
      variants: [
        { type: 'order', difficulty: 2,
          prompt: 'Put these in order, earliest first',
          items: ['DAVID BECOMES KING', 'THE WALLS OF JERICHO', 'DEBORAH'],
          correct: [
            { label: 'THE WALLS OF JERICHO', when: 'c. 1400 BC' },
            { label: 'DEBORAH', when: 'c. 1200 BC' },
            { label: 'DAVID BECOMES KING', when: 'c. 1000 BC' },
          ] },
        { type: 'order', difficulty: 2, lang: 'fil',
          prompt: 'Ayusin ito, mula sa pinakauna',
          items: ['NAGING HARI SI DAVID', 'ANG PADER NG JERICO', 'DEBORA'],
          correct: [
            { label: 'ANG PADER NG JERICO', when: 'mga 1400 BC' },
            { label: 'DEBORA', when: 'mga 1200 BC' },
            { label: 'NAGING HARI SI DAVID', when: 'mga 1000 BC' },
          ] },
      ],
    },
    {
      id: 'wc-28', answer: 'DEBORAH → SOLOMON → THE EXILE TO BABYLON', difficulty: 2,
      variants: [
        { type: 'order', difficulty: 2,
          prompt: 'Put these in order, earliest first',
          items: ['SOLOMON', 'THE EXILE TO BABYLON', 'DEBORAH'],
          correct: [
            { label: 'DEBORAH', when: 'c. 1200 BC' },
            { label: 'SOLOMON', when: 'c. 960 BC' },
            { label: 'THE EXILE TO BABYLON', when: 'c. 590 BC' },
          ] },
        { type: 'order', difficulty: 2, lang: 'fil',
          prompt: 'Ayusin ito, mula sa pinakauna',
          items: ['SOLOMON', 'PAGKATAPON SA BABILONIA', 'DEBORA'],
          correct: [
            { label: 'DEBORA', when: 'mga 1200 BC' },
            { label: 'SOLOMON', when: 'mga 960 BC' },
            { label: 'PAGKATAPON SA BABILONIA', when: 'mga 590 BC' },
          ] },
      ],
    },
    {
      id: 'wc-29', answer: 'SAUL BECOMES KING → ISAIAH → ESTHER', difficulty: 2,
      variants: [
        { type: 'order', difficulty: 2,
          prompt: 'Put these in order, earliest first',
          items: ['ESTHER', 'ISAIAH', 'SAUL BECOMES KING'],
          correct: [
            { label: 'SAUL BECOMES KING', when: 'c. 1050 BC' },
            { label: 'ISAIAH', when: 'c. 740 BC' },
            { label: 'ESTHER', when: 'c. 480 BC' },
          ] },
        { type: 'order', difficulty: 2, lang: 'fil',
          prompt: 'Ayusin ito, mula sa pinakauna',
          items: ['ESTER', 'ISAIAS', 'NAGING HARI SI SAUL'],
          correct: [
            { label: 'NAGING HARI SI SAUL', when: 'mga 1050 BC' },
            { label: 'ISAIAS', when: 'mga 740 BC' },
            { label: 'ESTER', when: 'mga 480 BC' },
          ] },
      ],
    },
    {
      id: 'wc-30', answer: 'THE FLOOD → THE TOWER OF BABEL → JACOB', difficulty: 2,
      variants: [
        { type: 'order', difficulty: 2,
          prompt: 'Put these in order, earliest first',
          items: ['THE TOWER OF BABEL', 'JACOB', 'THE FLOOD'],
          correct: [
            { label: 'THE FLOOD', when: 'c. 2400 BC' },
            { label: 'THE TOWER OF BABEL', when: 'c. 2200 BC' },
            { label: 'JACOB', when: 'c. 1900 BC' },
          ] },
        { type: 'order', difficulty: 2, lang: 'fil',
          prompt: 'Ayusin ito, mula sa pinakauna',
          items: ['ANG TORE NG BABEL', 'JACOB', 'ANG MALAKING BAHA'],
          correct: [
            { label: 'ANG MALAKING BAHA', when: 'mga 2400 BC' },
            { label: 'ANG TORE NG BABEL', when: 'mga 2200 BC' },
            { label: 'JACOB', when: 'mga 1900 BC' },
          ] },
      ],
    },
    {
      id: 'wc-31', answer: 'THE EXILE TO BABYLON → ALEXANDER THE GREAT → THE CROSS', difficulty: 2,
      variants: [
        { type: 'order', difficulty: 2,
          prompt: 'Put these in order, earliest first',
          items: ['THE CROSS', 'THE EXILE TO BABYLON', 'ALEXANDER THE GREAT'],
          correct: [
            { label: 'THE EXILE TO BABYLON', when: 'c. 590 BC' },
            { label: 'ALEXANDER THE GREAT', when: 'c. 330 BC' },
            { label: 'THE CROSS', when: 'c. AD 31' },
          ] },
        { type: 'order', difficulty: 2, lang: 'fil',
          prompt: 'Ayusin ito, mula sa pinakauna',
          items: ['ANG KRUS', 'PAGKATAPON SA BABILONIA', 'ALEJANDRONG DAKILA'],
          correct: [
            { label: 'PAGKATAPON SA BABILONIA', when: 'mga 590 BC' },
            { label: 'ALEJANDRONG DAKILA', when: 'mga 330 BC' },
            { label: 'ANG KRUS', when: 'mga AD 31' },
          ] },
      ],
    },
    {
      id: 'wc-32', answer: 'ISAAC → JOSEPH → MOSES IS BORN', difficulty: 2,
      variants: [
        { type: 'order', difficulty: 2,
          prompt: 'Put these in order, earliest first',
          items: ['ISAAC', 'MOSES IS BORN', 'JOSEPH'],
          correct: [
            { label: 'ISAAC', when: 'c. 1950 BC' },
            { label: 'JOSEPH', when: 'c. 1800 BC' },
            { label: 'MOSES IS BORN', when: 'c. 1500 BC' },
          ] },
        { type: 'order', difficulty: 2, lang: 'fil',
          prompt: 'Ayusin ito, mula sa pinakauna',
          items: ['ISAAC', 'ISINILANG SI MOISES', 'JOSE'],
          correct: [
            { label: 'ISAAC', when: 'mga 1950 BC' },
            { label: 'JOSE', when: 'mga 1800 BC' },
            { label: 'ISINILANG SI MOISES', when: 'mga 1500 BC' },
          ] },
      ],
    },
    {
      id: 'wc-33', answer: 'SAMSON → ISAIAH → ESTHER', difficulty: 2,
      variants: [
        { type: 'order', difficulty: 2,
          prompt: 'Put these in order, earliest first',
          items: ['SAMSON', 'ESTHER', 'ISAIAH'],
          correct: [
            { label: 'SAMSON', when: 'c. 1100 BC' },
            { label: 'ISAIAH', when: 'c. 740 BC' },
            { label: 'ESTHER', when: 'c. 480 BC' },
          ] },
        { type: 'order', difficulty: 2, lang: 'fil',
          prompt: 'Ayusin ito, mula sa pinakauna',
          items: ['SAMSON', 'ESTER', 'ISAIAS'],
          correct: [
            { label: 'SAMSON', when: 'mga 1100 BC' },
            { label: 'ISAIAS', when: 'mga 740 BC' },
            { label: 'ESTER', when: 'mga 480 BC' },
          ] },
      ],
    },
    {
      id: 'wc-34', answer: 'MOSES IS BORN → GIDEON → ELIJAH', difficulty: 2,
      variants: [
        { type: 'order', difficulty: 2,
          prompt: 'Put these in order, earliest first',
          items: ['GIDEON', 'ELIJAH', 'MOSES IS BORN'],
          correct: [
            { label: 'MOSES IS BORN', when: 'c. 1500 BC' },
            { label: 'GIDEON', when: 'c. 1150 BC' },
            { label: 'ELIJAH', when: 'c. 860 BC' },
          ] },
        { type: 'order', difficulty: 2, lang: 'fil',
          prompt: 'Ayusin ito, mula sa pinakauna',
          items: ['GEDEON', 'ELIAS', 'ISINILANG SI MOISES'],
          correct: [
            { label: 'ISINILANG SI MOISES', when: 'mga 1500 BC' },
            { label: 'GEDEON', when: 'mga 1150 BC' },
            { label: 'ELIAS', when: 'mga 860 BC' },
          ] },
      ],
    },
    {
      id: 'wc-35', answer: 'THE WALLS OF JERICHO → DAVID BECOMES KING → ELIJAH', difficulty: 2,
      variants: [
        { type: 'order', difficulty: 2,
          prompt: 'Put these in order, earliest first',
          items: ['THE WALLS OF JERICHO', 'ELIJAH', 'DAVID BECOMES KING'],
          correct: [
            { label: 'THE WALLS OF JERICHO', when: 'c. 1400 BC' },
            { label: 'DAVID BECOMES KING', when: 'c. 1000 BC' },
            { label: 'ELIJAH', when: 'c. 860 BC' },
          ] },
        { type: 'order', difficulty: 2, lang: 'fil',
          prompt: 'Ayusin ito, mula sa pinakauna',
          items: ['ANG PADER NG JERICO', 'ELIAS', 'NAGING HARI SI DAVID'],
          correct: [
            { label: 'ANG PADER NG JERICO', when: 'mga 1400 BC' },
            { label: 'NAGING HARI SI DAVID', when: 'mga 1000 BC' },
            { label: 'ELIAS', when: 'mga 860 BC' },
          ] },
      ],
    },
    {
      id: 'wc-36', answer: 'GIDEON → SOLOMON → JEREMIAH', difficulty: 2,
      variants: [
        { type: 'order', difficulty: 2,
          prompt: 'Put these in order, earliest first',
          items: ['SOLOMON', 'GIDEON', 'JEREMIAH'],
          correct: [
            { label: 'GIDEON', when: 'c. 1150 BC' },
            { label: 'SOLOMON', when: 'c. 960 BC' },
            { label: 'JEREMIAH', when: 'c. 620 BC' },
          ] },
        { type: 'order', difficulty: 2, lang: 'fil',
          prompt: 'Ayusin ito, mula sa pinakauna',
          items: ['SOLOMON', 'GEDEON', 'JEREMIAS'],
          correct: [
            { label: 'GEDEON', when: 'mga 1150 BC' },
            { label: 'SOLOMON', when: 'mga 960 BC' },
            { label: 'JEREMIAS', when: 'mga 620 BC' },
          ] },
      ],
    },
    {
      id: 'wc-37', answer: 'ISAIAH → JEREMIAH → DANIEL AND THE LIONS', difficulty: 3,
      variants: [
        { type: 'order', difficulty: 3,
          prompt: 'Put these in order, earliest first',
          items: ['JEREMIAH', 'ISAIAH', 'DANIEL AND THE LIONS'],
          correct: [
            { label: 'ISAIAH', when: 'c. 740 BC' },
            { label: 'JEREMIAH', when: 'c. 620 BC' },
            { label: 'DANIEL AND THE LIONS', when: 'c. 540 BC' },
          ] },
        { type: 'order', difficulty: 3, lang: 'fil',
          prompt: 'Ayusin ito, mula sa pinakauna',
          items: ['JEREMIAS', 'ISAIAS', 'DANIEL AT ANG MGA LEON'],
          correct: [
            { label: 'ISAIAS', when: 'mga 740 BC' },
            { label: 'JEREMIAS', when: 'mga 620 BC' },
            { label: 'DANIEL AT ANG MGA LEON', when: 'mga 540 BC' },
          ] },
      ],
    },
    {
      id: 'wc-38', answer: 'SLAVERY IN EGYPT → MOSES IS BORN → THE WALLS OF JERICHO', difficulty: 3,
      variants: [
        { type: 'order', difficulty: 3,
          prompt: 'Put these in order, earliest first',
          items: ['MOSES IS BORN', 'SLAVERY IN EGYPT', 'THE WALLS OF JERICHO'],
          correct: [
            { label: 'SLAVERY IN EGYPT', when: 'c. 1600 BC' },
            { label: 'MOSES IS BORN', when: 'c. 1500 BC' },
            { label: 'THE WALLS OF JERICHO', when: 'c. 1400 BC' },
          ] },
        { type: 'order', difficulty: 3, lang: 'fil',
          prompt: 'Ayusin ito, mula sa pinakauna',
          items: ['ISINILANG SI MOISES', 'PAGKAALIPIN SA EGIPTO', 'ANG PADER NG JERICO'],
          correct: [
            { label: 'PAGKAALIPIN SA EGIPTO', when: 'mga 1600 BC' },
            { label: 'ISINILANG SI MOISES', when: 'mga 1500 BC' },
            { label: 'ANG PADER NG JERICO', when: 'mga 1400 BC' },
          ] },
      ],
    },
    {
      id: 'wc-39', answer: 'ROME TAKES JERUSALEM → PENTECOST → JOHN WRITES REVELATION', difficulty: 3,
      variants: [
        { type: 'order', difficulty: 3,
          prompt: 'Put these in order, earliest first',
          items: ['PENTECOST', 'JOHN WRITES REVELATION', 'ROME TAKES JERUSALEM'],
          correct: [
            { label: 'ROME TAKES JERUSALEM', when: 'c. 60 BC' },
            { label: 'PENTECOST', when: 'c. AD 31' },
            { label: 'JOHN WRITES REVELATION', when: 'c. AD 95' },
          ] },
        { type: 'order', difficulty: 3, lang: 'fil',
          prompt: 'Ayusin ito, mula sa pinakauna',
          items: ['ANG PENTECOSTES', 'ANG APOCALIPSIS', 'PAGSAKOP NG ROMA SA JERUSALEM'],
          correct: [
            { label: 'PAGSAKOP NG ROMA SA JERUSALEM', when: 'mga 60 BC' },
            { label: 'ANG PENTECOSTES', when: 'mga AD 31' },
            { label: 'ANG APOCALIPSIS', when: 'mga AD 95' },
          ] },
      ],
    },
    {
      id: 'wc-40', answer: 'DANIEL AND THE LIONS → ESTHER → ALEXANDER THE GREAT', difficulty: 3,
      variants: [
        { type: 'order', difficulty: 3,
          prompt: 'Put these in order, earliest first',
          items: ['DANIEL AND THE LIONS', 'ALEXANDER THE GREAT', 'ESTHER'],
          correct: [
            { label: 'DANIEL AND THE LIONS', when: 'c. 540 BC' },
            { label: 'ESTHER', when: 'c. 480 BC' },
            { label: 'ALEXANDER THE GREAT', when: 'c. 330 BC' },
          ] },
        { type: 'order', difficulty: 3, lang: 'fil',
          prompt: 'Ayusin ito, mula sa pinakauna',
          items: ['DANIEL AT ANG MGA LEON', 'ALEJANDRONG DAKILA', 'ESTER'],
          correct: [
            { label: 'DANIEL AT ANG MGA LEON', when: 'mga 540 BC' },
            { label: 'ESTER', when: 'mga 480 BC' },
            { label: 'ALEJANDRONG DAKILA', when: 'mga 330 BC' },
          ] },
      ],
    },
    {
      id: 'wc-41', answer: 'SAUL BECOMES KING → SOLOMON → ELIJAH', difficulty: 3,
      variants: [
        { type: 'order', difficulty: 3,
          prompt: 'Put these in order, earliest first',
          items: ['ELIJAH', 'SAUL BECOMES KING', 'SOLOMON'],
          correct: [
            { label: 'SAUL BECOMES KING', when: 'c. 1050 BC' },
            { label: 'SOLOMON', when: 'c. 960 BC' },
            { label: 'ELIJAH', when: 'c. 860 BC' },
          ] },
        { type: 'order', difficulty: 3, lang: 'fil',
          prompt: 'Ayusin ito, mula sa pinakauna',
          items: ['ELIAS', 'NAGING HARI SI SAUL', 'SOLOMON'],
          correct: [
            { label: 'NAGING HARI SI SAUL', when: 'mga 1050 BC' },
            { label: 'SOLOMON', when: 'mga 960 BC' },
            { label: 'ELIAS', when: 'mga 860 BC' },
          ] },
      ],
    },
    {
      id: 'wc-42', answer: 'GIDEON → SAUL BECOMES KING → SOLOMON', difficulty: 3,
      variants: [
        { type: 'order', difficulty: 3,
          prompt: 'Put these in order, earliest first',
          items: ['SAUL BECOMES KING', 'GIDEON', 'SOLOMON'],
          correct: [
            { label: 'GIDEON', when: 'c. 1150 BC' },
            { label: 'SAUL BECOMES KING', when: 'c. 1050 BC' },
            { label: 'SOLOMON', when: 'c. 960 BC' },
          ] },
        { type: 'order', difficulty: 3, lang: 'fil',
          prompt: 'Ayusin ito, mula sa pinakauna',
          items: ['NAGING HARI SI SAUL', 'GEDEON', 'SOLOMON'],
          correct: [
            { label: 'GEDEON', when: 'mga 1150 BC' },
            { label: 'NAGING HARI SI SAUL', when: 'mga 1050 BC' },
            { label: 'SOLOMON', when: 'mga 960 BC' },
          ] },
      ],
    },
    {
      id: 'wc-43', answer: 'JEREMIAH → DANIEL AND THE LIONS → ESTHER', difficulty: 3,
      variants: [
        { type: 'order', difficulty: 3,
          prompt: 'Put these in order, earliest first',
          items: ['ESTHER', 'JEREMIAH', 'DANIEL AND THE LIONS'],
          correct: [
            { label: 'JEREMIAH', when: 'c. 620 BC' },
            { label: 'DANIEL AND THE LIONS', when: 'c. 540 BC' },
            { label: 'ESTHER', when: 'c. 480 BC' },
          ] },
        { type: 'order', difficulty: 3, lang: 'fil',
          prompt: 'Ayusin ito, mula sa pinakauna',
          items: ['ESTER', 'JEREMIAS', 'DANIEL AT ANG MGA LEON'],
          correct: [
            { label: 'JEREMIAS', when: 'mga 620 BC' },
            { label: 'DANIEL AT ANG MGA LEON', when: 'mga 540 BC' },
            { label: 'ESTER', when: 'mga 480 BC' },
          ] },
      ],
    },
    {
      id: 'wc-44', answer: 'ROME TAKES JERUSALEM → JOHN THE BAPTIST → JOHN WRITES REVELATION', difficulty: 3,
      variants: [
        { type: 'order', difficulty: 3,
          prompt: 'Put these in order, earliest first',
          items: ['JOHN THE BAPTIST', 'ROME TAKES JERUSALEM', 'JOHN WRITES REVELATION'],
          correct: [
            { label: 'ROME TAKES JERUSALEM', when: 'c. 60 BC' },
            { label: 'JOHN THE BAPTIST', when: 'c. AD 28' },
            { label: 'JOHN WRITES REVELATION', when: 'c. AD 95' },
          ] },
        { type: 'order', difficulty: 3, lang: 'fil',
          prompt: 'Ayusin ito, mula sa pinakauna',
          items: ['JUAN BAUTISTA', 'PAGSAKOP NG ROMA SA JERUSALEM', 'ANG APOCALIPSIS'],
          correct: [
            { label: 'PAGSAKOP NG ROMA SA JERUSALEM', when: 'mga 60 BC' },
            { label: 'JUAN BAUTISTA', when: 'mga AD 28' },
            { label: 'ANG APOCALIPSIS', when: 'mga AD 95' },
          ] },
      ],
    },
    {
      id: 'wc-45', answer: 'THE EXILE TO BABYLON → ESTHER → ALEXANDER THE GREAT', difficulty: 3,
      variants: [
        { type: 'order', difficulty: 3,
          prompt: 'Put these in order, earliest first',
          items: ['ALEXANDER THE GREAT', 'ESTHER', 'THE EXILE TO BABYLON'],
          correct: [
            { label: 'THE EXILE TO BABYLON', when: 'c. 590 BC' },
            { label: 'ESTHER', when: 'c. 480 BC' },
            { label: 'ALEXANDER THE GREAT', when: 'c. 330 BC' },
          ] },
        { type: 'order', difficulty: 3, lang: 'fil',
          prompt: 'Ayusin ito, mula sa pinakauna',
          items: ['ALEJANDRONG DAKILA', 'ESTER', 'PAGKATAPON SA BABILONIA'],
          correct: [
            { label: 'PAGKATAPON SA BABILONIA', when: 'mga 590 BC' },
            { label: 'ESTER', when: 'mga 480 BC' },
            { label: 'ALEJANDRONG DAKILA', when: 'mga 330 BC' },
          ] },
      ],
    },
    {
      id: 'wc-46', answer: 'SAMSON → SOLOMON → ELIJAH', difficulty: 3,
      variants: [
        { type: 'order', difficulty: 3,
          prompt: 'Put these in order, earliest first',
          items: ['SOLOMON', 'SAMSON', 'ELIJAH'],
          correct: [
            { label: 'SAMSON', when: 'c. 1100 BC' },
            { label: 'SOLOMON', when: 'c. 960 BC' },
            { label: 'ELIJAH', when: 'c. 860 BC' },
          ] },
        { type: 'order', difficulty: 3, lang: 'fil',
          prompt: 'Ayusin ito, mula sa pinakauna',
          items: ['SOLOMON', 'SAMSON', 'ELIAS'],
          correct: [
            { label: 'SAMSON', when: 'mga 1100 BC' },
            { label: 'SOLOMON', when: 'mga 960 BC' },
            { label: 'ELIAS', when: 'mga 860 BC' },
          ] },
      ],
    },
    {
      id: 'wc-47', answer: 'ROME TAKES JERUSALEM → THE CROSS → JOHN WRITES REVELATION', difficulty: 3,
      variants: [
        { type: 'order', difficulty: 3,
          prompt: 'Put these in order, earliest first',
          items: ['JOHN WRITES REVELATION', 'THE CROSS', 'ROME TAKES JERUSALEM'],
          correct: [
            { label: 'ROME TAKES JERUSALEM', when: 'c. 60 BC' },
            { label: 'THE CROSS', when: 'c. AD 31' },
            { label: 'JOHN WRITES REVELATION', when: 'c. AD 95' },
          ] },
        { type: 'order', difficulty: 3, lang: 'fil',
          prompt: 'Ayusin ito, mula sa pinakauna',
          items: ['ANG APOCALIPSIS', 'ANG KRUS', 'PAGSAKOP NG ROMA SA JERUSALEM'],
          correct: [
            { label: 'PAGSAKOP NG ROMA SA JERUSALEM', when: 'mga 60 BC' },
            { label: 'ANG KRUS', when: 'mga AD 31' },
            { label: 'ANG APOCALIPSIS', when: 'mga AD 95' },
          ] },
      ],
    },
    {
      id: 'wc-48', answer: 'SLAVERY IN EGYPT → MOSES IS BORN → THE EXODUS', difficulty: 3,
      variants: [
        { type: 'order', difficulty: 3,
          prompt: 'Put these in order, earliest first',
          items: ['MOSES IS BORN', 'THE EXODUS', 'SLAVERY IN EGYPT'],
          correct: [
            { label: 'SLAVERY IN EGYPT', when: 'c. 1600 BC' },
            { label: 'MOSES IS BORN', when: 'c. 1500 BC' },
            { label: 'THE EXODUS', when: 'c. 1450 BC' },
          ] },
        { type: 'order', difficulty: 3, lang: 'fil',
          prompt: 'Ayusin ito, mula sa pinakauna',
          items: ['ISINILANG SI MOISES', 'ANG EXODO', 'PAGKAALIPIN SA EGIPTO'],
          correct: [
            { label: 'PAGKAALIPIN SA EGIPTO', when: 'mga 1600 BC' },
            { label: 'ISINILANG SI MOISES', when: 'mga 1500 BC' },
            { label: 'ANG EXODO', when: 'mga 1450 BC' },
          ] },
      ],
    },
    {
      id: 'wc-49', answer: 'DEBORAH → SAMSON → SOLOMON', difficulty: 3,
      variants: [
        { type: 'order', difficulty: 3,
          prompt: 'Put these in order, earliest first',
          items: ['SAMSON', 'DEBORAH', 'SOLOMON'],
          correct: [
            { label: 'DEBORAH', when: 'c. 1200 BC' },
            { label: 'SAMSON', when: 'c. 1100 BC' },
            { label: 'SOLOMON', when: 'c. 960 BC' },
          ] },
        { type: 'order', difficulty: 3, lang: 'fil',
          prompt: 'Ayusin ito, mula sa pinakauna',
          items: ['SAMSON', 'DEBORA', 'SOLOMON'],
          correct: [
            { label: 'DEBORA', when: 'mga 1200 BC' },
            { label: 'SAMSON', when: 'mga 1100 BC' },
            { label: 'SOLOMON', when: 'mga 960 BC' },
          ] },
      ],
    },
    {
      id: 'wc-50', answer: 'ABRAHAM → JACOB → JOSEPH', difficulty: 3,
      variants: [
        { type: 'order', difficulty: 3,
          prompt: 'Put these in order, earliest first',
          items: ['JOSEPH', 'JACOB', 'ABRAHAM'],
          correct: [
            { label: 'ABRAHAM', when: 'c. 2000 BC' },
            { label: 'JACOB', when: 'c. 1900 BC' },
            { label: 'JOSEPH', when: 'c. 1800 BC' },
          ] },
        { type: 'order', difficulty: 3, lang: 'fil',
          prompt: 'Ayusin ito, mula sa pinakauna',
          items: ['JOSE', 'JACOB', 'ABRAHAM'],
          correct: [
            { label: 'ABRAHAM', when: 'mga 2000 BC' },
            { label: 'JACOB', when: 'mga 1900 BC' },
            { label: 'JOSE', when: 'mga 1800 BC' },
          ] },
      ],
    },
  ],
};
