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
  rotation: [0, 180, 0],
  scale: 2.2,
  followScroll: true,
  fitMargin: 0.88,
  cameraOffset: [-2.95, 0, -2.2],
}

/** Incrémente quand tu changes CAN_TUNING dans le code pour invalider le cache navigateur. */
export const CAN_TUNING_VERSION = 6

const STORAGE_KEY = 'gc-can-tuning'

export const canTuningRef: { current: CanTuning } = {
  current: loadCanTuning(),
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
  saveCanTuning(next)
  notify()
}

export function patchCanTuning(patch: Partial<CanTuning>) {
  setCanTuning({ ...canTuningRef.current, ...patch })
}

export function resetCanTuning() {
  setCanTuning({ ...CAN_TUNING })
}

function mergeTuning(defaults: CanTuning, parsed: Partial<CanTuning>): CanTuning {
  return {
    ...defaults,
    ...parsed,
    position: [
      parsed.position?.[0] ?? defaults.position[0],
      parsed.position?.[1] ?? defaults.position[1],
      parsed.position?.[2] ?? defaults.position[2],
    ],
    rotation: [
      parsed.rotation?.[0] ?? defaults.rotation[0],
      parsed.rotation?.[1] ?? defaults.rotation[1],
      parsed.rotation?.[2] ?? defaults.rotation[2],
    ],
    scale: parsed.scale ?? defaults.scale,
    followScroll: parsed.followScroll ?? defaults.followScroll,
    fitMargin: parsed.fitMargin ?? defaults.fitMargin,
    cameraOffset: [
      parsed.cameraOffset?.[0] ?? defaults.cameraOffset[0],
      parsed.cameraOffset?.[1] ?? defaults.cameraOffset[1],
      parsed.cameraOffset?.[2] ?? defaults.cameraOffset[2],
    ],
  }
}

function loadCanTuning(): CanTuning {
  if (typeof localStorage === 'undefined') return { ...CAN_TUNING }

  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { ...CAN_TUNING }
    const parsed = JSON.parse(raw) as Partial<CanTuning> & { version?: number }
    if (parsed.version !== CAN_TUNING_VERSION) return { ...CAN_TUNING }
    return mergeTuning(CAN_TUNING, parsed)
  } catch {
    return { ...CAN_TUNING }
  }
}

function saveCanTuning(tuning: CanTuning) {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ ...tuning, version: CAN_TUNING_VERSION }),
    )
  } catch {
    /* quota / private mode */
  }
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
