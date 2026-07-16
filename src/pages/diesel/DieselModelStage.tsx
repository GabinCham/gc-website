import { Canvas } from '@react-three/fiber'
import { Suspense, type RefObject } from 'react'
import * as THREE from 'three'
import { DieselEnvironment } from './DieselEnvironment'
import { DieselScrollModel } from './DieselScrollModel'

type DieselModelStageProps = {
  url: string
  scrollProgressRef: RefObject<number>
  bagColorHex: string
  className?: string
}

export function DieselModelStage({
  url,
  scrollProgressRef,
  bagColorHex,
  className,
}: DieselModelStageProps) {
  return (
    <div className={className} aria-hidden>
      <Canvas
        className="diesel-page__canvas"
        camera={{ position: [0, 0, 4], fov: 35, near: 0.1, far: 200 }}
        gl={{
          antialias: true,
          alpha: false,
          powerPreference: 'high-performance',
        }}
        onCreated={({ gl }) => {
          gl.toneMapping = THREE.ACESFilmicToneMapping
          gl.toneMappingExposure = 1.05
        }}
        dpr={[1, 1.75]}
      >
        <ambientLight intensity={0.3} />
        <Suspense fallback={null}>
          <DieselEnvironment />
          <DieselScrollModel
            url={url}
            scrollProgressRef={scrollProgressRef}
            bagColorHex={bagColorHex}
          />
        </Suspense>
      </Canvas>
    </div>
  )
}

DieselModelStage.preloadEnvironment = () => {
  DieselEnvironment.preload()
}
