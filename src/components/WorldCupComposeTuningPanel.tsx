import { useCallback, useState, useSyncExternalStore } from 'react'
import {
  formatWorldCupComposeTuningSnippet,
  getWorldCupComposeTuningSnapshot,
  patchWorldCupComposeTuning,
  resetWorldCupComposeTuning,
  subscribeWorldCupComposeTuning,
  WORLD_CUP_COMPOSE_TUNING,
} from '../pages/quedesnumeros10/worldCupComposeTuning'

const OFFSET_LIMIT = 120
const SCALE_MIN = 0.15
const SCALE_MAX = 3

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

export function WorldCupComposeTuningPanel() {
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState(false)

  const tuning = useSyncExternalStore(
    subscribeWorldCupComposeTuning,
    getWorldCupComposeTuningSnapshot,
    () => WORLD_CUP_COMPOSE_TUNING,
  )

  const handleCopy = useCallback(async () => {
    const snippet = formatWorldCupComposeTuningSnippet(getWorldCupComposeTuningSnapshot())
    try {
      await navigator.clipboard.writeText(snippet)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      window.prompt('Copier ce bloc :', snippet)
    }
  }, [])

  const { coupe } = tuning

  return (
    <>
      <button
        type="button"
        className="qdn10-compose-tuning-toggle"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls="qdn10-compose-tuning-panel"
      >
        Coupe
      </button>

      {open ? (
        <div
          id="qdn10-compose-tuning-panel"
          className="qdn10-compose-tuning"
          role="dialog"
          aria-labelledby="qdn10-compose-tuning-title"
        >
          <header className="qdn10-compose-tuning__header">
            <h2 id="qdn10-compose-tuning-title" className="qdn10-compose-tuning__title">
              Position coupe
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

          <p className="qdn10-compose-tuning__section">Décalage par rapport au logo</p>
          <SliderRow
            label="X"
            value={coupe.x}
            min={-OFFSET_LIMIT}
            max={OFFSET_LIMIT}
            step={1}
            unit="px"
            onChange={(v) => patchWorldCupComposeTuning({ x: v })}
          />
          <SliderRow
            label="Y"
            value={coupe.y}
            min={-OFFSET_LIMIT}
            max={OFFSET_LIMIT}
            step={1}
            unit="px"
            onChange={(v) => patchWorldCupComposeTuning({ y: v })}
          />

          <p className="qdn10-compose-tuning__section">Échelle</p>
          <SliderRow
            label="Scale"
            value={coupe.scale}
            min={SCALE_MIN}
            max={SCALE_MAX}
            step={0.01}
            onChange={(v) => patchWorldCupComposeTuning({ scale: v })}
          />

          <footer className="qdn10-compose-tuning__footer">
            <button type="button" onClick={() => resetWorldCupComposeTuning()}>
              Réinitialiser
            </button>
            <button type="button" onClick={handleCopy}>
              {copied ? 'Copié !' : 'Copier le code'}
            </button>
          </footer>

          <p className="qdn10-compose-tuning__hint">
            Les réglages ne sont pas persistés. Colle le code exporté dans{' '}
            <code>world-cup-compose.config.ts</code> quand tu es satisfait.
          </p>
        </div>
      ) : null}
    </>
  )
}
