import { CENTER_MODEL_DEFAULT } from './centerModels'

export type VhsTuning = {
  position: [number, number, number]
  /** Degrés (Euler XYZ) en plus de la spirale */
  rotation: [number, number, number]
  /** Multiplicateur d’échelle sur le modèle normalisé */
  scale: number
  /** Tourner avec le scroll de la spirale */
  followSpiral: boolean
}

/** Réglages par défaut — K7 / modèles sans preset dédié */
export const VHS_TUNING: VhsTuning = {
  position: [0.03, 0.8, 2.67],
  rotation: [33, -23.5, -3],
  scale: 2.8,
  followSpiral: true,
}

const CENTER_MODEL_TUNING: Record<string, VhsTuning> = {
  [CENTER_MODEL_DEFAULT]: VHS_TUNING,
  '/glb/90s_computer.glb': {
    position: [0, 0.55, 0],
    rotation: [20.5, -132.5, 0],
    scale: 3.31,
    followSpiral: true,
  },
  '/glb/handycam.glb': {
    position: [-0.18, 0.66, 0],
    rotation: [22.5, 32, 0],
    scale: 3.49,
    followSpiral: true,
  },
}

const STORAGE_PREFIX = 'gc-vhs-tuning-v3'
const LEGACY_STORAGE_KEY = 'gc-vhs-tuning-v2'

let activeModelUrl = CENTER_MODEL_DEFAULT

export const vhsTuningRef: { current: VhsTuning } = {
  current: loadVhsTuningForModel(CENTER_MODEL_DEFAULT),
}

const listeners = new Set<() => void>()

function notify() {
  for (const listener of listeners) {
    listener()
  }
}

export function getDefaultVhsTuningForModel(modelUrl: string): VhsTuning {
  return CENTER_MODEL_TUNING[modelUrl] ?? VHS_TUNING
}

export function getActiveCenterModelUrl() {
  return activeModelUrl
}

export function setActiveCenterModel(modelUrl: string) {
  if (modelUrl === activeModelUrl) return
  activeModelUrl = modelUrl
  vhsTuningRef.current = loadVhsTuningForModel(modelUrl)
  notify()
}

export function subscribeVhsTuning(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function getVhsTuningSnapshot(): VhsTuning {
  return vhsTuningRef.current
}

export function setVhsTuning(next: VhsTuning) {
  vhsTuningRef.current = next
  saveVhsTuningForModel(activeModelUrl, next)
  notify()
}

export function patchVhsTuning(patch: Partial<VhsTuning>) {
  setVhsTuning({ ...vhsTuningRef.current, ...patch })
}

export function resetVhsTuning() {
  setVhsTuning({ ...getDefaultVhsTuningForModel(activeModelUrl) })
}

function storageKey(modelUrl: string) {
  return `${STORAGE_PREFIX}:${modelUrl}`
}

function mergeTuning(defaults: VhsTuning, parsed: Partial<VhsTuning>): VhsTuning {
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
    followSpiral: parsed.followSpiral ?? defaults.followSpiral,
  }
}

function loadVhsTuningForModel(modelUrl: string): VhsTuning {
  const defaults = getDefaultVhsTuningForModel(modelUrl)
  if (typeof localStorage === 'undefined') return { ...defaults }

  try {
    const raw = localStorage.getItem(storageKey(modelUrl))
    if (raw) {
      return mergeTuning(defaults, JSON.parse(raw) as Partial<VhsTuning>)
    }

    const isDefaultK7 =
      modelUrl === CENTER_MODEL_DEFAULT ||
      modelUrl === '/K7.glb' ||
      modelUrl === 'glb/K7.glb'
    if (isDefaultK7) {
      const legacy = localStorage.getItem(LEGACY_STORAGE_KEY)
      if (legacy) {
        return mergeTuning(defaults, JSON.parse(legacy) as Partial<VhsTuning>)
      }
    }

    return { ...defaults }
  } catch {
    return { ...defaults }
  }
}

function saveVhsTuningForModel(modelUrl: string, tuning: VhsTuning) {
  try {
    localStorage.setItem(storageKey(modelUrl), JSON.stringify(tuning))
  } catch {
    /* quota / private mode */
  }
}

export function formatVhsTuningSnippet(tuning: VhsTuning): string {
  const p = tuning.position.map((n) => +n.toFixed(3))
  const r = tuning.rotation.map((n) => +n.toFixed(1))
  const s = +tuning.scale.toFixed(3)
  return `export const VHS_TUNING = {
  position: [${p.join(', ')}] as [number, number, number],
  rotation: [${r.join(', ')}] as [number, number, number],
  scale: ${s},
  followSpiral: ${tuning.followSpiral},
}`
}
