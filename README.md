<p align="center">
  <img src="https://img.shields.io/badge/JavaScript-ES2024-f7df1e?style=for-the-badge&logo=javascript&logoColor=black" />
  <img src="https://img.shields.io/badge/Electron-34-47848f?style=for-the-badge&logo=electron&logoColor=white" />
  <img src="https://img.shields.io/badge/Tauri-2.0-ffc131?style=for-the-badge&logo=tauri&logoColor=white" />
  <img src="https://img.shields.io/badge/Capacitor-Mobile-119eff?style=for-the-badge&logo=capacitor&logoColor=white" />
</p>

<h1 align="center">🎸 ChordSpark</h1>

<p align="center">
  <strong>Guitar chord learning app with practice tracking, drill modes, games, and ear training</strong>
</p>

<p align="center">
  <em>Desktop &bull; Mobile &bull; Web &mdash; one codebase, every platform</em>
</p>

---

## ✨ Features

<table>
<tr>
<td width="50%">

### 🎵 Learn
- **Chord Library** &mdash; Full chord database with diagrams and audio
- **Guided Lessons** &mdash; Beginner to advanced, step by step
- **Song Library** &mdash; Play along with real chord progressions

</td>
<td width="50%">

### 🏋️ Practice
- **Drill Mode** &mdash; Rapid-fire chord recognition
- **Timed Sessions** &mdash; Track practice with streaks
- **Dual Mode** &mdash; Side-by-side chord comparison

</td>
</tr>
<tr>
<td>

### 🎮 Play
- **Chord Games** &mdash; Interactive challenges
- **Ear Training** &mdash; Identify chords by sound
- **Progress Stats** &mdash; Track accuracy over time

</td>
<td>

### 🔊 Audio
- **Real Guitar Samples** &mdash; WAV chord recordings
- **Web Audio API** &mdash; Low-latency playback
- **Freesound Integration** &mdash; Extended sound library

</td>
</tr>
</table>

---

## 🚀 Quick Start

```bash
npm install
npm start          # 🖥️ Electron desktop
npm run tauri:dev  # ⚡ Tauri (lightweight)
```

Or just open `index.html` in any browser.

## 🌐 Multi-Platform

| Platform | Command | Engine |
|:---------|:--------|:-------|
| 🖥️ **Windows / Mac / Linux** | `npm start` | Electron 34 |
| ⚡ **Lightweight Native** | `npm run tauri:dev` | Tauri (Rust) |
| 📱 **iOS / Android** | `npx cap run` | Capacitor |
| 🌐 **Web Browser** | Open `index.html` | None needed |

## 📁 Structure

```
chordspark/
├── 🎵 guitar_chords/        Real WAV chord audio samples
├── 📄 index.html             App entry point
├── 🎨 styles.css             Styling
├── js/
│   ├── app.js                App coordinator
│   ├── audio.js              Audio playback engine
│   ├── data.js               Chord database
│   ├── state.js              State management
│   ├── ui.js                 UI rendering
│   └── pages/
│       ├── practice.js       Practice sessions
│       ├── guided.js         Guided lessons
│       ├── songs.js          Song library
│       ├── games.js          Chord games
│       ├── dual.js           Dual comparison
│       ├── session.js        Session tracking
│       └── tools.js          Tuner, metronome
└── server/
    └── server.js             Express dev server
```

## 🎹 Sister App

PianoSpark shares content with ChordSpark &mdash; same lessons, same format, different instrument.

**[PianoSpark &rarr;](https://github.com/scomofo/Pianospark)**

---

<p align="center">
  <sub>Built by Scott Morley</sub>
</p>
