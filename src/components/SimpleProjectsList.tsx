import { useLayoutEffect, useRef } from 'react'
import { gsap } from 'gsap'
import {
  getGalleryPosterUrl,
  type GalleryItem,
} from '../gallery/images'

type SimpleProjectsListProps = {
  items: GalleryItem[]
  onItemSelect: (item: GalleryItem) => void
}

function getRandomHoverColor(): string {
  const hue = Math.floor(Math.random() * 360)
  const saturation = 78 + Math.floor(Math.random() * 18)
  const lightness = 62 + Math.floor(Math.random() * 12)
  return `hsl(${hue} ${saturation}% ${lightness}%)`
}

export function SimpleProjectsList({ items, onItemSelect }: SimpleProjectsListProps) {
  const rootRef = useRef<HTMLUListElement>(null)

  useLayoutEffect(() => {
    const root = rootRef.current
    if (!root) return

    const listItems = Array.from(root.querySelectorAll<HTMLLIElement>('.simple-project-item'))
    const cleanups: Array<() => void> = []

    listItems.forEach((el) => {
      const image = el.querySelector<HTMLImageElement>('img.simple-project-item__image')
      if (!image) return

      gsap.set(image, { yPercent: -50, xPercent: -50 })

      let firstEnter = false
      const setX = gsap.quickTo(image, 'x', { duration: 0.4, ease: 'power3' })
      const setY = gsap.quickTo(image, 'y', { duration: 0.4, ease: 'power3' })

      const align = (event: MouseEvent) => {
        if (firstEnter) {
          setX(event.clientX, event.clientX)
          setY(event.clientY, event.clientY)
          firstEnter = false
          return
        }

        setX(event.clientX)
        setY(event.clientY)
      }

      const startFollow = () => document.addEventListener('mousemove', align)
      const stopFollow = () => document.removeEventListener('mousemove', align)
      const fade = gsap.to(image, {
        autoAlpha: 1,
        ease: 'none',
        paused: true,
        duration: 0.1,
        onReverseComplete: stopFollow,
      })

      const onEnter = (event: MouseEvent) => {
        firstEnter = true
        el.style.setProperty('--simple-hover-color', getRandomHoverColor())
        fade.play()
        startFollow()
        align(event)
      }

      const onLeave = () => {
        fade.reverse()
      }

      el.addEventListener('mouseenter', onEnter)
      el.addEventListener('mouseleave', onLeave)

      cleanups.push(() => {
        el.removeEventListener('mouseenter', onEnter)
        el.removeEventListener('mouseleave', onLeave)
        stopFollow()
        fade.kill()
      })
    })

    return () => {
      cleanups.forEach((cleanup) => cleanup())
    }
  }, [items])

  return (
    <ul ref={rootRef} className="simple-project-list" role="list">
      {items.map((item) => {
        const imageSrc = getGalleryPosterUrl(item) ?? item.url

        return (
          <li key={item.id} className="simple-project-item">
            <img
              className="simple-project-item__image"
              src={imageSrc}
              alt=""
              aria-hidden
              loading="lazy"
              decoding="async"
            />
            <button
              type="button"
              className="simple-project-item__button"
              onClick={() => onItemSelect(item)}
            >
              <h3 className="simple-project-item__title">{item.title}.</h3>
            </button>
          </li>
        )
      })}
    </ul>
  )
}
