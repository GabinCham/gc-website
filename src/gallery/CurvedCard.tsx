import { useMemo, useRef, useState } from 'react'
import { useFrame, useThree, type ThreeEvent } from '@react-three/fiber'
import * as THREE from 'three'
import { createCurvedPlaneGeometry, updateCurvedPlaneGeometry } from './createCurvedPlane'
import { useGalleryImageTexture, useGalleryVideoTexture } from './galleryTextures'
import {
  createRoundedCardBackMaterial,
  createRoundedCardFrontMaterial,
  CARD_BACK,
  syncCardBackUniforms,
  type CardBackUniforms,
} from './createRoundedCardMaterial'
import {
  configureTextureSampling,
  syncMediaFitUniforms,
  type MediaFitUniforms,
} from './textureFit'
import { playCardClickSound, playCardHoverSound } from './cardInteractionSound'
import { getGalleryMediaType, getGalleryPosterUrl, type GalleryItem } from './images'
import type { CardLayout } from './layouts'

const HOVER_SCALE = 1.7
const HOVER_EMISSIVE = 0.0 /*/ TOdo : supprimer l'overlay donc /*/
const CLICK_DRAG_PX = 10

type CurvedCardProps = {
  item: GalleryItem
  layout: CardLayout
  width: number
  height: number
  isInteractive?: boolean
  onSelect?: (item: GalleryItem) => void
  onHoverChange?: (hovered: boolean) => void
}

type CurvedCardMeshProps = {
  item: GalleryItem
  layout: CardLayout
  width: number
  height: number
  texture: THREE.Texture
  /** Texture du dos — par défaut la même que la face avant. */
  backTexture?: THREE.Texture
  isInteractive?: boolean
  onSelect?: (item: GalleryItem) => void
  onHoverChange?: (hovered: boolean) => void
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

function CurvedCardMesh({
  texture,
  backTexture: backTextureProp,
  layout,
  width,
  height,
  item,
  isInteractive = false,
  onSelect,
  onHoverChange,
}: CurvedCardMeshProps) {
  const backTexture = backTextureProp ?? texture
  const { gl } = useThree()
  const groupRef = useRef<THREE.Group>(null)
  const meshRef = useRef<THREE.Mesh>(null)
  const bendRef = useRef(layout.bendRadius)
  const current = useRef<CardLayout>(layout)
  const hoverAmount = useRef(0)
  const pointerDown = useRef<{ x: number; y: number } | null>(null)
  const [hovered, setHovered] = useState(false)

  texture.colorSpace = THREE.SRGBColorSpace
  configureTextureSampling(texture)
  backTexture.colorSpace = THREE.SRGBColorSpace
  configureTextureSampling(backTexture)

  const geometry = useMemo(
    () => createCurvedPlaneGeometry(width, height, layout.bendRadius, 28),
    [width, height],
  )

  const frontMaterial = useMemo(
    () => createRoundedCardFrontMaterial(texture, width, height),
    [texture, width, height],
  )
  const backMaterial = useMemo(
    () => createRoundedCardBackMaterial(backTexture, width, height),
    [backTexture, width, height],
  )

  const setCanvasPointer = (active: boolean) => {
    gl.domElement.classList.toggle('gallery-canvas--pointer', active)
  }

  const handlePointerOver = (event: ThreeEvent<PointerEvent>) => {
    if (!isInteractive) return
    event.stopPropagation()
    setHovered(true)
    onHoverChange?.(true)
    playCardHoverSound()
    setCanvasPointer(true)
  }

  const handlePointerOut = (event: ThreeEvent<PointerEvent>) => {
    if (!isInteractive) return
    event.stopPropagation()
    setHovered(false)
    onHoverChange?.(false)
    setCanvasPointer(false)
  }

  const handlePointerDown = (event: ThreeEvent<PointerEvent>) => {
    if (!isInteractive) return
    event.stopPropagation()
    pointerDown.current = { x: event.clientX, y: event.clientY }
  }

  const handlePointerUp = (event: ThreeEvent<PointerEvent>) => {
    if (!isInteractive || !pointerDown.current) return
    event.stopPropagation()

    const { x, y } = pointerDown.current
    pointerDown.current = null

    const dx = event.clientX - x
    const dy = event.clientY - y
    if (dx * dx + dy * dy > CLICK_DRAG_PX * CLICK_DRAG_PX) return

    playCardClickSound()
    onSelect?.(item)
  }

  useFrame((_, delta) => {
    const backUniforms = backMaterial.userData.cardBackUniforms as
      | CardBackUniforms
      | undefined
    if (backUniforms) syncCardBackUniforms(backUniforms)

    const syncFit = (
      uniforms: MediaFitUniforms | undefined,
      map: THREE.Texture,
    ) => {
      if (!uniforms) return
      syncMediaFitUniforms(uniforms, map, width, height)
      const [r, g, b] = CARD_BACK.greyColor
      uniforms.uLetterboxColor.value.set(r, g, b)
    }
    syncFit(
      frontMaterial.userData.mediaFitUniforms as MediaFitUniforms | undefined,
      texture,
    )
    syncFit(
      backMaterial.userData.mediaFitUniforms as MediaFitUniforms | undefined,
      backTexture,
    )

    const targetHover = isInteractive && hovered ? 1 : 0
    hoverAmount.current += (targetHover - hoverAmount.current) * (1 - Math.exp(-14 * delta))
    frontMaterial.emissive.set('#ffffff')
    frontMaterial.emissiveIntensity = HOVER_EMISSIVE * hoverAmount.current

    const group = groupRef.current
    const mesh = meshRef.current
    if (!group || !mesh) return

    const blend = 1 - Math.exp(-6 * delta)
    const c = current.current

    c.position = lerp3(c.position, layout.position, blend)
    c.rotation = lerp3(c.rotation, layout.rotation, blend)
    c.scale += (layout.scale - c.scale) * blend
    c.bendRadius += (layout.bendRadius - c.bendRadius) * blend

    const hoverScale = 1 + (HOVER_SCALE - 1) * hoverAmount.current
    group.position.set(...c.position)
    group.rotation.set(...c.rotation)
    group.scale.setScalar(c.scale * hoverScale)

    if (Math.abs(c.bendRadius - bendRef.current) > 0.015) {
      bendRef.current = c.bendRadius
      updateCurvedPlaneGeometry(mesh.geometry, c.bendRadius)
    }
  })

  return (
    <group ref={groupRef}>
      <mesh
        ref={meshRef}
        geometry={geometry}
        material={frontMaterial}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
      />
      <mesh geometry={geometry} material={backMaterial} />
    </group>
  )
}

function CurvedImageCard(props: CurvedCardProps) {
  const texture = useGalleryImageTexture(props.item.url)
  return <CurvedCardMesh texture={texture} {...props} />
}

function CurvedVideoCardWithPoster({
  posterUrl,
  ...props
}: CurvedCardProps & { posterUrl: string }) {
  const videoTexture = useGalleryVideoTexture(props.item.url)
  const posterTexture = useGalleryImageTexture(posterUrl)

  return (
    <CurvedCardMesh
      texture={videoTexture}
      backTexture={posterTexture}
      {...props}
    />
  )
}

function CurvedVideoCard(props: CurvedCardProps) {
  const posterUrl = getGalleryPosterUrl(props.item)

  if (posterUrl) {
    return <CurvedVideoCardWithPoster posterUrl={posterUrl} {...props} />
  }

  const texture = useGalleryVideoTexture(props.item.url)

  return <CurvedCardMesh texture={texture} {...props} />
}

export function CurvedCard(props: CurvedCardProps) {
  if (getGalleryMediaType(props.item) === 'video') {
    return <CurvedVideoCard {...props} />
  }

  return <CurvedImageCard {...props} />
}
