import { lazy, Suspense, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { gsap } from 'gsap'
import { AppBackground } from './components/AppBackground'
import { AudioPlayer } from './components/AudioPlayer'
import { GalleryLoader } from './components/GalleryLoader'
import { GalleryStepNav } from './components/GalleryStepNav'
import { ProjectDetail } from './components/ProjectDetail'
import { SimpleProjectsList } from './components/SimpleProjectsList'
import {
  GALLERY_ITEMS,
  filterGalleryByCategory,
  sortGalleryForSimpleList,
  type GalleryBackgroundColors,
  type GalleryCategory,
  type GalleryItem,
} from './gallery/images'
import type { HeroSide, ProjectTransitionCompleteMeta } from './gallery/projectTransition'
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
  const GALLERY_RETURN_MS = 680
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
  const simpleItems = useMemo(() => sortGalleryForSimpleList(visibleItems), [visibleItems])

  const [activeItem, setActiveItem] = useState(INITIAL_ITEM)
  const [backgroundColors, setBackgroundColors] = useState<GalleryBackgroundColors>(
    () => INITIAL_ITEM.backgroundColors,
  )
  const [cardHovered, setCardHovered] = useState(false)
  const [transitionItem, setTransitionItem] = useState<GalleryItem | null>(null)
  const transitionItemRef = useRef<GalleryItem | null>(null)
  transitionItemRef.current = transitionItem
  const [selectedProject, setSelectedProject] = useState<GalleryItem | null>(null)
  const [selectedHeroSide, setSelectedHeroSide] = useState<HeroSide>('left')
  const [galleryRestoreKey, setGalleryRestoreKey] = useState(0)
  const [projectClosing, setProjectClosing] = useState(false)
  const [galleryReturning, setGalleryReturning] = useState(false)
  const galleryReturnTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const layoutToggleRef = useRef<HTMLElement>(null)

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
    if (mode === 'simple') {
      if (galleryReturnTimer.current) {
        clearTimeout(galleryReturnTimer.current)
        galleryReturnTimer.current = null
      }
      setGalleryReturning(false)
      setProjectClosing(false)
      setSelectedHeroSide('left')
      setSelectedProject(item)
      setTransitionItem(null)
      setCardHovered(false)
      return
    }

    if (galleryReturnTimer.current) {
      clearTimeout(galleryReturnTimer.current)
      galleryReturnTimer.current = null
    }
    setGalleryReturning(false)
    setProjectClosing(false)
    setTransitionItem(item)
    setBackgroundColors(item.backgroundColors)
    setCardHovered(false)
  }, [mode])

  const handleTransitionComplete = useCallback(
    (meta: ProjectTransitionCompleteMeta) => {
      const item = transitionItemRef.current
      if (item) setSelectedProject(item)
      if (galleryReturnTimer.current) {
        clearTimeout(galleryReturnTimer.current)
        galleryReturnTimer.current = null
      }
      setGalleryReturning(false)
      setProjectClosing(false)
      setSelectedHeroSide(meta.heroSide)
      setTransitionItem(null)
    },
    [],
  )

  const handleProjectCloseStart = useCallback(() => {
    if (mode === 'simple') return
    setProjectClosing(true)
  }, [mode])

  const handleCloseProject = useCallback(() => {
    if (mode === 'simple') {
      setSelectedProject(null)
      setSelectedHeroSide('left')
      setTransitionItem(null)
      setCardHovered(false)
      return
    }
    setProjectClosing(false)
    setSelectedProject(null)
    setSelectedHeroSide('left')
    setTransitionItem(null)
    setCardHovered(false)
    setGalleryRestoreKey((key) => key + 1)
    setGalleryReturning(true)
    if (galleryReturnTimer.current) clearTimeout(galleryReturnTimer.current)
    galleryReturnTimer.current = setTimeout(() => {
      galleryReturnTimer.current = null
      setGalleryReturning(false)
    }, GALLERY_RETURN_MS)
  }, [GALLERY_RETURN_MS, mode])

  useEffect(() => {
    return () => {
      if (galleryReturnTimer.current) clearTimeout(galleryReturnTimer.current)
    }
  }, [])

  useLayoutEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const root = layoutToggleRef.current
    if (!root) return

    const menuItems = root.querySelectorAll<HTMLElement>('[data-menu-anim]')
    if (menuItems.length === 0) return

    const animation = gsap.from(menuItems, {
      y: -90,
      opacity: 0,
      rotation: () => gsap.utils.random(-26, 26),
      stagger: 0.07,
      duration: 0.95,
      ease: 'back.out(1.45)',
      clearProps: 'transform,opacity',
    })

    return () => {
      animation.kill()
    }
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

  useEffect(() => {
    if (!mountGallery || mode !== 'simple') return
    setGalleryReady(true)
    setFilterLoading(false)
    setFilterLoaderVisible(false)
  }, [mountGallery, mode])

  const preloadFilterModel = useCallback((filterCategory: GalleryCategory | null) => {
    void import('./gallery/preloadCenterModel').then(({ preloadCenterModelForCategory }) => {
      preloadCenterModelForCategory(filterCategory)
    })
  }, [])

  useEffect(() => {
    if (!mountGallery || mode !== 'all') return
    preloadFilterModel(galleryCategory)
  }, [mountGallery, mode, galleryCategory, preloadFilterModel])

  const projectTransitioning = transitionItem !== null
  const projectOpen = selectedProject !== null
  const galleryPaused =
    projectTransitioning || projectOpen || projectClosing || galleryReturning

  return (
    <div
      className={[
        'app',
        projectTransitioning ? 'app--project-transition' : '',
        projectOpen ? 'app--project-open' : '',
        projectClosing ? 'app--project-closing' : '',
        galleryReturning ? 'app--gallery-returning' : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <AppBackground
        colors={backgroundColors}
        cardHovered={cardHovered && !galleryPaused}
      />
      <GalleryLoader
        hidden={galleryReady && !filterLoaderVisible}
        variant={galleryReady ? 'filter' : 'initial'}
      />
      {mountGallery ? (
        <div
          className={[
            'gallery-stage',
            mode === 'simple' ? 'gallery-stage--simple' : '',
            projectOpen ? 'gallery-stage--project-hero' : '',
          ]
            .filter(Boolean)
            .join(' ')}
        >
          {mode === 'simple' ? (
            <SimpleProjectsList
              items={simpleItems}
              onItemSelect={handleItemSelect}
            />
          ) : (
            <Suspense fallback={null}>
              <GalleryScene
                mode={mode}
                category={galleryCategory}
                paused={false}
                projectTransitionItem={transitionItem}
                onProjectTransitionComplete={handleTransitionComplete}
                lockedHeroItem={projectOpen ? selectedProject : null}
                galleryRestoreKey={galleryRestoreKey}
                onActiveItemChange={handleActiveItemChange}
                onBackgroundItemChange={handleBackgroundItemChange}
                onItemSelect={handleItemSelect}
                onCardHoverChange={setCardHovered}
                onReady={handleGalleryReady}
                onSettled={handleGallerySettled}
              />
            </Suspense>
          )}
        </div>
      ) : null}

      <GalleryStepNav hidden={mode !== 'all' || projectOpen || !galleryReady} />

      {selectedProject ? (
        <ProjectDetail
          item={selectedProject}
          onCloseStart={handleProjectCloseStart}
          onClose={handleCloseProject}
          instantClose={mode === 'simple'}
          use3dHero={mode !== 'simple'}
          heroSide={mode === 'simple' ? 'left' : selectedHeroSide}
        />
      ) : null}

      <header className="overlay">
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

        <nav
          ref={layoutToggleRef}
          className="layout-toggle"
          aria-label="Affichage et filtres"
        >
          <button
            type="button"
            className={`layout-toggle__fav${
              mode === 'all' && category === 'fav' ? ' active' : ''
            }`}
            data-menu-anim
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
          <span className="sep" aria-hidden data-menu-anim>
            •
          </span>
          <button
            type="button"
            className={`layout-toggle__all${mode === 'all' && category === null ? ' active' : ''}`}
            data-menu-anim
            onClick={() => {
              setMode('all')
              setCategory(null)
            }}
            onMouseEnter={() => preloadFilterModel(null)}
            onFocus={() => preloadFilterModel(null)}
          >
            all
          </button>
          <span className="sep" aria-hidden data-menu-anim>
            •
          </span>
          <button
            type="button"
            className={`layout-toggle__simple${mode === 'simple' ? ' active' : ''}`}
            data-menu-anim
            onClick={selectSimple}
          >
            simple
          </button>
          {CATEGORY_FILTERS.map((filter) => (
            <span key={filter} className="layout-toggle__group">
              <span className="sep" aria-hidden data-menu-anim>
                •
              </span>
              <button
                type="button"
                className={`layout-toggle__${filter}${
                  mode === 'all' && category === filter ? ' active' : ''
                }`}
                data-menu-anim
                onClick={() => selectCategory(filter)}
                onMouseEnter={() => preloadFilterModel(filter)}
                onFocus={() => preloadFilterModel(filter)}
              >
                {filter}
              </button>
            </span>
          ))}
        </nav>

        <div className="active-project" aria-live="polite" hidden={mode === 'simple'}>
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
        syncPlaybackToScroll={mode === 'all'}
      />

      {/* {mode === 'all' && !galleryPaused ? <VhsTuningPanel /> : null} */}
    </div>
  )
}

export default App
