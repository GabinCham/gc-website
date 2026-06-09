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

export type GalleryItem = {
  id: string
  url: string
  alt: string
  title: string
  description: string
  category: Exclude<GalleryCategory, 'fav'>
  /** Affiché dans le filtre favoris (♥) */
  favorite?: boolean
  /** Lien ouvert au clic quand la carte est face à nous */
  href?: string
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

function galleryItem(
  id: string,
  url: string,
  title: string,
  description: string,
  options: {
    category: Exclude<GalleryCategory, 'fav'>
    href?: string
    mediaType?: GalleryMediaType
    colors?: GalleryBackgroundColors
    alt?: string
    favorite?: boolean
  },
): GalleryItem {
  return {
    id,
    url,
    alt: options.alt ?? title,
    title,
    description,
    category: options.category,
    favorite: options.favorite,
    href: options.href,
    mediaType: options.mediaType,
    backgroundColors: options.colors ?? bg('#2a2840', '#0a0a0f'),
  }
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
  // galleryItem('01', 'https://picsum.photos/seed/gc-01/800/1000', 'Gallery 01', {
  //   colors: bg('#4a3a7a', '#0e0c18', '#2a5080', '#06050a'),
  // }),
  // galleryItem('02', 'https://picsum.photos/seed/gc-02/800/1000', 'Gallery 02', {
  //   colors: bg('#1f6b6b', '#081214', '#2a8a9a', '#040809'),
  // }),
  // galleryItem('03', 'https://picsum.photos/seed/gc-03/800/1000', 'Gallery 03', {
  //   colors: bg('#8a3a5a', '#140a10', '#6a2848', '#080408'),
  // }),
  // galleryItem('04', 'https://picsum.photos/seed/gc-04/800/1000', 'Gallery 04', {
  //   colors: bg('#3a6a3a', '#0a120a', '#2a5a4a', '#050805'),
  // }),
  // galleryItem('05', 'https://picsum.photos/seed/gc-05/800/1000', 'Gallery 05', {
  //   colors: bg('#7a5a2a', '#121008', '#5a4018', '#080604'),
  // }),
  // galleryItem('06', 'https://picsum.photos/seed/gc-06/800/1000', 'Gallery 06', {
  //   colors: bg('#2a5a8a', '#0a1018', '#3a7aaa', '#050810'),
  // }),
  // galleryItem('07', 'https://picsum.photos/seed/gc-07/800/1000', 'Gallery 07', {
  //   colors: bg('#6a3a8a', '#100a14', '#4a2a6a', '#070408'),
  // }),
  // galleryItem('08', 'https://picsum.photos/seed/gc-08/800/1000', 'Gallery 08', {
  //   colors: bg('#8a4a3a', '#140c0a', '#6a3828', '#080504'),
  // }),
  // galleryItem('09', 'https://picsum.photos/seed/gc-09/800/1000', 'Gallery 09', {
  //   colors: bg('#3a7a7a', '#0a1414', '#2a5a5a', '#050808'),
  // }),
  // galleryItem('10', 'https://picsum.photos/seed/gc-10/800/1000', 'Gallery 10', {
  //   colors: bg('#5a4a8a', '#0c0a14', '#3a306a', '#060408'),
  // }),
  // galleryItem('11', 'https://picsum.photos/seed/gc-11/800/1000', 'Gallery 11', {
  //   colors: bg('#4a8a5a', '#0a140c', '#2a6a4a', '#050805'),
  // }),
  // galleryItem('12', 'https://picsum.photos/seed/gc-12/800/1000', 'Gallery 12', {
  //   colors: bg('#8a6a3a', '#141008', '#6a5028', '#080604'),
  // }),
  // galleryItem('13', 'https://picsum.photos/seed/gc-13/800/1000', 'Gallery 13', {
  //   colors: bg('#3a4a8a', '#0a0c14', '#2a386a', '#050610'),
  // }),
  // galleryItem('14', 'https://picsum.photos/seed/gc-14/800/1000', 'Gallery 14', {
  //   colors: bg('#8a3a6a', '#140a10', '#6a2850', '#080408'),
  // }),
  // galleryItem('15', 'https://picsum.photos/seed/gc-15/800/1000', 'Gallery 15', {
  //   colors: bg('#2a7a5a', '#0a120e', '#1a5a40', '#050806'),
  // }),
  // galleryItem('16', 'https://picsum.photos/seed/gc-16/800/1000', 'Gallery 16', {
  //   colors: bg('#7a3a3a', '#140808', '#5a2828', '#080404'),
  // }),
  // galleryItem('17', 'https://picsum.photos/seed/gc-17/800/1000', 'Gallery 17', {
  //   colors: bg('#4a6a8a', '#0a1014', '#3a5070', '#050810'),
  // }),
  galleryItem('18', '/jahia.webp', 'Jahia', 'Direction artistique et expérience digitale.', {
    category: 'coding',
    favorite: false,
    colors: bg('#0e0053', '#4a3a96', '#057cc3', '#4a3a96'),
  }),
  galleryItem('19', '/videos/peugeot_reduce.webm', 'Peugeot', 'Site vitrine et motion design automobile.', {
    category: 'coding',
    favorite: true,
    colors: bg('#612548', '#1c1c38', '#3a6a30', '#84889b'),
  }),
  galleryItem('20', '/videos/4mains_reduce.webm', '4 Mains', 'Identité visuelle et site e-commerce.', {
    category: 'films',
    favorite: true,
    colors: bg('#97010a', '#788a85', '#788a85', '#97010a'),
  }),
  galleryItem(
    '21',
    '/videos/dyson-gabin-chameroy_reduce.webm',
    'Dyson',
    'Concept UX et interface produit connecté.',
    {
      category: 'films',
      favorite: true,
      colors: bg('#CC3277', '#A25925', '#CC3277', '#737C82'),
    },
  ),
  galleryItem('22', '/videos/greenhotels-home_reduce.webm', 'Green Hotels', 'Plateforme hôtelière durable et immersive.', {
    category: 'coding',
    colors: bg('#bcb6a8', '#020602', '#1D3B27', '#020602'),
  }),
  galleryItem('23', '/videos/guerlain-home_reduce.webm', 'Guerlain', 'Expérience premium et storytelling de marque.', {
    category: 'coding',
    favorite: false,
    colors: bg('#750933', '#f3a527', '#C8A97E', '#492f25'),
  }),
  galleryItem('25', '/videos/drmarteens_reduce.webm', 'Dr. Martens', 'Direction créative et univers de marque.', {
    category: 'coding',
    favorite: true,
    colors: bg('#9ec8ee', '#7f2e26', '#1590ff', '#560a0c'),
  }),
]

/** @deprecated Utiliser GALLERY_ITEMS */
export const GALLERY_IMAGES = GALLERY_ITEMS
