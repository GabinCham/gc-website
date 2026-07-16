export const DIESEL_GLB_URL = '/glb/diesel-bag/diesel.glb'

export const DIESEL_HDR_URL = new URL(
  '../../../assets/forest_slope_4k.hdr',
  import.meta.url,
).href

/** Hauteur de piste de scroll en viewports (durée ressentie de l’anim). */
export const DIESEL_SCROLL_SECTIONS = 4

/** Progress à partir duquel le sélecteur de couleur apparaît. */
export const DIESEL_COLOR_PICKER_FROM = 0.9

export type DieselBagColor = {
  id: string
  label: string
  /** Couleur affichée sur le swatch (peut être plus sombre que le tint 3D). */
  hex: string
}

export const DIESEL_BAG_COLORS: DieselBagColor[] = [
  { id: 'original', label: 'Cuir naturel', hex: '#ffffff' },
  { id: 'noir', label: 'Noir', hex: '#2a2a2a' },
  { id: 'cognac', label: 'Cognac', hex: '#9a5a2e' },
  { id: 'bordeaux', label: 'Bordeaux', hex: '#7a3038' },
  { id: 'olive', label: 'Olive', hex: '#5c6452' },
  { id: 'sable', label: 'Sable', hex: '#c4a574' },
  { id: 'navy', label: 'Navy', hex: '#3a4660' },
  { id: 'ivoire', label: 'Ivoire', hex: '#e8dfd0' },
]

export const DIESEL_DEFAULT_COLOR_ID = DIESEL_BAG_COLORS[0]!.id

export function getDieselBagColor(id: string): DieselBagColor {
  return (
    DIESEL_BAG_COLORS.find((color) => color.id === id) ?? DIESEL_BAG_COLORS[0]!
  )
}
