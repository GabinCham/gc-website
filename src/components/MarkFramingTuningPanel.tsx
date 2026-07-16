import { useCallback, useState, useSyncExternalStore } from 'react'
import {
  formatMarkFramingTuningSnippet,
  getMarkFramingTuningSnapshot,
  MARK_FRAMING_TUNING,
  patchMarkFramingTuning,
  resetMarkFramingTuning,
  subscribeMarkFramingTuning,
} from '../pages/quedesnumeros10/markFramingTuning'

const OFFSET_LIMIT = 600
const SCALE_MIN = 0.4
const SCALE_MAX = 3.5

type SliderRowProps = {
  label: string
  value: number
  min: number
  max: number
  step: number
  unit?: string
  onChange: (value: number) => void
}

function SliderRow({
  label,
  value,
  min,
  max,
  step,
  unit = '',
  onChange,
}: SliderRowProps) {
  return (
    <label className="qdn10-compose-tuning__row">
      <span className="qdn10-compose-tuning__row-label">{label}</span>
      <input
        type="range"
        className="qdn10-compose-tuning__range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
      <input
        type="number"
        className="qdn10-compose-tuning__number"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => {
          const n = Number(e.target.value)
          if (Number.isFinite(n)) onChange(n)
        }}
      />
      {unit ? <span className="qdn10-compose-tuning__unit">{unit}</span> : null}
    </label>
  )
}

export function MarkFramingTuningPanel() {
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState(false)

  const tuning = useSyncExternalStore(
    subscribeMarkFramingTuning,
    getMarkFramingTuningSnapshot,
    () => MARK_FRAMING_TUNING,
  )

  const handleCopy = useCallback(async () => {
    const snippet = formatMarkFramingTuningSnippet(getMarkFramingTuningSnapshot())
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
        className="qdn10-compose-tuning-toggle qdn10-compose-tuning-toggle--mark"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls="qdn10-mark-framing-panel"
      >
        26
      </button>

      {open ? (
        <div
          id="qdn10-mark-framing-panel"
          className="qdn10-compose-tuning qdn10-compose-tuning--mark"
          role="dialog"
          aria-labelledby="qdn10-mark-framing-title"
        >
          <header className="qdn10-compose-tuning__header">
            <h2 id="qdn10-mark-framing-title" className="qdn10-compose-tuning__title">
              Cadrage 26
            </h2>
            <button
              type="button"
              className="qdn10-compose-tuning__close"
              onClick={() => setOpen(false)}
              aria-label="Fermer"
            >
              ×
            </button>
          </header>

          <p className="qdn10-compose-tuning__section">Zoom</p>
          <SliderRow
            label="Scale"
            value={tuning.scale}
            min={SCALE_MIN}
            max={SCALE_MAX}
            step={0.01}
            onChange={(v) => patchMarkFramingTuning({ scale: v })}
          />

          <p className="qdn10-compose-tuning__section">Décalage</p>
          <SliderRow
            label="X"
            value={tuning.x}
            min={-OFFSET_LIMIT}
            max={OFFSET_LIMIT}
            step={1}
            unit="px"
            onChange={(v) => patchMarkFramingTuning({ x: v })}
          />
          <SliderRow
            label="Y"
            value={tuning.y}
            min={-OFFSET_LIMIT}
            max={OFFSET_LIMIT}
            step={1}
            unit="px"
            onChange={(v) => patchMarkFramingTuning({ y: v })}
          />

          <footer className="qdn10-compose-tuning__footer">
            <button type="button" onClick={() => resetMarkFramingTuning()}>
              Réinitialiser
            </button>
            <button type="button" onClick={handleCopy}>
              {copied ? 'Copié !' : 'Copier le code'}
            </button>
          </footer>

          <p className="qdn10-compose-tuning__hint">
            Les réglages ne sont pas persistés. Colle le code exporté dans{' '}
            <code>mark-framing.config.ts</code> quand tu es satisfait.
          </p>
        </div>
      ) : null}
    </>
  )
}
