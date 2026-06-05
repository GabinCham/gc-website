/**
 * Génère la waveform (48 peaks) et une variante MP3 web depuis le master.
 * Nécessite ffmpeg sur le PATH.
 */
import { spawn } from 'node:child_process'
import { existsSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const BAR_COUNT = 48
const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')
const publicDir = join(root, 'public')
const masterName = 'Guided Levitation - Ostensible Figure.mp3'
const masterPath = join(publicDir, masterName)
const waveformPath = join(publicDir, masterName.replace(/\.mp3$/i, '.waveform.json'))
const webPath = join(publicDir, masterName.replace(/\.mp3$/i, '.web.mp3'))

function decodePeaksToStdout(inputPath) {
  return new Promise((resolve, reject) => {
    const chunks = []
    const proc = spawn(
      'ffmpeg',
      ['-i', inputPath, '-ac', '1', '-ar', '8000', '-f', 'f32le', '-'],
      { stdio: ['ignore', 'pipe', 'inherit'] },
    )
    proc.stdout.on('data', (chunk) => chunks.push(chunk))
    proc.on('error', reject)
    proc.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`ffmpeg decode exited ${code}`))
        return
      }

      const buf = Buffer.concat(chunks)
      const sampleCount = Math.floor(buf.length / 4)
      const data = new Float32Array(
        buf.buffer,
        buf.byteOffset,
        sampleCount,
      )

      const blockSize = Math.floor(data.length / BAR_COUNT)
      const peaks = []

      for (let i = 0; i < BAR_COUNT; i++) {
        let max = 0
        const start = i * blockSize
        for (let j = 0; j < blockSize; j++) {
          max = Math.max(max, Math.abs(data[start + j] ?? 0))
        }
        peaks.push(max)
      }

      const peakMax = Math.max(...peaks, 0.001)
      resolve(peaks.map((p) => p / peakMax))
    })
  })
}

async function generateWaveform() {
  const peaks = await decodePeaksToStdout(masterPath)
  writeFileSync(
    waveformPath,
    JSON.stringify({ barCount: BAR_COUNT, peaks }),
  )
  console.log(`waveform → ${waveformPath} (${peaks.length} peaks)`)
}

async function generateWebMp3() {
  await new Promise((resolve, reject) => {
    const proc = spawn(
      'ffmpeg',
      [
        '-y',
        '-i',
        masterPath,
        '-map',
        '0:a:0',
        '-vn',
        '-codec:a',
        'libmp3lame',
        '-q:a',
        '4',
        webPath,
      ],
      { stdio: 'inherit' },
    )
    proc.on('error', reject)
    proc.on('close', (code) =>
      code === 0 ? resolve() : reject(new Error(`ffmpeg compress exited ${code}`)),
    )
  })
  console.log(`web mp3 → ${webPath}`)
}

async function main() {
  if (!existsSync(masterPath)) {
    console.error(`Missing master: ${masterPath}`)
    process.exit(1)
  }

  await generateWaveform()
  await generateWebMp3()
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
