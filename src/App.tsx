import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { SITE_TRACK } from './audio'
import { AppBackground } from './components/AppBackground'
import { AudioPlayer } from './components/AudioPlayer'
import { GalleryAutoScrollToggle } from './components/GalleryAutoScrollToggle'
import { GalleryLoader } from './components/GalleryLoader'
import { VhsTuningPanel } from './components/VhsTuningPanel'
import {
  GALLERY_ITEMS,
  filterGalleryByCategory,
  type GalleryBackgroundColors,
  type GalleryCategory,
  type GalleryItem,
} from './gallery/images'
import type { LayoutMode } from './gallery/layouts'
import { useIdleMount } from './useIdleMount'
import './App.css'

const GalleryScene = lazy(() =>
  import('./gallery/GalleryScene').then((m) => ({ default: m.GalleryScene })),
)

const CATEGORY_FILTERS: GalleryCategory[] = ['coding', 'films', 'playground']
const DEFAULT_CATEGORY: GalleryCategory = 'fav'

const FAVORITE_ITEMS = filterGalleryByCategory(GALLERY_ITEMS, DEFAULT_CATEGORY)
const INITIAL_ITEM = FAVORITE_ITEMS[0] ?? GALLERY_ITEMS[0]!

function App() {
  const mountGallery = useIdleMount()
  const [galleryReady, setGalleryReady] = useState(false)
  const [filterLoading, setFilterLoading] = useState(false)
  const [filterLoaderVisible, setFilterLoaderVisible] = useState(false)
  const skipFilterLoader = useRef(true)
  const [mode, setMode] = useState<LayoutMode>('all')
  const [category, setCategory] = useState<GalleryCategory | null>(DEFAULT_CATEGORY)

  const galleryCategory = mode === 'all' ? category : null

  const visibleItems = useMemo(
    () => filterGalleryByCategory(GALLERY_ITEMS, galleryCategory),
    [galleryCategory],
  )

  const [autoScrollEnabled, setAutoScrollEnabled] = useState(true)
  const [activeItem, setActiveItem] = useState(INITIAL_ITEM)
  const [backgroundColors, setBackgroundColors] = useState<GalleryBackgroundColors>(
    () => INITIAL_ITEM.backgroundColors,
  )
  const [cardHovered, setCardHovered] = useState(false)

  const handleActiveItemChange = useCallback((item: GalleryItem) => {
    setActiveItem(item)
  }, [])

  const handleBackgroundItemChange = useCallback((item: GalleryItem) => {
    setBackgroundColors(item.backgroundColors)
  }, [])

  const selectCategory = useCallback((next: GalleryCategory) => {
    setMode('all')
    setCategory((current) => (current === next ? null : next))
  }, [])

  const selectSimple = useCallback(() => {
    setCategory(null)
    setMode('simple')
  }, [])

  const handleItemSelect = useCallback((item: GalleryItem) => {
    if (item.href) {
      window.open(item.href, '_blank', 'noopener,noreferrer')
      return
    }

    console.info('[gallery] Projet sélectionné:', item.id, item.alt)
  }, [])

  const handleGalleryReady = useCallback(() => {
    setGalleryReady(true)
    setFilterLoading(false)
  }, [])

  const handleGallerySettled = useCallback(() => {
    setFilterLoading(false)
  }, [])

  useEffect(() => {
    if (!galleryReady) return
    if (skipFilterLoader.current) {
      skipFilterLoader.current = false
      return
    }
    setFilterLoading(true)
  }, [galleryCategory, mode, galleryReady])

  useEffect(() => {
    if (!filterLoading || !galleryReady) {
      setFilterLoaderVisible(false)
      return
    }
    const id = window.setTimeout(() => setFilterLoaderVisible(true), 200)
    return () => clearTimeout(id)
  }, [filterLoading, galleryReady])

  const preloadFilterModel = useCallback((filterCategory: GalleryCategory | null) => {
    void import('./gallery/preloadCenterModel').then(({ preloadCenterModelForCategory }) => {
      preloadCenterModelForCategory(filterCategory)
    })
  }, [])

  useEffect(() => {
    if (!mountGallery || mode !== 'all') return
    preloadFilterModel(galleryCategory)
  }, [mountGallery, mode, galleryCategory, preloadFilterModel])

  return (
    <div className="app">
      <AppBackground colors={backgroundColors} cardHovered={cardHovered} />
      <GalleryLoader
        hidden={galleryReady && !filterLoaderVisible}
        variant={galleryReady ? 'filter' : 'initial'}
      />
      {mountGallery ? (
        <Suspense fallback={null}>
          <GalleryScene
            mode={mode}
            category={galleryCategory}
            autoScrollEnabled={autoScrollEnabled}
            onActiveItemChange={handleActiveItemChange}
            onBackgroundItemChange={handleBackgroundItemChange}
            onItemSelect={handleItemSelect}
            onCardHoverChange={setCardHovered}
            onReady={handleGalleryReady}
            onSettled={handleGallerySettled}
          />
        </Suspense>
      ) : null}

      <header className="overlay">
        {mode === 'all' ? (
          <GalleryAutoScrollToggle
            enabled={autoScrollEnabled}
            onToggle={() => setAutoScrollEnabled((on) => !on)}
          />
        ) : null}

        <div className="site-brand">
          <img
            className="site-brand__logo"
            src="/ux_blanc.svg"
            alt="Logo"
            width={32}
            height={32}
            fetchPriority="high"
            decoding="async"
          />
          <span className="site-brand__sep" aria-hidden />
          <p className="site-brand__name">
            <strong>Gabin</strong> CHAMEROY
          </p>
        </div>

        <nav className="layout-toggle" aria-label="Affichage et filtres">
          <button
            type="button"
            className={`layout-toggle__fav${
              mode === 'all' && category === 'fav' ? ' active' : ''
            }`}
            onClick={() => selectCategory('fav')}
            onMouseEnter={() => preloadFilterModel('fav')}
            onFocus={() => preloadFilterModel('fav')}
            aria-label="Favoris"
            aria-pressed={mode === 'all' && category === 'fav'}
          >
            <svg
              className="layout-toggle__heart"
              viewBox="0 0 16 16"
              width={14}
              height={14}
              aria-hidden
            >
              <path
                fill="currentColor"
                d="M8 13.65 6.95 12.7C3.55 9.65 1.75 8.05 1.75 5.95 1.75 4.55 2.85 3.45 4.25 3.45c.95 0 1.85.48 2.45 1.2.6-.72 1.5-1.2 2.45-1.2 1.4 0 2.5 1.1 2.5 2.5 0 2.1-1.8 3.7-5.2 6.75L8 13.65Z"
              />
            </svg>
          </button>
          <span className="sep" aria-hidden>
            •
          </span>
          <button
            type="button"
            className={mode === 'all' && category === null ? 'active' : ''}
            onClick={() => {
              setMode('all')
              setCategory(null)
            }}
            onMouseEnter={() => preloadFilterModel(null)}
            onFocus={() => preloadFilterModel(null)}
          >
            all
          </button>
          <span className="sep" aria-hidden>
            •
          </span>
          <button
            type="button"
            className={mode === 'simple' ? 'active' : ''}
            onClick={selectSimple}
          >
            simple
          </button>
          {CATEGORY_FILTERS.map((filter) => (
            <span key={filter} className="layout-toggle__group">
              <span className="sep" aria-hidden>
                •
              </span>
              <button
                type="button"
                className={
                  mode === 'all' && category === filter ? 'active' : ''
                }
                onClick={() => selectCategory(filter)}
                onMouseEnter={() => preloadFilterModel(filter)}
                onFocus={() => preloadFilterModel(filter)}
              >
                {filter}
              </button>
            </span>
          ))}
        </nav>

        <div className="active-project" aria-live="polite">
          {visibleItems.length === 0 ? (
            <p className="active-project__description">
              Aucun projet dans ce filtre.
            </p>
          ) : (
            <>
              <p className="active-project__title">{activeItem.title}</p>
              <p className="active-project__description">
                {activeItem.description}
              </p>
            </>
          )}
        </div>
      </header>

      <AudioPlayer
        src={SITE_TRACK}
        syncPlaybackToScroll={mode === 'all'}
      />

      {mode === 'all' ? <VhsTuningPanel /> : null}
    </div>
  )
}

export default App
