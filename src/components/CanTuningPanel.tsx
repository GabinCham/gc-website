import { useCallback, useState, useSyncExternalStore } from 'react'
import {
  CAN_TUNING,
  formatCanTuningSnippet,
  getCanTuningSnapshot,
  patchCanTuning,
  resetCanTuning,
  subscribeCanTuning,
  type CanTuning,
} from '../pages/brasserie/canTuning'

type AxisField = 'position' | 'rotation' | 'cameraOffset'

const POSITION_LIMIT = 4
const ROTATION_LIMIT = 180
const SCALE_MIN = 0.15
const SCALE_MAX = 5
const FIT_MARGIN_MIN = 0.8
const FIT_MARGIN_MAX = 2.5

type SliderRowProps = {
  label: string
  value: number
  min: number
  max: number
  step: number
  onChange: (value: number) => void
}

function SliderRow({ label, value, min, max, step, onChange }: SliderRowProps) {
  return (
    <label className="can-tuning__row">
      <span className="can-tuning__row-label">{label}</span>
      <input
        type="range"
        className="can-tuning__range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
      <input
        type="number"
        className="can-tuning__number"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => {
          const n = Number(e.target.value)
          if (Number.isFinite(n)) onChange(n)
        }}
      />
    </label>
  )
}

function updateAxis(
  tuning: CanTuning,
  field: AxisField,
  axis: 0 | 1 | 2,
  value: number,
) {
  const next = [...tuning[field]] as [number, number, number]
  next[axis] = value
  patchCanTuning({ [field]: next })
}

export function CanTuningPanel() {
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState(false)

  const tuning = useSyncExternalStore(
    subscribeCanTuning,
    getCanTuningSnapshot,
    () => CAN_TUNING,
  )

  const handleCopy = useCallback(async () => {
    const snippet = formatCanTuningSnippet(getCanTuningSnapshot())
    try {
      await navigator.clipboard.writeText(snippet)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      window.prompt('Copier ce bloc :', snippet)
    }
  }, [])

  return (
    <>
      <button
        type="button"
        className="can-tuning-toggle"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls="can-tuning-panel"
      >
        Can
      </button>

      {open ? (
        <div
          id="can-tuning-panel"
          className="can-tuning"
          role="dialog"
          aria-labelledby="can-tuning-title"
        >
          <header className="can-tuning__header">
            <h2 id="can-tuning-title" className="can-tuning__title">
              Réglages canette
            </h2>
            <button
              type="button"
              className="can-tuning__close"
              onClick={() => setOpen(false)}
              aria-label="Fermer"
            >
              ×
            </button>
          </header>

          <label className="can-tuning__check">
            <input
              type="checkbox"
              checked={tuning.followScroll}
              onChange={(e) =>
                patchCanTuning({ followScroll: e.target.checked })
              }
            />
            Rotation avec le scroll
          </label>

          <p className="can-tuning__section">Position (m)</p>
          <SliderRow
            label="X"
            value={tuning.position[0]}
            min={-POSITION_LIMIT}
            max={POSITION_LIMIT}
            step={0.01}
            onChange={(v) => updateAxis(tuning, 'position', 0, v)}
          />
          <SliderRow
            label="Y"
            value={tuning.position[1]}
            min={-POSITION_LIMIT}
            max={POSITION_LIMIT}
            step={0.01}
            onChange={(v) => updateAxis(tuning, 'position', 1, v)}
          />
          <SliderRow
            label="Z"
            value={tuning.position[2]}
            min={-POSITION_LIMIT}
            max={POSITION_LIMIT}
            step={0.01}
            onChange={(v) => updateAxis(tuning, 'position', 2, v)}
          />

          <p className="can-tuning__section">Rotation (°)</p>
          <SliderRow
            label="X"
            value={tuning.rotation[0]}
            min={-ROTATION_LIMIT}
            max={ROTATION_LIMIT}
            step={0.5}
            onChange={(v) => updateAxis(tuning, 'rotation', 0, v)}
          />
          <SliderRow
            label="Y"
            value={tuning.rotation[1]}
            min={-ROTATION_LIMIT}
            max={ROTATION_LIMIT}
            step={0.5}
            onChange={(v) => updateAxis(tuning, 'rotation', 1, v)}
          />
          <SliderRow
            label="Z"
            value={tuning.rotation[2]}
            min={-ROTATION_LIMIT}
            max={ROTATION_LIMIT}
            step={0.5}
            onChange={(v) => updateAxis(tuning, 'rotation', 2, v)}
          />

          <p className="can-tuning__section">Zoom</p>
          <SliderRow
            label="Échelle"
            value={tuning.scale}
            min={SCALE_MIN}
            max={SCALE_MAX}
            step={0.01}
            onChange={(v) => patchCanTuning({ scale: v })}
          />
          <SliderRow
            label="Marge"
            value={tuning.fitMargin}
            min={FIT_MARGIN_MIN}
            max={FIT_MARGIN_MAX}
            step={0.01}
            onChange={(v) => patchCanTuning({ fitMargin: v })}
          />

          <p className="can-tuning__section">Caméra (m)</p>
          <SliderRow
            label="X"
            value={tuning.cameraOffset[0]}
            min={-POSITION_LIMIT}
            max={POSITION_LIMIT}
            step={0.01}
            onChange={(v) => updateAxis(tuning, 'cameraOffset', 0, v)}
          />
          <SliderRow
            label="Y"
            value={tuning.cameraOffset[1]}
            min={-POSITION_LIMIT}
            max={POSITION_LIMIT}
            step={0.01}
            onChange={(v) => updateAxis(tuning, 'cameraOffset', 1, v)}
          />
          <SliderRow
            label="Z"
            value={tuning.cameraOffset[2]}
            min={-POSITION_LIMIT}
            max={POSITION_LIMIT}
            step={0.01}
            onChange={(v) => updateAxis(tuning, 'cameraOffset', 2, v)}
          />

          <footer className="can-tuning__footer">
            <button type="button" onClick={() => resetCanTuning()}>
              Réinitialiser
            </button>
            <button type="button" onClick={handleCopy}>
              {copied ? 'Copié !' : 'Copier le code'}
            </button>
          </footer>

          <p className="can-tuning__hint">
            Les réglages ne sont pas persistés. Colle le code exporté dans{' '}
            <code>canTuning.ts</code> quand tu es satisfait.
          </p>
        </div>
      ) : null}
    </>
  )
}
