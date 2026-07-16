import { Suspense, useEffect, type CSSProperties } from 'react'
import { useLoader } from '@react-three/fiber'
import {
  EQUIPES,
  QDN10_GLB_URLS,
  QDN10_SCROLL_SECTIONS,
  WORLD_CUP_GLB_URL,
} from './quedesnumeros10/content'
import { Qdn10ModelStage } from './quedesnumeros10/Qdn10ModelStage'
import { MARK_FRAMING_CONFIG } from './quedesnumeros10/mark-framing.config'
import { WORLD_CUP_COMPOSE_CONFIG } from './quedesnumeros10/world-cup-compose.config'
import { useQueDesNumeros10Scroll } from './quedesnumeros10/useQueDesNumeros10Scroll'
import { Qdn10BgMark } from './quedesnumeros10/Qdn10BgMark'
import { GalleryGLTFLoader } from '../gallery/galleryGltfLoader'
import './QueDesNumeros10Page.css'

export function QueDesNumeros10Page() {
  const {
    scrollRef,
    viewportRef,
    scrollProgressRef,
    activeEquipeIndex,
    scrollHintVisible,
  } = useQueDesNumeros10Scroll()

  const equipe = EQUIPES[activeEquipeIndex]!

  useEffect(() => {
    for (const url of QDN10_GLB_URLS) {
      useLoader.preload(GalleryGLTFLoader, url)
    }
    Qdn10ModelStage.preloadEnvironment()
  }, [])

  return (
    <div className="qdn10-page" ref={scrollRef}>
      <div className="qdn10-page__viewport" ref={viewportRef}>
        <div
          className="qdn10-page__bg"
          style={
            {
              '--qdn10-mark-x': `${MARK_FRAMING_CONFIG.x}px`,
              '--qdn10-mark-y': `${MARK_FRAMING_CONFIG.y}px`,
              '--qdn10-mark-scale': MARK_FRAMING_CONFIG.scale,
            } as CSSProperties
          }
          aria-hidden
        >
          <Qdn10BgMark />
        </div>

        <div
          className="qdn10-page__world-cup-compose"
          style={
            {
              '--qdn10-coupe-x': WORLD_CUP_COMPOSE_CONFIG.coupe.x,
              '--qdn10-coupe-y': WORLD_CUP_COMPOSE_CONFIG.coupe.y,
              '--qdn10-coupe-scale': WORLD_CUP_COMPOSE_CONFIG.coupe.scale,
            } as CSSProperties
          }
          aria-hidden
        >
          <Suspense fallback={null}>
            <Qdn10ModelStage
              className="qdn10-page__world-cup-model"
              url={WORLD_CUP_GLB_URL}
              scrollProgressRef={scrollProgressRef}
              targetSize={2.1}
              withEnvironment
            />
          </Suspense>
        </div>

        <p
          key={`country-${activeEquipeIndex}`}
          className="qdn10-page__country"
        >
          {equipe.equipe}
        </p>

        <div className="qdn10-page__identity">
          <p
            key={`number-${activeEquipeIndex}`}
            className="qdn10-page__number"
            aria-hidden
          >
            10
          </p>
          <p
            key={`player-${activeEquipeIndex}`}
            className="qdn10-page__player"
          >
            {equipe.numero_10}
          </p>
        </div>

        <div
          className={[
            'qdn10-page__hint',
            scrollHintVisible ? 'qdn10-page__hint--visible' : '',
          ]
            .filter(Boolean)
            .join(' ')}
          aria-hidden={!scrollHintVisible}
        >
          <span className="qdn10-page__hint-line" />
          Scroll
        </div>

        <div className="qdn10-page__progress" aria-hidden>
          {EQUIPES.map((entry, index) => {
            const distance = Math.abs(index - activeEquipeIndex)
            if (distance > 5) return null

            const opacity =
              distance === 0 ? 1 : Math.max(0.12, 1 - distance * 0.18)

            return (
              <span
                key={entry.equipe}
                className={[
                  'qdn10-page__dot',
                  distance === 0 ? 'qdn10-page__dot--active' : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
                style={{ opacity }}
              />
            )
          })}
        </div>
      </div>

      <div
        className="qdn10-page__scroll-track"
        style={{ height: `${QDN10_SCROLL_SECTIONS * 100}vh` }}
        aria-hidden
      />
    </div>
  )
}
