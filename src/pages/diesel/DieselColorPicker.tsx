import type { CSSProperties } from 'react'
import {
  DIESEL_BAG_COLORS,
  type DieselBagColor,
} from './content'

type DieselColorPickerProps = {
  visible: boolean
  activeColorId: string
  onSelect: (color: DieselBagColor) => void
}

export function DieselColorPicker({
  visible,
  activeColorId,
  onSelect,
}: DieselColorPickerProps) {
  return (
    <div
      className={[
        'diesel-page__colors',
        visible ? 'diesel-page__colors--visible' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      aria-hidden={!visible}
    >
      <p className="diesel-page__colors-label">Couleur</p>
      <div
        className="diesel-page__swatches"
        role="listbox"
        aria-label="Couleur du sac"
      >
        {DIESEL_BAG_COLORS.map((color) => {
          const selected = color.id === activeColorId
          return (
            <button
              key={color.id}
              type="button"
              role="option"
              aria-selected={selected}
              aria-label={color.label}
              title={color.label}
              className={[
                'diesel-page__swatch',
                selected ? 'diesel-page__swatch--active' : '',
              ]
                .filter(Boolean)
                .join(' ')}
              style={{ '--swatch': color.hex } as CSSProperties}
              tabIndex={visible ? 0 : -1}
              onClick={() => onSelect(color)}
            >
              <span className="diesel-page__swatch-core" />
            </button>
          )
        })}
      </div>
    </div>
  )
}
