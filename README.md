# Foley Royale

**A live party game of mouth-sound Foley.**  
Everyone writes a scene, mimics it with sounds only, and passes the album around the room. Players record a Foley clip or guess what they heard, then the host reveals how every album warped.

> Write a scene → make the sound → guess what you heard → laugh at the album.

---

## How to play

1. **Lobby** — Create or join a room with a 6-letter code. Host starts (2–8 players).
2. **Seed** — Everyone writes a quirky starting prompt into their own *album*.
3. **Chain** — Books rotate. On audio turns you Foley the previous text (no speaking words). On text turns you listen and guess.
4. **Showcase** — Host reveals each album step-by-step in a chat timeline: original → sound → guess → …
5. **Game over** — Flip through every album, then wrap.

### Chain length

| Players | Steps per album |
|--------:|----------------:|
| 2 | **3** (text → audio → guess) |
| 3+ | equal to player count |

Timers and max clip length live in [`server/src/config.ts`](server/src/config.ts).

---

## Features

- Simultaneous turns — nobody sits idle
- Server-authoritative wall-clock timers
- Safari / iOS audio MIME fallback (`webm;codecs=opus` → `mp4`)
- Autoplay with **Tap to Play Sound** when the browser blocks audio
- Timeout / disconnect placeholders so chains keep moving
- Showcase feed that keeps earlier steps on screen

---

## Tech stack

| Layer | Stack |
|-------|--------|
| Client | React, Vite, TypeScript, Tailwind CSS v4, Framer Motion, Socket.io-client |
| Server | Node.js, Express, Socket.io, Zod, in-memory `RoomManager` |
| Data | Room state in memory; MongoDB optional (`ENABLE_MONGO=true`) |

---

## Quick start

**Requirements:** Node.js 20+

```bash
npm install
cp server/.env.example server/.env
npm run dev
```

- App: http://localhost:5173  
- API / sockets: http://localhost:3001 (proxied through Vite as `/socket.io`)

### Scripts

| Command | What it does |
|---------|----------------|
| `npm run dev` | Client + server together |
| `npm run build` | Production build |
| `npm run start` | Run built server |
| `npm run seed` | Seed Mongo prompts (only if Mongo enabled) |

---

## Play with friends online

Microphone access needs **HTTPS** (or `localhost`). Plain `http://` tunnels block the mic.

With the game running (`npm run dev`), open a second terminal:

```bash
ssh -p 443 -R0:localhost:5173 a.pinggy.io
```

Share the printed `https://….pinggy-free.link` (or `.pinggy.net`) URL and the room code.  
Keep both terminals open; free Pinggy tunnels expire after ~60 minutes.

Other options that sometimes work depending on your network: `cloudflared`, `localhost.run`, `localtunnel`. Avoid plain HTTP tunnels (e.g. `bore.pub`) if you need the microphone.

---

## Project layout

```
game/
├── client/          # React UI (lobby, turns, showcase)
├── server/          # Socket.io game engine
│   └── src/
│       ├── config.ts
│       ├── game/RoomManager.ts
│       └── socket/
└── package.json     # npm workspaces
```

---

## Config knobs

Edit [`server/src/config.ts`](server/src/config.ts):

| Key | Meaning |
|-----|---------|
| `initialPromptSeconds` | Time to write the opening scene |
| `audioStepSeconds` | Audio-phase countdown |
| `textStepSeconds` | Guess-phase countdown |
| `audioRecordMaxMs` | Max recording length (milliseconds) |

Start a **new room** after changing values.

---

## License

Private / unlicensed — for personal and party use unless you add a license.
