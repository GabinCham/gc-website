import {
  SEQUENCE_WORDS,
  SEQUENCE_WORDS_CONFIG,
} from './sequence-words.config'

export function BrasserieSequenceWords() {
  const { color, colorAlt } = SEQUENCE_WORDS_CONFIG

  return (
    <div className="brasserie-page__sequence-words" aria-hidden>
      {SEQUENCE_WORDS.map((word) => (
        <span
          key={word.text}
          className={[
            'brasserie-page__sequence-word',
            `brasserie-page__sequence-word--${word.font}`,
          ].join(' ')}
          style={{
            left: `${word.x}%`,
            top: `${word.y}%`,
            fontSize: word.size,
            transform: `rotate(${word.rotate}deg)`,
            opacity: word.opacity,
            fontWeight: word.weight,
            color: word.font === 'changa' ? color : colorAlt,
          }}
        >
          {word.text}
        </span>
      ))}
    </div>
  )
}
