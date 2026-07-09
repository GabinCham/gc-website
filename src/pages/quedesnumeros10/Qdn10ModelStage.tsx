import { Canvas } from '@react-three/fiber'
import { Suspense, type RefObject } from 'react'
import * as THREE from 'three'
import { Qdn10Environment } from './Qdn10Environment'
import { Qdn10ScrollModel } from './Qdn10ScrollModel'

type Qdn10ModelStageProps = {
  url: string
  scrollProgressRef: RefObject<number>
  className?: string
  targetSize?: number
  withEnvironment?: boolean
}

function Qdn10Lights({ withEnvironment }: { withEnvironment: boolean }) {
  if (withEnvironment) {
    return <ambientLight intensity={0.35} />
  }

  return (
    <>
      <ambientLight intensity={0.65} />
      <directionalLight position={[3, 5, 4]} intensity={1.2} />
      <directionalLight position={[-4, 2, -3]} intensity={0.4} color="#fff4d6" />
    </>
  )
}

export function Qdn10ModelStage({
  url,
  scrollProgressRef,
  className,
  targetSize,
  withEnvironment = false,
}: Qdn10ModelStageProps) {
  return (
    <div className={className} aria-hidden>
      <Canvas
        className="qdn10-page__canvas"
        camera={{ position: [0, 0, 4], fov: 38, near: 0.1, far: 100 }}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: 'high-performance',
        }}
        onCreated={({ gl }) => {
          gl.setClearColor(0x000000, 0)
          gl.toneMapping = THREE.ACESFilmicToneMapping
          gl.toneMappingExposure = withEnvironment ? 1.1 : 1.05
        }}
        dpr={[1, 1.75]}
      >
        <Qdn10Lights withEnvironment={withEnvironment} />
        <Suspense fallback={null}>
          {withEnvironment ? <Qdn10Environment /> : null}
          <Qdn10ScrollModel
            url={url}
            scrollProgressRef={scrollProgressRef}
            targetSize={targetSize}
          />
        </Suspense>
      </Canvas>
    </div>
  )
}

Qdn10ModelStage.preloadEnvironment = () => {
  Qdn10Environment.preload()
}
