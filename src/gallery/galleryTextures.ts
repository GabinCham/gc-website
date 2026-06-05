import { useLoader } from '@react-three/fiber'
import * as THREE from 'three'

class GalleryVideoTextureLoader extends THREE.Loader {
  load(
    url: string,
    onLoad: (texture: THREE.VideoTexture) => void,
    _onProgress?: (event: ProgressEvent<EventTarget>) => void,
    onError?: (error: unknown) => void,
  ) {
    const video = document.createElement('video')
    video.crossOrigin = 'anonymous'
    video.loop = true
    video.muted = true
    video.playsInline = true
    video.setAttribute('playsinline', '')

    const finish = () => {
      const texture = new THREE.VideoTexture(video)
      texture.colorSpace = THREE.SRGBColorSpace
      onLoad(texture)
      video.play().catch(() => {})
    }

    video.addEventListener('loadeddata', finish, { once: true })
    video.addEventListener(
      'error',
      () => onError?.(new Error(`Impossible de charger la vidéo: ${url}`)),
      { once: true },
    )
    video.src = url
    video.load()
  }
}

export function useGalleryImageTexture(url: string) {
  return useLoader(THREE.TextureLoader, url)
}

export function useGalleryVideoTexture(url: string): THREE.VideoTexture {
  return useLoader(GalleryVideoTextureLoader, url) as THREE.VideoTexture
}

useGalleryVideoTexture.preload = (url: string) => {
  useLoader.preload(GalleryVideoTextureLoader, url)
}
