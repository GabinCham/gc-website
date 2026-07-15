/** Registre global pour demander une frame Three.js (frameloop="demand"). */
let galleryInvalidate: (() => void) | null = null

export function registerGalleryInvalidate(fn: (() => void) | null) {
  galleryInvalidate = fn
}

export function requestGalleryFrame() {
  galleryInvalidate?.()
}
