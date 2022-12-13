import * as THREE from "three"

export const ImageLoadingMode = {
  Image,
  Array,
}

export class ImageLoaderQueue extends THREE.EventDispatcher {
  private loader: THREE.TextureLoader | null = null

  constructor(
    private images: string[],
    private basePath: string = "assets/map/"
  ) {
    super()
    this.images = images
    this.loader = new THREE.TextureLoader()
    this.#startLoading()
  }

  async #startLoading() {

    for (let image of this.images) {
      const file = this.basePath + "map top down-" + image + ".png"

      // Wait for promise to resolve before making another request for image
      // Sequential loading of image rather than parallel
      await new Promise((resolve, _reject) => {
        this.loader?.load(file, (texture) => {
          resolve({ file: image, texture })
        })
      }).then((result: any) => {
        this.dispatchEvent({
          type: "loaded",
          file: result.file,
          texture: result.texture,
        });
      });
    }

    this.dispatchEvent({
      type: "done",
    });
  }
}
