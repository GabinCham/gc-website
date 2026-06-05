import { Canvas, useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import * as THREE from 'three'
import { CurvedWheelGallery } from './CurvedWheelGallery'
import { type GalleryCategory, type GalleryItem } from './images'
import type { LayoutMode } from './layouts'

type GallerySceneProps = {
  mode: LayoutMode
  category: GalleryCategory | null
  autoScrollEnabled?: boolean
  onActiveItemChange?: (item: GalleryItem) => void
  onBackgroundItemChange?: (item: GalleryItem) => void
  onItemSelect?: (item: GalleryItem) => void
  onCardHoverChange?: (hovered: boolean) => void
  onReady?: () => void
}

function GalleryReadyNotifier({ onReady }: { onReady?: () => void }) {
  const done = useRef(false)

  useFrame(() => {
    if (done.current || !onReady) return
    done.current = true
    onReady()
  })

  return null
}

export function GalleryScene({
  mode,
  category,
  autoScrollEnabled,
  onActiveItemChange,
  onBackgroundItemChange,
  onItemSelect,
  onCardHoverChange,
  onReady,
}: GallerySceneProps) {
  return (
    <Canvas
      className="gallery-canvas"
      camera={{ position: [0, 0.5, 11.5], fov: 42, near: 0.1, far: 100 }}
      gl={{ antialias: true, alpha: true }}
      style={{ background: 'transparent' }}
      dpr={[1, 2]}
      onCreated={({ gl }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping
        gl.toneMappingExposure = 1.65
      }}
    >
      <GalleryReadyNotifier onReady={onReady} />
      <CurvedWheelGallery
        mode={mode}
        category={category}
        autoScrollEnabled={autoScrollEnabled}
        onActiveItemChange={onActiveItemChange}
        onBackgroundItemChange={onBackgroundItemChange}
        onItemSelect={onItemSelect}
        onCardHoverChange={onCardHoverChange}
      />
    </Canvas>
  )
}
