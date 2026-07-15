let pageVisible = typeof document !== 'undefined' ? !document.hidden : true

const listeners = new Set<(visible: boolean) => void>()

if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => {
    pageVisible = !document.hidden
    listeners.forEach((listener) => listener(pageVisible))
  })
}

export function isPageVisible() {
  return pageVisible
}

export function subscribePageVisibility(listener: (visible: boolean) => void) {
  listeners.add(listener)
  listener(pageVisible)
  return () => {
    listeners.delete(listener)
  }
}
