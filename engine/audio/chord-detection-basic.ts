// VERY basic chord detection placeholder (frequency → rough chord guess)
// NOTE: This is a stub. Replace with ML or DSP model later.

export function detectChordBasic(freqData: Uint8Array): string | null {
  const avg = freqData.reduce((a, b) => a + b, 0) / freqData.length;

  // crude thresholds just to simulate behavior
  if (avg > 180) return 'C';
  if (avg > 140) return 'G';
  if (avg > 100) return 'Am';
  if (avg > 70) return 'F';

  return null;
}
