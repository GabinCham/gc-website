import { Canvas } from '@react-three/fiber'
import { Suspense, type RefObject } from 'react'
import * as THREE from 'three'
import { BrasserieCan } from './BrasserieCan'

type BrasserieSceneProps = {
  scrollProgressRef: RefObject<number>
}

function BrasserieLights() {
  return (
    <>
      <ambientLight intensity={0.55} />
      <directionalLight position={[4, 6, 5]} intensity={1.35} castShadow />
      <directionalLight position={[-5, 2, -4]} intensity={0.45} color="#ffe8c8" />
      <pointLight position={[0, -2, 3]} intensity={0.35} color="#c9a227" />
    </>
  )
}

export function BrasserieScene({ scrollProgressRef }: BrasserieSceneProps) {
  return (
    <Canvas
      className="brasserie-page__canvas"
      camera={{ position: [0, 0, 5], fov: 30, near: 0.1, far: 100 }}
      gl={{
        antialias: true,
        alpha: true,
        powerPreference: 'high-performance',
      }}
      onCreated={({ gl }) => {
        gl.setClearColor(0x000000, 0)
        gl.toneMapping = THREE.ACESFilmicToneMapping
        gl.toneMappingExposure = 1.05
      }}
      dpr={[1, 1.75]}
    >
      <BrasserieLights />
      <Suspense fallback={null}>
        <BrasserieCan scrollProgressRef={scrollProgressRef} />
      </Suspense>
    </Canvas>
  )
}
