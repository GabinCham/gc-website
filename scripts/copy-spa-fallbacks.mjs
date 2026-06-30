/**
 * GitHub Pages sert des fichiers statiques : /brasserie n’existe pas sans
 * brasserie/index.html ou 404.html. À garder aligné avec STANDALONE_PAGES dans src/main.tsx.
 */
import { cpSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const distDir = join(__dirname, '..', 'dist')
const indexPath = join(distDir, 'index.html')

const SPA_ROUTES = ['brasserie', 'quedesnumeros10']

const indexHtml = readFileSync(indexPath, 'utf8')

writeFileSync(join(distDir, '404.html'), indexHtml)

for (const route of SPA_ROUTES) {
  const routeDir = join(distDir, route)
  mkdirSync(routeDir, { recursive: true })
  cpSync(indexPath, join(routeDir, 'index.html'))
}

console.log(`SPA fallbacks: 404.html + ${SPA_ROUTES.map((r) => `${r}/index.html`).join(', ')}`)
