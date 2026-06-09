/**
 * Compresse les modèles 3D de la galerie (textures WebP 1024 + meshopt).
 * Sources : assets/glb-original/ → sortie : public/
 */
import { spawnSync } from 'node:child_process'
import { existsSync, mkdirSync, statSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')
const originalsDir = join(root, 'assets', 'glb-original')

const MODELS = [
  { source: 'handycam.glb', output: 'public/glb/handycam.glb' },
  { source: '90s_computer.glb', output: 'public/glb/90s_computer.glb' },
  { source: 'K7.glb', output: 'public/glb/K7.glb' },
]

const TEXTURE_SIZE = 1024

function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

function runOptimize(input, output) {
  const result = spawnSync(
    'npx',
    [
      'gltf-transform',
      'optimize',
      input,
      output,
      '--texture-compress',
      'webp',
      '--texture-size',
      String(TEXTURE_SIZE),
      '--compress',
      'meshopt',
    ],
    { cwd: root, stdio: 'inherit' },
  )

  if (result.status !== 0) {
    throw new Error(`Échec compression: ${input}`)
  }
}

mkdirSync(originalsDir, { recursive: true })

let hadError = false

for (const { source, output } of MODELS) {
  const input = join(originalsDir, source)
  const out = join(root, output)

  if (!existsSync(input)) {
    console.error(`✗ Source introuvable: ${input}`)
    console.error('  Place les GLB non compressés dans assets/glb-original/')
    hadError = true
    continue
  }

  mkdirSync(dirname(out), { recursive: true })

  const before = statSync(input).size
  console.log(`\n→ ${source} (${formatSize(before)})`)
  runOptimize(input, out)
  const after = statSync(out).size
  const ratio = ((1 - after / before) * 100).toFixed(1)
  console.log(`✓ ${output} — ${formatSize(after)} (−${ratio}%)`)
}

if (hadError) {
  process.exit(1)
}

console.log('\nCompression terminée.')
