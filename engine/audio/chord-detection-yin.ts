// Improved pitch detection using autocorrelation (YIN-style simplified)

export function detectPitch(buffer: Float32Array, sampleRate: number): number | null {
  let bestOffset = -1
  let bestCorrelation = 0

  for (let offset = 8; offset < 1000; offset++) {
    let correlation = 0

    for (let i = 0; i < buffer.length - offset; i++) {
      correlation += buffer[i] * buffer[i + offset]
    }

    if (correlation > bestCorrelation) {
      bestCorrelation = correlation
      bestOffset = offset
    }
  }

  if (bestOffset === -1) return null

  return sampleRate / bestOffset
}

export function pitchToChord(freq: number): string {
  if (freq < 110) return 'C'
  if (freq < 146) return 'D'
  if (freq < 196) return 'G'
  if (freq < 246) return 'B'
  return 'C'
}
