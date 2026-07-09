import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react'
import { gsap } from 'gsap'
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
  onCloseStart?: () => void
  /** Ferme instantanément sans animation de sortie. */
  instantClose?: boolean
  /** La carte hero reste la mesh 3D visible derrière le layout. */
  use3dHero?: boolean
  /** Côté de la carte hero (texte de l'autre côté). */
  heroSide?: HeroSide
}

const CLOSE_MS = 720

function getRandomCtaPalette() {
  const hue = Math.floor(Math.random() * 360)
  const start = `hsl(${hue} 82% 52%)`
  const end = `hsl(${(hue + 28) % 360} 90% 72%)`
  const glow = `hsl(${hue} 78% 50%)`
  return { start, end, glow }
}

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
  onCloseStart,
  instantClose = false,
  use3dHero = false,
  heroSide = 'left',
}: ProjectDetailProps) {
  const [phase, setPhase] = useState<'enter' | 'open' | 'leave'>('enter')
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const ctaZoneRef = useRef<HTMLDivElement | null>(null)
  const ctaRef = useRef<HTMLAnchorElement | null>(null)
  const ctaLabelRef = useRef<HTMLSpanElement | null>(null)

  const details = item.details
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
    onCloseStart?.()
    if (instantClose) {
      onClose()
      return
    }
    setPhase('leave')
    if (closeTimer.current) clearTimeout(closeTimer.current)
    closeTimer.current = setTimeout(() => {
      closeTimer.current = null
      onClose()
    }, CLOSE_MS)
  }, [instantClose, onClose, onCloseStart, phase])

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

  useEffect(() => {
    const zone = ctaZoneRef.current
    const cta = ctaRef.current
    const ctaLabel = ctaLabelRef.current
    if (!zone || !cta || !ctaLabel) return

    const palette = getRandomCtaPalette()
    cta.style.setProperty('--cta-grad-start', palette.start)
    cta.style.setProperty('--cta-grad-end', palette.end)
    cta.style.setProperty('--cta-glow', palette.glow)

    const strength = 0.4
    const labelStrength = 0.24

    const onMove = (event: MouseEvent) => {
      const rect = zone.getBoundingClientRect()
      const x = gsap.utils.mapRange(
        rect.left,
        rect.right,
        -rect.width / 2,
        rect.width / 2,
        event.clientX,
      )
      const y = gsap.utils.mapRange(
        rect.top,
        rect.bottom,
        -rect.height / 2,
        rect.height / 2,
        event.clientY,
      )

      gsap.to(cta, {
        x: x * strength,
        y: y * strength,
        duration: 0.4,
        ease: 'power2.out',
        overwrite: 'auto',
      })

      gsap.to(ctaLabel, {
        x: x * labelStrength,
        y: y * labelStrength,
        duration: 0.4,
        ease: 'power2.out',
        overwrite: true,
      })
    }

    const onLeave = () => {
      gsap.to(cta, {
        x: 0,
        y: 0,
        duration: 0.7,
        ease: 'elastic.out(1, 0.4)',
        overwrite: 'auto',
      })

      gsap.to(ctaLabel, {
        x: 0,
        y: 0,
        duration: 0.7,
        ease: 'elastic.out(1, 0.4)',
        overwrite: true,
      })
    }

    zone.addEventListener('mousemove', onMove)
    zone.addEventListener('mouseleave', onLeave)
    cta.addEventListener('blur', onLeave)

    return () => {
      zone.removeEventListener('mousemove', onMove)
      zone.removeEventListener('mouseleave', onLeave)
      cta.removeEventListener('blur', onLeave)
      gsap.killTweensOf(cta)
      gsap.killTweensOf(ctaLabel)
      gsap.set(cta, { x: 0, y: 0 })
      gsap.set(ctaLabel, { x: 0, y: 0 })
    }
  }, [item.id, item.href])

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

          <div ref={ctaZoneRef} className="project-detail__cta-zone project-detail__reveal" data-delay="6">
            <a
              ref={ctaRef}
              className="project-detail__cta"
              href={item.href ?? ''}
              onClick={(event) => {
                if (!item.href) event.preventDefault()
              }}
              {...(!item.href || item.href.startsWith('/')
                ? {}
                : {
                    target: '_blank',
                    rel: 'noopener noreferrer',
                  })}
            >
              <span ref={ctaLabelRef} className="project-detail__cta-label">
                Voir le projet
              </span>
              <span className="project-detail__cta-arrow" aria-hidden>
                {!item.href || item.href.startsWith('/') ? '→' : '↗'}
              </span>
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
