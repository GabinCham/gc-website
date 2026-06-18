import { useEffect, useRef, useState } from 'react'

type SlideTransition = {
  from: string
  to: string
  fromColor: string
  toColor: string
  dir: 1 | -1
}

type BrasserieSlidingPanelProps = {
  text: string
  textColor: string
  canIndex: number
  side: 'left' | 'right'
}

const SLIDE_MS = 680

function PanelText({
  text,
  color,
  className,
}: {
  text: string
  color: string
  className?: string
}) {
  return (
    <p className={className} style={{ color }}>
      {text.split('\n').map((line, index) => (
        <span key={`${line}-${index}`}>
          {index > 0 ? <br /> : null}
          {line}
        </span>
      ))}
    </p>
  )
}

export function BrasserieSlidingPanel({
  text,
  textColor,
  canIndex,
  side,
}: BrasserieSlidingPanelProps) {
  const prevIndexRef = useRef(canIndex)
  const lastTextRef = useRef(text)
  const lastColorRef = useRef(textColor)
  const [transition, setTransition] = useState<SlideTransition | null>(null)

  useEffect(() => {
    if (canIndex === prevIndexRef.current) {
      lastTextRef.current = text
      lastColorRef.current = textColor
      return
    }

    const dir: 1 | -1 = canIndex > prevIndexRef.current ? 1 : -1
    setTransition({
      from: lastTextRef.current,
      to: text,
      fromColor: lastColorRef.current,
      toColor: textColor,
      dir,
    })

    prevIndexRef.current = canIndex
    lastTextRef.current = text
    lastColorRef.current = textColor

    const timer = window.setTimeout(() => setTransition(null), SLIDE_MS)
    return () => window.clearTimeout(timer)
  }, [canIndex, text, textColor])

  const exitClass =
    transition?.dir === 1
      ? 'brasserie-page__panel-text--exit-right'
      : 'brasserie-page__panel-text--exit-left'
  const enterClass =
    transition?.dir === 1
      ? 'brasserie-page__panel-text--enter-from-left'
      : 'brasserie-page__panel-text--enter-from-right'

  return (
    <div
      className={[
        'brasserie-page__panel',
        `brasserie-page__panel--${side}`,
        'brasserie-page__panel--visible',
      ].join(' ')}
    >
      <div className="brasserie-page__panel-track">
        {transition ? (
          <>
            <PanelText
              text={transition.from}
              color={transition.fromColor}
              className={[
                'brasserie-page__panel-text',
                'brasserie-page__panel-text--layer',
                exitClass,
              ].join(' ')}
            />
            <PanelText
              text={transition.to}
              color={transition.toColor}
              className={[
                'brasserie-page__panel-text',
                'brasserie-page__panel-text--layer',
                enterClass,
              ].join(' ')}
            />
          </>
        ) : (
          <PanelText
            text={text}
            color={textColor}
            className="brasserie-page__panel-text"
          />
        )}
      </div>
    </div>
  )
}
