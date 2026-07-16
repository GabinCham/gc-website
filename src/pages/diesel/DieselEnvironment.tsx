import { useLoader, useThree } from '@react-three/fiber'
import { useLayoutEffect } from 'react'
import * as THREE from 'three'
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js'
import { DIESEL_HDR_URL } from './content'

export function DieselEnvironment() {
  const texture = useLoader(RGBELoader, DIESEL_HDR_URL)
  const { gl, scene } = useThree()

  useLayoutEffect(() => {
    texture.mapping = THREE.EquirectangularReflectionMapping

    const pmremGenerator = new THREE.PMREMGenerator(gl)
    pmremGenerator.compileEquirectangularShader()

    const { texture: envMap } = pmremGenerator.fromEquirectangular(texture)
    scene.environment = envMap
    scene.background = texture

    return () => {
      scene.environment = null
      scene.background = null
      envMap.dispose()
      pmremGenerator.dispose()
    }
  }, [gl, scene, texture])

  return null
}

DieselEnvironment.preload = () => {
  useLoader.preload(RGBELoader, DIESEL_HDR_URL)
}
