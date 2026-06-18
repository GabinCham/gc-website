import { useFrame, useLoader } from '@react-three/fiber'
import { useMemo, useRef, type RefObject } from 'react'
import * as THREE from 'three'
import { GalleryGLTFLoader } from '../../gallery/galleryGltfLoader'
import { QDN10_SCROLL_SECTIONS } from './content'
import { Qdn10ModelCameraFit } from './Qdn10ModelCameraFit'

type Qdn10ScrollModelProps = {
  url: string
  scrollProgressRef: RefObject<number>
  targetSize?: number
}

function prepareModel(scene: THREE.Group, targetSize: number) {
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

  const wrapper = new THREE.Group()
  const maxDim = Math.max(size.x, size.y, size.z)
  if (maxDim > 0) {
    wrapper.scale.setScalar(targetSize / maxDim)
  }
  wrapper.add(root)

  return wrapper
}

export function Qdn10ScrollModel({
  url,
  scrollProgressRef,
  targetSize = 2,
}: Qdn10ScrollModelProps) {
  const { scene } = useLoader(GalleryGLTFLoader, url)
  const model = useMemo(
    () => prepareModel(scene, targetSize),
    [scene, targetSize],
  )
  const fitTargetRef = useRef<THREE.Group>(null)
  const scrollGroupRef = useRef<THREE.Group>(null)

  useFrame(() => {
    const scrollGroup = scrollGroupRef.current
    if (!scrollGroup) return

    const progress = scrollProgressRef.current ?? 0
    scrollGroup.rotation.y =
      progress * QDN10_SCROLL_SECTIONS * Math.PI * 2
  })

  return (
    <group ref={fitTargetRef}>
      <group ref={scrollGroupRef}>
        <primitive object={model} />
      </group>
      <Qdn10ModelCameraFit target={fitTargetRef} object={model} />
    </group>
  )
}

Qdn10ScrollModel.preload = (url: string) => {
  useLoader.preload(GalleryGLTFLoader, url)
}
