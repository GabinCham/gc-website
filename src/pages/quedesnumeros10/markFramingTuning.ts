import { MARK_FRAMING_CONFIG } from './mark-framing.config'

export type MarkFramingTuning = {
  x: number
  y: number
  scale: number
}

export const MARK_FRAMING_TUNING: MarkFramingTuning = {
  x: MARK_FRAMING_CONFIG.x,
  y: MARK_FRAMING_CONFIG.y,
  scale: MARK_FRAMING_CONFIG.scale,
}

export const markFramingTuningRef: { current: MarkFramingTuning } = {
  current: structuredClone(MARK_FRAMING_TUNING),
}

const listeners = new Set<() => void>()

function notify() {
  for (const listener of listeners) {
    listener()
  }
}

export function subscribeMarkFramingTuning(listener: () => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function getMarkFramingTuningSnapshot(): MarkFramingTuning {
  return markFramingTuningRef.current
}

export function setMarkFramingTuning(next: MarkFramingTuning) {
  markFramingTuningRef.current = next
  notify()
}

export function patchMarkFramingTuning(patch: Partial<MarkFramingTuning>) {
  setMarkFramingTuning({
    ...markFramingTuningRef.current,
    ...patch,
  })
}

export function resetMarkFramingTuning() {
  setMarkFramingTuning(structuredClone(MARK_FRAMING_TUNING))
}

export function formatMarkFramingTuningSnippet(tuning: MarkFramingTuning): string {
  return `export const MARK_FRAMING_CONFIG = {
  x: ${Math.round(tuning.x)},
  y: ${Math.round(tuning.y)},
  scale: ${+tuning.scale.toFixed(3)},
} as const`
}
