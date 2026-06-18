import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
} from 'react'
import {
  getGalleryCategoryLabel,
  getGalleryMediaType,
  getGalleryPosterUrl,
  type GalleryItem,
} from '../gallery/images'
import './ProjectDetail.css'
import type { HeroSide } from '../gallery/projectTransition'

type ProjectDetailProps = {
  item: GalleryItem
  onClose: () => void
  /** La carte hero reste la mesh 3D visible derrière le layout. */
  use3dHero?: boolean
  /** Côté de la carte hero (texte de l'autre côté). */
  heroSide?: HeroSide
}

const CLOSE_MS = 720

function ProjectMedia({ item }: { item: GalleryItem }) {
  const isVideo = getGalleryMediaType(item) === 'video'
  const poster = getGalleryPosterUrl(item)

  if (isVideo) {
    return (
      <video
        className="project-detail__media"
        src={item.url}
        poster={poster ?? undefined}
        autoPlay
        muted
        loop
        playsInline
      />
    )
  }

  return (
    <img
      className="project-detail__media"
      src={item.url}
      alt={item.alt}
      decoding="async"
    />
  )
}

export function ProjectDetail({
  item,
  onClose,
  use3dHero = false,
  heroSide = 'left',
}: ProjectDetailProps) {
  const [phase, setPhase] = useState<'enter' | 'open' | 'leave'>('enter')
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const details = item.details
  const accent = item.backgroundColors.accent
  const glow = item.backgroundColors.glow ?? accent
  const base = item.backgroundColors.base
  const categoryLabel = getGalleryCategoryLabel(item.category)
  const lead =
    details?.longDescription ?? item.description
  const highlights =
    details?.highlights ?? [item.description]
  const metaParts = [
    categoryLabel,
    details?.year,
    details?.role,
  ].filter(Boolean)

  const handleClose = useCallback(() => {
    if (phase === 'leave') return
    setPhase('leave')
    if (closeTimer.current) clearTimeout(closeTimer.current)
    closeTimer.current = setTimeout(() => {
      closeTimer.current = null
      onClose()
    }, CLOSE_MS)
  }, [onClose, phase])

  useEffect(() => {
    const id = requestAnimationFrame(() => setPhase('open'))
    return () => cancelAnimationFrame(id)
  }, [item.id])

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') handleClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [handleClose])

  useEffect(() => {
    return () => {
      if (closeTimer.current) clearTimeout(closeTimer.current)
    }
  }, [])

  return (
    <div
      className={[
        'project-detail',
        `project-detail--${phase}`,
        use3dHero ? 'project-detail--3d-hero' : '',
        heroSide === 'right' ? 'project-detail--hero-right' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      role="dialog"
      aria-modal="true"
      aria-label={item.title}
      style={
        {
          '--project-accent': accent,
          '--project-glow': glow,
          '--project-base': base,
        } as CSSProperties
      }
    >
      <div className="project-detail__backdrop" aria-hidden />

      <button
        type="button"
        className="project-detail__close"
        onClick={handleClose}
        aria-label="Retour à la galerie"
      >
        <span className="project-detail__close-icon" aria-hidden>←</span>
        <span className="project-detail__close-label">Galerie</span>
      </button>

      <div className="project-detail__layout">
        {use3dHero ? (
          <div className="project-detail__hero project-detail__hero--3d" aria-hidden />
        ) : (
          <div className="project-detail__hero">
            <div className="project-detail__hero-frame project-detail__hero-frame--ready">
              <ProjectMedia item={item} />
              <div className="project-detail__hero-shade" aria-hidden />
            </div>
          </div>
        )}

        <div className="project-detail__content">
          <p className="project-detail__meta project-detail__reveal" data-delay="0">
            {metaParts.join(' · ')}
          </p>

          <h1 className="project-detail__title project-detail__reveal" data-delay="1">
            {item.title}
          </h1>

          <p className="project-detail__lead project-detail__reveal" data-delay="2">
            {lead}
          </p>

          <ul className="project-detail__highlights">
            {highlights.map((line, index) => (
              <li
                key={line}
                className="project-detail__highlight project-detail__reveal"
                data-delay={String(3 + index)}
              >
                <span className="project-detail__highlight-dot" aria-hidden />
                {line}
              </li>
            ))}
          </ul>

          {item.href ? (
            <a
              className="project-detail__cta project-detail__reveal"
              data-delay="6"
              href={item.href}
              target="_blank"
              rel="noopener noreferrer"
            >
              Voir le projet
              <span className="project-detail__cta-arrow" aria-hidden>↗</span>
            </a>
          ) : null}
        </div>
      </div>
    </div>
  )
}
