/*
 * Who Did It? - the deck.
 *
 * A DEED someone in the Bible did goes on the projector; the room shouts who
 * did it. Four clicks: the deed, the verse, a clue, then the name.
 *
 *   answer     the person, revealed last
 *   quote      the DEED, in our own words. The field is named `quote` because
 *              this game reuses the quote renderer wholesale - same four
 *              beats, same two-language handling - and inventing a `deed`
 *              type that was a copy of it would have bought nothing.
 *   verse      where it happened. Shown BEFORE the clue, on purpose: the
 *              reference is itself a hint for whoever has read the passage.
 *   clue       one image about the person that does not name them
 *   lang       'en' or 'fil', on the VARIANT - so one person is one puzzle
 *   answer     on a variant, the name in that language
 *
 * WHAT MAKES THIS DIFFERENT FROM Who Said It?
 *
 * Nothing here is scripture. The deed is our sentence, so there is no wording
 * to verify against a Bible and no copyrighted translation to license - the
 * Tagalog is a translation of our own words. Only the REFERENCE is a claim
 * about the text, and a reference is right or wrong at a glance.
 *
 * That is also why the game exists alongside its sibling rather than instead
 * of it: a deed can be pictured. A young person who does not read much can see
 * someone climbing a tree or opening a roof, where a quotation gives them
 * nothing to hold on to.
 *
 * THE RULE THAT COSTS THE MOST REWORK
 *
 * A deed must not point harder at somebody ELSE in the deck. Checking that it
 * does not NAME the answer is a string comparison, and passes happily on a
 * puzzle that is still wrong. Jesus absorbs anyone who shares a scene with
 * him; Elijah and Elisha absorb each other. Read a new deed as a whole and ask
 * which name the room actually shouts.
 */
window.DECK = {
  id: 'who-did-it',
  title: 'Who Did It?',
  idPrefix: 'wd',   // shown on the projector, so it must never hint the answer
  shuffle: true,
  sessionSize: 20,
  languages: ['en'],
  // The words on screen are ours, so the only checkable claim is the
  // reference. validate.js says so rather than asking for a wording audit
  // this deck does not need.
  // The text on screen is ours, not a quotation, so it is shown without
  // quotation marks - marks around it would send the room hunting a speaker.
  spoken: false,
  quoteNoun: 'deeds',
  verifyJob: 'check each reference points at the right passage',
  howToPlay: [
    'Something someone in the Bible did. The room says who did it.',
    'Stuck? The next click gives the verse, then a clue.',
  ],
  puzzles: [
    {
      id: 'wd-01', answer: 'NOAH', difficulty: 1,
      variants: [
        { type: 'quote', flag: 'unverified', difficulty: 1,
          quote: 'Built a giant boat far from the sea',
          verse: 'Genesis 6:22',
          clue: 'he was six hundred years old when the water finally came' },
        { type: 'quote', flag: 'unverified', difficulty: 2,
          quote: 'Sent a raven, then a dove, out through a window',
          verse: 'Genesis 8:6-8',
          clue: 'the second bird came back holding a fresh olive leaf' },
        { type: 'quote', flag: 'unverified', difficulty: 3,
          quote: 'Planted a vineyard, drank the wine, and passed out',
          verse: 'Genesis 9:20-21',
          clue: 'two of his sons walked in backwards to cover him up' },
      ],
    },
    {
      id: 'wd-02', answer: 'CAIN', difficulty: 1,
      variants: [
        { type: 'quote', flag: 'unverified', difficulty: 1,
          quote: 'Killed his own brother out in a field',
          verse: 'Genesis 4:8',
          clue: 'his gift from the ground had been passed over for a lamb' },
      ],
    },
    {
      id: 'wd-03', answer: 'ABRAHAM', difficulty: 1,
      variants: [
        { type: 'quote', flag: 'unverified', difficulty: 1,
          quote: 'Raised a knife over his tied-up son on a mountain',
          verse: 'Genesis 22:10',
          clue: 'a ram stuck in a thicket died in the boy\'s place' },
        { type: 'quote', flag: 'unverified', difficulty: 3,
          quote: 'Chased four kings by night to rescue his nephew',
          verse: 'Genesis 14:14-16',
          clue: 'he armed 318 trained men born in his own household' },
        { type: 'quote', flag: 'unverified', difficulty: 3,
          quote: 'Killed a calf and served three strangers under a tree',
          verse: 'Genesis 18:7-8',
          clue: 'his wife laughed inside the tent at what they promised' },
      ],
    },
    {
      id: 'wd-04', answer: 'JACOB', difficulty: 1,
      variants: [
        { type: 'quote', flag: 'unverified', difficulty: 1,
          quote: 'Wrestled a stranger all night until his hip gave out',
          verse: 'Genesis 32:24-25',
          clue: 'he limped away at sunrise with a brand-new name' },
        { type: 'quote', flag: 'unverified', difficulty: 2,
          quote: 'Poured oil on the stone he had slept on',
          verse: 'Genesis 28:18',
          clue: 'he had dreamed of a stairway crowded with angels' },
        { type: 'quote', flag: 'unverified', difficulty: 3,
          quote: 'Peeled stripes into branches and stood them in the troughs',
          verse: 'Genesis 30:37-39',
          clue: 'he was outsmarting the uncle who kept changing his wages' },
      ],
    },
    {
      id: 'wd-05', answer: 'JOSEPH', difficulty: 1,
      variants: [
        { type: 'quote', flag: 'unverified', difficulty: 1,
          quote: 'Stored up grain in Egypt through seven good years',
          verse: 'Genesis 41:48-49',
          clue: 'he had read a dream about fat cows and thin ones' },
        { type: 'quote', flag: 'unverified', difficulty: 2,
          quote: 'Ran out of a house and left his coat in her hand',
          verse: 'Genesis 39:12',
          clue: 'she kept the garment and used it to accuse him' },
        { type: 'quote', flag: 'unverified', difficulty: 3,
          quote: 'Hid a silver cup in his youngest brother\'s grain sack',
          verse: 'Genesis 44:2',
          clue: 'he was testing brothers who still did not recognise him' },
      ],
    },
    {
      id: 'wd-06', answer: 'MOSES', difficulty: 1,
      variants: [
        { type: 'quote', flag: 'unverified', difficulty: 1,
          quote: 'Struck a rock with his staff and water poured out',
          verse: 'Exodus 17:6',
          clue: 'a whole nation and all their animals drank from it' },
        { type: 'quote', flag: 'unverified', difficulty: 1,
          quote: 'Smashed two stone tablets at the foot of a mountain',
          verse: 'Exodus 32:19',
          clue: 'he came down to find a golden calf and dancing' },
        { type: 'quote', flag: 'unverified', difficulty: 2,
          quote: 'Killed an Egyptian and buried the body in the sand',
          verse: 'Exodus 2:12',
          clue: 'the next day two quarrelling men let him know they had seen' },
        { type: 'quote', flag: 'unverified', difficulty: 3,
          quote: 'Lifted a bronze snake up on a pole in the desert',
          verse: 'Numbers 21:9',
          clue: 'anyone bitten who looked up at it stayed alive' },
      ],
    },
    {
      id: 'wd-07', answer: 'AARON', difficulty: 2,
      variants: [
        { type: 'quote', flag: 'unverified', difficulty: 2,
          quote: 'Melted the people\'s gold earrings into a calf',
          verse: 'Exodus 32:2-4',
          clue: 'he blamed the crowd when his brother came down the mountain' },
      ],
    },
    {
      id: 'wd-08', answer: 'JOSHUA', difficulty: 1,
      variants: [
        { type: 'quote', flag: 'unverified', difficulty: 1,
          quote: 'Marched an army around a walled city for seven days',
          verse: 'Joshua 6:3-4',
          clue: 'on the last day they went round seven times, then shouted' },
        { type: 'quote', flag: 'unverified', difficulty: 3,
          quote: 'Set up twelve stones carried out of a dried-up riverbed',
          verse: 'Joshua 4:8-9',
          clue: 'one man from each tribe lifted a stone off the Jordan floor' },
        { type: 'quote', flag: 'unverified', difficulty: 3,
          quote: 'Sealed five captured kings inside a cave with big stones',
          verse: 'Joshua 10:26-27',
          clue: 'that was the day the sun stood still over Gibeon' },
      ],
    },
    {
      id: 'wd-09', answer: 'RAHAB', difficulty: 2,
      variants: [
        { type: 'quote', flag: 'unverified', difficulty: 2,
          quote: 'Hid two spies under stalks of flax on her roof',
          verse: 'Joshua 2:6',
          clue: 'a scarlet cord hung from her window when the walls fell' },
      ],
    },
    {
      id: 'wd-10', answer: 'GIDEON', difficulty: 1,
      variants: [
        { type: 'quote', flag: 'unverified', difficulty: 1,
          quote: 'Laid a wool fleece on the threshing floor two nights running',
          verse: 'Judges 6:37-39',
          clue: 'one morning it was soaked with dew, the next it was dry' },
        { type: 'quote', flag: 'unverified', difficulty: 1,
          quote: 'Sent 22,000 soldiers home and kept only 300',
          verse: 'Judges 7:3-7',
          clue: 'he kept the ones who lapped up water like a dog' },
        { type: 'quote', flag: 'unverified', difficulty: 2,
          quote: 'Broke a clay jar and blew a trumpet in the dark',
          verse: 'Judges 7:19-20',
          clue: 'three hundred men did the very same thing all around the camp' },
      ],
    },
    {
      id: 'wd-11', answer: 'SAMSON', difficulty: 1,
      variants: [
        { type: 'quote', flag: 'unverified', difficulty: 2,
          quote: 'Killed a lion with his bare hands',
          verse: 'Judges 14:6',
          clue: 'he told nobody, and later scooped honey out of the carcass' },
        { type: 'quote', flag: 'unverified', difficulty: 2,
          quote: 'Tied torches to the tails of three hundred foxes',
          verse: 'Judges 15:4-5',
          clue: 'the burning animals ran through his enemies\' standing grain' },
        { type: 'quote', flag: 'unverified', difficulty: 1,
          quote: 'Killed a thousand men with a donkey\'s jawbone',
          verse: 'Judges 15:15',
          clue: 'he threw the bone away and then begged for a drink' },
        { type: 'quote', flag: 'unverified', difficulty: 1,
          quote: 'Pushed apart the two pillars holding up a packed temple',
          verse: 'Judges 16:29-30',
          clue: 'his hair had grown back, and a boy had led him to the spot' },
        { type: 'quote', flag: 'unverified', difficulty: 3,
          quote: 'Carried off a city\'s gates on his shoulders',
          verse: 'Judges 16:3',
          clue: 'he did it at midnight, and hauled them uphill' },
      ],
    },
    {
      id: 'wd-12', answer: 'JAEL', difficulty: 3,
      variants: [
        { type: 'quote', flag: 'unverified', difficulty: 3,
          quote: 'Drove a tent peg through a sleeping general\'s head',
          verse: 'Judges 4:21',
          clue: 'she gave him milk and a rug before he fell asleep' },
      ],
    },
    {
      id: 'wd-13', answer: 'RUTH', difficulty: 1,
      variants: [
        { type: 'quote', flag: 'unverified', difficulty: 1,
          quote: 'Gleaned leftover barley behind a stranger\'s harvesters',
          verse: 'Ruth 2:3',
          clue: 'she had left her own country to follow her mother-in-law' },
      ],
    },
    {
      id: 'wd-14', answer: 'DAVID', difficulty: 1,
      variants: [
        { type: 'quote', flag: 'unverified', difficulty: 1,
          quote: 'Sank one slung stone into a giant\'s forehead',
          verse: '1 Samuel 17:49',
          clue: 'he refused the king\'s armour and picked five smooth stones' },
        { type: 'quote', flag: 'unverified', difficulty: 2,
          quote: 'Cut a corner off a sleeping king\'s robe in a cave',
          verse: '1 Samuel 24:4',
          clue: 'his own men begged him to kill the man hunting him' },
        { type: 'quote', flag: 'unverified', difficulty: 2,
          quote: 'Danced with all his might in front of the ark',
          verse: '2 Samuel 6:14',
          clue: 'his wife watched from a window and despised him for it' },
        { type: 'quote', flag: 'unverified', difficulty: 3,
          quote: 'Drooled into his beard and acted insane before a king',
          verse: '1 Samuel 21:13',
          clue: 'he was trapped in an enemy city and had to get out alive' },
      ],
    },
    {
      id: 'wd-15', answer: 'SAUL', difficulty: 2,
      variants: [
        { type: 'quote', flag: 'unverified', difficulty: 2,
          quote: 'Threw a spear at the harp player in his own house',
          verse: '1 Samuel 18:10-11',
          clue: 'the music was supposed to quiet the evil spirit on him' },
        { type: 'quote', flag: 'unverified', difficulty: 3,
          quote: 'Went to a witch at night to call up a dead prophet',
          verse: '1 Samuel 28:7-8',
          clue: 'he had thrown all such people out of the land himself' },
      ],
    },
    {
      id: 'wd-16', answer: 'SOLOMON', difficulty: 1,
      variants: [
        { type: 'quote', flag: 'unverified', difficulty: 1,
          quote: 'Ordered a live baby cut in two with a sword',
          verse: '1 Kings 3:25',
          clue: 'he was finding out which of two women was the real mother' },
        { type: 'quote', flag: 'unverified', difficulty: 2,
          quote: 'Built a temple with stones so no hammer was heard',
          verse: '1 Kings 6:7',
          clue: 'it took seven years, and the cedar came from Lebanon' },
      ],
    },
    {
      id: 'wd-17', answer: 'ELIJAH', difficulty: 1,
      variants: [
        { type: 'quote', flag: 'unverified', difficulty: 2,
          quote: 'Poured twelve barrels of water over his own altar',
          verse: '1 Kings 18:33-35',
          clue: 'fire fell and licked up even the water in the trench' },
        { type: 'quote', flag: 'unverified', difficulty: 3,
          quote: 'Ran into the desert and fell asleep under a juniper tree',
          verse: '1 Kings 19:4-5',
          clue: 'an angel woke him twice with baked bread and water' },
        { type: 'quote', flag: 'unverified', difficulty: 3,
          quote: 'Crouched on the ground with his face between his knees',
          verse: '1 Kings 18:42',
          clue: 'his servant looked out to sea seven times for one small cloud' },
      ],
    },
    {
      id: 'wd-18', answer: 'ELISHA', difficulty: 2,
      variants: [
        { type: 'quote', flag: 'unverified', difficulty: 2,
          quote: 'Stretched out on a dead boy who then sneezed seven times',
          verse: '2 Kings 4:34-35',
          clue: 'the mother had built him a little room with a bed and a lamp' },
        { type: 'quote', flag: 'unverified', difficulty: 3,
          quote: 'Threw a stick in a river to float up an iron axe head',
          verse: '2 Kings 6:6',
          clue: 'a borrowed tool had sunk while men were cutting wood' },
        { type: 'quote', flag: 'unverified', difficulty: 3,
          quote: 'Threw flour into a cooking pot that had poison in it',
          verse: '2 Kings 4:41',
          clue: 'the young students had shouted that death was in the pot' },
      ],
    },
    {
      id: 'wd-19', answer: 'NAAMAN', difficulty: 2,
      variants: [
        { type: 'quote', flag: 'unverified', difficulty: 2,
          quote: 'Dipped himself seven times in a muddy foreign river',
          verse: '2 Kings 5:14',
          clue: 'he was an army commander who had wanted a grander cure' },
      ],
    },
    {
      id: 'wd-20', answer: 'DANIEL', difficulty: 1,
      variants: [
        { type: 'quote', flag: 'unverified', difficulty: 1,
          quote: 'Prayed at his wide-open window three times a day anyway',
          verse: 'Daniel 6:10',
          clue: 'a brand-new law said pray only to the king for thirty days' },
        { type: 'quote', flag: 'unverified', difficulty: 2,
          quote: 'Turned down the king\'s rich food for ten days of vegetables',
          verse: 'Daniel 1:12-16',
          clue: 'he and three friends ended up healthier than all the rest' },
        { type: 'quote', flag: 'unverified', difficulty: 2,
          quote: 'Read the writing a floating hand left on a palace wall',
          verse: 'Daniel 5:25',
          clue: 'the king\'s knees knocked together in the middle of a feast' },
      ],
    },
    {
      id: 'wd-21', answer: 'SHADRACH, MESHACH AND ABED-NEGO', difficulty: 1,
      variants: [
        { type: 'quote', flag: 'unverified', difficulty: 1,
          quote: 'Stayed standing while a whole plain bowed to a statue',
          verse: 'Daniel 3:7-12',
          clue: 'a fourth figure was seen walking with them in the fire' },
      ],
    },
    {
      id: 'wd-22', answer: 'JONAH', difficulty: 1,
      variants: [
        { type: 'quote', flag: 'unverified', difficulty: 1,
          quote: 'Paid his fare and sailed the opposite way from his orders',
          verse: 'Jonah 1:3',
          clue: 'he slept below deck through a storm sent for him' },
        { type: 'quote', flag: 'unverified', difficulty: 3,
          quote: 'Built a shelter to sit and watch a city be destroyed',
          verse: 'Jonah 4:5',
          clue: 'a worm killed the plant that had been shading him' },
      ],
    },
    {
      id: 'wd-23', answer: 'ESTHER', difficulty: 1,
      variants: [
        { type: 'quote', flag: 'unverified', difficulty: 1,
          quote: 'Walked into a throne room without being called for',
          verse: 'Esther 5:1-2',
          clue: 'she had fasted three days before stepping through that door' },
      ],
    },
    {
      id: 'wd-24', answer: 'NEHEMIAH', difficulty: 2,
      variants: [
        { type: 'quote', flag: 'unverified', difficulty: 1,
          quote: 'Rebuilt a city wall in fifty-two days, sword at his side',
          verse: 'Nehemiah 6:15',
          clue: 'he had been cupbearer to the king of Persia' },
        { type: 'quote', flag: 'unverified', difficulty: 3,
          quote: 'Rode out at night to inspect a city\'s broken-down walls',
          verse: 'Nehemiah 2:12-15',
          clue: 'he told nobody what his God had put in his heart to do' },
      ],
    },
    {
      id: 'wd-25', answer: 'PETER', difficulty: 1,
      variants: [
        { type: 'quote', flag: 'unverified', difficulty: 1,
          quote: 'Cut off a soldier\'s ear',
          verse: 'John 18:10',
          clue: 'he did it in a garden, at night, without being asked' },
        { type: 'quote', flag: 'unverified', difficulty: 1,
          quote: 'Stepped out of a boat onto open water',
          verse: 'Matthew 14:29',
          clue: 'it went well until he looked at the wind' },
        { type: 'quote', flag: 'unverified', difficulty: 2,
          quote: 'Jumped overboard and swam ashore, leaving the nets to the others',
          verse: 'John 21:7',
          clue: 'he never could wait for a boat to dock' },
      ],
    },
    {
      id: 'wd-26', answer: 'PAUL', difficulty: 1,
      variants: [
        { type: 'quote', flag: 'unverified', difficulty: 2,
          quote: 'Climbed into a basket to be let down a city wall at night',
          verse: 'Acts 9:25',
          clue: 'the men watching the gates to kill him missed him completely' },
        { type: 'quote', flag: 'unverified', difficulty: 2,
          quote: 'Shook a snake off his hand into a fire after a shipwreck',
          verse: 'Acts 28:3-5',
          clue: 'the islanders decided he must be a god' },
      ],
    },
    {
      id: 'wd-27', answer: 'JESUS', difficulty: 1,
      variants: [
        { type: 'quote', flag: 'unverified', difficulty: 1,
          quote: 'Braided cords into a whip and cleared a temple courtyard',
          verse: 'John 2:15',
          clue: 'the coins were still rolling when the doves flew out' },
        { type: 'quote', flag: 'unverified', difficulty: 2,
          quote: 'Cooked fish and bread over a charcoal fire on a beach',
          verse: 'John 21:9',
          clue: 'seven fishermen had worked all night for nothing' },
      ],
    },
    {
      id: 'wd-28', answer: 'JUDAS ISCARIOT', difficulty: 1,
      variants: [
        { type: 'quote', flag: 'unverified', difficulty: 1,
          quote: 'Kissed a man on the cheek to point him out to armed men',
          verse: 'Matthew 26:49',
          clue: 'he came out of the dark leading a crowd with torches' },
        { type: 'quote', flag: 'unverified', difficulty: 2,
          quote: 'Threw thirty silver coins back onto a temple floor',
          verse: 'Matthew 27:5',
          clue: 'the priests used the money to buy a field' },
        { type: 'quote', flag: 'unverified', difficulty: 3,
          quote: 'Kept the group\'s money bag and helped himself from it',
          verse: 'John 12:6',
          clue: 'he complained loudest when the perfume was poured out' },
      ],
    },
    {
      id: 'wd-29', answer: 'JOHN THE BAPTIST', difficulty: 1,
      variants: [
        { type: 'quote', flag: 'unverified', difficulty: 1,
          quote: 'Ate locusts and wild honey and wore a coat of camel hair',
          verse: 'Matthew 3:4',
          clue: 'his belt was leather and his pulpit was a riverbank' },
        { type: 'quote', flag: 'unverified', difficulty: 2,
          quote: 'Plunged whole crowds under the water of the Jordan',
          verse: 'Matthew 3:5-6',
          clue: 'he argued with his own cousin about going in' },
      ],
    },
    {
      id: 'wd-30', answer: 'PILATE', difficulty: 2,
      variants: [
        { type: 'quote', flag: 'unverified', difficulty: 1,
          quote: 'Washed his hands in a basin in front of a shouting crowd',
          verse: 'Matthew 27:24',
          clue: 'he had just announced he could find no fault at all' },
        { type: 'quote', flag: 'unverified', difficulty: 3,
          quote: 'Wrote a sign in three languages and refused to reword it',
          verse: 'John 19:19-22',
          clue: 'the priests wanted one word changed and lost' },
      ],
    },
    {
      id: 'wd-31', answer: 'ZACCHAEUS', difficulty: 1,
      variants: [
        { type: 'quote', flag: 'unverified', difficulty: 1,
          quote: 'Climbed a sycamore tree to see over a crowd',
          verse: 'Luke 19:4',
          clue: 'he was too short to see and too rich to be liked' },
      ],
    },
    {
      id: 'wd-32', answer: 'MARTHA', difficulty: 2,
      variants: [
        { type: 'quote', flag: 'unverified', difficulty: 2,
          quote: 'Rushed around serving a houseful of guests while her sister sat',
          verse: 'Luke 10:40',
          clue: 'she wanted her sister up off the floor and helping' },
        { type: 'quote', flag: 'unverified', difficulty: 3,
          quote: 'Ran out down the road to meet a friend who came too late',
          verse: 'John 11:20',
          clue: 'her sister stayed sitting in the house; she did not' },
      ],
    },
    {
      id: 'wd-33', answer: 'MARY MAGDALENE', difficulty: 2,
      variants: [
        { type: 'quote', flag: 'unverified', difficulty: 2,
          quote: 'Asked a gardener where a missing body had been taken',
          verse: 'John 20:15',
          clue: 'he answered her by saying her name' },
        { type: 'quote', flag: 'unverified', difficulty: 3,
          quote: 'Ran through the dark to wake two disciples about an empty grave',
          verse: 'John 20:2',
          clue: 'she went to finish a burial and found the stone rolled back' },
      ],
    },
    {
      id: 'wd-34', answer: 'THOMAS', difficulty: 1,
      variants: [
        { type: 'quote', flag: 'unverified', difficulty: 1,
          quote: 'Came back a week late and inspected the scars for himself',
          verse: 'John 20:26-27',
          clue: 'he had missed the meeting where everyone else saw' },
      ],
    },
    {
      id: 'wd-35', answer: 'THE PRODIGAL SON', difficulty: 1,
      variants: [
        { type: 'quote', flag: 'unverified', difficulty: 1,
          quote: 'Fed pigs in a foreign field and envied what they were eating',
          verse: 'Luke 15:15-16',
          clue: 'he rehearsed his apology all the way home' },
        { type: 'quote', flag: 'unverified', difficulty: 2,
          quote: 'Sold up, moved far away, and spent every coin on parties',
          verse: 'Luke 15:13',
          clue: 'he had asked for his share of the farm early' },
      ],
    },
    {
      id: 'wd-36', answer: 'THE GOOD SAMARITAN', difficulty: 1,
      variants: [
        { type: 'quote', flag: 'unverified', difficulty: 1,
          quote: 'Poured oil and wine on a stranger\'s wounds and paid his bill',
          verse: 'Luke 10:34-35',
          clue: 'two religious men had already walked past the same body' },
      ],
    },
    {
      id: 'wd-37', answer: 'THE WOMAN AT THE WELL', difficulty: 1,
      variants: [
        { type: 'quote', flag: 'unverified', difficulty: 1,
          quote: 'Left her water jar behind and ran to tell a whole town',
          verse: 'John 4:28',
          clue: 'she had come out at noon to avoid the other women' },
      ],
    },
    {
      id: 'wd-38', answer: 'NICODEMUS', difficulty: 2,
      variants: [
        { type: 'quote', flag: 'unverified', difficulty: 2,
          quote: 'Knocked on a teacher\'s door after dark to ask his questions',
          verse: 'John 3:1-2',
          clue: 'a Pharisee who did not want to be seen asking' },
        { type: 'quote', flag: 'unverified', difficulty: 3,
          quote: 'Carried a hundred pounds of myrrh and aloes to a burial',
          verse: 'John 19:39',
          clue: 'the first time he came, he came at night' },
      ],
    },
    {
      id: 'wd-39', answer: 'LAZARUS', difficulty: 1,
      variants: [
        { type: 'quote', flag: 'unverified', difficulty: 1,
          quote: 'Walked out of a tomb wrapped head to foot in burial cloths',
          verse: 'John 11:44',
          clue: 'his two sisters had stopped expecting anything' },
      ],
    },
    {
      id: 'wd-40', answer: 'CAIAPHAS', difficulty: 3,
      variants: [
        { type: 'quote', flag: 'unverified', difficulty: 3,
          quote: 'Tore his own robe during a midnight trial he had called',
          verse: 'Matthew 26:65',
          clue: 'he was the high priest that year' },
      ],
    },
    {
      id: 'wd-41', answer: 'STEPHEN', difficulty: 2,
      variants: [
        { type: 'quote', flag: 'unverified', difficulty: 2,
          quote: 'Knelt under a hail of stones and prayed for the men throwing',
          verse: 'Acts 7:60',
          clue: 'he was the first of many to die that way' },
        { type: 'quote', flag: 'unverified', difficulty: 3,
          quote: 'Handed out food to widows before he ever preached a sermon',
          verse: 'Acts 6:5',
          clue: 'one of the first seven men chosen for the job' },
      ],
    },
    {
      id: 'wd-42', answer: 'DORCAS', difficulty: 2,
      variants: [
        { type: 'quote', flag: 'unverified', difficulty: 2,
          quote: 'Sewed coats and dresses for the widows of a seaside town',
          verse: 'Acts 9:36-39',
          clue: 'the widows held up her sewing and wept over it' },
      ],
    },
    {
      id: 'wd-43', answer: 'BARNABAS', difficulty: 3,
      variants: [
        { type: 'quote', flag: 'unverified', difficulty: 3,
          quote: 'Sold a field and laid every coin at the apostles\' feet',
          verse: 'Acts 4:36-37',
          clue: 'he vouched for the church\'s worst enemy when nobody else would' },
        { type: 'quote', flag: 'unverified', difficulty: 3,
          quote: 'Took a young deserter back on the road after a bitter argument',
          verse: 'Acts 15:37-39',
          clue: 'the argument split the mission team in two' },
      ],
    },
    {
      id: 'wd-44', answer: 'PHILIP', difficulty: 2,
      variants: [
        { type: 'quote', flag: 'unverified', difficulty: 2,
          quote: 'Ran alongside a moving chariot, then climbed in to read along',
          verse: 'Acts 8:30-31',
          clue: 'the passenger was reading Isaiah out loud and understood none' },
      ],
    },
    {
      id: 'wd-45', answer: 'HEROD', difficulty: 2,
      variants: [
        { type: 'quote', flag: 'unverified', difficulty: 2,
          quote: 'Ordered every boy under two in one town killed',
          verse: 'Matthew 2:16',
          clue: 'the wise men never came back to report as promised' },
        { type: 'quote', flag: 'unverified', difficulty: 3,
          quote: 'Sat on a throne in royal robes and accepted a crowd\'s worship',
          verse: 'Acts 12:21-22',
          clue: 'worms finished what the applause started' },
      ],
    },
    {
      id: 'wd-46', answer: 'JOHN THE APOSTLE', difficulty: 2,
      variants: [
        { type: 'quote', flag: 'unverified', difficulty: 2,
          quote: 'Wrote letters to seven churches while exiled on a rocky island',
          verse: 'Revelation 1:9-11',
          clue: 'he outlived every other one of the twelve' },
        { type: 'quote', flag: 'unverified', difficulty: 3,
          quote: 'Outran another disciple to an empty tomb and stopped at the door',
          verse: 'John 20:4-5',
          clue: 'the slower man arrived second and went in first' },
      ],
    },
  ],
};
