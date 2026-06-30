import type { CSSProperties } from 'react'
import { BRASSERIE_OUTRO_CONFIG } from './outro.config'

export function BrasserieOutro() {
  const { eyebrow, title, paragraphs, ctaLabel, ctaHref, bg, text, accent } =
    BRASSERIE_OUTRO_CONFIG

  return (
    <section
      className="brasserie-page__outro"
      style={
        {
          '--brasserie-outro-bg': bg,
          '--brasserie-outro-text': text,
          '--brasserie-outro-accent': accent,
        } as CSSProperties
      }
    >
      <div className="brasserie-page__outro-inner">
        <p className="brasserie-page__outro-eyebrow">{eyebrow}</p>
        <h2 className="brasserie-page__outro-title">
          {title.split('\n').map((line, index) => (
            <span key={`${line}-${index}`}>
              {index > 0 ? <br /> : null}
              {line}
            </span>
          ))}
        </h2>
        <div className="brasserie-page__outro-body">
          {paragraphs.map((paragraph) => (
            <p key={paragraph} className="brasserie-page__outro-paragraph">
              {paragraph}
            </p>
          ))}
        </div>
        {ctaLabel && ctaHref ? (
          <a className="brasserie-page__outro-cta" href={ctaHref}>
            {ctaLabel}
          </a>
        ) : null}
      </div>
    </section>
  )
}
