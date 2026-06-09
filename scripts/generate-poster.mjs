/**
 * Génère un poster carte léger depuis une vidéo (frame) ou une image.
 * Sortie par défaut : public/posters/{nom}_poster.jpg
 *
 * Usage interactif :
 *   npm run generate:poster
 *
 * Usage direct :
 *   npm run generate:poster -- public/videos/4mains_reduce.webm
 *   npm run generate:poster -- --start 2:21:14 public/4mains_Final1.MP4
 *   npm run generate:poster -- public/posters/Marteens.png
 *
 * Nécessite ffmpeg sur le PATH.
 */
import { spawnSync } from 'node:child_process'
import { existsSync, mkdirSync, statSync } from 'node:fs'
import { basename, dirname, extname, join } from 'node:path'
import { createInterface } from 'node:readline/promises'
import { stdin, stdout } from 'node:process'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')
const postersDir = join(root, 'public', 'posters')

const VIDEO_EXTENSIONS = new Set([
  '.mp4',
  '.mov',
  '.avi',
  '.mkv',
  '.webm',
  '.m4v',
  '.mpg',
  '.mpeg',
])

const IMAGE_EXTENSIONS = new Set([
  '.png',
  '.jpg',
  '.jpeg',
  '.webp',
  '.gif',
  '.bmp',
  '.tif',
  '.tiff',
  '.avif',
  '.heic',
  '.heif',
])

function isVideoInput(input) {
  return VIDEO_EXTENSIONS.has(extname(input).toLowerCase())
}

function isImageInput(input) {
  return IMAGE_EXTENSIONS.has(extname(input).toLowerCase())
}

function isSupportedInput(input) {
  return isVideoInput(input) || isImageInput(input)
}

const SMPTE_HOUR_OFFSET = 3600

/** Cible ~30–80 Ko, net sur carte retina. */
const DEFAULTS = {
  width: 1280,
  height: 720,
  quality: null,
  format: null,
  start: 0,
  sameDir: false,
}

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
      if (a < 60 && c < timecodeFps) {
        return a * 60 + b + c / timecodeFps
      }
      return a * 3600 + b * 60 + c
    }
    if (parts.length === 4) {
      let seconds =
        parts[0] * 3600 + parts[1] * 60 + parts[2] + parts[3] / timecodeFps
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

function hasFfmpegEncoder(name) {
  const result = spawnSync('ffmpeg', ['-hide_banner', '-encoders'], {
    encoding: 'utf8',
  })
  return result.stdout?.includes(name) ?? false
}

function resolvePosterFormat(requested) {
  if (requested === 'jpg' || requested === 'jpeg') return 'jpg'
  if (requested === 'webp') {
    if (hasFfmpegEncoder('libwebp')) return 'webp'
    console.log('⚠ libwebp absent — sortie JPEG (ou brew reinstall ffmpeg avec webp).')
    return 'jpg'
  }
  return hasFfmpegEncoder('libwebp') ? 'webp' : 'jpg'
}

function resolvePosterQuality(format, requested) {
  if (requested != null) return requested
  return format === 'jpg' ? 4 : 82
}

function posterStemFromInput(input) {
  const filename = basename(input, extname(input))
  return filename
    .replace(/_poster$/i, '')
    .replace(/_reduce$/i, '')
    .replace(/_compress$/i, '')
}

function outputPathFor(input, options) {
  if (options.output) return resolvePath(options.output)

  const stem = posterStemFromInput(input)
  const ext = options.format === 'jpg' ? 'jpg' : 'webp'
  const dir = options.sameDir ? dirname(input) : postersDir
  return join(dir, `${stem}_poster.${ext}`)
}

function parseArgs(argv) {
  const options = { ...DEFAULTS, output: null }
  const inputs = []

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]

    if (arg === '--width' || arg === '-w') {
      options.width = Number(argv[++i])
      continue
    }
    if (arg === '--height') {
      options.height = Number(argv[++i])
      continue
    }
    if (arg === '--quality' || arg === '-q') {
      options.quality = Number(argv[++i])
      continue
    }
    if (arg === '--format' || arg === '-f') {
      options.format = (argv[++i] ?? 'webp').toLowerCase()
      continue
    }
    if (arg === '--start' || arg === '--ss') {
      options.start = parseStartTime(argv[++i] ?? '')
      continue
    }
    if (arg === '--output' || arg === '-o') {
      options.output = argv[++i] ?? ''
      continue
    }
    if (arg === '--same-dir') {
      options.sameDir = true
      continue
    }
    if (arg === '--help') {
      options.help = true
      continue
    }

    inputs.push(arg)
  }

  if (options.format != null) {
    if (!['webp', 'jpg', 'jpeg'].includes(options.format)) {
      throw new Error(`Format non supporté : ${options.format} (webp ou jpg)`)
    }
    if (options.format === 'jpeg') options.format = 'jpg'
  }

  options.format = resolvePosterFormat(options.format)
  options.quality = resolvePosterQuality(options.format, options.quality)

  return { options, inputs }
}

function printHelp() {
  console.log(`Usage interactif :
  npm run generate:poster

Usage direct :
  npm run generate:poster -- public/videos/4mains_reduce.webm
  npm run generate:poster -- --start 01:02:21:14 public/4mains_Final1.MP4
  npm run generate:poster -- public/posters/Marteens.png

Sortie par défaut : public/posters/{nom}_poster.jpg

Préréglage (défaut) :
  WebP q82 ou JPEG q4 (selon ffmpeg), boîte ${DEFAULTS.width}×${DEFAULTS.height} (16:9)

Options :
  --start, --ss   Frame vidéo uniquement (ignoré pour une image)
  --width, -w     Largeur max (défaut : ${DEFAULTS.width})
  --height        Hauteur max (défaut : ${DEFAULTS.height})
  --quality, -q   WebP 0–100 (déf. 82) · JPG 1–31 (déf. 4, plus bas = meilleur)
  --format, -f    webp ou jpg (auto si omis)
  --output, -o    Chemin de sortie explicite
  --same-dir      Écrit à côté de la source au lieu de public/posters/
`)
}

function buildVideoFilter(options) {
  const { width, height } = options
  return `scale=${width}:${height}:force_original_aspect_ratio=decrease:flags=lanczos`
}

function appendEncodeArgs(args, options) {
  if (options.format === 'jpg') {
    args.push('-q:v', String(Math.min(31, Math.max(1, options.quality))))
  } else {
    args.push(
      '-c:v',
      'libwebp',
      '-quality',
      String(Math.min(100, Math.max(0, options.quality))),
      '-preset',
      'picture',
    )
  }
}

function buildFfmpegArgs(input, output, options, fromImage) {
  const args = ['-y']

  if (!fromImage && options.start > 0) {
    args.push('-ss', String(options.start))
  }

  args.push('-i', input)

  if (!fromImage) {
    args.push('-frames:v', '1', '-an')
  }

  args.push('-vf', buildVideoFilter(options), '-update', '1')
  appendEncodeArgs(args, options)
  args.push(output)
  return args
}

function probeImage(output) {
  const result = spawnSync(
    'ffprobe',
    [
      '-v',
      'error',
      '-select_streams',
      'v:0',
      '-show_entries',
      'stream=width,height,codec_name',
      '-show_entries',
      'format=size',
      '-of',
      'json',
      output,
    ],
    { encoding: 'utf8' },
  )
  if (result.status !== 0) return null
  try {
    const data = JSON.parse(result.stdout)
    const stream = data.streams?.[0]
    return {
      width: stream?.width,
      height: stream?.height,
      codec: stream?.codec_name,
      size: data.format?.size ? Number(data.format.size) : null,
    }
  } catch {
    return null
  }
}

function generateOne(input, options) {
  if (!existsSync(input)) {
    console.error(`✗ Source introuvable : ${input}`)
    return false
  }

  if (!isSupportedInput(input)) {
    const ext = extname(input).toLowerCase()
    console.error(`✗ Format non supporté (${ext}) : ${input}`)
    return false
  }

  const fromImage = isImageInput(input)
  const output = outputPathFor(input, options)
  mkdirSync(dirname(output), { recursive: true })

  console.log(`\n→ ${basename(input)} (${fromImage ? 'image' : 'vidéo'})`)
  if (fromImage) {
    console.log(
      `  cible  : ${options.format.toUpperCase()} · ≤${options.width}×${options.height}`,
    )
  } else {
    console.log(
      `  frame  : ${formatStartTime(options.start)} · ${options.format.toUpperCase()} · ≤${options.width}×${options.height}`,
    )
  }

  const result = spawnSync(
    'ffmpeg',
    buildFfmpegArgs(input, output, options, fromImage),
    { stdio: 'inherit' },
  )

  if (result.status !== 0) {
    console.error(`✗ Échec génération : ${input}`)
    return false
  }

  const after = statSync(output).size
  const meta = probeImage(output)

  console.log(`✓ ${output} — ${formatSize(after)}`)
  if (meta?.width) {
    console.log(`  sortie : ${meta.width}×${meta.height} ${meta.codec ?? ''}`)
  }
  if (after > 120 * 1024) {
    console.log('  ⚠ > 120 Ko — essaie --quality 75 ou --width 960.')
  }

  return true
}

async function promptInteractiveOptions(options) {
  const rl = createInterface({ input: stdin, output: stdout })
  try {
    const pathAnswer = await rl.question(
      'Chemin source (vidéo ou image) : ',
    )
    const path = resolvePath(pathAnswer)
    if (!path) return { path: '', options }

    if (isVideoInput(path)) {
      const startAnswer = await rl.question(
        'Frame à extraire (Entrée = 0s, ex. 2:21:14 ou 01:02:21:14) : ',
      )
      if (startAnswer.trim()) {
        options.start = parseStartTime(startAnswer)
      }
    }

    return { path, options }
  } finally {
    rl.close()
  }
}

ensureFfmpeg()

let parsed
try {
  parsed = parseArgs(process.argv.slice(2))
} catch (error) {
  console.error(`✗ ${error instanceof Error ? error.message : error}`)
  process.exit(1)
}

const { options, inputs } = parsed

if (options.help) {
  printHelp()
  process.exit(0)
}

let targets

if (inputs.length > 0) {
  targets = inputs.map(resolvePath)
} else {
  console.log(
    `Poster carte — ~30–80 Ko (${DEFAULTS.width}×${DEFAULTS.height}, WebP ou JPEG)\n`,
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
  if (!generateOne(input, options)) hadError = true
}

if (hadError) process.exit(1)

console.log('\nPoster généré.')
