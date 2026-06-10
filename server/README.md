# ChordSpark Community Server

Optional, self-hosted song-sharing API (Express + SQLite). The app's
Community page reads from `http://localhost:3456` and degrades gracefully
when the server isn't running. It is **not** bundled into the desktop
installer — it can't run from inside the app package and its dependencies
aren't shipped there.

## Run locally

```bash
cd server
npm install
npm start   # listens on http://localhost:3456, creates songs.db beside server.js
```

## Endpoints

- `GET /api/songs?q=&sort=` — list songs (top-voted by default, `sort=newest` for recent)
- `GET /api/songs/:id` — single song
- `POST /api/songs` — submit a song (title, artist, chords/progression as JSON arrays, bpm 20–300, level 1–3)
- `POST /api/songs/:id/vote` — upvote (one per IP per song, in-memory dedup)

Rate limits: 60 reads / 5 writes / 10 votes per minute per IP, in-memory.

## Hosting remotely

Point `COMMUNITY_URL` in `js/timers.js` at the deployment and serve it over
HTTPS. Note the vote/rate-limit state is in-memory (resets on restart) and
there is no authentication — fine for a small trusted community, not for a
public instance without hardening.
