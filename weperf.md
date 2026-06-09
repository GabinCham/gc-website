# WebPerf — Plan d'optimisation galerie 3D

Checklist pour améliorer les temps de chargement au démarrage et lors des changements de filtre (modèles 3D + carousel).

**Contexte actuel**
- ~~GLB très lourds : `handycam.glb` (51 Mo), `90s_computer.glb` (37 Mo), `K7.glb` (9,4 Mo)~~ → **compressés à 1,1 Mo total** (étape A faite)
- `preloadVhsTape()` existe mais n'est pas appelé
- Le loader disparaît à la 1ʳᵉ frame WebGL, pas quand les assets sont prêts
- ~21 cartes visibles en parallèle (`buffer = 10`)
- Toutes les vidéos visibles se lancent en `play()` simultanément
- Changement de filtre = remontage complet des cartes

---

## Priorité 1 — Gains immédiats (fort impact)

### A. Compresser les modèles 3D (GLB)

- [x] Installer `gltf-transform` (CLI ou script npm)
  ```bash
  npm install --save-dev @gltf-transform/cli
  ```
- [x] Auditer chaque GLB (taille, textures, polygones)
  ```bash
  npx gltf-transform inspect assets/glb-original/handycam.glb
  npx gltf-transform inspect assets/glb-original/90s_computer.glb
  npx gltf-transform inspect assets/glb-original/K7.glb
  ```
  **Diagnostic** : le poids venait quasi exclusivement des textures PNG/JPEG 4096×4096 (pas des polygones).
- [x] Réduire les textures embarquées (cible : 512×512 ou 1024×1024 max)
- [x] Appliquer la compression mesh (Meshopt ou Draco)
- [x] Ré-encoder les textures en WebP ou KTX2 si possible
- [x] Objectif par fichier : **< 2 Mo** (idéal : 500 Ko – 1 Mo)
- [x] Remplacer les fichiers dans `public/` et vérifier le rendu visuel
- [x] Tester le temps de chargement avant/après (Network tab)

| Fichier | Taille actuelle | Taille cible | Taille obtenue |
|---|---|---|---|
| `handycam.glb` | 51 Mo | < 2 Mo | **667 Ko** (−98,7 %) |
| `90s_computer.glb` | 37 Mo | < 2 Mo | **174 Ko** (−99,5 %) |
| `K7.glb` | 9,4 Mo | < 2 Mo | **259 Ko** (−97,3 %) |

**Total GLB** : 97 Mo → **1,1 Mo**

#### Mesures Network tab (9 juin 2026)

**AVANT compression** — No throttling, Disable cache ✓, filtre `glb` :

| Fichier | Size (Network) | Time |
|---|---|---|
| `K7.glb` | 9 858 Ko (~9,6 Mo) | 247 ms |
| `90s_computer.glb` | 37 935 Ko (~37 Mo) | 877 ms |
| `handycam.glb` | 52 554 Ko (~51 Mo) | 1,00 s |
| **Total** | **~100 Mo** | **~2,1 s** |

**AVANT compression** — 3G throttling, `K7.glb` seul : **45,43 s** (6 723 Ko affiché)

**APRÈS compression** — `localhost:4173`, No throttling, Disable cache ✓, filtre `glb` :

| Fichier | Size (Network) | Time |
|---|---|---|
| `K7.glb` | 258 Ko | 26 ms |
| `90s_computer.glb` | 170 Ko | 19 ms |
| `handycam.glb` | 628 Ko | 34 ms |
| **Total** | **~1,06 Mo** | **~79 ms** |

**Gain** : ~100 Mo → ~1 Mo (−99 %) · temps GLB ~2,1 s → **~79 ms**

> Sur `gabinchameroy.com`, si tu vois encore les anciennes tailles : **Empty Cache and Hard Reload** (le CDN GitHub Pages peut mettre quelques minutes à se mettre à jour).

**Fichiers ajoutés / modifiés**
- `scripts/compress-glb.mjs` — script reproductible (`npm run compress:glb`)
- `assets/glb-original/` — sources non compressées (hors `public/`, non déployées)
- `src/gallery/galleryGltfLoader.ts` — loader Three.js avec décodeur Meshopt (requis pour les GLB compressés)

---

### B. Préchargement intelligent des modèles 3D

- [x] Appeler le préchargement au bon moment (après `useIdleMount`, en parallèle du lazy `GalleryScene`)
- [x] Précharger uniquement le modèle du filtre actif (`getCenterModelUrl`)
- [x] Précharger le modèle du filtre **au survol** (`onMouseEnter` + `onFocus`) des boutons
- [x] Éviter de précharger les 3 GLB d'un coup au démarrage (ancien `preloadVhsTape` supprimé)
- [ ] Vérifier que le changement `coding` → `films` est plus rapide (Network : 0 requête si survol avant clic)

**Implémentation**
- `src/gallery/preloadCenterModel.ts` — `preloadCenterModel` / `preloadCenterModelForCategory` (dédup via `Set`)
- `src/gallery/GalleryScene.tsx` — précharge le modèle quand `mode` / `category` change
- `src/App.tsx` — précharge au montage idle + survol des filtres (`fav`, `all`, `coding`, `films`, `playground`)
- `src/gallery/centerModels.ts` — URL K7 normalisée en `/glb/K7.glb`

---

### C. Corriger le signal « gallery ready »

- [ ] Remplacer `GalleryReadyNotifier` (1ʳᵉ frame ≠ assets chargés)
- [ ] Option A : ajouter `@react-three/drei` et utiliser `useProgress`
- [ ] Option B : compteur custom (textures + GLB chargés → `onReady`)
- [ ] Garder `GalleryLoader` visible tant que les assets critiques ne sont pas prêts
- [ ] Définir ce qui est « critique » : carte frontale + poster/texture + GLB centre
- [ ] Tester : le loader ne disparaît plus avant l'affichage réel

**Fichiers concernés**
- `src/gallery/GalleryScene.tsx` — `GalleryReadyNotifier`
- `src/components/GalleryLoader.tsx`
- `src/App.tsx` — `galleryReady` / `handleGalleryReady`

---

## Priorité 2 — Carousel (impact moyen)

### D. Vidéos lazy : poster d'abord, vidéo au premier plan

- [ ] Cartes **non interactives** → afficher uniquement le poster JPG (`/posters/`)
- [ ] Carte **interactive / au centre** → `VideoTexture` + `play()`
- [ ] Utiliser `isInteractive` ou la distance au slot frontal comme condition
- [ ] Pauser / détruire la vidéo quand la carte quitte le premier plan
- [ ] Vérifier : plus qu'une seule vidéo en lecture à la fois (ou 2 max)
- [ ] Tester le changement de filtre : moins de saccades, moins de bande passante

**Fichiers concernés**
- `src/gallery/CurvedCard.tsx` — `CurvedVideoCard`, `CurvedVideoCardWithPoster`
- `src/gallery/galleryTextures.ts` — `useGalleryVideoTexture`
- `src/gallery/images.ts` — `getGalleryPosterUrl`

---

### E. Réduire le buffer de slots visibles

- [ ] Passer `buffer` de `10` à `5` ou `6` dans `getVisibleSlots`
- [ ] Vérifier visuellement : pas de cartes qui « pop » en scrollant
- [ ] Ajuster si besoin selon le fog (`fog args={[22, 52]}`)

**Fichier concerné**
- `src/gallery/spiralInfinite.ts` — `getVisibleSlots`

---

### F. Préchargement des images/posters au changement de filtre

- [ ] Au **survol** d'un bouton filtre : précharger posters + images du filtre cible
- [ ] Au **clic** : les textures sont déjà en cache navigateur
- [ ] Implémenter via `new Image().src = url` ou `fetch` + cache
- [ ] Tester : changement `fav` → `coding` → `films` quasi instantané côté textures

**Fichiers concernés**
- `src/App.tsx` — boutons filtre, `selectCategory`
- `src/gallery/images.ts` — `GALLERY_ITEMS`, `filterGalleryByCategory`, `getGalleryPosterUrl`

---

## Priorité 3 — Perception & GPU

### G. Réduire le coût du Canvas WebGL

- [ ] Limiter `dpr` : `Math.min(window.devicePixelRatio, 1.5)` au lieu de `[1, 2]`
- [ ] Désactiver `antialias` sur écrans retina / mobile
- [ ] Mesurer FPS avant/après (idéal : 60 fps stable au scroll)
- [ ] Vérifier la qualité visuelle sur desktop et mobile

**Fichier concerné**
- `src/gallery/GalleryScene.tsx` — props `dpr` et `gl`

---

### H. Optimiser le chargement GLB (`prepareVhsModel`)

- [ ] Évaluer si `scene.clone(true)` est nécessaire à chaque chargement
- [ ] Mettre en cache le modèle préparé par URL (éviter re-clone au changement de filtre)
- [ ] Vérifier qu'un retour sur un filtre déjà visité est instantané

**Fichier concerné**
- `src/gallery/VhsTapeCenter.tsx` — `prepareVhsModel`, `useMemo`

---

### I. Transition douce au changement de filtre

- [ ] Éviter le reset brutal (`offsetRef = 0`, remontage immédiat)
- [ ] Garder les anciennes cartes visibles 200–300 ms pendant le chargement
- [ ] Ou fondu opacity loader → galerie
- [ ] Tester la perception : le changement paraît fluide même si le chargement prend du temps

**Fichiers concernés**
- `src/gallery/CurvedWheelGallery.tsx` — `useEffect` sur `[mode, category]`
- `src/App.tsx` — `GalleryLoader`, état de transition

---

## Priorité 4 — Bonus (optionnel)

### J. Réactiver les modèles 3D (actuellement commentés)

- [ ] Décommenter `VhsTapeCenter` dans `CurvedWheelGallery.tsx`
- [ ] Vérifier que les optimisations A + B + C sont en place avant réactivation
- [ ] Tester chaque filtre : `fav` (K7), `coding` (90s_computer), `films` (handycam)

**Fichier concerné**
- `src/gallery/CurvedWheelGallery.tsx`

---

### K. Mesures & suivi

- [ ] Noter le temps de chargement initial (Lighthouse / Network tab)
- [ ] Noter le temps de changement de filtre (avant optimisations)
- [ ] Noter le temps après chaque étape majeure
- [ ] Cible indicative :
  - Démarrage : loader < 3 s sur connexion 4G
  - Changement filtre : < 500 ms (textures) / < 1,5 s (GLB compressé)

| Métrique | Avant | Après |
|---|---|---|
| Taille totale GLB | ~100 Mo (Network) | **~1,06 Mo** (Network local) |
| K7.glb en 3G | 45,43 s | à mesurer si besoin |
| GLB tous filtres (No throttling) | ~2,1 s | **~79 ms** |
| Cartes visibles (slots) | ~21 | |
| Vidéos en lecture simultanée | ~6 | |
| Temps démarrage (4G) | | |
| Temps changement filtre | | |

---

## Ordre d'implémentation recommandé

1. [ ] **D** — Lazy video (quick win carousel, infra déjà en place)
2. [ ] **C** — Fix `onReady` / loader (meilleure perception immédiate)
3. [ ] **E** — Réduire buffer slots (5 min)
4. [ ] **F** — Préchargement au survol filtre
5. [x] **A** — Compression GLB (plus long, plus gros gain 3D)
6. [x] **B** — Préchargement GLB intelligent
7. [ ] **G** — `dpr` + antialias conditionnel
8. [ ] **H** — Cache modèle GLB préparé
9. [ ] **I** — Transition douce filtre
10. [ ] **J** — Réactiver les modèles 3D
11. [ ] **K** — Mesures finales

---

## Notes

- Les modèles 3D sont temporairement commentés dans `CurvedWheelGallery.tsx` — les étapes A/B/C peuvent être faites avant réactivation.
- `vhs_tape.glb` (8,9 Mo) et `90s_computer_2.glb` (5 Mo) existent dans `public/` mais ne sont pas utilisés — à supprimer ou compresser si inutiles.
- Pas besoin d'ajouter `@react-three/drei` si l'option B (compteur custom) suffit pour `useProgress`.
