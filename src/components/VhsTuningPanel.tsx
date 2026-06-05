import { useCallback, useState, useSyncExternalStore } from 'react'
import {
  VHS_TUNING,
  formatVhsTuningSnippet,
  getVhsTuningSnapshot,
  patchVhsTuning,
  resetVhsTuning,
  subscribeVhsTuning,
  type VhsTuning,
} from '../gallery/vhsTuning'

type AxisField = 'position' | 'rotation'

const POSITION_LIMIT = 4
const ROTATION_LIMIT = 180
const SCALE_MIN = 0.15
const SCALE_MAX = 5

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
    <label className="vhs-tuning__row">
      <span className="vhs-tuning__row-label">{label}</span>
      <input
        type="range"
        className="vhs-tuning__range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
      <input
        type="number"
        className="vhs-tuning__number"
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
  tuning: VhsTuning,
  field: AxisField,
  axis: 0 | 1 | 2,
  value: number,
) {
  const next = [...tuning[field]] as [number, number, number]
  next[axis] = value
  patchVhsTuning({ [field]: next })
}

export function VhsTuningPanel() {
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState(false)

  const tuning = useSyncExternalStore(
    subscribeVhsTuning,
    getVhsTuningSnapshot,
    () => VHS_TUNING,
  )

  const handleCopy = useCallback(async () => {
    const snippet = formatVhsTuningSnippet(getVhsTuningSnapshot())
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
        className="vhs-tuning-toggle"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls="vhs-tuning-panel"
      >
        VHS
      </button>

      {open ? (
        <div
          id="vhs-tuning-panel"
          className="vhs-tuning"
          role="dialog"
          aria-labelledby="vhs-tuning-title"
        >
          <header className="vhs-tuning__header">
            <h2 id="vhs-tuning-title" className="vhs-tuning__title">
              Réglages VHS
            </h2>
            <button
              type="button"
              className="vhs-tuning__close"
              onClick={() => setOpen(false)}
              aria-label="Fermer"
            >
              ×
            </button>
          </header>

          <label className="vhs-tuning__check">
            <input
              type="checkbox"
              checked={tuning.followSpiral}
              onChange={(e) =>
                patchVhsTuning({ followSpiral: e.target.checked })
              }
            />
            Rotation avec la spirale
          </label>

          <p className="vhs-tuning__section">Position (m)</p>
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

          <p className="vhs-tuning__section">Rotation (°)</p>
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

          <p className="vhs-tuning__section">Zoom</p>
          <SliderRow
            label="Échelle"
            value={tuning.scale}
            min={SCALE_MIN}
            max={SCALE_MAX}
            step={0.01}
            onChange={(v) => patchVhsTuning({ scale: v })}
          />

          <footer className="vhs-tuning__footer">
            <button type="button" onClick={() => resetVhsTuning()}>
              Réinitialiser
            </button>
            <button type="button" onClick={handleCopy}>
              {copied ? 'Copié !' : 'Copier le code'}
            </button>
          </footer>

          <p className="vhs-tuning__hint">
            Les valeurs sont sauvegardées dans le navigateur. Colle le code
            exporté dans <code>vhsTuning.ts</code> quand tu es satisfait.
          </p>
        </div>
      ) : null}
    </>
  )
}
