type GalleryAutoScrollToggleProps = {
  enabled: boolean
  onToggle: () => void
}

export function GalleryAutoScrollToggle({
  enabled,
  onToggle,
}: GalleryAutoScrollToggleProps) {
  return (
    <button
      type="button"
      className="gallery-autoscroll-toggle"
      onClick={onToggle}
      aria-pressed={enabled}
      aria-label={
        enabled
          ? 'Mettre en pause le défilement automatique'
          : 'Reprendre le défilement automatique'
      }
    >
      {enabled ? (
        <svg width="10" height="12" viewBox="0 0 10 12" aria-hidden>
          <rect x="0" y="0" width="3" height="12" rx="0.5" fill="currentColor" />
          <rect x="7" y="0" width="3" height="12" rx="0.5" fill="currentColor" />
        </svg>
      ) : (
        <svg width="10" height="12" viewBox="0 0 10 12" aria-hidden>
          <path d="M0 0 L10 6 L0 12 Z" fill="currentColor" />
        </svg>
      )}
    </button>
  )
}
