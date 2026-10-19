// ============================================================================
//  ✏️  PERSONALIZE EVERYTHING HERE
//
//  Every name, question, photo path and message lives in this one file —
//  you shouldn't need to touch the components at all.
//
//  Media files go in /public/assets. A file saved at
//  public/assets/photo1.jpg is referenced below as "/assets/photo1.jpg".
//  Missing files show a soft placeholder with the expected path, so you can
//  preview the app before adding anything.
// ============================================================================

export const HER_NAME = "Khushi";
export const YOUR_NAME = "Ankit";

/* ───────────────────────── Phase 1: landing ───────────────────────── */

export const LANDING_LINE_1 = "I made something for you...";
export const LANDING_LINE_2 = "but you have to earn it.";

// Asked before the game starts. At the end she gets a "trip recap"
// email with everything she picked along the way (see server/emailTemplate.js).
export const EMAIL_PROMPT = "Boarding se pehle apna email daal do… iska kaam end mein samajh aayega ✨";
export const EMAIL_PLACEHOLDER = "tumhara@gmail.com";
export const EMAIL_INVALID = "Hmm, ye email sahi nahi lag raha 🤔";

/* ───────────────────────── Phase 2: the game ──────────────────────── */

// Pick the mini-game:
//   "catch"  → glowing hearts / stars / gifts float around; she taps them
//   "trivia" → cute multiple-choice questions about the two of you
export const GAME_MODE = "catch";

// Which floating things appear in the catch game. Any mix of "heart", "star", "gift".
export const CATCHABLE_KINDS = ["heart", "star", "gift"];

// The reward for the mini-game: a boarding pass that prints one section per
// catch / correct answer, so the number of sections is the number of wins
// needed (3 here). `flap: true` rolls the value in like an airport board
// (letters only look best there). Today's date is filled in automatically.
export const BOARDING_PASS = {
  airline: "Birthday Airways",
  flight: "BDAY-01",
  gate: "Memory Vault",
  stamp: "Approved",
  sections: [
    { fields: [{ label: "Passenger", value: HER_NAME.toUpperCase(), flap: true }, { label: "Class", value: "VIP · Party of one 👑" }] },
    { fields: [{ label: "From", value: "Ek aur saal" }, { label: "To", value: "Birthday Mode 🎂" }] },
    { fields: [{ label: "Seat", value: "1A · Window, obviously" }, { label: "Perks", value: "Unlimited cake · Zero adulting" }] },
  ],
  footnote: "Turbulence: zero. Mood: elevated. Destination: ek shaandaar saal. ✈️",
};

// Used only when GAME_MODE = "trivia". One question per fragment.
// `answer` is the position of the correct option, counting from 0.
export const TRIVIA_QUESTIONS = [
  {
    question: "Guess karo, ye chhota sa surprise banane mein kitna time laga hoga? 😄",
    options: ["Bas 5 minute", "Ek ghanta", "Kaafi saari raatein ☕", "Pata nahi, magic se ban gaya"],
    answer: 2,
  },
  {
    question: "Is poore surprise ka sabse important hissa kaun hai?",
    options: ["Cake 🎂", "Photos 📷", "Music 🎵", "Birthday girl 😊"],
    answer: 3,
  },
  {
    question: "Ye sab dekhte hue tumhare chehre pe kya hona chahiye?",
    options: ["Confusion 🤔", "Ek pyaari si smile 😊", "Neend 😴", "Gussa 😤"],
    answer: 1,
  },
];

/* ───────────────────────── Phase 3: memory vault ──────────────────── */

// The Memory Vault is a row of small conversations. Each card is a little
// chat: you ask, she answers. Finishing one plays its music, types out its
// shayari and reveals its photo, and then the next card unlocks.
//
// Everything she reads is in this one object, so you can change any wording,
// photo or song here without touching a component.
//
// ── Card fields ──
//   icon      → emoji on the card
//   title     → card + chat title
//   photo     → "/assets/…" photo revealed at the end
//   landscape → true for a wide photo (otherwise a tall portrait frame is used)
//   audio     → "/assets/audio/…" short instrumental (10–20 s) that plays during the reveal
//   audioSettings → optional per-card override of MEMORY_VAULT.audio, e.g.
//               { volume: 0.38, fadeIn: 1.8, maxLength: null, startAt: 0 }
//               (maxLength: null = keep playing until she moves on; startAt = skip seconds)
//   shayari   → typed out during the reveal (line breaks are kept; "" to skip)
//   message   → optional extra text typed after the shayari (used for the last card)
//   steps     → the conversation, in order (see STEP TYPES)
//
// ── STEP TYPES ──
//   { type: "choice", question, options: [{ label, pushback? }] }
//       Buttons. An option with `pushback` doesn't count yet: you reply with
//       pushback.messages, ask pushback.question, and she picks again from
//       pushback.options. Then the chat moves on.
//   { type: "text", question, placeholder, multiline?, optional? }
//       A text box (multiline = big textarea). `optional: true` lets her skip it.
//       Add `notAllowed: { words: [...], reply, retry }` to playfully refuse
//       answers containing those words and ask again.
//   { type: "colors", question, options: [{ name, hex }] }
//       Colour swatch cards.
//   { type: "select", question, placeholder, options: ["…", "…"] }
//       A glassy dropdown.
//   { type: "rating", question, min, max, emojis, comment? }
//       A glowing slider. `emojis[i]` shows at value i while dragging. `comment`
//       adds a textarea under it ({ label, placeholder }).
//   { type: "date", question, reply?, skipLabel?, skipReply? }
//       A calendar (no past dates). `reply` lines can use {date}.
//
// ── MINI-GAME STEPS ── (each ends with you "saying" a reaction)
//   { type: "quiz", question, rounds: [{ clue, hint?, options, answer }], results }
//       Emoji guessing game with a score.
//   { type: "rapidfire", question, seconds, pairs, result, skippedLine? }
//       Timed this-or-that, ending in a personality report ({traits}).
//   { type: "cards", question, cards: ["fortune", …], after }
//       Pick a face-down card; then all of them flip.
//   { type: "wheel", question, prizes: [{ emoji, label }], after }
//       Spin for a birthday coupon ({prize}).
//   { type: "sundae", question, flavors, toppings, sauces, result, specialLine?, noSpecialLine? }
//       Build-a-sundae ({flavors} {toppings} {sauce}); `special` items = her favourites.
//   { type: "stars", question, stars, order, name, caption?, after }
//       Connect the stars into a shape that gets named.
//
// `question` can be a string or a list of strings (sent as separate chat bubbles).
export const MEMORY_VAULT = {
  title: "Chhoti Baatein, Badi Yaadein",
  subtitle: "Har card ek chhoti si baatcheet hai… aur har baat ke peeche kuch chhupa hai. ✨",
  progressLabel: "Memory Progress",
  allDoneBanner: "All memories unlocked",
  continueLabel: "Continue to your Birthday Surprise",
  revealContinueLabel: "Aage chalein", // button after each reveal
  lastRevealContinueLabel: "Continue", // …and after the last one

  // How the reveal music behaves (seconds).
  audio: { volume: 0.6, fadeIn: 1.5, fadeOut: 2, maxLength: 20 },

  cards: [
    {
      icon: "☕",
      title: "Agar kabhi milna hua...",
      photo: "/assets/memory1-khushi-and-me.jpeg",
      landscape: true, // wide photo: card and reveal frame use a wide shape
      audio: "/assets/audio/memory1.mp3",
      steps: [
        {
          type: "choice",
          emailLabel: "Raipur visit · Verdict", // heading for this answer in her email
          question: "Toh mujhe Raipur bula rahi ho na? 😊",
          options: [
            { label: "❤️ Yes" },
            {
              label: "😄 No",
              pushback: {
                messages: ['Madam... is game mein "No" allowed hi nahi hai. 😄'],
                question: "Arre aise kaise nahi bulaogi... bolo bula rahi ho na?",
                options: [{ label: "❤️ Yes" }, { label: "😄 Bilkul" }],
              },
            },
          ],
        },
        {
          type: "date",
          question: "Toh date fix karo 📅",
          sendLabel: "Date fix",
          reply: ["{date}... noted 📌", "Calendar mein mark kar liya hai. Ab mukarna mat 😄"],
        },
      ],
      shayari: "",
    },
    {
      icon: "🎬",
      title: "Filmy Emoji Quiz",
      photo: "/assets/memory2-black-saree.jpeg",
      // "Itni Kyun Tum Khoobsurat Ho" — plays only when this photo is revealed.
      audio: "/assets/audio/itni-kyu-tum-khoobsurat-ho.mp3",
      // Softer than the others, and a full song, so it keeps playing until she
      // moves on (no 20 s limit). `startAt` skips an intro (seconds) if you want.
      audioSettings: { volume: 0.38, fadeIn: 1.8, maxLength: null, startAt: 0 },
      steps: [
        {
          type: "quiz",
          question: ["Chalo ek game khelte hain 🎬", "Main emojis mein movie bataunga... tum guess karo. Dekhte hain kitni filmy ho 😄"],
          rounds: [
            { clue: "🚂🌻💃🏻👨‍👩‍👧", hint: "Ja Simran ja...", options: ["DDLJ", "Kuch Kuch Hota Hai", "Chennai Express", "Kal Ho Naa Ho"], answer: 0 },
            { clue: "🚆👧🏻🗣️💯", hint: "Main apni favourite hoon!", options: ["Queen", "Jab We Met", "Dear Zindagi", "Tamasha"], answer: 1 },
            { clue: "🏔️🎒👫🎉", hint: "Bunny, Naina aur Manali", options: ["Wake Up Sid", "Dil Chahta Hai", "Yeh Jawaani Hai Deewani", "ZNMD"], answer: 2 },
            { clue: "🎓🤪🤪🤪", hint: "All is well!", options: ["Chhichhore", "Munna Bhai MBBS", "Student of the Year", "3 Idiots"], answer: 3 },
          ],
          // Picked by score: the first entry whose `min` she reaches. {score} / {total} work.
          results: [
            { min: 4, lines: ["{score}/{total}! 🏆", "Certified filmy queen. Geet bhi impress ho jaati 😄"] },
            { min: 2, lines: ["{score}/{total} — not bad! 👏", "Bas thoda Bollywood revision aur... phir tum unbeatable ho 😄"] },
            { min: 0, lines: ["{score}/{total}... 😄", "Lagta hai tum movies dekhne se zyada khud ek movie wali life jeeti ho ✨"] },
          ],
        },
      ],
      shayari: `Kuch log trend follow karte hain,
kuch log khud trend ban jaate hain...
Aur kuch, tumhari tarah,
classic hote hain — kabhi out of style nahi hote. ✨`,
    },
    {
      icon: "🍨",
      title: "Sundae Studio",
      photo: "/assets/memory3-khushi-face.jpeg",
      audio: "/assets/audio/memory3.mp3",
      steps: [
        {
          type: "sundae",
          question: ["Ab thoda sweet ho jaaye 🍨", "Apna birthday sundae khud design karo... jaisa banaogi, waisa hi treat milega 😄"],
          scoops: 2,
          maxToppings: 3,
          // `special: true` = her favourites (nuts!). `reaction` pops up when she picks it.
          flavors: [
            { name: "Roasted Almond", color: "#c99a6b", special: true, reaction: "Nuts! Mujhe pata tha 😄" },
            { name: "Kesar Pista", color: "#c7d98f", special: true, reaction: "Pista ✅ Nuts lover detected 🥜" },
            { name: "Butterscotch", color: "#e7b463", reaction: "Crunchy wala, classic 😌" },
            { name: "Chocolate", color: "#6b3e26" },
            { name: "Strawberry", color: "#f4a6b8" },
            { name: "Vanilla", color: "#f6ecd2" },
          ],
          toppings: [
            { emoji: "🥜", name: "Extra nuts", special: true, reaction: "Expected tha 😄" },
            { emoji: "🍫", name: "Nutty chocolate", special: true, reaction: "Nuts + chocolate = tumhara combo 😌" },
            { emoji: "🍒", name: "Cherry" },
            { emoji: "🌈", name: "Sprinkles" },
            { emoji: "🍪", name: "Cookie crumble" },
            { emoji: "🍓", name: "Strawberry" },
          ],
          sauces: [
            { name: "Hot Fudge", color: "#4a2615" },
            { name: "Caramel", color: "#c8822f" },
            { name: "Nutella", color: "#5a3220", special: true, reaction: "Hazelnut! Phir se nuts 😄" },
            { name: "Honey", color: "#e8b33a" },
          ],
          buttonLabel: "Order karo",
          result: [
            "Order ready 🍨",
            "{flavors} scoops, upar se {toppings}, aur {sauce} ki drizzle.",
            "Menu pe iska naam hoga 'The Khushi Special'. Limited edition, birthday pe hi milta hai 👑",
          ],
          specialLine: "Aur nuts toh hone hi the... itna toh jaanta hoon tumhe 😌🥜",
          noSpecialLine: "Ek bhi nut nahi?? Ye kaun hai aur Khushi kahan hai? 😄",
        },
      ],
      shayari: "",
    },
    {
      icon: "🌌",
      title: "Star Connect",
      photo: "/assets/memory4-mirror-suit.jpeg",
      audio: "/assets/audio/memory4.mp3",
      steps: [
        {
          type: "stars",
          question: ["Chalo aaj ek constellation banate hain 🌌", "Jo star chamak raha hai, use tap karte jao... dekhte hain kya banta hai ✨"],
          // A crown, in a 300×220 sky. `order` repeats the first star to close it.
          stars: [
            [45, 180],
            [35, 70],
            [100, 125],
            [150, 40],
            [200, 125],
            [265, 70],
            [255, 180],
          ],
          order: [0, 1, 2, 3, 4, 5, 6, 0],
          name: "Khushi Major",
          caption: "Shape: 👑 · Brightness: birthday level",
          buttonLabel: "Naam register karo",
          after: [
            "Crown bana! 👑",
            "Officially, aaj se aasmaan mein ek constellation tumhare naam ka bhi hai.",
            "Birthday queen ke liye itna toh banta hai 😄",
          ],
        },
      ],
      shayari: "", // no shayari for this one — add one here if you like
    },
    {
      icon: "🎡",
      title: "Birthday Wheel",
      photo: "/assets/memory5-lehenga.jpeg",
      // "Haan Maine Suni Hai Pariyon Ki Kahani" — plays only when this last photo is revealed.
      audio: "/assets/audio/haan-maine-suni-hai-pariyon-ki-kahani.mp3",
      audioSettings: { volume: 0.4, fadeIn: 1.8, maxLength: null, startAt: 0 },
      steps: [
        {
          type: "wheel",
          question: ["Last game! 🎡", "Wheel ghumao... jo bhi aayega, wo birthday coupon tumhara. Kabhi bhi redeem kar sakti ho 😄"],
          prizes: [
            { emoji: "🍫", label: "Ek chocolate, bina maange" },
            { emoji: "☕", label: "Ek treat, cafe tumhari choice" },
            { emoji: "🎧", label: "Ek playlist, tumhare mood ke hisaab se" },
            { emoji: "🗣️", label: "1 ghanta rant session, zero advice" },
            { emoji: "🏆", label: "Ek argument jeetne ka pass" },
            { emoji: "✍️", label: "Ek shayari, on demand" },
          ],
          buttonLabel: "Coupon claim karo",
          after: ["Coupon unlocked: {prize} 🎟️", "Screenshot le lo 📸 Expiry date koi nahi hai."],
        },
      ],
      shayari: "",
      // The full thank-you is in the final letter (BIRTHDAY_MESSAGE), so this just leads to it.
      message: `Thank you for playing along. 😊

Bas ek aakhri cheez baaki hai...
ek chhota sa cake, aur ek letter. ✨`,
    },
  ],

  // Video cards at the end of the vault grid. They play as a silent looping
  // preview inside the card; tapping one opens it at the center with controls.
  // Locked until every memory above is unlocked — set
  // `videosUnlockAfterAll: false` to have them playable from the start.
  //   src   → "/assets/…" video file
  //   icon / title → shown on the card
  //   muted → true to keep this video silent even when opened
  videosUnlockAfterAll: true,
  videos: [
    // Re-encoded copies (steady 30 fps) of "khushi video.mp4" / "khushi video 2.mp4" — they play smoother.
    { icon: "🎬", title: "Jab frame ki main character tum ho", src: "/assets/bonus-video-1.mp4", muted: true },
    { icon: "💫", title: "Unfiltered & iconic", src: "/assets/bonus-video-2.mp4" },
  ],
};

// Little UI sounds for the vault (not the reveal music). Drop your own files
// at these paths; until a file exists a soft built-in chime plays instead.
// Set a path to null to always use the chime, or SOUND_EFFECTS_ON = false for silence.
export const SOUND_EFFECTS_ON = true;
export const VAULT_SOUNDS = {
  message: "/assets/sounds/message-pop.mp3",
  click: "/assets/sounds/button-click.mp3",
  unlock: "/assets/sounds/unlock.mp3",
  sparkle: "/assets/sounds/magic-sparkle.mp3",
  vault: "/assets/sounds/vault-opening.mp3",
};

/* ───────────────────────── Phase 4: finale ────────────────────────── */

export const BIRTHDAY_SONG_SRC = "/assets/happy-birthday.mp3";

// Typed out letter by letter after she blows out the candle, under the
// "Happy Birthday, Khushi!" heading. Line breaks are kept; the typewriter
// pauses briefly at punctuation.
export const BIRTHDAY_MESSAGE = `Happy Birthday, Khushi ✨
You are like sunlight that brightens everything quietly, without ever asking for attention.
Your innocence is your real beauty, and your own color shines differently — and beautifully — from every other hue.

Always keep cheering the innocent girl inside you,
that gentle simplicity that makes you, you.
Aur yaad rakhna — no matter how life moves, everything finds its place in time.
May all your wishes come true, aur may this year bring you peace, joy, and everything your heart is quietly waiting for.`;

// Shown under the letter once the trip-recap email is on its way.
export const EMAIL_SENT_LINE = "Apna inbox check karo — game ka recap aur tumhara coupon wahan pahunch gaya hai.";

// Signed under the letter once it finishes typing.
export const LETTER_SIGNATURE = `— ${YOUR_NAME} ✨`;
