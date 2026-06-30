import { useMemo, useRef, type RefObject } from 'react'
import { ANIM_CAN_CONFIG, getAnimCanFrameUrls } from './anim-can.config'
import { BrasserieSequenceWords } from './BrasserieSequenceWords'
import { useScrollImageSequence } from './useScrollImageSequence'

type BrasserieCanSequenceProps = {
  scrollRef: RefObject<HTMLDivElement | null>
  onLoopReset?: () => void
}

export function BrasserieCanSequence({
  scrollRef,
  onLoopReset,
}: BrasserieCanSequenceProps) {
  const sectionRef = useRef<HTMLElement>(null)
  const trackRef = useRef<HTMLDivElement>(null)
  const holdTrackRef = useRef<HTMLDivElement>(null)
  const loopTrackRef = useRef<HTMLDivElement>(null)
  const loopOverlayRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const frameUrls = useMemo(() => getAnimCanFrameUrls(), [])
  const { liquid, bg, bgTop, bgTopRatio } = ANIM_CAN_CONFIG
  const sectionBackground = `linear-gradient(to bottom, ${bgTop} 0%, ${bgTop} ${bgTopRatio * 100}%, ${bg} ${bgTopRatio * 100}%, ${bg} 100%)`

  useScrollImageSequence({
    scrollRef,
    sectionRef,
    trackRef,
    holdTrackRef,
    loopTrackRef,
    loopOverlayRef,
    canvasRef,
    frameUrls,
    onLoopReset,
  })

  return (
    <>
      <div
        ref={loopOverlayRef}
        className="brasserie-page__sequence-loop-overlay"
        style={{ background: liquid.color }}
        aria-hidden
      />

      <section
        ref={sectionRef}
        className="brasserie-page__sequence"
        style={{ background: sectionBackground }}
        aria-label="Animation canette"
      >
        <div
          className="brasserie-page__sequence-sticky"
          style={{ background: sectionBackground }}
        >
          <BrasserieSequenceWords />
          <canvas ref={canvasRef} className="brasserie-page__sequence-canvas" />
        </div>
        <div
          ref={trackRef}
          className="brasserie-page__sequence-track"
          style={{ height: `${ANIM_CAN_CONFIG.scrollVh}vh` }}
          aria-hidden
        />
        <div
          ref={holdTrackRef}
          className="brasserie-page__sequence-hold-track"
          style={{ height: `${ANIM_CAN_CONFIG.holdScrollVh}vh` }}
          aria-hidden
        />
        <div
          ref={loopTrackRef}
          className="brasserie-page__sequence-loop-track"
          style={{ height: `${ANIM_CAN_CONFIG.loopScrollVh}vh` }}
          aria-hidden
        />
      </section>
    </>
  )
}
