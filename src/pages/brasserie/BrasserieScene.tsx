import { Canvas } from '@react-three/fiber'
import { Suspense, type RefObject } from 'react'
import * as THREE from 'three'
import { BrasserieCan } from './BrasserieCan'
import { BrasserieEnvironment } from './BrasserieEnvironment'

type BrasserieSceneProps = {
  scrollProgressRef: RefObject<number>
  gravityMode: boolean
  onGravityModeChange?: (active: boolean) => void
}

export function BrasserieScene({
  scrollProgressRef,
  gravityMode,
  onGravityModeChange,
}: BrasserieSceneProps) {
  return (
    <Canvas
      className={[
        'brasserie-page__canvas',
        gravityMode ? 'brasserie-page__canvas--interactive' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      camera={{ position: [0, 0, 5], fov: 36, near: 0.1, far: 100 }}
      gl={{
        antialias: true,
        alpha: true,
        powerPreference: 'high-performance',
      }}
      onCreated={({ gl }) => {
        gl.setClearColor(0x000000, 0)
        gl.toneMapping = THREE.ACESFilmicToneMapping
        gl.toneMappingExposure = 1.1
      }}
      dpr={[1, 1.75]}
    >
      <Suspense fallback={null}>
        <BrasserieEnvironment />
        <BrasserieCan
          scrollProgressRef={scrollProgressRef}
          onGravityModeChange={onGravityModeChange}
        />
      </Suspense>
    </Canvas>
  )
}
