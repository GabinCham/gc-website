import * as THREE from 'three'

/** Comme CSS object-fit — `cover` remplit la carte (recadre), `contain` montre tout le média */
export type CardMediaFit = 'cover' | 'contain'

export const CARD_MEDIA_FIT: CardMediaFit = 'cover'

const DEFAULT_LETTERBOX: [number, number, number] = [0.04, 0.04, 0.045]

export type MediaFitUniforms = {
  uPlaneAspect: { value: number }
  uTexAspect: { value: number }
  /** 1 = cover · 0 = contain */
  uMediaFitCover: { value: number }
  uLetterboxColor: { value: THREE.Vector3 }
}

export function createMediaFitUniforms(
  planeWidth: number,
  planeHeight: number,
): MediaFitUniforms {
  const [r, g, b] = DEFAULT_LETTERBOX
  return {
    uPlaneAspect: { value: planeWidth / planeHeight },
    uTexAspect: { value: 1 },
    uMediaFitCover: { value: CARD_MEDIA_FIT === 'cover' ? 1 : 0 },
    uLetterboxColor: { value: new THREE.Vector3(r, g, b) },
  }
}

export function getTextureAspect(texture: THREE.Texture): number | null {
  const source = texture.image as
    | HTMLImageElement
    | HTMLVideoElement
    | { width?: number; height?: number }
    | undefined

  if (!source) return null

  const width =
    'videoWidth' in source
      ? source.videoWidth
      : 'naturalWidth' in source
        ? source.naturalWidth
        : source.width
  const height =
    'videoHeight' in source
      ? source.videoHeight
      : 'naturalHeight' in source
        ? source.naturalHeight
        : source.height

  if (!width || !height) return null
  return width / height
}

export function syncMediaFitUniforms(
  uniforms: MediaFitUniforms,
  texture: THREE.Texture,
  planeWidth: number,
  planeHeight: number,
) {
  uniforms.uPlaneAspect.value = planeWidth / planeHeight
  uniforms.uMediaFitCover.value = CARD_MEDIA_FIT === 'cover' ? 1 : 0
  const aspect = getTextureAspect(texture)
  if (aspect) uniforms.uTexAspect.value = aspect
}

export function configureTextureSampling(texture: THREE.Texture) {
  texture.wrapS = THREE.ClampToEdgeWrapping
  texture.wrapT = THREE.ClampToEdgeWrapping
  texture.center.set(0.5, 0.5)
  texture.repeat.set(1, 1)
  texture.offset.set(0, 0)
}

/** GLSL — object-fit cover / contain (carte UV → texture UV) */
export const MEDIA_FIT_GLSL = `
vec2 cardObjectFitContain( vec2 uv, float planeAspect, float texAspect ) {
  vec2 scale = vec2( 1.0 );
  vec2 offset = vec2( 0.0 );

  if ( planeAspect > texAspect ) {
    scale.x = texAspect / planeAspect;
    offset.x = ( 1.0 - scale.x ) * 0.5;
  } else {
    scale.y = planeAspect / texAspect;
    offset.y = ( 1.0 - scale.y ) * 0.5;
  }

  return ( uv - offset ) / scale;
}

vec2 cardObjectFitCover( vec2 uv, float planeAspect, float texAspect ) {
  vec2 scale = vec2( 1.0 );
  vec2 offset = vec2( 0.0 );

  if ( planeAspect > texAspect ) {
    scale.y = planeAspect / texAspect;
    offset.y = ( 1.0 - scale.y ) * 0.5;
  } else {
    scale.x = texAspect / planeAspect;
    offset.x = ( 1.0 - scale.x ) * 0.5;
  }

  return ( uv - offset ) / scale;
}

vec2 cardMediaUv( vec2 uv, float planeAspect, float texAspect, float useCover ) {
  if ( useCover > 0.5 ) {
    return clamp( cardObjectFitCover( uv, planeAspect, texAspect ), 0.0, 1.0 );
  }
  return cardObjectFitContain( uv, planeAspect, texAspect );
}

bool cardMediaUvInBounds( vec2 mediaUv ) {
  return mediaUv.x >= 0.0 && mediaUv.x <= 1.0 && mediaUv.y >= 0.0 && mediaUv.y <= 1.0;
}
`
