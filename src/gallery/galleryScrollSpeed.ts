/** Vitesse de la spirale au repos (auto-scroll). */
export const AUTO_SCROLL_SPEED = .005

let velocity = AUTO_SCROLL_SPEED
const listeners = new Set<() => void>()

export function publishGalleryScrollVelocity(next: number) {
  velocity = next
  listeners.forEach((listener) => listener())
}

export function getGalleryScrollVelocity() {
  return velocity
}

export function subscribeGalleryScrollVelocity(listener: () => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

/** Vitesse en régime auto-scroll stable (après ~USER_IDLE_MS sans interaction). */
export function isAutoCruiseVelocity(v: number): boolean {
  const speed = Math.abs(v)
  if (speed < AUTO_SCROLL_SPEED * 0.5) return false
  return (
    Math.abs(speed - AUTO_SCROLL_SPEED) / AUTO_SCROLL_SPEED <= 0.12
  )
}

/** Vitesse relative à l’auto-scroll (1 = repos, >1 = scroll manuel). */
export function galleryVelocityToPlaybackRate(v: number): number {
  if (isAutoCruiseVelocity(v)) return 1

  const speed = Math.abs(v)
  const ratio = speed / AUTO_SCROLL_SPEED
  const curved = Math.pow(ratio, 0.55)
  return Math.min(2, Math.max(0.65, curved))
}
