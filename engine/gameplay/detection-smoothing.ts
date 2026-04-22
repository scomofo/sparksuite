// Detection smoothing + confidence stabilization

export function smoothChord(history: (string | null)[], windowSize = 5): string | null {
  const recent = history.slice(-windowSize)

  const counts: Record<string, number> = {}

  recent.forEach(chord => {
    if (!chord) return
    counts[chord] = (counts[chord] || 0) + 1
  })

  let best: string | null = null
  let max = 0

  Object.entries(counts).forEach(([chord, count]) => {
    if (count > max) {
      best = chord
      max = count
    }
  })

  return best
}

export function computeConfidence(history: (string | null)[], chord: string | null): number {
  if (!chord) return 0

  const matches = history.filter(c => c === chord).length
  return matches / history.length
}
