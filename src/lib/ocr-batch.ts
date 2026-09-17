/** ponytail: pure batch index advance — assert-based self-check below. */
export type BatchAdvanceStatus = 'saved' | 'skipped'

export function advanceOcrBatchIndex(
  index: number,
  total: number,
  status: BatchAdvanceStatus,
  savedCount: number,
  skippedCount: number,
): { done: true; savedCount: number; skippedCount: number } | { done: false; index: number; savedCount: number; skippedCount: number } {
  const nextSaved = savedCount + (status === 'saved' ? 1 : 0)
  const nextSkipped = skippedCount + (status === 'skipped' ? 1 : 0)
  const nextIndex = index + 1
  if (nextIndex >= total) return { done: true, savedCount: nextSaved, skippedCount: nextSkipped }
  return { done: false, index: nextIndex, savedCount: nextSaved, skippedCount: nextSkipped }
}

if (import.meta.env?.DEV) {
  const mid = advanceOcrBatchIndex(0, 3, 'saved', 0, 0)
  console.assert(!mid.done && mid.index === 1 && mid.savedCount === 1, 'batch advance mid')
  const end = advanceOcrBatchIndex(2, 3, 'skipped', 2, 0)
  console.assert(end.done && end.skippedCount === 1 && end.savedCount === 2, 'batch advance end')
}
