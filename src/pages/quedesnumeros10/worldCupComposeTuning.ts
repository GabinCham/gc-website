export type WorldCupComposeTuning = {
  coupe: {
    x: number
    y: number
    scale: number
  }
}

export const WORLD_CUP_COMPOSE_TUNING: WorldCupComposeTuning = {
  coupe: {
    x: 41,
    y: 50,
    scale: 2.22,
  },
}

export const worldCupComposeTuningRef: { current: WorldCupComposeTuning } = {
  current: structuredClone(WORLD_CUP_COMPOSE_TUNING),
}

const listeners = new Set<() => void>()

function notify() {
  for (const listener of listeners) {
    listener()
  }
}

export function subscribeWorldCupComposeTuning(listener: () => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function getWorldCupComposeTuningSnapshot(): WorldCupComposeTuning {
  return worldCupComposeTuningRef.current
}

export function setWorldCupComposeTuning(next: WorldCupComposeTuning) {
  worldCupComposeTuningRef.current = next
  notify()
}

export function patchWorldCupComposeTuning(patch: Partial<WorldCupComposeTuning['coupe']>) {
  setWorldCupComposeTuning({
    coupe: { ...worldCupComposeTuningRef.current.coupe, ...patch },
  })
}

export function resetWorldCupComposeTuning() {
  setWorldCupComposeTuning(structuredClone(WORLD_CUP_COMPOSE_TUNING))
}

export function formatWorldCupComposeTuningSnippet(
  tuning: WorldCupComposeTuning,
): string {
  const { x, y, scale } = tuning.coupe
  return `  coupe: {
    x: '${x}px',
    y: '${y}px',
    scale: ${+scale.toFixed(3)},
  },`
}
