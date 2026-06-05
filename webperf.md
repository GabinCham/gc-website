État actuel (chiffres du projet)
Ressource	Taille approx.
JS bundle (dist/assets/index-*.js)
~1,6 Mo (tout en un seul chunk)
MP3 (Guided Levitation…)
12 Mo
Vidéos WebM (6 fichiers actifs)
~34 Mo (dont drmarteens.webm 17 Mo, peugeot.webm 7 Mo)
jahia.png
1,8 Mo
Fichier mort sample.webm
6,4 Mo (non référencé dans le code)
Au premier chargement, le navigateur peut donc tirer ~50 Mo+ de médias, en plus de Three.js + R3F + drei d’un coup.

1. Médias — le plus gros levier (LCP, bande passante, mémoire GPU)
Vidéos WebM
Ré-encoder chaque .webm : résolution max ~720p (suffisant pour des cartes 3D), bitrate vidéo modéré, durée tronquée si ce sont des loops.
Cible réaliste : 200–800 Ko/s selon la complexité ; drmarteens et peugeot sont les priorités.
Fournir un poster (WebP/AVIF ~30–80 Ko) et ne monter la vidéo que quand la carte est proche / au premier plan.
Image jahia.png
Passer en WebP/AVIF (~150–300 Ko) ; 1,8 Mo pour une texture de carte est excessif.
Audio
Implémenté :

preload="none" jusqu’au premier geste (pointer / clavier) ou clic play ; le MP3 ne charge qu’ensuite.
Waveform pré-calculée : `public/Guided Levitation - Ostensible Figure.waveform.json` (~1 Ko), régénérée via `npm run generate:audio` (prebuild).
Variante web : `Guided Levitation - Ostensible Figure.web.mp3` (audio seul, VBR LAME q=4, ~5 Mo) — master 12 Mo conservé pour la regénération.
Nettoyage
Supprimer ou ne pas déployer public/sample.webm (6,4 Mo inutiles).
2. Vidéos 3D — ne pas faire tourner 6 flux en parallèle
En mode simple, tu rends tous les projets → 6 useVideoTexture actifs en même temps.

En mode all, getVisibleSlots garde un buffer de ±10 slots (~21 cartes). Avec 7 items, tu peux encore avoir plusieurs instances de chaque vidéo en mémoire.


spiralInfinite.ts
Lines 50-59
export function getVisibleSlots(offset: number, total: number) {
  const center = Math.floor(offset)
  const buffer = Math.max(10, Math.ceil(total * 0.55))
  // ...
}
Pistes :

Une seule vidéo “active” : texture vidéo partagée ou swap quand la carte devient frontale ; les autres = poster statique.
Réduire le buffer (ex. ±3–4) quand total est petit.
video.pause() + src="" quand la carte sort du viewport visible.
Lazy : ne pas utiliser useVideoTexture tant que l’item n’est pas dans les N slots les plus proches du front.
3. Bundle JavaScript (~1,6 Mo) — chargement initial
Aujourd’hui tout part dans un seul entry : React 19 + Three + Fiber + une grosse partie de drei (dont Environment).


App.tsx
Lines 1-7
import { GalleryScene } from './gallery/GalleryScene'
Recommandations :

React.lazy + Suspense pour GalleryScene (et éventuellement AudioPlayer) : le HTML/CSS/logo s’affichent avant WebGL.
manualChunks dans Vite : three, @react-three/fiber, @react-three/drei.
Imports ciblés : import * as THREE partout limite le tree-shaking ; préférer des imports nommés là où c’est possible.
Auditer drei : Environment preset="city" charge une HDR + IBL — coût réseau et GPU non négligeable pour un fond déjà en CSS gradient.

CurvedWheelGallery.tsx
Lines 122-123
      <Suspense fallback={null}>
        <Environment preset="city" />
Si l’éclairage ambiant + 2 directionalLight suffisent visuellement, retirer Environment est souvent un gros gain pour peu de perte visuelle.

4. WebGL / runtime — fluidité (INP, FPS)

GalleryScene.tsx
Lines 33-39
    <Canvas
      shadows
      gl={{ antialias: true, alpha: true }}
      dpr={[1, 2]}
shadows : désactiver si l’effet est subtil sur des cartes “flat” courbées.
dpr={[1, 1.5]} ou Math.min(devicePixelRatio, 1.5) sur mobile.
antialias: false + FXAA optionnel si besoin (souvent acceptable sur textures vidéo).
powerPreference: 'high-performance' sur mobile quand supporté.
Re-renders React coûteux

CurvedWheelGallery.tsx
Lines 82-85
    if (frame.current % 2 === 0) {
      setTick((t) => t + 1)
    }
setTick toutes les 2 frames force des useMemo + re-map de toutes les cartes en React. Mieux : garder offset dans un ref et ne recalculer les slots visibles que quand le centre change (entier), ou pousser le layout entièrement côté Three (refs), sans useState par frame.

Shaders / géométrie
Dos de carte avec blur custom × 2 meshes par carte × N cartes visibles = charge fragment shader élevée.
Segments de courbure 28 : tester 16–20 si la courbe reste lisse.
5. Build & livraison (Vite minimal aujourd’hui)

vite.config.ts
Lines 5-7
export default defineConfig({
  plugins: [react()],
})
À ajouter :

Compression Brotli/gzip côté hébergeur (ou plugin vite-plugin-compression).
Headers cache longue durée sur /assets/* et médias versionnés.
build.rollupOptions.output.manualChunks pour paralléliser le téléchargement.
Optionnel : analyse (rollup-plugin-visualizer) pour voir ce que drei embarque vraiment.
6. HTML / réseau / UX perçue
index.html est très minimal : pas de preconnect, pas de police optimisée, pas de shell de chargement.

Skeleton (logo + fond) avant le chunk Three.
fetchpriority="high" sur ux_blanc.svg (petit, above-the-fold).
font-display: swap si tu ajoutes des polices custom.
Service worker seulement si tu caches intelligemment les médias (sinon risque de gonfler le cache avec 50 Mo).
7. Mesure — sans ça, tu optimises à l’aveugle
Lighthouse (mobile, throttling) sur la preview prod.
Chrome Performance : Main thread, GPU, nombre de décoders vidéo.
Network : waterfall au cold load — tu devrais voir MP3 + plusieurs WebM partir trop tôt.
Cible réaliste pour un portfolio 3D : LCP < 2,5 s, JS initial < 300–400 Ko gzip (hors WebGL chunk lazy), médias progressifs.
Ordre d’action que je ferais sur ton projet
Compresser / réencoder toutes les WebM + MP3 ; WebP pour jahia ; supprimer sample.webm.
Une vidéo active à la fois + posters ; réduire getVisibleSlots pour petits catalogues.
Audio : preload="none" + peaks pré-calculés (plus de double decode).
Retirer ou remplacer Environment ; couper shadows / baisser dpr sur mobile.
Code-split galerie 3D ; corriger le setTick par frame.
Vite : chunks + cache + compression.
C’est un site expérientiel (WebGL + vidéos + audio) : l’objectif n’est pas d’atteindre 100 Lighthouse, mais de ne plus télécharger 50 Mo au premier paint et de ne pas faire tourner 6 décodeurs vidéo en parallèle. C’est là que tu gagneras le plus.

Si tu veux, on peut enchaîner sur une implémentation concrète (par ex. lazy-load de la galerie + stratégie vidéo unique + fix du setTick).

Le build de prod s’est terminé correctement (~40 s).

Bundle : index-tqQHvd9f.js ≈ 1,66 Mo (≈ 479 Ko gzip) + CSS ≈ 4,3 Ko. Vite signale un chunk unique > 500 Ko — le code-splitting reste pertinent.

Médias dans public/ : ~55 Mo au total, surtout le MP3 (12 Mo), drmarteens.webm (17 Mo), peugeot.webm (7 Mo), jahia.png (1,8 Mo), et sample.webm (6,4 Mo) qui n’est pas utilisé dans le code.

Ces chiffres confirment l’analyse webperf précédente : le goulot principal est le poids des médias et le JS monolithique, pas le CSS.