import * as THREE from 'three'
import type { CanTuning } from './canTuning'

export function fitBrasserieCamera(
  camera: THREE.Camera,
  fitTarget: THREE.Object3D,
  width: number,
  height: number,
  tuning: CanTuning,
) {
  if (!(camera instanceof THREE.PerspectiveCamera)) return

  fitTarget.updateMatrixWorld(true)
  const box = new THREE.Box3().setFromObject(fitTarget)
  const sphere = new THREE.Sphere()
  box.getBoundingSphere(sphere)
  if (!Number.isFinite(sphere.radius) || sphere.radius <= 0) return

  const vFov = (camera.fov * Math.PI) / 180
  const aspect = width / Math.max(height, 1)
  const hFov = 2 * Math.atan(Math.tan(vFov / 2) * aspect)
  const distanceV = (sphere.radius * tuning.fitMargin) / Math.sin(vFov / 2)
  const distanceH = (sphere.radius * tuning.fitMargin) / Math.sin(hFov / 2)
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
