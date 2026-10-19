# Birthday Surprise 💖

A four-phase interactive birthday presentation built with React, Vite, Tailwind CSS v4, Framer Motion and react-confetti.

1. **Landing page.** A dark, glowing teaser ("I made something for you…") with a pulsing Start button.
2. **Game.** She catches 3 floating hearts, stars and gifts, or answers 3 trivia questions about you two. Each success sets off a sparkle burst and flips over a locked Memory Fragment.
3. **Memory Vault.** A vault door opens onto 5 locked cards that unlock one after another. Each card is a short chat: you ask, she replies with buttons, colours, a dropdown, a text box or a slider. Finishing a chat breaks its lock, fades in a short piece of music, types out a shayari and slowly reveals a photo. Finished cards re-open in a cinematic viewer. When all 5 are done the vault glows, confetti falls and a button leads to the finale.
4. **Finale.** A cake with a flickering candle. Tapping the candle blows it out, plays the song, fires confetti and types out your message.

## Setup

```bash
npm install      # already done once; run it again on a new machine
npm run dev      # open the printed URL (usually http://localhost:5173)
npm run build    # production build in dist/, which you can host on Netlify or Vercel
```

Packages used: `react`, `react-dom`, `framer-motion`, `lucide-react`, `react-confetti`, plus the dev tools `vite`, `@vitejs/plugin-react`, `tailwindcss` and `@tailwindcss/vite`.

## Personalize it

**All your content is in [src/config.js](src/config.js).** You shouldn't need to edit any component.

| What | Where in `config.js` |
| --- | --- |
| Her name and your name | `HER_NAME`, `YOUR_NAME` |
| Landing text | `LANDING_LINE_1`, `LANDING_LINE_2` |
| Catch game or trivia | `GAME_MODE = "catch"` or `"trivia"` |
| Trivia questions | `TRIVIA_QUESTIONS` (`answer` is the index of the right option, starting at 0) |
| Fragment cards | `MEMORY_FRAGMENTS` (one per win, so 3 entries means 3 wins) |
| Memory Vault: titles, questions, shayari, photos, music | `MEMORY_VAULT` |
| Vault sound effects | `VAULT_SOUNDS`, `SOUND_EFFECTS_ON` |
| Song | `BIRTHDAY_SONG_SRC` |
| Final letter and signature | `BIRTHDAY_MESSAGE`, `LETTER_SIGNATURE` |

### Media files

Put your files in `public/assets/`. With the default config the app looks for:

```
public/assets/photo1.jpg … photo5.jpg     (one per memory card)
public/assets/audio/memory1.mp3 … memory5.mp3   (10–20 s instrumentals for the reveals)
public/assets/audio/itni-kyu-tum-khoobsurat-ho.mp3   (the song for the black saree memory, card 2)
public/assets/happy-birthday.mp3
public/assets/sounds/message-pop.mp3, button-click.mp3, unlock.mp3,
                     magic-sparkle.mp3, vault-opening.mp3   (optional UI sounds)
```

The UI sounds are optional: until a file exists, a soft built-in chime plays instead. The reveal music never plays when the page opens. It starts only when a conversation is finished, fades in, fades out by itself, and only one track ever plays at a time.

### Conversations

Each card in `MEMORY_VAULT.cards` has a list of `steps`. The comment above `MEMORY_VAULT` explains every step type (`choice`, `text`, `colors`, `select`, `rating`) and the playful "No" `pushback`.

Her replies are not saved or sent anywhere. While testing you can see them in the browser console with `window.vaultAnswers`.

## Project layout

```
src/
  config.js              ← your content
  App.jsx                ← phase state machine (landing → game → vault → finale)
  phases/                ← one component per phase
  game/                  ← CatchGame, TriviaGame, FragmentCards
  vault/                 ← Memory Vault: MemoryCard, ConversationModal (the chat),
                           ReplyInputs, useConversation (chat logic), ShayariReveal,
                           MemoryPhotoModal (viewer), AudioPlayer (reveal music),
                           ProgressTracker, FloatingParticles, VaultDoor, ContinueButton
```

## Tips

- Test it on her kind of device (probably a phone) before the big moment.
- Browsers only allow audio to start after a tap. The song starts from the candle tap, so it works. Keep her phone off silent mode.
- To change the colors, edit the `@theme` block in [src/index.css](src/index.css).
