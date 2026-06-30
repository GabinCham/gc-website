export type CanTuning = {
  position: [number, number, number]
  /** Degrés (Euler XYZ) en plus de la rotation au scroll */
  rotation: [number, number, number]
  /** Multiplicateur d’échelle sur le modèle normalisé */
  scale: number
  /** Tourner avec le scroll */
  followScroll: boolean
  /** Marge autour du modèle pour le cadrage caméra */
  fitMargin: number
  /** Décalage caméra (m) après auto-fit */
  cameraOffset: [number, number, number]
}

export const CAN_TUNING: CanTuning = {
  position: [0, 0, 0],
  rotation: [17, 132, -34.5],
  scale: 1,
  followScroll: true,
  fitMargin: 1.22,
  cameraOffset: [0, 0, -4],
}

export const canTuningRef: { current: CanTuning } = {
  current: { ...CAN_TUNING },
}

const listeners = new Set<() => void>()

function notify() {
  for (const listener of listeners) {
    listener()
  }
}

export function subscribeCanTuning(listener: () => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function getCanTuningSnapshot(): CanTuning {
  return canTuningRef.current
}

export function setCanTuning(next: CanTuning) {
  canTuningRef.current = next
  notify()
}

export function patchCanTuning(patch: Partial<CanTuning>) {
  setCanTuning({ ...canTuningRef.current, ...patch })
}

export function resetCanTuning() {
  setCanTuning({ ...CAN_TUNING })
}

export function formatCanTuningSnippet(tuning: CanTuning): string {
  const p = tuning.position.map((n) => +n.toFixed(3))
  const r = tuning.rotation.map((n) => +n.toFixed(1))
  const c = tuning.cameraOffset.map((n) => +n.toFixed(3))
  const s = +tuning.scale.toFixed(3)
  const m = +tuning.fitMargin.toFixed(3)
  return `export const CAN_TUNING = {
  position: [${p.join(', ')}] as [number, number, number],
  rotation: [${r.join(', ')}] as [number, number, number],
  scale: ${s},
  followScroll: ${tuning.followScroll},
  fitMargin: ${m},
  cameraOffset: [${c.join(', ')}] as [number, number, number],
}`
}
