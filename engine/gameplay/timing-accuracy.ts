// Timing Accuracy Scoring (ms-level)

export function calculateTimingOffsetMs(expectedTime: number, actualTime: number): number {
  return (actualTime - expectedTime) * 1000;
}

export function scoreTiming(offsetMs: number): number {
  const abs = Math.abs(offsetMs);

  if (abs < 50) return 100;   // perfect
  if (abs < 100) return 70;   // good
  if (abs < 180) return 40;   // ok
  return 0;                   // miss
}

export function timingGrade(offsetMs: number): string {
  const abs = Math.abs(offsetMs);

  if (abs < 50) return 'perfect';
  if (abs < 100) return 'good';
  if (abs < 180) return 'ok';
  return 'miss';
}
