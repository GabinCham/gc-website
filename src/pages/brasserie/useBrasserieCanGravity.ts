import { useFrame, useThree, type ThreeEvent } from '@react-three/fiber'
import { useCallback, useRef, type RefObject } from 'react'
import * as THREE from 'three'

const GRAVITY_ON = 0.96
const GRAVITY_OFF = 0.88
const GRAVITY_ACCEL = 14
const DRAG = 0.985
const BOUNCE = 0.38
const FLOOR_PADDING = 0.04
const FLING_SCALE = 0.85
const SCREEN_MARGIN = 0.92

type GravityState = {
  active: boolean
  x: number
  y: number
  vx: number
  vy: number
  floorY: number
  dragging: boolean
  pointerId: number
  lastClientX: number
  lastClientY: number
}

function createGravityState(): GravityState {
  return {
    active: false,
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    floorY: -2,
    dragging: false,
    pointerId: -1,
    lastClientX: 0,
    lastClientY: 0,
  }
}

function screenDeltaToWorld(
  camera: THREE.PerspectiveCamera,
  size: { width: number; height: number },
  deltaX: number,
  deltaY: number,
  out: THREE.Vector3,
) {
  const distance = camera.position.length()
  const worldPerPixel =
    (2 * Math.tan((camera.fov * Math.PI) / 360) * distance) /
    Math.max(size.height, 1)
  out.set(deltaX * worldPerPixel, -deltaY * worldPerPixel, 0)
  return out
}

function computeFloorY(camera: THREE.Camera, canRadius: number): number {
  if (!(camera instanceof THREE.PerspectiveCamera)) return -2

  const raycaster = new THREE.Raycaster()
  raycaster.setFromCamera(new THREE.Vector2(0, -1), camera)

  const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0)
  const hit = new THREE.Vector3()
  if (!raycaster.ray.intersectPlane(plane, hit)) return -2

  return hit.y + canRadius + FLOOR_PADDING
}

const worldPos = new THREE.Vector3()
const correction = new THREE.Vector3()

function clampGroupToViewport(
  group: THREE.Group,
  camera: THREE.Camera,
  size: { width: number; height: number },
  radius: number,
) {
  if (!(camera instanceof THREE.PerspectiveCamera)) return

  group.getWorldPosition(worldPos)
  const projected = worldPos.clone().project(camera)

  const px = (projected.x * 0.5 + 0.5) * size.width
  const py = (-projected.y * 0.5 + 0.5) * size.height

  const distance = camera.position.distanceTo(worldPos)
  const vFov = (camera.fov * Math.PI) / 180
  const worldPerPixel =
    (2 * Math.tan(vFov / 2) * distance) / Math.max(size.height, 1)
  const marginPx = (radius / worldPerPixel) * SCREEN_MARGIN

  let shiftX = 0
  let shiftY = 0

  if (px < marginPx) shiftX = px - marginPx
  if (px > size.width - marginPx) shiftX = px - (size.width - marginPx)
  if (py < marginPx) shiftY = py - marginPx
  if (py > size.height - marginPx) shiftY = py - (size.height - marginPx)

  if (shiftX === 0 && shiftY === 0) return

  screenDeltaToWorld(camera, size, shiftX, -shiftY, correction)
  group.position.x += correction.x
  group.position.y += correction.y
}

type UseBrasserieCanGravityOptions = {
  scrollProgressRef: RefObject<number>
  gravityGroupRef: RefObject<THREE.Group | null>
  canRadiusRef: RefObject<number>
  onGravityModeChange?: (active: boolean) => void
}

export function useBrasserieCanGravity({
  scrollProgressRef,
  gravityGroupRef,
  canRadiusRef,
  onGravityModeChange,
}: UseBrasserieCanGravityOptions) {
  const { camera, size, gl } = useThree()
  const stateRef = useRef<GravityState>(createGravityState())
  const lastGravityActiveRef = useRef(false)
  const deltaWorldRef = useRef(new THREE.Vector3())
  const lastMoveTimeRef = useRef(0)

  useFrame((_, delta) => {
    const group = gravityGroupRef.current
    if (!group) return

    const progress = scrollProgressRef.current ?? 0
    const state = stateRef.current
    const dt = Math.min(delta, 0.05)

    if (!state.active && progress >= GRAVITY_ON) {
      state.active = true
      state.vy = 0
    } else if (state.active && progress < GRAVITY_OFF) {
      state.active = false
      state.dragging = false
      state.vx = 0
      state.vy = 0
    }

    if (state.active !== lastGravityActiveRef.current) {
      lastGravityActiveRef.current = state.active
      onGravityModeChange?.(state.active)
    }

    if (!state.active) {
      state.x = THREE.MathUtils.lerp(state.x, 0, 1 - Math.exp(-12 * dt))
      state.y = THREE.MathUtils.lerp(state.y, 0, 1 - Math.exp(-12 * dt))
      if (Math.abs(state.x) < 0.001) state.x = 0
      if (Math.abs(state.y) < 0.001) state.y = 0
      group.position.set(state.x, state.y, 0)
      return
    }

    state.floorY = computeFloorY(camera, canRadiusRef.current)

    if (!state.dragging) {
      state.vy -= GRAVITY_ACCEL * dt
      state.vx *= DRAG
      state.vy *= DRAG
      state.x += state.vx * dt
      state.y += state.vy * dt

      if (state.y < state.floorY) {
        state.y = state.floorY
        if (Math.abs(state.vy) > 0.35) {
          state.vy = -state.vy * BOUNCE
        } else {
          state.vy = 0
        }
      }
    }

    group.position.set(state.x, state.y, 0)
    clampGroupToViewport(group, camera, size, canRadiusRef.current)

    state.x = group.position.x
    state.y = group.position.y
  })

  const onPointerDown = useCallback(
    (event: ThreeEvent<PointerEvent>) => {
      const state = stateRef.current
      if (!state.active) return

      event.stopPropagation()
      state.dragging = true
      state.pointerId = event.pointerId
      state.lastClientX = event.clientX
      state.lastClientY = event.clientY
      state.vx = 0
      state.vy = 0
      lastMoveTimeRef.current = performance.now()
      gl.domElement.setPointerCapture(event.pointerId)
    },
    [gl],
  )

  const onPointerMove = useCallback(
    (event: ThreeEvent<PointerEvent>) => {
      const state = stateRef.current
      const group = gravityGroupRef.current
      if (
        !state.active ||
        !state.dragging ||
        !group ||
        event.pointerId !== state.pointerId
      ) {
        return
      }

      event.stopPropagation()
      const deltaX = event.clientX - state.lastClientX
      const deltaY = event.clientY - state.lastClientY
      state.lastClientX = event.clientX
      state.lastClientY = event.clientY

      if (!(camera instanceof THREE.PerspectiveCamera)) return

      const worldDelta = screenDeltaToWorld(
        camera,
        size,
        deltaX,
        deltaY,
        deltaWorldRef.current,
      )

      state.x += worldDelta.x
      state.y += worldDelta.y
      group.position.set(state.x, state.y, 0)
      clampGroupToViewport(group, camera, size, canRadiusRef.current)
      state.x = group.position.x
      state.y = group.position.y

      const now = performance.now()
      const dt = Math.max((now - lastMoveTimeRef.current) / 1000, 0.008)
      lastMoveTimeRef.current = now
      state.vx = (worldDelta.x / dt) * FLING_SCALE
      state.vy = (worldDelta.y / dt) * FLING_SCALE
    },
    [camera, canRadiusRef, gravityGroupRef, size],
  )

  const onPointerUp = useCallback(
    (event: ThreeEvent<PointerEvent>) => {
      const state = stateRef.current
      if (!state.active || event.pointerId !== state.pointerId) return

      event.stopPropagation()
      state.dragging = false
      state.pointerId = -1
      gl.domElement.releasePointerCapture(event.pointerId)
    },
    [gl],
  )

  return {
    onPointerDown,
    onPointerMove,
    onPointerUp,
  }
}
