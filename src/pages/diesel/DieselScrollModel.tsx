import { useFrame, useLoader, useThree } from '@react-three/fiber'
import { useLayoutEffect, useMemo, useRef, type RefObject } from 'react'
import * as THREE from 'three'
import { GalleryGLTFLoader } from '../../gallery/galleryGltfLoader'

type DieselScrollModelProps = {
  url: string
  scrollProgressRef: RefObject<number>
  bagColorHex: string
}

const _targetColor = new THREE.Color()
const _hsl = { h: 0, s: 0, l: 0 }

type R3FCamera = THREE.PerspectiveCamera & { manual?: boolean }

/** Multiply trop sombre = albedo à zéro → plus de lumière visible. */
function setBagTintFromHex(target: THREE.Color, hex: string) {
  target.set(hex)
  target.getHSL(_hsl)
  _hsl.l = Math.max(_hsl.l, 0.44)
  _hsl.s = Math.min(_hsl.s, 0.58)
  target.setHSL(_hsl.h, _hsl.s, _hsl.l)
}

function collectBagMaterials(root: THREE.Object3D): THREE.MeshStandardMaterial[] {
  const materials: THREE.MeshStandardMaterial[] = []
  root.traverse((child) => {
    if (!(child as THREE.Mesh).isMesh) return
    const mesh = child as THREE.Mesh
    const list = Array.isArray(mesh.material) ? mesh.material : [mesh.material]
    for (const material of list) {
      if (
        material instanceof THREE.MeshStandardMaterial ||
        material instanceof THREE.MeshPhysicalMaterial
      ) {
        materials.push(material)
      }
    }
  })
  return materials
}

function findPerspectiveCamera(root: THREE.Object3D): R3FCamera | null {
  let found: R3FCamera | null = null
  root.traverse((obj) => {
    if (found) return
    if (obj instanceof THREE.PerspectiveCamera) {
      found = obj as R3FCamera
    }
  })
  return found
}

type AnimDriver = {
  mixer: THREE.AnimationMixer
  actions: THREE.AnimationAction[]
  duration: number
}

/** Tous les clips du GLB (CameraAction + Sketchfab_modelAction), scrub fidèle. */
function createAnimDriver(
  root: THREE.Object3D,
  clips: THREE.AnimationClip[],
): AnimDriver | null {
  if (clips.length === 0) return null

  const mixer = new THREE.AnimationMixer(root)
  const actions: THREE.AnimationAction[] = []
  let duration = 0

  for (const clip of clips) {
    duration = Math.max(duration, clip.duration)
    const action = mixer.clipAction(clip)
    action.enabled = true
    action.setEffectiveWeight(1)
    action.setEffectiveTimeScale(1)
    action.clampWhenFinished = true
    action.play()
    action.paused = true
    actions.push(action)
  }

  if (duration <= 0 || actions.length === 0) {
    mixer.stopAllAction()
    return null
  }

  return { mixer, actions, duration }
}

function scrubAnim(driver: AnimDriver, progress: number) {
  const t = THREE.MathUtils.clamp(progress, 0, 1) * driver.duration
  for (const action of driver.actions) {
    const clipDuration = action.getClip().duration
    action.time = clipDuration > 0 ? Math.min(t, clipDuration) : 0
  }
  driver.mixer.update(0)
}

export function DieselScrollModel({
  url,
  scrollProgressRef,
  bagColorHex,
}: DieselScrollModelProps) {
  const { scene, animations } = useLoader(GalleryGLTFLoader, url)
  const { gl, invalidate, set, size } = useThree()
  const driverRef = useRef<AnimDriver | null>(null)
  const materialsRef = useRef<THREE.MeshStandardMaterial[]>([])
  const bagColorHexRef = useRef(bagColorHex)
  const blenderCameraRef = useRef<R3FCamera | null>(null)

  bagColorHexRef.current = bagColorHex

  // Scène GLB telle quelle (caméra + modèle) — pas de clone qui casse le lien caméra.
  const clips = useMemo(() => animations.slice(), [animations])

  const blenderCamera = useMemo(() => findPerspectiveCamera(scene), [scene])

  useLayoutEffect(() => {
    scene.traverse((child) => {
      if (!(child as THREE.Mesh).isMesh) return
      const mesh = child as THREE.Mesh
      mesh.castShadow = true
      mesh.receiveShadow = true
      if (Array.isArray(mesh.material)) {
        mesh.material = mesh.material.map((mat) => mat.clone())
      } else if (mesh.material) {
        mesh.material = mesh.material.clone()
      }
    })
    materialsRef.current = collectBagMaterials(scene)
    for (const material of materialsRef.current) {
      material.color.set('#ffffff')
    }
  }, [scene])

  // Active la caméra Blender exportée (fov / near / far du GLB).
  useLayoutEffect(() => {
    if (!blenderCamera) return

    blenderCamera.manual = true
    blenderCamera.aspect = size.width / Math.max(size.height, 1)
    blenderCamera.updateProjectionMatrix()
    blenderCameraRef.current = blenderCamera
    set({ camera: blenderCamera })
    invalidate()
  }, [blenderCamera, invalidate, set, size.height, size.width])

  useLayoutEffect(() => {
    const previous = driverRef.current
    if (previous) {
      previous.mixer.stopAllAction()
      previous.mixer.uncacheRoot(scene)
    }

    const driver = createAnimDriver(scene, clips)
    driverRef.current = driver
    if (driver) {
      scrubAnim(driver, scrollProgressRef.current ?? 0)
      scene.updateMatrixWorld(true)
    }

    return () => {
      if (driver) {
        driver.mixer.stopAllAction()
        driver.mixer.uncacheRoot(scene)
      }
      if (driverRef.current === driver) driverRef.current = null
    }
  }, [scene, clips, scrollProgressRef])

  // Aspect canvas uniquement (pas de repositionnement).
  useLayoutEffect(() => {
    const cam = blenderCameraRef.current
    if (!cam) return

    const syncAspect = () => {
      const width = gl.domElement.clientWidth
      const height = gl.domElement.clientHeight
      if (width < 2 || height < 2) return
      cam.aspect = width / height
      cam.updateProjectionMatrix()
      invalidate()
    }

    syncAspect()
    const observer = new ResizeObserver(syncAspect)
    observer.observe(gl.domElement)
    return () => observer.disconnect()
  }, [gl, invalidate, blenderCamera])

  useFrame((_, delta) => {
    const driver = driverRef.current
    if (driver) {
      const progress = THREE.MathUtils.clamp(scrollProgressRef.current ?? 0, 0, 1)
      scrubAnim(driver, progress)
      scene.updateMatrixWorld(true)
    }

    setBagTintFromHex(_targetColor, bagColorHexRef.current)
    const lerpFactor = 1 - Math.exp(-10 * delta)
    for (const material of materialsRef.current) {
      material.color.lerp(_targetColor, lerpFactor)
    }
  })

  return <primitive object={scene} />
}

DieselScrollModel.preload = (url: string) => {
  useLoader.preload(GalleryGLTFLoader, url)
}
