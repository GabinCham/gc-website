import { Suspense, useEffect } from 'react'
import { useLoader } from '@react-three/fiber'
import {
  EQUIPES,
  QDN10_GLB_URLS,
  QDN10_SCROLL_SECTIONS,
  TRIONDA_GLB_URL,
  WORLD_CUP_GLB_URL,
} from './quedesnumeros10/content'
import { Qdn10ModelStage } from './quedesnumeros10/Qdn10ModelStage'
import { useQueDesNumeros10Scroll } from './quedesnumeros10/useQueDesNumeros10Scroll'
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
  }, [])

  return (
    <div className="qdn10-page" ref={scrollRef}>
      <div className="qdn10-page__viewport" ref={viewportRef}>
        <div className="qdn10-page__bg" aria-hidden>
          <div className="qdn10-page__bg-half qdn10-page__bg-half--left" />
          <div className="qdn10-page__bg-half qdn10-page__bg-half--right" />
        </div>

        <a className="qdn10-page__back qdn10-page__text-legible" href="/">
          ← Portfolio
        </a>

        <Suspense fallback={null}>
          <Qdn10ModelStage
            className="qdn10-page__stage qdn10-page__stage--top"
            url={WORLD_CUP_GLB_URL}
            scrollProgressRef={scrollProgressRef}
            targetSize={2.1}
          />
        </Suspense>

        <p
          key={`country-${activeEquipeIndex}`}
          className="qdn10-page__country qdn10-page__text-legible"
        >
          {equipe.equipe}
        </p>

        <Suspense fallback={null}>
          <Qdn10ModelStage
            className="qdn10-page__stage qdn10-page__stage--bottom"
            url={TRIONDA_GLB_URL}
            scrollProgressRef={scrollProgressRef}
            targetSize={2.4}
          />
        </Suspense>

        <div className="qdn10-page__footer">
          <p
            key={`number-${activeEquipeIndex}`}
            className="qdn10-page__number qdn10-page__text-legible qdn10-page__text-legible--strong"
            aria-hidden
          >
            10
          </p>
          <p
            key={`player-${activeEquipeIndex}`}
            className="qdn10-page__player qdn10-page__text-legible"
          >
            {equipe.numero_10}
          </p>
        </div>

        <div
          className={[
            'qdn10-page__hint',
            'qdn10-page__text-legible',
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
          {EQUIPES.map((entry, index) => (
            <span
              key={entry.equipe}
              className={[
                'qdn10-page__dot',
                index === activeEquipeIndex ? 'qdn10-page__dot--active' : '',
              ]
                .filter(Boolean)
                .join(' ')}
            />
          ))}
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
