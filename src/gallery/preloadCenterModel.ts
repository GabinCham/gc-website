import { useLoader } from '@react-three/fiber'
import { getCenterModelUrl } from './centerModels'
import { GalleryGLTFLoader } from './galleryGltfLoader'
import type { GalleryCategory } from './images'

const preloaded = new Set<string>()

/** Précharge un GLB centre (no-op si déjà en cache r3f). */
export function preloadCenterModel(modelUrl: string) {
  if (preloaded.has(modelUrl)) return
  preloaded.add(modelUrl)
  useLoader.preload(GalleryGLTFLoader, modelUrl)
}

export function preloadCenterModelForCategory(category: GalleryCategory | null) {
  preloadCenterModel(getCenterModelUrl(category))
}
