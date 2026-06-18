const COULEUR_HEX: Record<string, string> = {
  Vert: '#006847',
  Blanc: '#f4f4f4',
  Jaune: '#f5c518',
  Rouge: '#d42e12',
  Bleu: '#0047ab',
  Noir: '#111111',
  Or: '#c9a227',
  Orange: '#f58220',
  Marron: '#5c3d2e',
  Gris: '#8a8d8f',
  Rose: '#ff4f81',
  Violet: '#4b0082',
}

export function resolveCouleur(nom: string): string {
  const trimmed = nom.trim()
  return COULEUR_HEX[trimmed] ?? '#888888'
}

function hexToLuminance(hex: string): number {
  const normalized = hex.replace('#', '')
  const r = Number.parseInt(normalized.slice(0, 2), 16) / 255
  const g = Number.parseInt(normalized.slice(2, 4), 16) / 255
  const b = Number.parseInt(normalized.slice(4, 6), 16) / 255

  const linear = (channel: number) =>
    channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4

  return 0.2126 * linear(r) + 0.7152 * linear(g) + 0.0722 * linear(b)
}

export function getContrastTextColor(left: string, right: string): string {
  const avg = (hexToLuminance(left) + hexToLuminance(right)) / 2
  return avg > 0.55 ? '#0a1628' : '#f8f8f8'
}
