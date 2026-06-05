# GC Website — Curved Wheel Gallery

Galerie 3D interactive (React Three Fiber) avec cartes courbées en spirale ou en grille, inspirée d’un wheel gallery horizontal/vertical.

## Démarrage

```bash
npm install
npm run dev
```

Ouvre [http://localhost:5173](http://localhost:5173).

## Contrôles

- **Molette verticale** — défile la spirale / la liste
- **Molette horizontale** ou **Shift + molette** — rotation horizontale (mode spiral)
- **Glisser** — même effet avec inertie

## Personnalisation

- Images : `src/gallery/images.ts` (remplace les URLs Picsum par tes fichiers dans `public/`)
- Disposition : `src/gallery/layouts.ts` (rayon, hauteur, tours de la spirale, grille list)
- Courbure des cartes : `src/gallery/createCurvedPlane.ts`

## Build production

```bash
npm run build
npm run preview
```

Le dossier `dist/` est prêt à être déployé sur ton serveur.
