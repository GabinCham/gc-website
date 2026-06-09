import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js'

/** GLTFLoader avec décodeur Meshopt (GLB compressés via gltf-transform). */
export class GalleryGLTFLoader extends GLTFLoader {
  constructor() {
    super()
    this.setMeshoptDecoder(MeshoptDecoder)
  }
}
