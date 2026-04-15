// Convert timeline (bar/beat) → absolute time (seconds)

import { SongTiming } from '../timing/timing-engine'

export interface Note {
  chord: string;
  time: number; // seconds
}

export function timelineToNotes(song: SongTiming): Note[] {
  const secondsPerBeat = 60 / song.bpm

  return song.timeline.map(e => ({
    chord: e.chord,
    time: ((e.bar - 1) * song.timeSignature + (e.beat - 1)) * secondsPerBeat
  }))
}
