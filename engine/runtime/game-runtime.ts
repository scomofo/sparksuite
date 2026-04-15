// Full Runtime Loop (ties everything together)

import { initMicStream, createAnalyser, getFrequencyData } from '../audio/mic-input'
import { detectChordBasic } from '../audio/chord-detection-basic'
import { normalizeDetection } from '../gameplay/chord-detection-adapter'
import { getExpectedChord, SongTiming } from '../timing/timing-engine'
import { updateGameplay } from '../gameplay/gameplay-engine'
import { calculateTimingOffsetMs, scoreTiming } from '../gameplay/timing-accuracy'
import { logEvent } from '../gameplay/performance-tracking'

export async function startRuntime(song: SongTiming, onUpdate: Function) {
  const stream = await initMicStream()
  const analyser = createAnalyser(stream)

  let startTime = performance.now()
  let events: any[] = []
  let state: any = { score: 0, streak: 0 }

  function loop() {
    const now = performance.now()
    const timeSec = (now - startTime) / 1000

    const freq = getFrequencyData(analyser)
    const rawChord = detectChordBasic(freq)

    const detected = normalizeDetection({ chord: rawChord, confidence: 0.8 })
    const expected = getExpectedChord(song, timeSec)

    const offset = calculateTimingOffsetMs(timeSec, timeSec) // placeholder alignment
    const timingScore = scoreTiming(offset)

    state = updateGameplay(song, timeSec, detected, state)

    events = logEvent(events, {
      timeSec,
      expectedChord: expected,
      detectedChord: detected,
      correct: expected === detected
    })

    onUpdate({ state, expected, detected, timingScore })

    requestAnimationFrame(loop)
  }

  loop()
}
