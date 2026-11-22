# Sync YouTube

Watch YouTube together in one shared room. Load a YouTube URL or video ID,
play, pause, or seek for everyone, and chat with a name and a consistent username color.
The default video is `tAfi0X-cJag`.

Rebuilt with React 19 + TypeScript + Vite, Express 5, and Socket.IO 4 on both
ends. No jQuery, Bootstrap, vendored Socket.IO, API key, or database needed.

## Run locally

Use Node **22** (`nvm use`); supported minimum is Node 20.19 (required by Vite).

```sh
npm install
npm run dev
```

Open http://localhost:5173 in two tabs. The server listens on port 4000;
Vite proxies `/socket.io` including WebSocket upgrades to it.
Choose a name in each tab, send a chat message, then use the shared player controls.
Paste a YouTube link to change the video for everyone.

## Scripts

| Command             | Purpose                                            |
| ------------------- | -------------------------------------------------- |
| `npm run dev`       | Vite + server watch mode                           |
| `npm test`          | Vitest server integration and client utility tests |
| `npm run typecheck` | Strict client/server TypeScript checks             |
| `npm run build`     | Typecheck, build client, compile server            |
| `npm start`         | Run the built server and serve the client          |
| `npm ci`            | Reproducible install from the committed lockfile   |

Production-like run:

```sh
npm ci
npm run build
npm start
# http://localhost:4000
```

Set `PORT` to change the production/server port (default `4000`). If changing
the backend port in development, also adjust the Vite proxy target.
No other environment variables are required.

## Project structure

- `client/src/`: React UI, YouTube IFrame API integration, chat, utilities
- `server/src/`: Express + Socket.IO app factory and server entrypoint
- `shared/protocol.ts`: typed Socket.IO event contracts
- `server/test/`: real Socket.IO clients against random-port servers
- `.github/workflows/ci.yml`: Node 22, clean install, tests, build

Legacy events remain: `event` (`{ state: 'play' | 'pause' | 'seekTo', time }`),
`new user`, `chat message` (`{ username, payload }`), and `connection2` welcome.
`load video` broadcasts a video ID; `room state` restores current playback/video
for new or reconnecting clients. The server broadcasts to all clients including the sender.
Chat identity is bound to the socket after a valid `new user` event.

## Deploy to Heroku

Requires the Heroku CLI, an account, and a configured Node.js app/buildpack.

```sh
heroku create
heroku buildpacks:set heroku/nodejs
git push heroku HEAD:main
heroku open
```

The Node buildpack installs dependencies and runs `heroku-postbuild` to compile
the app (keep build-time devDependencies enabled). `Procfile` runs `npm start`;
the server binds `0.0.0.0` and uses Heroku's `PORT`.

## Current scope and limitations

- Everyone on the same server shares **one public room**; no authentication, private rooms,
  moderation, or rate limiting. Do not use chat for private information.
- Room state is in memory and resets on restart. Run **one process/dyno**;
  scaling needs a shared state store and Socket.IO adapter/sticky sessions.
- Chat is ephemeral (no stored history); the browser retains the latest 200 messages.
  Names persist only in that tab's session storage.
- Synchronization is event-based, not frame-accurate drift correction. Use the app's
  shared controls, not controls inside the YouTube iframe. Videos start paused.
- YouTube must allow embedding; age/region/copyright restrictions still apply.
  Browser autoplay policies can require each viewer to press Play once.
  Google Fonts is optional; the UI falls back to system fonts.
- Tests mock no server transport: they use real local Socket.IO connections.
  Client tests cover parsing/color/time utilities, not live YouTube playback.

License: ISC. Original author: Ömürcan Cengiz.
