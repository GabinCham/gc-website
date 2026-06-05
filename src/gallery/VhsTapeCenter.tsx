import { useEffect, useMemo, useRef, type RefObject } from 'react'
import { useFrame, useLoader } from '@react-three/fiber'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import * as THREE from 'three'
import { getSpiralCenterTransform } from './spiralInfinite'
import { CENTER_MODEL_DEFAULT, CENTER_MODEL_URLS } from './centerModels'
import { setActiveCenterModel, vhsTuningRef } from './vhsTuning'

const DEG2RAD = Math.PI / 180

/** Taille max du modèle (m) — calibrée pour le vide au centre de la spirale */
const TARGET_SIZE = 1.35

type VhsTapeCenterProps = {
  offsetRef: RefObject<number>
  modelUrl?: string
}

function lerp3(
  from: [number, number, number],
  to: [number, number, number],
  t: number,
): [number, number, number] {
  return [
    from[0] + (to[0] - from[0]) * t,
    from[1] + (to[1] - from[1]) * t,
    from[2] + (to[2] - from[2]) * t,
  ]
}

function prepareVhsModel(scene: THREE.Group) {
  const root = scene.clone(true)
  root.traverse((child) => {
    if (!(child as THREE.Mesh).isMesh) return
    const mesh = child as THREE.Mesh
    mesh.castShadow = true
    mesh.receiveShadow = true
  })

  const box = new THREE.Box3().setFromObject(root)
  const size = new THREE.Vector3()
  const center = new THREE.Vector3()
  box.getSize(size)
  box.getCenter(center)
  root.position.sub(center)

  const maxDim = Math.max(size.x, size.y, size.z)
  if (maxDim > 0) {
    root.scale.setScalar(TARGET_SIZE / maxDim)
  }

  return root
}

export function VhsTapeCenter({
  offsetRef,
  modelUrl = CENTER_MODEL_DEFAULT,
}: VhsTapeCenterProps) {
  const { scene } = useLoader(GLTFLoader, modelUrl)
  const groupRef = useRef<THREE.Group>(null)
  const innerRef = useRef<THREE.Group>(null)
  const spiralCurrent = useRef({
    position: [0, 0, 0] as [number, number, number],
    rotation: [0, 0, 0] as [number, number, number],
  })

  const model = useMemo(() => prepareVhsModel(scene), [scene])

  useEffect(() => {
    setActiveCenterModel(modelUrl)
  }, [modelUrl])

  useFrame((_, delta) => {
    const group = groupRef.current
    const inner = innerRef.current
    if (!group || !inner) return

    const tuning = vhsTuningRef.current
    const blend = 1 - Math.exp(-6 * delta)
    const spiral = spiralCurrent.current

    if (tuning.followSpiral) {
      const target = getSpiralCenterTransform(offsetRef.current)
      spiral.position = lerp3(spiral.position, target.position, blend)
      spiral.rotation = lerp3(spiral.rotation, target.rotation, blend)
    } else {
      spiral.position = [0, 0, 0]
      spiral.rotation = [0, 0, 0]
    }

    group.position.set(
      spiral.position[0] + tuning.position[0],
      spiral.position[1] + tuning.position[1],
      spiral.position[2] + tuning.position[2],
    )
    group.rotation.set(
      spiral.rotation[0] + tuning.rotation[0] * DEG2RAD,
      spiral.rotation[1] + tuning.rotation[1] * DEG2RAD,
      spiral.rotation[2] + tuning.rotation[2] * DEG2RAD,
    )
    inner.scale.setScalar(tuning.scale)
  })

  return (
    <group ref={groupRef}>
      <group ref={innerRef}>
        <primitive object={model} />
      </group>
    </group>
  )
}

export function preloadVhsTape() {
  for (const url of CENTER_MODEL_URLS) {
    useLoader.preload(GLTFLoader, url)
  }
}
