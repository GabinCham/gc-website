import { Suspense, useEffect, useMemo, useRef, useState } from 'react'
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
  getInfiniteSpiralLayout,
  getStableFrontGalleryItem,
  getStableFrontSlot,
  getVisibleSlots,
  isSpiralInteractiveSlot,
  isSpiralVideoSlot,
} from './spiralInfinite'
import { getGalleryScrollVelocity } from './galleryScrollSpeed'
import { CARD_SIZE, getCardLayout, type LayoutMode } from './layouts'
import { useGalleryScroll } from './useGalleryScroll'
import { GalleryAssetsReady } from './GalleryAssetsReady'
import { getCenterModelUrl } from './centerModels'
import { VhsTapeCenter } from './VhsTapeCenter'

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
  const activeItemIdRef = useRef<string | null>(null)
  const backgroundItemIdRef = useRef<string | null>(null)
  const onActiveItemChangeRef = useRef(onActiveItemChange)
  const onBackgroundItemChangeRef = useRef(onBackgroundItemChange)
  const onCardHoverChangeRef = useRef(onCardHoverChange)
  const cardHoverCountRef = useRef(0)
  onActiveItemChangeRef.current = onActiveItemChange
  onBackgroundItemChangeRef.current = onBackgroundItemChange
  onCardHoverChangeRef.current = onCardHoverChange

  const handleCardHoverChange = (hovered: boolean) => {
    cardHoverCountRef.current = Math.max(
      0,
      cardHoverCountRef.current + (hovered ? 1 : -1),
    )
    onCardHoverChangeRef.current?.(cardHoverCountRef.current > 0)
  }
  const [tick, setTick] = useState(0)
  const frame = useRef(0)

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

  useEffect(() => {
    reset()
    offsetRef.current = 0
    frontSlotRef.current = 0
    backgroundSlotRef.current = 0
    setTick((t) => t + 1)
    activeItemIdRef.current = null
    backgroundItemIdRef.current = null
    cardHoverCountRef.current = 0
    onCardHoverChangeRef.current?.(false)

    const initialItem = isAll
      ? getStableFrontGalleryItem(0, 0, items)
      : items[0]
    if (initialItem) {
      notifyActiveItem(initialItem)
      notifyBackgroundItem(initialItem)
    }
  }, [mode, category, reset, isAll, items])

  useFrame((_, delta) => {
    if (isAll && total > 0) {
      offsetRef.current = step(delta)
      const offset = offsetRef.current

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

    if (!isAll) return

    frame.current += 1
    if (frame.current % 2 === 0) {
      setTick((t) => t + 1)
    }
  })

  const cardSize = CARD_SIZE[mode]
  const offset = offsetRef.current
  const frontSlot = frontSlotRef.current

  const spiralItems = useMemo(() => {
    if (total === 0) return []
    const slots = getVisibleSlots(offset, total)
    return slots.map((slot) => ({
      slot,
      item: getGalleryItem(slot, items)!,
      layout: getInfiniteSpiralLayout(slot, offset),
    }))
  }, [offset, tick, total, items])

  const simpleItems = useMemo(
    () =>
      items.map((item, index) => ({
        slot: index,
        item,
        layout: getCardLayout('simple', index, total, 0),
      })),
    [total, items],
  )

  const visibleItems = isAll ? spiralItems : simpleItems
  const centerModelUrl = getCenterModelUrl(category)

  return (
    <>
      <fog attach="fog" args={['#1a1a24', 22, 52]} />

      <hemisphereLight color="#f4f6fc" groundColor="#242830" intensity={1.4} />
      <ambientLight intensity={0.58} color="#fafaff" />
      <directionalLight position={[1, 6, 9]} intensity={1.28} color="#fffaf4" />
      <directionalLight position={[-7, 3, 5]} intensity={0.78} color="#eef2ff" />
      <directionalLight position={[0, 1, -7]} intensity={0.52} color="#c8d8f4" />
      <directionalLight position={[0, 8, 2]} intensity={0.45} color="#ffffff" />

      <Suspense fallback={null}>
        <group position={[0, GALLERY_GROUP_Y, 0]}>
          {isAll ? (
            <VhsTapeCenter
              key={centerModelUrl}
              offsetRef={offsetRef}
              modelUrl={centerModelUrl}
            />
          ) : null}
          {visibleItems.map(({ slot, layout, item }) => (
            <CurvedCard
              key={isAll ? `slot-${slot}-${item.id}` : item.id}
              item={item}
              layout={layout}
              width={cardSize.width}
              height={cardSize.height}
              isInteractive={
                isAll ? isSpiralInteractiveSlot(slot, frontSlot) : true
              }
              playVideo={
                isAll
                  ? isSpiralVideoSlot(
                      slot,
                      frontSlot,
                      getGalleryScrollVelocity(),
                      offset,
                    )
                  : true
              }
              onSelect={onItemSelect}
              onHoverChange={handleCardHoverChange}
            />
          ))}
        </group>
        <GalleryAssetsReady onReady={onReady} onSettled={onSettled} />
      </Suspense>
    </>
  )
}
