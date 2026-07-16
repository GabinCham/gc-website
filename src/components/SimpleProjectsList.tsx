import { Fragment, useLayoutEffect, useRef, useState } from 'react'
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
  const [enterReady, setEnterReady] = useState(false)
  const hasEnteredRef = useRef(false)

  useLayoutEffect(() => {
    const root = rootRef.current
    if (!root) return

    const scrollParent = root.closest('.gallery-stage--simple')
    if (!(scrollParent instanceof HTMLElement)) return

    const syncListInsets = () => {
      const firstItem = root.querySelector<HTMLElement>('.simple-project-item')
      const lastItem = root.querySelector<HTMLElement>(
        '.simple-project-item:last-child',
      )

      const headerOffset = Number.parseFloat(
        getComputedStyle(scrollParent).getPropertyValue('--simple-header-offset'),
      ) || 0

      const centerRatio = Number.parseFloat(
        getComputedStyle(scrollParent).getPropertyValue('--simple-list-center'),
      ) || 0.42
      const centerY = window.innerHeight * centerRatio - headerOffset

      if (firstItem) {
        const insetTop = centerY - firstItem.offsetHeight * 0.5
        root.style.setProperty(
          '--simple-list-inset-top',
          `${Math.max(0, insetTop)}px`,
        )
      }

      if (lastItem) {
        const insetBottom = centerY - lastItem.offsetHeight * 0.5
        root.style.setProperty(
          '--simple-list-inset-bottom',
          `${Math.max(0, insetBottom)}px`,
        )
      }
    }

    scrollParent.scrollTop = 0
    syncListInsets()

    if (!hasEnteredRef.current) {
      setEnterReady(true)
      hasEnteredRef.current = true
    }

    const observer = new ResizeObserver(syncListInsets)
    observer.observe(root)
    window.addEventListener('resize', syncListInsets)

    return () => {
      observer.disconnect()
      window.removeEventListener('resize', syncListInsets)
    }
  }, [items])

  useLayoutEffect(() => {
    const root = rootRef.current
    if (!root) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const scrollParent = root.closest('.gallery-stage--simple')
    if (!(scrollParent instanceof HTMLElement)) return

    const listItems = Array.from(
      root.querySelectorAll<HTMLLIElement>('.simple-project-item'),
    )
    if (listItems.length === 0) return

    root.classList.add('simple-project-list--gsap-shift')

    const shiftRaw =
      getComputedStyle(scrollParent).getPropertyValue('--simple-hover-shift').trim() ||
      '0.72rem'

    const shiftPx = (() => {
      if (shiftRaw.endsWith('rem')) {
        const rem = Number.parseFloat(shiftRaw)
        const fontSize = Number.parseFloat(
          getComputedStyle(document.documentElement).fontSize,
        )
        return rem * fontSize
      }
      return Number.parseFloat(shiftRaw) || 0
    })()

    const setShiftY = listItems.map((el) =>
      gsap.quickTo(el, 'y', { duration: 0.78, ease: 'power3.out' }),
    )

    let hoveredIndex: number | null = null

    const applyShifts = (index: number | null) => {
      hoveredIndex = index
      listItems.forEach((_, i) => {
        if (index === null) {
          setShiftY[i](0)
          return
        }

        if (i === index) {
          setShiftY[i](0)
        } else if (i < index) {
          setShiftY[i](-shiftPx)
        } else {
          setShiftY[i](shiftPx)
        }
      })
    }

    const getItemIndex = (target: EventTarget | null) => {
      const item = (target as Element | null)?.closest('.simple-project-item')
      if (!(item instanceof HTMLLIElement) || !root.contains(item)) return null
      const index = listItems.indexOf(item)
      return index === -1 ? null : index
    }

    const onPointerOver = (event: PointerEvent) => {
      const index = getItemIndex(event.target)
      if (index === null || index === hoveredIndex) return
      applyShifts(index)
    }

    const onPointerLeave = (event: PointerEvent) => {
      const related = event.relatedTarget as Node | null
      if (related && root.contains(related)) return
      applyShifts(null)
    }

    const onFocusIn = (event: FocusEvent) => {
      const index = getItemIndex(event.target)
      if (index === null || index === hoveredIndex) return
      applyShifts(index)
    }

    const onFocusOut = (event: FocusEvent) => {
      const related = event.relatedTarget as Node | null
      if (related && root.contains(related)) return
      applyShifts(null)
    }

    root.addEventListener('pointerover', onPointerOver)
    root.addEventListener('pointerleave', onPointerLeave)
    root.addEventListener('focusin', onFocusIn)
    root.addEventListener('focusout', onFocusOut)

    return () => {
      root.removeEventListener('pointerover', onPointerOver)
      root.removeEventListener('pointerleave', onPointerLeave)
      root.removeEventListener('focusin', onFocusIn)
      root.removeEventListener('focusout', onFocusOut)
      root.classList.remove('simple-project-list--gsap-shift')
      listItems.forEach((el) => {
        gsap.set(el, { clearProps: 'transform' })
      })
    }
  }, [items])

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
    <ul
      ref={rootRef}
      className={[
        'simple-project-list',
        enterReady ? 'simple-project-list--enter' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      role="list"
    >
      {items.map((item, index) => {
        const imageSrc = getGalleryPosterUrl(item) ?? item.url
        const previousItem = index > 0 ? items[index - 1] : null
        const startsPlaygroundSection =
          item.category === 'playground' && previousItem?.category !== 'playground'

        return (
          <Fragment key={item.id}>
            {startsPlaygroundSection ? (
              <li className="simple-project-separator" aria-hidden>
                <span className="simple-project-separator__line" />
                <span className="simple-project-separator__label">playground</span>
                <span className="simple-project-separator__line" />
              </li>
            ) : null}
            <li className="simple-project-item">
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
          </Fragment>
        )
      })}
    </ul>
  )
}
