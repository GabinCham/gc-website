import type { GalleryCategory } from './images'

export const CENTER_MODEL_DEFAULT = '/glb/K7.glb'

const CENTER_MODEL_BY_CATEGORY: Partial<Record<GalleryCategory, string>> = {
  coding: '/glb/90s_computer.glb',
  films: '/glb/handycam.glb',
}

export function getCenterModelUrl(category: GalleryCategory | null): string {
  if (!category) return CENTER_MODEL_DEFAULT
  return CENTER_MODEL_BY_CATEGORY[category] ?? CENTER_MODEL_DEFAULT
}

export const CENTER_MODEL_URLS = [
  CENTER_MODEL_DEFAULT,
  ...Object.values(CENTER_MODEL_BY_CATEGORY),
] as const
