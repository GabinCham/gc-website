import { useLayoutEffect, type RefObject } from 'react'
import { useThree } from '@react-three/fiber'
import * as THREE from 'three'

type Qdn10ModelCameraFitProps = {
  target: RefObject<THREE.Object3D | null>
  object: THREE.Object3D
}

export function Qdn10ModelCameraFit({
  target,
  object,
}: Qdn10ModelCameraFitProps) {
  const { camera, size } = useThree()

  useLayoutEffect(() => {
    const root = target.current
    if (!root || !(camera instanceof THREE.PerspectiveCamera)) return

    const box = new THREE.Box3().setFromObject(root)
    const sphere = new THREE.Sphere()
    box.getBoundingSphere(sphere)
    if (!Number.isFinite(sphere.radius) || sphere.radius <= 0) return

    const margin = 1.45
    const vFov = (camera.fov * Math.PI) / 180
    const aspect = size.width / Math.max(size.height, 1)
    const hFov = 2 * Math.atan(Math.tan(vFov / 2) * aspect)
    const distanceV = (sphere.radius * margin) / Math.sin(vFov / 2)
    const distanceH = (sphere.radius * margin) / Math.sin(hFov / 2)
    const distance = Math.max(distanceV, distanceH)

    camera.position.set(
      sphere.center.x,
      sphere.center.y,
      sphere.center.z + distance,
    )
    camera.near = Math.max(0.01, distance / 200)
    camera.far = distance * 200
    camera.lookAt(sphere.center)
    camera.updateProjectionMatrix()
  }, [camera, object, size.height, size.width, target])

  return null
}
