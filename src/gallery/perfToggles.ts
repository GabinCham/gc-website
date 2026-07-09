import type { GalleryItem } from './images'
import { getGalleryPosterUrl } from './images'

/**
 * Tests perf mobile — baseline tout désactivé.
 * Réactiver UN seul flag à la fois pour mesurer l'impact.
 *
 * Ordre suggéré pour remettre :
 * 1. galleryFrameloop → 'always'  (sinon le carousel ne bouge pas)
 * 2. mobileBufferFraction → 0.35
 * 3. vhsCenter → true
 * 4. meshGradient → true
 * 5. galleryVideos → true
 */
export const PERF_TOGGLES = {
  /** Fond MeshGradient animé (2e contexte WebGL) */
  meshGradient: false,
  /** Modèle VHS au centre de la spirale */
  vhsCenter: false,
  /** Fraction du buffer mobile — 0.35 = prod, 0.15 = léger */
  mobileBufferFraction: 0.15,
  /** Boucle de rendu Three.js — 'never' fige tout le canvas */
  galleryFrameloop: 'always' as 'always' | 'never',
  /** Lectures vidéo sur les cartes — false = posters uniquement */
  galleryVideos: false,
} as const

/** Valeur prod du buffer mobile (pour référence). */
export const PERF_MOBILE_BUFFER_DEFAULT = 0.35

export function applyPerfToGalleryItem(item: GalleryItem): GalleryItem {
  if (PERF_TOGGLES.galleryVideos) return item

  const poster = getGalleryPosterUrl(item)
  if (!poster) return item

  return { ...item, url: poster, mediaType: 'image' }
}
