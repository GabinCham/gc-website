import { useEffect, useRef } from 'react'

type GalleryAssetsReadyProps = {
  /** Premier chargement (une seule fois). */
  onReady?: () => void
  /** Chaque résolution Suspense (changement de filtre, etc.). */
  onSettled?: () => void
}

function afterPaint(callback: () => void) {
  requestAnimationFrame(() => {
    requestAnimationFrame(callback)
  })
}

/**
 * À placer dans un boundary Suspense : ne monte qu’une fois les assets
 * chargés (textures / GLB). Attend un frame peint avant les callbacks.
 */
export function GalleryAssetsReady({ onReady, onSettled }: GalleryAssetsReadyProps) {
  const initialDone = useRef(false)

  useEffect(() => {
    afterPaint(() => {
      onSettled?.()
      if (initialDone.current || !onReady) return
      initialDone.current = true
      onReady()
    })
  }, [onReady, onSettled])

  return null
}
