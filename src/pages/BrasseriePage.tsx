import { Suspense, useEffect } from 'react'
import {
  BRASSERIE_CANS,
  BRASSERIE_SCROLL_TURNS,
  CAN_GLB_URL,
  CAN_TEXTURE_URLS,
} from './brasserie/content'
import { BrasserieScene } from './brasserie/BrasserieScene'
import { useBrasserieScroll } from './brasserie/useBrasserieScroll'
import { GalleryGLTFLoader } from '../gallery/galleryGltfLoader'
import { useLoader } from '@react-three/fiber'
import * as THREE from 'three'
import type { BrasserieCanConfig } from './brasserie/content'
import { BrasserieSlidingPanel } from './brasserie/BrasserieSlidingPanel'
import { CanTuningPanel } from '../components/CanTuningPanel'
import './BrasseriePage.css'

export function BrasseriePage() {
  const {
    scrollRef,
    viewportRef,
    scrollProgressRef,
    activeCanIndex,
    scrollHintVisible,
  } = useBrasserieScroll()

  const can: BrasserieCanConfig = BRASSERIE_CANS[activeCanIndex]!

  useEffect(() => {
    useLoader.preload(GalleryGLTFLoader, CAN_GLB_URL)
    if (CAN_TEXTURE_URLS.length > 0) {
      useLoader.preload(THREE.TextureLoader, CAN_TEXTURE_URLS)
    }
  }, [])

  return (
    <div className="brasserie-page" ref={scrollRef}>
      <div className="brasserie-page__viewport" ref={viewportRef}>
        <div className="brasserie-page__bg" aria-hidden>
          <div className="brasserie-page__bg-half brasserie-page__bg-half--left" />
          <div className="brasserie-page__bg-half brasserie-page__bg-half--right" />
        </div>

        <a className="brasserie-page__back" href="/">
          ← Portfolio
        </a>

        <div className="brasserie-page__layout">
          <BrasserieSlidingPanel
            text={can.textLeft}
            textColor={can.textColorLeft}
            canIndex={activeCanIndex}
            side="left"
          />

          <div className="brasserie-page__stage" aria-hidden>
            <Suspense
              fallback={
                <p className="brasserie-page__loading">Chargement de la canette…</p>
              }
            >
              <BrasserieScene scrollProgressRef={scrollProgressRef} />
            </Suspense>
          </div>

          <BrasserieSlidingPanel
            text={can.textRight}
            textColor={can.textColorRight}
            canIndex={activeCanIndex}
            side="right"
          />
        </div>

        <div
          className={[
            'brasserie-page__hint',
            scrollHintVisible ? 'brasserie-page__hint--visible' : '',
          ]
            .filter(Boolean)
            .join(' ')}
          aria-hidden={!scrollHintVisible}
        >
          <span className="brasserie-page__hint-line" />
          Scroll
        </div>

        <div className="brasserie-page__progress" aria-hidden>
          {BRASSERIE_CANS.map((entry, index) => (
            <span
              key={entry.id}
              className={[
                'brasserie-page__dot',
                index === activeCanIndex ? 'brasserie-page__dot--active' : '',
              ]
                .filter(Boolean)
                .join(' ')}
            />
          ))}
        </div>
      </div>

      <div
        className="brasserie-page__scroll-track"
        style={{ height: `${BRASSERIE_SCROLL_TURNS * 100}vh` }}
        aria-hidden
      />

      <CanTuningPanel />
    </div>
  )
}
