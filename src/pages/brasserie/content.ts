import {
  BRASSERIE_CANS_CONFIG,
  type BrasserieCanEntry,
} from './cans.config'

export const CAN_GLB_URL = '/glb/can.glb'
export const BRASSERIE_HDR_URL = new URL(
  '../../../assets/forest_slope_4k.hdr',
  import.meta.url,
).href

/** Mesh du label cannette (nom Blender) — repli sur UV_Wrap si absent après export. */
export const CAN_LABEL_MESH_NAMES = ['Object_9', 'Object_5'] as const
export const CAN_LABEL_MATERIAL_NAMES = ['UV_Wrap'] as const

export type { BrasserieCanEntry }

export type BrasserieCanConfig = BrasserieCanEntry & {
  texture: string
  textColorLeft: string
  textColorRight: string
}

// ─── Textures (assets/can-textures) ─────────────────────────────────────────

const canTextureModules = import.meta.glob(
  '../../../assets/can-textures/*.{png,jpg,jpeg,webp}',
  { eager: true, query: '?url', import: 'default' },
) as Record<string, string>

const CAN_TEXTURE_URL_BY_STEM = Object.fromEntries(
  Object.entries(canTextureModules).map(([path, url]) => {
    const stem = path.split('/').pop()?.replace(/\.[^.]+$/, '') ?? ''
    return [stem, url]
  }),
) as Record<string, string>

const DEFAULT_TEXT_COLOR = '#ffffff'

function normalizeCan(entry: BrasserieCanEntry): BrasserieCanConfig {
  return {
    ...entry,
    texture: entry.texture ?? entry.id,
    textColorLeft: entry.textColorLeft ?? DEFAULT_TEXT_COLOR,
    textColorRight: entry.textColorRight ?? DEFAULT_TEXT_COLOR,
  }
}

/** Canettes normalisées — dérivées de cans.config.ts */
export const BRASSERIE_CANS: BrasserieCanConfig[] =
  BRASSERIE_CANS_CONFIG.map(normalizeCan)

// ─── Dérivés ─────────────────────────────────────────────────────────────────

export const BRASSERIE_SCROLL_TURNS = BRASSERIE_CANS.length

export const CAN_TEXTURE_URLS = BRASSERIE_CANS.map(
  (can) => CAN_TEXTURE_URL_BY_STEM[can.texture] ?? '',
).filter(Boolean)

export function getBrasserieCanById(id: string): BrasserieCanConfig | undefined {
  return BRASSERIE_CANS.find((can) => can.id === id)
}

export function getBrasserieCanIndex(scrollProgress: number): number {
  if (BRASSERIE_CANS.length === 0) return 0
  const turnFloat = scrollProgress * BRASSERIE_CANS.length
  return Math.min(Math.floor(turnFloat), BRASSERIE_CANS.length - 1)
}

export function getBrasserieCan(scrollProgress: number): BrasserieCanConfig {
  return BRASSERIE_CANS[getBrasserieCanIndex(scrollProgress)]!
}

/** Variables CSS injectées sur le viewport */
export function getBrasserieThemeStyle(
  can: BrasserieCanConfig,
): Record<string, string> {
  const ui = can.textColorLeft
  return {
    '--brasserie-bg-left': can.bgLeft,
    '--brasserie-bg-right': can.bgRight,
    '--brasserie-text-left': can.textColorLeft,
    '--brasserie-text-right': can.textColorRight,
    '--brasserie-ui': ui,
  }
}
