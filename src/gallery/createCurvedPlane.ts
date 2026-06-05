import * as THREE from 'three'

export function createCurvedPlaneGeometry(
  width: number,
  height: number,
  bendRadius: number,
  widthSegments = 28,
) {
  const geometry = new THREE.PlaneGeometry(width, height, widthSegments, 1)
  updateCurvedPlaneGeometry(geometry, bendRadius)
  return geometry
}

export function updateCurvedPlaneGeometry(
  geometry: THREE.BufferGeometry,
  bendRadius: number,
) {
  const position = geometry.attributes.position

  for (let i = 0; i < position.count; i++) {
    const x = position.getX(i)
    const y = position.getY(i)
    const theta = x / bendRadius
    const xBent = bendRadius * Math.sin(theta)
    // Courbure vers l’intérieur (axe de la spirale), pas vers l’extérieur
    const zBent = bendRadius * (Math.cos(theta) - 1)
    position.setXYZ(i, xBent, y, zBent)
  }

  position.needsUpdate = true
  geometry.computeVertexNormals()
}
