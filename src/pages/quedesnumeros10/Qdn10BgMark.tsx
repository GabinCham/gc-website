import { useEffect, useState } from 'react'
import { QDN10_MARK_LAYERS } from './colors'

const MARK_SVG_URL = '/26.svg'

function prepareMarkSvg(raw: string): string {
  const layerRules = QDN10_MARK_LAYERS.map(
    (cls) =>
      `.${cls}{fill:var(--qdn10-mark-${cls});transition:fill 0.35s ease}`,
  ).join('')

  const style = `<style>.cls-1{fill:none}.cls-14{clip-path:url(#clippath)}${layerRules}</style>`

  return raw
    .replace(/<style>[\s\S]*?<\/style>/, style)
    .replace(
      /<svg\b([^>]*)>/,
      '<svg class="qdn10-page__bg-mark"$1 aria-hidden="true">',
    )
}

export function Qdn10BgMark() {
  const [markup, setMarkup] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    fetch(MARK_SVG_URL)
      .then((response) => {
        if (!response.ok) throw new Error(`mark svg ${response.status}`)
        return response.text()
      })
      .then((raw) => {
        if (cancelled) return
        setMarkup(prepareMarkSvg(raw))
      })
      .catch(() => {
        if (!cancelled) setMarkup(null)
      })

    return () => {
      cancelled = true
    }
  }, [])

  if (!markup) return null

  return (
    <div
      className="qdn10-page__bg-mark-host"
      dangerouslySetInnerHTML={{ __html: markup }}
    />
  )
}
