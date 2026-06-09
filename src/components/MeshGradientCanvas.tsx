import { useEffect, useRef } from 'react'
import type { GalleryBackgroundColors } from '../gallery/images'
import { hexToRgb, type Rgb } from '../utils/color'

const VERTEX_SHADER = `#version 300 es
in vec2 aPosition;
void main() {
  gl_Position = vec4(aPosition, 0.0, 1.0);
}
`

const FRAGMENT_SHADER = `#version 300 es
precision highp float;

uniform vec2 uResolution;
uniform float uTime;
uniform vec3 uAccent;
uniform vec3 uGlow;
uniform vec3 uBase;
uniform vec3 uDeep;

out vec4 outColor;

vec3 boostSat(vec3 c, float sat) {
  float l = dot(c, vec3(0.2126, 0.7152, 0.0722));
  return mix(vec3(l), c, sat);
}

vec2 warp(vec2 p, float t) {
  p += vec2(
    sin(p.y * 1.55 + t * 0.42) * 0.16,
    cos(p.x * 1.85 - t * 0.36) * 0.13
  );
  p += vec2(
    cos(p.y * 2.6 - t * 0.22) * 0.08,
    sin(p.x * 1.15 + t * 0.48) * 0.10
  );
  return p;
}

float ellipse(vec2 p, vec2 c, vec2 r) {
  vec2 d = (p - c) / r;
  return exp(-dot(d, d) * 0.72);
}

float waveBand(vec2 p, float t, float yOff, float freq, float amp) {
  float y = yOff
    + sin(p.x * freq + t * 0.52) * amp
    + cos(p.x * freq * 0.55 - t * 0.38) * amp * 0.65;
  float d = p.y - y;
  return exp(-d * d * 22.0);
}

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

float filmGrain(vec2 uv, float t) {
  float g1 = hash(floor(uv) + fract(t * 0.013));
  float g2 = hash(floor(uv * 1.7) + fract(t * 0.019));
  return g1 * 0.55 + g2 * 0.45;
}

void main() {
  vec2 uv = gl_FragCoord.xy / uResolution;
  float aspect = uResolution.x / uResolution.y;
  uv.x *= aspect;

  float t = uTime * 0.28;

  vec3 warm = boostSat(uAccent, 1.45);
  vec3 cool = boostSat(uGlow, 1.25);
  vec3 navy = boostSat(uBase, 0.85) * 0.55;
  vec3 black = uDeep * 0.02;

  vec3 col = black;
  vec2 p = warp(uv, t);

  float waveCore = waveBand(p, t, 0.40, 2.6, 0.11);
  float waveTail = waveBand(p, t + 1.8, 0.50, 2.0, 0.09);

  float warmField = ellipse(
    p,
    vec2(0.50 + sin(t * 0.24) * 0.11, 0.34 + cos(t * 0.20) * 0.08),
    vec2(0.88, 0.38)
  );
  warmField = max(warmField, waveCore * 0.95);
  warmField = max(warmField, waveTail * 0.62);

  float coolField = ellipse(
    p,
    vec2(0.10 + cos(t * 0.30) * 0.07, 0.50 + sin(t * 0.26) * 0.11),
    vec2(0.26, 0.58)
  );
  coolField += ellipse(
    p,
    vec2(0.24 + sin(t * 0.22) * 0.09, 0.64 + cos(t * 0.31) * 0.07),
    vec2(0.36, 0.32)
  ) * 0.55;

  float navyField = ellipse(
    p,
    vec2(0.36 + sin(t * 0.17) * 0.09, 0.84 + cos(t * 0.19) * 0.05),
    vec2(0.78, 0.36)
  );

  float darkRight = ellipse(
    p,
    vec2(1.06 - cos(t * 0.14) * 0.05, 0.38 + sin(t * 0.11) * 0.07),
    vec2(0.48, 0.72)
  );
  float darkTop = ellipse(p, vec2(0.72, 0.98), vec2(0.58, 0.22));

  col = mix(col, warm, clamp(warmField * 1.08, 0.0, 1.0));
  col = mix(col, cool, clamp(coolField * 0.78, 0.0, 1.0));
  col = mix(col, navy, clamp(navyField * 0.68, 0.0, 1.0));
  col = mix(col, black, clamp(darkRight * 0.94, 0.0, 1.0));
  col = mix(col, black, clamp(darkTop * 0.55, 0.0, 1.0));

  float grain = filmGrain(gl_FragCoord.xy, t);
  col += (grain - 0.5) * 0.16;

  col = pow(max(col, vec3(0.0)), vec3(0.92));

  outColor = vec4(clamp(col, 0.0, 1.0), 1.0);
}
`

type ShaderColors = {
  accent: Rgb
  glow: Rgb
  base: Rgb
  deep: Rgb
}

function resolveColors(colors: GalleryBackgroundColors): ShaderColors {
  return {
    accent: hexToRgb(colors.accent),
    glow: hexToRgb(colors.glow ?? colors.accent),
    base: hexToRgb(colors.base),
    deep: hexToRgb(colors.deep ?? colors.base),
  }
}

function compileShader(
  gl: WebGL2RenderingContext,
  type: number,
  source: string,
): WebGLShader {
  const shader = gl.createShader(type)
  if (!shader) throw new Error('Impossible de créer le shader')

  gl.shaderSource(shader, source)
  gl.compileShader(shader)

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const log = gl.getShaderInfoLog(shader) ?? 'Erreur inconnue'
    gl.deleteShader(shader)
    throw new Error(log)
  }

  return shader
}

function createProgram(gl: WebGL2RenderingContext): WebGLProgram {
  const program = gl.createProgram()
  if (!program) throw new Error('Impossible de créer le programme')

  const vertex = compileShader(gl, gl.VERTEX_SHADER, VERTEX_SHADER)
  const fragment = compileShader(gl, gl.FRAGMENT_SHADER, FRAGMENT_SHADER)

  gl.attachShader(program, vertex)
  gl.attachShader(program, fragment)
  gl.linkProgram(program)
  gl.deleteShader(vertex)
  gl.deleteShader(fragment)

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const log = gl.getProgramInfoLog(program) ?? 'Erreur inconnue'
    gl.deleteProgram(program)
    throw new Error(log)
  }

  return program
}

type MeshGradientCanvasProps = {
  colors: GalleryBackgroundColors
  /** Mobile : DPR bas, shader moins souvent recalculé. */
  reduced?: boolean
}

export function MeshGradientCanvas({
  colors,
  reduced = false,
}: MeshGradientCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const colorsRef = useRef(resolveColors(colors))

  useEffect(() => {
    colorsRef.current = resolveColors(colors)
  }, [colors])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const gl = canvas.getContext('webgl2', {
      alpha: false,
      antialias: false,
      depth: false,
      stencil: false,
      powerPreference: 'high-performance',
    })

    if (!gl) return

    let program: WebGLProgram
    try {
      program = createProgram(gl)
    } catch {
      return
    }

    const positionLoc = gl.getAttribLocation(program, 'aPosition')
    const resolutionLoc = gl.getUniformLocation(program, 'uResolution')
    const timeLoc = gl.getUniformLocation(program, 'uTime')
    const accentLoc = gl.getUniformLocation(program, 'uAccent')
    const glowLoc = gl.getUniformLocation(program, 'uGlow')
    const baseLoc = gl.getUniformLocation(program, 'uBase')
    const deepLoc = gl.getUniformLocation(program, 'uDeep')

    const buffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]),
      gl.STATIC_DRAW,
    )

    gl.useProgram(program)
    gl.enableVertexAttribArray(positionLoc)
    gl.vertexAttribPointer(positionLoc, 2, gl.FLOAT, false, 0, 0)

    let width = 0
    let height = 0
    let frameId = 0
    let start = performance.now()
    let visible = !document.hidden
    let reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    const maxDpr = reduced ? 1 : 1.5
    let frameSkip = 0

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, maxDpr)
      width = Math.max(1, Math.floor(canvas.clientWidth * dpr))
      height = Math.max(1, Math.floor(canvas.clientHeight * dpr))

      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width
        canvas.height = height
      }

      gl.viewport(0, 0, width, height)
    }

    const render = (now: number) => {
      frameId = requestAnimationFrame(render)
      if (!visible) return

      if (reduced) {
        frameSkip += 1
        if (frameSkip % 2 !== 0) return
      }

      const { accent, glow, base, deep } = colorsRef.current
      const elapsed = reducedMotion ? 0 : (now - start) * 0.001

      gl.uniform2f(resolutionLoc, width, height)
      gl.uniform1f(timeLoc, elapsed)
      gl.uniform3f(accentLoc, accent[0], accent[1], accent[2])
      gl.uniform3f(glowLoc, glow[0], glow[1], glow[2])
      gl.uniform3f(baseLoc, base[0], base[1], base[2])
      gl.uniform3f(deepLoc, deep[0], deep[1], deep[2])
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
    }

    const onVisibility = () => {
      visible = !document.hidden
      if (visible) start = performance.now()
    }

    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    const onMotionChange = (event: MediaQueryListEvent) => {
      reducedMotion = event.matches
    }

    resize()
    frameId = requestAnimationFrame(render)

    const resizeObserver = new ResizeObserver(resize)
    resizeObserver.observe(canvas)
    document.addEventListener('visibilitychange', onVisibility)
    motionQuery.addEventListener('change', onMotionChange)

    return () => {
      cancelAnimationFrame(frameId)
      resizeObserver.disconnect()
      document.removeEventListener('visibilitychange', onVisibility)
      motionQuery.removeEventListener('change', onMotionChange)
      gl.deleteBuffer(buffer)
      gl.deleteProgram(program)
    }
  }, [reduced])

  return (
    <canvas
      ref={canvasRef}
      className="mesh-gradient__canvas"
      aria-hidden
    />
  )
}
