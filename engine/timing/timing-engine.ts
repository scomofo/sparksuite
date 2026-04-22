// SparkSuite Timing Engine v1

export interface TimelineEvent {
  bar: number;
  beat: number;
  chord: string;
}

export interface SongTiming {
  bpm: number;
  timeSignature: number; // beats per bar (e.g. 4 for 4/4)
  timeline: TimelineEvent[];
}

export function getBeat(timeSec: number, bpm: number): number {
  return timeSec * (bpm / 60);
}

export function getBar(beat: number, timeSignature: number): number {
  return Math.floor(beat / timeSignature) + 1;
}

export function getExpectedChord(song: SongTiming, timeSec: number): string | null {
  const beat = getBeat(timeSec, song.bpm);
  const bar = getBar(beat, song.timeSignature);

  // find closest matching event (simple v1)
  const event = song.timeline
    .filter(e => e.bar <= bar)
    .sort((a, b) => b.bar - a.bar)[0];

  return event ? event.chord : null;
}

// Debug helper
export function debugTiming(song: SongTiming, timeSec: number) {
  const beat = getBeat(timeSec, song.bpm);
  const bar = getBar(beat, song.timeSignature);
  const chord = getExpectedChord(song, timeSec);

  return {
    timeSec,
    beat: beat.toFixed(2),
    bar,
    chord
  };
}
