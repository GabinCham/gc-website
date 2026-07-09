export type GalleryNavApi = {
  prev: () => void
  next: () => void
}

let api: GalleryNavApi | null = null

export function setGalleryNavApi(next: GalleryNavApi | null) {
  api = next
}

export function galleryNavPrev() {
  api?.prev()
}

export function galleryNavNext() {
  api?.next()
}
