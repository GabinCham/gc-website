import { useLoader, useThree } from '@react-three/fiber'
import { useLayoutEffect } from 'react'
import * as THREE from 'three'
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js'
import { QDN10_HDR_URL } from './content'

export function Qdn10Environment() {
  const texture = useLoader(RGBELoader, QDN10_HDR_URL)
  const { gl, scene } = useThree()

  useLayoutEffect(() => {
    texture.mapping = THREE.EquirectangularReflectionMapping

    const pmremGenerator = new THREE.PMREMGenerator(gl)
    pmremGenerator.compileEquirectangularShader()

    const { texture: envMap } = pmremGenerator.fromEquirectangular(texture)
    scene.environment = envMap

    return () => {
      scene.environment = null
      envMap.dispose()
      pmremGenerator.dispose()
    }
  }, [gl, scene, texture])

  return null
}

Qdn10Environment.preload = () => {
  useLoader.preload(RGBELoader, QDN10_HDR_URL)
}
