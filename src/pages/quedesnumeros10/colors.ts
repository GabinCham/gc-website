const COULEUR_HEX: Record<string, string> = {
  Vert: '#00c853',
  Blanc: '#ffffff',
  Jaune: '#ffe600',
  Rouge: '#ff1e1e',
  Bleu: '#0057ff',
  'Bleu marine': '#0033cc',
  'Bleu ciel': '#4db8ff',
  Bordeaux: '#c4002b',
  Noir: '#0a0a0a',
  Or: '#ffc400',
  Orange: '#ff6a00',
  Marron: '#8b4513',
  Gris: '#9aa0a6',
  Rose: '#ff2d95',
  Violet: '#7a00ff',
}

/** Couches colorées du mark 26.svg (hors none / clip). */
export const QDN10_MARK_LAYERS = [
  'cls-2',
  'cls-3',
  'cls-4',
  'cls-5',
  'cls-6',
  'cls-7',
  'cls-8',
  'cls-9',
  'cls-10',
  'cls-11',
  'cls-12',
  'cls-13',
  'cls-15',
] as const

export type Qdn10MarkLayer = (typeof QDN10_MARK_LAYERS)[number]

/** Couleurs d’origine dans le SVG — utilisées pour préserver luminosité / contraste. */
export const QDN10_MARK_SOURCE_COLORS: Record<Qdn10MarkLayer, string> = {
  'cls-2': '#ff5500',
  'cls-3': '#e7ff00',
  'cls-4': '#ff00ff',
  'cls-5': '#0000ff',
  'cls-6': '#1f00ff',
  'cls-7': '#f900dc',
  'cls-8': '#494201',
  'cls-9': '#00f752',
  'cls-10': '#00fff2',
  'cls-11': '#ff0000',
  'cls-12': '#540000',
  'cls-13': '#00ff48',
  'cls-15': '#ff00cf',
}

export function resolveCouleur(nom: string): string {
  const trimmed = nom.trim()
  return COULEUR_HEX[trimmed] ?? '#888888'
}

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value))
}

function parseHex(hex: string): [number, number, number] {
  const normalized = hex.replace('#', '').trim()
  const full =
    normalized.length === 3
      ? normalized
          .split('')
          .map((ch) => `${ch}${ch}`)
          .join('')
      : normalized.padStart(6, '0').slice(0, 6)

  return [
    Number.parseInt(full.slice(0, 2), 16),
    Number.parseInt(full.slice(2, 4), 16),
    Number.parseInt(full.slice(4, 6), 16),
  ]
}

function toHex(r: number, g: number, b: number): string {
  const channel = (value: number) =>
    Math.round(clamp01(value / 255) * 255)
      .toString(16)
      .padStart(2, '0')
  return `#${channel(r)}${channel(g)}${channel(b)}`
}

function rgbToHsl(
  r: number,
  g: number,
  b: number,
): [number, number, number] {
  const rn = r / 255
  const gn = g / 255
  const bn = b / 255
  const max = Math.max(rn, gn, bn)
  const min = Math.min(rn, gn, bn)
  const l = (max + min) / 2
  if (max === min) return [0, 0, l]

  const d = max - min
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
  let h = 0
  if (max === rn) h = ((gn - bn) / d + (gn < bn ? 6 : 0)) / 6
  else if (max === gn) h = ((bn - rn) / d + 2) / 6
  else h = ((rn - gn) / d + 4) / 6
  return [h, s, l]
}

function hue2rgb(p: number, q: number, t: number): number {
  let tt = t
  if (tt < 0) tt += 1
  if (tt > 1) tt -= 1
  if (tt < 1 / 6) return p + (q - p) * 6 * tt
  if (tt < 1 / 2) return q
  if (tt < 2 / 3) return p + (q - p) * (2 / 3 - tt) * 6
  return p
}

function hslToRgb(
  h: number,
  s: number,
  l: number,
): [number, number, number] {
  if (s === 0) {
    const v = l * 255
    return [v, v, v]
  }
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s
  const p = 2 * l - q
  return [
    hue2rgb(p, q, h + 1 / 3) * 255,
    hue2rgb(p, q, h) * 255,
    hue2rgb(p, q, h - 1 / 3) * 255,
  ]
}

function hexToHsl(hex: string): [number, number, number] {
  const [r, g, b] = parseHex(hex)
  return rgbToHsl(r, g, b)
}

function hslToHex(h: number, s: number, l: number): string {
  const [r, g, b] = hslToRgb(h, clamp01(s), clamp01(l))
  return toHex(r, g, b)
}

function hexToLuminance(hex: string): number {
  const [r8, g8, b8] = parseHex(hex)
  const r = r8 / 255
  const g = g8 / 255
  const b = b8 / 255

  const linear = (channel: number) =>
    channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4

  return 0.2126 * linear(r) + 0.7152 * linear(g) + 0.0722 * linear(b)
}

function isNearNeutral(hex: string): boolean {
  const [, s] = hexToHsl(hex)
  return s < 0.12
}

/** Pousse une couleur vers un rendu néon / maillot. */
function vividify(hex: string): string {
  if (isNearNeutral(hex)) return hex
  const [h, s, l] = hexToHsl(hex)
  return hslToHex(h, Math.max(s, 0.92), clamp01(0.28 + l * 0.45))
}

export function getContrastTextColor(left: string, right: string): string {
  const avg = (hexToLuminance(left) + hexToLuminance(right)) / 2
  return avg > 0.55 ? '#0a1628' : '#f8f8f8'
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t
}

function lerpHue(a: number, b: number, t: number): number {
  let delta = ((b - a + 1.5) % 1) - 0.5
  return (a + delta * t + 1) % 1
}

/**
 * Palette flashy : on garde une saturation haute et on joue
 * surtout sur la luminosité + un léger shift de teinte.
 */
function buildTeamPalette(left: string, right: string, count: number): string[] {
  const a = vividify(left)
  const b = vividify(right)
  const [hA, sA] = hexToHsl(a)
  const [hB, sB] = hexToHsl(b)

  const chromatic = !isNearNeutral(a)
    ? a
    : !isNearNeutral(b)
      ? b
      : '#ff1e1e'
  const [hChroma, , ] = hexToHsl(chromatic)

  const stops: string[] = []
  for (let i = 0; i < count; i += 1) {
    const t = count === 1 ? 0.5 : i / (count - 1)
    // Relief type tunnel : sombre → flash → sombre/clair
    const pulse = Math.sin(t * Math.PI)
    const lightness = clamp01(0.16 + t * 0.62 + pulse * 0.12)

    let h: number
    let s: number
    if (isNearNeutral(a) && isNearNeutral(b)) {
      h = hChroma
      s = 0.95
    } else if (isNearNeutral(a)) {
      h = hB
      s = Math.max(sB, 0.9)
    } else if (isNearNeutral(b)) {
      h = hA
      s = Math.max(sA, 0.9)
    } else {
      h = lerpHue(hA, hB, t)
      s = Math.max(0.88, lerp(sA, sB, t))
    }

    // Petites variations pour éviter un dégradé trop linéaire
    const hueJitter = ((i % 5) - 2) * 0.012
    const satBoost = i % 2 === 0 ? 0.04 : 0
    stops.push(hslToHex((h + hueJitter + 1) % 1, Math.min(1, s + satBoost), lightness))
  }

  // Force les extrêmes à coller aux couleurs d’équipe (vivid)
  if (count >= 2) {
    const dark = hslToHex(
      isNearNeutral(a) ? hChroma : hA,
      isNearNeutral(a) ? 0.95 : Math.max(sA, 0.9),
      Math.min(hexToHsl(a)[2], 0.22),
    )
    const bright = isNearNeutral(b)
      ? hslToHex(hChroma, 0.95, 0.78)
      : hslToHex(hB, Math.max(sB, 0.9), Math.max(hexToHsl(b)[2], 0.55))
    stops[0] = dark
    stops[count - 1] = bright
  }

  return stops.sort((x, y) => hexToLuminance(x) - hexToLuminance(y))
}

/**
 * Remap chaque couche du SVG vers une couleur d’équipe,
 * en préservant l’ordre de luminosité d’origine.
 */
export function buildMarkColorsForTeam(
  left: string,
  right: string,
): Record<Qdn10MarkLayer, string> {
  const ranked = [...QDN10_MARK_LAYERS].sort(
    (a, b) =>
      hexToLuminance(QDN10_MARK_SOURCE_COLORS[a]) -
      hexToLuminance(QDN10_MARK_SOURCE_COLORS[b]),
  )
  const palette = buildTeamPalette(left, right, ranked.length)

  return Object.fromEntries(
    ranked.map((cls, index) => [cls, palette[index]!]),
  ) as Record<Qdn10MarkLayer, string>
}

export function getMarkThemeStyle(
  left: string,
  right: string,
): Record<string, string> {
  const colors = buildMarkColorsForTeam(left, right)
  return Object.fromEntries(
    QDN10_MARK_LAYERS.map((cls) => [`--qdn10-mark-${cls}`, colors[cls]]),
  )
}
