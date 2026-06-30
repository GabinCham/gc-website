import { useLayoutEffect, type RefObject } from 'react'
import { useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { canTuningRef, subscribeCanTuning } from './canTuning'

type BrasserieCameraFitProps = {
  target: RefObject<THREE.Object3D | null>
  /** Re-calcul quand le modèle est prêt. */
  object: THREE.Object3D
}

export function BrasserieCameraFit({ target, object }: BrasserieCameraFitProps) {
  const { camera, size } = useThree()

  useLayoutEffect(() => {
    const fitCamera = () => {
      const root = target.current
      if (!root || !(camera instanceof THREE.PerspectiveCamera)) return

      const tuning = canTuningRef.current
      const box = new THREE.Box3().setFromObject(root)
      const sphere = new THREE.Sphere()
      box.getBoundingSphere(sphere)
      if (!Number.isFinite(sphere.radius) || sphere.radius <= 0) return

      const vFov = (camera.fov * Math.PI) / 180
      const aspect = size.width / Math.max(size.height, 1)
      const hFov = 2 * Math.atan(Math.tan(vFov / 2) * aspect)
      const distanceV =
        (sphere.radius * tuning.fitMargin) / Math.sin(vFov / 2)
      const distanceH =
        (sphere.radius * tuning.fitMargin) / Math.sin(hFov / 2)
      const distance = Math.max(distanceV, distanceH)

      camera.position.set(
        sphere.center.x + tuning.cameraOffset[0],
        sphere.center.y + tuning.cameraOffset[1],
        sphere.center.z + distance + tuning.cameraOffset[2],
      )
      camera.near = Math.max(0.01, distance / 200)
      camera.far = distance * 200
      camera.lookAt(sphere.center)
      camera.updateProjectionMatrix()
    }

    fitCamera()
    const unsubscribe = subscribeCanTuning(fitCamera)
    return () => {
      unsubscribe()
    }
  }, [camera, object, size.height, size.width, target])

  return null
}
