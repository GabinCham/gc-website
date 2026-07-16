import { Suspense, useEffect, useState } from 'react'
import { useLoader } from '@react-three/fiber'
import {
  DIESEL_DEFAULT_COLOR_ID,
  DIESEL_GLB_URL,
  DIESEL_SCROLL_SECTIONS,
  getDieselBagColor,
} from './diesel/content'
import { DieselColorPicker } from './diesel/DieselColorPicker'
import { DieselAudioPlayer } from './diesel/DieselAudioPlayer'
import { DieselModelStage } from './diesel/DieselModelStage'
import { useDieselScroll } from './diesel/useDieselScroll'
import { GalleryGLTFLoader } from '../gallery/galleryGltfLoader'
import './DieselPage.css'

export function DieselPage() {
  const {
    scrollRef,
    scrollProgressRef,
    scrollHintVisible,
    colorPickerVisible,
  } = useDieselScroll()
  const [activeColorId, setActiveColorId] = useState(DIESEL_DEFAULT_COLOR_ID)
  const activeColor = getDieselBagColor(activeColorId)

  useEffect(() => {
    useLoader.preload(GalleryGLTFLoader, DIESEL_GLB_URL)
    DieselModelStage.preloadEnvironment()
  }, [])

  return (
    <div className="diesel-page" ref={scrollRef}>
      <div className="diesel-page__viewport">
        <DieselAudioPlayer />

        <div className="diesel-page__canvas-layer">
          <Suspense
            fallback={
              <p className="diesel-page__loading">Chargement du modèle…</p>
            }
          >
            <DieselModelStage
              url={DIESEL_GLB_URL}
              scrollProgressRef={scrollProgressRef}
              bagColorHex={activeColor.hex}
            />
          </Suspense>
        </div>

        <DieselColorPicker
          visible={colorPickerVisible}
          activeColorId={activeColorId}
          onSelect={(color) => setActiveColorId(color.id)}
        />

        <div
          className={[
            'diesel-page__hint',
            scrollHintVisible ? 'diesel-page__hint--visible' : '',
          ]
            .filter(Boolean)
            .join(' ')}
          aria-hidden={!scrollHintVisible}
        >
          <span className="diesel-page__hint-line" />
          Scroll
        </div>
      </div>

      <div
        className="diesel-page__scroll-track"
        style={{ height: `${DIESEL_SCROLL_SECTIONS * 100}vh` }}
        aria-hidden
      />
    </div>
  )
}
