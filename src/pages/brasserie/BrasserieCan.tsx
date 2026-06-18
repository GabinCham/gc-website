import { useFrame, useLoader, useThree } from '@react-three/fiber'
import { useMemo, useRef, type RefObject } from 'react'
import * as THREE from 'three'
import { GalleryGLTFLoader } from '../../gallery/galleryGltfLoader'
import { fitBrasserieCamera } from './brasserieCameraFit'
import { canTuningRef } from './canTuning'
import {
  BRASSERIE_SCROLL_TURNS,
  CAN_GLB_URL,
  CAN_LABEL_MATERIAL_NAMES,
  CAN_LABEL_MESH_NAMES,
  CAN_TEXTURE_URLS,
  getBrasserieCanIndex,
} from './content'

const TARGET_SIZE = 2.1
const DEG2RAD = Math.PI / 180

type BrasserieCanProps = {
  scrollProgressRef: RefObject<number>
}

function isLabelMaterial(material: THREE.Material): boolean {
  return CAN_LABEL_MATERIAL_NAMES.includes(
    material.name as (typeof CAN_LABEL_MATERIAL_NAMES)[number],
  )
}

function findLabelMesh(root: THREE.Object3D): THREE.Mesh | null {
  const meshes: THREE.Mesh[] = []
  root.traverse((child) => {
    if ((child as THREE.Mesh).isMesh) meshes.push(child as THREE.Mesh)
  })

  for (const name of CAN_LABEL_MESH_NAMES) {
    const mesh = meshes.find((candidate) => candidate.name === name)
    if (mesh) return mesh
  }

  return (
    meshes.find((mesh) => {
      const materials = Array.isArray(mesh.material)
        ? mesh.material
        : [mesh.material]
      return materials.some((material) => material && isLabelMaterial(material))
    }) ?? null
  )
}

function prepareCanModel(scene: THREE.Group) {
  const root = scene.clone(true)
  let labelMaterial: THREE.MeshStandardMaterial | null = null

  root.traverse((child) => {
    if (!(child as THREE.Mesh).isMesh) return
    const mesh = child as THREE.Mesh
    mesh.castShadow = true
    mesh.receiveShadow = true
    const materials = Array.isArray(mesh.material)
      ? mesh.material
      : [mesh.material]
    for (const material of materials) {
      if (!material) continue
      if ('envMapIntensity' in material) {
        ;(material as THREE.MeshStandardMaterial).envMapIntensity = 1.1
      }
    }
  })

  const labelMesh = findLabelMesh(root)

  if (labelMesh) {
    const source = Array.isArray(labelMesh.material)
      ? labelMesh.material[0]
      : labelMesh.material
    if (source && 'map' in source) {
      const cloned = (source as THREE.MeshStandardMaterial).clone()
      labelMesh.material = cloned
      labelMaterial = cloned
    }
  }

  const box = new THREE.Box3().setFromObject(root)
  const size = new THREE.Vector3()
  const center = new THREE.Vector3()
  box.getSize(size)
  box.getCenter(center)

  // Centre d’abord dans un wrapper, puis scale le wrapper autour de l’origine.
  root.position.sub(center)

  const wrapper = new THREE.Group()
  const maxDim = Math.max(size.x, size.y, size.z)
  if (maxDim > 0) {
    wrapper.scale.setScalar(TARGET_SIZE / maxDim)
  }
  wrapper.add(root)

  return { root: wrapper, labelMaterial }
}

function prepareLabelTextures(textures: THREE.Texture[]) {
  for (const texture of textures) {
    texture.colorSpace = THREE.SRGBColorSpace
    texture.flipY = false
    texture.needsUpdate = true
  }
  return textures
}

function applyLabelTexture(
  material: THREE.MeshStandardMaterial,
  texture: THREE.Texture,
) {
  material.map = texture
  material.needsUpdate = true
}

type CanLabelTexturesProps = {
  scrollProgressRef: RefObject<number>
  labelMaterialRef: RefObject<THREE.MeshStandardMaterial | null>
}

function CanLabelTextures({
  scrollProgressRef,
  labelMaterialRef,
}: CanLabelTexturesProps) {
  const loadedTextures = useLoader(THREE.TextureLoader, CAN_TEXTURE_URLS)
  const labelTextures = useMemo(() => {
    const list = Array.isArray(loadedTextures)
      ? loadedTextures
      : [loadedTextures]
    return prepareLabelTextures(list)
  }, [loadedTextures])

  const lastTextureIndexRef = useRef(-1)

  useFrame(() => {
    const material = labelMaterialRef.current
    if (!material || labelTextures.length === 0) return

    const progress = scrollProgressRef.current ?? 0
    const textureIndex = getBrasserieCanIndex(progress)

    if (textureIndex === lastTextureIndexRef.current) return
    lastTextureIndexRef.current = textureIndex

    const texture = labelTextures[textureIndex]
    if (texture) {
      applyLabelTexture(material, texture)
    }
  })

  return null
}

export function BrasserieCan({ scrollProgressRef }: BrasserieCanProps) {
  const { camera, size } = useThree()
  const { scene } = useLoader(GalleryGLTFLoader, CAN_GLB_URL)
  const { root, labelMaterial } = useMemo(
    () => prepareCanModel(scene),
    [scene],
  )
  const labelMaterialRef = useRef(labelMaterial)
  labelMaterialRef.current = labelMaterial

  const fitTargetRef = useRef<THREE.Group>(null)
  const tuningGroupRef = useRef<THREE.Group>(null)
  const scrollGroupRef = useRef<THREE.Group>(null)

  useFrame(() => {
    const fitTarget = fitTargetRef.current
    const tuningGroup = tuningGroupRef.current
    const scrollGroup = scrollGroupRef.current
    if (!fitTarget || !tuningGroup || !scrollGroup) return

    const tuning = canTuningRef.current
    const progress = scrollProgressRef.current ?? 0

    fitTarget.position.set(
      tuning.position[0],
      tuning.position[1],
      tuning.position[2],
    )
    tuningGroup.rotation.set(
      tuning.rotation[0] * DEG2RAD,
      tuning.rotation[1] * DEG2RAD,
      tuning.rotation[2] * DEG2RAD,
    )
    tuningGroup.scale.setScalar(tuning.scale)
    scrollGroup.rotation.y = tuning.followScroll
      ? progress * BRASSERIE_SCROLL_TURNS * Math.PI * 2
      : 0

    fitBrasserieCamera(
      camera,
      fitTarget,
      size.width,
      size.height,
      tuning,
    )
  })

  return (
    <group ref={fitTargetRef}>
      <group ref={tuningGroupRef}>
        <group ref={scrollGroupRef}>
          <primitive object={root} />
        </group>
      </group>
      {labelMaterial && CAN_TEXTURE_URLS.length > 0 ? (
        <CanLabelTextures
          scrollProgressRef={scrollProgressRef}
          labelMaterialRef={labelMaterialRef}
        />
      ) : null}
    </group>
  )
}

BrasserieCan.preload = () => {
  useLoader.preload(GalleryGLTFLoader, CAN_GLB_URL)
  if (CAN_TEXTURE_URLS.length > 0) {
    useLoader.preload(THREE.TextureLoader, CAN_TEXTURE_URLS)
  }
}
