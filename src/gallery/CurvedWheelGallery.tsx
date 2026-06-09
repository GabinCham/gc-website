import {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type RefObject,
} from 'react'
import { useFrame } from '@react-three/fiber'
import { CurvedCard } from './CurvedCard'
import {
  GALLERY_ITEMS,
  filterGalleryByCategory,
  type GalleryCategory,
  type GalleryItem,
} from './images'
import {
  BACKGROUND_SLOT_LEAD,
  getGalleryItem,
  getStableFrontGalleryItem,
  getStableFrontSlot,
  getVisibleSlots,
  getVisibleSlotRange,
} from './spiralInfinite'
import { getCardLayout, type LayoutMode } from './layouts'
import { useGalleryResponsiveLayout } from './useGalleryResponsiveScale'
import { useGalleryScroll } from './useGalleryScroll'
import { getCenterModelUrl } from './centerModels'
import { VhsTapeCenter } from './VhsTapeCenter'
import { useIsMobileGallery } from './mobilePerf'

const GALLERY_GROUP_Y = 0.2

type CurvedWheelGalleryProps = {
  mode: LayoutMode
  category: GalleryCategory | null
  autoScrollEnabled?: boolean
  onActiveItemChange?: (item: GalleryItem) => void
  onBackgroundItemChange?: (item: GalleryItem) => void
  onItemSelect?: (item: GalleryItem) => void
  onCardHoverChange?: (hovered: boolean) => void
  onReady?: () => void
  onSettled?: () => void
}

type AssetBatch = {
  id: number
  glbReady: boolean
  pendingSlots: Set<number>
  finished: boolean
}

function GalleryLighting({ mobile }: { mobile: boolean }) {
  if (mobile) {
    return (
      <>
        <hemisphereLight
          color="#f4f6fc"
          groundColor="#242830"
          intensity={1.2}
        />
        <ambientLight intensity={0.65} color="#fafaff" />
        <directionalLight
          position={[1, 6, 9]}
          intensity={1.1}
          color="#fffaf4"
        />
      </>
    )
  }

  return (
    <>
      <hemisphereLight color="#f4f6fc" groundColor="#242830" intensity={1.4} />
      <ambientLight intensity={0.58} color="#fafaff" />
      <directionalLight position={[1, 6, 9]} intensity={1.28} color="#fffaf4" />
      <directionalLight position={[-7, 3, 5]} intensity={0.78} color="#eef2ff" />
      <directionalLight position={[0, 1, -7]} intensity={0.52} color="#c8d8f4" />
      <directionalLight position={[0, 8, 2]} intensity={0.45} color="#ffffff" />
    </>
  )
}

type SpiralSlotCardProps = {
  slot: number
  batchId: number
  items: GalleryItem[]
  offsetRef: RefObject<number>
  frontSlotRef: RefObject<number>
  width: number
  height: number
  onSlotLoaded: (batchId: number, slot: number) => void
  onSelect?: (item: GalleryItem) => void
  onHoverChange?: (hovered: boolean) => void
}

function SpiralSlotCard({
  slot,
  batchId,
  items,
  offsetRef,
  frontSlotRef,
  width,
  height,
  onSlotLoaded,
  onSelect,
  onHoverChange,
}: SpiralSlotCardProps) {
  const item = getGalleryItem(slot, items)
  const onSlotLoadedRef = useRef(onSlotLoaded)
  onSlotLoadedRef.current = onSlotLoaded

  useEffect(() => {
    onSlotLoadedRef.current(batchId, slot)
  }, [batchId, slot])

  if (!item) return null

  return (
    <CurvedCard
      spiralSlot={slot}
      offsetRef={offsetRef}
      frontSlotRef={frontSlotRef}
      item={item}
      width={width}
      height={height}
      onSelect={onSelect}
      onHoverChange={onHoverChange}
    />
  )
}

function CenterModelLoaded({
  batchId,
  onGlbLoaded,
}: {
  batchId: number
  onGlbLoaded: (batchId: number) => void
}) {
  const onGlbLoadedRef = useRef(onGlbLoaded)
  onGlbLoadedRef.current = onGlbLoaded

  useEffect(() => {
    onGlbLoadedRef.current(batchId)
  }, [batchId])

  return null
}

export function CurvedWheelGallery({
  mode,
  category,
  autoScrollEnabled = true,
  onActiveItemChange,
  onBackgroundItemChange,
  onItemSelect,
  onCardHoverChange,
  onReady,
  onSettled,
}: CurvedWheelGalleryProps) {
  const isMobile = useIsMobileGallery()
  const items = useMemo(
    () => filterGalleryByCategory(GALLERY_ITEMS, category),
    [category],
  )
  const total = items.length
  const isAll = mode === 'all'
  const { step, reset } = useGalleryScroll(
    isAll && total > 0,
    autoScrollEnabled,
  )
  const offsetRef = useRef(0)
  const frontSlotRef = useRef(0)
  const backgroundSlotRef = useRef(0)
  const visibleRangeMinRef = useRef(0)
  const visibleRangeMaxRef = useRef(0)
  const initialReadyRef = useRef(false)
  const assetBatchIdRef = useRef(0)
  const assetBatchRef = useRef<AssetBatch | null>(null)
  const activeItemIdRef = useRef<string | null>(null)
  const backgroundItemIdRef = useRef<string | null>(null)
  const onActiveItemChangeRef = useRef(onActiveItemChange)
  const onBackgroundItemChangeRef = useRef(onBackgroundItemChange)
  const onCardHoverChangeRef = useRef(onCardHoverChange)
  const onReadyRef = useRef(onReady)
  const onSettledRef = useRef(onSettled)
  const cardHoverCountRef = useRef(0)
  onActiveItemChangeRef.current = onActiveItemChange
  onBackgroundItemChangeRef.current = onBackgroundItemChange
  onCardHoverChangeRef.current = onCardHoverChange
  onReadyRef.current = onReady
  onSettledRef.current = onSettled

  const handleCardHoverChange = (hovered: boolean) => {
    cardHoverCountRef.current = Math.max(
      0,
      cardHoverCountRef.current + (hovered ? 1 : -1),
    )
    onCardHoverChangeRef.current?.(cardHoverCountRef.current > 0)
  }

  const [visibleSlots, setVisibleSlots] = useState<number[]>([])

  const slotsToRender = useMemo(() => {
    if (!isAll || total === 0) return []
    if (visibleSlots.length > 0) return visibleSlots
    return getVisibleSlots(0, total, isMobile)
  }, [isAll, total, isMobile, visibleSlots])

  const notifyActiveItem = (item: GalleryItem | undefined) => {
    if (!item || item.id === activeItemIdRef.current) return
    activeItemIdRef.current = item.id
    onActiveItemChangeRef.current?.(item)
  }

  const notifyBackgroundItem = (item: GalleryItem | undefined) => {
    if (!item || item.id === backgroundItemIdRef.current) return
    backgroundItemIdRef.current = item.id
    onBackgroundItemChangeRef.current?.(item)
  }

  const finishAssetBatch = useCallback(() => {
    if (!initialReadyRef.current) {
      reset()
      offsetRef.current = 0
      frontSlotRef.current = 0
      visibleRangeMinRef.current = 0
      visibleRangeMaxRef.current = 0
      initialReadyRef.current = true
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          onReadyRef.current?.()
        })
      })
    }

    onSettledRef.current?.()
  }, [reset])

  const tryFinishAssetBatch = useCallback(
    (batch: AssetBatch) => {
      if (batch.finished) return
      if (batch.pendingSlots.size > 0 || !batch.glbReady) return
      batch.finished = true
      finishAssetBatch()
    },
    [finishAssetBatch],
  )

  const handleGlbLoaded = useCallback(
    (batchId: number) => {
      const batch = assetBatchRef.current
      if (!batch || batch.id !== batchId || batch.finished) return
      batch.glbReady = true
      tryFinishAssetBatch(batch)
    },
    [tryFinishAssetBatch],
  )

  const handleSlotLoaded = useCallback(
    (batchId: number, slot: number) => {
      const batch = assetBatchRef.current
      if (!batch || batch.id !== batchId || batch.finished) return
      if (!batch.pendingSlots.has(slot)) return
      batch.pendingSlots.delete(slot)
      tryFinishAssetBatch(batch)
    },
    [tryFinishAssetBatch],
  )

  const assetBatchKey = `${mode}:${category ?? 'none'}:${total}:${isMobile}`
  const assetBatchKeyRef = useRef('')

  if (isAll && total > 0 && assetBatchKeyRef.current !== assetBatchKey) {
    assetBatchKeyRef.current = assetBatchKey
    assetBatchIdRef.current += 1
    assetBatchRef.current = {
      id: assetBatchIdRef.current,
      glbReady: initialReadyRef.current,
      pendingSlots: new Set(getVisibleSlots(0, total, isMobile)),
      finished: false,
    }
  }

  const activeBatchId = assetBatchRef.current?.id ?? 0

  useEffect(() => {
    reset()
    offsetRef.current = 0
    frontSlotRef.current = 0
    backgroundSlotRef.current = 0
    visibleRangeMinRef.current = 0
    visibleRangeMaxRef.current = 0
    activeItemIdRef.current = null
    backgroundItemIdRef.current = null
    cardHoverCountRef.current = 0
    onCardHoverChangeRef.current?.(false)

    const slots = getVisibleSlots(0, total, isMobile)
    setVisibleSlots(slots)

    const initialItem = isAll
      ? getStableFrontGalleryItem(0, 0, items)
      : items[0]
    if (initialItem) {
      notifyActiveItem(initialItem)
      notifyBackgroundItem(initialItem)
    }

    if (!isAll) {
      if (!initialReadyRef.current) {
        initialReadyRef.current = true
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            onReadyRef.current?.()
          })
        })
      }
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          onSettledRef.current?.()
        })
      })
    }
  }, [assetBatchKey, reset, isAll, items, total, isMobile])

  useFrame((_, delta) => {
    if (isAll && total > 0) {
      offsetRef.current = step(delta)

      const offset = offsetRef.current
      const { minSlot, maxSlot } = getVisibleSlotRange(offset, total, isMobile)
      if (
        minSlot !== visibleRangeMinRef.current ||
        maxSlot !== visibleRangeMaxRef.current
      ) {
        visibleRangeMinRef.current = minSlot
        visibleRangeMaxRef.current = maxSlot
        setVisibleSlots(getVisibleSlots(offset, total, isMobile))
      }

      const backgroundSlot = getStableFrontSlot(
        offset,
        backgroundSlotRef.current,
        BACKGROUND_SLOT_LEAD,
      )
      backgroundSlotRef.current = backgroundSlot
      notifyBackgroundItem(getGalleryItem(backgroundSlot, items))

      const slot = getStableFrontSlot(offset, frontSlotRef.current)
      frontSlotRef.current = slot
      notifyActiveItem(getGalleryItem(slot, items))
    }
  })

  const { scale: galleryScale, cardSize, centerModelScale } =
    useGalleryResponsiveLayout(mode)

  const simpleItems = useMemo(
    () =>
      items.map((item, index) => ({
        slot: index,
        item,
        layout: getCardLayout('simple', index, total, 0),
      })),
    [total, items],
  )

  const centerModelUrl = getCenterModelUrl(category)

  return (
    <>
      {!isMobile ? <fog attach="fog" args={['#1a1a24', 22, 52]} /> : null}
      <GalleryLighting mobile={isMobile} />

      <group position={[0, GALLERY_GROUP_Y, 0]} scale={galleryScale}>
        {isAll ? (
          <Suspense key={centerModelUrl} fallback={null}>
            <VhsTapeCenter
              offsetRef={offsetRef}
              modelUrl={centerModelUrl}
              responsiveScale={centerModelScale}
            />
            <CenterModelLoaded
              batchId={activeBatchId}
              onGlbLoaded={handleGlbLoaded}
            />
          </Suspense>
        ) : null}
        {isAll
          ? slotsToRender.map((slot) => (
              <Suspense key={`slot-${slot}`} fallback={null}>
                <SpiralSlotCard
                  slot={slot}
                  batchId={activeBatchId}
                  items={items}
                  offsetRef={offsetRef}
                  frontSlotRef={frontSlotRef}
                  width={cardSize.width}
                  height={cardSize.height}
                  onSlotLoaded={handleSlotLoaded}
                  onSelect={onItemSelect}
                  onHoverChange={handleCardHoverChange}
                />
              </Suspense>
            ))
          : simpleItems.map(({ layout, item }) => (
              <Suspense key={item.id} fallback={null}>
                <CurvedCard
                  item={item}
                  layout={layout}
                  width={cardSize.width}
                  height={cardSize.height}
                  isInteractive
                  playVideo
                  onSelect={onItemSelect}
                  onHoverChange={handleCardHoverChange}
                />
              </Suspense>
            ))}
      </group>
    </>
  )
}
