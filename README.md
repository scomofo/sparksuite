# ChordSpark

Guitar chord learning app with practice tracking, drill modes, games, and ear training.

Desktop, mobile, and web from one codebase.

## Features

### Learn
- Chord library with diagrams and audio
- Guided lessons from beginner to advanced
- Song library with real chord progressions

### Practice
- Drill mode for rapid chord recognition
- Timed sessions with streak tracking
- Dual mode for side-by-side chord comparison

### Play
- Chord games and interactive challenges
- Ear training for chord recognition by sound
- Progress stats over time

### Audio
- Real guitar sample playback
- Web Audio API support
- Freesound-based extended sound library

## Quick Start

```bash
npm install
npm start
npm run tauri:dev
```

Or open `index.html` in a browser.

## Platforms

| Platform | Command | Engine |
|:---------|:--------|:-------|
| Windows / Mac / Linux | `npm start` | Electron 34 |
| Lightweight native desktop | `npm run tauri:dev` | Tauri |
| iOS / Android | `npx cap run` | Capacitor |
| Web browser | Open `index.html` | None |

## Project Structure

```text
chordspark/
|-- guitar_chords/   Real WAV chord audio samples
|-- index.html       App entry point
|-- styles.css       Styling
|-- js/
|   |-- app.js       App coordinator
|   |-- audio.js     Audio playback engine
|   |-- data.js      Chord database
|   |-- state.js     State management
|   |-- ui.js        UI rendering
|   `-- pages/
|       |-- practice.js
|       |-- guided.js
|       |-- songs.js
|       |-- games.js
|       |-- dual.js
|       |-- session.js
|       `-- tools.js
`-- server/
    `-- server.js    Express dev server
```

## Sister App

PianoSpark shares content with ChordSpark: same lessons, same format, different instrument.

**[PianoSpark](https://github.com/scomofo/Pianospark)**

Built by Scott Morley.
