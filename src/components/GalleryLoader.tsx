const LOADER_IMAGE = '/ux_blanc.svg'

type GalleryLoaderProps = {
  hidden?: boolean
  /** `filter` = transition entre filtres (plus léger). */
  variant?: 'initial' | 'filter'
}

export function GalleryLoader({
  hidden = false,
  variant = 'initial',
}: GalleryLoaderProps) {
  return (
    <div
      className={`gallery-loader gallery-loader--${variant}${
        hidden ? ' gallery-loader--hidden' : ''
      }`}
      role="status"
      aria-live="polite"
      aria-hidden={hidden}
      aria-label={hidden ? undefined : 'Chargement de la galerie'}
    >
      <img
        className="gallery-loader__logo"
        src={LOADER_IMAGE}
        alt=""
        width={40}
        height={40}
        decoding="async"
      />
    </div>
  )
}
