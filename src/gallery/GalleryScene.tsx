import { Canvas } from '@react-three/fiber'
import { useEffect } from 'react'
import * as THREE from 'three'
import { CurvedWheelGallery } from './CurvedWheelGallery'
import { preloadCenterModelForCategory } from './preloadCenterModel'
import { type GalleryCategory, type GalleryItem } from './images'
import type { LayoutMode } from './layouts'
import { useIsMobileGallery } from './mobilePerf'

type GallerySceneProps = {
  mode: LayoutMode
  category: GalleryCategory | null
  autoScrollEnabled?: boolean
  onActiveItemChange?: (item: GalleryItem) => void
  onBackgroundItemChange?: (item: GalleryItem) => void
  onItemSelect?: (item: GalleryItem) => void
  onCardHoverChange?: (hovered: boolean) => void
  onReady?: () => void
  onSettled?: () => void
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
  onSettled,
}: GallerySceneProps) {
  const isMobile = useIsMobileGallery()

  useEffect(() => {
    if (mode !== 'all') return
    preloadCenterModelForCategory(category)
  }, [mode, category])

  return (
    <Canvas
      className="gallery-canvas"
      camera={{ position: [0, 0.5, 11.5], fov: 42, near: 0.1, far: 100 }}
      gl={{
        antialias: !isMobile,
        alpha: true,
        powerPreference: 'high-performance',
      }}
      style={{ background: 'transparent' }}
      dpr={isMobile ? 1 : [1, 2]}
      frameloop="always"
      onCreated={({ gl }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping
        gl.toneMappingExposure = isMobile ? 1.5 : 1.65
      }}
    >
      <CurvedWheelGallery
        mode={mode}
        category={category}
        autoScrollEnabled={autoScrollEnabled}
        onActiveItemChange={onActiveItemChange}
        onBackgroundItemChange={onBackgroundItemChange}
        onItemSelect={onItemSelect}
        onCardHoverChange={onCardHoverChange}
        onReady={onReady}
        onSettled={onSettled}
      />
    </Canvas>
  )
}
