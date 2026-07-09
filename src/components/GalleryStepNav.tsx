import { galleryNavNext, galleryNavPrev } from '../gallery/galleryNav'

type GalleryStepNavProps = {
  hidden?: boolean
}

export function GalleryStepNav({ hidden = false }: GalleryStepNavProps) {
  if (hidden) return null

  return (
    <nav className="gallery-step-nav" aria-label="Navigation galerie">
      <button
        type="button"
        className="gallery-step-nav__btn"
        onClick={galleryNavPrev}
        aria-label="Projet précédent"
      >
        <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden>
          <path
            d="M9 2 L4 7 L9 12"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
      <button
        type="button"
        className="gallery-step-nav__btn"
        onClick={galleryNavNext}
        aria-label="Projet suivant"
      >
        <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden>
          <path
            d="M5 2 L10 7 L5 12"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
    </nav>
  )
}
