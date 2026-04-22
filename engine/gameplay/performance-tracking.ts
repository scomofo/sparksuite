// SparkSuite Performance Tracking v1

export interface PerformanceEvent {
  timeSec: number;
  expectedChord: string | null;
  detectedChord: string | null;
  correct: boolean;
  timingOffsetMs?: number;
}

export interface PerformanceSummary {
  totalNotes: number;
  correctNotes: number;
  accuracy: number;
  longestStreak: number;
}

export function logEvent(events: PerformanceEvent[], event: PerformanceEvent): PerformanceEvent[] {
  return [...events, event];
}

export function calculateSummary(events: PerformanceEvent[]): PerformanceSummary {
  let correct = 0;
  let streak = 0;
  let longestStreak = 0;

  events.forEach(e => {
    if (e.correct) {
      correct++;
      streak++;
      if (streak > longestStreak) longestStreak = streak;
    } else {
      streak = 0;
    }
  });

  return {
    totalNotes: events.length,
    correctNotes: correct,
    accuracy: events.length ? correct / events.length : 0,
    longestStreak
  };
}
