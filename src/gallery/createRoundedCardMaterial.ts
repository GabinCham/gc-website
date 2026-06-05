import * as THREE from 'three'
import {
  MEDIA_FIT_GLSL,
  createMediaFitUniforms,
} from './textureFit'

/** Coins arrondis en fraction de la carte (0.05 ≈ 5 %, comme un border-radius CSS) */
export const CARD_CORNER_RADIUS = 0.04

/** Réglages du dos des cartes — flou gaussien + overlay gris */
export const CARD_BACK = {
  /** Intensité du flou · 1 = défaut · 2 = deux fois plus flou */
  blur: .7,
  /** Force de l'overlay gris · 0 = image floutée seule · 1 = gris pur */
  greyAmount: 0.55,
  /** Couleur de l'overlay gris [r, g, b] entre 0 et 1 */
  greyColor: [0.04, 0.04, 0.045] as [number, number, number],
}

const BASE_BLUR_TEXEL: [number, number] = [0.005, 0.0075]

export type CardBackUniforms = {
  uBackTexel: { value: THREE.Vector2 }
  uBackGreyMix: { value: number }
  uBackGreyColor: { value: THREE.Vector3 }
}

export function createCardBackUniforms(
  back: typeof CARD_BACK = CARD_BACK,
): CardBackUniforms {
  const [r, g, b] = back.greyColor
  return {
    uBackTexel: {
      value: new THREE.Vector2(
        BASE_BLUR_TEXEL[0] * back.blur,
        BASE_BLUR_TEXEL[1] * back.blur,
      ),
    },
    uBackGreyMix: { value: back.greyAmount },
    uBackGreyColor: { value: new THREE.Vector3(r, g, b) },
  }
}

/** Lit CARD_BACK et met à jour les uniforms du dos (live en dev) */
export function syncCardBackUniforms(uniforms: CardBackUniforms) {
  const [r, g, b] = CARD_BACK.greyColor
  uniforms.uBackTexel.value.set(
    BASE_BLUR_TEXEL[0] * CARD_BACK.blur,
    BASE_BLUR_TEXEL[1] * CARD_BACK.blur,
  )
  uniforms.uBackGreyMix.value = CARD_BACK.greyAmount
  uniforms.uBackGreyColor.value.set(r, g, b)
}

const GAUSSIAN_BLUR_HELPER = `
vec4 cardGaussianBlurH( vec2 uv, vec2 texel ) {
  vec4 result = texture2D( map, uv ) * 0.204176;
  result += texture2D( map, uv + texel * vec2( 1.407333, 0.0 ) ) * 0.176913;
  result += texture2D( map, uv - texel * vec2( 1.407333, 0.0 ) ) * 0.176913;
  result += texture2D( map, uv + texel * vec2( 3.294215, 0.0 ) ) * 0.120912;
  result += texture2D( map, uv - texel * vec2( 3.294215, 0.0 ) ) * 0.120912;
  result += texture2D( map, uv + texel * vec2( 5.181445, 0.0 ) ) * 0.055738;
  result += texture2D( map, uv - texel * vec2( 5.181445, 0.0 ) ) * 0.055738;
  return result;
}
`

const FRONT_MAP_FRAGMENT = `
#ifdef USE_MAP
  vec2 mediaUv = cardMediaUv( vMapUv, uPlaneAspect, uTexAspect, uMediaFitCover );
  vec4 sampledDiffuseColor = texture2D( map, mediaUv );

  if ( uMediaFitCover < 0.5 && !cardMediaUvInBounds( mediaUv ) ) {
    sampledDiffuseColor = vec4( uLetterboxColor, 1.0 );
  }

  #ifdef DECODE_VIDEO_TEXTURE
    sampledDiffuseColor = vec4( mix( pow( sampledDiffuseColor.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), sampledDiffuseColor.rgb * 0.0773993808, vec3( lessThanEqual( sampledDiffuseColor.rgb, vec3( 0.04045 ) ) ) ), sampledDiffuseColor.w );
  #endif
  diffuseColor *= sampledDiffuseColor;
#endif
`

const BACK_MAP_FRAGMENT = `
#ifdef USE_MAP
  vec2 mediaUv = cardMediaUv( vMapUv, uPlaneAspect, uTexAspect, uMediaFitCover );

  vec4 sampledDiffuseColor;
  if ( uMediaFitCover < 0.5 && !cardMediaUvInBounds( mediaUv ) ) {
    sampledDiffuseColor = vec4( uLetterboxColor, 1.0 );
  } else {
    vec4 blurred = vec4( 0.0 );
    blurred += cardGaussianBlurH( mediaUv + uBackTexel * vec2( 0.0, -4.0 ), uBackTexel ) * 0.016216;
    blurred += cardGaussianBlurH( mediaUv + uBackTexel * vec2( 0.0, -3.0 ), uBackTexel ) * 0.054054;
    blurred += cardGaussianBlurH( mediaUv + uBackTexel * vec2( 0.0, -2.0 ), uBackTexel ) * 0.1216216;
    blurred += cardGaussianBlurH( mediaUv + uBackTexel * vec2( 0.0, -1.0 ), uBackTexel ) * 0.1945946;
    blurred += cardGaussianBlurH( mediaUv, uBackTexel ) * 0.227027;
    blurred += cardGaussianBlurH( mediaUv + uBackTexel * vec2( 0.0, 1.0 ), uBackTexel ) * 0.1945946;
    blurred += cardGaussianBlurH( mediaUv + uBackTexel * vec2( 0.0, 2.0 ), uBackTexel ) * 0.1216216;
    blurred += cardGaussianBlurH( mediaUv + uBackTexel * vec2( 0.0, 3.0 ), uBackTexel ) * 0.054054;
    blurred += cardGaussianBlurH( mediaUv + uBackTexel * vec2( 0.0, 4.0 ), uBackTexel ) * 0.016216;
    sampledDiffuseColor = blurred;
    sampledDiffuseColor.rgb = mix(
      sampledDiffuseColor.rgb,
      uBackGreyColor,
      uBackGreyMix
    );
  }

  #ifdef DECODE_VIDEO_TEXTURE
    sampledDiffuseColor = vec4( mix( pow( sampledDiffuseColor.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), sampledDiffuseColor.rgb * 0.0773993808, vec3( lessThanEqual( sampledDiffuseColor.rgb, vec3( 0.04045 ) ) ) ), sampledDiffuseColor.w );
  #endif
  diffuseColor *= sampledDiffuseColor;
#endif
`

const ROUNDED_CORNER_DISCARD = `
      vec2 uv = vMapUv - 0.5;
      vec2 halfSize = vec2(0.5 - uCornerRadius);
      vec2 q = abs(uv) - halfSize;
      float dist = length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - uCornerRadius;
      if (dist > 0.002) discard;
      #include <dithering_fragment>
`

type RoundedCornerOptions = {
  cornerRadius: number
  extraFragmentHeader?: string
  extraUniforms?: Record<string, THREE.IUniform>
  mapFragment?: string
  blurHelper?: boolean
  mediaFit?: boolean
  cacheKey: string
}

function createRoundedCornerMaterial(
  texture: THREE.Texture,
  materialProps: THREE.MeshStandardMaterialParameters,
  options: RoundedCornerOptions,
) {
  const material = new THREE.MeshStandardMaterial({
    map: texture,
    ...materialProps,
  })

  material.onBeforeCompile = (shader) => {
    shader.uniforms.uCornerRadius = { value: options.cornerRadius }
    if (options.extraUniforms) {
      Object.assign(shader.uniforms, options.extraUniforms)
    }

    let fragmentShader = `
      uniform float uCornerRadius;
      ${options.extraFragmentHeader ?? ''}
      ${shader.fragmentShader}
    `

    if (options.mediaFit) {
      fragmentShader = fragmentShader.replace(
        '#include <map_pars_fragment>',
        `#include <map_pars_fragment>\n${MEDIA_FIT_GLSL}`,
      )
    }

    if (options.blurHelper) {
      fragmentShader = fragmentShader.replace(
        '#include <map_pars_fragment>',
        `#include <map_pars_fragment>\n${GAUSSIAN_BLUR_HELPER}`,
      )
    }

    if (options.mapFragment) {
      fragmentShader = fragmentShader.replace(
        '#include <map_fragment>',
        options.mapFragment,
      )
    }

    fragmentShader = fragmentShader.replace(
      '#include <dithering_fragment>',
      ROUNDED_CORNER_DISCARD,
    )

    shader.fragmentShader = fragmentShader
  }

  material.customProgramCacheKey = () => options.cacheKey

  return material
}

export function createRoundedCardFrontMaterial(
  texture: THREE.Texture,
  planeWidth: number,
  planeHeight: number,
  cornerRadius = CARD_CORNER_RADIUS,
  fitUniforms = createMediaFitUniforms(planeWidth, planeHeight),
) {
  const material = createRoundedCornerMaterial(
    texture,
    {
      roughness: 0.35,
      metalness: 0.05,
      side: THREE.FrontSide,
      transparent: true,
      depthWrite: true,
    },
    {
      cornerRadius,
      extraFragmentHeader: `
      uniform float uPlaneAspect;
      uniform float uTexAspect;
      uniform float uMediaFitCover;
      uniform vec3 uLetterboxColor;
    `,
      extraUniforms: fitUniforms,
      mapFragment: FRONT_MAP_FRAGMENT,
      mediaFit: true,
      cacheKey: `rounded-card-front-fit-${cornerRadius.toFixed(4)}`,
    },
  )

  material.userData.mediaFitUniforms = fitUniforms
  return material
}

export function createRoundedCardBackMaterial(
  texture: THREE.Texture,
  planeWidth: number,
  planeHeight: number,
  cornerRadius = CARD_CORNER_RADIUS,
  backUniforms = createCardBackUniforms(),
  fitUniforms = createMediaFitUniforms(planeWidth, planeHeight),
) {
  const material = createRoundedCornerMaterial(
    texture,
    {
      roughness: 0.45,
      metalness: 0.02,
      side: THREE.BackSide,
      transparent: true,
      depthWrite: true,
      polygonOffset: true,
      polygonOffsetFactor: 1,
      polygonOffsetUnits: 1,
    },
    {
      cornerRadius,
      extraFragmentHeader: `
      uniform vec2 uBackTexel;
      uniform float uBackGreyMix;
      uniform vec3 uBackGreyColor;
      uniform float uPlaneAspect;
      uniform float uTexAspect;
      uniform float uMediaFitCover;
      uniform vec3 uLetterboxColor;
    `,
      extraUniforms: { ...backUniforms, ...fitUniforms },
      mapFragment: BACK_MAP_FRAGMENT,
      blurHelper: true,
      mediaFit: true,
      cacheKey: 'rounded-card-back-v4-fit',
    },
  )

  material.userData.cardBackUniforms = backUniforms
  material.userData.mediaFitUniforms = fitUniforms

  return material
}
