import { Canvas, useThree } from '@react-three/fiber'
import { useEffect } from 'react'
import * as THREE from 'three'
import { CurvedWheelGallery } from './CurvedWheelGallery'
import { registerGalleryInvalidate } from './galleryFrameLoop'
import { preloadCenterModelForCategory } from './preloadCenterModel'
import { type GalleryCategory, type GalleryItem } from './images'
import type { LayoutMode } from './layouts'
import type { ProjectTransitionCompleteMeta } from './projectTransition'
import { useIsMobileGallery } from './mobilePerf'
import { PERF_TOGGLES } from './perfToggles'

function GalleryInvalidateRegistry() {
  const invalidate = useThree((state) => state.invalidate)

  useEffect(() => {
    registerGalleryInvalidate(invalidate)
    invalidate()
    return () => registerGalleryInvalidate(null)
  }, [invalidate])

  return null
}

function resolveGalleryFrameloop(
  paused: boolean,
  autoScrollEnabled: boolean,
): 'always' | 'demand' | 'never' {
  if (paused || PERF_TOGGLES.galleryFrameloop === 'never') return 'never'
  if (autoScrollEnabled || PERF_TOGGLES.galleryFrameloop === 'always') {
    return 'always'
  }
  return 'demand'
}

type GallerySceneProps = {
  mode: LayoutMode
  category: GalleryCategory | null
  autoScrollEnabled?: boolean
  paused?: boolean
  onActiveItemChange?: (item: GalleryItem) => void
  onBackgroundItemChange?: (item: GalleryItem) => void
  onItemSelect?: (item: GalleryItem) => void
  onCardHoverChange?: (hovered: boolean) => void
  projectTransitionItem?: GalleryItem | null
  onProjectTransitionComplete?: (meta: ProjectTransitionCompleteMeta) => void
  lockedHeroItem?: GalleryItem | null
  galleryRestoreKey?: number
  onReady?: () => void
  onSettled?: () => void
}

export function GalleryScene({
  mode,
  category,
  autoScrollEnabled = true,
  paused = false,
  onActiveItemChange,
  onBackgroundItemChange,
  onItemSelect,
  onCardHoverChange,
  projectTransitionItem,
  onProjectTransitionComplete,
  lockedHeroItem,
  galleryRestoreKey = 0,
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
      dpr={isMobile ? 1 : [1, 1.5]}
      frameloop={resolveGalleryFrameloop(paused, autoScrollEnabled)}
      onCreated={({ gl }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping
        gl.toneMappingExposure = isMobile ? 1.5 : 1.65
      }}
    >
      <GalleryInvalidateRegistry />
      <CurvedWheelGallery
        mode={mode}
        category={category}
        autoScrollEnabled={autoScrollEnabled}
        onActiveItemChange={onActiveItemChange}
        onBackgroundItemChange={onBackgroundItemChange}
        onItemSelect={onItemSelect}
        onCardHoverChange={onCardHoverChange}
        projectTransitionItem={projectTransitionItem}
        onProjectTransitionComplete={onProjectTransitionComplete}
        lockedHeroItem={lockedHeroItem}
        galleryRestoreKey={galleryRestoreKey}
        onReady={onReady}
        onSettled={onSettled}
      />
    </Canvas>
  )
}
