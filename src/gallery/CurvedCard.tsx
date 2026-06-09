import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type RefObject,
} from 'react'
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
import { getGalleryScrollVelocity } from './galleryScrollSpeed'
import { isMobileGallery } from './mobilePerf'
import {
  getInfiniteSpiralLayout,
  isSpiralInteractiveSlot,
  isSpiralVideoSlot,
} from './spiralInfinite'

const HOVER_SCALE = 1.7
const HOVER_EMISSIVE = 0.0
const CLICK_DRAG_PX = 10
const DESKTOP_PLANE_SEGMENTS = 28
const MOBILE_PLANE_SEGMENTS = 12

/** Marge après la sortie de zone avant de repasser au poster. */
const VIDEO_POSTER_HOLD_MS = 500

/** useLoader partage une VideoTexture par URL — ref count pour ne pas pause() les autres cartes. */
const videoPlayRefs = new Map<string, number>()

type CurvedCardProps = {
  item: GalleryItem
  /** Fixe (mode simple) — ignoré si spiralSlot est défini. */
  layout?: CardLayout
  width: number
  height: number
  spiralSlot?: number
  offsetRef?: RefObject<number>
  frontSlotRef?: RefObject<number>
  isInteractive?: boolean
  /** Lit la vidéo si true ; ignoré en mode spirale (calculé via offsetRef). */
  playVideo?: boolean
  onSelect?: (item: GalleryItem) => void
  onHoverChange?: (hovered: boolean) => void
}

type CurvedCardMeshProps = {
  item: GalleryItem
  layout?: CardLayout
  width: number
  height: number
  texture: THREE.Texture
  backTexture?: THREE.Texture
  spiralSlot?: number
  offsetRef?: RefObject<number>
  frontSlotRef?: RefObject<number>
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

function resolveTargetLayout(
  layout: CardLayout | undefined,
  spiralSlot: number | undefined,
  offsetRef: RefObject<number> | undefined,
): CardLayout | undefined {
  if (spiralSlot !== undefined && offsetRef) {
    return getInfiniteSpiralLayout(spiralSlot, offsetRef.current)
  }
  return layout
}

function CurvedCardMesh({
  texture,
  backTexture: backTextureProp,
  layout,
  width,
  height,
  item,
  spiralSlot,
  offsetRef,
  frontSlotRef,
  isInteractive = false,
  onSelect,
  onHoverChange,
}: CurvedCardMeshProps) {
  const skipCardBack = isMobileGallery()
  const planeSegments =
    skipCardBack ? MOBILE_PLANE_SEGMENTS : DESKTOP_PLANE_SEGMENTS
  const initialLayout =
    resolveTargetLayout(layout, spiralSlot, offsetRef) ?? layout!
  const backTexture = backTextureProp ?? texture
  const initialTextureRef = useRef(texture)
  const { gl } = useThree()
  const groupRef = useRef<THREE.Group>(null)
  const meshRef = useRef<THREE.Mesh>(null)
  const bendRef = useRef(initialLayout.bendRadius)
  const current = useRef<CardLayout>(initialLayout)
  const hoverAmount = useRef(0)
  const pointerDown = useRef<{ x: number; y: number } | null>(null)
  const interactiveRef = useRef(isInteractive)
  const snapOnNextFrameRef = useRef(spiralSlot !== undefined)
  const [hovered, setHovered] = useState(false)

  texture.colorSpace = THREE.SRGBColorSpace
  configureTextureSampling(texture)
  backTexture.colorSpace = THREE.SRGBColorSpace
  configureTextureSampling(backTexture)

  const geometry = useMemo(
    () =>
      createCurvedPlaneGeometry(
        width,
        height,
        initialLayout.bendRadius,
        planeSegments,
      ),
    [width, height, initialLayout.bendRadius, planeSegments],
  )

  const frontMaterial = useMemo(() => {
    const material = createRoundedCardFrontMaterial(
      initialTextureRef.current,
      width,
      height,
    )
    if (skipCardBack) material.side = THREE.DoubleSide
    return material
  }, [width, height, skipCardBack])

  useEffect(() => {
    frontMaterial.map = texture
    frontMaterial.needsUpdate = true
  }, [frontMaterial, texture])

  const backMaterial = useMemo(
    () => createRoundedCardBackMaterial(backTexture, width, height),
    [backTexture, width, height],
  )

  const setCanvasPointer = (active: boolean) => {
    gl.domElement.classList.toggle('gallery-canvas--pointer', active)
  }

  const handlePointerOver = (event: ThreeEvent<PointerEvent>) => {
    if (!interactiveRef.current) return
    event.stopPropagation()
    setHovered(true)
    onHoverChange?.(true)
    playCardHoverSound()
    setCanvasPointer(true)
  }

  const handlePointerOut = (event: ThreeEvent<PointerEvent>) => {
    if (!interactiveRef.current) return
    event.stopPropagation()
    setHovered(false)
    onHoverChange?.(false)
    setCanvasPointer(false)
  }

  const handlePointerDown = (event: ThreeEvent<PointerEvent>) => {
    if (!interactiveRef.current) return
    event.stopPropagation()
    pointerDown.current = { x: event.clientX, y: event.clientY }
  }

  const handlePointerUp = (event: ThreeEvent<PointerEvent>) => {
    if (!interactiveRef.current || !pointerDown.current) return
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
    if (spiralSlot !== undefined && frontSlotRef) {
      interactiveRef.current = isSpiralInteractiveSlot(
        spiralSlot,
        frontSlotRef.current,
      )
    } else {
      interactiveRef.current = isInteractive
    }

    if (!skipCardBack) {
      const backUniforms = backMaterial.userData.cardBackUniforms as
        | CardBackUniforms
        | undefined
      if (backUniforms) syncCardBackUniforms(backUniforms)
    }

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
    if (!skipCardBack) {
      syncFit(
        backMaterial.userData.mediaFitUniforms as MediaFitUniforms | undefined,
        backTexture,
      )
    }

    const targetHover = interactiveRef.current && hovered ? 1 : 0
    hoverAmount.current +=
      (targetHover - hoverAmount.current) * (1 - Math.exp(-14 * delta))
    frontMaterial.emissive.set('#ffffff')
    frontMaterial.emissiveIntensity = HOVER_EMISSIVE * hoverAmount.current

    const group = groupRef.current
    const mesh = meshRef.current
    if (!group || !mesh) return

    const targetLayout = resolveTargetLayout(layout, spiralSlot, offsetRef)
    if (!targetLayout) return

    const c = current.current

    if (snapOnNextFrameRef.current) {
      snapOnNextFrameRef.current = false
      c.position = [...targetLayout.position]
      c.rotation = [...targetLayout.rotation]
      c.scale = targetLayout.scale
      c.bendRadius = targetLayout.bendRadius
      bendRef.current = targetLayout.bendRadius
      updateCurvedPlaneGeometry(mesh.geometry, targetLayout.bendRadius)
    } else {
      const blend = 1 - Math.exp(-6 * delta)
      c.position = lerp3(c.position, targetLayout.position, blend)
      c.rotation = lerp3(c.rotation, targetLayout.rotation, blend)
      c.scale += (targetLayout.scale - c.scale) * blend
      c.bendRadius += (targetLayout.bendRadius - c.bendRadius) * blend

      if (Math.abs(c.bendRadius - bendRef.current) > 0.015) {
        bendRef.current = c.bendRadius
        updateCurvedPlaneGeometry(mesh.geometry, c.bendRadius)
      }
    }

    const hoverScale = 1 + (HOVER_SCALE - 1) * hoverAmount.current
    group.position.set(...c.position)
    group.rotation.set(...c.rotation)
    group.scale.setScalar(c.scale * hoverScale)
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
      {!skipCardBack ? (
        <mesh geometry={geometry} material={backMaterial} />
      ) : null}
    </group>
  )
}

function CurvedImageCard(props: CurvedCardProps) {
  const texture = useGalleryImageTexture(props.item.url)
  return <CurvedCardMesh texture={texture} {...props} />
}

function useDelayedPlayVideo(playVideo: boolean, holdMs = VIDEO_POSTER_HOLD_MS) {
  const [active, setActive] = useState(playVideo)
  const offTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (playVideo) {
      if (offTimer.current) clearTimeout(offTimer.current)
      offTimer.current = null
      setActive(true)
      return
    }

    offTimer.current = setTimeout(() => {
      setActive(false)
      offTimer.current = null
    }, holdMs)

    return () => {
      if (offTimer.current) clearTimeout(offTimer.current)
    }
  }, [playVideo, holdMs])

  return active
}

function computeSpiralPlayVideo(
  spiralSlot: number,
  offsetRef: RefObject<number>,
  frontSlotRef: RefObject<number>,
) {
  const mobile = isMobileGallery()
  if (mobile) {
    return spiralSlot === frontSlotRef.current
  }
  return isSpiralVideoSlot(
    spiralSlot,
    frontSlotRef.current,
    getGalleryScrollVelocity(),
    offsetRef.current,
  )
}

/** Met à jour playVideo uniquement quand la zone vidéo change (pas chaque frame). */
function useSpiralPlayVideo(
  spiralSlot: number | undefined,
  offsetRef: RefObject<number> | undefined,
  frontSlotRef: RefObject<number> | undefined,
  fallback = false,
) {
  const desiredRef = useRef(fallback)
  const [playVideo, setPlayVideo] = useState(fallback)

  useFrame(() => {
    if (
      spiralSlot === undefined ||
      !offsetRef ||
      !frontSlotRef
    ) {
      return
    }

    const should = computeSpiralPlayVideo(spiralSlot, offsetRef, frontSlotRef)
    if (should !== desiredRef.current) {
      desiredRef.current = should
      setPlayVideo(should)
    }
  })

  return useDelayedPlayVideo(
    spiralSlot !== undefined && offsetRef && frontSlotRef
      ? playVideo
      : fallback,
  )
}

function useVideoPlayback(
  texture: THREE.VideoTexture | null,
  active: boolean,
  url: string,
) {
  useEffect(() => {
    if (!texture || !active) return
    const video = texture.image as HTMLVideoElement
    videoPlayRefs.set(url, (videoPlayRefs.get(url) ?? 0) + 1)
    video.play().catch(() => {})
    return () => {
      const next = Math.max(0, (videoPlayRefs.get(url) ?? 1) - 1)
      if (next === 0) {
        video.pause()
        videoPlayRefs.delete(url)
      } else {
        videoPlayRefs.set(url, next)
      }
    }
  }, [texture, active, url])
}

function VideoTextureBridge({
  url,
  onTexture,
}: {
  url: string
  onTexture: (texture: THREE.VideoTexture) => void
}) {
  const texture = useGalleryVideoTexture(url)

  useEffect(() => {
    onTexture(texture)
  }, [texture, onTexture])

  return null
}

function CurvedVideoCardNoPoster(props: CurvedCardProps) {
  const texture = useGalleryVideoTexture(props.item.url)
  useVideoPlayback(texture, true, props.item.url)
  return <CurvedCardMesh texture={texture} {...props} />
}

function CurvedVideoCardWithPoster({
  posterUrl,
  spiralSlot,
  offsetRef,
  frontSlotRef,
  playVideo: playVideoProp = false,
  ...props
}: CurvedCardProps & { posterUrl: string }) {
  const spiralPlayVideo = useSpiralPlayVideo(
    spiralSlot,
    offsetRef,
    frontSlotRef,
    playVideoProp,
  )
  const delayedPropPlayVideo = useDelayedPlayVideo(playVideoProp)
  const isSpiralVideo =
    spiralSlot !== undefined && offsetRef && frontSlotRef
  const playVideo = isSpiralVideo ? spiralPlayVideo : delayedPropPlayVideo
  const posterTexture = useGalleryImageTexture(posterUrl)
  const [videoTexture, setVideoTexture] = useState<THREE.VideoTexture | null>(
    null,
  )
  const frontTexture =
    playVideo && videoTexture ? videoTexture : posterTexture

  useVideoPlayback(videoTexture, playVideo, props.item.url)

  const handleVideoTexture = useCallback((texture: THREE.VideoTexture) => {
    setVideoTexture(texture)
  }, [])

  return (
    <>
      {playVideo ? (
        <VideoTextureBridge url={props.item.url} onTexture={handleVideoTexture} />
      ) : null}
      <CurvedCardMesh
        texture={frontTexture}
        backTexture={posterTexture}
        spiralSlot={spiralSlot}
        offsetRef={offsetRef}
        frontSlotRef={frontSlotRef}
        {...props}
      />
    </>
  )
}

function CurvedVideoCard(props: CurvedCardProps) {
  const posterUrl = getGalleryPosterUrl(props.item)
  if (!posterUrl) return <CurvedVideoCardNoPoster {...props} />
  return <CurvedVideoCardWithPoster posterUrl={posterUrl} {...props} />
}

export function CurvedCard(props: CurvedCardProps) {
  if (getGalleryMediaType(props.item) === 'video') {
    return <CurvedVideoCard {...props} />
  }

  return <CurvedImageCard {...props} />
}
