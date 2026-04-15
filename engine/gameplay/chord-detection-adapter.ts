// Adapter layer to connect external chord detection to gameplay

export interface DetectionInput {
  chord: string | null;
  confidence: number; // 0–1
}

export function normalizeDetection(input: DetectionInput, threshold = 0.6): string | null {
  if (!input.chord) return null;
  if (input.confidence < threshold) return null;

  // Normalize chord naming (basic v1)
  return input.chord.replace('maj', '').replace('min', 'm');
}
