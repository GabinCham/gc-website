/**
 * Convertit et compresse des vidéos pour les cartes de la galerie 3D.
 * Cible ~100–400 Ko : WebM VP9, sans audio, loop 5 s, boîte 16:9 640×360 max.
 *
 * Usage interactif :
 *   npm run compress:video
 *   → demande le chemin source, crée {nom}_compress.webm dans le même dossier
 *
 * Usage direct :
 *   npm run compress:video -- mon-projet.mov
 *   npm run compress:video -- --start 12 mon-projet.mov
 *   npm run compress:video -- --start 1:30 --duration 5 mon-projet.mov
 *   npm run compress:video -- --full mon-projet.mov   (sans limite de durée)
 *
 * Nécessite ffmpeg sur le PATH.
 */
import { spawnSync } from 'node:child_process'
import { existsSync, statSync } from 'node:fs'
import { basename, dirname, extname, join } from 'node:path'
import { createInterface } from 'node:readline/promises'
import { stdin, stdout } from 'node:process'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))

const INPUT_EXTENSIONS = new Set([
  '.mp4',
  '.mov',
  '.avi',
  '.mkv',
  '.webm',
  '.m4v',
  '.mpg',
  '.mpeg',
])

/** Réglages calibrés sur les WebM existants (4mains ~110 Ko, peugeot ~360 Ko…). */
const DEFAULTS = {
  width: 640,
  height: 360,
  crf: 36,
  fps: 24,
  duration: 5,
  start: 0,
  suffix: '_compress',
  cpuUsed: 3,
}

const SMPTE_HOUR_OFFSET = 3600

/**
 * Secondes depuis :
 * - `141` ou `141.5`
 * - `2:21` (mm:ss)
 * - `2:21:14` (mm:ss:images @ 24 fps)
 * - `01:02:21:14` (timecode QuickTime — retire 1 h automatiquement)
 */
function parseStartTime(raw, timecodeFps = 24) {
  const value = raw.trim()
  if (!value) return 0

  if (value.includes(':')) {
    const parts = value.split(':').map((p) => Number(p))
    if (parts.some((n) => Number.isNaN(n) || n < 0)) {
      throw new Error(`Temps invalide : ${raw}`)
    }
    if (parts.length === 2) return parts[0] * 60 + parts[1]
    if (parts.length === 3) {
      const [a, b, c] = parts
      // mm:ss:images — ex. 2:21:14 (pas 2 h 21 min)
      if (a < 60 && c < timecodeFps) {
        return a * 60 + b + c / timecodeFps
      }
      return a * 3600 + b * 60 + c
    }
    if (parts.length === 4) {
      let seconds =
        parts[0] * 3600 + parts[1] * 60 + parts[2] + parts[3] / timecodeFps
      // QuickTime : timecode SMPTE souvent affiché avec base 01:00:00:00
      if (parts[0] >= 1) seconds -= SMPTE_HOUR_OFFSET
      return Math.max(0, seconds)
    }
    throw new Error(`Temps invalide : ${raw}`)
  }

  const seconds = Number(value)
  if (Number.isNaN(seconds) || seconds < 0) {
    throw new Error(`Temps invalide : ${raw}`)
  }
  return seconds
}

function formatStartTime(seconds) {
  if (seconds <= 0) return '0s'
  if (Number.isInteger(seconds)) return `${seconds}s`
  return `${seconds.toFixed(2)}s`
}

function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

function resolvePath(path) {
  const trimmed = path.trim().replace(/^['"]|['"]$/g, '')
  if (trimmed.startsWith('~')) {
    return join(process.env.HOME ?? '', trimmed.slice(1))
  }
  return trimmed.startsWith('/') ? trimmed : join(process.cwd(), trimmed)
}

function ensureFfmpeg() {
  const result = spawnSync('ffmpeg', ['-version'], { stdio: 'ignore' })
  if (result.error || result.status !== 0) {
    console.error('✗ ffmpeg introuvable. Installe-le (brew install ffmpeg).')
    process.exit(1)
  }
}

function probeVideo(input) {
  const result = spawnSync(
    'ffprobe',
    [
      '-v',
      'error',
      '-select_streams',
      'v:0',
      '-show_entries',
      'stream=width,height,codec_name,r_frame_rate',
      '-show_entries',
      'format=duration,size',
      '-of',
      'json',
      input,
    ],
    { encoding: 'utf8' },
  )

  if (result.status !== 0) return null

  try {
    const data = JSON.parse(result.stdout)
    const stream = data.streams?.[0]
    const format = data.format
    return {
      width: stream?.width,
      height: stream?.height,
      codec: stream?.codec_name,
      duration: format?.duration ? Number(format.duration) : null,
      size: format?.size ? Number(format.size) : null,
    }
  } catch {
    return null
  }
}

function parseArgs(argv) {
  const options = { ...DEFAULTS }
  const inputs = []

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]

    if (arg === '--width' || arg === '-w') {
      options.width = Number(argv[++i])
      continue
    }
    if (arg === '--height' || arg === '-h') {
      options.height = Number(argv[++i])
      continue
    }
    if (arg === '--crf') {
      options.crf = Number(argv[++i])
      continue
    }
    if (arg === '--fps') {
      options.fps = Number(argv[++i])
      continue
    }
    if (arg === '--duration' || arg === '-d') {
      options.duration = Number(argv[++i])
      continue
    }
    if (arg === '--start' || arg === '--ss') {
      options.start = parseStartTime(argv[++i] ?? '')
      continue
    }
    if (arg === '--full') {
      options.duration = null
      continue
    }
    if (arg === '--suffix') {
      options.suffix = argv[++i] ?? ''
      continue
    }
    if (arg === '--cpu-used') {
      options.cpuUsed = Number(argv[++i])
      continue
    }
    if (arg === '--help') {
      options.help = true
      continue
    }

    inputs.push(arg)
  }

  return { options, inputs }
}

function printHelp() {
  console.log(`Usage interactif :
  npm run compress:video

Usage direct :
  npm run compress:video -- projet.mov
  npm run compress:video -- --full projet.mov

Sortie : même dossier que la source → {nom}${DEFAULTS.suffix}.webm

Préréglage « carte légère » (défaut) :
  ${DEFAULTS.width}×${DEFAULTS.height} max (16:9), ${DEFAULTS.fps} fps, ${DEFAULTS.duration}s, crf ${DEFAULTS.crf}, sans audio

Options :
  --width, -w     Largeur max de la boîte 16:9 (défaut : ${DEFAULTS.width})
  --height        Hauteur max de la boîte 16:9 (défaut : ${DEFAULTS.height})
  --crf           Qualité VP9 — plus haut = plus léger (défaut : ${DEFAULTS.crf})
  --fps           FPS de sortie (défaut : ${DEFAULTS.fps})
  --duration, -d  Durée max en secondes (défaut : ${DEFAULTS.duration})
  --start, --ss   Début (ex. 2:21:14, 2:21 ou 01:02:21:14 tel qu’affiché dans QuickTime)
  --full          Garde toute la durée source
  --suffix        Suffixe sortie (défaut : "${DEFAULTS.suffix}")
  --cpu-used      Vitesse encodage VP9 0–5 (défaut : ${DEFAULTS.cpuUsed})
`)
}

function outputPathFor(input, options) {
  const dir = dirname(input)
  let stem = basename(input, extname(input))
  stem = stem.replace(/_compress$/, '').replace(/_reduce$/, '')
  return join(dir, `${stem}${options.suffix}.webm`)
}

function buildVideoFilter(options) {
  const { width, height, fps } = options
  // Tient dans la boîte 16:9 — un vertical 9:16 ne sort plus en 720×1560.
  return [
    `scale=${width}:${height}:force_original_aspect_ratio=decrease:flags=lanczos`,
    `fps=${fps}`,
  ].join(',')
}

function buildFfmpegArgs(input, output, options) {
  const args = ['-y', '-i', input]

  if (options.start > 0) {
    args.push('-ss', String(options.start))
  }

  args.push(
    '-an',
    '-vf',
    buildVideoFilter(options),
    '-c:v',
    'libvpx-vp9',
    '-crf',
    String(options.crf),
    '-b:v',
    '0',
    '-row-mt',
    '1',
    '-cpu-used',
    String(options.cpuUsed),
    '-tile-columns',
    '2',
    '-frame-parallel',
    '1',
    '-pix_fmt',
    'yuv420p',
    '-deadline',
    'good',
    '-g',
    String(Math.round(options.fps * 2)),
  )

  if (options.duration != null && options.duration > 0) {
    args.push('-t', String(options.duration))
  }

  args.push(output)
  return args
}

function compressOne(input, options) {
  if (!existsSync(input)) {
    console.error(`✗ Source introuvable : ${input}`)
    return false
  }

  const ext = extname(input).toLowerCase()
  if (!INPUT_EXTENSIONS.has(ext)) {
    console.error(`✗ Format non supporté (${ext}) : ${input}`)
    return false
  }

  const output = outputPathFor(input, options)
  const before = statSync(input).size
  const meta = probeVideo(input)

  console.log(`\n→ ${basename(input)} (${formatSize(before)})`)
  if (meta?.width) {
    console.log(
      `  source : ${meta.width}×${meta.height} ${meta.codec ?? ''}${
        meta.duration ? `, ${meta.duration.toFixed(1)}s` : ''
      }`,
    )
  }
  if (meta?.duration && options.start >= meta.duration) {
    console.error(
      `✗ Début (${formatStartTime(options.start)}) au-delà de la durée source (${meta.duration.toFixed(1)}s).`,
    )
    console.error(
      '  Vérifie le timecode : 2:21:14 = 2 min 21 s, ou colle 01:02:21:14 depuis QuickTime.',
    )
    return false
  }
  const startLabel =
    options.start > 0 ? `, début ${formatStartTime(options.start)}` : ''
  console.log(
    `  cible  : ≤${options.width}×${options.height}, crf ${options.crf}, ${options.fps} fps${
      options.duration ? `, ${options.duration}s max` : ', durée complète'
    }${startLabel}`,
  )

  const result = spawnSync('ffmpeg', buildFfmpegArgs(input, output, options), {
    stdio: 'inherit',
  })

  if (result.status !== 0) {
    console.error(`✗ Échec encodage : ${input}`)
    return false
  }

  const after = statSync(output).size
  const outMeta = probeVideo(output)
  const ratio = ((1 - after / before) * 100).toFixed(1)

  console.log(`✓ ${output} — ${formatSize(after)} (−${ratio}%)`)
  if (outMeta?.width) {
    console.log(
      `  sortie : ${outMeta.width}×${outMeta.height} vp9${
        outMeta.duration ? `, ${outMeta.duration.toFixed(1)}s` : ''
      }`,
    )
  }

  if (after > 600 * 1024) {
    console.log(
      '  ⚠ Fichier > 600 Ko — essaie --crf 38 ou une source plus courte (--duration 4).',
    )
  }

  return true
}

async function promptInteractiveOptions(options) {
  const rl = createInterface({ input: stdin, output: stdout })
  try {
    const pathAnswer = await rl.question('Chemin du fichier source : ')
    const path = resolvePath(pathAnswer)
    if (!path) return { path: '', options }

    const startAnswer = await rl.question(
      'Début de la coupe (Entrée = 0, ex. 2:21:14 ou 12) : ',
    )
    if (startAnswer.trim()) {
      options.start = parseStartTime(startAnswer)
    }

    return { path, options }
  } finally {
    rl.close()
  }
}

ensureFfmpeg()

const { options, inputs } = parseArgs(process.argv.slice(2))

if (options.help) {
  printHelp()
  process.exit(0)
}

let targets

if (inputs.length > 0) {
  targets = inputs.map(resolvePath)
} else {
  console.log(
    `Compression vidéo carte — cible ~100–400 Ko (${DEFAULTS.width}×${DEFAULTS.height}, ${DEFAULTS.duration}s, crf ${DEFAULTS.crf})\n`,
  )
  try {
    const { path, options: interactiveOptions } =
      await promptInteractiveOptions(options)
    Object.assign(options, interactiveOptions)
    if (!path) {
      console.error('Aucun fichier fourni.')
      process.exit(1)
    }
    targets = [path]
  } catch (error) {
    console.error(`✗ ${error instanceof Error ? error.message : error}`)
    process.exit(1)
  }
}

let hadError = false

for (const input of targets) {
  if (!compressOne(input, options)) hadError = true
}

if (hadError) process.exit(1)

console.log('\nCompression vidéo terminée.')
