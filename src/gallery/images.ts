export type GalleryMediaType = 'image' | 'video'

export type GalleryCategory = 'fav' | 'coding' | 'films' | 'playground'

/** Couleurs du fond — à ajuster à la pipette depuis chaque visuel */
export type GalleryBackgroundColors = {
  /** Spot lumineux principal */
  accent: string
  /** Base sombre */
  base: string
  /** Contre-jour / secondaire (optionnel, défaut = accent) */
  glow?: string
  /** Fond profond (optionnel, défaut = base) */
  deep?: string
}

export type GalleryProjectDetails = {
  year?: string
  role?: string
  highlights?: string[]
  longDescription?: string
}

export type GalleryItem = {
  id: string
  /** Ordre affiché dans la vue simple (plus petit = plus haut). */
  simpleOrder?: number
  url: string
  alt: string
  title: string
  description: string
  category: Exclude<GalleryCategory, 'fav'>
  /** Affiché dans le filtre favoris (♥) */
  favorite?: boolean
  /** Lien externe (CTA sur la page projet) */
  href?: string
  /** Contenu enrichi pour la page détail */
  details?: GalleryProjectDetails
  /**
   * Optionnel — déduit automatiquement depuis l’extension
   * (.jpg, .png, .webp… → image ; .mp4, .webm → video).
   */
  mediaType?: GalleryMediaType
  /** Image affichée au dos des cartes vidéo (déduit depuis l’URL si absent). */
  posterUrl?: string
  backgroundColors: GalleryBackgroundColors
}

/** Raccourci pour déclarer les couleurs de fond */
export function bg(
  accent: string,
  base: string,
  glow?: string,
  deep?: string,
): GalleryBackgroundColors {
  return { accent, base, glow, deep }
}

export function buildBackgroundGradient(colors: GalleryBackgroundColors): string {
  const glow = colors.glow ?? colors.accent
  const deep = colors.deep ?? colors.base

  return [
    `radial-gradient(ellipse 130% 110% at 8% -5%, color-mix(in srgb, ${colors.accent} 82%, transparent) 0%, transparent 52%)`,
    `radial-gradient(ellipse 95% 85% at 92% 105%, color-mix(in srgb, ${glow} 72%, transparent) 0%, transparent 48%)`,
    `radial-gradient(circle at 55% 45%, color-mix(in srgb, ${colors.accent} 28%, transparent) 0%, transparent 62%)`,
    `linear-gradient(155deg, ${colors.base} 0%, ${deep} 100%)`,
  ].join(', ')
}

export function getGalleryItemBackgroundGradient(item: GalleryItem): string {
  return buildBackgroundGradient(item.backgroundColors)
}

export function filterGalleryByCategory(
  items: GalleryItem[],
  category: GalleryCategory | null,
): GalleryItem[] {
  if (!category) return items
  if (category === 'fav') return items.filter((item) => item.favorite === true)
  return items.filter((item) => item.category === category)
}

export function sortGalleryForSimpleList(items: GalleryItem[]): GalleryItem[] {
  return [...items].sort((a, b) => {
    const aPlaygroundRank = a.category === 'playground' ? 1 : 0
    const bPlaygroundRank = b.category === 'playground' ? 1 : 0
    if (aPlaygroundRank !== bPlaygroundRank) return aPlaygroundRank - bPlaygroundRank

    const aOrder = a.simpleOrder ?? Number.POSITIVE_INFINITY
    const bOrder = b.simpleOrder ?? Number.POSITIVE_INFINITY
    if (aOrder !== bOrder) return aOrder - bOrder

    const aId = Number(a.id)
    const bId = Number(b.id)
    if (Number.isFinite(aId) && Number.isFinite(bId)) return aId - bId
    return a.id.localeCompare(b.id, 'fr', { sensitivity: 'base' })
  })
}

function galleryItem(
  id: string,
  url: string,
  title: string,
  description: string,
  options: {
    category: Exclude<GalleryCategory, 'fav'>
    simpleOrder?: number
    href?: string
    mediaType?: GalleryMediaType
    posterUrl?: string
    colors?: GalleryBackgroundColors
    alt?: string
    favorite?: boolean
    details?: GalleryProjectDetails
  },
): GalleryItem {
  return {
    id,
    url,
    alt: options.alt ?? title,
    title,
    description,
    category: options.category,
    simpleOrder: options.simpleOrder,
    favorite: options.favorite,
    href: options.href,
    mediaType: options.mediaType,
    posterUrl: options.posterUrl,
    details: options.details,
    backgroundColors: options.colors ?? bg('#2a2840', '#0a0a0f'),
  }
}

const CATEGORY_LABELS: Record<Exclude<GalleryCategory, 'fav'>, string> = {
  coding: 'Développement',
  films: 'Film',
  playground: 'Playground',
}

export function getGalleryCategoryLabel(
  category: Exclude<GalleryCategory, 'fav'>,
): string {
  return CATEGORY_LABELS[category]
}

const VIDEO_EXTENSIONS = ['.mp4', '.webm'] as const

export function getGalleryMediaType(
  item: Pick<GalleryItem, 'url' | 'mediaType'>,
): GalleryMediaType {
  if (item.mediaType) return item.mediaType

  const lower = item.url.split(/[?#]/)[0]?.toLowerCase() ?? ''
  if (VIDEO_EXTENSIONS.some((ext) => lower.endsWith(ext))) {
    return 'video'
  }

  return 'image'
}

/** Chemin du poster dans `/public/posters` pour une entrée vidéo. */
export function getGalleryPosterUrl(
  item: Pick<GalleryItem, 'url' | 'mediaType' | 'posterUrl'>,
): string | null {
  if (item.posterUrl) return item.posterUrl
  if (getGalleryMediaType(item) !== 'video') return null

  const path = item.url.split(/[?#]/)[0] ?? ''
  const filename = path.replace(/^.*\//, '')
  const base = filename
    .replace(/_reduce\.(mp4|webm)$/i, '')
    .replace(/_compress\.(mp4|webm)$/i, '')
    .replace(/\.(mp4|webm)$/i, '')
  if (!base) return null

  return `/posters/${base}_poster.jpg`
}

/** @deprecated Utiliser GalleryItem */
export type GalleryImage = GalleryItem

/**
 * Contenu de la galerie — une entrée = image, .mp4 ou .webm.
 * `backgroundColors` alimente le dégradé de fond quand l’item est au premier plan.
 */
export const GALLERY_ITEMS: GalleryItem[] = [
 
  galleryItem('18', '/jahia.webp', 'Jahia', 'Intégration front-end et création du site Jahia.', {
    category: 'coding',
    href: 'https://www.jahia.com/fr',
    // simpleOrder: 1,
    favorite: false,
    colors: bg('#0e0053', '#4a3a96', '#057cc3', '#4a3a96'),
    details: {
      year: '2024 - 2025',
      role: 'Intégration front-end · Création du site',
      highlights: [
        'Développement et intégration du site complet',
        'Mise en production des parcours et composants',
        'Collaboration étroite avec les équipes produit',
      ],
      longDescription:
        'Projet d’intégration bout en bout : j’ai conçu et développé l’ensemble du site Jahia, des gabarits aux interactions, pour livrer une expérience cohérente, performante et fidèle aux maquettes.',
    },
  }),
  galleryItem('19', '/videos/peugeot_reduce.webm', 'Peugeot', 'Intégration IHM pour les marques Stellantis.', {
    category: 'coding',
    simpleOrder: 1,
    href: 'https://www.peugeot.fr/nos-vehicules/peugeot-3008/electrique.html',
    favorite: true,
    colors: bg('#612548', '#1c1c38', '#3a6a30', '#84889b'),
    details: {
      year: '2022 - 2023',
      role: 'Intégration IHM · Pixel perfect',
      highlights: [
        'Interfaces pour Peugeot, DS, Citroën, Jeep et Opel',
        'Intégration rigoureuse au pixel près des maquettes',
        'Travail main dans la main avec design et direction artistique',
      ],
      longDescription:
        'Intégration des interfaces embarquées pour plusieurs marques du groupe. Un travail de précision, en étroite collaboration avec les designers et la direction artistique, pour garantir une restitution fidèle et une expérience homogène à l’échelle de chaque véhicule.',
    },
  }),
  galleryItem('20', '/videos/4mains_reduce.webm', '4 Mains', 'Mini-documentaire sur une collaboration entre deux chefs.', {
    category: 'films',
    simpleOrder: 3,
    favorite: true,
    colors: bg('#97010a', '#788a85', '#788a85', '#97010a'),
    details: {
      year: '2026',
      role: 'Réalisation · Film documentaire',
      highlights: [
        'Immersion dans les coulisses d’une collaboration artistique',
        'Direction photo et narration du geste culinaire',
        'Format court, rythme sensible et authentique',
      ],
      longDescription:
        'Réalisation d’un mini-documentaire qui suit les coulisses d’une collaboration entre deux chefs. Un regard intime sur le processus créatif, la matière et l’échange.',
    },
  }),
  galleryItem(
    '21',
    '/videos/dyson-gabin-chameroy_reduce.webm',
    'Dyson',
    'Création d’images pour le lancement Airwrap — Dyson France.',
    {
      category: 'films',
      simpleOrder: 2,
      href: 'https://vimeo.com/940734425',
      favorite: true,
      colors: bg('#CC3277', '#A25925', '#CC3277', '#737C82'),
      details: {
        year: '2023',
        role: 'Direction artistique · Production visuelle',
        highlights: [
          'Visuels pour le nouveau Dyson Airwrap',
          'Mise en scène produit pour Dyson France',
          'Esthétique soignée, lumière et matière travaillées',
        ],
        longDescription:
          'Production d’images pour Dyson France à l’occasion du lancement du nouvel Airwrap. Une direction visuelle centrée sur le produit, sa finition et son usage, au service d’une campagne claire et premium.',
      },
    },
  ),
  galleryItem('22', '/videos/greenhotels-home_reduce.webm', 'Green Hôtels', 'Refonte du site et création des maquettes.', {
    category: 'coding',
    simpleOrder: 5,
    href: 'https://greenhotels.fr/',
    colors: bg('#bcb6a8', '#020602', '#1D3B27', '#020602'),
    details: {
      year: '2025',
      role: 'Design · Développement front-end',
      highlights: [
        'Conception des maquettes et de l’expérience utilisateur',
        'Réalisation et intégration du nouveau site',
        'Univers visuel aligné sur l’hospitalité durable',
      ],
      longDescription:
        'Refonte complète de la présence digitale Green Hôtels : création des maquettes, définition des parcours, puis développement du site. Un projet qui lie design et intégration pour porter une marque engagée et accueillante.',
    },
  }),
  galleryItem('23', '/videos/guerlain-home_reduce.webm', 'Guerlain', 'Évolutions produit, correctifs et refonte sur le site Guerlain.', {
    category: 'coding',
    simpleOrder: 4,
    favorite: false,
    href: 'https://www.guerlain.com/fr/fr-fr',
    colors: bg('#750933', '#f3a527', '#C8A97E', '#492f25'),
    details: {
      year: '2025 - 2026',
      role: 'Front-end · Maintenance & évolutions',
      highlights: [
        'Correction de bugs et stabilisation du site',
        'Développement de nouvelles fonctionnalités',
        'Refonte et revamping de sections clés',
      ],
      longDescription:
        'Intervention sur le site Guerlain : résolution de bugs, livraison de nouvelles features et refonte de pages dans l’esprit premium de la maison. Un travail d’évolution continue, exigeant sur la qualité et la fidélité à la charte.',
    },
  }),
  galleryItem('26', '/posters/brasserie.png', 'Brasserie', 'Landing scroll — canette 3D et narration au défilement.', {
    category: 'playground',
    simpleOrder: 7,
    favorite: false,
    href: '/brasserie',
    colors: bg('#c9a227', '#1a1208', '#e8d5a3', '#0d0906'),
    details: {
      year: '2026',
      role: 'Front-end · 3D · Landing',
      highlights: [
        'Intégration du modèle can.glb en WebGL',
        'Rotation au scroll et fond qui évolue à chaque tour',
        'Textes latéraux synchronisés avec la narration',
      ],
      longDescription:
        'Landing immersive pour la Brasserie : une canette 3D au centre, qui tourne sur elle-même au scroll. À chaque rotation complète, le fond change de couleur et les textes gauche / droite racontent une nouvelle étape.',
    },
  }),
  galleryItem(
    '27',
    '/posters/quedesnumeros10.png',
    'FIFA WORLD CUP 2026',
    'Expérience interactive autour du numéro 10 et la Coupe du Monde 2026.',
    {
      category: 'playground',
      simpleOrder: 8,
      favorite: false,
      href: '/quedesnumeros10',
      colors: bg('#f5c518', '#0a1628', '#1a5f2a', '#051018'),
      details: {
        year: '2026',
        role: 'Front-end · Playground · Interaction',
        highlights: [
          'Exploration des numéros 10 de la Coupe du Monde 2026',
          'Interface ludique autour de la compétition 2026',
          'Expérience web dédiée',
        ],
        longDescription:
          'Playground autour de la FIFA World Cup 2026 : une expérience interactive qui met en lumière le mythique numéro 10 — joueurs, maillots et moments de légende.',
      },
    },
  ),
  galleryItem('25', '/videos/drmarteens_reduce.webm', 'Dr. Martens', 'Exploration créative autour de la marque.', {
    category: 'coding',
    simpleOrder: 9,
    favorite: true,
    href: '/marteens',
    colors: bg('#9ec8ee', '#7f2e26', '#1590ff', '#560a0c'),
    details: {
      year: '2026',
      role: 'Playground · Direction créative',
      highlights: [
        'Concept libre, réalisé pour le plaisir',
        'Exploration graphique de l’univers Dr. Martens',
        'Mise en scène de l’icône sans contrainte client',
      ],
      longDescription:
        'Une exploration créative autour de Dr. Martens, entre héritage punk et mise en scène contemporaine. L’occasion d’expérimenter sans brief, avec liberté totale.',
    },
  }),
]

/** @deprecated Utiliser GALLERY_ITEMS */
export const GALLERY_IMAGES = GALLERY_ITEMS
