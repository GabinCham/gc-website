/**
 * Configuration éditoriale — une entrée = un tour de scroll.
 *
 * - `texture` : fichier dans assets/can-textures/ (sans extension). Par défaut = `id`.
 * - `bgLeft` / `bgRight` : moitié gauche / droite du fond (hex, rgb, nom CSS…).
 * - `textLeft` / `textRight` : texte affiché de chaque côté (`\n` = retour à la ligne).
 * - `textColorLeft` / `textColorRight` : optionnel (défaut blanc).
 */
export type BrasserieCanEntry = {
  id: string
  texture?: string
  bgLeft: string
  bgRight: string
  textLeft: string
  textRight: string
  textColorLeft?: string
  textColorRight?: string
}

export const BRASSERIE_CANS_CONFIG: BrasserieCanEntry[] = [
  {
    id: 'can-1',
    bgLeft: '#8b3edf',
    bgRight: '#ffdd00',
    textLeft: 'Texte 1',
    textRight: 'Texte 2',
    textColorLeft: '#fff4e0',
    textColorRight: '#fff4e0',
  },
  {
    id: 'can-2',
    bgLeft: '#fb45a7',
    bgRight: '#7ad2e7',
    textLeft: 'Texte 1',
    textRight: 'Texte 2',
    textColorLeft: '#e8f5e9',
    textColorRight: '#e8f589',
  },
  {
    id: 'can-3',
    bgLeft: '#ff9400',
    bgRight: '#ec9ded',
    textLeft: 'Texte 1',
    textRight: 'Texte 2',
    textColorLeft: '#f3e8ff',
    textColorRight: '#f3e8ff',
  },
  {
    id: 'can-4',
    bgLeft: '#028B96',
    bgRight: '#FAC50C',
    textLeft: 'Texte 1',
    textRight: 'Texte 2',
    textColorLeft: '#fff0ee',
    textColorRight: '#fff0ee',
  },
  {
    id: 'can-5',
    bgLeft: '#2b50aa',
    bgRight: '#ff9fe5',
    textLeft: 'Texte 1',
    textRight: 'Texte 2',
    textColorLeft: '#fff0ee',
    textColorRight: '#fff0ee',
  },
]
