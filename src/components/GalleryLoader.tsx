const LOADER_IMAGE = '/ux_blanc.svg'

type GalleryLoaderProps = {
  hidden?: boolean
}

export function GalleryLoader({ hidden = false }: GalleryLoaderProps) {
  return (
    <div
      className={`gallery-loader${hidden ? ' gallery-loader--hidden' : ''}`}
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
